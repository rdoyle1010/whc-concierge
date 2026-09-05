import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'

// Every build shipped with Expo's default icon. On a platform selling luxury
// spa recruitment, the first thing anybody saw was a developer placeholder -
// before they had opened it, on a screen they look at all day. Google Play
// will not accept a listing without a 512px icon either, so this also
// blocked Android entirely.
const ICONS = ['icon.png', 'adaptive-icon.png', 'splash-icon.png', 'favicon.png']

test('the icon set exists and is not empty', () => {
  for (const name of ICONS) {
    const file = `mobile/assets/${name}`
    assert.ok(existsSync(file), `${file} is missing - the build would fall back to the Expo default`)
    assert.ok(statSync(file).size > 500, `${file} is too small to be a real image`)
  }
})

test('the app config points at them', () => {
  const config = JSON.parse(readFileSync('mobile/app.json', 'utf8')).expo

  assert.equal(config.icon, './assets/icon.png', 'iOS and the store listing read the top-level icon')
  assert.equal(config.android?.adaptiveIcon?.foregroundImage, './assets/adaptive-icon.png',
    'Android needs an adaptive foreground, or the launcher draws its own placeholder')

  // The ground behind the cropped foreground, and behind the app itself.
  assert.equal(config.android?.adaptiveIcon?.backgroundColor, '#1C1C1C')
  assert.equal(config.backgroundColor, '#1C1C1C')
})

test('the icons can be rebuilt rather than only found', () => {
  // An asset nobody can regenerate is an asset nobody dares change.
  const script = 'scripts/generate-app-icons.js'
  assert.ok(existsSync(script), 'the generator must stay in the repository')
  const source = readFileSync(script, 'utf8')
  for (const name of ICONS) {
    assert.ok(source.includes(name), `${name} is not produced by the generator`)
  }
})
