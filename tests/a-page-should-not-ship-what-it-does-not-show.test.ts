import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

// Weight nobody sees.
//
// Every public page carried between 204KB and 450KB of gzipped JavaScript, and
// none of it announced itself: the pages rendered correctly, the build passed,
// and the only symptom was that the site felt slow to open. Four causes, all of
// them the same mistake in different clothes - a module imported for one small
// thing that arrived with everything sitting beside it.
//
//   - /academy imported the ACADEMY constant to draw cards showing a title and
//     a module count. ACADEMY carries the full text of every lesson in the
//     Academy: 109KB gzipped of the material people pay for, handed to anyone
//     who opened the network tab on the page selling it.
//   - Six pages imported a default paragraph of copy from the module that also
//     builds the zod schemas, so each of them shipped the whole of zod (62KB).
//   - /contact validated five form fields with zod on a page most visitors
//     never submit.
//   - Four pages imported the Supabase client at the top for work that happens
//     after paint, or in /blog's case for work that no longer happens at all.
//
// A budget is the only thing that notices any of this, because none of it
// breaks anything.

const APP = join(process.cwd(), 'src/app')
const NEXT = join(process.cwd(), '.next')
const body = (file: string) =>
  readFileSync(join(process.cwd(), file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/** Client components under src/app, which are the ones whose imports ship. */
function clientComponents(dir = APP): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) { out.push(...clientComponents(full)); continue }
    if (!/\.tsx$/.test(entry)) continue
    const rel = full.slice(process.cwd().length + 1)
    if (/^src\/app\/(admin|api)\//.test(rel)) continue // staff screens, not the public weight
    if (/^'use client'/m.test(readFileSync(full, 'utf8'))) out.push(rel)
  }
  return out
}

test('no page in a browser imports the course catalogue', () => {
  // ACADEMY is 374KB raw of lesson text. Anything that reaches it from a client
  // component ships all of it, and academy-meta used to reach it for a CPD
  // number. The prices and the metadata now live in modules that carry no data.
  const reaches = ['@/lib/academy\'', '@/lib/academy-extras', '@/lib/academy-more', '@/lib/academy-meta-server']
  const offenders: string[] = []
  for (const file of clientComponents()) {
    // Value imports only. `import type` is erased at compile time and ships
    // nothing, and a check that cannot tell the difference reports a fix as a
    // fault - which this one did, on its first run, against its own repair.
    const valueImports = [...body(file).matchAll(/^import (?!type )([\s\S]*?)from '([^']+)'/gm)]
      .filter(m => !/^\{\s*type\s/.test(m[1].trim()) || /,/.test(m[1]))
      .map(m => m[2])
    for (const module of reaches) {
      const bare = module.replace(/'$/, '')
      if (valueImports.some(spec => spec === bare || spec.startsWith(bare + '/'))) {
        offenders.push(`${file} -> ${bare}`)
      }
    }
  }
  assert.deepEqual(offenders, [],
    `these ship every lesson in the Academy to draw a card:\n${offenders.join('\n')}`)

  // And the modules that replaced it must stay free of data.
  for (const file of ['src/lib/academy-pricing.ts', 'src/lib/academy-meta.ts']) {
    assert.doesNotMatch(body(file), /from '\.\/academy'/,
      `${file} is imported by client components and must not reach the catalogue`)
  }
})

test('no page in a browser imports zod to render copy', () => {
  // public-page-content builds the schemas; public-page-content-values holds the
  // defaults. Client components want the second and were importing the first,
  // which put 62KB of validator into a page showing a paragraph of marketing.
  const offenders: string[] = []
  for (const file of clientComponents()) {
    const source = body(file)
    // `import type` is erased at compile time and costs nothing.
    const valueImport = /import \{[^}]*\} from '@\/lib\/public-page-content'/.test(source)
    if (valueImport) offenders.push(file)
    if (/import \{[^}]*\} from 'zod'/.test(source)) offenders.push(`${file} (zod directly)`)
  }
  assert.deepEqual(offenders, [],
    `these pull the whole of zod into a page that renders copy:\n${offenders.join('\n')}`)
})

