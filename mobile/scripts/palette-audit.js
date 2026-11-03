// The app may only wear a colour the website already ships.
//
// This exists because the app drifted three times without anyone noticing. The
// site moved navy to charcoal, charcoal to neutral grey, then grey to ivory and
// stone, and each time the app stayed where it was: two generations behind,
// still wearing the metal the site had removed, still pressing charcoal against
// the site's own rule that forest carries anything you press. None of it showed
// up in CI, because mobile CI only ever checked routes and types, and none of it
// showed up in the brief, because the brief has no mobile section.
//
// So the allowlist is not written here. It is read from the website's own
// tailwind.config.js, which means this check fails the next time the site
// changes palette and the app does not follow. That failure is the point.
//
// The severity triples are listed explicitly because they live in src rather
// than the config: the amber ink/edge/wash in src/lib/documents/plan-pdf.tsx,
// and the red the admin pages use for a destructive notice.

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const sourceDirs = [path.join(root, 'app'), path.join(root, 'src')]
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx'])
const tailwindConfig = path.join(root, '..', 'tailwind.config.js')

const HEX = /#[0-9a-fA-F]{6}\b/g

// Severity, from src rather than the config. Amber: plan-pdf's medium band.
// Red: the destructive notice on the admin document pages.
const SEVERITY = ['#7a4a00', '#d9ab63', '#fdf1df', '#8a1c14', '#d99089', '#fbe9e7']
// Pure white is not a brand token but every card in both products sits on it.
const ALWAYS = ['#ffffff']

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

if (!fs.existsSync(tailwindConfig)) {
  console.error(`Mobile palette audit could not read ${tailwindConfig}.`)
  console.error('It derives the allowed colours from the website, so it cannot run without it.')
  process.exit(1)
}

const allowed = new Set(
  [...(fs.readFileSync(tailwindConfig, 'utf8').match(HEX) || []), ...SEVERITY, ...ALWAYS]
    .map(value => value.toLowerCase()),
)

const files = sourceDirs
  .flatMap(walk)
  .filter(file => sourceExtensions.has(path.extname(file)))

const offenders = []
for (const file of files) {
  for (const [index, line] of fs.readFileSync(file, 'utf8').split('\n').entries()) {
    for (const hex of line.match(HEX) || []) {
      if (!allowed.has(hex.toLowerCase())) {
        offenders.push({ file, line: index + 1, hex })
      }
    }
  }
}

// Forest is the accent and charcoal is the ink, and an accent equal to the ink
// is not an accent. The website holds this in a readiness check; the app holds
// it here, because the app had broken it for its whole life.
const theme = fs.readFileSync(path.join(root, 'src', 'lib', 'theme.ts'), 'utf8')
function token(name) {
  const found = theme.match(new RegExp(`\\b${name}:\\s*'(#[0-9a-fA-F]{6})'`))
  return found ? found[1].toLowerCase() : null
}
const problems = []
for (const name of ['accent', 'ink']) {
  if (!token(name)) problems.push(`theme.ts does not define ${name}`)
}
if (token('accent') && token('accent') === token('ink')) {
  problems.push(`accent ${token('accent')} is equal to ink: an accent equal to the ink is not an accent`)
}

// No gold and no brass, which is the same thing wearing a better name. Brass is
// 2.89:1 on the ivory and white on a brass button is 3.2:1 where 4.5 is the
// floor, so it fails as text, as a button and as an icon.
const METAL = /#(?:d4af37|c9a[0-9a-f]{3}|c8aa68|b29a6a|9a7436|8a6a3a|d9c39a)\b/i
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  if (METAL.test(source)) {
    problems.push(`${path.relative(root, file)} reaches for metal`)
  }
}

// Taupe and sage are decoration only. They are 2.10:1 and 2.99:1 on the ivory,
// so a sentence written in either is a sentence somebody cannot read.
const DECOR_ONLY = ['#b5a898', '#879080']
for (const file of files) {
  for (const [index, line] of fs.readFileSync(file, 'utf8').split('\n').entries()) {
    for (const hex of DECOR_ONLY) {
      if (new RegExp(`color:\\s*'${hex}'`, 'i').test(line)) {
        problems.push(`${path.relative(root, file)}:${index + 1} writes a word in taupe or sage`)
      }
    }
  }
}

if (offenders.length || problems.length) {
  if (offenders.length) {
    console.error('Mobile palette audit failed. These colours are not ones the website ships:')
    for (const item of offenders) {
      console.error(`- ${path.relative(root, item.file)}:${item.line} ${item.hex}`)
    }
    console.error('')
    console.error('Either the website has moved and the app has to follow, or this is a new')
    console.error('colour that belongs in tailwind.config.js first.')
  }
  for (const problem of problems) console.error(`- ${problem}`)
  process.exit(1)
}

console.log(
  `Mobile palette audit passed: ${files.length} files checked against ${allowed.size} website colours.`,
)
