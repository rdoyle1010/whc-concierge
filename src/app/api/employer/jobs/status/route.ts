import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRoleFilledEmail } from '@/lib/emails'

export async function POST(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { jobId, action } = await req.json()
  if (!jobId || !['filled', 'closed'].includes(action)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id, property_name, company_name').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })

  const { data: job } = await admin.from('job_listings').select('id, employer_id, job_title').eq('id', jobId).maybeSingle()
  if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = action === 'filled' ? 'filled' : 'closed'
  const { error: updateError } = await admin.from('job_listings').update({ is_live: false, status }).eq('id', jobId)
  if (updateError) return NextResponse.json({ error: 'Could not update role' }, { status: 500 })

  let notified = 0
  if (action === 'filled') {
    const { data: applications } = await admin.from('applications').select('candidate_id').or(`job_id.eq.${jobId},role_id.eq.${jobId}`)
    const candidateIds = Array.from(new Set((applications || []).map((a: any) => a.candidate_id).filter(Boolean))) as string[]
    if (candidateIds.length) {
      const { data: candidates } = await admin.from('candidate_profiles').select('id, user_id, full_name').in('id', candidateIds)
      for (const candidate of candidates || []) {
        if (!candidate.user_id) continue
        const { data: authUser } = await admin.auth.admin.getUserById(candidate.user_id)
        const email = authUser.user?.email
        if (!email) continue
        await sendRoleFilledEmail(email, candidate.full_name || '', job.job_title || 'Role', employer.property_name || employer.company_name || 'the property')
        notified += 1
      }
    }
  }

  return NextResponse.json({ success: true, status, notified })
}