// Pages where signing in IS the page. The auth client is what they exist to
// use, usually within a second of opening, so deferring it buys a slower first
// action in exchange for a faster first paint of a form nobody reads.
//
// Named one by one on purpose. A path rule like "anything under /register" would
// quietly exempt the next page added there, and /register/talent is a landing
// page search engines are now told to index.
const AUTH_PAGES = new Set([
  'src/app/forgot-password/page.tsx',
  'src/app/mfa-challenge/page.tsx',
  'src/app/reset-password/page.tsx',
  'src/app/register/buyer/page.tsx',
  'src/app/register/employer/page.tsx',
  'src/app/register/talent/page.tsx',
  // Signed-in surfaces: the visitor is already past a login and a first paint.
  'src/app/my-documents/page.tsx',
  'src/app/residency/create/page.tsx',
  'src/app/roles/match/page.tsx',
])

test('the database client is fetched when it is needed', () => {
  // 57KB gzipped of auth and database client, for work that happens after paint.
  // The Navbar has loaded it dynamically for a while; these pages had not, and
  // /verify/[code] built a client it then never used at all.
  const offenders: string[] = []
  for (const file of clientComponents()) {
    if (/^src\/app\/(talent|employer|hotel)\//.test(file)) continue // behind a login, already past first paint
    if (AUTH_PAGES.has(file)) continue
    const source = body(file)
    if (/^import \{[^}]*createClient[^}]*\} from '@\/lib\/supabase\/client'/m.test(source)) offenders.push(file)
  }
  assert.deepEqual(offenders, [],
    `these load the Supabase client before the page paints:\n${offenders.join('\n')}\nuse await import('@/lib/supabase/client') where it is used`)
})

test('the shared shells do not drag the database client onto every page', () => {
  // DashboardShell and viewer.ts are reached from a great many pages, /agency
  // among them, which is public and where most visitors are signed out. A static
  // import in either put 57KB into all of them.
  for (const file of ['src/components/DashboardShell.tsx', 'src/lib/viewer.ts', 'src/components/Navbar.tsx']) {
    assert.doesNotMatch(body(file), /^import \{[^}]*createClient[^}]*\} from '@\/lib\/supabase\/client'/m,
      `${file} reaches too many pages to load the Supabase client eagerly`)
  }
})

test('every public page stays inside its JavaScript budget', () => {
  // Measured from the build on disk, so it is the real served weight rather
  // than a guess. Skipped rather than failed when there is no build, because a
  // test suite that demands a production build cannot run on its own.
  const pages = ['index', 'about', 'jobs', 'roles', 'academy', 'contact', 'faq', 'blog', 'pricing', 'properties', 'brands', 'agency', 'verify']
  const BUDGET = 240 * 1024

  const measured: Array<[string, number]> = []
  for (const page of pages) {
    const html = join(NEXT, 'server/app', `${page}.html`)
    if (!existsSync(html)) continue
    const names = new Set(readFileSync(html, 'utf8').match(/\/_next\/static\/chunks\/[a-z0-9_-]*\.js/g) || [])
    let total = 0
    for (const name of names) {
      const chunk = join(NEXT, name.replace('/_next/', ''))
      if (existsSync(chunk)) total += gzipSync(readFileSync(chunk)).length
    }
    if (total > 0) measured.push([page, total])
  }
  if (!measured.length) return // no production build here; nothing to measure

  const over = measured.filter(([, bytes]) => bytes > BUDGET)
    .map(([page, bytes]) => `/${page} ships ${Math.round(bytes / 1024)}KB`)
  assert.deepEqual(over, [],
    `over the ${BUDGET / 1024}KB budget:\n${over.join('\n')}\n`
    + 'Something is being imported for one small thing and arriving with everything beside it.')
})
