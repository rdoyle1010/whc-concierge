import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRequest } from '@/lib/admin-api-auth'
import { calculateMatchScore } from '@/lib/matching'
import {
  DEMO_CANDIDATES, DEMO_EMAIL_DOMAIN, DEMO_JOBS, DEMO_MARKER, DEMO_PROPERTIES, demoEmail,
} from '@/lib/demo-data'

export const dynamic = 'force-dynamic'

// Demonstration data, and why it carries nobody's name.
//
// The version of this file it replaces wrote its listings against a real hotel
// brand at that brand's own postcode, and the comment explaining the fix is
// worth keeping verbatim, because the request to put "real jobs from Indeed or
// LinkedIn" on here is the same mistake wearing a better suit:
//
//   "A fabricated vacancy attributed to a named business, on a live
//    recruitment site, is a job a therapist could apply for at a company that
//    never advertised it. Demonstration data demonstrates the layout. It does
//    not need somebody else's name to do that."
//
// What that version did not do is create any people, so a demonstration could
// show a list of roles and nothing else: no matches, no scores, no reasons, no
// pipeline. The thing worth showing is that the parts talk to each other, and
// that needs candidates.
//
// So this seeds three properties, eight roles and six people, and then runs the
// platform's own calculateMatchScore to produce the applications. The scores in
// the demonstration are the real matcher's output, not numbers somebody typed,
// which matters when the person watching asks how the score is worked out.
//
// Everything is removable: DELETE on this route takes it all out again.

type Report = Record<string, unknown>

/**
 * Insert that survives a column this environment does not have.
 *
 * The schema has moved under these tables more than once, and a seed that dies
 * on one unknown column during a live demonstration is worse than a seed that
 * drops the column and says so.
 */
async function insertTolerant(
  supabase: any, table: string, row: Record<string, any>, maxStrips = 10,
): Promise<{ data: any; dropped: string[]; error: string | null }> {
  const data = { ...row }
  const dropped: string[] = []
  for (let attempt = 0; attempt <= maxStrips; attempt++) {
    const { data: inserted, error } = await supabase.from(table).insert(data).select('id').maybeSingle()
    if (!error) return { data: inserted, dropped, error: null }
    const unknown = /column "?([a-z_]+)"? of relation|Could not find the '([a-z_]+)' column/i.exec(error.message)
    const column = unknown?.[1] || unknown?.[2]
    if (!column || !(column in data)) return { data: null, dropped, error: error.message }
    delete data[column]
    dropped.push(column)
  }
  return { data: null, dropped, error: 'too many unknown columns' }
}

