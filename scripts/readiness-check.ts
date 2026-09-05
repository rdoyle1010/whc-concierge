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
// The header moved into the shared trigger, so the check follows it there -
// and now also asserts that every path putting a role on the market calls it,
// which is the defect that made job alerts reach almost nobody.
check('Job alerts are fired with the internal secret', () => assert.match(read('src/lib/job-alerts-trigger.ts'), /x-whc-internal-secret/))
check('Every path that publishes a role fires its job alerts', () => {
  for (const path of [
    'src/app/api/stripe/webhook/route.ts',
    'src/app/api/mobile/employer/jobs/manage/route.ts',
    'src/app/api/admin/listings/route.ts',
  ]) assert.match(read(path), /triggerJobAlerts/)
})
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
check('the two content security policies say the same thing', () => {
  // Two CSP headers do not layer - a browser enforces the intersection. So a
  // directive relaxed in one file and left alone in the other stays blocked,
  // and nothing anywhere reports it. That is how the newsletter preview came
  // to show "This content is blocked" where the email should have been.
  const fromNext = read('next.config.js')
    .split("key: 'Content-Security-Policy'")[1]
    .split("].join('; ')")[0]
    .match(/"([^"]+)"/g)!.map(part => part.slice(1, -1))
  const fromNetlify = read('netlify.toml')
    .match(/Content-Security-Policy = "([^"]*)"/)![1]
    .split('; ')
  assert.deepEqual(fromNext, fromNetlify, 'both files must carry an identical policy')
  // The newsletter studio previews an issue in a srcdoc iframe, which is
  // checked against frame-src.
  assert.ok(fromNext.some(part => part.startsWith('frame-src') && part.includes("'self'")),
    "frame-src needs 'self' or the newsletter preview is blocked")
})
check('the public Consultancy directory serves only approved, published listings', () => {
  const route = read('src/app/api/consultancy/public/route.ts')
  assert.doesNotMatch(route, /select\('\*'\)/)
  assert.match(route, /eq\('is_live', true\)/)
  assert.match(route, /eq\('approval_status', 'approved'\)/)
  // Confidential clients are resolved to what may be shown before the response
  // leaves the server, not in the browser where the raw name would still be in
  // the payload.
  assert.match(route, /client: projectClientLabel\(project\)/)
  for (const hidden of ['approval_notes', 'view_count', 'enquiry_count']) {
    assert.doesNotMatch(route, new RegExp(`${hidden}:`), `${hidden} is not public`)
  }
})
check('Residency money has payout and dispute controls', () => {
  const admin = read('src/app/api/admin/residency-money/route.ts')
  assert.match(admin, /mark_paid_out/)
  assert.match(admin, /resolve_dispute/)
  assert.match(admin, /payout_ready/)
  assert.match(admin, /stripe\.refunds\.create/)
  assert.equal(existsSync(`${root}/supabase/migrations/042_residency_payout_controls.sql`), true)
})
check('swipes replace older decisions and keep interest separate from applications', () => {
  const source = read('src/app/api/swipe/route.ts')
  assert.match(source, /replaceSwipe/)
  assert.match(source, /calculateMatchScore/)
  assert.doesNotMatch(source, /insertApplicationDefensively/)
  assert.doesNotMatch(source, /from\('applications'\)\.insert/)
  assert.match(source, /applications are created exclusively/)
})
check('mobile application matching advises rather than blocks candidates', () => {
  const mobileSwipe = read('src/app/api/mobile/job-swipes/route.ts')
  const draft = read('src/app/api/applications/draft/route.ts')
  for (const source of [mobileSwipe, draft]) assert.match(source, /calculateMatchScore/)
  assert.doesNotMatch(mobileSwipe, /match\.score < 45|match\.score < MIN_APPLICATION_MATCH/)
  assert.doesNotMatch(draft, /match\.score < 45|match\.score < MIN_APPLICATION_MATCH/)
})
check('match page ranks roles instead of hiding low scores', () => {
  const source = read('src/app/roles/match/page.tsx')
  assert.doesNotMatch(source, /matchScore >= 45/)
  assert.match(source, /sort\(\(a:any,b:any\) => b\.matchScore - a\.matchScore\)/)
})
check('all service-role API routes are protected or deliberately public', () => {
  const files = listFiles('src/app/api', 'route.ts').filter(file => /createAdminClient|SUPABASE_SERVICE_ROLE_KEY/.test(read(file)))
  const deliberatePublic = new Set([
    // Public by design: exact-code certificate verification, rate limited,
    // reveals only what the certificate itself states.
    'src/app/api/certificates/verify/route.ts',
    'src/app/api/advertising/route.ts',
    'src/app/api/advertising/click/route.ts',
    // Public by design: read-only advert price list (label + pence only).
    'src/app/api/advertising/prices/route.ts',
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
    // Public by design: the contact form's admin notification email. Rate
    // limited; the service role only reads the configured contact_email key.
    'src/app/api/contact-notify/route.ts',
    'src/app/api/newsletter/subscribe/route.ts',
    'src/app/api/newsletter/confirm/route.ts',
    'src/app/api/newsletter/unsubscribe/route.ts',
    'src/app/api/register/init/route.ts',
    'src/app/api/residency/public/route.ts',
    // Public by design: the Consultancy directory. Unlike Residency, which is
    // anonymous until a booking, this is a showcase - the practice name, the
    // projects and the outcomes are the product. It serves only listings the
    // consultant published and WHC approved, and the shaper drops the columns
    // that are the consultant's own business (moderation notes, view and
    // enquiry counts) rather than selecting the row wholesale.
    'src/app/api/consultancy/public/route.ts',
    'src/app/api/stripe/sponsored-ad-confirm/route.ts',
    // Public by design: aggregate demand counts for the public Academy page -
    // a map of course slug to live-role count, cached, nothing per-listing.
    'src/app/api/academy/demand/route.ts',
    // Public by design: three aggregate integers for the signed-out /agency
    // marketing page (see the route's own header comment).
    'src/app/api/agency/public-stats/route.ts',
    // Public by design: three aggregate integers for the login and register
    // pages. Reviews are private to their parties, so only the count - never
    // a row - is read with the service role.
    'src/app/api/public-stats/route.ts',
    // Public by design: the door and sector taxonomy - slugs, labels and sort
    // order, nothing per-person. The public jobs page filters on it while
    // signed out, and the post-a-role and profile forms read the same list.
    'src/app/api/sectors/route.ts',
  ])
  // adminRequestUser is the actual admin guard on this platform. It was
  // missing here, so a route passed only if it happened to wrap the helper in
  // something called requireAdmin - the check was reading naming rather than
  // substance, and a correctly guarded route failed for calling it directly.
  // signInWithPassword belongs here for the same reason getUser does: a route
  // that calls it has established who the caller is before doing anything.
  // The sign-in route reconciles the copies of a member's email address after
  // a confirmed change, which needs the service role and cannot happen before
  // the password has been accepted.
  const authMarkers = /getUser\(|getRequestUser\(|adminRequestUser\(|requireAdmin|verifyAdmin|stripe-signature|isInternalApiRequest|signInWithPassword\(/
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
check('Academy course content leaves the database only when it is owned and complete', () => {
  // The earlier bug: academy_courses rows replaced code content, so rows with
  // empty or partial content silently blanked good courses. The contract now
  // is narrower and enforceable rather than a blanket ban - database content
  // reaches a learner ONLY when the admin has taken editorial control
  // (content_source = 'custom') AND the stored document passes validation.
  const source = read('src/lib/academy-catalog-server.ts')

  // 1. The raw content columns are never read for a code-defined course. The
  //    single route from database to learner is the validated document.
  const merge = source.split('const merged = base.map')[1].split('const baseSlugs')[0]
  for (const frozen of ['row.lessons', 'row.quiz', 'row.answer_key', 'row.title', 'row.minutes', 'row.category']) {
    assert.equal(merge.includes(frozen), false, `code course content must not come from ${frozen}`)
  }
  for (const editable of ['row.price', 'row.image_url', 'row.is_active', 'row.tagline', 'row.sort_order']) {
    assert.equal(merge.includes(editable), true, `admin must still control ${editable}`)
  }
  // The merge serves content only through the validated decision document.
  assert.match(merge, /decideContent\(row\)/)
  assert.match(merge, /if \(!decision\.doc\) return settled/)
  assert.match(merge, /contentFields\(course\.slug, decision\.doc/)

  // 2. Both gates live in one decision function: declared ownership, then
  //    validation. A document that fails either is refused there.
  const decide = source.split('function decideContent(')[1].split('\n}')[0]
  assert.match(decide, /content_source/)
  assert.match(decide, /=== 'custom'/)
  assert.match(decide, /validateContent\(stored\)/)
  assert.match(decide, /doc: error \? null : stored/)

  // 3. The answer key and the admin document that carries it never go public.
  assert.match(source, /content_doc: _contentDoc/)

  // 4. The same shared validator guards the API route and the editor UI, so a
  //    problem is named before a save rather than after one.
  const validator = read('src/lib/academy-course-content.ts')
  assert.match(validator, /export function validateContent/)
  const adminRoute = read('src/app/api/admin/academy/route.ts')
  const editor = read('src/app/admin/academy/[slug]/page.tsx')
  for (const consumer of [adminRoute, editor]) assert.match(consumer, /validateContent/)

  // 5. Taking control copies the platform content in first, and reverting is
  //    not destructive - both are explicit, named actions.
  assert.match(adminRoute, /take_content_control/)
  assert.match(adminRoute, /platformContentDoc/)
  assert.match(adminRoute, /revert_content/)
  assert.match(editor, /Take editorial control of this course/)
  assert.match(editor, /Revert to the platform version/)

  // 6. The commercial settings path is unchanged and still works everywhere.
  assert.match(adminRoute, /save_course_settings/)
  assert.match(adminRoute, /saveAcademyCourseSettings/)
  // An admin-set image is never overruled by a hard-coded page image. This
  // used to pin the expression `image_admin_set && image_url`, which failed
  // that intent for every course defined in code: image_admin_set is hardcoded
  // false for those, so a stock picture beat the uploaded one and the upload
  // appeared to do nothing. The rule is the intent, not the expression - the
  // uploaded image comes first, and nothing gates it.
  const chooser = read('src/app/academy/page.tsx')
  assert.match(chooser, /course\.image_url \|\| MODERN_COURSE_IMAGES/)
  assert.ok(
    !/image_admin_set && course\.image_url/.test(chooser),
    'an uploaded image must not be gated behind a flag',
  )

  // 7. Every course surface reads the same merged catalogue, so custom content
  //    reaches talent, the public page and the app together.
  assert.match(read('src/app/api/academy/catalog/route.ts'), /getAcademyCatalog/)
  // The precedence is the rule: an admin's own version wins, code content is
  // the fallback. The code content is now fetched for this one course instead
  // of imported, because the static index pulls all forty-five courses into
  // whatever bundles it and this page is a client component - every lesson of
  // every course was being downloaded to read one.
  const coursePage = read('src/app/talent/academy/[slug]/page.tsx')
  assert.match(coursePage, /const rich = course\?\.rich \|\| codeContent/)
  assert.match(coursePage, /loadCourseContent\(slug\)/)
  assert.match(coursePage, /if \(course\?\.rich\) \{ setCodeContent\(null\); return \}/, "an admin's version needs nothing fetched")
  assert.match(read('src/app/api/academy/manual/route.ts'), /academyRichContent/)

  // 8. The additive migration exists and reloads PostgREST.
  const migration = read('supabase/migrations/20260901130000_academy_course_content.sql')
  assert.match(migration, /ADD COLUMN IF NOT EXISTS content_source/)
  assert.match(migration, /ADD COLUMN IF NOT EXISTS content jsonb/)
  assert.match(migration, /NOTIFY pgrst/)
})
check('homepage hero is prioritised and public controls are accessible', () => {
  const hero = read('src/components/HeroCarousel.tsx')
  const navigation = read('src/components/Navbar.tsx')
  assert.match(hero, /src=\{slide\.image\.url\}/)
  assert.match(hero, /fetchPriority=\{current === 0 \? 'high' : 'auto'\}/)
  assert.doesNotMatch(hero, /slides\.map\(\(item, index\)[\s\S]*?<img/)
  assert.match(navigation, /aria-label=\{mobileOpen \? 'Close navigation menu' : 'Open navigation menu'\}/)
  assert.match(navigation, /aria-label="Open account menu"/)
  assert.match(read('src/app/layout.tsx'), /icons: \{ icon: logo\.url, apple: logo\.url \}/)
})
check('no literal production secrets are tracked', () => {
  const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const secretPattern = /(?:SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|RESEND_API_KEY)\s*=\s*['"](?:eyJ|sk_(?:live|test)_|re_)[A-Za-z0-9._-]+/
  const exposed = files.filter(file => { try { return secretPattern.test(read(file)) } catch { return false } })
  assert.deepEqual(exposed, [])
})

// --- Design-system rigidity: one typography, one spacing system, one colour
// system. These checks keep stray neutrals, gold, purple, em-dashes and
// decorative gradients from creeping back in after the brand sweep. ---
const designSourceFiles = () => listFiles('src').filter(file => /\.(ts|tsx|css)$/.test(file))
check('no em-dash characters under src', () => {
  const offenders = designSourceFiles().filter(file => read(file).includes('—'))
  assert.deepEqual(offenders, [])
})
check('no violet or purple Tailwind classes under src', () => {
  const offenders = designSourceFiles().filter(file => /(?:violet|purple)-\d/.test(read(file)))
  assert.deepEqual(offenders, [])
})
check('no gold hexes or gold utility classes under src', () => {
  // The .badge-gold class NAME survives in globals.css (restyled navy);
  // gold hexes and border-/text-/bg-gold utilities must not.
  const goldPattern = /#d4af37|#c9a[0-9a-f]{3}|\b(?:border|text|bg|ring|fill|shadow)-gold\b/i
  const offenders = designSourceFiles().filter(file => goldPattern.test(read(file)))
  assert.deepEqual(offenders, [])
})
check('linear-gradient appears only as image overlays or in allowlisted files', () => {
  // Allowed gradients: photo overlays for text legibility (rgba( on the same
  // line), the generated OG image, and inline email CSS - its own world.
  const gradientAllowlist = new Set([
    'src/app/blog/[slug]/opengraph-image.tsx',
    'src/lib/emails.ts',
    'src/lib/decision-email-templates.ts',
    'src/lib/application-email-templates.ts',
    'src/lib/job-alert-email-template.ts',
    'src/lib/welcome-email-template.ts',
  ])
  const offenders: string[] = []
  for (const file of designSourceFiles()) {
    if (gradientAllowlist.has(file)) continue
    for (const [index, line] of read(file).split('\n').entries()) {
      if (line.includes('linear-gradient') && !line.includes('rgba(')) offenders.push(`${file}:${index + 1}`)
    }
  }
  assert.deepEqual(offenders, [])
})
check('no stray cream or off-white surfaces under src', () => {
  // The neutral system allows warm white and #f1f1f1 only. globals.css keeps the
  // legacy .bg-gray-50 mapping selector, so this check covers ts/tsx.
  //
  // It used to read Tailwind classes alone, which meant the same two colours
  // walked straight past it as raw hexes in a style attribute: seventeen inset
  // panels across the email templates, plus the share image every link to the
  // site renders with. An email is the brand in somebody's inbox and the share
  // image is the brand in somebody's feed, so both are covered now.
  //
  // site-content-values.ts is exempt: #F7F7F7 there is the CMS "background"
  // token, deliberately a shade off the "surface" token beside it.
  const creamPattern = /bg-\[#fafafa\]|bg-\[#f7f7f7\]|bg-gray-50\b|#fafafa|#f7f7f7/i
  const offenders = designSourceFiles()
    .filter(file => /\.(ts|tsx)$/.test(file))
    .filter(file => !file.endsWith('src/lib/site-content-values.ts'))
    .filter(file => creamPattern.test(read(file)))
  assert.deepEqual(offenders, [])
})

let passed = 0
for (const [name, fn] of checks) {
  try { fn(); passed++; console.log(`PASS ${passed.toString().padStart(2, '0')} ${name}`) }
  catch (error) { console.error(`FAIL ${name}`); throw error }
}
console.log(`\n${passed} production-readiness checks passed.`)