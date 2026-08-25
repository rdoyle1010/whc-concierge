import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

async function currentUser() {
  const store = await cookies()
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return store.getAll() }, setAll() {} },
  })
  return (await client.auth.getUser()).data.user
}

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const admin = createAdminClient()
  const [{ data: candidate }, { data: employer }] = await Promise.all([
    admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle(),
  ])
  let q = admin.from('agency_mutual_blocks').select('*').order('created_at', { ascending: false })
  if (candidate) q = q.eq('candidate_id', candidate.id)
  else if (employer) q = q.eq('employer_id', employer.id)
  else return NextResponse.json({ blocks: [] })
  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'Could not load blocks' }, { status: 500 })
  return NextResponse.json({ blocks: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  if (!['block','unblock'].includes(action)) return NextResponse.json({ error: 'Choose block or unblock' }, { status: 400 })
  const admin = createAdminClient()
  const [{ data: candidate }, { data: employer }] = await Promise.all([
    admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle(),
  ])
  const role = candidate ? 'candidate' : employer ? 'employer' : null
  if (!role) return NextResponse.json({ error: 'Agency profile required' }, { status: 403 })
  const candidateId = role === 'candidate' ? candidate.id : String(body.candidateId || '')
  const employerId = role === 'employer' ? employer.id : String(body.employerId || '')
  if (!candidateId || !employerId) return NextResponse.json({ error: 'Missing other party' }, { status: 400 })

  if (action === 'block') {
    const { error } = await admin.from('agency_mutual_blocks').upsert({
      candidate_id: candidateId,
      employer_id: employerId,
      blocked_by_role: role,
      blocked_by_user_id: user.id,
      reason: String(body.reason || '').trim() || null,
    }, { onConflict: 'candidate_id,employer_id,blocked_by_role' })
    if (error) return NextResponse.json({ error: 'Could not block this account' }, { status: 500 })
  } else {
    const { error } = await admin.from('agency_mutual_blocks').delete()
      .eq('candidate_id', candidateId).eq('employer_id', employerId).eq('blocked_by_role', role)
    if (error) return NextResponse.json({ error: 'Could not remove block' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
