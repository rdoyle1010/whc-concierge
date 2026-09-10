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
