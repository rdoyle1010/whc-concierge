import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { seedDemoData, clearDemoData, demoDataStatus } from '../src/lib/demo-seed'
import { DEMO_CANDIDATES, DEMO_JOBS, DEMO_PROPERTIES } from '../src/lib/demo-data'

// This logic had never once executed.
//
// It lived in POST /api/seed, and src/proxy.ts answers every path in
// BLOCKED_API_ROUTES with a 404 before the handler runs. '/api/seed' is on
// that list. So the demonstration seed was written, reviewed, guarded, shipped
// and merged without a single row ever being inserted by it, and the first
// time anybody found out would have been in front of a buyer.
//
// A stub Postgres is not a real one, and this proves nothing about column
// names. What it does prove is the part that was actually untested: that the
// control flow completes, that every property, role and person is attempted,
// that the applications are scored by calculateMatchScore rather than by a
// hardcoded number, and that the teardown removes what the seed created.

type Row = Record<string, any>

// Columns the live database refuses to accept as null.
//
// The stub used to accept anything, which is why it passed a seed that never
// set employer_profiles.property_name. Production rejected all three property
// inserts - and because the roles hang off the property, that took all eight
// roles and every application with them. Six people and nothing to apply to.
//
// property_name is evidence: it is the exact constraint the live database
// named. The rest mirror what sanitiseEmployerRegistration and the real
// registration routes write, so the stub refuses what production would.
const REQUIRED: Record<string, string[]> = {
  employer_profiles: ['user_id', 'company_name', 'property_name'],
  candidate_profiles: ['user_id', 'full_name'],
  // sector_id is NOT NULL by the phase 0 sector migration, and was the second
  // constraint this seed hit in production after property_name.
  job_listings: ['employer_id', 'sector_id', 'job_title'],
  applications: ['candidate_id', 'role_id', 'job_id'],
}

