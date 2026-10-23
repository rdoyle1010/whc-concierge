// The web icon set, for the browser tab and the phone home screen.
//
// The native app has had a proper monogram since generate-app-icons.js; the
// website was still handing the browser its SVG logo and nothing else. That
// works in a tab and falls apart everywhere else: "Add to Home Screen" on a
// phone produced a screenshot of the page rather than a mark, and Android's
// install prompt never appeared at all because there was no manifest to read.
//
// Same mark, same reasoning as the app icons: at forty pixels the only things
// that survive are the letter shapes and the contrast behind them.
//
// Run from the repo root, where sharp lives:  node scripts/generate-web-icons.js
const sharp = require('sharp')
const path = require('path')

const OUT = path.join(__dirname, '..', 'public', 'icons')
const CHARCOAL = '#1C1C1C'   // the website's ink
const WARM = '#E8E1D5'       // warm off-white, not stark

const mark = (size, scale) => {
  const fontSize = size * 0.42 * scale
  return `<text x="${size / 2}" y="${size / 2 + fontSize * 0.355}" text-anchor="middle"
    font-family="Bitstream Charter, Liberation Serif, DejaVu Serif, serif"
    font-size="${fontSize}" fill="${WARM}">TH</text>`
}

async function write(name, svg, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT, name))
  console.log('wrote icons/' + name)
}

async function main() {
  const { mkdirSync } = require('fs')
  mkdirSync(OUT, { recursive: true })

  const S = 1024
  const solid = scale => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <rect width="${S}" height="${S}" fill="${CHARCOAL}"/>${mark(S, scale)}</svg>`

  // The two sizes every install prompt asks for.
  await write('icon-192.png', solid(1), 192)
  await write('icon-512.png', solid(1), 512)

  // Maskable: Android crops this to whatever shape the launcher uses and
  // guarantees only the middle two thirds, so the monogram sits smaller and
  // the charcoal runs to the edge to be cropped into.
  await write('icon-maskable-512.png', solid(0.6), 512)

  // iOS applies its own corner radius to a full-bleed square and ignores
  // transparency, so this one is solid at the size Safari asks for.
  await write('apple-touch-icon.png', solid(1), 180)
}

main().catch(error => { console.error(error); process.exit(1) })
