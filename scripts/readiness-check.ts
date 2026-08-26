import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, relative } from 'node:path'

const root = process.cwd()
const read = (path: string) => readFileSync(`${root}/${path}`, 'utf8')
const checks: Array<[string, () => void]> = []

function listFiles(dir: string, fileName?: string): string[] {
  const absolute = join(root, dir)
  if (!existsSync(absolute)) return []
  const out: string[] = []
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const full = join(absolute, entry.name)
    if (entry.isDirectory()) out.push(...listFiles(relative(root, full), fileName))
    else if (!fileName || entry.name === fileName) out.push(relative(root, full).replaceAll('\\', '/'))
  }
  return out
}

function check(name: string, fn: () => void) { checks.push([name, fn]) }

check('Next.js proxy exists', () => assert.equal(existsSync(`${root}/src/proxy.ts`), true))
check('obsolete middleware is removed', () => assert.equal(existsSync(`${root}/src/middleware.ts`), false))
check('maintenance APIs are blocked', () => {
  const source = read('src/proxy.ts')
  for (const route of ['/api/seed', '/api/run-migration', '/api/fix-null-live', '/api/update-jobs']) assert.match(source, new RegExp(route.replaceAll('/', '\\/')))
})
check('registration starts through a server proof', () => assert.match(read('src/app/api/register/init/route.ts'), /createRegistrationProof/))
check('talent registration uses a strict server allowlist', () => assert.match(read('src/app/api/register/talent/route.ts'), /sanitiseTalentRegistration/))
check('employer registration uses a strict server allowlist', () => assert.match(read('src/app/api/register/employer/route.ts'), /sanitiseEmployerRegistration/))
check('opposite account registrations are rejected server-side', () => {
  assert.match(read('src/app/api/register/talent/route.ts'), /canCompleteRegistration/)
  assert.match(read('src/app/api/register/employer/route.ts'), /canCompleteRegistration/)
})
check('every private portal has a server-side role gate', () => {
  assert.equal(existsSync(`${root}/src/app/hotel/layout.tsx`), true)
  for (const file of ['src/app/talent/layout.tsx', 'src/app/employer/layout.tsx', 'src/app/hotel/layout.tsx', 'src/app/admin/layout.tsx']) {
    const source = read(file)
    assert.match(source, /auth\.getUser\(\)/)
    assert.match(source, /from\('profiles'\)/)
  }
})
check('legacy hotel URLs are protected before rendering', () => assert.match(read('src/proxy.ts'), /PROTECTED_PREFIXES[^\n]*'\/hotel'/))
check('login routing never trusts editable auth metadata', () => {
  assert.doesNotMatch(read('src/app/login/page.tsx'), /user_metadata\?\.role/)
  assert.doesNotMatch(read('src/proxy.ts'), /user_metadata\?\.role/)
  assert.doesNotMatch(read('src/lib/auth.ts'), /user_metadata\?\.role/)
})
check('login preserves supported return destinations', () => {
  const login = read('src/app/login/page.tsx')
  assert.match(login, /searchParams\.get\('redirect'\)/)
  assert.match(login, /searchParams\.get\('next'\)/)
  assert.match(login, /searchParams\.get\('returnTo'\)/)
  const access = read('src/lib/role-access.ts')
  assert.match(access, /pathname === '\/roles\/match'/)
})
check('registration uploads require proof and ownership', () => {
  const source = read('src/app/api/upload/route.ts')
  assert.match(source, /verifyRegistrationProof/)
  assert.match(source, /isOwnUserPath/)
})
check('profile photo uses the owned path convention', () => {
  const source = read('src/app/talent/profile/page.tsx')
  assert.match(source, /\$\{userId\}\/profile\/photo/)
  assert.doesNotMatch(source, /profiles\/\$\{userId\}\/photo/)
})
check('job alerts require a server-only secret', () => assert.match(read('src/app/api/job-alerts/route.ts'), /isInternalApiRequest/))
check('Stripe webhook supplies the job-alert secret', () => assert.match(read('src/app/api/stripe/webhook/route.ts'), /x-whc-internal-secret/))
check('public jobs use the sanitised public RPC', () => {
  const source = read('src/app/api/jobs/public/route.ts')
  assert.match(source, /get_public_jobs_page/)
  assert.doesNotMatch(source, /select\('\*'\)/)
  for (const field of ['job_title', 'job_description', 'salary_min', 'salary_max', 'salary_display_text', 'job_type', 'location', 'tier', 'posted_date', 'employer_profiles']) assert.match(source, new RegExp(field))
})
check('Residency payments are fulfilled by the signed Stripe webhook', () => {
  const webhook = read('src/app/api/stripe/webhook/route.ts')
  const residency = read('src/lib/residency-stripe-webhook.ts')
  assert.match(webhook, /handleResidencyStripeEvent/)
  assert.match(residency, /residency_booking/)
  assert.match(residency, /residency_listing/)
  assert.match(residency, /checkout\.session\.completed/)
  assert.match(residency, /invoice\.paid/)
  assert.match(residency, /invoice\.payment_failed/)
  assert.match(residency, /customer\.subscription\.updated/)
  assert.match(residency, /customer\.subscription\.deleted/)
  assert.match(residency, /alreadyFulfilled/)
})
check('public Residency data is sanitised and membership-gated', () => {
  const route = read('src/app/api/residency/public/route.ts')
  const mapper = read('src/lib/residency-public.ts')
  assert.match(route, /residency_member/)
  assert.match(route, /residency_subscription_status/)
  assert.match(route, /toPublicResidencyProfile/)
  assert.doesNotMatch(route, /select\('\*'\)/)
  assert.match(mapper, /scrubContactText/)
  assert.match(mapper, /residencyReference/)
  assert.doesNotMatch(mapper, /profile_photo_url:/)
  assert.doesNotMatch(mapper, /full_name:/)
})
check('Residency money has payout and dispute controls', () => {
  const admin = read('src/app/api/admin/residency-money/route.ts')
  assert.match(admin, /mark_paid_out/)
  assert.match(admin, /resolve_dispute/)
  assert.match(admin, /payout_ready/)
  assert.match(admin, /stripe\.refunds\.create/)
  assert.equal(existsSync(`${root}/supabase/migrations/042_residency_payout_controls.sql`), true)
})
check('swipes replace older decisions and remove blocked yeses', () => {
  const source = read('src/app/api/swipe/route.ts')
  assert.match(source, /replaceSwipe/)
  assert.match(source, /removeSwipe/)
  assert.match(source, /calculateMatchScore/)
})
check('weak or mandatory-fail matches cannot apply', () => {
  const swipe = read('src/app/api/swipe/route.ts')
  const draft = read('src/app/api/applications/draft/route.ts')
  for (const source of [swipe, draft]) {
    assert.match(source, /hardStop/)
    assert.match(source, /score < 45|match\.score < 45|result\.score < 45|score < MIN_APPLICATION_MATCH|match\.score < MIN_APPLICATION_MATCH|result\.score < MIN_APPLICATION_MATCH/)
  }
})
check('match page ranks roles instead of hiding low scores', () => {
  const source = read('src/app/roles/match/page.tsx')
  assert.doesNotMatch(source, /matchScore >= 45/)
  assert.match(source, /sort\(\(a:any,b:any\) => b\.matchScore - a\.matchScore\)/)
})
check('all service-role API routes are protected or deliberately public', () => {
  const files = listFiles('src/app/api', 'route.ts').filter(file => /createAdminClient|SUPABASE_SERVICE_ROLE_KEY/.test(read(file)))
  const deliberatePublic = new Set([
    'src/app/api/advertising/route.ts',
    'src/app/api/advertising/click/route.ts',
    'src/app/api/agency/directory/route.ts',
    'src/app/api/fix-employer-columns/route.ts',
    'src/app/api/fix-null-live/route.ts',
    'src/app/api/fix-taxonomy-rls/route.ts',
    'src/app/api/run-migration/route.ts',
    'src/app/api/seed-residencies/route.ts',
    'src/app/api/seed-taxonomy/route.ts',
    'src/app/api/seed/route.ts',
    'src/app/api/update-jobs/route.ts',
    'src/app/api/jobs/public/route.ts',
    'src/app/api/properties/[id]/reviews/route.ts',
    'src/app/api/privacy/marketing/confirm/route.ts',
    'src/app/api/privacy/marketing/unsubscribe/route.ts',
    'src/app/api/newsletter/config/route.ts',
    'src/app/api/newsletter/subscribe/route.ts',
    'src/app/api/newsletter/confirm/route.ts',
    'src/app/api/newsletter/unsubscribe/route.ts',
    'src/app/api/residency/public/route.ts',
    'src/app/api/stripe/sponsored-ad-confirm/route.ts',
  ])
  const authMarkers = /getUser\(|getRequestUser\(|requireAdmin|verifyAdmin|stripe-signature|isInternalApiRequest/
  const unguarded = files.filter(file => !authMarkers.test(read(file)) && !deliberatePublic.has(file))
  assert.deepEqual(unguarded, [])
})
check('marketing campaigns require confirmed consent and one-click unsubscribe', () => {
  const campaign = read('src/app/api/admin/campaigns/route.ts')
  assert.match(campaign, /marketing_email_status', 'confirmed'/)
  assert.match(campaign, /marketingUnsubscribeUrl/)
  assert.match(campaign, /excluded_without_confirmed_consent/)
  assert.equal(existsSync(`${root}/src/app/api/privacy/marketing/request/route.ts`), true)
  assert.equal(existsSync(`${root}/src/app/api/privacy/marketing/confirm/route.ts`), true)
  assert.equal(existsSync(`${root}/src/app/api/privacy/marketing/unsubscribe/route.ts`), true)
})
check('newsletter popup uses double opt-in and one-click unsubscribe', () => {
  const subscribe = read('src/app/api/newsletter/subscribe/route.ts')
  const confirm = read('src/app/api/newsletter/confirm/route.ts')
  const unsubscribe = read('src/app/api/newsletter/unsubscribe/route.ts')
  assert.match(subscribe, /sendNewsletterDoubleOptInEmail/)
  assert.match(subscribe, /status: 'pending'/)
  assert.match(confirm, /status: 'confirmed'/)
  assert.match(unsubscribe, /status: 'unsubscribed'/)
  assert.equal(existsSync(`${root}/src/components/NewsletterSignupBar.tsx`), true)
  assert.equal(existsSync(`${root}/supabase/migrations/054_newsletter_double_opt_in_subscribers.sql`), true)
})
check('public adverts require Stripe payment and admin approval', () => {
  for (const file of ['src/app/api/advertising/route.ts', 'src/app/api/advertising/click/route.ts']) {
    const source = read(file)
    assert.match(source, /payment_status[^\n]*paid/)
    assert.match(source, /review_status[^\n]*approved/)
    assert.match(source, /status[^\n]*active/)
  }
})
check('Academy catalogue never returns quiz answer keys', () => {
  assert.match(read('src/app/api/academy/catalog/route.ts'), /publicCourse/)
  assert.match(read('src/lib/academy-catalog-server.ts'), /answer_key: _answerKey/)
})
check('homepage hero is prioritised and public controls are accessible', () => {
  const hero = read('src/components/HeroCarousel.tsx')
  const navigation = read('src/components/Navbar.tsx')
  assert.match(hero, /src=\{slide\.image\.url\}/)
  assert.match(hero, /fetchPriority=\{current === 0 \? 'high' : 'auto'\}/)
  assert.doesNotMatch(hero, /slides\.map\(\(item, index\)[\s\S]*?<img/)
  assert.match(navigation, /aria-label=\{mobileOpen \? 'Close navigation menu' : 'Open navigation menu'\}/)
  assert.match(navigation, /aria-label="Open account menu"/)
  assert.match(read('src/app/layout.tsx'), /icon: '\/images\/whc-logo\.jpg'/)
})
check('no literal production secrets are tracked', () => {
  const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const secretPattern = /(?:SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|RESEND_API_KEY)\s*=\s*['"](?:eyJ|sk_(?:live|test)_|re_)[A-Za-z0-9._-]+/
  const exposed = files.filter(file => { try { return secretPattern.test(read(file)) } catch { return false } })
  assert.deepEqual(exposed, [])
})

let passed = 0
for (const [name, fn] of checks) {
  try { fn(); passed++; console.log(`PASS ${passed.toString().padStart(2, '0')} ${name}`) }
  catch (error) { console.error(`FAIL ${name}`); throw error }
}
console.log(`\n${passed} production-readiness checks passed.`)
