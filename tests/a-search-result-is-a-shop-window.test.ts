import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// The audit found the same four mistakes on twenty-six pages each, and none of
// them produced a warning, an error or a broken page. Every one of them is only
// visible on somebody else's website: in a Google result, on a LinkedIn card, in
// a WhatsApp preview. That is exactly the shape of bug a test has to hold,
// because nothing else will ever notice it.
//
// Four rules, each of which was being broken when this was written:
//   1. A title that already names the brand, plus the template that appends the
//      brand, prints the brand twice.
//   2. A title over sixty characters is cut off in the result.
//   3. A description over a hundred and fifty-five is cut off too.
//   4. A page that declares its own openGraph replaces the root object outright,
//      including the card image. Next merges metadata shallowly.

const APP = join(process.cwd(), 'src/app')

function pageFiles(dir = APP): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('_')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      // Signed-in surfaces are noindex; their metadata only fills a browser tab.
      if (['api', 'talent', 'employer', 'admin', 'hotel'].includes(entry) && dir === APP) continue
      out.push(...pageFiles(full))
    } else if (entry === 'page.tsx' || entry === 'layout.tsx') {
      out.push(full)
    }
  }
  return out
}

/** The metadata block, with comments stripped so a comment cannot satisfy a check. */
function metadataBlocks(source: string): { openGraph: string | null; body: string } {
  const body = source.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  const m = body.match(/openGraph:\s*\{/)
  if (!m) return { openGraph: null, body }
  const start = body.indexOf('{', m.index!)
  let depth = 0, i = start
  for (; i < body.length; i++) {
    if (body[i] === '{') depth++
    else if (body[i] === '}' && --depth === 0) break
  }
  return { openGraph: body.slice(start, i + 1), body }
}

const rel = (file: string) => file.slice(process.cwd().length + 1)

test('no title prints the brand twice', () => {
  // The root layout sets template: '%s | Talent House Collective'. A plain
  // `title: '...'` string goes through it, so naming the brand inside one is
  // how you get "Spa and wellness events | Talent House Collective | Talent
  // House Collective" in a search result.
  const doubled: string[] = []
  for (const file of pageFiles()) {
    const { body } = metadataBlocks(readFileSync(file, 'utf8'))
    const meta = body.match(/export const metadata[\s\S]*?\n\}/)
    const source = meta ? meta[0] : body
    // Only a top-level, non-absolute title is templated.
    for (const m of source.matchAll(/\n  title: (['"`])((?:\\.|(?!\1).)*)\1/g)) {
      if (/Talent House/.test(m[2])) doubled.push(`${rel(file)}: ${m[2]}`)
    }
    // And the same thing returned inline from generateMetadata, which is how
    // the events not-found branch slipped past the line-anchored form above.
    for (const m of body.matchAll(/return \{ title: (['"`])((?:\\.|(?!\1).)*)\1/g)) {
      if (/Talent House/.test(m[2])) doubled.push(`${rel(file)}: ${m[2]}`)
    }
  }
  assert.deepEqual(doubled, [], `these titles get the brand appended to a title that already has it:\n${doubled.join('\n')}`)
})

test('no title or description is cut off in the result', () => {
  const tooLong: string[] = []
  for (const file of pageFiles()) {
    const { body } = metadataBlocks(readFileSync(file, 'utf8'))
    for (const m of body.matchAll(/(?:title|absolute): (['"])((?:\\.|(?!\1).)*)\1/g)) {
      if (m[2].length > 62) tooLong.push(`${rel(file)}: title ${m[2].length} chars`)
    }
    for (const m of body.matchAll(/description: (['"])((?:\\.|(?!\1).)*)\1/g)) {
      if (m[2].length > 158) tooLong.push(`${rel(file)}: description ${m[2].length} chars`)
    }
  }
  assert.deepEqual(tooLong, [], `truncated in every search result:\n${tooLong.join('\n')}`)
})

test('a page that sets openGraph keeps its card image', () => {
  // This is the one that hit twenty-six pages. Setting only title and
  // description replaces the whole root openGraph object - siteName, locale,
  // type and images with it - so the share card loses its picture. There is no
  // warning; the page looks perfect.
  const imageless: string[] = []
  for (const file of pageFiles()) {
    if (rel(file) === 'src/app/layout.tsx') continue
    const { openGraph } = metadataBlocks(readFileSync(file, 'utf8'))
    if (!openGraph) continue
    if (!/OG_DEFAULTS/.test(openGraph) && !/images/.test(openGraph)) imageless.push(rel(file))
  }
  assert.deepEqual(imageless, [], `these share as a grey link with no picture:\n${imageless.join('\n')}`)
})

test('a page that sets openGraph sets its own twitter card too', () => {
  // Without one it inherits the root card, which announces every page as a
  // careers site. Share the document shop or the Academy and the card is wrong.
  const inherited: string[] = []
  for (const file of pageFiles()) {
    if (rel(file) === 'src/app/layout.tsx') continue
    const source = readFileSync(file, 'utf8')
    const { openGraph, body } = metadataBlocks(source)
    if (!openGraph) continue
    if (!/twitter:/.test(body)) inherited.push(rel(file))
  }
  assert.deepEqual(inherited, [], `these share under the wrong card:\n${inherited.join('\n')}`)
})

test('the canonical origin is never the old host', () => {
  // talent.wellnesshousecollective.co.uk is a 301. A canonical, a sitemap entry
  // or a piece of structured data pointing at it tells a search engine the
  // redirect is the real page.
  for (const file of pageFiles().concat([join(APP, 'sitemap.ts'), join(APP, 'robots.ts')])) {
    const source = readFileSync(file, 'utf8')
    assert.doesNotMatch(source, /talent\.wellnesshousecollective\.co\.uk/, `${rel(file)} points at the old host`)
  }
})
