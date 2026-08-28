import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')

test('a job offer requires at least one completed interview', () => {
  const offer = read('src/app/api/employer/applications/offer/route.ts')
  assert.match(offer, /\.eq\('status', 'completed'\)/)
  assert.match(offer, /completedInterviewCount/)
  assert.match(offer, /Mark at least one confirmed interview as completed/)
  assert.doesNotMatch(offer, /\['interview'\s*,\s*'shortlisted'/)
})

test('interview rounds are confirmed, completed and ordered before progression', () => {
  const route = read('src/app/api/employer/applications/interview/route.ts')
  assert.match(route, /action === 'complete'/)
  assert.match(route, /interview\.status !== 'confirmed'/)
  assert.match(route, /interview\.selected_slot/)
  assert.match(route, /scheduled\.getTime\(\) > Date\.now\(\)/)
  assert.match(route, /previous\.status !== 'completed'/)
  assert.match(route, /Finish or cancel the current interview stage/)
})

test('employer mobile application UI cannot expose offer before completed interview', () => {
  const screen = read('mobile/app/application/[id].tsx')
  assert.match(screen, /completedInterviews\.length > 0/)
  assert.match(screen, /Mark interview completed/)
  assert.match(screen, /roundNumber: nextRound/)
  assert.match(screen, /writeMessage\(draftIntent\)/)
  assert.match(screen, /Complete an interview first/)
  assert.doesNotMatch(screen, /canOffer\s*=\s*\['shortlisted'/)
})

test('Agency checkout returns through a mobile deep-link bridge', () => {
  const account = read('src/app/api/mobile/agency/account/route.ts')
  const bridge = read('src/app/mobile-return/agency/page.tsx')
  assert.match(account, /mobileReturn\('success'\)/)
  assert.match(account, /mobileReturn\('cancelled'\)/)
  assert.match(account, /mobileReturn\('billing'\)/)
  assert.match(bridge, /whctalent:\/\/agency-account/)
  assert.doesNotMatch(account, /success_url:\s*`\$\{SITE\}\/agency-account/)
})

test('job details distinguish active, draft and restartable applications', () => {
  const screen = read('mobile/app/job/[id].tsx')
  assert.match(screen, /const restartable = applicationStatus === 'rejected' \|\| applicationStatus === 'withdrawn'/)
  assert.match(screen, /const activeApplication = Boolean/)
  assert.match(screen, /Start a new application/)
  assert.match(screen, /Open application/)
  assert.match(screen, /YOUR APPLICATION DRAFT/)
})

test('mobile login routes the authenticated account by its stored role', () => {
  const login = read('mobile/app/login.tsx')
  assert.match(login, /profile\?\.role === 'employer'/)
  assert.match(login, /profile\?\.role === 'admin'/)
  assert.match(login, /Wrong sign-in area/)
})
