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

test('a page break is asked for on the section, never on the rule at the top of it', () => {
  // react-pdf moved the divider to a new page and then laid the rest of the
  // section out against the space left on the old one, so everything after it
  // got about half the leading it needed.
  assert.ok(/style=\{\[styles\.section[^\]]*\]\} break=\{breaks\}/.test(source),
    'the section carries the break')
  // And a section that breaks carries no top margin, on itself or on its
  // divider. Forty points of leading margin that will not fit on the page
  // being left behind takes a page of its own, and that page is blank.
  assert.ok(/styles\.section, breaks \? \{ marginTop: 0 \}/.test(source),
    'a breaking section drops its top margin')
  assert.ok(/styles\.partDivider, breaks \? \{ marginTop: 0 \}/.test(source),
    'and so does its part divider')
  assert.ok(!/styles\.partDivider\} break=/.test(source),
    'the divider must not carry it')
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
