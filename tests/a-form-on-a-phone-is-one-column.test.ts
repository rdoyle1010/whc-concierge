import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Three fields across a phone screen is two fields too many.
//
// The onboarding form put Availability Date, Agency day rate min and Agency
// day rate max in a bare grid-cols-3. On a phone the two rate labels wrapped
// to a second line and the date label did not, so the three input boxes sat at
// three different heights. The first person to sign up spotted it inside a
// minute, and it was the only thing they had to say against the whole flow.
//
// Tailwind's grid-cols-N with no breakpoint applies at every width, phone
// included. A responsive prefix is what makes it "three across once there is
// room for three across".

const FORMS = [
  'src/app/talent/onboarding/page.tsx',
  'src/app/talent/profile/page.tsx',
  'src/app/register/talent/page.tsx',
  'src/app/register/employer/page.tsx',
  'src/app/employer/post-role/page.tsx',
  'src/app/employer/profile/page.tsx',
]

// grid-cols-2 or wider, with no sm:/md:/lg: sibling in the same class list.
const UNGUARDED = /className="[^"]*\bgrid-cols-[2-9]\b[^"]*"/g

function body(source: string) {
  return source
    .split('\n')
    .filter(line => !line.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
}

test('no form makes a phone show columns it has no room for', () => {
  const offenders: string[] = []

  for (const file of FORMS) {
    let source: string
    try { source = body(readFileSync(join(process.cwd(), file), 'utf8')) } catch { continue }
    for (const match of source.match(UNGUARDED) || []) {
      if (/(sm|md|lg|xl):grid-cols-/.test(match)) continue
      offenders.push(`${file}  ${match.slice(0, 90)}`)
    }
  }

  assert.deepEqual(offenders, [],
    `These put multiple columns on a phone. Add a breakpoint, e.g. grid-cols-1 sm:grid-cols-3:\n  ${offenders.join('\n  ')}`)
})

test('the three fields that started it are bottom-aligned', () => {
  // A label that wraps must never be able to push its own input out of line
  // with the one beside it, at any width.
  const page = readFileSync(join(process.cwd(), 'src/app/talent/onboarding/page.tsx'), 'utf8')
  assert.match(page, /grid-cols-1 sm:grid-cols-3 gap-4 items-end/,
    'the availability and day-rate row must stack on a phone and bottom-align above it')
})
