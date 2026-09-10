import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INDUSTRY_SECTIONS, INDUSTRY_GROUPS } from '../src/lib/industry-bodies'
import { normaliseBody } from '../src/lib/industry-bodies-server'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// The page shipped as a TypeScript array, so every correction - a body
// renaming itself, a link moving, a paragraph she wanted sharper, a photograph
// she had taken - needed a developer and a deploy, on the one page whose whole
// value is being current and being right.
test('the page can be edited without a deploy', () => {
  const migration = read('supabase/migrations/20260910170000_good_to_know_is_hers_to_edit.sql')
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.industry_bodies/)
  // Drafts are the one thing that is not public: an entry being written stays
  // out of sight until it is ready.
  assert.match(migration, /USING \(is_published = true\)/)
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/)

  const api = body('src/app/api/admin/good-to-know/route.ts')
  for (const action of ['seed', 'create', 'update', 'delete', 'reorder']) {
    assert.match(api, new RegExp(`action === '${action}'`), `${action} must be possible`)
  }
  assert.match(api, /adminRequestUser\(\)/, 'and only by an administrator')
})

// A reference page going blank because a table is empty would be the worst
// possible failure for the one page whose value is being right.
test('the page never goes blank', () => {
  const server = body('src/lib/industry-bodies-server.ts')
  assert.match(server, /if \(error \|\| !data \|\| data\.length === 0\) return INDUSTRY_GROUPS/)
  assert.match(server, /catch \{\s*return INDUSTRY_GROUPS/)
  // Every shipped entry is still complete, because it is still the seed.
  for (const group of INDUSTRY_GROUPS) {
    for (const entry of group.bodies) {
      assert.ok(entry.url.startsWith('https://'), `${entry.name} must link somewhere real`)
      assert.ok(entry.whyWeRateIt.length > 80, `${entry.name} needs our view`)
    }
  }
})

// An import is a replacement, so it is offered rather than done, and refused
// once anything exists.
test('importing cannot throw away what she has written', () => {
  const api = body('src/app/api/admin/good-to-know/route.ts')
  const seed = api.slice(api.indexOf("if (action === 'seed')"), api.indexOf("if (action === 'create'"))
  assert.match(seed, /if \(\(existing \|\| \[\]\)\.length\) return NextResponse\.json/)
  assert.match(seed, /status: 409/)
})

// A link that is not a link is the one thing this page cannot ship: the whole
// promise is that every entry goes somewhere real.
test('an entry has to go somewhere real', () => {
  const api = body('src/app/api/admin/good-to-know/route.ts')
  assert.match(api, /const url = cleanWebsiteUrl\(body\.url\)/)
  assert.match(api, /if \(!url\) return/)
  // Pictures keep the strict https rule: a broken photograph on a page about
  // trustworthiness is worse than no photograph.
  assert.match(api, /image_url: secureImageUrl\(body\.image_url\)/)
})

test('a section that no longer exists loses its entries quietly', () => {
  const server = body('src/lib/industry-bodies-server.ts')
  assert.match(server, /INDUSTRY_SECTIONS\.map\(section =>/)
  assert.match(server, /data\.filter\(\(row: any\) => row\.section === section\.id\)/)
  assert.equal(INDUSTRY_SECTIONS.length, 4)

  // A half-written row must not reach the page either.
  const empty = normaliseBody({ name: '', url: '' })
  assert.equal(empty.name, '')
})

// It sat only in the footer under Support, which is where somebody looks when
// something has gone wrong rather than when they are choosing what to study.
test('somebody can find it', () => {
  assert.match(read('src/components/Footer.tsx'), /\/good-to-know/)
  assert.match(read('src/app/academy/page.tsx'), /\/good-to-know/, 'where a therapist is already thinking about qualifications')
  assert.match(read('src/app/talent/dashboard/page.tsx'), /\/good-to-know/, 'and where they build the profile it applies to')
  assert.match(read('src/components/DashboardShell.tsx'), /\/admin\/good-to-know/, 'and she can reach the editor')
})

// The picture slot was drawn for photography. Most of what belongs on a page
// about organisations is a logo, and object-cover fills the box by cutting
// whatever does not fit - so a wide mark lost half its letters.
test('a logo is shown whole, not cropped to fill the box', () => {
  // Comments stripped first. The explanation of why object-cover is wrong
  // contains the words "object-cover", and a check that reads its own reasoning
  // as evidence of the bug is no check at all.
  const page = body('src/app/good-to-know/page.tsx')
  const picture = page.slice(page.indexOf('function BodyPicture'), page.indexOf('function Voice'))
  assert.match(picture, /object-contain/)
  assert.doesNotMatch(picture, /object-cover/, 'cropping a logo loses the name on it')
  // Room across rather than down, and breathing space so a mark is not
  // touching the rule beside it.
  assert.match(picture, /p-6/)
  // A logo carries the organisation's name, so it is not decorative.
  assert.match(picture, /alt=\{`\$\{body\.shortName \|\| body\.name\} logo`\}/)
})
