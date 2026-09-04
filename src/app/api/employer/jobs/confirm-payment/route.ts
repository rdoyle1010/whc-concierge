import { NextRequest, NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/request-user'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { findPaidSessionForJob, publishPaidJobPosting } from '@/lib/job-posting-fulfilment'
import { triggerJobAlerts } from '@/lib/job-alerts-trigger'

// "I paid and nothing happened."
//
// A job advert only ever went live from the Stripe webhook. A webhook that is
// late, refused or pointed at the wrong host therefore left a property staring
// at "Complete payment" on a role it had already paid for - with no way to
// tell the platform so, and nothing on the platform that would ever notice.
// The money was taken and the listing never appeared.
//
// Every other purchase here is already fulfilled twice: once when the browser
// returns from Stripe, again by the webhook for when the tab never comes back.
// This is that missing first half for job adverts. It asks Stripe directly
// rather than trusting the caller, so it cannot be used to publish a role
// nobody paid for.

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  const { jobId } = await req.json().catch(() => ({ jobId: '' }))
  if (!jobId || typeof jobId !== 'string') return NextResponse.json({ error: 'Which role?' }, { status: 400 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const { data: job } = await admin.from('job_listings')
    .select('id, employer_id, status, is_live').eq('id', jobId).maybeSingle()
  if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Already sorted, by the webhook or by an earlier press of this button.
  if (job.is_live || job.status === 'active') {
    return NextResponse.json({ ok: true, alreadyLive: true, detail: 'This role is already live.' })
  }

  let session
  try {
    session = await findPaidSessionForJob(getStripe(), jobId)
  } catch (error: any) {
    console.error('Payment reconciliation failed for job', jobId, error?.message || error)
    return NextResponse.json({ error: 'We could not reach Stripe to check. Try again in a moment.' }, { status: 502 })
  }

  if (!session) {
    return NextResponse.json({
      ok: false,
      detail: 'No completed payment for this role has reached Stripe. If you have just paid, give it a minute and check again.',
    }, { status: 404 })
  }

  const result = await publishPaidJobPosting(admin, session, {
    onPublished: id => triggerJobAlerts(id, req.url),
  })
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 })

  return NextResponse.json({
    ok: true,
    published: result.published,
    detail: result.published
      ? 'Payment confirmed and the role is now live.'
      : 'Payment confirmed. The role goes live as soon as your employer account is approved.',
  })
}
