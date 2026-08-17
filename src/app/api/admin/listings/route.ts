import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/emails'

const DEFAULT_LIMIT = 250
const MAX_LIMIT = 500

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

export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const kind = req.nextUrl.searchParams.get('kind')
  const requestedLimit = Number(req.nextUrl.searchParams.get('limit'))
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(Math.floor(requestedLimit), MAX_LIMIT)
    : DEFAULT_LIMIT
  const admin = createAdminClient()

  try {
    if (kind === 'residency') {
      const { data } = await admin.from('residency_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      return NextResponse.json({ rows: data || [], pagination: { limit, returned: data?.length || 0, capped: (data?.length || 0) >= limit } })
    }

    if (kind === 'jobs') {
      const { data: jobs, error: jobsError } = await admin.from('job_listings')
        .select('id,job_title,employer_id,tier,posted_date,expires_at,is_live,status')
        .order('posted_date', { ascending: false })
        .limit(limit)
      if (jobsError) return NextResponse.json({ error: jobsError.message }, { status: 500 })

      const empIds = Array.from(new Set((jobs || []).map((j: any) => j.employer_id).filter(Boolean)))
      const { data: emps, error: empsError } = empIds.length
        ? await admin.from('employer_profiles').select('id, company_name, property_name').in('id', empIds)
        : { data: [] as any[], error: null }
      if (empsError) return NextResponse.json({ error: empsError.message }, { status: 500 })

      const empMap = new Map((emps || []).map((e: any) => [e.id, e]))
      return NextResponse.json({
        rows: (jobs || []).map((j: any) => ({
          ...j,
          title: j.job_title,
          employer_name: empMap.get(j.employer_id)?.property_name || empMap.get(j.employer_id)?.company_name || 'Employer',
        })),
        pagination: { limit, returned: jobs?.length || 0, capped: (jobs?.length || 0) >= limit },
      })
    }

    return NextResponse.json({ error: 'Unknown kind' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  try {
    const body = await req.json()
    const { action, id } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    if (action === 'residency_decision') {
      const decision = body.decision === 'approved' ? 'approved' : 'rejected'
      const { data: row, error } = await admin.from('residency_profiles')
        .update({ approval_status: decision })
        .eq('id', id)
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      try {
        if (row?.user_id) {
          await createNotification(row.user_id, 'general',
            decision === 'approved' ? 'Your residency listing is live' : 'Your residency listing needs attention',
            decision === 'approved'
              ? `Your residency listing "${row.primary_specialism || ''}" has been approved and is now live.`
              : `Your residency listing was not approved${body.reason ? `: ${body.reason}` : ''}. Update it and resubmit.`,
            '/residency')
          const { data: authUser } = await admin.auth.admin.getUserById(row.user_id)
          const email = authUser?.user?.email
          if (email) {
            if (decision === 'approved') await sendApprovalEmail(email, row.full_name || 'there')
            else await sendRejectionEmail(email, row.full_name || 'there', body.reason || 'Please review your listing details and resubmit.')
          }
        }
      } catch (e: any) { console.error('Residency decision notify failed:', e?.message) }

      return NextResponse.json({ success: true })
    }

    if (action === 'job_toggle_live') {
      const { data: job } = await admin.from('job_listings').select('id, is_live').eq('id', id).maybeSingle()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      const next = !job.is_live
      const { error } = await admin.from('job_listings')
        .update({ is_live: next, status: next ? 'active' : 'paused' })
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, is_live: next })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
