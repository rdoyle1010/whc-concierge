import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// The platform is Talent House Collective. The company that operates it is
// Wellness House Collective Ltd. Both names are correct, in different places,
// and the difference is not cosmetic:
//
//   - Product copy says Talent House. A professional signing up has never
//     heard of the other name, and an email or a screen carrying it reads as
//     a different business.
//   - Terms, the privacy notice, consent wording, IP statements and financial
//     documents name the legal entity, because that is who the contract is
//     with, who the data controller is and who receives the money. Changing
//     those retroactively would misstate what people agreed to.
//
// So this is not a find-and-replace waiting to happen. The list below is the
// only place the old name may appear, each entry there on purpose.
const LEGAL_ENTITY_FILES = new Set([
  'src/app/terms/page.tsx',                    // operated by Wellness House Collective Ltd
  'src/app/privacy/page.tsx',                  // the data controller
  'src/app/advertising-terms/page.tsx',        // the contracting party
  'src/app/verify/[code]/page.tsx',            // who issued the certificate
  'src/app/talent/agency/statement/page.tsx',  // who received and paid the money
  'src/lib/privacy-consent.ts',                // the wording people already consented to
  'src/lib/billing-identity.ts',               // a comment about invoice identity
  'src/lib/academy-manual-pdf.tsx',            // course authorship
  'mobile/app/security.tsx',                   // the IP and copyright statement
])

function sourceFiles(root: string): string[] {
  const found: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.expo') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(ts|tsx|json)$/.test(entry)) found.push(full)
    }
  }
  walk(root)
  return found
}

test('product copy carries one brand, and it is Talent House', () => {
  const offenders: string[] = []
  for (const file of [...sourceFiles('src'), ...sourceFiles('mobile/app'), 'mobile/app.json']) {
    if (LEGAL_ENTITY_FILES.has(file)) continue
    // Course content credits the company that wrote it, which is accurate.
    if (file.startsWith('src/lib/academy-content/') || file.startsWith('src/lib/academy-more/')) continue
    if (readFileSync(file, 'utf8').includes('Wellness House')) offenders.push(file)
  }
  assert.deepEqual(offenders, [],
    `these say Wellness House to somebody who signed up to Talent House: ${offenders.join(', ')}`)
})

test('the legal entity is still named where it has to be', () => {
  // The other direction. A brand sweep that tidied these away would leave the
  // terms naming a company that is not party to them.
  for (const file of ['src/app/terms/page.tsx', 'src/app/privacy/page.tsx', 'src/lib/privacy-consent.ts']) {
    assert.match(readFileSync(file, 'utf8'), /Wellness House Collective/,
      `${file} must still name the operating company`)
  }
})

test('the mobile app introduces itself as Talent House', () => {
  const config = JSON.parse(readFileSync('mobile/app.json', 'utf8'))
  assert.equal(config.expo.name, 'Talent House',
    'the name in app.json is the name under the icon on somebody’s home screen')
})

test('the app does not speak in initials the website never uses', () => {
  // The website says Talent House Academy, a Talent House fee, Talent House
  // Verified. The app said WHC Academy, a WHC fee, WHC VERIFIED - seventy-one
  // times across twenty-three screens, and not once on the web. Somebody
  // moving between the two was reading about two different companies, which
  // is a large part of why the app felt like a lesser thing rather than the
  // same thing in your pocket.
  //
  // whctalent (the deep-link scheme), whc- prefixes and WHC_ variables are
  // machine names nobody reads, and stay.
  const offenders: string[] = []
  for (const file of sourceFiles('mobile/app')) {
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, index) => {
      if (/\bWHC\b/.test(line)) offenders.push(`${file}:${index + 1}`)
    })
  }
  assert.deepEqual(offenders, [],
    `the app calls the brand WHC here, and the website never does: ${offenders.join(', ')}`)
})
