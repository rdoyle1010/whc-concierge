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
  assert.match(route, /action\s*===\s*'complete'/)
  assert.match(route, /interview\.status\s*!==\s*'confirmed'/)
  assert.match(route, /interview\.selected_slot/)
  assert.match(route, /scheduled\.getTime\(\)\s*>\s*Date\.now\(\)/)
  assert.match(route, /previous\.status\s*!==\s*'completed'/)
  assert.match(route, /Finish or cancel the current interview stage/)
  assert.match(route, /roundNumber\s*>\s*2/)
  assert.match(route, /\['pending',\s*'reviewed',\s*'shortlisted',\s*'interview'\]\.includes\(application\.status\)/)
})

test('employer mobile application UI enforces acknowledgement then interview flow', () => {
  const screen = read('mobile/app/application/[id].tsx')
  assert.match(screen, /completedInterviews\.length\s*>\s*0/)
  assert.match(screen, /Mark interview completed/)
  assert.match(screen, /roundNumber\s*:\s*nextRound/)
  assert.match(screen, /Application received/)
  assert.match(screen, /Candidate acknowledgement sent automatically/)
  assert.match(screen, /STEP 2/)
  assert.match(screen, /writeMessage\('interview'\)/)
  assert.match(screen, /writeMessage\('offer'\)/)
  assert.match(screen, /writeMessage\('decline'\)/)
  assert.match(screen, /\['pending',\s*'reviewed',\s*'shortlisted',\s*'interview'\]\.includes\(application\.status\)/)
  assert.match(screen, /Complete the first interview/)
  assert.match(screen, /completedInterviews\.length\s*<\s*2/)
  assert.match(screen, /second interview is optional/i)
  assert.match(screen, /google_meet/)
  assert.match(screen, /zoom/)
  assert.match(screen, /candidate_note/)
  assert.match(screen, /Send new interview times/)
  assert.doesNotMatch(screen, /Draft holding update/)
  assert.doesNotMatch(screen, /Send progress update & shortlist/)
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

test('Talent Match has a complete two-sided interest response', () => {
  const talentApi = read('src/app/api/mobile/talent-interests/route.ts')
  const talentJobs = read('mobile/app/jobs.tsx')
  const employerMatch = read('mobile/app/match.tsx')

  assert.match(talentApi, /action\s*=\s*String\(body\.action/)
  assert.match(talentApi, /\['accept', 'decline'\]/)
  assert.match(talentApi, /status:\s*'pending'/)
  assert.match(talentApi, /is interested too/)

  assert.match(talentJobs, /EMPLOYER INTEREST/)
  assert.match(talentJobs, /respondToInterest/)
  assert.match(talentJobs, /I’m interested too/)
  assert.match(talentJobs, /Decline/)

  assert.match(employerMatch, /WAITING FOR TALENT RESPONSE/)
  assert.match(employerMatch, /MUTUAL INTEREST/)
  assert.match(employerMatch, /TALENT DECLINED/)
  assert.match(employerMatch, /withdrawInterest/)
})
