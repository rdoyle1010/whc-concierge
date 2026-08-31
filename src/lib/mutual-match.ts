import { createNotification } from '@/lib/notifications'
import { sendNewMatchEmail } from '@/lib/emails'
import { emailAllowed } from '@/lib/notification-prefs'

// Shared by the web swipe route and the mobile employer-matches route so a
// mutual match behaves identically wherever it happens: one matches row,
// messaging unlocked, both sides notified and emailed.
export async function createMutualMatch(admin: any, opts: {
  candidate: any
  employer: any
  job: any
  score: number
  candidateUserId: string
  employerUserId: string
  candidateEmail?: string | null
  employerEmail?: string | null
}) {
  const { candidate, employer, job, score, candidateUserId, employerUserId } = opts
  const { data: existing } = await admin.from('matches').select('id')
    .eq('candidate_id', candidate.id)
    .eq('employer_id', employer.id)
    .eq('job_listing_id', job.id)
    .maybeSingle()

  if (existing) return { created: false, matchId: existing.id }

  const now = new Date().toISOString()
  const { data: match, error } = await admin.from('matches').insert({
    candidate_id: candidate.id,
    employer_id: employer.id,
    job_listing_id: job.id,
    // The live matches table only has match_score.
    match_score: score,
    candidate_swiped_at: now,
    employer_swiped_at: now,
    matched_at: now,
    status: 'active',
    messaging_unlocked: true,
  }).select('id').single()
  if (error) throw error

  const employerName = employer.property_name || employer.company_name || 'the employer'
  const candidateName = candidate.full_name || 'A candidate'
  await Promise.allSettled([
    admin.from('messages').insert({
      sender_id: employerUserId,
      recipient_id: candidateUserId,
      content: `It's a match! You both said yes to ${job.job_title} at ${employerName}. Say hello and take it from here.`,
      read: false,
    }),
    createNotification(candidateUserId, 'new_match', "It's a match!", `${employerName} wants to talk about ${job.job_title}.`, '/talent/messages'),
    createNotification(employerUserId, 'new_match', "It's a match!", `${candidateName} is interested in ${job.job_title}.`, '/employer/messages'),
  ])

  // Preference-gated ('job_alerts'): the new-match email is a matching alert,
  // so each side's job_alerts_email opt-out is honoured. The in-app
  // notifications above always fire. Fail-open on lookup errors.
  const [candidateWantsEmail, employerWantsEmail] = await Promise.all([
    emailAllowed(admin, candidateUserId, 'job_alerts'),
    emailAllowed(admin, employerUserId, 'job_alerts'),
  ])
  await Promise.allSettled([
    opts.candidateEmail && candidateWantsEmail ? sendNewMatchEmail(opts.candidateEmail, candidate.full_name || 'there', employerName) : Promise.resolve(),
    opts.employerEmail && employerWantsEmail ? sendNewMatchEmail(opts.employerEmail, employerName, candidateName) : Promise.resolve(),
  ])

  return { created: true, matchId: match.id }
}
