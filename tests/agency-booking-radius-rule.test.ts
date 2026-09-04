import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const MIGRATION = 'supabase/migrations/20260904150000_agency_radius_is_the_professionals_choice.sql'
const sql = read(MIGRATION)

// A BEFORE INSERT trigger on agency_bookings refused every offer on the
// platform with "The property must set an Agency search radius before sending
// or accepting a shift." It was written straight into the database and lived
// in no migration, so it appeared in no search of this repository - which is
// how it stayed invisible for an afternoon while the code, the tests and the
// deploys all read clean.
// The header quotes the old rule deliberately - the reason it was wrong is
// worth keeping - so these read the executable body, not the explanation.
const body = sql.slice(sql.indexOf('AS $function$'), sql.indexOf('$function$;'))

test('a search preference no longer blocks a booking', () => {
  assert.ok(!/must set an Agency search radius/.test(body), 'the message that refused every offer is gone')
  assert.ok(!/agency_search_radius_miles/.test(body), 'and the column it read is not consulted at all')
  assert.ok(!/outside the property search radius/.test(body), 'nor does a stale browsing filter overrule a chosen offer')
  assert.ok(body.length > 400, 'and the body was actually found')
})

// The professional's own travel radius is the limit that matters: they decide
// how far they will go, and an offer beyond it wastes both sides' time.
test('the professional still decides how far they will travel', () => {
  assert.match(sql, /IF miles > c_radius THEN/)
  assert.match(sql, /outside the % mile travel radius this professional has set/)
  // The haversine is unchanged - this was never a distance bug.
  assert.match(sql, /3958\.7613 \* 2 \* atan2\(sqrt\(a\), sqrt\(greatest\(0, 1-a\)\)\)/)
})

// The application treats an unset travel radius as no stated limit. A trigger
// that treats it as a refusal contradicts the screen the booking was made on.
test('an unset travel radius means no limit, not a refusal', () => {
  assert.match(sql, /IF c_radius IS NULL OR c_radius <= 0 THEN\n    RETURN NEW;/)
  assert.ok(!/professional must set a travel radius/.test(sql))
  const app = read('src/app/api/agency/booking/core.ts')
  assert.match(app, /if \(targetCand\.travel_radius_miles && \(distance == null \|\| distance > targetCand\.travel_radius_miles\)\)/,
    'which is exactly what the booking route already does')
})

// A postcode is only needed when there is a limit to check against, and the
// message has to say whose postcode is missing.
test('a location is demanded only when it is needed, and the message says whose', () => {
  assert.match(sql, /This professional has set a travel radius but no postcode/)
  assert.match(sql, /Add your property postcode in Company Profile/)
  // Both checks sit after the early return, so somebody with no stated radius
  // is never asked for a postcode in order to be booked.
  const guard = sql.indexOf('IF c_radius IS NULL OR c_radius <= 0 THEN')
  assert.ok(sql.indexOf('c_lat IS NULL') > guard)
  assert.ok(sql.indexOf('e_lat IS NULL') > guard)
})

// The rule existed only in the live database. That is what cost the afternoon.
test('the trigger is in version control now, not only in production', () => {
  assert.match(sql, /CREATE TRIGGER agency_mutual_radius_before_booking/)
  assert.match(sql, /BEFORE INSERT OR UPDATE ON public\.agency_bookings/)
  assert.match(sql, /DROP TRIGGER IF EXISTS agency_mutual_radius_before_booking/, 'and replacing it is idempotent')
  assert.match(sql, /to_regclass\('public\.agency_bookings'\) IS NOT NULL/, 'and safe on a database without the table')
})
