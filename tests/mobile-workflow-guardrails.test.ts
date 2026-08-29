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

test('employer mobile application UI shows the submitted application before recruitment actions', () => {
  const screen = read('mobile/app/application/[id].tsx')
  const detailRoute = read('src/app/api/employer/applications/detail/route.ts')

  assert.match(screen, /\/api\/employer\/applications\/detail/)
  assert.match(screen, /SUBMITTED APPLICATION/)
  assert.match(screen, /Review the person before the process/)
  assert.match(screen, /Covering letter/)
  assert.match(screen, /Open candidate CV/)
  assert.match(screen, /What they bring/)
  assert.match(screen, /Qualifications/)
  assert.match(screen, /Product houses/)
  assert.match(screen, /Systems/)
  assert.match(screen, /Business skills/)
  assert.match(screen, /completed\.length\s*>\s*0/)
  assert.match(screen, /completed\.length\s*<\s*2/)
  assert.match(screen, /Mark interview completed/)
  assert.match(screen, /roundNumber\s*:\s*nextRound/)
  assert.match(screen, /Send .*interview invitation/)
  assert.match(screen, /Make offer/)
  assert.match(screen, /Not progressing/)
  assert.match(screen, /\['pending','reviewed','shortlisted','interview'\]\.includes\(application\.status\)/)
  assert.match(screen, /google_meet/)
  assert.match(screen, /zoom/)
  assert.match(screen, /candidate_note/)
  assert.doesNotMatch(screen, /Draft holding update/)
  assert.doesNotMatch(screen, /Send progress update & shortlist/)

  assert.match(detailRoute, /getRequestUser\(req\)/)
  assert.match(detailRoute, /application\.status === 'draft'/)
  assert.match(detailRoute, /job\.employer_id !== employer\.id/)
  assert.match(detailRoute, /cover_letter/)
  assert.match(detailRoute, /createSignedUrl/)
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

test('mobile recruitment mirrors the website matching state machine', () => {
  const talentJobs = read('mobile/app/jobs.tsx')
  const employerMatch = read('mobile/app/match.tsx')
  const directoryApi = read('src/app/api/mobile/employer-directory/route.ts')
  const submitApi = read('src/app/api/applications/submit/route.ts')

  assert.match(employerMatch, /Browse candidates/)
  assert.match(employerMatch, /['"]Pass['"]/)
  assert.match(employerMatch, /Saved/)
  assert.match(employerMatch, /Interested/)
  assert.match(employerMatch, /Keep browsing/)
  assert.match(employerMatch, /\/api\/mobile\/employer-directory/)
  assert.doesNotMatch(employerMatch, /WAITING FOR TALENT RESPONSE/)
  assert.doesNotMatch(employerMatch, /TALENT DECLINED/)
  assert.doesNotMatch(employerMatch, /setView\('interested'\)/)

  assert.match(talentJobs, /Interested — review application/)
  assert.match(talentJobs, /\/api\/applications\/draft/)
  assert.match(talentJobs, /\/api\/saved-jobs/)
  assert.match(talentJobs, /['"]Pass['"]/)
  assert.doesNotMatch(talentJobs, /\/api\/mobile\/talent-interests/)
  assert.doesNotMatch(talentJobs, /I’m interested too/)
  assert.doesNotMatch(talentJobs, /EMPLOYER INTEREST/)

  assert.match(directoryApi, /\['left','right','save','unsave'\]/)
  assert.match(directoryApi, /shortlisted_candidates/)
  assert.match(directoryApi, /context_job_id:\s*job\.id/)
  assert.match(directoryApi, /candidateResponse/)

  assert.match(submitApi, /status:\s*'pending'/)
  assert.match(submitApi, /employerYes/)
  assert.match(submitApi, /messaging_unlocked:\s*true/)
  assert.match(submitApi, /mutualMatch/)
})

test('shared Talent routes accept mobile bearer authentication', () => {
  const saved = read('src/app/api/saved-jobs/route.ts')
  const withdraw = read('src/app/api/applications/withdraw/route.ts')
  assert.match(saved, /getRequestUser\(req\)/)
  assert.match(withdraw, /getRequestUser\(req\)/)
})
