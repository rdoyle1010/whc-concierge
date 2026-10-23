import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

test('the homepage does not read a search parameter', () => {
  // In this version of Next, a page that reads searchParams is dynamic -
  // always. The homepage accepted ?websitePreview=draft so an administrator
  // could see unpublished copy, and that one convenience took the busiest
  // page on the site out of the CDN and put a cold serverless render, five
  // database round trips deep, in front of every first-time visitor. /about
  // and /academy sat beside it being served as files.
  const source = body('src/app/page.tsx')
  assert.doesNotMatch(source, /searchParams/,
    'reading searchParams here makes the homepage render on every request')
  assert.doesNotMatch(source, /cookies\(\)|createServerSupabaseClient/,
    'reading cookies here does the same thing')
  assert.match(source, /export const revalidate/,
    'the homepage should still say how often it refreshes')
})

test('the draft preview has its own address, and it is guarded', () => {
  const route = 'src/app/preview/home/page.tsx'
  assert.ok(existsSync(route), 'the admin preview needs somewhere to live')
  const source = body(route)

  assert.match(source, /force-dynamic/, 'a preview of unpublished copy must never be cached')
  assert.match(source, /role !== 'admin'/, 'only an administrator may see unpublished copy')
  assert.match(source, /redirect\('\/'\)/,
    'send a non-admin away rather than confirming a draft exists')

  // The admin editor has to open the new address, or the button opens a page
  // that no longer knows what draft means.
  const editor = body('src/app/admin/website/page.tsx')
  assert.match(editor, /'\/preview\/home'/, 'the Website editor must open the preview route')
  assert.doesNotMatch(editor, /websitePreview=draft/, 'the old preview URL no longer does anything')
})
