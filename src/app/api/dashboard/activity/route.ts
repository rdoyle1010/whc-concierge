import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function activityLink(role: 'talent' | 'employer', item: { title?: string | null; message?: string | null; link?: string | null }) {
  const text = `${item.title || ''} ${item.message || ''}`.toLowerCase()

  // Route activity to the workspace where the user can actually act on it.
  if (text.includes('agency') || text.includes('shift') || text.includes('counter-offer') || text.includes('counter offer')) {
    return role === 'employer' ? '/employer/agency' : '/talent/agency'
  }
  if (text.includes('residency')) {
    return role === 'employer' ? '/employer/residency' : '/talent/residency'
  }
  if (text.includes('message') || text.includes('conversation')) {
    return `/${role}/messages`
  }
  if (text.includes('interview') || text.includes('application') || text.includes('shortlist') || text.includes('job offer')) {
    return `/${role}/applications`
  }
  if (text.includes('hired') || text.includes('placement')) {
    return `/${role}/hired`
  }

  return item.link || `/${role}/dashboard`
}

// Recent activity is recent.
//
// It took the last eight notifications with no age limit, so "URGENT: shift
// offer for TODAY" and "your insurance expires soon" sat on the dashboard
// long after both had been settled, waiting to be pushed off by eight newer
// things. On a quiet account that is never, and the effect is a dashboard
// that looks alarming about events from a fortnight ago.
//
// Fourteen days. Anything older belongs in Notifications, which keeps
// everything, rather than on the screen somebody opens to see what needs
// doing today.
const ACTIVITY_WINDOW_DAYS = 14
const ACTIVITY_SINCE = () => new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

export async function GET(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const role = req.nextUrl.searchParams.get('role')
  if (role !== 'talent' && role !== 'employer') return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })

  const admin = createAdminClient()

  const [{ count: unreadMessages }, { data: notifications }] = await Promise.all([
    admin.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('read', false),
    admin.from('notifications').select('id,type,title,message,link,is_read,created_at').eq('user_id', user.id).gte('created_at', ACTIVITY_SINCE()).order('created_at', { ascending: false }).limit(8),
  ])

  // 'action' is somebody waiting on this person, 'waiting' is in motion,
  // 'done' is a good outcome. The old violet/gold/blue names were decorative
  // and the dashboard ignored them, which is part of why nothing on that
  // screen ever looked urgent.
  const attention: Array<{ label: string; count: number; href: string; tone: 'action' | 'waiting' | 'done' }> = []

  if (role === 'talent') {
    const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (candidate) {
      const { data: apps } = await admin.from('applications').select('id,status,archived_at,hired_at').eq('candidate_id', candidate.id)
      const liveApps = (apps || []).filter(app => !app.archived_at)
      const applicationIds = liveApps.map(app => app.id)
      let interviewCount = 0
      let offerCount = 0
      if (applicationIds.length) {
        const [{ count: interviews }, { count: offers }] = await Promise.all([
          admin.from('application_interviews').select('id', { count: 'exact', head: true }).in('application_id', applicationIds).eq('status', 'proposed'),
          admin.from('application_offers').select('id', { count: 'exact', head: true }).in('application_id', applicationIds).eq('status', 'offered'),
        ])
        interviewCount = interviews || 0
        offerCount = offers || 0
      }
      const hiredCount = (apps || []).filter(app => Boolean(app.archived_at) && Boolean(app.hired_at)).length
      // An Agency offer is the most time-critical thing on this platform - an
      // urgent one expires in four hours - and the attention block had never
      // heard of it. So somebody with a counter-offer waiting was told they
      // were up to date while the row underneath said otherwise.
      // 'pending' means the ball is with the professional; 'countered' hands
      // it back to the property.
      const { count: agencyOffers } = await admin.from('agency_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('candidate_id', candidate.id).eq('status', 'pending')
      if (agencyOffers) attention.push({ label: 'Agency shift offers to answer', count: agencyOffers, href: '/talent/agency', tone: 'action' })
      if (interviewCount) attention.push({ label: 'Interview times to review', count: interviewCount, href: '/talent/applications', tone: 'action' })
      if (offerCount) attention.push({ label: 'Offers awaiting your response', count: offerCount, href: '/talent/applications', tone: 'action' })
      if (hiredCount) attention.push({ label: 'Successful placements', count: hiredCount, href: '/talent/hired', tone: 'done' })
    }
  } else {
    const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (employer) {
      // A professional has countered and is waiting on the property.
      const { count: counteredOffers } = await admin.from('agency_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('employer_id', employer.id).eq('status', 'countered')
      if (counteredOffers) attention.push({ label: 'Counter-offers to answer', count: counteredOffers, href: '/employer/agency', tone: 'action' })

      const { data: jobs } = await admin.from('job_listings').select('id').eq('employer_id', employer.id)
      const jobIds = (jobs || []).map(job => job.id)
      if (jobIds.length) {
        const { data: apps } = await admin.from('applications').select('id,status,archived_at').in('role_id', jobIds)
        const liveApps = (apps || []).filter(app => !app.archived_at)
        const applicationIds = liveApps.map(app => app.id)
        const submittedCount = liveApps.filter(app => ['pending','reviewed','shortlisted'].includes(app.status)).length
        let interviewCount = 0
        let offerCount = 0
        if (applicationIds.length) {
          const [{ count: interviews }, { count: offers }] = await Promise.all([
            admin.from('application_interviews').select('id', { count: 'exact', head: true }).in('application_id', applicationIds).eq('status', 'confirmed'),
            admin.from('application_offers').select('id', { count: 'exact', head: true }).in('application_id', applicationIds).eq('status', 'accepted'),
          ])
          interviewCount = interviews || 0
          offerCount = offers || 0
        }
        const archivedCount = (apps || []).filter(app => Boolean(app.archived_at)).length
        if (submittedCount) attention.push({ label: 'Applications in progress', count: submittedCount, href: '/employer/applications', tone: 'waiting' })
        if (interviewCount) attention.push({ label: 'Confirmed interviews', count: interviewCount, href: '/employer/applications', tone: 'waiting' })
        if (offerCount) attention.push({ label: 'Accepted offers to complete', count: offerCount, href: '/employer/applications', tone: 'action' })
        if (archivedCount) attention.push({ label: 'Hired placements', count: archivedCount, href: '/employer/hired', tone: 'done' })
      }
    }
  }

  const recent = (notifications || []).map(item => ({
    ...item,
    link: activityLink(role, item),
  }))

  return NextResponse.json({
    unreadMessages: unreadMessages || 0,
    unreadNotifications: recent.filter(item => !item.is_read).length,
    attention,
    recent,
  })
}
