import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const MOBILE = new URL('../mobile/', import.meta.url).pathname

const LIVE = 'https://talenthousecollective.co.uk'
// 301s to LIVE. A redirect is fine for a person following a link and wrong for
// everything else here.
const RETIRED = 'talent.wellnesshousecollective.co.uk'

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.expo') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full)
  }
  return files
}

// A production build was shipped pointing at a pull request's Netlify deploy
// preview. It was set deliberately, to test one branch against one backend,
// and then never put back - so every TestFlight build since aimed the app at a
// URL that stops existing the moment that PR is merged or closed.
//
// Nothing about this looks wrong in an app that is working. It breaks later,
// all at once, for everybody, at the moment somebody tidies up a pull request.
test('a production build never points at a temporary backend', () => {
  const eas = JSON.parse(read('mobile/eas.json'))
  for (const [name, profile] of Object.entries<any>(eas.build || {})) {
    const url = String(profile?.env?.EXPO_PUBLIC_WEB_URL || '')
    if (!url) continue
    assert.ok(!/deploy-preview|--whc-concierge\.netlify\.app|localhost|ngrok|\.trycloudflare\./.test(url),
      `the ${name} build profile points at a temporary backend: ${url}`)
  }
  assert.equal(eas.build?.production?.env?.EXPO_PUBLIC_WEB_URL, LIVE, 'production builds must use the live domain')
  assert.equal(eas.build?.preview?.env?.EXPO_PUBLIC_WEB_URL, LIVE, 'preview builds test against the live domain too')
})

// The old domain 301s, which is fine for somebody following a link and wrong
// for an app: a redirect can drop the method and body of a POST, and Stripe
// return URLs stop matching what the app is waiting for.
test('the retired domain is gone from the app', () => {
  const offenders: string[] = []
  for (const file of walk(MOBILE)) {
    if (readFileSync(file, 'utf8').includes(RETIRED)) offenders.push(file.split('/mobile/')[1])
  }
  assert.deepEqual(offenders, [], 'these still fall back to the domain that redirects')

  // Android verifies app links against this host. Left on the old domain, a
  // link from the live site opens a browser instead of the app.
  const app = JSON.parse(read('mobile/app.json'))
  const hosts = JSON.stringify(app).match(/"host":\s*"([^"]+)"/g) || []
  for (const host of hosts) {
    assert.ok(!host.includes(RETIRED), `a deep-link host still points at the retired domain: ${host}`)
  }
})

// Every screen reads EXPO_PUBLIC_WEB_URL with a hardcoded fallback. The
// fallback is what runs in Expo Go and in any build whose env was not set, so
// it has to be somewhere real rather than somewhere that used to be.
test('the fallback URL in the app is the live site', () => {
  const wrong: string[] = []
  for (const file of walk(MOBILE)) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/EXPO_PUBLIC_WEB_URL\s*\|\|\s*'([^']+)'/g)) {
      if (match[1] !== LIVE) wrong.push(`${file.split('/mobile/')[1]}: ${match[1]}`)
    }
  }
  assert.deepEqual(wrong, [], 'these fall back to the wrong site when the environment is unset')
})
