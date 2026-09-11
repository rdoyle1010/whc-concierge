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

// Two plan cards, £149 and £249, and the only thing separating the chosen one
// from the other was a one-pixel border in the same charcoal as everything
// else on the page. On a charcoal palette that is not a selected state, it is
// a rounding error - so the last thing somebody saw before being sent to
// Stripe was two identical cards and a button that would not say which one it
// was about to charge for.
test('the chosen plan is obvious before anybody reaches Stripe', () => {
  const page = body('src/app/employer/post-role/page.tsx')

  // A tick, filled in, in a colour that is not the page's own charcoal.
  assert.match(page, /chosen\?'bg-\[#166534\]/, 'the selected card needs a filled indicator')
  assert.match(page, /ring-2 ring-\[#166534\]/, 'the selected card needs to read as selected at a glance')
  assert.match(page, /aria-checked=\{chosen\}/, 'a screen reader has to know which one is chosen too')
  assert.match(page, /role="radio"/)

  // The unchosen card has to invite the click rather than look disabled.
  assert.match(page, /Choose this/)
  assert.match(page, /'Selected'/)

  // And the button says what it is about to charge, so the amount is on the
  // last thing clicked rather than only on the card above it.
  assert.match(page, /Post role & pay £\$\{/)
})

// Every non-submit button in this codebase declares its type, because a bare
// button inside a form submits it.
test('the plan cards are buttons that do not submit anything', () => {
  const page = body('src/app/employer/post-role/page.tsx')
  const cardButton = page.slice(page.indexOf('tierCards.map'), page.indexOf('tierCards.map') + 400)
  assert.match(cardButton, /type="button"/)
})
