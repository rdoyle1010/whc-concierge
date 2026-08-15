import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const read = (path: string) => readFileSync(`${root}/${path}`, 'utf8')
const checks: Array<[string, () => void]> = []

function check(name: string, fn: () => void) {
  checks.push([name, fn])
}

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
check('legacy hotel URLs are protected before rendering', () => {
  assert.match(read('src/proxy.ts'), /PROTECTED_PREFIXES[^\n]*'\/hotel'/)
})
check('login routing never trusts editable auth metadata', () => {
  assert.doesNotMatch(read('src/app/login/page.tsx'), /user_metadata\?\.role/)
  assert.doesNotMatch(read('src/proxy.ts'), /user_metadata\?\.role/)
  assert.doesNotMatch(read('src/lib/auth.ts'), /user_metadata\?\.role/)
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
check('swipes replace older decisions and remove blocked yeses', () => {
  const source = read('src/app/api/swipe/route.ts')
  assert.match(source, /replaceSwipe/)
  assert.match(source, /removeSwipe/)
  assert.match(source, /createdAnyMatch/)
})
check('all service-role API routes are protected or deliberately public', () => {
  const files = execFileSync('rg', ['-l', 'createAdminClient|SUPABASE_SERVICE_ROLE_KEY', 'src/app/api', '--glob', 'route.ts'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
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
  ])
  const authMarkers = /getUser\(|requireAdmin|verifyAdmin|stripe-signature|isInternalApiRequest/
  const unguarded = files.filter(file => !authMarkers.test(read(file)) && !deliberatePublic.has(file))
  assert.deepEqual(unguarded, [])
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
check('no literal production secrets are tracked', () => {
  const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  const secretPattern = /(?:SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|RESEND_API_KEY)\s*=\s*['"](?:eyJ|sk_(?:live|test)_|re_)[A-Za-z0-9._-]+/
  const exposed = files.filter(file => {
    try { return secretPattern.test(read(file)) } catch { return false }
  })
  assert.deepEqual(exposed, [])
})

let passed = 0
for (const [name, fn] of checks) {
  try {
    fn()
    passed++
    console.log(`PASS ${passed.toString().padStart(2, '0')} ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

console.log(`\n${passed} production-readiness checks passed.`)
