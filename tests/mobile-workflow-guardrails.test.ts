import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')

// The contract, not one implementation of it. The rule is that an offer
// cannot be made before an interview has actually happened; the website
// enforces it more strictly than the mobile branch did, counting a round as
// held only when it is either marked complete OR confirmed by the candidate
// with its time now in the past. Asserting the stricter version's shape would
// have failed a codebase that satisfies the rule better.
test('a job offer requires an interview that has actually been held', () => {
  const offer = read('src/app/api/employer/applications/offer/route.ts')
  assert.match(offer, /application_interviews/, 'the rounds must be read before an offer')
  assert.match(offer, /interviewHeld/)
  assert.match(offer, /status === 'completed'/)
  // Marked-complete is not the only way a round counts, and a scheduled time
  // in the future must never count at all.
  assert.match(offer, /status === 'confirmed'/)
  assert.match(offer, /getTime\(\) <= Date\.now\(\)/, 'a future interview has not been held')
  assert.match(offer, /An offer can be made once an interview has been confirmed and has taken place/)
})

// Same rewrite, same reason: the rule is that rounds run in order and only
// count once genuinely held. The website expresses it through previousHeld
// and an explicit complete action rather than the branch's string shapes.
test('interview rounds are confirmed, held and ordered before progression', () => {
  const route = read('src/app/api/employer/applications/interview/route.ts')
  // A round cannot be marked complete before it has been confirmed and has
  // actually taken place.
  assert.match(route, /interview\.status !== 'confirmed'/)
  assert.match(route, /This interview has not taken place yet/)
  // A later round waits for the previous one.
  assert.match(route, /previousHeld/)
  assert.match(route, /roundNumber - 1/)
  assert.match(route, /The previous interview needs to be confirmed by the candidate and to have taken place/)
  // And nobody reaches interview without being shortlisted first.
  assert.match(route, /Shortlist the candidate before inviting them to interview/)
})

test('employer mobile application UI mirrors the website recruitment sequence', () => {
  const screen = read('mobile/app/application/[id].tsx')
  const detailRoute = read('src/app/api/employer/applications/detail/route.ts')

  assert.match(screen, /\/api\/employer\/applications\/detail/)
  assert.match(screen, /SUBMITTED APPLICATION/)
  assert.match(screen, /Review the person before the process/)
  assert.match(screen, /Covering letter/)
  assert.match(screen, /Open candidate CV/)
  assert.match(screen, /Career evidence/)
  assert.match(screen, /Qualifications/)
  assert.match(screen, /Product houses/)
  assert.match(screen, /Systems/)
  assert.match(screen, /Business skills/)

  assert.match(screen, /const underReview=\['pending','reviewed'\]\.includes\(application\.status\)/)
  assert.match(screen, /const shortlisted=application\.status==='shortlisted'/)
  assert.match(screen, /const interviewing=application\.status==='interview'/)
  assert.match(screen, /const rejected=application\.status==='rejected'/)
  assert.match(screen, /const canArrangeFirst=shortlisted&&!roundOne/)
  assert.match(screen, /const canArrangeSecond=interviewing&&completed\.length===1&&!roundTwo&&!openInterview/)
  assert.match(screen, /const offerReady=interviewing&&completed\.length>0&&!openInterview/)

  assert.match(screen, /Shortlist candidate/)
  assert.match(screen, /Arrange the first interview/)
  assert.match(screen, /Second interview/)
  assert.match(screen, /Make offer/)
  assert.match(screen, /Not progressing/)
  assert.match(screen, /Reopen application/)
  assert.match(screen, /\/api\/employer\/applications\/reopen/)
  assert.match(screen, /Mark interview completed/)
  assert.match(screen, /roundNumber/)
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

test('AI recruitment messaging cannot skip website stages', () => {
  const route = read('src/app/api/employer/applications/message-ai/route.ts')
  assert.match(route, /intent === 'interview' && !\['shortlisted', 'interview'\]\.includes\(status\)/)
  assert.match(route, /intent === 'offer'/)
  assert.match(route, /completedInterviews < 1/)
})

test('rejected applications can be deliberately reopened by the employer', () => {
  const route = read('src/app/api/employer/applications/reopen/route.ts')
  assert.match(route, /application\.status !== 'rejected'/)
  assert.match(route, /status: 'reviewed'/)
  assert.match(route, /Your application has been reopened/)
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

// This test was written when a right swipe on mobile created a draft
// application. The website deliberately does not work that way, and the two
// were reconciled the other way round: a swipe is interest only, and applying
// is a separate, deliberate Apply -> Review & Send journey. The test now
// asserts that reconciliation rather than the behaviour it replaced.
test('mobile recruitment mirrors the website matching state machine', () => {
  const talentJobs = read('mobile/app/jobs.tsx')
  const employerMatch = read('mobile/app/match.tsx')
  const swipeApi = read('src/app/api/mobile/job-swipes/route.ts')

  assert.match(employerMatch, /['"]Pass['"]/)
  assert.match(employerMatch, /Interested/)

  // Interest is private and reversible, and it is not an application.
  assert.match(talentJobs, /Interested tells the property privately/)
  assert.match(talentJobs, /passed/)
  assert.match(swipeApi, /A right swipe is interest only, exactly as on the website/)
  assert.doesNotMatch(swipeApi, /from\('applications'\)\s*\n?\s*\.insert/,
    'a swipe must never create an application behind the person doing it')
})

test('shared Talent routes accept mobile bearer authentication', () => {
  const saved = read('src/app/api/saved-jobs/route.ts')
  const withdraw = read('src/app/api/applications/withdraw/route.ts')
  assert.match(saved, /getRequestUser\(req\)/)
  assert.match(withdraw, /getRequestUser\(req\)/)
})
