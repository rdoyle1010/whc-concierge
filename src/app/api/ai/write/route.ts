import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isWriteField, writeText, writingConfigured, type WriteField } from '@/lib/ai-write'
import { fieldIsMetered } from '@/lib/ai-allowance'
import { claimAllowance, releaseAllowance, recordSpend } from '@/lib/ai-allowance-server'

// Writing the blank box, for whoever is looking at it.
//
// One route for every account type, because the problem is the same problem:
// a person who can do the job cannot face writing a paragraph about doing the
// job, so the field stays empty and the profile reads as abandoned.
//
// The facts come from the caller's own record, read here with the service
// role. Never from the request body. A route that writes a biography from
// whatever JSON it is handed is a route that will cheerfully write somebody
// else's, and the only thing stopping it would be that nobody had tried.

export const dynamic = 'force-dynamic'
export const maxDuration = 26

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req).catch(() => null)
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  // Per account, not per address. A shared office IP should not stop the
  // second person of the day from writing their own profile.
  const limited = await enforceRateLimit(req as unknown as Request, 'ai-write', {
    windowMs: 60_000, maxRequests: 8, key: user.id,
  })
  if (limited) {
    return NextResponse.json(
      { error: 'That is a lot of rewriting in one minute. Give it a moment.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    )
  }

  if (!writingConfigured()) {
    return NextResponse.json({ error: 'Talent House AI is not switched on yet.' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const field = body.field
  if (!isWriteField(field)) return NextResponse.json({ error: 'Unknown field' }, { status: 400 })
  const mode = body.mode === 'improve' ? 'improve' : 'write'
  const draft = typeof body.draft === 'string' ? body.draft : ''
  const steer = typeof body.steer === 'string' ? body.steer : ''

  const admin = createAdminClient()
  const gathered = await gatherFacts(admin, user.id, field, body)
  if (!gathered.ok) return NextResponse.json({ error: gathered.error }, { status: gathered.status })

  // This month's allowance, taken before the call and handed back if the call
  // produces nothing. Free members get a bounded number of presses rather than
  // a paywall, because the writer is what turns a thin profile into something
  // an employer reads, and charging for that is charging people to fill in our
  // own catalogue.
  const metered = fieldIsMetered(field)
  const claim = metered
    ? await claimAllowance(admin, user.id, 'profile_writing', await membershipTierFor(admin, user.id))
    : null
  if (claim && !claim.ok) {
    return NextResponse.json({ error: claim.error }, { status: claim.status })
  }

  const subject = typeof body.subject === 'string' ? body.subject : ''
  const result = await writeText({ field, mode, draft, steer, subject, facts: gathered.facts })
  if (!result.ok) {
    // A press that produced nothing has not had its turn.
    if (claim) await releaseAllowance(admin, user.id, claim, 'profile_writing')
    return NextResponse.json({ error: result.error }, { status: 502 })
  }
  if (claim) await recordSpend(admin, user.id, 'profile_writing', result.spend)

  // Recorded, because this is a person's own words being drafted by a machine
  // and the honest thing is to be able to say when and for what.
  try {
    await admin.from('consent_events').insert({
      user_id: user.id,
      consent_type: 'ai_writing_assistance',
      action: 'accepted',
      policy_version: '2026-09',
      wording: 'User asked Talent House AI to draft or improve text on their own profile. The draft is shown for approval and is not saved unless they save it.',
      source: `ai_write:${field}`,
    })
  } catch { /* the log is not allowed to be the reason the draft fails */ }

  return NextResponse.json({
    success: true,
    text: result.text,
    // Shown only once it starts to matter, so the common case never mentions
    // a limit the member will not reach.
    ...(claim?.ok && claim.metered && claim.limit - claim.used <= 5
      ? { allowanceLeft: claim.limit - claim.used, allowanceOf: claim.limit }
      : {}),
  })
}

/**
 * The caller's tier, from whichever profile they have.
 *
 * Read here rather than inside gatherFacts because a consultant is metered on
 * their talent membership: the practice boxes and the profile boxes are the
 * same person filling in the same register.
 */
async function membershipTierFor(admin: any, userId: string): Promise<string | null> {
  const { data } = await admin.from('candidate_profiles')
    .select('membership_tier').eq('user_id', userId).maybeSingle()
  return (data as any)?.membership_tier ?? null
}

type Gathered =
  | { ok: true; facts: Record<string, unknown> }
  | { ok: false; error: string; status: number }

/**
 * Everything true about the caller, for this field, read from their own row.
 *
 * A role being written has not been saved yet, so its details can only come
 * from the form. That is the one place the request body is read, it is a
 * fixed list of fields, and the property it is attached to still comes from
 * the database: an employer describing their own vacancy is not a risk, an
 * employer describing somebody else's property would be.
 */
async function gatherFacts(
  admin: any,
  userId: string,
  field: WriteField,
  body: any,
): Promise<Gathered> {
  if (field === 'talent_bio' || field === 'talent_headline' || field === 'talent_commercial') {
    const { data } = await admin.from('candidate_profiles')
      .select('full_name, role_level, experience_years, services_offered, product_houses, qualifications, systems_experience, business_skills, current_employer, hotel_brands_worked, location, career_evidence, languages, team_size_managed, revenue_responsibility, commercial_experience')
      .eq('user_id', userId).maybeSingle()
    if (!data) return { ok: false, error: 'We could not find your profile.', status: 404 }
    return {
      ok: true,
      facts: {
        'Role level': data.role_level,
        'Years in the industry': data.experience_years,
        'Treatments and services': data.services_offered,
        'Qualifications': data.qualifications,
        'Product houses trained with': data.product_houses,
        'Systems used': data.systems_experience,
        'Business and management skills': data.business_skills,
        'Hotel brands worked with': data.hotel_brands_worked,
        'Where they are': data.location,
        'Languages': data.languages,
        'Evidence from their CV': data.career_evidence,
        'Largest team managed': data.team_size_managed,
        'Revenue responsibility': data.revenue_responsibility,
        'What they have said about commercial experience': data.commercial_experience,
      },
    }
  }

  if (field === 'practice_headline' || field === 'practice_about'
    || field === 'practice_work' || field === 'practice_outcome') {
    const { data } = await admin.from('consultancy_profiles')
      .select('practice_name, headline, summary, specialisms, engagement_types, years_experience, based_in, works_with')
      .eq('user_id', userId).maybeSingle()

    // A practice being written has not been saved yet.
    //
    // This returned 404, "We could not find your practice", to anybody who had
    // not already saved. So the button that exists for somebody staring at a
    // blank box refused to work until the box was filled in, which is the one
    // moment it was built for and the only moment it was useless. A consultant
    // hit it on their first visit and reported that they could not use it. The
    // owner, who has a saved listing, could not reproduce it.
    //
    // Same answer as the unsaved role above: a fixed list of fields read from
    // the form, capped, and labelled as unsaved in the prompt. These are the
    // caller's own keystrokes about their own practice. Nothing about anybody
    // else is reachable from here, because no other row is ever read.
    const typed = (key: string) =>
      typeof body?.[key] === 'string' && body[key].trim() ? String(body[key]).trim().slice(0, 2000) : null

    const facts = {
      'Practice': typed('practice_name') || data?.practice_name,
      'Years in the industry': typed('years_experience') || data?.years_experience,
      'Based in': typed('based_in') || data?.based_in,
      'Works': typed('works_with') || data?.works_with,
      'What they lead on': typed('specialisms') || data?.specialisms,
      'How they are engaged': typed('engagement_types') || data?.engagement_types,
      'What they have said about the practice': typed('summary') || data?.summary,
    }

    // Typed beats saved on purpose. Somebody who has changed three fields and
    // not pressed save wants a draft about what is on their screen, not about
    // what was true last week.
    const knowsAnything = Object.values(facts).some(value =>
      value !== null && value !== undefined && String(value).trim() !== '')
    if (!knowsAnything) {
      return {
        ok: false,
        status: 400,
        error: 'Put your practice name and what you lead on in the boxes above, then press this again. '
          + 'It writes from what you tell it, so it needs something to go on.',
      }
    }
    return { ok: true, facts }
  }

  const { data: employer } = await admin.from('employer_profiles')
    .select('id, property_name, company_name, location, city, company_type, num_treatment_rooms, team_size, product_houses_used, systems_used, about_text, tagline')
    .eq('user_id', userId).maybeSingle()
  if (!employer) return { ok: false, error: 'We could not find your property.', status: 404 }

  const property = {
    'Property': employer.property_name || employer.company_name,
    'Where it is': employer.location || employer.city,
    'Kind of place': employer.company_type,
    'Treatment rooms': employer.num_treatment_rooms,
    'Size of the team': employer.team_size,
    'Product houses used': employer.product_houses_used,
    'Systems used': employer.systems_used,
  }

  if (field === 'employer_about' || field === 'employer_tagline') {
    return { ok: true, facts: { ...property, 'What they have said so far': employer.about_text } }
  }

  // A Fact File box. The draft is the substance here: this is a property
  // saying how it does something, and there is no record anywhere of how a
  // particular spa handles its break policy. The property details go along
  // so the wording sounds like that place rather than a template.
  if (field === 'property_policy') {
    return { ok: true, facts: property }
  }

  // job_description. From the form, because the role does not exist yet.
  const text = (value: unknown, limit = 400) =>
    typeof value === 'string' && value.trim() ? value.trim().slice(0, limit) : null
  const list = (value: unknown) =>
    Array.isArray(value) ? value.filter(item => typeof item === 'string').slice(0, 30) : null

  return {
    ok: true,
    facts: {
      ...property,
      'Job title': text(body.job_title, 160),
      'Level wanted': text(body.required_role_level, 80),
      'Where the role is': text(body.job_location, 160),
      'Hours': text(body.job_type, 80),
      'Shift pattern': text(body.shift_pattern, 160),
      'Treatments required': list(body.required_skills),
      'Qualifications required': list(body.required_qualifications),
      'Product houses required': list(body.required_brands),
      'Systems required': list(body.required_systems),
      'Why the role exists': text(body.why_role_exists, 800),
      'What success looks like in ninety days': text(body.success_90_days, 800),
      'Who they report to': text(body.reporting_line, 200),
      'Why somebody would move for it': text(body.why_move, 800),
      'Where it leads': text(body.career_progression, 800),
      'Accommodation offered': body.offers_accommodation === true ? 'Yes' : null,
    },
  }
}
