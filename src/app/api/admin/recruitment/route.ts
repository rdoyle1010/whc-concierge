import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'

const STATUSES = ['new', 'reviewing', 'search_active', 'shortlist_sent', 'placed', 'closed'] as const

const STATUS_MESSAGES: Record<string, { title: string; body: (jobTitle: string) => string }> = {
  reviewing: { title: 'Your search brief is being reviewed', body: t => `WHC is reviewing your brief for ${t} and will come back to you shortly.` },
  search_active: { title: 'Your search is underway', body: t => `WHC is actively searching the register for ${t}. You will hear from us as the shortlist takes shape.` },
  shortlist_sent: { title: 'Your shortlist is ready', body: t => `WHC has sent you a shortlist for ${t}. We will talk you through each candidate.` },
  placed: { title: 'Placement complete', body: t => `Congratulations - your ${t} search has completed with a successful placement.` },
  closed: { title: 'Search closed', body: t => `Your search for ${t} has been closed. Thank you for working with WHC - start another any time.` },
}

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
  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data: rows, error } = await admin.from('recruitment_requests')
    .select('*').order('created_at', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const employerIds = Array.from(new Set((rows || []).map(row => row.employer_id)))
  let employers: Record<string, any> = {}
  if (employerIds.length) {
    const { data } = await admin.from('employer_profiles').select('id,company_name,property_name,contact_email,contact_phone').in('id', employerIds)
    employers = Object.fromEntries((data || []).map(e => [e.id, e]))
  }
  return NextResponse.json({ rows: (rows || []).map(row => ({ ...row, employer: employers[row.employer_id] || null })) })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    const body = await req.json()
    const id = String(body.id || '')
    const status = String(body.status || '')
    const adminNotes = body.adminNotes !== undefined ? String(body.adminNotes).slice(0, 4000) : undefined
    if (!id) return NextResponse.json({ error: 'Request is required.' }, { status: 400 })
    if (status && !STATUSES.includes(status as any)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: row } = await admin.from('recruitment_requests').select('id,employer_id,job_title,status').eq('id', id).maybeSingle()
    if (!row) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })

    const update: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status) update.status = status
    if (adminNotes !== undefined) update.admin_notes = adminNotes || null
    const { error } = await admin.from('recruitment_requests').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: 'Could not save.' }, { status: 500 })

    // Status changes tell the employer where their search stands.
    if (status && status !== row.status && STATUS_MESSAGES[status]) {
      const { data: employer } = await admin.from('employer_profiles').select('user_id').eq('id', row.employer_id).maybeSingle()
      if (employer?.user_id) {
        const msg = STATUS_MESSAGES[status]
        await createNotification(employer.user_id, 'general', msg.title, msg.body(row.job_title), '/employer/recruitment').catch?.(() => {})
      }
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Could not save.' }, { status: 500 })
  }
}
