import { calculateMatchScore } from '@/lib/matching'
import { DEFAULT_COUNTRY } from '@/lib/countries'
import { DEFAULT_CURRENCY } from '@/lib/money'
import {
  DEMO_CANDIDATES, DEMO_EMAIL_DOMAIN, DEMO_JOBS, DEMO_MARKER, DEMO_PROPERTIES, demoEmail,
  demoPropertyEmail,
} from '@/lib/demo-data'

// Demonstration data, and why it is a script rather than an endpoint.
//
// This logic used to live in POST /api/seed. It could never once have run,
// because src/proxy.ts answers every path in BLOCKED_API_ROUTES with a 404
// before the handler is reached, and '/api/seed' is on that list - a rule the
// readiness check "maintenance APIs are blocked" actively enforces. So the
// route was a door painted on a wall: guarded, tested, and unreachable.
//
// The repository's position is the right one. Seeding is maintenance, it wants
// the service-role key, and a key belongs on a machine somebody is sitting at,
// not behind an HTTP handler on the public internet. So the logic lives here
// and scripts/seed-demo.ts drives it:
//
//     npm run seed:demo        # put it in
//     npm run seed:demo:clear  # take it out
//
// Everything is removable, and the teardown is scoped by the demonstration
// email domain as well as by id, so it can only ever remove its own rows.
//
// On the data itself: the version this replaced wrote its listings against a
// real hotel brand at that brand's own postcode, and the comment explaining
// the fix is worth keeping verbatim, because the request to put "real jobs
// from Indeed or LinkedIn" on here is the same mistake wearing a better suit:
//
//   "A fabricated vacancy attributed to a named business, on a live
//    recruitment site, is a job a therapist could apply for at a company that
//    never advertised it. Demonstration data demonstrates the layout. It does
//    not need somebody else's name to do that."
//
// It seeds three properties, eight roles and six people, then runs the
// platform's own calculateMatchScore to produce the applications. The scores
// in the demonstration are the real matcher's output, not numbers somebody
// typed, which matters when the person watching asks how the score is worked
// out.

export type SeedReport = {
  properties: number
  roles: number
  people: number
  applications: number
  dropped: string[]
  notes: string[]
  /** How to sign in as the demonstration accounts, for the length of a call. */
  signIn: { password: string; properties: string[]; people: string[] }
}

export type ClearReport = {
  applications: number
  people: number
  roles: number
  properties: number
  signins: number
}

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

/**
 * A sign-in for a demonstration account, created once and found again after.
 *
 * Returns the user id, or null when neither creating nor finding it worked.
 * Used for both sides: the properties and the professionals.
 */
async function ensureDemoUser(
  supabase: any, email: string, fullName: string, role: 'employer' | 'candidate', password: string,
): Promise<string | null> {
  let userId: string | null = null
  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email, email_confirm: true,
    password,
    user_metadata: { full_name: fullName, demo: true },
  })
  if (created?.user?.id) userId = created.user.id
  else if (authError && /already|registered|exists/i.test(authError.message)) {
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
    userId = list?.users?.find((u: any) => u.email === email)?.id || null
  }
  if (!userId) return null

  await supabase.from('profiles').upsert(
    { id: userId, email, role, full_name: fullName },
    { onConflict: 'id' },
  )
  return userId
}

/** "x (3 times)" rather than the same sentence three times. */
function collapse(notes: string[]): string[] {
  const seen = new Map<string, number>()
  for (const note of notes) {
    const key = note.replace(/^(property|role|person|application) "[^"]*": /, '$1: ')
    seen.set(key, (seen.get(key) || 0) + 1)
  }
  return [...seen].map(([note, count]) => (count > 1 ? `${note} (${count} times)` : note))
}