export async function POST() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = createAdminClient()
  const report: Report = { properties: 0, roles: 0, people: 0, applications: 0, dropped: [] as string[], notes: [] as string[] }
  const dropped = new Set<string>()
  const notes: string[] = []

  try {
    // ── Properties ────────────────────────────────────────────────────────
    const propertyIds = new Map<string, string>()
    for (const property of DEMO_PROPERTIES) {
      const { data: existing } = await supabase.from('employer_profiles')
        .select('id').eq('company_name', property.company_name).maybeSingle()
      if (existing?.id) { propertyIds.set(property.company_name, existing.id); continue }

      const { data, dropped: lost, error } = await insertTolerant(supabase, 'employer_profiles', {
        company_name: property.company_name,
        contact_name: 'Spa Director',
        location: property.location,
        postcode: property.postcode,
        latitude: property.latitude,
        longitude: property.longitude,
        company_type: property.company_type,
        product_houses_used: property.product_houses_used,
        systems_used: property.systems_used,
        approval_status: 'approved',
        property_description: property.property_description,
      })
      lost.forEach(c => dropped.add(`employer_profiles.${c}`))
      if (error) { notes.push(`property "${property.company_name}": ${error}`); continue }
      if (data?.id) { propertyIds.set(property.company_name, data.id); report.properties = (report.properties as number) + 1 }
    }

    // ── Roles ─────────────────────────────────────────────────────────────
    const jobIds: { id: string; job: any }[] = []
    for (const job of DEMO_JOBS) {
      const employerId = propertyIds.get(job.property)
      if (!employerId) { notes.push(`role "${job.job_title}": its property was not created`); continue }

      const { data: already } = await supabase.from('job_listings')
        .select('id').eq('employer_id', employerId).eq('job_title', job.job_title).maybeSingle()
      if (already?.id) {
        const { data: full } = await supabase.from('job_listings').select('*').eq('id', already.id).maybeSingle()
        if (full) jobIds.push({ id: already.id, job: full })
        continue
      }

      const property = DEMO_PROPERTIES.find(p => p.company_name === job.property)!
      const row = {
        employer_id: employerId,
        job_title: job.job_title,
        job_description: job.job_description,
        location: property.location,
        location_postcode: property.postcode,
        latitude: property.latitude,
        longitude: property.longitude,
        job_type: job.job_type,
        contract_type: job.contract_type,
        required_role_level: job.required_role_level,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        required_brands: job.required_brands,
        required_qualifications: job.required_qualifications,
        tier: job.tier,
        is_live: true,
        is_agency_role: job.is_agency_role,
        insurance_required: job.insurance_required,
      }
      const { data, dropped: lost, error } = await insertTolerant(supabase, 'job_listings', row)
      lost.forEach(c => dropped.add(`job_listings.${c}`))
      if (error) { notes.push(`role "${job.job_title}": ${error}`); continue }
      if (data?.id) {
        report.roles = (report.roles as number) + 1
        const { data: full } = await supabase.from('job_listings').select('*').eq('id', data.id).maybeSingle()
        if (full) jobIds.push({ id: data.id, job: full })
      }
    }

    // ── People ────────────────────────────────────────────────────────────
    const candidates: { id: string; profile: any }[] = []
    for (const person of DEMO_CANDIDATES) {
      const email = demoEmail(person)
      const fullName = `${person.first_name} ${person.last_name}`

      let userId: string | null = null
      const { data: created, error: authError } = await supabase.auth.admin.createUser({
        email, email_confirm: true,
        password: crypto.randomUUID() + 'Aa1!',
        user_metadata: { full_name: fullName, demo: true },
      })
      if (created?.user?.id) userId = created.user.id
      else if (authError && /already|registered|exists/i.test(authError.message)) {
        const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
        userId = list?.users?.find((u: any) => u.email === email)?.id || null
      }
      if (!userId) { notes.push(`person "${fullName}": could not create the sign-in`); continue }

      await supabase.from('profiles').upsert(
        { id: userId, email, role: 'candidate', full_name: fullName },
        { onConflict: 'id' },
      )

      const { data: existingProfile } = await supabase.from('candidate_profiles')
        .select('*').eq('user_id', userId).maybeSingle()
      if (existingProfile?.id) { candidates.push({ id: existingProfile.id, profile: existingProfile }); continue }

      const { data, dropped: lost, error } = await insertTolerant(supabase, 'candidate_profiles', {
        user_id: userId,
        full_name: fullName,
        role_level: person.role_level,
        current_role: person.current_role,
        experience_years: person.experience_years,
        location: person.location,
        latitude: person.latitude,
        longitude: person.longitude,
        max_commute: person.max_commute,
        services_offered: person.services_offered,
        skills: person.skills,
        product_houses: person.product_houses,
        qualifications: person.qualifications,
        business_skills: person.business_skills,
        salary_expectation_min: person.salary_expectation_min,
        availability_status: person.availability_status,
        has_insurance: person.has_insurance,
        review_score: person.review_score,
        headline: person.headline,
        bio: `${person.headline} ${DEMO_MARKER}`,
        profile_visible: true,
      })
      lost.forEach(c => dropped.add(`candidate_profiles.${c}`))
      if (error) { notes.push(`person "${fullName}": ${error}`); continue }
      if (data?.id) {
        report.people = (report.people as number) + 1
        const { data: full } = await supabase.from('candidate_profiles').select('*').eq('id', data.id).maybeSingle()
        if (full) candidates.push({ id: data.id, profile: full })
      }
    }

    // ── Applications, scored by the platform's own matcher ────────────────
    //
    // Every candidate is scored against every role and the best three pairings
    // become applications. The score stored is whatever calculateMatchScore
    // returns, so the number on the screen during a demonstration is the
    // number the product would have produced on its own.
    const pairs: { candidateId: string; jobId: string; score: number }[] = []
    for (const candidate of candidates) {
      for (const job of jobIds) {
        try {
          const match = calculateMatchScore(candidate.profile, job.job)
          if (!match?.hardStop) pairs.push({ candidateId: candidate.id, jobId: job.id, score: Number(match?.score || 0) })
        } catch { /* a scoring failure is not a reason to abandon the seed */ }
      }
    }
    pairs.sort((a, b) => b.score - a.score)

    const seen = new Set<string>()
    for (const pair of pairs) {
      if (seen.has(pair.candidateId)) continue
      if ((report.applications as number) >= 5) break
      seen.add(pair.candidateId)

      const { data: already } = await supabase.from('applications')
        .select('id').eq('candidate_id', pair.candidateId).eq('role_id', pair.jobId).maybeSingle()
      if (already?.id) continue

      const now = new Date().toISOString()
      const { dropped: lost, error } = await insertTolerant(supabase, 'applications', {
        candidate_id: pair.candidateId,
        role_id: pair.jobId,
        status: 'pending',
        match_score: pair.score,
        cover_note: `Applied through the demonstration data. ${DEMO_MARKER}`,
        submitted_at: now,
        updated_at: now,
      })
      lost.forEach(c => dropped.add(`applications.${c}`))
      if (error) { notes.push(`application: ${error}`); continue }
      report.applications = (report.applications as number) + 1
    }

    report.dropped = [...dropped]
    report.notes = notes
    return NextResponse.json({ success: true, ...report })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Seed failed', ...report, dropped: [...dropped], notes }, { status: 500 })
  }
}

