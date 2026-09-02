import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  liveDoors,
  liveSectorsForDoor,
  liveSectorGroups,
  isSectorSelectable,
  type Taxonomy,
} from '../src/lib/sectors'

// is_live is the whole safety mechanism of Phase 0: Hospitality sits in the
// database fully wired and must not be reachable from any form, filter or
// API until an administrator opens it.

const taxonomy: Taxonomy = {
  doors: [
    { id: 'd-spa', slug: 'spa_wellness', label: 'Spa & Wellness', sort_order: 1, is_live: true },
    { id: 'd-brands', slug: 'brands', label: 'Brands', sort_order: 2, is_live: true },
    { id: 'd-hosp', slug: 'hospitality', label: 'Hospitality', sort_order: 3, is_live: false },
  ],
  sectors: [
    { id: 's-spa', slug: 'spa', label: 'Spa', door_id: 'd-spa', sort_order: 1, is_live: true },
    { id: 's-beauty', slug: 'beauty', label: 'Beauty', door_id: 'd-spa', sort_order: 2, is_live: true },
    { id: 's-dark', slug: 'dark', label: 'Not open', door_id: 'd-spa', sort_order: 3, is_live: false },
    { id: 's-edu-brands', slug: 'brand_education', label: 'Brand Education', door_id: 'd-brands', sort_order: 1, is_live: true },
    // Live sector, closed door: still unreachable.
    { id: 's-events', slug: 'events', label: 'Events', door_id: 'd-hosp', sort_order: 1, is_live: true },
    { id: 's-education', slug: 'education', label: 'Education', door_id: null, sort_order: 99, is_live: false },
  ],
}

test('only live doors are offered, in their sort order', () => {
  assert.deepEqual(liveDoors(taxonomy).map(door => door.slug), ['spa_wellness', 'brands'])
})

test('a closed sector inside an open door is not offered', () => {
  assert.deepEqual(liveSectorsForDoor(taxonomy, 'd-spa').map(s => s.slug), ['spa', 'beauty'])
})

test('a live sector inside a closed door stays closed', () => {
  // Hospitality is built and seeded; the door is what keeps it dark.
  assert.deepEqual(liveSectorsForDoor(taxonomy, 'd-hosp'), [])
  assert.equal(isSectorSelectable(taxonomy, 's-events'), false)
})

test('a sector belonging to no door can never be selected', () => {
  assert.equal(isSectorSelectable(taxonomy, 's-education'), false)
  const groups = liveSectorGroups(taxonomy)
  assert.ok(groups.every(group => group.sectors.every(sector => sector.slug !== 'education')))
})

test('grouping returns live doors that actually have something in them', () => {
  const groups = liveSectorGroups(taxonomy)
  assert.deepEqual(groups.map(group => group.door.slug), ['spa_wellness', 'brands'])
  assert.deepEqual(groups[0].sectors.map(s => s.slug), ['spa', 'beauty'])
})

test('an unknown id is never selectable', () => {
  assert.equal(isSectorSelectable(taxonomy, 'nonsense'), false)
})

// The professional's sector picker posts ids straight to the API, so the API
// has to re-check them rather than trusting what the form sends.
test('the talent sector API refuses a sector that is not open', () => {
  const source = readFileSync(new URL('../src/app/api/talent/sectors/route.ts', import.meta.url), 'utf8')
  assert.match(source, /isSectorSelectable/, 'the API must check each id against the live taxonomy')
  assert.match(source, /not open yet/, 'and refuse rather than silently dropping it')
})

// Filtering after a paginated query would report the wrong totals, so door
// and sector have to reach the query itself.
test('the public jobs query filters on sector rather than post-filtering', () => {
  const route = readFileSync(new URL('../src/app/api/jobs/public/route.ts', import.meta.url), 'utf8')
  assert.match(route, /p_sector_id/, 'the sector must be passed into the RPC')
  assert.match(route, /p_door_id/, 'and so must the door')
  const migration = readFileSync(new URL('../supabase/migrations/20260902120000_phase_0_sector_foundations.sql', import.meta.url), 'utf8')
  assert.match(migration, /p_sector_id uuid default null/, 'the RPC must accept it with a default so old callers keep working')
  assert.match(migration, /p_door_id uuid default null/)
})

test('every role gets a sector, and the column is only made required once backfilled', () => {
  const migration = readFileSync(new URL('../supabase/migrations/20260902120000_phase_0_sector_foundations.sql', import.meta.url), 'utf8')
  const backfill = migration.indexOf("set sector_id = (select id from public.sectors where slug = 'spa')")
  const notNull = migration.indexOf('alter column sector_id set not null')
  assert.ok(backfill > -1 && notNull > backfill, 'the backfill must run before the NOT NULL')
})
