import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// The overlapping-text bug, written down so it cannot come back quietly.
//
// Every risk assessment, operating procedure and emergency plan in the shop
// printed with text on top of other text: part headings struck through by
// their own section titles, notes lying across the risk scoring row, control
// lists with their lines crushed into each other. It looked like a corrupt
// file, and the fault was one attribute on one element.
//
// These are source checks, and source checks are weak. The bug was invisible
// in the code and obvious in the rendered file, and it was found by rendering
// and measuring, not by reading. scripts/preview-risk-assessment.tsx is how
// you look; this is only here so nobody undoes the fix without meeting it.

const source = readFileSync('src/lib/documents/plan-pdf.tsx', 'utf8')

test('a section is not wrapped in a container that can outgrow a page', () => {
  // Two faults, one structure.
  //
  // The overlapping text: a part divider inside a section container, with the
  // break on the divider. react-pdf moved the divider to a new page and laid
  // the rest of the container out against the space left on the old one.
  //
  // The blank pages: the same container, with the break on the container. When
  // it was taller than a page, react-pdf moved it with a negative top, split
  // it, found nothing that fitted, and printed an empty sheet. Nine of them.
  //
  // Both go away when the divider, the heading and the body are siblings in
  // the page's own flow. So: no container, and the break on whichever sibling
  // comes first.
  assert.ok(!/style=\{\[styles\.section[,\]]/.test(source),
    'the section container is gone, and must not come back')
  assert.ok(/styles\.partDivider, breaks \? \{ marginTop: 0 \} : \{\}\]\} break=\{breaks\}/.test(source),
    'the divider carries the break, and no top margin when it does')
  assert.ok(/break=\{breaks && !startsPart\} minPresenceAhead=\{SECTION_ROOM\}/.test(source),
    'the heading carries it when there is no divider, and keeps room ahead of it')
})

test('every text larger than the page carries its own leading', () => {
  // A unitless lineHeight on the Page is resolved once, against the page's own
  // font size, and inherited by everything under it. Anything smaller is
  // merely generous. Anything larger is given too little and overlaps.
  const base = Number(/fontSize: (\d+(?:\.\d+)?), lineHeight/.exec(source)?.[1])
  assert.equal(base, 9)

  const failures: string[] = []
  for (const line of source.split('\n')) {
    const size = /fontSize: (\d+(?:\.\d+)?)/.exec(line)
    if (!size || Number(size[1]) <= base) continue
    if (line.includes('lineHeight')) continue
    // A field is a box of a stated height, not a run of text.
    if (/height:|TextInput/.test(line)) continue
    failures.push(line.trim())
  }
  assert.deepEqual(failures, [], 'these set a font size above the page default with no lineHeight')
})

test('a step that cannot fit moves or splits, and never prints over the footer', () => {
  // react-pdf will not move a wrap={false} block once the page it is on has
  // already broken. It prints it past the bottom of the text block instead,
  // straight across the fixed footer.
  const row = /<View key=\{`\$\{keyBase\}-a\$\{index\}`\} style=\{styles\.actionRow\}([^>]*)>/.exec(source)
  assert.ok(row, 'the action row is still there')
  assert.ok(!row![1].includes('wrap={false}'), 'it must be allowed to split')
  assert.ok(row![1].includes('minPresenceAhead'), 'and it should still try to stay whole')
})
