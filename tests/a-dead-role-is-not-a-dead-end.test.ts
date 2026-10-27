import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// Saved Roles offered "View & Apply" on a role that had closed, with "This role
// is no longer active" printed underneath it. /jobs/[id] selects on is_live and
// calls notFound(), so the button was a guaranteed 404: the card knew the role
// was dead and sent somebody there anyway.
test('a saved role that has closed does not offer a link that 404s', () => {
  const page = read('src/app/talent/saved/page.tsx')
  assert.match(page, /\{job\.is_live \? \(/, 'the apply link must be behind is_live')
  const applyLine = page.split('\n').find(line => line.includes('View &amp; Apply') || line.includes('View & Apply'))
  assert.ok(applyLine, 'the apply link should still exist for a live role')
  assert.match(page, /Find similar roles/, 'a closed role needs somewhere to go')
  // The route it 404s from is the reason, so hold that too: if /jobs/[id] ever
  // stops filtering on is_live this rule can be relaxed deliberately.
  const role = read('src/app/jobs/[id]/page.tsx')
  assert.match(role, /\.eq\('is_live', true\)/)
  assert.match(role, /notFound\(\)/)
})

// Forest carries anything you press. The dashboard stylesheet repainted every
// primary and accent button with the ink, so the whole signed-in product sat at
// charcoal and turned forest only on hover. It survived the palette move
// because it took the neutral-to-warm translation (#1c1c1c -> #222321) instead
// of the ink-to-accent one, and no check looked at CSS.
test('no rule repaints a primary or accent button with the ink', () => {
  const css = read('src/app/globals.css')
  const INK = ['#222321', '#161814', '#1c1b1a', '#1c1c1c']
  const offenders: string[] = []
  // Each rule block: selector { declarations }
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].replace(/\/\*[\s\S]*?\*\//g, '').trim()
    const body = match[2]
    if (!/\.btn-(primary|accent)\b/.test(selector)) continue
    if (/:disabled/.test(selector)) continue // a disabled button is not pressed
    const background = body.match(/background(?:-color)?:\s*([^;]+)/)
    if (!background) continue
    const value = background[1].trim().toLowerCase()
    if (INK.some(ink => value.includes(ink))) {
      offenders.push(`${selector.replace(/\s+/g, ' ')} -> ${value}`)
    }
  }
  assert.deepEqual(offenders, [], 'a pressable surface must not be painted the reading colour')
})
