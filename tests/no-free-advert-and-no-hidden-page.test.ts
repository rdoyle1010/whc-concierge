import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function stripComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//') && !line.trimStart().startsWith('--'))
    .join('\n')
}

function pagesUnder(dir: string, prefix = ''): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) found.push(...pagesUnder(full, `${prefix}/${entry}`))
    else if (entry === 'page.tsx') found.push(prefix || '/')
  }
  return found
}

test('the retired hotel portal cannot post a role', () => {
  // /hotel/jobs/new and /hotel/jobs inserted job_listings straight from the
  // browser with is_live: true. No checkout, no Stripe, no purchase record -
  // a free live advert for anybody who knew the URL.
  for (const page of ['jobs/new', 'jobs', 'dashboard', 'applications']) {
    const source = readFileSync(`src/app/hotel/${page}/page.tsx`, 'utf8')
    assert.match(source, /redirect\('\/employer\//, `/hotel/${page} must redirect to the current employer portal`)
    assert.doesNotMatch(stripComments(source), /job_listings/, `/hotel/${page} must not write listings`)
  }
})

test('no page takes a role live from the browser', () => {
  // A role goes live server-side, after Stripe confirms the payment. Anything
  // in src/app that is not an API route is reachable with the member's own
  // session, so is_live: true in one of those files is a way round checkout.
  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) { walk(full); continue }
      if (!entry.endsWith('.tsx')) continue
      const source = stripComments(readFileSync(full, 'utf8'))
      const writesLive = source.split('\n').some(line =>
        /is_live:\s*true/.test(line)
        // Local React state after the server has already answered is not a
        // write. Only what goes to Supabase counts.
        && !/set[A-Z]\w*\(|\.map\(|\.\.\.j\b|\.\.\.job\b/.test(line))
      if (writesLive) offenders.push(full)
    }
  }
  walk('src/app')
  assert.deepEqual(offenders, [], `these pages publish an advert without a payment: ${offenders.join(', ')}`)
})

test('the database refuses a listing that is born live', () => {
  const migration = readFileSync('supabase/migrations/20260904200000_an_advert_cannot_be_born_live.sql', 'utf8')
  const body = stripComments(migration)

  assert.match(body, /BEFORE INSERT OR UPDATE ON public\.job_listings/,
    'the guard has to cover inserts, not only updates')
  assert.match(body, /IF TG_OP = 'INSERT' THEN/,
    'OLD is unassigned on an insert, so the insert case needs its own branch')
  assert.match(body, /private\.write_is_privileged\(\)/,
    'the service role publishes paid adverts and must stay exempt')

  // The insert branch has to refuse all three of the things that make an
  // advert worth paying for.
  const insertStart = body.indexOf("IF TG_OP = 'INSERT' THEN")
  assert.ok(insertStart > 0, 'the insert branch must exist')
  const insertBranch = body.slice(insertStart, body.indexOf('RETURN NEW;', insertStart))
  assert.match(insertBranch, /NEW\.is_live/)
  assert.match(insertBranch, /NEW\.status = 'active'/)
  assert.match(insertBranch, /NEW\.expires_at IS NOT NULL/)
})

test('every talent and employer page has a way in', () => {
  // Awards were built on both sides, are read by the portfolio, Discover
  // Talent and the mobile directory - and had no link anywhere, so nobody
  // could ever enter one. A finished feature with no door is not a feature.
  const shell = readFileSync('src/components/DashboardShell.tsx', 'utf8')
  const everything = ['src', 'netlify'].flatMap(root => {
    const files: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if (/\.(ts|tsx|mts)$/.test(entry)) files.push(full)
      }
    }
    walk(root)
    return files
  })

  const hidden: string[] = []
  for (const area of ['talent', 'employer']) {
    for (const page of pagesUnder(`src/app/${area}`, `/${area}`)) {
      if (page.includes('[')) continue
      if (shell.includes(`'${page}'`)) continue
      const own = `src/app${page}/page.tsx`
      const linked = everything.some(file => file !== own && readFileSync(file, 'utf8').includes(page))
      if (!linked) hidden.push(page)
    }
  }

  assert.deepEqual(hidden, [], `nothing links to these pages, so nobody can reach them: ${hidden.join(', ')}`)
})