/** Takes all of it out again. Run this after the demonstration. */
export async function DELETE() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = createAdminClient()
  const removed: Report = { applications: 0, people: 0, roles: 0, properties: 0, signins: 0 }

  try {
    const { data: employers } = await supabase.from('employer_profiles')
      .select('id').in('company_name', DEMO_PROPERTIES.map(p => p.company_name))
    const employerIds = (employers || []).map((e: any) => e.id)

    const { data: jobs } = employerIds.length
      ? await supabase.from('job_listings').select('id').in('employer_id', employerIds)
      : { data: [] as any[] }
    const jobIds = (jobs || []).map((j: any) => j.id)

    const { data: people } = await supabase.from('profiles')
      .select('id').like('email', `%@${DEMO_EMAIL_DOMAIN}`)
    const userIds = (people || []).map((p: any) => p.id)

    const { data: profiles } = userIds.length
      ? await supabase.from('candidate_profiles').select('id').in('user_id', userIds)
      : { data: [] as any[] }
    const candidateIds = (profiles || []).map((c: any) => c.id)

    if (candidateIds.length) {
      const { count } = await supabase.from('applications')
        .delete({ count: 'exact' }).in('candidate_id', candidateIds)
      removed.applications = count || 0
    }
    if (jobIds.length) {
      const { count } = await supabase.from('job_listings').delete({ count: 'exact' }).in('id', jobIds)
      removed.roles = count || 0
    }
    if (candidateIds.length) {
      const { count } = await supabase.from('candidate_profiles')
        .delete({ count: 'exact' }).in('id', candidateIds)
      removed.people = count || 0
    }
    if (userIds.length) {
      const { count, error } = await supabase.from('profiles')
        .delete({ count: 'exact' })
        .in('id', userIds)
        .like('email', `%@${DEMO_EMAIL_DOMAIN}`)
      if (error) return NextResponse.json({ error: error.message, removed }, { status: 500 })
      removed.signins = count || 0
      for (const id of userIds) await supabase.auth.admin.deleteUser(id).catch(() => {})
    }
    if (employerIds.length) {
      const { count } = await supabase.from('employer_profiles')
        .delete({ count: 'exact' }).in('id', employerIds)
      removed.properties = count || 0
    }

    return NextResponse.json({ success: true, removed })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Teardown failed', removed }, { status: 500 })
  }
}
