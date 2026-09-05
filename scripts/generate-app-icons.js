// Regenerates the app icon set into mobile/assets.
//
// Run from the repo root, where sharp lives:  node scripts/generate-app-icons.js
//
// The app shipped with Expo's default icon on every build. On a platform
// selling luxury spa recruitment, the first thing anybody saw was a
// developer placeholder - before they had opened it, and on a screen they
// look at all day.
//
// This is a monogram and nothing else, because at forty pixels the only
// things that survive are the shape of the letters and the contrast behind
// them. An earlier version had a hairline rule under the letters and a
// little letter-spacing; both moved the optical centre and neither was
// visible at the size that matters.
const sharp = require('sharp')
const path = require('path')

const OUT = path.join(__dirname, '..', 'mobile', 'assets')
const CHARCOAL = '#1C1C1C'   // the website's ink
const WARM = '#E8E1D5'       // warm off-white, not stark

// The baseline sits below the middle by a share of the cap height, which
// centres the capitals rather than the em box. Centring the em box is what
// left the first attempt floating above the middle of the square.
const mark = (size, scale) => {
  const fontSize = size * 0.42 * scale
  return `<text x="${size / 2}" y="${size / 2 + fontSize * 0.355}" text-anchor="middle"
    font-family="Bitstream Charter, Liberation Serif, DejaVu Serif, serif"
    font-size="${fontSize}" fill="${WARM}">TH</text>`
}

async function write(name, svg, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT, name))
  console.log('wrote', name)
}

async function main() {
  const S = 1024
  const solid = scale => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <rect width="${S}" height="${S}" fill="${CHARCOAL}"/>${mark(S, scale)}</svg>`
  const clear = scale => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">${mark(S, scale)}</svg>`

  // iOS applies its own corner radius to a full-bleed square.
  await write('icon.png', solid(1), S)

  // Android crops the foreground to a circle or a squircle depending on the
  // launcher, and guarantees only the middle two thirds. So the monogram
  // sits smaller on transparency and the ground comes from app.json.
  await write('adaptive-icon.png', clear(0.60), S)

  // Ready for expo-splash-screen. Adding that plugin is a separate job; the
  // asset is here so it is one line when somebody does it.
  await write('splash-icon.png', clear(0.66), S)

  await write('favicon.png', solid(1), 96)
}

main().catch(error => { console.error(error); process.exit(1) })
