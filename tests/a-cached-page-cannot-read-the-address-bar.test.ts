import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// A page cannot be cached and read the address bar at the same time.
//
// Three public pages declared `export const revalidate` and then took
// searchParams in their signature, only ever to check for an administrator's
// ?pagePreview=draft flag. In this version of Next, reading searchParams makes
// a page dynamic full stop, so the revalidate was silently cancelled and every
// visitor to the property directory paid for a server render so that one
// person could occasionally preview a draft.
//
// Nothing fails when this happens. The build succeeds, the page is correct,
// and it is merely slow and expensive forever. That is exactly the kind of
// defect worth a test.
//
// Two honest ways to keep a preview: read the flag in the browser, as Pricing
// and Residency do, or give the preview its own address under /preview, as the
// homepage and these three now do.

const APP = join(process.cwd(), 'src', 'app')

function pages(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) pages(path, found)
    else if (entry.name === 'page.tsx') found.push(path)
  }
  return found
}

/** The file with comments removed, so a mention in prose is not a finding. */
function body(source: string) {
  return source
    .split('\n')
    .filter(line => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

test('a page that asks to be cached does not read searchParams', () => {
  const offenders: string[] = []

  for (const path of pages(APP)) {
    const source = body(readFileSync(path, 'utf8'))
    if (!/^export const revalidate\b/m.test(source)) continue
    if (/\bsearchParams\b/.test(source)) offenders.push(path.replace(process.cwd() + '/', ''))
  }

  assert.deepEqual(offenders, [], `These pages declare revalidate and then cancel it by reading searchParams:\n  ${offenders.join('\n  ')}\nRead the flag client-side, or move the preview to its own /preview address.`)
})

test('the pages moved to /preview are admin-only and are still reachable', () => {
  for (const slug of ['home', 'properties', 'agency', 'coming-soon']) {
    const source = readFileSync(join(APP, 'preview', slug, 'page.tsx'), 'utf8')
    assert.match(source, /force-dynamic/, `/preview/${slug} must not be cached`)
    assert.match(source, /role !== 'admin'/, `/preview/${slug} must refuse a non-administrator`)
    assert.match(source, /redirect\(/, `/preview/${slug} must redirect rather than render for the wrong person`)
  }

  // The Preview button in the website editor has to point at them, or the
  // preview is admin-only and also unreachable.
  const editor = readFileSync(join(APP, 'admin', 'website', 'pages', 'page.tsx'), 'utf8')
  assert.match(editor, /previewHref\(selected\)/, 'the website editor must use previewHref')
  for (const slug of ['properties', 'agency', 'coming-soon']) {
    assert.ok(editor.includes(`'${slug}'`), `previewHref must know about ${slug}`)
  }
})
