import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// cover_letter was written in exactly one place on this platform: the moment
// of submission. So a professional who spent twenty minutes on a covering
// letter and pressed the button marked "Keep as Draft" lost every word, with
// no warning and nothing to recover.

test('a draft can hold the letter written into it', () => {
  const route = body('src/app/api/applications/draft/route.ts')
  assert.match(route, /body\.coverLetter/, 'the route must accept a letter')
  assert.match(route, /cover_letter: keep/, 'and persist it')
})

test('every way out of the draft keeps it', () => {
  const workspace = body('src/components/TalentApplicationsWorkspace.tsx')
  assert.match(workspace, /async function keepDraft\(\)/)
  assert.match(workspace, /\/api\/applications\/draft/)
  // The button, the backdrop and the close cross were three separate ways to
  // lose the same work.
  assert.equal((workspace.match(/keepDraft/g) || []).length, 4,
    'the handler, the button, the backdrop and the close cross')
  assert.doesNotMatch(workspace, /onClick=\{\(\)=>setDraft\(null\)\}/,
    'no route out of the modal may discard the letter')
  // And a failure has to say so rather than closing anyway.
  assert.match(workspace, /Copy it somewhere safe before closing/)
})

// The route's own comment said the in-app notification always fires. Two
// continues three lines above it meant that choosing Daily or Weekly turned
// off every alert on the platform, and there is no digest job to make up the
// difference.
test('choosing a quieter inbox does not turn off the platform', () => {
  const route = read('src/app/api/job-alerts/route.ts')
  const beforeNotification = route.slice(0, route.indexOf('createNotification'))
  assert.doesNotMatch(beforeNotification, /job_alerts_frequency[^\n]*continue/,
    'frequency is a question about email, asked before the in-app notification')
  assert.doesNotMatch(beforeNotification, /emailAllowed\([^)]*\)\)\) continue/,
    'so is email consent')

  const afterNotification = route.slice(route.indexOf('createNotification'))
  assert.match(afterNotification, /wantsInstantEmail/, 'both belong to the email')
  assert.match(afterNotification, /emailAllowed/)
})

// A property pays for an advert by the month. Nothing takes one down: no
// scheduled job flips is_live, and the admin health check already counts
// "live but expired" as a warning. The public list filters expiry inside its
// RPC; the other two public surfaces did not.
test('an advert whose term has ended is not still on sale', () => {
  for (const page of ['src/app/roles/page.tsx', 'src/app/jobs/[id]/page.tsx']) {
    const source = read(page)
    assert.match(source, /expires_at\.is\.null,expires_at\.gt\./,
      `${page} showed adverts the property had stopped paying for`)
  }
})

// Both booking actions checked only whether a property had paid to be a
// Preferred Employer, never whether it had been approved.
test('an unapproved property cannot send a shift to a real person', () => {
  const core = body('src/app/api/agency/booking/core.ts')
  const create = core.slice(core.indexOf("if (action === 'create')"), core.indexOf("if (action === 'accept'"))
  assert.match(create, /approval_status !== 'approved'/)

  const urgent = core.slice(core.indexOf("if (action === 'urgent_cascade')"))
  assert.match(urgent, /approval_status !== 'approved'/)
  // urgent_cascade broadcasts to the whole register rather than to one named
  // person, so the licensing gate matters more there, not less.
  assert.match(urgent, /productAvailableIn\('agency'/)
})

// The first item in the main navigation and the highest-priority page in the
// sitemap prerendered to an empty document.
test('the jobs page is never an empty document', () => {
  const page = read('src/app/jobs/page.tsx')
  assert.doesNotMatch(page, /<Suspense fallback=\{null\}>/,
    'a searchParams subtree bails out of prerendering, so the fallback is the static HTML')
  assert.match(page, /<Suspense fallback=\{<JobsShell\/>\}>/)
  const shell = page.slice(page.indexOf('function JobsShell'), page.indexOf('export default function PublicJobsPage'))
  assert.match(shell, /<h1/, 'a crawler needs a heading')
  assert.match(shell, /<Navbar\/>/)
  assert.match(shell, /<Footer\/>/)
})