export async function seedDemoData(supabase: any): Promise<SeedReport> {
  // One password for this run, shown once on the admin screen and never
  // stored. Without it the demonstration was only half reachable: three
  // properties and six people existed, with scored applications between them,
  // and nobody could open either side to show it - which is the entire point
  // of having the data. Random rather than fixed, because the addresses are
  // guessable and these accounts sit on the live site; gone the moment the
  // data is removed.
  const demoPassword = 'Demo!' + crypto.randomUUID().replace(/-/g, '').slice(0, 14)
  const report: SeedReport = {
    properties: 0, roles: 0, people: 0, applications: 0, dropped: [], notes: [],
    signIn: { password: demoPassword, properties: [], people: [] },
  }
  const dropped = new Set<string>()
  const notes: string[] = []

  // ── Properties ──────────────────────────────────────────────────────────
  const propertyIds = new Map<string, string>()
  for (const property of DEMO_PROPERTIES) {
    const { data: existing } = await supabase.from('employer_profiles')
      .select('id').eq('company_name', property.company_name).maybeSingle()
    if (existing?.id) { propertyIds.set(property.company_name, existing.id); continue }

    // Each property gets its own sign-in, for two reasons. The first is that
    // employer_profiles.user_id is how the platform decides who owns a listing,
    // so a property with no user is a property whose roles nobody can manage.
    // The second is that a demonstration to a hotel is far better if the
    // employer side can be shown from the inside - their roles, their
    // applications, their shortlist - rather than described.
    const propertyEmail = demoPropertyEmail(property.company_name)
    const employerUserId = await ensureDemoUser(supabase, propertyEmail, property.company_name, 'employer', demoPassword)
    if (!employerUserId) {
      notes.push(`property "${property.company_name}": could not create the sign-in`)
      continue
    }

    const { data, dropped: lost, error } = await insertTolerant(supabase, 'employer_profiles', {
      user_id: employerUserId,
      company_name: property.company_name,
      // Not the same column, and not optional. The live table has
      // property_name NOT NULL, and the real registration path writes the same
      // value to both - see sanitiseEmployerRegistration. Seeding only
      // company_name failed every property insert, and because the roles hang
      // off the property, it took all eight roles and every application with
      // it: six people and nothing to apply to.
      property_name: property.company_name,
      contact_name: 'Spa Director',
      contact_email: propertyEmail,
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
    if (data?.id) { propertyIds.set(property.company_name, data.id); report.properties += 1 }
    report.signIn.properties.push(`${property.company_name} - ${propertyEmail}`)
  }

  // ── Roles ───────────────────────────────────────────────────────────────
  //
  // job_listings.sector_id is NOT NULL - set that way deliberately in the
  // phase 0 sector migration - and the id is whatever this database generated
  // for the sector, so it has to be looked up rather than written down. A
  // skin role is filed under Beauty and everything else under Spa, which also
  // means sector filtering has something to filter during a demonstration.
  const sectors = new Map<string, string>()
  const { data: sectorRows } = await supabase.from('sectors').select('id, slug')
  for (const row of sectorRows || []) sectors.set(row.slug, row.id)
  const sectorFor = (title: string) =>
    (/skin|facial|aesthetic/i.test(title) ? sectors.get('beauty') : null)
    || sectors.get('spa')
    || (sectorRows || [])[0]?.id
    || null

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
    const sectorId = sectorFor(job.job_title)
    if (!sectorId) {
      notes.push(`role "${job.job_title}": no sector exists to file it under - seed the taxonomy first`)
      continue
    }

    const row = {
      employer_id: employerId,
      sector_id: sectorId,
      job_title: job.job_title,
      job_description: job.job_description,
      location: property.location,
      location_postcode: property.postcode,
      latitude: property.latitude,
      longitude: property.longitude,
      // Set because the real create route sets them on every single listing,
      // not because a constraint has complained yet. Two deploys were spent
      // discovering NOT NULL columns one at a time; the rest of what that
      // route always writes goes in now rather than next time.
      country_code: DEFAULT_COUNTRY,
      salary_currency: DEFAULT_CURRENCY,
      candidate_scope: 'step_up',
      location_city: property.location,
      min_years_experience: 0,
      job_type: job.job_type,
      contract_type: job.contract_type,
      required_role_level: job.required_role_level,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      // The matcher reads required_skills (see calculateMatchScore), and the
      // market page counts them. Leaving it unset meant the demonstration's
      // scores were computed without the dimension the demonstration is
      // mostly about, and the most-demanded-skills panel read empty while
      // eight roles were live.
      required_skills: job.required_skills,
      required_brands: job.required_brands,
      required_qualifications: job.required_qualifications,
      tier: job.tier,
      // A published role is not just is_live. The route that actually
      // publishes one - mobile/employer/jobs/manage - writes is_live, status,
      // posted_date and expires_at together, and pages filter on more than the
      // boolean: /intelligence wants status 'active', and the talent brief
      // wants an expires_at in the future. Seeding is_live alone produced
      // eight roles that showed on the jobs board and were invisible to the
      // market data page, which is the page that claims to be drawn from live
      // platform data.
      is_live: true,
      status: 'active',
      posted_date: new Date().toISOString(),
      expires_at: new Date(Date.now() + (job.tier === 'Platinum' ? 60 : 30) * 86_400_000).toISOString(),
      is_agency_role: job.is_agency_role,
      insurance_required: job.insurance_required,
    }
    const { data, dropped: lost, error } = await insertTolerant(supabase, 'job_listings', row)
    lost.forEach(c => dropped.add(`job_listings.${c}`))
    if (error) { notes.push(`role "${job.job_title}": ${error}`); continue }
    if (data?.id) {
      report.roles += 1
      const { data: full } = await supabase.from('job_listings').select('*').eq('id', data.id).maybeSingle()
      if (full) jobIds.push({ id: data.id, job: full })
    }
  }

  // ── People ──────────────────────────────────────────────────────────────
  const candidates: { id: string; profile: any }[] = []
  for (const person of DEMO_CANDIDATES) {
    const email = demoEmail(person)
    const fullName = `${person.first_name} ${person.last_name}`

    const userId = await ensureDemoUser(supabase, email, fullName, 'candidate', demoPassword)
    if (!userId) { notes.push(`person "${fullName}": could not create the sign-in`); continue }
    report.signIn.people.push(`${fullName} - ${email}`)

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
      report.people += 1
      const { data: full } = await supabase.from('candidate_profiles').select('*').eq('id', data.id).maybeSingle()
      if (full) candidates.push({ id: data.id, profile: full })
    }
  }

  // ── Applications, scored by the platform's own matcher ──────────────────
  //
  // Every candidate is scored against every role and the best pairings become
  // applications. The score stored is whatever calculateMatchScore returns, so
  // the number on the screen during a demonstration is the number the product
  // would have produced on its own.
  type Pair = { candidateId: string; jobId: string; employerId: string; score: number }
  const pairs: Pair[] = []
  for (const candidate of candidates) {
    for (const job of jobIds) {
      try {
        const match = calculateMatchScore(candidate.profile, job.job)
        if (!match?.hardStop) {
          pairs.push({
            candidateId: candidate.id,
            jobId: job.id,
            employerId: String(job.job?.employer_id || ''),
            score: Number(match?.score || 0),
          })
        }
      } catch { /* a scoring failure is not a reason to abandon the seed */ }
    }
  }
  pairs.sort((a, b) => b.score - a.score)

  // Every property gets a pipeline before any property gets a second one.
  //
  // Taking the globally best pairs put all five applications on whichever
  // properties happened to score highest, and left the others with "No
  // applications received yet". During a demonstration that is the difference
  // between signing in as a hotel and showing them their own candidates, and
  // signing in as a hotel and showing them an empty page - and which property
  // you happen to open is not something to leave to the scoring.
  const byProperty: Pair[] = []
  const covered = new Set<string>()
  for (const pair of pairs) {
    if (!pair.employerId || covered.has(pair.employerId)) continue
    covered.add(pair.employerId)
    byProperty.push(pair)
  }
  const ordered = [...byProperty, ...pairs.filter(p => !byProperty.includes(p))]

  // Applications already in place count towards both the cap and the
  // one-each rule. Without this, a second run tops up whoever missed out the
  // first time, so seeding twice gives a different demonstration from seeding
  // once - which is exactly the kind of thing nobody notices until the screen
  // is being shared.
  const seen = new Set<string>()
  let existingApplications = 0
  if (candidates.length) {
    const { data: existing } = await supabase.from('applications')
      .select('candidate_id').in('candidate_id', candidates.map(c => c.id))
    for (const row of existing || []) {
      seen.add(row.candidate_id)
      existingApplications += 1
    }
  }

  for (const pair of ordered) {
    if (seen.has(pair.candidateId)) continue
    if (existingApplications + report.applications >= 5) break
    seen.add(pair.candidateId)

    const { data: already } = await supabase.from('applications')
      .select('id').eq('candidate_id', pair.candidateId).eq('role_id', pair.jobId).maybeSingle()
    if (already?.id) continue

    const now = new Date().toISOString()
    // Shaped like the real apply route (src/app/api/applications/draft):
    // role_id and job_id both carry the listing id, and the letter lives in
    // cover_letter. The earlier version wrote cover_note and no job_id, which
    // is a column that does not exist and one that is required.
    const { dropped: lost, error } = await insertTolerant(supabase, 'applications', {
      candidate_id: pair.candidateId,
      role_id: pair.jobId,
      job_id: pair.jobId,
      status: 'pending',
      match_score: pair.score,
      cover_letter: `Applied through the demonstration data. ${DEMO_MARKER}`,
      submitted_at: now,
      updated_at: now,
    })
    lost.forEach(c => dropped.add(`applications.${c}`))
    if (error) { notes.push(`application: ${error}`); continue }
    report.applications += 1
  }

  report.dropped = [...dropped]
  // Eight roles failing on one missing column printed the same sentence eight
  // times, which buries the one fact that matters. Identical messages collapse
  // to a count.
  report.notes = collapse(notes)
  return report
}

