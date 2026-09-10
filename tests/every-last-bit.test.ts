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
  // Deliberately best-effort, each for a reason. A missing row here must never
  // be the reason somebody's action fails, and every one of these is either a
  // record of something that already happened or a tidy-up after it.
  const BEST_EFFORT = new Set([
    'agency_case_events',   // the audit trail beside the write that matters
    'analytics_events',     // instrumentation
    'referrals',            // credit for an introduction, never the introduction
    'assessment_attempts',  // the attempt log; the score itself is written and checked
    'agency_rate_cards',    // seeded when a sector opens; the sector is the thing
    'consent_events',       // the ledger beside privacy_preferences, which is checked
    'marketing_confirmation_tokens', // consuming a token already acted on
    'ambassador_redemptions',        // releasing a place after a refused claim
    'swipes',               // clearing a passed-over card before deleting its role
  ])

  // A handful of specific lines, named rather than pattern-matched, where the
  // write is genuinely a sweep or a note rather than the thing being asked
  // for. Named so that adding to this list is a visible decision.
  const DELIBERATE = new Set([
    // Expiring an offer nobody answered, on the way past. The caller is doing
    // something else; this is housekeeping and the conditional update makes it
    // safe to miss and catch next time.
    'src/app/api/agency/booking/core.ts:980',
    'src/app/api/mobile/agency/booking-action/route.ts:150',
    // A note the candidate added beside a time they cannot make. The refusal
    // itself is the checked write above it.
    'src/app/api/talent/applications/interview/route.ts:56',
    // The legacy documents array, kept in step beside the real record.
    'src/app/api/talent/certificates/route.ts:65',
  ])

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
        // To the end of the handler, not a fixed few lines. The first version
        // of this looked six lines ahead, so it missed every write whose
        // success response sits below a notification, an email and a couple of
        // lookups - which is most of the recruitment journey.
        const rest: string[] = []
        for (const next of lines.slice(index + 1)) {
          if (/^export\s+async\s+function/.test(next)) break
          rest.push(next)
          if (rest.length > 60) break
        }
        if (DELIBERATE.has(`${rel}:${index + 1}`)) return
        if (SUCCESS.test(rest.join('\n'))) {
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

// ---------------------------------------------------------------------------
// The sweeps that came back empty.
//
// These found nothing today, which is exactly why they are worth writing down.
// A sweep run once tells you about today; a sweep that runs on every commit
// tells you about the change somebody is about to make.
// ---------------------------------------------------------------------------

function sourceFiles(root: string, extension: string): string[] {
  const found: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(process.cwd(), dir))) {
      if (entry === 'node_modules' || entry === '.expo') continue
      const rel = `${dir}/${entry}`
      if (statSync(join(process.cwd(), rel)).isDirectory()) walk(rel)
      else if (entry.endsWith(extension)) found.push(rel)
    }
  }
  walk(root)
  return found
}

