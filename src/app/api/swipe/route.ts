import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { applicantConfirmationHtml, employerNotificationHtml } from '@/lib/application-email-templates'
import { sendNewMatchEmail } from '@/lib/emails'
import { calculateMatchScore } from '@/lib/matching'
import { canEmployerDiscoverCandidate, mutualRadiusResult } from '@/lib/discovery'

// Records a swipe server-side (swipes has unreliable RLS), creates the
// application on a candidate right-swipe, and detects MUTUAL matches:
// candidate right-swiped the job AND its employer right-swiped the candidate.
// On a mutual match a row is written to `matches` and both sides are notified.
//
// The application insert writes BOTH role_id and job_id (live schema and the
// RLS policies disagree on which one is canonical) and strips columns the live
// table doesn't have. If the application cannot be created the route returns
// 500 - the UI must never say "Application sent" when nothing was saved.
// Confirmation emails to the applicant and employer are sent from HERE, so
// every apply path gets them (the job detail page previously sent none).

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[Application email skipped - no API key] To: ${to}, Subject: ${subject}`)
    return
  }
  // Log failures loudly - Resend rejections (bad key, unverified domain)
  // otherwise fail in silence and nobody notices for months.
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error(`[Email FAILED ${res.status}] To: ${to}, Subject: ${subject} - ${detail.slice(0, 300)}`)
  }
}

// The live table may have drifted from migration 004. If an insert fails
// because a column does not exist, strip that key and retry (max 6 strips).
async function insertApplicationDefensively(admin: any, row: Record<string, any>) {
  const attempt: Record<string, any> = { ...row }
  let lastError: any = null
  for (let strips = 0; strips <= 6; strips++) {
    const { data, error } = await admin.from('applications').insert(attempt).select('id').single()
    if (!error) return { data, error: null }
    lastError = error
    const m = /Could not find the '([^']+)' column/.exec(error.message || '')
    if (m && Object.prototype.hasOwnProperty.call(attempt, m[1])) {
      delete attempt[m[1]]
      continue
    }
    break
  }
  return { data: null, error: lastError }
}

// Dedupe across schema drift: the job link column is role_id and/or job_id.
async function findExistingApplication(admin: any, candidateId: string, jobId: string) {
  const byRole = await admin
    .from('applications').select('id')
    .eq('candidate_id', candidateId).eq('role_id', jobId)
    .limit(1).maybeSingle()
  if (!byRole.error && byRole.data) return byRole.data
  const byJob = await admin
    .from('applications').select('id')
    .eq('candidate_id', candidateId).eq('job_id', jobId)
    .limit(1).maybeSingle()
  if (!byJob.error && byJob.data) return byJob.data
  return null
}

type SwipeRow = {
  swiper_id: string
  swiper_type: 'candidate' | 'employer'
  target_id: string
  target_type: 'job' | 'candidate'
  action: 'left' | 'right'
}

// Migration 038 normalises the legacy swipes schema and adds the composite
// unique key used here. An upsert is atomic: a failed write never deletes the
// caller's previous decision, and repeated clicks remain idempotent.
async function replaceSwipe(admin: any, row: SwipeRow) {
  const { data, error } = await admin
    .from('swipes')
    .upsert(row, {
      onConflict: 'swiper_id,swiper_type,target_id,target_type',
      ignoreDuplicates: false,
    })
    .select('action')
    .single()

  return {
    error,
    changed: !error && data?.action === row.action,
  }
}

async function removeSwipe(admin: any, row: Omit<SwipeRow, 'action'>) {
  return admin.from('swipes').delete()
    .eq('swiper_id', row.swiper_id)
    .eq('swiper_type', row.swiper_type)
    .eq('target_id', row.target_id)
    .eq('target_type', row.target_type)
}

// GET: the caller's own left-swipes (employer passing candidates), so Browse
// Candidates can keep passed profiles hidden across visits.
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const admin = createAdminClient()
    const { data } = await admin
      .from('swipes')
      .select('target_id')
      .eq('swiper_id', user.id)
      .eq('swiper_type', 'employer')
      .eq('target_type', 'candidate')
      .eq('action', 'left')
    return NextResponse.json({ passed_ids: Array.from(new Set((data || []).map((r: any) => r.target_id))) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const { targetId, targetType, action } = body as {
      targetId: string
      targetType: 'job' | 'candidate'
      action: 'left' | 'right'
    }
    if (!targetId || (targetType !== 'job' && targetType !== 'candidate') || (action !== 'left' && action !== 'right')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const admin = createAdminClient()

    /* ── Candidate swiping on a job ── */
    if (targetType === 'job') {
      const { data: cand } = await admin
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!cand) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })

      if (action !== 'right') {
        const recorded = await replaceSwipe(admin, {
          swiper_id: user.id, swiper_type: 'candidate', target_id: targetId, target_type: 'job', action,
        })
        if (recorded.error) return NextResponse.json({ error: 'Your decision could not be saved. Please try again.' }, { status: 500 })
        return NextResponse.json({ matched: false })
      }

      const { data: job } = await admin
        .from('job_listings')
        .select('*')
        .eq('id', targetId)
        .maybeSingle()
      if (!job) return NextResponse.json({ matched: false })

      // Never trust a percentage supplied by the browser. The server owns
      // the score recorded against an application and a mutual match.
      const calculatedMatch = calculateMatchScore(cand, job)
      if (calculatedMatch.hardStop) {
        // Remove any older positive swipe, for example when insurance has
        // since expired. A blocked candidate must never remain mutually liked.
        await removeSwipe(admin, {
          swiper_id: user.id, swiper_type: 'candidate', target_id: targetId, target_type: 'job',
        })
        return NextResponse.json(
          { error: calculatedMatch.hardStopReason || 'This role is not compatible with your profile' },
          { status: 400 },
        )
      }
      const serverMatchScore = calculatedMatch.score

      const recorded = await replaceSwipe(admin, {
        swiper_id: user.id, swiper_type: 'candidate', target_id: targetId, target_type: 'job', action: 'right',
      })
      if (recorded.error) return NextResponse.json({ error: 'Your decision could not be saved. Please try again.' }, { status: 500 })

      const { data: employer } = await admin
        .from('employer_profiles')
        .select('*')
        .eq('id', job.employer_id)
        .maybeSingle()
      const employerName = employer?.property_name || employer?.company_name || 'the employer'

      // Create the application (linked by candidate PROFILE id, deduped)
      const existingApp = await findExistingApplication(admin, cand.id, job.id)
      if (!existingApp) {
        const { error: appError } = await insertApplicationDefensively(admin, {
          candidate_id: cand.id,
          role_id: job.id,
          job_id: job.id, // 022 RLS keys employer visibility on job_id - set both
          status: 'pending',
          match_score: serverMatchScore,
        })
        if (appError) {
          // Do NOT pretend the application was sent
          console.error('Application insert failed:', appError.message)
          return NextResponse.json(
            { error: 'Your application could not be saved. Please try again.' },
            { status: 500 }
          )
        }

        // In-app notification to the employer (new applications only)
        if (employer?.user_id) {
          await createNotification(employer.user_id, 'job_application', 'New application received',
            `A candidate has applied for ${job.job_title}`, '/employer/applications')
        }

        // Emails: confirmation to the applicant, notification to the employer.
        // Never fail the apply over an email problem.
        try {
          const emailJobs: Promise<void>[] = []
          if (user.email) {
            emailJobs.push(sendEmail(
              user.email,
              `Application Received - ${job.job_title}`,
              applicantConfirmationHtml({
                applicantName: cand.full_name || 'there',
                jobTitle: job.job_title,
                propertyName: employerName,
              }),
            ))
          }
          let employerEmail: string | null = employer?.contact_email || null
          if (!employerEmail && employer?.user_id) {
            const { data: empUser } = await admin.auth.admin.getUserById(employer.user_id)
            employerEmail = empUser?.user?.email || null
          }
          if (employerEmail) {
            emailJobs.push(sendEmail(
              employerEmail,
              `New Application - ${job.job_title}`,
              employerNotificationHtml({
                applicantName: cand.full_name || 'A candidate',
                jobTitle: job.job_title,
                propertyName: employerName,
                roleLevel: cand.role_level || undefined,
              }),
            ))
          }
          await Promise.allSettled(emailJobs)
        } catch (e: any) {
          console.error('Application emails failed:', e?.message)
        }
      }

      // Mutual? Employer previously right-swiped this candidate
      if (employer?.user_id) {
        const { data: theirSwipe } = await admin
          .from('swipes')
          .select('id')
          .eq('swiper_id', employer.user_id)
          .eq('swiper_type', 'employer')
          .eq('target_id', cand.id)
          .eq('action', 'right')
          .limit(1)
          .maybeSingle()

        if (theirSwipe) {
          const { data: existingMatch } = await admin
            .from('matches')
            .select('id')
            .eq('candidate_id', cand.id)
            .eq('job_id', job.id)
            .maybeSingle()
          let createdMatch = false
          if (!existingMatch) {
            const { error: matchError } = await admin.from('matches').insert({
              candidate_id: cand.id, employer_id: job.employer_id, job_id: job.id,
              score: serverMatchScore, status: 'active',
            })
            if (matchError) return NextResponse.json({ error: 'The match could not be saved. Please try again.' }, { status: 500 })
            createdMatch = true
          }
          if (createdMatch) {
            // Open and announce the conversation once, only when the match row
            // is first created. Repeated clicks return the match without spam.
            await admin.from('messages').insert({
              sender_id: employer.user_id, recipient_id: user.id,
              content: `It's a match! You both said yes to ${job.job_title} at ${employerName}. Say hello and take it from here.`,
              read: false,
            })
            await createNotification(user.id, 'new_match', "It's a match!",
              `You and ${employerName} both said yes to ${job.job_title}. Start the conversation.`, '/talent/messages')
            await createNotification(employer.user_id, 'new_match', "It's a match!",
              `${cand.full_name || 'A candidate'} you shortlisted has applied for ${job.job_title}.`, '/employer/messages')
            try {
              let employerEmail: string | null = employer?.contact_email || null
              if (!employerEmail && employer?.user_id) {
                const { data: empUser } = await admin.auth.admin.getUserById(employer.user_id)
                employerEmail = empUser?.user?.email || null
              }
              await Promise.allSettled([
                user.email ? sendNewMatchEmail(user.email, cand.full_name || 'there', employerName) : null,
                employerEmail ? sendNewMatchEmail(employerEmail, employerName, cand.full_name || 'A candidate') : null,
              ].filter(Boolean) as Promise<void>[])
            } catch (e: any) {
              console.error('Match emails failed:', e?.message)
            }
          }
          return NextResponse.json({ matched: true, jobTitle: job.job_title, employerName })
        }
      }
      return NextResponse.json({ matched: false })
    }

    /* ── Employer swiping on a candidate ── */
    const { data: emp } = await admin
      .from('employer_profiles')
      .select('id, property_name, company_name, approval_status, latitude, longitude')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!emp) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })
    if (emp.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Your employer account must be approved first' }, { status: 403 })
    }

    let candidateForRight: any = null
    if (action === 'right') {
      const [{ data: cand }, { data: blocked }] = await Promise.all([
        admin.from('candidate_profiles').select('*').eq('id', targetId).maybeSingle(),
        admin.from('profile_blocks').select('candidate_id')
          .eq('candidate_id', targetId).eq('blocked_employer_id', emp.id).maybeSingle(),
      ])
      if (!cand) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })

      const discoverable = canEmployerDiscoverCandidate(cand, new Set(blocked ? [targetId] : []))
      const travel = mutualRadiusResult(emp, cand, null)
      const locationMissing = Boolean(cand.travel_radius_miles) && travel.reason === 'location_required'
      if (!discoverable || !travel.withinRadius || locationMissing) {
        await removeSwipe(admin, {
          swiper_id: user.id, swiper_type: 'employer', target_id: targetId, target_type: 'candidate',
        })
        return NextResponse.json({
          error: locationMissing
            ? 'Add your property location before approaching professionals with a travel radius.'
            : 'This profile is not available to your account.',
        }, { status: 403 })
      }
      candidateForRight = cand
    }

    const recorded = await replaceSwipe(admin, {
      swiper_id: user.id, swiper_type: 'employer', target_id: targetId, target_type: 'candidate', action,
    })
    if (recorded.error) return NextResponse.json({ error: 'Your decision could not be saved. Please try again.' }, { status: 500 })

    if (action !== 'right') return NextResponse.json({ matched: false })

    const cand = candidateForRight

    if (cand.user_id && recorded.changed) {
      await createNotification(
        cand.user_id,
        'new_match',
        'An employer is interested',
        `${emp.property_name || emp.company_name || 'An employer'} has shortlisted your profile.`,
        '/talent/dashboard',
      )
    }

    const { data: myJobs } = await admin
      .from('job_listings')
      .select('*')
      .eq('employer_id', emp.id)
    const jobIds = (myJobs || []).map(j => j.id)
    if (jobIds.length === 0) return NextResponse.json({ matched: false })

    // Mutual? Candidate previously right-swiped one of my roles
    const { data: theirSwipes } = await admin
      .from('swipes')
      .select('target_id')
      .eq('swiper_id', cand.user_id)
      .eq('swiper_type', 'candidate')
      .eq('target_type', 'job')
      .eq('action', 'right')
      .in('target_id', jobIds)

    if (!theirSwipes || theirSwipes.length === 0) return NextResponse.json({ matched: false })

    const employerName = emp.property_name || emp.company_name || 'An employer'
    let firstJobTitle = ''
    let createdAnyMatch = false
    let foundCompatibleMutual = false
    for (const s of theirSwipes) {
      const job = (myJobs || []).find(j => j.id === s.target_id)
      if (!job) continue
      const calculatedMatch = calculateMatchScore(cand, job)
      if (calculatedMatch.hardStop) {
        // The candidate's old "yes" is no longer valid (for example expired
        // insurance), so remove it rather than creating a zero-score match.
        await removeSwipe(admin, {
          swiper_id: cand.user_id, swiper_type: 'candidate', target_id: job.id, target_type: 'job',
        })
        continue
      }
      foundCompatibleMutual = true
      const { data: existingMatch } = await admin
        .from('matches')
        .select('id')
        .eq('candidate_id', cand.id)
        .eq('job_id', job.id)
        .maybeSingle()
      if (!existingMatch) {
        const { error: matchError } = await admin.from('matches').insert({
          candidate_id: cand.id,
          employer_id: emp.id,
          job_id: job.id,
          score: calculatedMatch.score,
          status: 'active',
        })
        if (matchError) return NextResponse.json({ error: 'The match could not be saved. Please try again.' }, { status: 500 })
        createdAnyMatch = true
        if (!firstJobTitle) firstJobTitle = job.job_title
      }
    }

    if (!foundCompatibleMutual) return NextResponse.json({ matched: false })

    // A repeat swipe may refer to an existing match. Report it to the UI but
    // do not create another conversation, notification or email.
    if (!createdAnyMatch) return NextResponse.json({ matched: true })

    if (cand.user_id) {
      // Open the conversation so neither side hits an empty inbox
      await admin.from('messages').insert({
        sender_id: user.id, recipient_id: cand.user_id,
        content: `It's a match! You both said yes to ${firstJobTitle} at ${employerName}. Say hello and take it from here.`,
        read: false,
      })
      await createNotification(cand.user_id, 'new_match', "It's a match!",
        `${employerName} wants to talk about ${firstJobTitle}. Start the conversation.`, '/talent/messages')
    }
    await createNotification(user.id, 'new_match', "It's a match!",
      `${cand.full_name || 'A candidate'} already liked ${firstJobTitle}. Start the conversation.`, '/employer/messages')

    // Email both sides - never let an email problem break the match itself.
    try {
      let candEmail: string | null = null
      if (cand.user_id) {
        const { data: candUser } = await admin.auth.admin.getUserById(cand.user_id)
        candEmail = candUser?.user?.email || null
      }
      await Promise.allSettled([
        candEmail ? sendNewMatchEmail(candEmail, cand.full_name || 'there', employerName) : null,
        user.email ? sendNewMatchEmail(user.email, employerName, cand.full_name || 'A candidate') : null,
      ].filter(Boolean) as Promise<void>[])
    } catch (e: any) {
      console.error('Match emails failed:', e?.message)
    }

    return NextResponse.json({ matched: true, candidateName: cand.full_name, jobTitle: firstJobTitle })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
