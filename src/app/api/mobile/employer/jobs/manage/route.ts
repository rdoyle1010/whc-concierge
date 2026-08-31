import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { getStripe } from '@/lib/stripe'
import { JOB_TIERS, EMPLOYER_MEMBERSHIPS } from '@/lib/constants'
import { geocodePostcode } from '@/lib/geo'

// Job storytelling columns (20260831170000). Optional narrative fields; if the
// live database does not have them yet, the edit retries without them.
const STORY_FIELDS = [
  'why_role_exists', 'success_90_days', 'reporting_line', 'team_size', 'opening_hours',
  'commercial_responsibility', 'membership_size', 'key_kpis', 'why_move',
  'career_progression', 'interview_process',
] as const

const EDITABLE_FIELDS = [
  'job_title', 'job_description', 'location', 'location_postcode', 'radius_miles',
  'job_type', 'contract_type', 'required_role_level', 'candidate_scope', 'salary_min', 'salary_max',
  'required_skills', 'required_brands', 'required_qualifications', 'required_systems',
  'preferred_business_skills', 'min_years_experience', 'shift_pattern', 'offers_accommodation',
  'requirements', 'benefits', 'insurance_required', 'is_agency_role', 'is_residency_role',
  ...STORY_FIELDS,
] as const

const CANDIDATE_SCOPES = new Set(['same_level', 'step_up', 'emerging', 'open_transferable'])
const LIVE_DAYS = 30

