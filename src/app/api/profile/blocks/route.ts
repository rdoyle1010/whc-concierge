import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Stealth-mode employer blocking, service-role backed (profile_blocks is
// RLS-locked - the old client-side writes silently failed, meaning blocked
// employers could still see the candidate).

async function getAuthed() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await getAuthed()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const [{ data: cand }, { data: emp }] = await Promise.all([
    admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  // Candidate: their own block list, enriched with employer names
  if (cand) {
    const { data: blocks } = await admin.from('profile_blocks').select('*').eq('candidate_id', cand.id)
    const empIds = (blocks || []).map((b: any) => b.blocked_employer_id).filter(Boolean)
    const { data: emps } = empIds.length
      ? await admin.from('employer_profiles').select('id, company_name, property_name').in('id', empIds)
      : { data: [] as any[] }
    const empMap = new Map((emps || []).map((e: any) => [e.id, e]))
    return NextResponse.json({
      blocks: (blocks || []).map((b: any) => ({
        ...b,
        employer_name: empMap.get(b.blocked_employer_id)?.property_name || empMap.get(b.blocked_employer_id)?.company_name || 'Employer',
      })),
    })
  }

  // Employer: just the candidate_ids who have blocked them (for filtering)
  if (emp) {
    const { data: blocks } = await admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', emp.id)
    return NextResponse.json({ blocked_candidate_ids: (blocks || []).map((b: any) => b.candidate_id) })
  }

  return NextResponse.json({ blocks: [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthed()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: cand } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!cand) return NextResponse.json({ error: 'Only candidates can block employers' }, { status: 403 })

  const { employerId, action } = await req.json()
  if (!employerId || !['block', 'unblock'].includes(action)) {
    return NextResponse.json({ error: 'employerId and action (block/unblock) required' }, { status: 400 })
  }

  if (action === 'block') {
    const { error } = await admin.from('profile_blocks').insert({ candidate_id: cand.id, blocked_employer_id: employerId })
    if (error && error.code !== '23505') return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await admin.from('profile_blocks').delete().eq('candidate_id', cand.id).eq('blocked_employer_id', employerId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
