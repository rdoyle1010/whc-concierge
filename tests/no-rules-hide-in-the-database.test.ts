import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const CAPTURE = 'supabase/migrations/20260904160000_capture_database_only_objects.sql'
const sql = read(CAPTURE)

// An afternoon went on a message that refused every Agency booking on the
// platform and appeared in no file here: it came from a trigger written
// straight into the SQL editor. A sweep then found twenty-four more objects in
// the same position - functions and triggers running in production and written
// down nowhere.
//
// Six of those functions and all ten triggers are load bearing. A database
// rebuilt from this repository without them would lose its messages inbox, its
// agency payout gate, its mutual matching and its updated_at stamps, and
// nothing in the code would explain any of it.
test('every function that was database-only is now written down', () => {
  for (const fn of [
    'get_message_conversation_summaries',
    'claim_maintenance_job',
    'enforce_agency_review_before_payout',
    'refresh_agency_review_gate',
    'trg_refresh_agency_review_gate',
    'mark_agency_booking_review_complete',
    'check_mutual_match',
    'update_updated_at',
    'handle_new_candidate',
    'update_ratings_on_review',
    'increment_role_views',
    'update_thread_last_message',
    'get_academy_revenue_summary',
    'get_candidate_application_status_counts',
  ]) {
    assert.match(sql, new RegExp(`CREATE OR REPLACE FUNCTION public\\.${fn}\\b`), `${fn} must be in the repository`)
  }
})

test('every trigger that was database-only is now written down', () => {
  for (const trigger of [
    'agency_review_gate_before_payout',
    'update_applications_timestamp',
    'update_candidate_profiles_timestamp',
    'update_profiles_timestamp',
    'update_property_profiles_timestamp',
    'update_roles_timestamp',
    'on_candidate_profile_created',
    'reviews_mark_agency_complete',
    'reviews_refresh_agency_gate',
    'trigger_check_mutual_match',
  ]) {
    assert.ok(sql.includes(`'${trigger}'`), `${trigger} must be in the repository`)
  }
})

// A capture is worthless if it quietly rewrites what it is capturing. These
// are the exact definitions production runs.
test('the capture changes nothing', () => {
  // The payout gate is recorded as it is, not as it should be - that is a
  // commercial decision and it gets its own migration.
  assert.match(sql, /raise exception 'Agency payout cannot be released until both reviews are complete'/)
  assert.match(sql, /CHANGES NO BEHAVIOUR/)
  // Trigger creation is guarded, so a partial rebuild does not fail on a table
  // that does not exist yet.
  assert.match(sql, /IF to_regclass\('public\.' \|\| spec\.table_name\) IS NOT NULL THEN/)
  assert.match(sql, /DROP TRIGGER IF EXISTS %I ON public\.%I/, 'and re-running is safe')
})

// Dead code recorded as dead beats dead code rediscovered in a year.
test('what is dead is named as dead', () => {
  const deadBlock = sql.slice(sql.indexOf('-- Dead, and recorded as dead'), sql.indexOf('CREATE OR REPLACE FUNCTION public.handle_new_candidate'))
  for (const fn of ['handle_new_candidate', 'update_ratings_on_review', 'increment_role_views', 'update_thread_last_message']) {
    assert.ok(deadBlock.includes(fn), `${fn} must be explained, not merely copied`)
  }
  assert.match(deadBlock, /platform stores 'talent'/, 'with the reason it never fires')
  assert.match(deadBlock, /Superseded/, 'and the reason it was replaced')
})

// The whole point: a rule that decides who can do what must be findable by
// searching this repository.
test('the two rules that block people are both in the repository', () => {
  const migrations = readdirSync(new URL('../supabase/migrations', import.meta.url)).join(' ')
  assert.ok(migrations.includes('agency_radius_is_the_professionals_choice'), 'the radius rule')
  assert.ok(migrations.includes('capture_database_only_objects'), 'and the payout gate')
  // Both were found by grep only after they were written down. That is the test.
  const all = readdirSync(new URL('../supabase/migrations', import.meta.url))
    .filter(f => f.endsWith('.sql'))
    .map(f => read(`supabase/migrations/${f}`))
    .join('\n')
  assert.match(all, /Agency payout cannot be released until both reviews are complete/)
  assert.match(all, /enforce_mutual_agency_radius/)
})
