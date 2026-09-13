import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const route = body('src/app/api/admin/profile-build/route.ts')
const page = body('src/app/admin/profile-build/page.tsx')
const migration = read('supabase/migrations/20260913220000_archive_the_ones_you_have_finished.sql')

// A queue showing everything ever sent is right for the first week and
// useless by the second: the three people waiting on her sit underneath a
// fortnight of people she has already dealt with.
test('a request she has finished with leaves the queue', () => {
  assert.match(migration, /add column if not exists archived_at timestamptz/)
  assert.match(route, /action === 'archive' \|\| action === 'restore'/)
  assert.match(route, /archived_at: action === 'archive' \? new Date\(\)\.toISOString\(\) : null/)

  // Hidden, not gone, and one press from being back.
  assert.match(page, /Boolean\(row\.archived_at\) === showArchived/)
  assert.match(page, /Show archived \(\$\{archivedCount\}\)/)
  assert.match(page, /'restore' : 'archive'/)
  assert.match(page, /Put it back/)
})

// Archiving is not deleting and deleting is not archiving. Confusing the two
// is how somebody loses a CV while tidying a list.
test('archiving deletes nothing', () => {
  const archiveBlock = route.slice(route.indexOf("action === 'archive' || action === 'restore'"), route.indexOf("action === 'delete'"))
  assert.doesNotMatch(archiveBlock, /\.delete\(\)|storage[\s\S]{0,40}remove/)
  assert.match(migration, /Not a deletion/)
})

// Deleting a person because an administrator tidied a list is not a thing
// this button is allowed to do.
test('deleting a request does not delete a person', () => {
  const deleteBlock = route.slice(route.indexOf("action === 'delete'"))
  assert.match(deleteBlock, /from\('profile_build_requests'\)\.delete\(\)\.eq\('id', id\)/)
  assert.doesNotMatch(deleteBlock, /auth\.admin\.deleteUser|from\('profiles'\)|from\('candidate_profiles'\)/,
    'the account and the profile are not this button\'s to remove')

  // The CV goes with the request, because that is what she was holding.
  assert.match(deleteBlock, /storage\.from\(BUCKET\)\.remove\(\[request\.cv_path\]\)/)

  // And it says so, because "deleted" reads as "all of it is gone".
  assert.match(deleteBlock, /Their account and profile are untouched/)

  // Not one press.
  assert.match(page, /window\.confirm\(/)
  assert.match(page, /This cannot be undone/)
})

// Every write here is behind the same admin check as the rest of the route.
test('archiving and deleting are admin only', () => {
  const post = route.slice(route.indexOf('export async function POST'))
  assert.ok(post.indexOf('adminRequestUser()') < post.indexOf("action === 'archive'"))
  assert.ok(post.indexOf('adminRequestUser()') < post.indexOf("action === 'delete'"))
})
