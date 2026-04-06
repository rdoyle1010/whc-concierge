import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  // Authenticate
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  // Determine role
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role || 'talent'

  const exportData: Record<string, any> = {
    _meta: {
      exportDate: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      role,
      platform: 'WHC Concierge',
      url: 'https://talent.wellnesshousecollective.co.uk',
    },
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    },
  }

  if (role === 'talent' || role === 'admin') {
    // Candidate profile
    const { data: cp } = await admin.from('candidate_profiles').select('*').eq('user_id', user.id).single()
    exportData.candidate_profile = cp || null

    if (cp) {
      // Applications
      const { data: apps } = await admin
        .from('applications')
        .select('*, job_listings(job_title, location, employer_profiles(company_name))')
        .eq('candidate_id', cp.id)
        .order('created_at', { ascending: false })
      exportData.applications = apps || []

      // Saved jobs
      const { data: saved } = await admin
        .from('saved_jobs')
        .select('*, job_listings(job_title, location)')
        .eq('candidate_id', cp.id)
      exportData.saved_jobs = saved || []

      // Profile blocks
      const { data: blocks } = await admin
        .from('profile_blocks')
        .select('*, employer_profiles:blocked_employer_id(company_name)')
        .eq('candidate_id', cp.id)
      exportData.profile_blocks = blocks || []
    }

    // Reviews received
    const { data: reviewsReceived } = await admin.from('reviews').select('*').eq('reviewed_id', user.id).order('created_at', { ascending: false })
    exportData.reviews_received = reviewsReceived || []

    // Reviews given
    const { data: reviewsGiven } = await admin.from('reviews').select('*').eq('reviewer_id', user.id).order('created_at', { ascending: false })
    exportData.reviews_given = reviewsGiven || []
  }

  if (role === 'employer') {
    // Employer profile
    const { data: ep } = await admin.from('employer_profiles').select('*').eq('user_id', user.id).single()
    exportData.employer_profile = ep || null

    if (ep) {
      // Job listings
      const { data: jobs } = await admin.from('job_listings').select('*').eq('employer_id', ep.id).order('created_at', { ascending: false })
      exportData.job_listings = jobs || []

      // Applications received
      const jobIds = (jobs || []).map((j: any) => j.id)
      if (jobIds.length > 0) {
        const { data: apps } = await admin
          .from('applications')
          .select('*, candidate_profiles(full_name, headline)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })
        exportData.applications_received = apps || []
      }

      // Shortlisted candidates
      const { data: shortlisted } = await admin
        .from('shortlisted_candidates')
        .select('*, candidate_profiles(full_name)')
        .eq('employer_id', ep.id)
      exportData.shortlisted_candidates = shortlisted || []
    }

    // Reviews given
    const { data: reviewsGiven } = await admin.from('reviews').select('*').eq('reviewer_id', user.id)
    exportData.reviews_given = reviewsGiven || []
  }

  // Messages (both roles)
  const { data: messagesSent } = await admin.from('messages').select('*').eq('sender_id', user.id).order('created_at', { ascending: false }).limit(500)
  exportData.messages_sent = messagesSent || []

  const { data: messagesReceived } = await admin.from('messages').select('*').eq('receiver_id', user.id).order('created_at', { ascending: false }).limit(500)
  exportData.messages_received = messagesReceived || []

  // Notifications
  const { data: notifications } = await admin.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200)
  exportData.notifications = notifications || []

  const date = new Date().toISOString().split('T')[0]
  const filename = `whc-data-export-${user.id}-${date}.json`

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
