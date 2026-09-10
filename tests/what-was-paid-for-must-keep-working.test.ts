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

// Employer Group is an annual membership carrying twenty included job
// listings. annual_jobs_used was set to zero once, when the membership was
// bought, and nothing ever reset it - so a member who used their twenty in
// year one paid PS999 to renew into an allowance that was already spent.
test('a renewed membership gets the year it paid for', () => {
  const webhook = body('src/app/api/stripe/webhook/route.ts')
  const paidInvoice = webhook.slice(webhook.indexOf("case 'invoice.paid'"), webhook.indexOf("case 'invoice.payment_failed'"))
  assert.match(paidInvoice, /annual_jobs_used: 0/, 'a renewal must restore the year')
  assert.match(paidInvoice, /annual_job_allowance: EMPLOYER_MEMBERSHIPS\.group\.includedJobs/)
  // Only the tier that has an allowance. Pro and free carry none, and a blunt
  // update would hand them twenty.
  assert.match(paidInvoice, /\.eq\('membership_tier', 'group'\)/)
})

// A shortlist entry is one of the relationships /api/messages/send accepts as
// permission to write to a professional. Discover Talent refuses free accounts
// at the API; this route did not, so a free account could POST a candidate id
// to it and message anybody on the register.
test('shortlisting a stranger is not free', () => {
  const route = body('src/app/api/shortlist/route.ts')
  assert.match(route, /isPremium\(profile, 'employer_talent_search'\)/)
  const post = route.slice(route.indexOf('export async function POST'), route.indexOf('export async function PATCH'))
  assert.match(post, /mayShortlist\(/, 'the POST must ask before inserting')
  assert.match(post, /status: 402/)
  // A Standard advert sells "applications and shortlist", so an applicant
  // stays shortlistable whatever the property's tier is today.
  const gate = route.slice(route.indexOf('async function mayShortlist'), route.indexOf('export async function GET'))
  assert.match(gate, /from\('applications'\)/)
})

// Filtering used to run in the browser over whatever page had been loaded, so
// on a register of six hundred, typing "massage" said there were two.
test('a search of the register searches the register', () => {
  const route = body('src/app/api/employer/candidates/route.ts')
  assert.match(route, /searchParams\.get\('q'\)/)
  assert.match(route, /searchParams\.get\('specialism'\)/)
  assert.match(route, /function matchesFilters/)
  // It must run on the presented candidate: a professional in Private Career
  // Mode must not be findable by typing the real name she has hidden.
  const loop = route.slice(route.indexOf('const matched'), route.indexOf('const pageCandidates'))
  assert.match(loop, /const scored = scoreCandidate\(row\)/)
  assert.match(loop, /matchesFilters\(scored/)
  assert.match(route, /MAX_SCAN/, 'the scan has to be bounded')

  const page = body('src/app/employer/candidates/page.tsx')
  assert.match(page, /params\.set\('q', appliedSearch\)/)
  assert.match(page, /params\.set\('specialism', appliedSpec\)/)
})

// Rendered on the form, collected into state, shown on the advert, and left
// out of the payload - so "where this role is worked from" was always blank.
test('a field on the form reaches the advert', () => {
  const page = read('src/app/employer/post-role/page.tsx')
  const payload = page.slice(page.indexOf('const payload=()=>('), page.indexOf('async function saveDraft'))
  assert.match(payload, /work_setting:form\.work_setting/)
})

// A certificate sat at 'submitted' until somebody remembered to open the
// review queue. Verification is the whole promise of the register.
test('a certificate waiting for review says so', () => {
  const route = body('src/app/api/talent/certificates/route.ts')
  const post = route.slice(route.indexOf('export async function POST'), route.indexOf('export async function DELETE'))
  assert.match(post, /notifyAdmins\(/)
  assert.match(post, /\/admin\/certificates/)
})

// Seventeen files posted to Resend directly, so "did they get it?" had no
// answer for any of them: no email_log row, no failure record, nothing.
test('every email the platform sends is written down', () => {
  const files = [
    'src/app/api/admin/content/route.ts',
    'src/app/api/admin/campaigns/route.ts',
    'src/app/api/contact-notify/route.ts',
    'src/app/api/talent/applications/offer/route.ts',
    'src/app/api/application-decision-email/route.ts',
    'src/app/api/employer/recruitment/route.ts',
    'src/app/api/employer/applications/complete-hire/route.ts',
    'src/app/api/employer/applications/decision/route.ts',
    'src/app/api/employer/applications/interview/route.ts',
    'src/app/api/employer/applications/interview/briefing/route.ts',
    'src/app/api/employer/applications/offer/route.ts',
    'src/app/api/job-alerts/route.ts',
    'src/app/api/applications/submit/route.ts',
    'src/lib/featured-employer-email.ts',
    'src/lib/advertising-emails.ts',
    'src/lib/privacy-consent.ts',
  ]
  for (const file of files) {
    const source = read(file)
    assert.doesNotMatch(source, /api\.resend\.com/, `${file} sends without recording it`)
    assert.match(source, /sendTransactionalEmail/, `${file} must go through the one sender`)
  }
})

// Gmail and Yahoo both expect List-Unsubscribe on anything sent in volume,
// and a reader who cannot find the way out marks the message as spam instead.
test('bulk email carries a way out in the header', () => {
  const sender = read('src/lib/send-email.ts')
  assert.match(sender, /'List-Unsubscribe'/)
  assert.match(sender, /'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'/)

  // One-click requires the endpoint to accept a POST and act without a
  // confirmation screen, because the reader never sees one.
  for (const route of ['src/app/api/newsletter/unsubscribe/route.ts', 'src/app/api/privacy/marketing/unsubscribe/route.ts']) {
    assert.match(read(route), /export async function POST/, `${route} must answer the one-click form`)
  }

  assert.match(body('src/app/api/job-alerts/route.ts'), /unsubscribeUrl: marketingUnsubscribeUrl/)
  assert.match(body('src/app/api/admin/campaigns/route.ts'), /unsubscribeUrl: recipient\.unsubscribe/)
})

// A seven-and-a-half hour shift at PS25 is PS187.50. Rounding the policy half
// to whole pounds proposed two numbers that did not add up to what was paid,
// in the one document both sides have to sign.
test('a proposed refund is right to the penny', () => {
  const route = body('src/app/api/agency/cancel/route.ts')
  assert.doesNotMatch(route, /Math\.round\(gross \/ 2\)/)
  assert.match(route, /const halfGross = Math\.round\(gross \* 50\) \/ 100/)
  assert.match(route, /halfGross\.toFixed\(2\)/)
})

// The /agency layout sets a canonical for everything beneath it, so this page
// and every professional's Agency profile told Google they were really
// /agency, which asks the index to drop them.
test('a page does not claim to be a different page', () => {
  const about = read('src/app/agency/about/page.tsx')
  assert.match(about, /canonical: 'https:\/\/talenthousecollective\.co\.uk\/agency\/about'/)
})

// robots.txt blocks /register/, and the sitemap asked Google to index it.
// Search Console reports that as an error against the whole file.
test('the sitemap does not ask for pages robots forbids', () => {
  const sitemap = read('src/app/sitemap.ts')
  const robots = read('src/app/robots.ts')
  assert.match(robots, /'\/register\/'/)
  assert.doesNotMatch(sitemap, /\/register\/talent`/)
  assert.doesNotMatch(sitemap, /\/register\/employer`/)
})

// The account was created on the sign-up button, before anybody had agreed to
// anything: the talent form never asked, and the employer form asked in the
// browser and never told the server.
test('nobody gets an account without agreeing to the terms', () => {
  const init = body('src/app/api/register/init/route.ts')
  assert.match(init, /body\.agreedTerms === true/, 'strictly true, like the marketing box')
  assert.match(init, /if \(!agreedTerms\)/)
  assert.match(init, /recordTermsAcceptance\(/, 'and it goes in the consent ledger')

  const talent = body('src/app/register/talent/page.tsx')
  assert.match(talent, /agreedTerms,/, 'the form must send it')
  assert.match(talent, /disabled=\{loading \|\| !agreedTerms\}/)
  assert.match(talent, /href="\/terms"/)

  const employer = body('src/app/register/employer/page.tsx')
  assert.match(employer, /agreedTerms: form\.agreed_terms === true/)
})

// An in-memory Map inside a serverless function counts per container, so
// "five an hour" was five an hour per instance and a cold start handed out
// five more. These are the two public forms anyone can post to.
test('a public form is limited across the whole platform', () => {
  for (const route of ['src/app/api/brands/apply/route.ts', 'src/app/api/brands/enquire/route.ts']) {
    const source = body(route)
    assert.match(source, /enforceRateLimit\(/, `${route} must use the shared limiter`)
    assert.doesNotMatch(source, /limiter\.check\(/)
    assert.match(source, /'Retry-After'/)
  }
})