// A client action that reads the response body without ever looking at whether
// the request was refused reports the optimistic answer either way: the
// professional is told their application went, the property is told the offer
// was sent, and neither happened.
test('no client action reports success without checking it was allowed', () => {
  // Deliberately NOT anchored to one line. A fetch call written across four
  // lines is the normal way to write one, and a check that only sees
  // single-line calls passes on the files most worth checking.
  const call = /const\s+(\w+)\s*=\s*await\s+fetch\(/g
  const offenders: string[] = []
  for (const file of [...sourceFiles('src/app', '.tsx'), ...sourceFiles('src/components', '.tsx')]) {
    const source = read(file)
    if (!source.startsWith("'use client'")) continue
    for (const match of source.matchAll(call)) {
      const name = match[1]
      // Generous on purpose. A profile save posts thirty fields, so the check
      // that follows it can be a long way down the file - and a window that
      // stops short reports a handled failure as an unhandled one.
      const window = source.slice(match.index!, match.index! + 3000)
      // Reads are not the concern here: a failed GET shows an empty list,
      // which is visible. A failed write shows a tick that is a lie.
      if (!window.includes('method')) continue
      // Checking the status is one way.
      if (new RegExp(`\\b${name}\\s*\\??\\s*\\.\\s*(ok|status)\\b`).test(window)) continue
      // Reading the body's own error or success flag is the other, and it is
      // just as good: these routes all answer with one. What is not allowed is
      // reading neither, which is how a button ends up doing nothing at all
      // with nothing said.
      const parsed = new RegExp(`const\\s+(\\w+)\\s*=\\s*await\\s+${name}\\s*\\??\\s*\\.\\s*json\\(`).exec(window)
      if (parsed && new RegExp(`\\b${parsed[1]}\\s*\\??\\s*\\.\\s*(error|success|ok|status)\\b`).test(window)) continue
      offenders.push(`${file}:${source.slice(0, match.index).split('\n').length}`)
    }
  }
  assert.deepEqual(offenders, [], `these cannot tell a refusal from a success:\n${offenders.join('\n')}`)
})

// A write addressed by an id the caller supplied, with nothing else scoping it,
// edits whatever row that id names. It is only safe when something before it
// has proved the caller owns that row - which in practice means reading the
// row with the caller's own id first, and writing to the row that came back.
test('no write outside admin is addressed straight from the request body', () => {
  // The one exemption, named rather than pattern-matched. An unsubscribe link
  // carries a signed token for exactly one subscriber id, and verifying that
  // signature IS the ownership proof: there is no session to check against,
  // because the whole point is that it works from an email client.
  const SIGNED_TOKEN_ROUTES = new Set([
    'src/app/api/newsletter/unsubscribe/route.ts',
  ])

  const offenders: string[] = []
  for (const file of sourceFiles('src/app/api', '.ts')) {
    if (file.includes('/admin/')) continue
    if (SIGNED_TOKEN_ROUTES.has(file)) continue
    const source = read(file)
    for (const match of source.matchAll(/\.(update|delete)\([^;]*?\)((?:\s*\.eq\([^)]*\))+)/gs)) {
      const eqs = [...match[2].matchAll(/\.eq\('([a-z_]+)',\s*([^)]+)\)/g)]
      if (eqs.length !== 1 || eqs[0][1] !== 'id') continue
      const expr = eqs[0][2].trim()
      if (!/^(body\.\w+|id)$/.test(expr)) continue
      offenders.push(`${file}:${source.slice(0, match.index).split('\n').length} writes .eq('id', ${expr})`)
    }
  }
  assert.deepEqual(offenders, [], `prove the caller owns the row first:\n${offenders.join('\n')}`)
})

// A marker left in the source is a decision somebody deferred and nobody came
// back to. On a live platform that is not a note, it is a defect with a label.
test('nothing is left marked as unfinished', () => {
  const offenders: string[] = []
  for (const file of [...sourceFiles('src', '.ts'), ...sourceFiles('src', '.tsx'), ...sourceFiles('mobile/app', '.tsx')]) {
    read(file).split('\n').forEach((line, index) => {
      if (/\b(TODO|FIXME|HACK|XXX)\b/.test(line)) offenders.push(`${file}:${index + 1} ${line.trim().slice(0, 80)}`)
    })
  }
  assert.deepEqual(offenders, [], `finish or delete these:\n${offenders.join('\n')}`)
})

// A button with neither a type nor a handler is either dead, or - inside a
// form - an accidental submit, because that is what an untyped button defaults
// to. Both look like the page ignoring somebody.
test('every button does something, and says which', () => {
  const offenders: string[] = []
  for (const file of [...sourceFiles('src/app', '.tsx'), ...sourceFiles('src/components', '.tsx')]) {
    const source = read(file)
    for (const match of source.matchAll(/<button\b[^>]*?>/gs)) {
      const tag = match[0]
      if (tag.includes('type=') || tag.includes('onClick')) continue
      offenders.push(`${file}:${source.slice(0, match.index).split('\n').length}`)
    }
  }
  assert.deepEqual(offenders, [], `give these a type or a handler:\n${offenders.join('\n')}`)
})

// /api/upload refuses anything without a file, a bucket AND a path, with a
// message that reads like the file was the problem. The Good to Know picture
// button sent the file alone, so it failed on every image somebody tried -
// and there is no way to tell from the screen that the page is at fault
// rather than the photograph.
test('every upload button sends what the upload route needs', () => {
  const offenders: string[] = []
  for (const file of [...sourceFiles('src/app', '.tsx'), ...sourceFiles('src/components', '.tsx'), ...sourceFiles('src/app', '.ts')]) {
    const source = read(file)
    for (const match of source.matchAll(/fetch\(\s*['"]\/api\/upload['"]/g)) {
      // The form is built above the call, so look back rather than forward.
      const window = source.slice(Math.max(0, match.index! - 1600), match.index! + 200)
      const sends = (field: string) => window.includes(`append('${field}'`) || window.includes(`append("${field}"`)
      if (sends('bucket') && sends('path')) continue
      offenders.push(`${file}:${source.slice(0, match.index).split('\n').length}`)
    }
  }
  assert.deepEqual(offenders, [], `these uploads will be refused:\n${offenders.join('\n')}`)
})
