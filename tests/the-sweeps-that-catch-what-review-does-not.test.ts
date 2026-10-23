import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(process.cwd(), dir))) {
    const rel = `${dir}/${entry}`
    if (statSync(join(process.cwd(), rel)).isDirectory()) walk(rel, out)
    else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) out.push(rel)
  }
  return out
}

const ROUTES = walk('src/app/api').filter(file => file.endsWith('/route.ts'))
const CLIENT = walk('src/app').concat(walk('src/components')).filter(file => file.endsWith('.tsx'))

// The bugs that damaged the launch weekend were not found by a second
// opinion. Talent sign-ups alerting nobody, the missing welcome email, names
// vanishing, everybody published by default. Every one of them was found by
// sweeping the whole codebase for a shape, and every one of them looked
// perfectly fine in the file it lived in.
//
// These are the sweeps. Each looks for a shape rather than a sighting, so a
// new instance written tomorrow fails on the day it is written.

// A route that returns a session-scoped answer must never be cached at the
// edge, or one person's data is served to the next.
test('nothing personal is cached', () => {
  const offenders: string[] = []
  for (const file of ROUTES) {
    const source = body(file)
    const personal = /getRequestUser\(|adminRequestUser\(/.test(source)
    const revalidates = /export const revalidate\s*=\s*(?!0)\d+/.test(source)
    if (personal && revalidates) offenders.push(file)
  }
  assert.deepEqual(offenders, [], 'these serve a signed-in answer from a cache')
})

// A public page reading the database directly must filter for what is
// published, or a draft becomes a live page.
test('no public page serves a draft', () => {
  const DRAFT_TABLES = ['events', 'blog_posts', 'consultancy_profiles', 'brands']
  const offenders: string[] = []
  for (const file of walk('src/app').filter(f => f.endsWith('page.tsx'))) {
    if (/\/(admin|talent|employer|hotel)\//.test(file)) continue
    const source = body(file)
    for (const table of DRAFT_TABLES) {
      if (!source.includes(`from('${table}')`)) continue
      if (!/is_published|approval_status|is_live|status/.test(source)) {
        offenders.push(`${file} reads ${table} unfiltered`)
      }
    }
  }
  assert.deepEqual(offenders, [])
})

// Every email this platform sends goes through the one logged sender, so
// "did they get it" ends in a row rather than a guess. A direct call to the
// provider is a message nobody can account for.
test('nothing emails anybody behind the logger s back', () => {
  const offenders: string[] = []
  for (const file of walk('src').concat(walk('netlify'))) {
    if (file.endsWith('src/lib/send-email.ts')) continue
    const source = body(file)
    if (/api\.resend\.com|from 'resend'|require\('resend'\)/.test(source)) offenders.push(file)
  }
  assert.deepEqual(offenders, [], 'these send mail without a log row')
})

// A secret in a NEXT_PUBLIC_ variable is a secret in the browser.
test('no secret is exposed to the browser', () => {
  const offenders: string[] = []
  for (const file of walk('src').concat(walk('netlify')).concat(walk('scripts'))) {
    const source = read(file)
    const matches = source.match(/NEXT_PUBLIC_[A-Z0-9_]+/g) || []
    for (const name of matches) {
      if (/SECRET|SERVICE_ROLE|PRIVATE|_KEY$/.test(name) && !/PUBLISHABLE_KEY|ANON_KEY|SITE_KEY|MAPS_KEY/.test(name)) {
        offenders.push(`${file}: ${name}`)
      }
    }
  }
  assert.deepEqual(offenders, [])
})

// A client component that reads the service role key would ship it.
test('the service role never reaches a client component', () => {
  const offenders: string[] = []
  for (const file of CLIENT) {
    const source = read(file)
    if (!source.startsWith("'use client'") && !source.includes("\n'use client'")) continue
    if (/SUPABASE_SERVICE_ROLE_KEY|createAdminClient/.test(source)) offenders.push(file)
  }
  assert.deepEqual(offenders, [])
})

// An admin route with no admin check is an admin route anybody can call.
test('every admin route checks that the caller is an administrator', () => {
  const offenders: string[] = []
  for (const file of ROUTES.filter(f => f.includes('/api/admin/'))) {
    const source = body(file)
    if (!/adminRequestUser\(|adminRequestOutcome\(|requireAdmin/.test(source)) offenders.push(file)
  }
  assert.deepEqual(offenders, [])
})

// A scheduled function with no secret check is a public endpoint that runs
// whatever it was built to run.
test('every scheduled function authenticates itself', () => {
  const functions = readdirSync(join(process.cwd(), 'netlify/functions')).filter(name => name.endsWith('.mts'))
  assert.ok(functions.length >= 3, 'the sweep must actually see the functions')
  for (const name of functions) {
    const source = body(`netlify/functions/${name}`)
    assert.match(source, /x-whc-internal-secret/, `${name} calls in without identifying itself`)
    assert.match(source, /if \(!secret\)/, `${name} would call in with an empty secret`)
  }
})

// A route reachable by a schedule must accept the secret AND refuse everybody
// else. Half of that is an open door.
test('every internally-called route refuses an anonymous caller', () => {
  const offenders: string[] = []
  for (const file of ROUTES) {
    const source = body(file)
    if (!source.includes('isInternalApiRequest')) continue
    // 404 counts. The job-alerts route answers a stranger with "not found"
    // rather than "forbidden", deliberately, so an endpoint that enumerates
    // users and sends bulk mail does not confirm it exists.
    if (!/status: 401|status: 403|status: 404/.test(source)) offenders.push(file)
  }
  assert.deepEqual(offenders, [])
})

// Anything that anonymises a candidate must go through the one presenter, or
// it is honoured in some places and forgotten in others. That has happened
// here before, in five routes.
test('nobody reimplements anonymisation', () => {
  const offenders: string[] = []
  for (const file of ROUTES) {
    if (file.includes('/api/admin/')) continue
    // A professional reading or changing her own settings is not an employer
    // being shown somebody. These routes touch the same columns for the
    // opposite reason.
    if (/\/api\/(talent|profile)\//.test(file)) continue
    const source = body(file)
    if (!/private_mode|show_first_name_only/.test(source)) continue
    // Only routes that actually put a name in front of somebody.
    if (!/full_name/.test(source)) continue
    const usesPresenter = /presentCandidateForEmployer|candidateNameForEmployer|anonymiseDisplayName/.test(source)
    if (!usesPresenter) offenders.push(file)
  }
  assert.deepEqual(offenders, [], 'these decide for themselves what an employer sees')
})
