import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// A page with no metadata inherits the site default, so Google shows the same
// title for the Academy as for the homepage and the browser tab says nothing.
// /jobs and /properties solved this with a sibling layout months ago because
// their pages are client components; ten other public pages never got one.

// Routes that legitimately have no metadata of their own: they are behind auth,
// mid-flow, or must not be indexed at all. /register is here because it only
// redirects - it never renders, and its two destinations carry their own.
const NOT_INDEXED = new Set([
  'forgot-password', 'reset-password', 'mfa-challenge', 'admin-sign-in',
  'mobile-return', 'messages', 'coming-soon', 'advertising-terms', 'register',
])

function publicRoutes(): string[] {
  const root = join(process.cwd(), 'src/app')
  return readdirSync(root).filter(entry => {
    if (entry.startsWith('(') || entry.startsWith('[') || entry.startsWith('_')) return false
    if (['api', 'talent', 'employer', 'admin', 'hotel'].includes(entry)) return false
    const dir = join(root, entry)
    return statSync(dir).isDirectory() && existsSync(join(dir, 'page.tsx'))
  })
}

test('every indexable public page states what it is', () => {
  const missing: string[] = []
  for (const route of publicRoutes()) {
    if (NOT_INDEXED.has(route)) continue
    const page = read(`src/app/${route}/page.tsx`)
    const layout = existsSync(join(process.cwd(), `src/app/${route}/layout.tsx`))
      ? read(`src/app/${route}/layout.tsx`)
      : ''
    const hasMetadata = /export const metadata/.test(page) || /export const metadata/.test(layout)
    // A client component cannot export metadata, so it needs the layout. That
    // is the constraint this test exists to catch.
    if (!hasMetadata) missing.push(`/${route}${page.includes("'use client'") ? ' (client component: needs a layout.tsx)' : ''}`)
  }
  assert.deepEqual(missing, [], `these pages inherit the homepage title: ${missing.join(', ')}`)
})

test('the pages that carry revenue say what they sell', () => {
  // Academy and Consultancy are paid products in the main navigation.
  for (const route of ['academy', 'consultancy', 'advertise']) {
    const source = read(`src/app/${route}/layout.tsx`)
    assert.match(source, /export const metadata/)
    assert.match(source, /description: '.{60,}'/, `/${route} needs a description worth showing in a search result`)
    assert.match(source, /canonical: 'https:\/\/talenthousecollective\.co\.uk/)
  }
})

// The honest rule, and the one that maintains itself: if the sitemap tells
// Google to index a page, that page has to say what it is. /register/talent
// and /register/employer were both listed with priority 0.6 and neither had a
// title, so the two pages the whole platform funnels signups through appeared
// in search results under the homepage's name.
test('every page we ask Google to index has a title', () => {
  const sitemap = read('src/app/sitemap.ts')
  const listed = [...sitemap.matchAll(/\$\{BASE\}\/([a-z0-9/-]+)`/g)].map(match => match[1])
  assert.ok(listed.length > 15, 'the sitemap should list the public surface')

  const missing: string[] = []
  for (const route of new Set(listed)) {
    const page = `src/app/${route}/page.tsx`
    if (!existsSync(join(process.cwd(), page))) continue
    const layout = join(process.cwd(), `src/app/${route}/layout.tsx`)
    const hasMetadata = /export const metadata/.test(read(page))
      || (existsSync(layout) && /export const metadata/.test(read(`src/app/${route}/layout.tsx`)))
    if (!hasMetadata) missing.push(`/${route}`)
  }
  assert.deepEqual(missing, [], `listed in the sitemap with no title: ${missing.join(', ')}`)
})
