import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

const WEB = 'src/app/employer/jobs/page.tsx'
const APP = 'mobile/app/employer-job/[id].tsx'

const STORY_FIELDS = [
  'why_role_exists', 'success_90_days', 'reporting_line', 'team_size', 'opening_hours',
  'commercial_responsibility', 'membership_size', 'key_kpis', 'why_move',
  'career_progression', 'interview_process',
]

test('the website can edit everything the app can', () => {
  // A live role could be given a new title and salary and nothing else. Its
  // matching criteria could never be corrected, and the eleven fields that
  // make somebody want the job could be written once at Post a Role and
  // never again - so a listing with sixty wrong requirements had no route
  // back except paying to repost it.
  const web = body(WEB)
  const app = body(APP)

  const missing = STORY_FIELDS.filter(field => !web.includes(field))
  assert.deepEqual(missing, [], `the website still cannot edit: ${missing.join(', ')}`)

  // Both clients, one set of fields. If the app grows one, this fails.
  const appOnly = STORY_FIELDS.filter(field => app.includes(field) && !web.includes(field))
  assert.deepEqual(appOnly, [], `the app can edit these and the website cannot: ${appOnly.join(', ')}`)
})

test('the matching criteria are editable, and written to the column that is read', () => {
  const web = body(WEB)
  for (const list of ['required_skills', 'required_qualifications', 'required_systems', 'preferred_business_skills']) {
    assert.ok(web.includes(list), `${list} must be editable`)
  }
  // The form calls them product houses because a spa does. The column is
  // required_brands, and writing the other name puts the list somewhere
  // nothing reads.
  assert.match(web, /required_brands: form\.required_product_houses/,
    'product houses must be saved to required_brands')
})

test('editing a role still cannot take it live without paying', () => {
  // The whole point of the database guard. A bigger edit form must not
  // become a way round the checkout.
  const web = body(WEB)
  assert.match(web, /is_live: wantsActive && wasLive/,
    'a draft must not be able to publish itself from the edit form')
  assert.match(web, /status: wantsActive && !wasLive \? 'draft' : form\.status/,
    'a role that was not live saves as a draft, whatever the form says')
})
