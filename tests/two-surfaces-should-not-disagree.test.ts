import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanWebsiteUrl, normaliseBrand } from '../src/lib/brand-profiles'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// The phone read candidate_profiles directly and filtered stealth_mode = false.
// In Postgres null = false is null, not true, so every professional who had
// never touched the setting was invisible on mobile while being visible on the
// website, where an untouched setting deliberately means visible.
test('the phone and the website agree about who exists', () => {
  const screen = body('mobile/app/discover-talent.tsx')
  assert.doesNotMatch(screen, /\.eq\('stealth_mode'/, 'a null setting is not the same as false')
  assert.doesNotMatch(screen, /from\('candidate_profiles'\)/, 'the guard lives in one place, on the server')
  assert.match(screen, /api\/mobile\/employer-directory/, 'it must use the route that runs the guard')
})

// It also built the display name itself, so it honoured the first-name-only
// choice and knew nothing about Private Career Mode: a professional the website
// anonymises could appear on the phone under her real name.
test('the phone does not rename anybody the website has hidden', () => {
  const screen = body('mobile/app/discover-talent.tsx')
  assert.doesNotMatch(screen, /show_first_name_only&&item\.full_name/, 'the presenter has already decided the name')
  assert.match(screen, /const display=item\.full_name\|\|'Talent profile'/)

  // And the route it now calls is the one that presents.
  const route = body('src/app/api/mobile/employer-directory/route.ts')
  assert.match(route, /presentCandidateForEmployer\(candidate\)/)
  assert.match(route, /canEmployerDiscoverCandidate\(candidate, blocked\)/)
})

// website_url ran through secureImageUrl, an image validator, so a brand that
// typed what people actually type had their website silently replaced with
// nothing on the page arguing for their brand.
test('a brand keeps the website it typed', () => {
  assert.equal(cleanWebsiteUrl('caroljoylondon.com'), 'https://caroljoylondon.com/')
  assert.equal(cleanWebsiteUrl('www.caroljoylondon.com/pages/spa'), 'https://www.caroljoylondon.com/pages/spa')
  assert.equal(cleanWebsiteUrl('http://caroljoylondon.com'), 'https://caroljoylondon.com/', 'plain http is upgraded, not dropped')
  assert.equal(cleanWebsiteUrl('https://caroljoylondon.com/'), 'https://caroljoylondon.com/')

  // It still ends up in an href, so anything that is not a web address goes.
  assert.equal(cleanWebsiteUrl('javascript:alert(1)'), null)
  assert.equal(cleanWebsiteUrl('data:text/html,<script>'), null)
  assert.equal(cleanWebsiteUrl('not a website'), null)
  assert.equal(cleanWebsiteUrl('localhost'), null, 'a hostname with no dot is a typo')
  assert.equal(cleanWebsiteUrl(''), null)
  assert.equal(cleanWebsiteUrl(null), null)

  assert.equal(normaliseBrand({ slug: 'x', name: 'X', website_url: 'caroljoylondon.com' }).website_url, 'https://caroljoylondon.com/')
  // Pictures keep the stricter rule: a broken image on a page selling a brand
  // is worse than a missing one.
  assert.equal(normaliseBrand({ slug: 'x', name: 'X', logo_url: 'caroljoylondon.com/logo.png' }).logo_url, null)
})

// The drawer rendered nothing at all when there was no CV, so an employer could
// not tell whether it was being withheld or had never been uploaded.
test('an employer is told why a CV is not there', () => {
  const page = read('src/app/employer/candidates/page.tsx')
  assert.match(page, /has not uploaded a CV/)
  assert.match(page, /Hidden while this profile is private/)
})
