import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fieldAppliesToRole, isBrandRole, WORK_SETTINGS } from '../src/lib/role-form-shape'
import { doorSlugForSector, type Taxonomy } from '../src/lib/sectors'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// Posting a Regional Education Manager at a product house meant answering what
// time the spa opens, how many members it has, what shift pattern the role
// works and which spa booking systems the candidate needs. None of it applies.
// The person filling the form either invents answers, which then print onto
// the public advert, or gives up - and either way the Brands door reads as an
// afterthought bolted onto a spa platform.
//
// The form has asked which door a role sits in before anything else since it
// was built. It simply never used the answer.

test('spa furniture is left off a brand role', () => {
  for (const field of ['opening_hours', 'membership_size', 'shift_pattern', 'required_systems', 'radius_miles']) {
    assert.equal(fieldAppliesToRole(field, 'brands'), false, `${field} describes a venue, not a brand job`)
    assert.equal(fieldAppliesToRole(field, 'spa_wellness'), true, `${field} still belongs on a spa role`)
  }
})

test('an unknown door loses nothing', () => {
  // Hospitality is built and dark. A door this function has never been taught
  // about must look exactly as it always did, never mysteriously shorter.
  for (const field of ['opening_hours', 'shift_pattern', 'required_systems', 'radius_miles']) {
    assert.equal(fieldAppliesToRole(field, 'hospitality'), true)
    assert.equal(fieldAppliesToRole(field, null), true)
    assert.equal(fieldAppliesToRole(field, undefined), true)
  }
})

test('where the work happens is asked only where the answer varies', () => {
  assert.equal(fieldAppliesToRole('work_setting', 'brands'), true)
  assert.equal(fieldAppliesToRole('work_setting', 'spa_wellness'), false,
    'a spa role is worked at the spa; asking would be noise')
  assert.ok((WORK_SETTINGS as readonly string[]).includes('Field-based'))
  assert.ok((WORK_SETTINGS as readonly string[]).includes('Head office'))
  assert.ok(isBrandRole('brands') && !isBrandRole('spa_wellness'))
})

test('a saved role can find its way back to its door', () => {
  // The form asks door then sector, but only the sector is stored. Anything
  // editing a role afterwards has to work back the other way.
  const taxonomy: Taxonomy = {
    doors: [
      { id: 'd1', slug: 'spa_wellness', label: 'Spa & Wellness', sort_order: 1, is_live: true },
      { id: 'd2', slug: 'brands', label: 'Brands', sort_order: 2, is_live: true },
    ],
    sectors: [
      { id: 's1', slug: 'spa', label: 'Spa', door_id: 'd1', sort_order: 1, is_live: true },
      { id: 's2', slug: 'brand_education', label: 'Brand Education', door_id: 'd2', sort_order: 1, is_live: true },
      { id: 's3', slug: 'education', label: 'Education', door_id: null, sort_order: 9, is_live: false },
    ],
  }
  assert.equal(doorSlugForSector(taxonomy, 's2'), 'brands')
  assert.equal(doorSlugForSector(taxonomy, 'brand_education'), 'brands', 'by slug as well as by id')
  assert.equal(doorSlugForSector(taxonomy, 's1'), 'spa_wellness')
  assert.equal(doorSlugForSector(taxonomy, 's3'), null, 'a sector under no door has no door')
  assert.equal(doorSlugForSector(taxonomy, null), null)
  assert.equal(doorSlugForSector(taxonomy, 'nonsense'), null)
})

test('the form actually consults the door it already asked for', () => {
  const page = read('src/app/employer/post-role/page.tsx')
  for (const field of ['opening_hours', 'shift_pattern', 'required_systems', 'radius_miles']) {
    assert.ok(page.includes(`applies('${field}')`), `${field} must be gated on the door`)
  }
  assert.match(page, /isBrandRole\(doorSlug\)/, 'and the work setting must appear for brand roles')
})

test('the edit form asks the same questions the posting form did', () => {
  // A brand employer posting a clean form and then meeting spa opening hours
  // again on their first edit is the same fault, one screen later. A saved
  // role stores only its sector, so the door has to be worked back to.
  const page = read('src/app/employer/jobs/page.tsx')
  assert.match(page, /doorSlugForSector\(taxonomy, editing\?\.sector_id \|\| editing\?\.sector\)/,
    'the editor must work out which door the saved role belongs to')
  for (const field of ['opening_hours', 'shift_pattern']) {
    assert.ok(page.includes(`applies('${field}')`), `${field} must be gated in the editor too`)
  }
  assert.match(page, /isBrandRole\(doorSlug\)/, 'and offer the work setting on a brand role')
  assert.match(page, /work_setting: job\.work_setting/, 'and load the saved value')
  assert.match(page, /work_setting: form\.work_setting/, 'and save it back')
})

test('a work setting reaches the database', () => {
  // A field the form collects and the route drops is worse than no field: the
  // employer answers it, sees it saved, and it was never stored.
  const page = read('src/app/employer/post-role/page.tsx')
  assert.match(page, /work_setting:form\.work_setting/, 'the payload must carry it')
  assert.match(page, /work_setting:j\.work_setting/, 'and a reopened draft must restore it')
  assert.match(read('src/app/api/employer/jobs/create/route.ts'), /'work_setting'/,
    'and the route must accept it')
})
