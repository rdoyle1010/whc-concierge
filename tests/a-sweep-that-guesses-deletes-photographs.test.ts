import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// "I keep adding pictures and the next day they look like this."
//
// Broken image icons across the course catalogue, the brand page, a company
// logo and a candidate portrait. Not one page: everything anybody had ever
// uploaded.
//
// The admin Pictures screen has a sweep that deletes pictures nothing uses. It
// worked out what "nothing uses" meant by reading a single table,
// platform_config. But site-images is a shared bucket - brand logos, course
// photographs, blog pictures, company logos, property photographs, candidate
// portraits - and every one of those is referenced from its own table, none of
// which the sweep looked at. So it considered nearly every picture on the
// platform unused, and the delete is permanent.
//
// This screen has now been wrong twice in opposite directions. The first time
// it counted thirteen and deleted nothing, which was embarrassing. The second
// time it deleted what it counted, which destroyed photographs. The difference
// between those two failures is the whole subject of this file: when a sweep
// cannot answer the question, it must keep the file, not delete it.

const read = (file: string) => readFileSync(file, 'utf8')
const body = (file: string) =>
  read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const ROUTE = 'src/app/api/admin/unused-pictures/route.ts'

test('what counts as "in use" is asked of the database, not of one table', () => {
  const route = body(ROUTE)

  // The specific mistake: deciding from platform_config alone. Every other
  // table that stores a picture was invisible, and invisible meant deletable.
  assert.doesNotMatch(route, /from\('platform_config'\)/,
    'one table cannot answer which pictures are in use on a platform with dozens')
  assert.match(route, /rpc\('referenced_storage_paths'/,
    'the database knows which columns exist; a hand-written list of tables does not')

  // And the function must scan the schema rather than name tables, or the next
  // table with an image column is invisible all over again.
  const migration = read('supabase/migrations/20260917090000_a_picture_is_in_use_until_proven_otherwise.sql')
  assert.match(migration, /information_schema\.columns/)
  assert.match(migration, /data_type in \('text', 'character varying', 'jsonb', 'json'\)/)
  assert.match(migration, /table_schema = 'public'/)
})

test('not knowing is never read as "nothing is in use"', () => {
  // The heart of it. An empty set of references and an unanswerable question
  // look identical in a Set, and one of them means "delete everything".
  const route = body(ROUTE)
  // That it CAN say it does not know, not what the type is called. This named
  // Set<string> and so broke when the scan started returning two sets - a test
  // about failing safely, failing because of a type name.
  assert.match(route, /async function stillReferenced[^{]*\| null>/,
    'the reference scan must be able to say it does not know')
  assert.match(route, /return null/, 'and must actually say it on error')
  // The branch, not the exact literal it returns. Pinning the whole object
  // meant adding a field to it broke a test about failing safely.
  const unknownBranch = route.match(/if \(!referenced\) return \{[^}]*\}/)
  assert.ok(unknownBranch, 'the unknown case must have its own branch')
  assert.match(unknownBranch[0], /unused: \[\]/, 'an unknown answer must produce nothing to delete')
  assert.match(unknownBranch[0], /known: false/, 'and must say that it does not know')
  assert.match(route, /if \(!known\) \{[\s\S]{0,400}?status: 503/,
    'and the delete itself must refuse rather than proceed')
})

test('a single unreadable column cannot empty the whole answer', () => {
  // The same failure one level down. If one column throws and the function
  // gives up, the answer is an empty set - which reads as "nothing is in use"
  // and deletes the lot.
  const migration = read('supabase/migrations/20260917090000_a_picture_is_in_use_until_proven_otherwise.sql')
  assert.match(migration, /exception when others then/)
  assert.match(migration, /raise warning/)
})

test('the screen does not offer a delete the server will refuse', () => {
  const page = body('src/app/admin/images/page.tsx')
  assert.match(page, /unused\.known === false/,
    'asking somebody to confirm a delete that cannot happen is a worse way to say no')
})

test('deletes still report what happened, not what was asked for', () => {
  // The first version of this bug, still guarded: storage reports what it
  // actually removed, and it is not always everything requested.
  const route = body(ROUTE)
  assert.match(route, /Array\.isArray\(removed\) \? removed\.length : 0/)
  assert.match(route, /removed: count/)
  assert.doesNotMatch(route, /removed: paths\.length/)
})

test('only this one place deletes in bulk, and it is the guarded one', () => {
  // Every other storage removal on the platform names a single file it owns -
  // a replaced CV, a withdrawn download, an account being closed. A second
  // bulk sweep working from a guess is the thing that must not appear.
  const sweeps: string[] = []
  const files = readFileSync('/dev/null', 'utf8') // placeholder, replaced below
  void files
  const { execSync } = require('node:child_process') as typeof import('node:child_process')
  const hits = execSync("grep -rln \"storage\\.from(\" src/ || true", { encoding: 'utf8' })
    .split('\n').map(line => line.trim()).filter(Boolean)
  for (const file of hits) {
    const source = body(file)
    // A removal handed an array it built from a listing, rather than one path.
    if (/\.remove\(paths\)|\.remove\(chunk\)/.test(source)) sweeps.push(file)
  }
  assert.deepEqual(sweeps.sort(), [ROUTE, 'src/app/api/account/delete/route.ts'].sort(),
    `a bulk storage delete outside the guarded sweep:\n${sweeps.join('\n')}`)
})

test('a picture a page points at and storage does not have is reported', () => {
  // The inverse of the sweep, from the same two lists. Had this existed, the
  // deletion would have been a list of names on the first morning instead of a
  // screenful of broken icons noticed days later - and it is now the recovery
  // list, since what was deleted has to be uploaded again by hand.
  const route = body(ROUTE)
  assert.match(route, /const present = new Set\(files\.map/)

  // From the real paths, never from the matching set.
  //
  // Matching is deliberately generous - it holds each path AND its bare
  // filename, because a reference missed there deletes a live photograph. The
  // first version of this report read that same generous set, so every missing
  // file appeared twice, once as academy/clarins-...jpeg and again as
  // clarins-...jpeg, and profile photographs produced rows reading "photo.png".
  // It reported eighty-four when the truth was about half that: a recovery list
  // that overstates the damage and cannot be worked through.
  assert.match(route, /\[\.\.\.referenced\.paths\]/,
    'the missing list must come from real stored paths, not the matching aliases')
  assert.match(route, /paths\.add\(path\)/)
  assert.match(route, /match\.add\(path\.split\('\/'\)\.pop\(\)!\)/,
    'and matching must still forgive a bare filename')
  assert.match(route, /missing: missing\.length/)
  assert.match(route, /missingNames/)

  // Not everything the scan finds is a photograph. It reads any text column,
  // so an example URL in a help string would otherwise be reported as a
  // missing picture for ever.
  assert.match(route, /path\.includes\('\/'\) \|\| \/\\\.\[a-z0-9\]\{2,5\}\$\/i\.test\(path\)/)

  const screen = body('src/app/admin/images/page.tsx')
  assert.match(screen, /missing from storage/, 'and it has to be on the screen, not only in the response')
  assert.match(screen, /missingNames \|\| \[\]/, 'named, so she knows what to upload again')
})

test('the missing list names each picture once', () => {
  // Worked against the shape of the real thing: paths as they are stored, with
  // the folders they actually use on this platform.
  const stored = [
    'academy/clarins-masterclass-1787862331620-WhatsApp-Image.jpeg',
    'logos/3e521401-1254-4784-b2b4-4ce281e678c2-1789573274829.jpg',
    '0ccea3b5-03c0-415b-981a-5bcf470e2396/profile/photo.png',
    'good-to-know/spa-well/1789502087464-Your-Spa---Wellness---1.png',
  ]

  // What the route builds, in miniature: matching is generous, the report is
  // exact. If the report ever reads the generous set again, the count doubles
  // and rows like "photo.png" come back.
  const match = new Set<string>()
  const paths = new Set<string>()
  for (const path of stored) {
    paths.add(path)
    match.add(path)
    match.add(path.split('/').pop()!)
  }

  const present = new Set<string>()   // storage is empty: all four are missing
  const missing = [...paths].filter(path => !present.has(path)).sort()

  assert.equal(missing.length, stored.length, 'four missing files, four rows')
  assert.deepEqual(missing, [...stored].sort())
  assert.ok(!missing.includes('photo.png'),
    'a bare filename is a matching alias, not a picture anybody can go and find')

  // And the generous set is exactly what would have produced the wrong answer.
  assert.equal(match.size, 8, 'matching holds both forms, which is why it must not be the report')
})