/** The smallest thing that answers the slice of the Supabase API the seed uses. */
function fakeSupabase() {
  const tables = new Map<string, Row[]>()
  // The taxonomy the seed looks its sector up in. Real slugs, because the seed
  // files skin roles under beauty and everything else under spa.
  const seeded = new Map<string, Row[]>([
    ['sectors', [
      { id: 'sector-spa', slug: 'spa' },
      { id: 'sector-beauty', slug: 'beauty' },
      { id: 'sector-fitness', slug: 'fitness' },
    ]],
  ])
  for (const [name, value] of seeded) tables.set(name, value)
  const users: Row[] = []
  let nextId = 1
  const rows = (table: string) => {
    if (!tables.has(table)) tables.set(table, [])
    return tables.get(table)!
  }

  function builder(table: string) {
    let filters: [string, any][] = []
    let likes: [string, string][] = []
    let ins: [string, any[]][] = []
    let pending: 'select' | 'insert' | 'delete' | 'upsert' = 'select'
    let payload: Row | null = null
    let counting = false

    const matches = (row: Row) =>
      filters.every(([c, v]) => row[c] === v)
      && ins.every(([c, vs]) => vs.includes(row[c]))
      && likes.every(([c, pattern]) => {
        const re = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('%', '.*')}$`)
        return re.test(String(row[c] ?? ''))
      })

    const api: any = {
      select() { if (pending === 'select') pending = 'select'; return api },
      eq(column: string, value: any) { filters.push([column, value]); return api },
      is(column: string, value: any) { filters.push([column, value]); return api },
      in(column: string, values: any[]) { ins.push([column, values]); return api },
      like(column: string, pattern: string) { likes.push([column, pattern]); return api },
      insert(row: Row) { pending = 'insert'; payload = row; return api },
      upsert(row: Row) { pending = 'upsert'; payload = row; return api },
      delete(options?: { count?: string }) { pending = 'delete'; counting = !!options?.count; return api },
      async maybeSingle() {
        if (pending === 'insert') {
          const missing = (REQUIRED[table] || []).filter(c => payload![c] === undefined || payload![c] === null)
          if (missing.length) {
            return {
              data: null,
              error: { message: `null value in column "${missing[0]}" of relation "${table}" violates not-null constraint` },
            }
          }
          const row = { id: `${table}-${nextId++}`, ...payload }
          rows(table).push(row)
          return { data: row, error: null }
        }
        return { data: rows(table).find(matches) || null, error: null }
      },
      then(resolve: (value: any) => void) {
        if (pending === 'delete') {
          const keep = rows(table).filter(row => !matches(row))
          const removed = rows(table).length - keep.length
          tables.set(table, keep)
          return Promise.resolve({ data: null, error: null, count: counting ? removed : null }).then(resolve)
        }
        if (pending === 'upsert') {
          const existing = rows(table).findIndex(row => row.id === payload!.id)
          if (existing >= 0) rows(table)[existing] = { ...rows(table)[existing], ...payload }
          else rows(table).push({ ...payload })
          return Promise.resolve({ data: null, error: null }).then(resolve)
        }
        return Promise.resolve({ data: rows(table).filter(matches), error: null }).then(resolve)
      },
    }
    return api
  }

  return {
    tables,
    users,
    from: (table: string) => builder(table),
    auth: {
      admin: {
        async createUser({ email, user_metadata }: any) {
          if (users.some(u => u.email === email)) {
            return { data: null, error: { message: 'already registered' } }
          }
          const user = { id: `user-${nextId++}`, email, ...user_metadata }
          users.push(user)
          return { data: { user }, error: null }
        },
        async listUsers() { return { data: { users }, error: null } },
        async deleteUser(id: string) {
          const at = users.findIndex(u => u.id === id)
          if (at >= 0) users.splice(at, 1)
          return { data: null, error: null }
        },
      },
    },
  }
}

test('the seed creates every property, role and person it describes', async () => {
  const supabase = fakeSupabase()
  const report = await seedDemoData(supabase)

  assert.equal(report.properties, DEMO_PROPERTIES.length)
  assert.equal(report.roles, DEMO_JOBS.length)
  assert.equal(report.people, DEMO_CANDIDATES.length)
  assert.deepEqual(report.notes, [], 'a row failed to go in')
})

test('the seed produces applications, and their scores come from the matcher', async () => {
  const supabase = fakeSupabase()
  const report = await seedDemoData(supabase)

  assert.ok(report.applications > 0, 'a demonstration with no applications shows nothing talking to anything')

  const applications = supabase.tables.get('applications') || []
  assert.equal(applications.length, report.applications)

  for (const application of applications) {
    assert.equal(typeof application.match_score, 'number')
    assert.ok(application.match_score > 0, 'a zero score is not the matcher working')
    assert.ok(application.match_score <= 100)
    assert.ok(application.candidate_id && application.role_id)
  }

  // Scores that are all identical would mean the matcher is not discriminating,
  // which is the one thing a demonstration of matching has to show.
  const distinct = new Set(applications.map(a => a.match_score))
  assert.ok(distinct.size > 1, 'every application scored the same, so the matcher is not being exercised')
})

test('running the seed twice adds nothing the second time', async () => {
  const supabase = fakeSupabase()
  await seedDemoData(supabase)
  const again = await seedDemoData(supabase)

  assert.equal(again.properties, 0)
  assert.equal(again.roles, 0)
  assert.equal(again.people, 0)
  assert.equal(again.applications, 0)
})

test('the teardown removes what the seed created', async () => {
  const supabase = fakeSupabase()
  await seedDemoData(supabase)

  const removed = await clearDemoData(supabase)
  assert.equal(removed.properties, DEMO_PROPERTIES.length)
  assert.equal(removed.roles, DEMO_JOBS.length)
  assert.equal(removed.people, DEMO_CANDIDATES.length)
  assert.ok(removed.applications > 0)

  assert.deepEqual(supabase.tables.get('employer_profiles'), [])
  assert.deepEqual(supabase.tables.get('job_listings'), [])
  assert.deepEqual(supabase.tables.get('candidate_profiles'), [])
  assert.deepEqual(supabase.tables.get('applications'), [])
  assert.deepEqual(supabase.users, [], 'the sign-ins it created are still there')
})

test('the status reader reports what is in, and nothing when it is out', async () => {
  const supabase = fakeSupabase()

  const before = await demoDataStatus(supabase)
  assert.equal(before.live, false)
  assert.equal(before.roles, 0)

  await seedDemoData(supabase)
  const during = await demoDataStatus(supabase)
  assert.equal(during.live, true)
  assert.equal(during.properties, DEMO_PROPERTIES.length)
  assert.equal(during.roles, DEMO_JOBS.length)
  assert.equal(during.people, DEMO_CANDIDATES.length)
  assert.ok(during.applications > 0)

  await clearDemoData(supabase)
  const after = await demoDataStatus(supabase)
  assert.equal(after.live, false, 'the admin screen would still say demonstration data is live')
})

// The admin screen is the only way this gets used in practice, so the route
// behind it has to be guarded on every verb and must not write on a read.
test('the demonstration data endpoint is admin-only and does not write on a GET', () => {
  const source = readFileSync('src/app/api/admin/demo-data/route.ts', 'utf8')

  for (const verb of ['GET', 'POST', 'DELETE']) {
    const handler = source.slice(source.indexOf(`export async function ${verb}(`))
    assert.match(handler.slice(0, 200), /adminRequestUser/, `${verb} is not guarded`)
  }

  const get = source.slice(source.indexOf('export async function GET('), source.indexOf('export async function POST('))
  assert.doesNotMatch(get, /seedDemoData|clearDemoData/, 'the GET handler mutates')
})

test('eight roles failing the same way is reported once, not eight times', async () => {
  const supabase = fakeSupabase()
  // A database with no sectors: every role fails for the same reason, which is
  // exactly the case that printed the identical sentence eight times.
  supabase.tables.set('sectors', [])

  const report = await seedDemoData(supabase)
  assert.equal(report.roles, 0)
  assert.equal(report.notes.length, 1, `expected one collapsed note, got:\n${report.notes.join('\n')}`)
  assert.match(report.notes[0], /8 times/)
  assert.match(report.notes[0], /sector/i)
})

test('a role carries the fields the real create route always writes', () => {
  const source = readFileSync('src/lib/demo-seed.ts', 'utf8')
  const row = source.slice(source.indexOf('const row = {'), source.indexOf('insertTolerant(supabase, \'job_listings\''))
  for (const column of ['sector_id', 'country_code', 'salary_currency', 'candidate_scope', 'employer_id']) {
    assert.match(row, new RegExp(`${column}:`), `job_listings row is missing ${column}`)
  }
})

// A role that is is_live but not status 'active' shows on the jobs board and
// is invisible to /intelligence, which filters on both - so the page that
// claims to be drawn from live platform data read zero while eight roles were
// live. The route that really publishes a role writes all four together.
test('a seeded role is published the way a paid one is', () => {
  const source = readFileSync('src/lib/demo-seed.ts', 'utf8')
  const row = source.slice(source.indexOf('const row = {'), source.indexOf('insertTolerant(supabase, \'job_listings\''))
  for (const column of ['is_live', 'status', 'posted_date', 'expires_at']) {
    assert.match(row, new RegExp(`${column}:`), `a seeded role is missing ${column}, so some surface will not see it`)
  }
  assert.match(row, /status: 'active'/)
})

// Topping up cannot repair what is already there.
//
// The seed skips a role that already exists, matched on property and job
// title. That is right for running it twice and useless after the seed itself
// has been fixed: roles written by the older code kept their old shape, the
// button said "Top it up", and pressing it changed nothing while looking like
// it had worked. Exactly how eight roles stayed invisible to /intelligence
// after the fix had shipped.
test('demonstration data can be rebuilt, not only added to', async () => {
  const supabase = fakeSupabase()
  await seedDemoData(supabase)

  const stale = (supabase.tables.get('job_listings') || [])[0]
  assert.ok(stale, 'nothing was seeded to rebuild')
  delete stale.status                      // as an older seed left it
  const staleId = stale.id

  // A rebuild is a clear followed by a seed, which is what the route does.
  await clearDemoData(supabase)
  await seedDemoData(supabase)

  const roles = supabase.tables.get('job_listings') || []
  assert.ok(roles.length > 0, 'the rebuild put nothing back')
  assert.ok(!roles.some(r => r.id === staleId), 'the rebuild kept the old row')
  for (const role of roles) {
    assert.equal(role.status, 'active', 'a rebuilt role is still not published properly')
  }
})

test('the admin screen offers the rebuild, and says why', () => {
  const page = readFileSync('src/app/admin/demo-data/page.tsx', 'utf8')
  assert.match(page, /Remove and reload/)
  assert.match(page, /skips rows\s*\n?\s*that already exist|skips rows that already exist/)
  assert.doesNotMatch(page, /'Top it up'/, 'the button that cannot repair anything is still offered')

  const route = readFileSync('src/app/api/admin/demo-data/route.ts', 'utf8')
  assert.match(route, /rebuild/)
  assert.match(route, /clearDemoData\(admin\)/)
})

// The matcher reads job.required_skills (calculateMatchScore), and the market
// page counts them. The demonstration roles carried brands and qualifications
// and no skills, so the scores on screen were computed without the dimension
// the whole demonstration is about, and "most-demanded skills across live
// roles" read empty while eight roles were live.
test('a seeded role asks for skills the seeded people actually hold', async () => {
  const supabase = fakeSupabase()
  await seedDemoData(supabase)

  const roles = supabase.tables.get('job_listings') || []
  assert.ok(roles.length > 0)
  for (const role of roles) {
    assert.ok(Array.isArray(role.required_skills) && role.required_skills.length > 0,
      `"${role.job_title}" asks for no skills, so it is scored without them`)
  }

  // Every skill a role asks for is held by at least one person, or the
  // demonstration shows a pipeline of people who can never match.
  const held = new Set(DEMO_CANDIDATES.flatMap(c => c.skills))
  const orphans = [...new Set(roles.flatMap(r => r.required_skills))].filter(s => !held.has(s))
  assert.deepEqual(orphans, [], 'roles ask for skills nobody in the demonstration has')
})