async function employerForUser(admin: ReturnType<typeof createAdminClient>, userId: string) {
  return admin.from('employer_profiles')
    .select('id,user_id,postcode,latitude,longitude,membership_tier,annual_job_allowance,annual_jobs_used,approval_status')
    .eq('user_id', userId)
    .maybeSingle()
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const jobId = String(body.jobId || '')
  if (!jobId || !['edit', 'publish'].includes(action)) return NextResponse.json({ error: 'Invalid job request.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: employer } = await employerForUser(admin, user.id)
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const { data: job } = await admin.from('job_listings').select('*').eq('id', jobId).eq('employer_id', employer.id).maybeSingle()
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 })

  if (action === 'edit') {
    if (['filled', 'closed'].includes(String(job.status))) return NextResponse.json({ error: 'Closed or filled roles cannot be edited.' }, { status: 400 })
    const payload: Record<string, unknown> = {}
    for (const field of EDITABLE_FIELDS) if (Object.prototype.hasOwnProperty.call(body, field)) payload[field] = body[field]

    if (Object.prototype.hasOwnProperty.call(payload, 'job_title') && String(payload.job_title || '').trim().length < 5) {
      return NextResponse.json({ error: 'Job title must be at least 5 characters.' }, { status: 400 })
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'job_description') && String(payload.job_description || '').trim().length < 10) {
      return NextResponse.json({ error: 'Job description must be at least 10 characters.' }, { status: 400 })
    }
    if (payload.candidate_scope && !CANDIDATE_SCOPES.has(String(payload.candidate_scope))) payload.candidate_scope = 'step_up'

    const postcode = String(payload.location_postcode ?? job.location_postcode ?? '').trim()
    if (postcode && postcode !== String(job.location_postcode || '').trim()) {
      const coords = await geocodePostcode(postcode)
      if (coords) { payload.latitude = coords.latitude; payload.longitude = coords.longitude }
    }

    let { data: updated, error } = await admin.from('job_listings').update(payload).eq('id', job.id).eq('employer_id', employer.id).select('*').single()
    if (error && /column/i.test(error.message) && STORY_FIELDS.some(field => field in payload)) {
      // Storytelling columns not migrated yet: save the edit without them.
      const trimmed = { ...payload }
      for (const field of STORY_FIELDS) delete trimmed[field]
      if (Object.keys(trimmed).length) {
        ;({ data: updated, error } = await admin.from('job_listings').update(trimmed).eq('id', job.id).eq('employer_id', employer.id).select('*').single())
      } else {
        // The edit carried only storytelling fields - nothing else to save.
        return NextResponse.json({ success: true, job })
      }
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, job: updated })
  }

  if (!['draft', 'pending_payment'].includes(String(job.status)) || job.is_live) {
    return NextResponse.json({ error: 'Only draft roles can be published.' }, { status: 400 })
  }
  // Roles from unapproved employers must never reach talent: they'd render
  // with no company details, and approval is WHC's quality gate.
  if ((employer as any).approval_status !== 'approved') {
    return NextResponse.json({ error: 'Your employer account is awaiting WHC approval. You can prepare roles as drafts now - publishing and payment unlock the moment your account is approved.' }, { status: 403 })
  }
  if (String(job.job_title || '').trim().length < 5 || String(job.job_description || '').trim().length < 10 || !String(job.location || '').trim()) {
    return NextResponse.json({ error: 'Complete the job title, description and location before publishing.' }, { status: 400 })
  }

  const tier = body.tier === 'Platinum' ? 'Platinum' : 'Bronze'
  const membership = String(employer.membership_tier || 'free').toLowerCase()
  const allowance = Number(employer.annual_job_allowance || (membership === 'group' ? 20 : 0))
  const used = Number(employer.annual_jobs_used || 0)

  if (tier === 'Bronze' && membership === 'group' && used < allowance) {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + LIVE_DAYS * 86400000).toISOString()
    const { data: claimed, error: claimError } = await admin.from('employer_profiles')
      .update({ annual_jobs_used: used + 1 })
      .eq('id', employer.id)
      .eq('annual_jobs_used', used)
      .select('id')
      .maybeSingle()
    if (claimError || !claimed) return NextResponse.json({ error: 'Job allowance changed. Refresh and try again.' }, { status: 409 })

    const { error: publishError } = await admin.from('job_listings').update({
      tier: 'Bronze', is_live: true, status: 'active', posted_date: now.toISOString(), expires_at: expiresAt,
    }).eq('id', job.id).eq('employer_id', employer.id).eq('is_live', false)
    if (publishError) {
      await admin.from('employer_profiles').update({ annual_jobs_used: used }).eq('id', employer.id).eq('annual_jobs_used', used + 1)
      return NextResponse.json({ error: 'Could not publish this role.' }, { status: 500 })
    }

    // Instrumentation: an included publish is the moment the role truly
    // enters the market, exactly like the paid webhook path. Best-effort.
    try {
      const { trackEvent, recordSalary } = await import('@/lib/analytics')
      await trackEvent('job_posted', { employerId: employer.id, jobId: job.id }, { tier: 'Bronze', included: true })
      if (job.salary_min || job.salary_max) {
        await recordSalary({
          kind: 'advertised', source: 'employer_advertised',
          amountMin: job.salary_min ? Number(job.salary_min) : null,
          amountMax: job.salary_max ? Number(job.salary_max) : null,
          employerId: employer.id, jobId: job.id,
          roleLevel: job.required_role_level ? String(job.required_role_level) : null,
        })
      }
    } catch { /* best-effort */ }

    return NextResponse.json({ success: true, included: true, status: 'active', remainingJobs: Math.max(0, allowance - used - 1) })
  }

  const normalPrice = JOB_TIERS[tier].price
  const amount = tier === 'Bronze' && membership === 'pro'
    ? EMPLOYER_MEMBERSHIPS.pro.discountedStandardJobPrice
    : normalPrice
  const days = JOB_TIERS[tier].days

  await admin.from('job_listings').update({ tier, status: 'pending_payment', is_live: false }).eq('id', job.id).eq('employer_id', employer.id)

  const stripe = getStripe()
  const site = 'https://talent.wellnesshousecollective.co.uk'
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: user.email || undefined,
    line_items: [{
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `WHC Concierge - ${tier === 'Bronze' ? 'Standard' : 'Featured'} Job`,
          description: `${days}-day role listing${tier === 'Bronze' && membership === 'pro' ? ' with Employer Pro member pricing' : ''}.`,
        },
        unit_amount: amount,
      },
      quantity: 1,
    }],
    mode: 'payment',
    allow_promotion_codes: true,
    success_url: `${site}/employer/jobs?success=true`,
    cancel_url: `${site}/employer/jobs?cancelled=true`,
    metadata: { type: 'job_posting', tier, employer_id: employer.id, job_id: job.id, days: String(days), user_id: user.id },
  })

  return NextResponse.json({ url: session.url, amountPence: amount, tier, included: false })
}
