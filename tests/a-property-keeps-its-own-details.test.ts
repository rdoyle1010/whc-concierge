import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const MIGRATION = 'supabase/migrations/20260910150000_a_property_keeps_its_own_details.sql'

// The columns the migration takes away from a signed-in browser. Kept here as
// well as in the SQL because this test is the thing that stops one of them
// creeping back into a page.
const PRIVATE_COLUMNS = [
  'email', 'contact_email', 'work_email',
  'phone', 'contact_phone',
  'contact_name', 'gm_name', 'spa_director_name',
  'address', 'latitude', 'longitude',
  'stripe_customer_id', 'membership_stripe_customer_id',
  'membership_stripe_subscription_id', 'purchase_order_ref',
  'membership_tier', 'membership_started_at', 'membership_renews_at',
  'membership_cancel_at_period_end', 'membership_past_due',
  'annual_job_allowance', 'annual_jobs_used', 'launch_listing_credits',
  'talent_search_until',
  'approval_notes', 'verification_notes',
  'sms_opt_in',
]

// Everything that runs with the publishable key on a visitor's own session:
// the browser bundles, the mobile app, and the middleware. Excludes API routes
// and src/lib, which hold the service role and are meant to see everything.
function browserFiles(): string[] {
  const found: string[] = ['src/proxy.ts']
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(process.cwd(), dir))) {
      if (entry === 'node_modules' || entry === '.expo' || entry === 'api') continue
      const rel = `${dir}/${entry}`
      if (statSync(join(process.cwd(), rel)).isDirectory()) walk(rel)
      else if (/\.(ts|tsx)$/.test(entry)) found.push(rel)
    }
  }
  walk('src/app')
  walk('src/components')
  walk('mobile/app')
  return found
}

// 040 wrote one row policy for both browser roles and left both holding SELECT
// on every column. A later migration narrowed the columns for anon and not for
// authenticated, so any signed-in account could read every approved property's
// contact details straight from the browser. A column privilege belongs to the
// role, not the row, which is why no policy was ever going to catch this.
test('a signed-in browser cannot read a property it does not own', () => {
  const sql = read(MIGRATION)
  assert.match(sql, /REVOKE SELECT ON TABLE public\.employer_profiles FROM authenticated/)
  assert.match(sql, /GRANT SELECT \(%s\) ON public\.employer_profiles TO authenticated/)
  for (const column of PRIVATE_COLUMNS) {
    assert.match(sql, new RegExp(`'${column}'`), `${column} must be named in the deny list`)
  }
  // A deny list, not an allow list: an allow list has to be complete or a page
  // silently loses a field, and it goes stale the moment somebody adds a
  // column. This reads the real column list at run time.
  assert.match(sql, /FROM information_schema\.columns/)
  assert.match(sql, /RAISE EXCEPTION/, 'it must refuse rather than lock the table')
})

// A column privilege cannot say "all of your own row, and the public part of
// everyone else's". The view is that sentence.
test('a property can still read its own record in full', () => {
  const sql = read(MIGRATION)
  assert.match(sql, /CREATE VIEW public\.employer_profiles_private/)
  assert.match(sql, /security_invoker = false/, 'it has to run as its owner to pass the narrowed grant')
  assert.match(sql, /WHERE p\.user_id = \(SELECT auth\.uid\(\)\)/, 'the WHERE clause is the whole guard')
  assert.match(sql, /OR private\.is_admin\(\)/)
  assert.match(sql, /REVOKE ALL ON public\.employer_profiles_private FROM PUBLIC, anon/)
  assert.match(sql, /GRANT SELECT ON public\.employer_profiles_private TO authenticated/)
})

// The regression guard. Anything reading a now-private column from the table
// rather than the view fails here rather than at three o'clock on a Sunday.
test('nothing in a browser asks the table for a column it can no longer have', () => {
  const offenders: string[] = []
  for (const file of browserFiles()) {
    const source = read(file)
    const reads = source.matchAll(/from\('employer_profiles'\)[\s\S]{0,200}?\.select\(([`'"])([^`'"]*)\1/g)
    for (const match of reads) {
      const columns = match[2].split(',').map(column => column.trim().split(':').pop()!.trim())
      for (const column of columns) {
        if (PRIVATE_COLUMNS.includes(column)) offenders.push(`${file} reads ${column}`)
      }
      if (columns.includes('*')) offenders.push(`${file} reads * (SELECT * needs the whole table)`)
    }
    // Embedded joins reach the same table through the same grant.
    for (const join of source.matchAll(/employer_profiles\(([^)]*)\)/g)) {
      for (const column of join[1].split(',').map(value => value.trim())) {
        if (PRIVATE_COLUMNS.includes(column)) offenders.push(`${file} joins ${column}`)
      }
    }
  }
  assert.deepEqual(offenders, [], `read these through employer_profiles_private instead:\n${offenders.join('\n')}`)
})

// Fifteen pages and the middleware were converted. If one had been missed the
// employer side would have gone dark on deploy.
test('the pages that need the private columns use the view', () => {
  const expected = [
    'src/proxy.ts',
    'src/components/DashboardShell.tsx',
    'src/app/admin/users/page.tsx',
    'src/app/employer/dashboard/page.tsx',
    'src/app/employer/billing/page.tsx',
    'src/app/employer/profile/page.tsx',
    'src/app/employer/settings/page.tsx',
    'src/app/employer/post-role/page.tsx',
    'src/app/employer/analytics/page.tsx',
    'mobile/app/discover-talent.tsx',
  ]
  for (const file of expected) {
    assert.match(read(file), /employer_profiles_private/, `${file} must read the view`)
  }
})
