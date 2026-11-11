/**
 * Demonstration data, put in and taken out from a terminal.
 *
 *     npm run seed:demo        # three properties, eight roles, six people
 *     npm run seed:demo:clear  # take all of it out again
 *
 * This exists as a script and not as an endpoint on purpose. src/proxy.ts
 * answers every path in BLOCKED_API_ROUTES with a 404 before the handler runs,
 * and '/api/seed' is on that list, which the readiness check "maintenance APIs
 * are blocked" enforces. Seeding wants the service-role key, and a key belongs
 * on a machine somebody is sitting at rather than behind a public HTTP handler.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
 * environment, falling back to .env.local so that running it needs no setup
 * beyond the file Next already uses.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { clearDemoData, seedDemoData } from '@/lib/demo-seed'

const REQUIRED = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const

/** Minimal .env reader: KEY=value, quotes stripped, # comments and blanks skipped. */
function loadEnvLocal() {
  const path = join(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (!match) continue
    const [, key, raw] = match
    if (process.env[key]) continue
    process.env[key] = raw.replace(/^['"]|['"]$/g, '').trim()
  }
}

async function main() {
  const clear = process.argv.includes('--clear')
  loadEnvLocal()

  const missing = REQUIRED.filter(key => !process.env[key])
  if (missing.length) {
    console.error(`\nMissing ${missing.join(' and ')}.`)
    console.error('Put them in .env.local, or pass them on the command line:')
    console.error('  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:demo\n')
    console.error('Both are in Netlify under Site configuration, Environment variables.')
    process.exit(1)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host
  console.log(`\n${clear ? 'Removing' : 'Seeding'} demonstration data on ${host}\n`)

  if (clear) {
    const removed = await clearDemoData(supabase)
    console.log(`  applications  ${removed.applications}`)
    console.log(`  people        ${removed.people}`)
    console.log(`  sign-ins      ${removed.signins}`)
    console.log(`  roles         ${removed.roles}`)
    console.log(`  properties    ${removed.properties}`)
    console.log('\nDemonstration data removed.\n')
    return
  }

  const report = await seedDemoData(supabase)
  console.log(`  properties    ${report.properties}`)
  console.log(`  roles         ${report.roles}`)
  console.log(`  people        ${report.people}`)
  console.log(`  applications  ${report.applications}  (scored by the platform's own matcher)`)

  // A seed that quietly dropped half its columns, or failed on a row, is worse
  // than one that says so before somebody walks into a demonstration.
  if (report.dropped.length) {
    console.log(`\n  columns this database does not have (${report.dropped.length}):`)
    for (const column of report.dropped) console.log(`    - ${column}`)
  }
  if (report.notes.length) {
    console.log(`\n  rows that did not go in (${report.notes.length}):`)
    for (const note of report.notes) console.log(`    - ${note}`)
  }

  const empty = !report.properties && !report.roles && !report.people
  if (empty) {
    console.log('\nNothing new was created. Either it is already seeded, or every row failed above.')
  } else {
    console.log('\nSeeded. Run "npm run seed:demo:clear" to take it out again.\n')
  }
}

main().catch(error => {
  console.error('\nSeed failed:', error?.message || error, '\n')
  process.exit(1)
})
