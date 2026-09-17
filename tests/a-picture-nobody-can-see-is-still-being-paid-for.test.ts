import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// "Can you not permanently delete the old photo?"
//
// No, and nothing ever had. Replacing a picture uploads a new file under a new
// timestamped name and leaves the old one exactly where it was, so every
// photograph ever uploaded to this platform was still in the bucket: paid for,
// and still reachable by anybody holding the address.
//
// Deleting on replacement would be the wrong fix. A replacement is not live
// until it is published, and ten previous versions are kept so a change can be
// put back. A file is only safe to remove once nothing refers to it at all.

const ROUTE = 'src/app/api/admin/unused-pictures/route.ts'
const SCREEN = 'src/app/admin/images/page.tsx'

test('a picture is only unused when nothing at all refers to it', () => {
  // The guarantee in the comment at the top of this file, which was right all
  // along. What changed is that the mechanism these lines used to pin turned
  // out to be the thing breaking it.
  //
  // This required the sweep to read platform_config and scan it for filenames.
  // It did exactly that - and only that - while site-images also holds brand
  // logos, course photographs, blog pictures, company logos, property
  // photographs and candidate portraits, each referenced from its own table.
  // So "nothing at all refers to it" was decided by looking at one table out of
  // dozens, this test passed, and the sweep deleted almost every picture on the
  // platform.
  //
  // Do not put the platform_config scan back. The question is asked of the
  // database now, which is the only thing that knows what columns exist.
  const route = readFileSync(ROUTE, 'utf8')

  assert.match(route, /rpc\('referenced_storage_paths'/,
    'the reference scan must cover every table, not a list somebody maintains')
  assert.doesNotMatch(route, /from\('platform_config'\)/,
    'one table cannot answer this, and believing it could cost real photographs')

  const migration = readFileSync('supabase/migrations/20260917090000_a_picture_is_in_use_until_proven_otherwise.sql', 'utf8')
  assert.match(migration, /information_schema\.columns/, 'the columns are discovered, not listed')
  assert.match(migration, /jsonb/, 'pictures stored inside JSON count too')
})

test('the delete is confirmed, and aimed by the server', () => {
  const route = readFileSync(ROUTE, 'utf8')
  assert.match(route, /body\.confirm !== true/, 'a permanent delete must be asked for explicitly')

  // The list is recomputed rather than taken from the request. A permanent
  // delete driven by a list the browser sends is a permanent delete anybody
  // can aim.
  const post = route.slice(route.indexOf('export async function POST'))
  assert.match(post, /await unusedFiles\(admin\)/)
  assert.doesNotMatch(post, /body\.names|body\.files/, 'the client must not choose what gets deleted')

  // And it refuses outright when it cannot establish what is in use, rather
  // than treating "I could not find a reference" as "there is no reference".
  assert.match(post, /if \(!known\)/)
})

test('nothing is deleted on its own', () => {
  const route = readFileSync(ROUTE, 'utf8')
  const upload = readFileSync('src/app/api/upload/route.ts', 'utf8')

  // The tidy-up happens when she asks for it and never as a side effect of
  // uploading or publishing. A picture removed by accident cannot be brought
  // back from here.
  assert.doesNotMatch(upload, /storage\.from\([^)]*\)\.remove/,
    'uploading a replacement must not delete what it replaced')
  assert.match(route, /export async function GET/, 'counting and deleting are separate')
})

test('she is told how many and how much before she presses it', () => {
  const screen = readFileSync(SCREEN, 'utf8')
  assert.match(screen, /Delete \{unused\.unused\} unused picture/)
  assert.match(screen, /1048576/, 'and how many megabytes it frees')
  assert.match(screen, /cannot be undone/, 'and warned that it is permanent')
  assert.match(screen, /All \{unused\.total\} stored pictures are in use/,
    'with something to read when there is nothing to tidy')
})

test('a folder is not a file, and a folder is what it was trying to delete', () => {
  // The first version counted thirteen, she pressed the button, and thirteen
  // came back. A bucket listing returns folders and the empty-folder
  // placeholder alongside real files; a folder has no id, and asking storage
  // to remove a folder name succeeds and removes nothing. It also only ever
  // listed the top level, so anything inside a folder was neither counted nor
  // removable.
  const route = readFileSync(ROUTE, 'utf8')
  assert.match(route, /if \(entry\.id\)/, 'only an entry with an id is a file')
  assert.match(route, /\.emptyFolderPlaceholder/, 'and the placeholder is not one either')
  assert.match(route, /listFiles\(admin, path, depth \+ 1\)/, 'folders have to be walked')
  assert.match(route, /depth > 4/, 'with a floor, so a loop cannot run away')

  // Addressed by full path, because a file in a folder is not named by its
  // basename alone.
  assert.match(route, /prefix \? `\$\{prefix\}\/\$\{entry\.name\}` : entry\.name/)
})

test('it reports what was removed, not what was asked for', () => {
  // Reporting the number requested is what made the first version look like it
  // had worked. Storage does not always remove everything it accepts.
  const route = readFileSync(ROUTE, 'utf8')
  assert.match(route, /const count = Array\.isArray\(removed\) \? removed\.length : 0/)
  assert.match(route, /Storage accepted the request and removed nothing/,
    'a silent no-op must read as a failure, because that is what it is')

  const screen = readFileSync(SCREEN, 'utf8')
  assert.match(screen, /data\.removed < data\.asked/, 'and a partial delete must say so')
})

test('a picture is matched by its path and by its name', () => {
  // A stored URL carries the path, older content sometimes carries only the
  // filename, and a reference missed here is a photograph deleted off a live
  // page. Still true; it just happens where the scan now lives.
  const route = readFileSync(ROUTE, 'utf8')
  assert.match(route, /referenced\.add\(path\)\s*\n\s*referenced\.add\(path\.split\('\/'\)\.pop\(\)!\)/)
  assert.match(route, /!referenced\.has\(file\.path\) && !referenced\.has\(file\.path\.split/)

  // A query string is not part of the filename, and treating it as one means
  // the reference never matches and the file looks unused.
  assert.match(route, /split\('\?'\)\[0\]/)
})