/**
 * What demonstration data is currently in place.
 *
 * Read only. The admin screen needs to say "this is on and visitors can see
 * it" rather than make somebody guess, because the whole risk of this feature
 * is leaving it switched on after the call.
 */
export async function demoDataStatus(supabase: any): Promise<ClearReport & { live: boolean }> {
  const { data: employers } = await supabase.from('employer_profiles')
    .select('id').in('company_name', DEMO_PROPERTIES.map(p => p.company_name))
  const employerIds = (employers || []).map((e: any) => e.id)

  const { data: jobs } = employerIds.length
    ? await supabase.from('job_listings').select('id').in('employer_id', employerIds)
    : { data: [] as any[] }

  const { data: people } = await supabase.from('profiles')
    .select('id').like('email', `%@${DEMO_EMAIL_DOMAIN}`)
  const userIds = (people || []).map((p: any) => p.id)

  const { data: profiles } = userIds.length
    ? await supabase.from('candidate_profiles').select('id').in('user_id', userIds)
    : { data: [] as any[] }
  const candidateIds = (profiles || []).map((c: any) => c.id)

  const { data: applications } = candidateIds.length
    ? await supabase.from('applications').select('id').in('candidate_id', candidateIds)
    : { data: [] as any[] }

  const counts = {
    properties: employerIds.length,
    roles: (jobs || []).length,
    people: candidateIds.length,
    signins: userIds.length,
    applications: (applications || []).length,
  }
  return { ...counts, live: Object.values(counts).some(n => n > 0) }
}

/** Takes all of it out again. Run this after the demonstration. */
export async function clearDemoData(supabase: any): Promise<ClearReport> {
  const removed: ClearReport = { applications: 0, people: 0, roles: 0, properties: 0, signins: 0 }

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
    // Scoped by the demonstration email domain as well as by id, so a caller
    // handing this a list of ids cannot use it to remove anybody real.
    const { count, error } = await supabase.from('profiles')
      .delete({ count: 'exact' })
      .in('id', userIds)
      .like('email', `%@${DEMO_EMAIL_DOMAIN}`)
    if (error) throw new Error(error.message)
    removed.signins = count || 0
    for (const id of userIds) await supabase.auth.admin.deleteUser(id).catch(() => {})
  }
  if (employerIds.length) {
    const { count } = await supabase.from('employer_profiles')
      .delete({ count: 'exact' }).in('id', employerIds)
    removed.properties = count || 0
  }

  return removed
}
