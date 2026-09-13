import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { tolerantUpsert } from '../src/lib/tolerant-upsert'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// The most expensive bug this platform has had, and it was one word.
//
// Registration wrote `agreed_terms` to candidate_profiles. That column does
// not exist. Postgres does not ignore an unknown column and write the rest,
// it refuses the whole statement - so every talent registration failed at the
// last step and the person was told their profile could not be opened. The
// auth user, the profiles row and the name all survived, which is why three
// people who were turned away at the door read as three people who signed up
// and could not be bothered.

/** A client that refuses named columns the way PostgREST and Postgres do. */
function fakeClient(missing: string[], shape: 'postgrest' | 'postgres' = 'postgrest') {
  const attempts: Record<string, any>[] = []
  return {
    attempts,
    from() {
      return {
        async upsert(row: Record<string, any>) {
          attempts.push({ ...row })
          const offender = missing.find(column => column in row)
          if (!offender) return { error: null }
          return {
            error: {
              message: shape === 'postgrest'
                ? `Could not find the '${offender}' column of 'candidate_profiles' in the schema cache`
                : `column "${offender}" of relation "candidate_profiles" does not exist`,
            },
          }
        },
      }
    },
  }
}

test('an unknown column is dropped rather than losing the whole row', async () => {
  const client = fakeClient(['agreed_terms'])
  const result = await tolerantUpsert(client, 'candidate_profiles',
    { user_id: 'u1', full_name: 'Mufaro Guyo', agreed_terms: true }, { onConflict: 'user_id' })

  assert.equal(result.ok, true)
  assert.deepEqual(result.stripped, ['agreed_terms'])
  // The name, which is the entire point, survived.
  assert.equal(client.attempts.at(-1)?.full_name, 'Mufaro Guyo')
  assert.equal('agreed_terms' in (client.attempts.at(-1) as any), false)
})

test('both ways the database says "no such column" are understood', async () => {
  for (const shape of ['postgrest', 'postgres'] as const) {
    const client = fakeClient(['agreed_terms'], shape)
    const result = await tolerantUpsert(client, 'candidate_profiles',
      { user_id: 'u1', full_name: 'Jo Smith', agreed_terms: true }, { onConflict: 'user_id' })
    assert.equal(result.ok, true, `${shape} phrasing was not recognised`)
  }
})

test('several unknown columns are all dropped', async () => {
  const client = fakeClient(['agreed_terms', 'has_car', 'postcode'])
  const result = await tolerantUpsert(client, 'candidate_profiles',
    { user_id: 'u1', full_name: 'Vikas Verma', agreed_terms: true, has_car: false, postcode: 'BA1' },
    { onConflict: 'user_id' })
  assert.equal(result.ok, true)
  assert.deepEqual(result.stripped.sort(), ['agreed_terms', 'has_car', 'postcode'])
  assert.equal(client.attempts.at(-1)?.full_name, 'Vikas Verma')
})

// Tolerance is for schema drift and nothing else. A constraint violation or a
// refused permission is a real failure, and retrying it into a stripped-down
// row nobody asked for would be worse than the bug this fixes.
test('a real failure is still a failure', async () => {
  const client = {
    calls: 0,
    from() {
      return {
        upsert: async () => {
          client.calls++
          return { error: { message: 'duplicate key value violates unique constraint "candidate_profiles_user_id_key"' } }
        },
      }
    },
  }
  const result = await tolerantUpsert(client, 'candidate_profiles', { user_id: 'u1' }, { onConflict: 'user_id' })
  assert.equal(result.ok, false)
  assert.match((result as any).error, /duplicate key/)
  assert.equal(client.calls, 1, 'a constraint violation must not be retried')
})

test('it gives up rather than stripping a row down to nothing', async () => {
  const client = fakeClient(['a', 'b', 'c', 'd'])
  const result = await tolerantUpsert(client, 't',
    { a: 1, b: 2, c: 3, d: 4 }, { onConflict: 'user_id', maxStrips: 2 })
  assert.equal(result.ok, false)
})

// A column quietly vanishing from a write is how this hid for three days.
test('what was dropped is reported, not swallowed', async () => {
  const client = fakeClient(['agreed_terms'])
  const result = await tolerantUpsert(client, 'candidate_profiles',
    { user_id: 'u1', agreed_terms: true }, { onConflict: 'user_id' })
  assert.deepEqual(result.stripped, ['agreed_terms'])

  const route = body('src/app/api/register/init/route.ts')
  assert.match(route, /if \(seeded\.stripped\.length\)/)
  assert.match(route, /console\.error\('Talent signup wrote without unknown columns:/)
})

test('registration writes through it, and no longer writes the column that broke it', () => {
  const route = body('src/app/api/register/init/route.ts')
  assert.match(route, /await tolerantUpsert\(admin, 'candidate_profiles'/)
  assert.doesNotMatch(route, /agreed_terms/, 'the column does not exist on this table')
  // The acceptance is recorded where it always actually was.
  assert.match(route, /recordTermsAcceptance\(/)
})

// Nothing else may write it either, on this table.
//
// File-level co-occurrence is not the test: the employer route validates
// agreed_terms on employer_profiles, which does have the column, and mentions
// candidate_profiles elsewhere for its own reasons. What matters is which
// table the line belongs to, so each occurrence is attributed to the nearest
// table named above it.
test('nothing writes agreed_terms to candidate_profiles', () => {
  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(process.cwd(), dir))) {
      const rel = `${dir}/${entry}`
      if (statSync(join(process.cwd(), rel)).isDirectory()) { walk(rel); continue }
      if (!entry.endsWith('.ts')) continue
      const lines = body(rel).split('\n')
      lines.forEach((line, index) => {
        if (!/\bagreed_terms\s*:/.test(line)) return
        // The nearest table named at or above this line owns it.
        let table: string | null = null
        for (let back = index; back >= 0 && back > index - 30; back--) {
          const match = lines[back].match(/(candidate_profiles|employer_profiles)/)
          if (match) { table = match[1]; break }
        }
        if (table === 'candidate_profiles') offenders.push(`${rel}:${index + 1}`)
      })
    }
  }
  walk('src')
  assert.deepEqual(offenders, [], 'this column does not exist and refuses the whole write')
})

// The sanitiser that produced the phantom column in the first place.
test('the talent sanitiser no longer invents the column', () => {
  const lib = body('src/lib/registration.ts')
  const start = lib.indexOf('export function sanitiseTalentRegistration')
  const end = lib.indexOf('export function sanitiseEmployerRegistration')
  assert.ok(start >= 0 && end > start, 'the sanitisers moved; this test needs to follow them')
  assert.doesNotMatch(lib.slice(start, end), /agreed_terms:/)
  // The employer one keeps it, because employer_profiles does have the column.
  assert.match(lib.slice(end), /agreed_terms:/)
})

// The concierge build writes the same table for the same reason and had the
// same bug, written the same day the cause was found.
test('building a profile for somebody uses the tolerant write too', () => {
  const route = body('src/app/api/admin/profile-build/route.ts')
  assert.match(route, /await tolerantUpsert\(admin, 'candidate_profiles'/)
  assert.match(route, /if \(seeded\.stripped\.length\)/)
})
