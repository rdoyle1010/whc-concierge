import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET(_req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: matches, error } = await admin
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = matches || []
  const candIds = Array.from(new Set(rows.map(m => m.candidate_id).filter(Boolean)))
  const empIds = Array.from(new Set(rows.map(m => m.employer_id).filter(Boolean)))
  const jobIds = Array.from(new Set(rows.map(m => (m as any).job_listing_id || m.job_id).filter(Boolean)))

  const [cands, emps, jobs] = await Promise.all([
    candIds.length ? admin.from('candidate_profiles').select('id, full_name, headline').in('id', candIds) : Promise.resolve({ data: [] }),
    empIds.length ? admin.from('employer_profiles').select('id, property_name, company_name').in('id', empIds) : Promise.resolve({ data: [] }),
    jobIds.length ? admin.from('job_listings').select('id, job_title').in('id', jobIds) : Promise.resolve({ data: [] }),
  ])

  const candMap = new Map((cands.data || []).map((c: any) => [c.id, c]))
  const empMap = new Map((emps.data || []).map((e: any) => [e.id, e]))
  const jobMap = new Map((jobs.data || []).map((j: any) => [j.id, j]))

  const enriched = rows.map(m => ({
    ...m,
    candidate_profiles: candMap.get(m.candidate_id) || null,
    employer_profiles: (() => {
      const e = empMap.get(m.employer_id) as any
      return e ? { ...e, company_name: e.property_name || e.company_name } : null
    })(),
    job_listings: (() => {
      const j = jobMap.get((m as any).job_listing_id || m.job_id) as any
      return j ? { ...j, title: j.job_title } : null
    })(),
  }))

  return NextResponse.json({ matches: enriched })
}
