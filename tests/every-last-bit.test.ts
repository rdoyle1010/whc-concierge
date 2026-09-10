import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { londonToday, londonDateOffset } from '../src/lib/agency-time'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// A route that reports success on a write it never checked tells somebody
// their work is saved when it is gone. This is the sweep: every write followed
// within a few lines by a success response, across the whole API.
test('nothing reports success on a write it did not check', () => {
  const WRITE = /^\s*await\s+(admin|supabase)\.from\(['"]([a-z_]+)['"]\)\s*\.\s*(update|insert|upsert|delete)\b/
  const SUCCESS = /NextResponse\.json\(\s*\{\s*(success:\s*true|ok:\s*true)/
  // Event logs and analytics are deliberately best-effort: a missing audit row
  // must never be the reason somebody's action fails.
  const BEST_EFFORT = new Set(['agency_case_events', 'analytics_events', 'referrals'])

  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(process.cwd(), dir))) {
      const rel = `${dir}/${entry}`
      if (statSync(join(process.cwd(), rel)).isDirectory()) { walk(rel); continue }
      if (!entry.endsWith('.ts')) continue
      const lines = read(rel).split('\n')
      lines.forEach((line, index) => {
        const match = WRITE.exec(line)
        if (!match || BEST_EFFORT.has(match[2])) return
        if (SUCCESS.test(lines.slice(index + 1, index + 7).join('\n'))) {
          offenders.push(`${rel}:${index + 1} ${match[3]} ${match[2]}`)
        }
      })
    }
  }
  walk('src/app/api')
  assert.deepEqual(offenders, [], `read the error on these:\n${offenders.join('\n')}`)
})

// amount_paid, refund_amount and payout_amount are numeric(10,2). The API
// rounds to the penny; this form ran parseInt first, so a PS187.50 refund
// arrived as PS187 and the server's careful handling never saw the pence.
test('a refund typed in pounds and pence stays that way', () => {
  const page = body('src/app/admin/agency/page.tsx')
  assert.doesNotMatch(page, /parseInt\(inputs\.(refund|payout)/)
  assert.match(page, /refundAmount: inputs\.refund === '' \? 0 : pounds\(inputs\.refund\)/)
  assert.match(page, /const pounds = \(value: string\) => Math\.round\(\(Number\(value\) \|\| 0\) \* 100\) \/ 100/)
  // And the box has to accept them in the first place.
  assert.match(page, /step="0\.01"[^>]*value=\{inputs\.refund\}|value=\{inputs\.refund\}[^>]*step="0\.01"/)
})

// shift_date is a British calendar day and the server runs on UTC, so in
// summer the UTC date is still yesterday for the first hour after midnight.
// There were two inline copies of this and one place using UTC instead.
test('there is one answer to what day it is in London', () => {
  assert.match(londonToday(), /^\d{4}-\d{2}-\d{2}$/)
  assert.match(londonDateOffset(-7), /^\d{4}-\d{2}-\d{2}$/)
  assert.ok(londonDateOffset(-1) < londonToday())
  assert.ok(londonDateOffset(1) > londonToday())

  for (const route of [
    'src/app/api/agency/cancel/route.ts',
    'src/app/api/agency/booking/core.ts',
    'src/app/api/agency/review-reminders/route.ts',
  ]) {
    const source = body(route)
    assert.match(source, /londonToday|londonDateOffset/, `${route} must use the shared helper`)
    assert.doesNotMatch(source, /toLocaleDateString\('en-CA'/, `${route} must not keep its own copy`)
  }
  assert.doesNotMatch(body('src/app/api/agency/review-reminders/route.ts'), /toISOString\(\)\.slice\(0, 10\)/)
})

// The public advertising form is anonymous by design - asking a brand to
// register before it can pay us would be a strange way to sell advertising -
// but every call creates a real Stripe session.
test('the public advertising routes are throttled', () => {
  for (const route of [
    'src/app/api/stripe/sponsored-ad-checkout/route.ts',
    'src/app/api/stripe/sponsored-ad-confirm/route.ts',
  ]) {
    const source = body(route)
    assert.match(source, /enforceRateLimit\(req, 'sponsored-ad-/, `${route} must be limited`)
    assert.match(source, /'Retry-After'/)
  }
})

// Every internal link in the product has to lead somewhere.
test('no link in the product leads nowhere', () => {
  const routes = new Set<string>()
  const collect = (dir: string) => {
    const entries = readdirSync(join(process.cwd(), dir))
    if (entries.includes('page.tsx')) routes.add(dir.replace('src/app', '').replace(/\/\([^)]*\)/g, '') || '/')
    for (const entry of entries) {
      const rel = `${dir}/${entry}`
      if (statSync(join(process.cwd(), rel)).isDirectory()) collect(rel)
    }
  }
  collect('src/app')

  const resolves = (href: string) => {
    const path = href.split('?')[0].split('#')[0].replace(/\/$/, '') || '/'
    if (routes.has(path)) return true
    return [...routes].some(route => route.includes('[')
      && new RegExp(`^${route.replace(/\[\.\.\.[^\]]+\]/g, '.+').replace(/\[[^\]]+\]/g, '[^/]+')}$`).test(path))
  }

  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(process.cwd(), dir))) {
      const rel = `${dir}/${entry}`
      if (statSync(join(process.cwd(), rel)).isDirectory()) { walk(rel); continue }
      if (!entry.endsWith('.tsx')) continue
      for (const match of read(rel).matchAll(/href="(\/[^"]*)"/g)) {
        const href = match[1]
        if (href.startsWith('/api/') || href.startsWith('/_')) continue
        if (!resolves(href)) offenders.push(`${rel} -> ${href}`)
      }
    }
  }
  walk('src')
  assert.deepEqual(offenders, [], `these go nowhere:\n${offenders.join('\n')}`)
})
