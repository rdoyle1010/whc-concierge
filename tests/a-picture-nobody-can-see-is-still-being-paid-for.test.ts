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
  const route = readFileSync(ROUTE, 'utf8')

  // Everything that could bring a picture back has to be read, not just what
  // is live. Deleting something the version history points at turns "revert"
  // into a page of broken images.
  assert.match(route, /platform_config'\)\.select\('key,value'\)/,
    'every stored key must be searched, not only the published one')
  assert.match(route, /function referencesWithin/, 'and searched all the way down, not one level')

  // A key that will not parse must not be read as referring to nothing.
  assert.match(route, /website-\[0-9\]\+-\[A-Za-z0-9\._-\]\+/,
    'unparseable content still has to be scanned for filenames, because under-counting deletes a live photograph')
})

test('the delete is confirmed, and aimed by the server', () => {
  const route = readFileSync(ROUTE, 'utf8')
  assert.match(route, /body\.confirm !== true/, 'a permanent delete must be asked for explicitly')

  // The list is recomputed rather than taken from the request. A permanent
  // delete driven by a list the browser sends is a permanent delete anybody
  // can aim.
  const post = route.slice(route.indexOf('export async function POST'))
  assert.match(post, /const \{ unused \} = await unusedFiles\(admin\)/)
  assert.doesNotMatch(post, /body\.names|body\.files/, 'the client must not choose what gets deleted')
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
  // page.
  const route = readFileSync(ROUTE, 'utf8')
  assert.match(route, /found\.add\(after\); found\.add\(after\.split\('\/'\)\.pop\(\)!\)/)
  assert.match(route, /!referenced\.has\(file\.path\) && !referenced\.has\(file\.path\.split/)
})
