import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assertStripeModeMatchesOrigin,
  getSafeSiteOrigin,
  isWhcDeployPreviewOrigin,
} from '../src/lib/site-origin.ts'

const LIVE_SITE = 'https://talent.wellnesshousecollective.co.uk'
const PREVIEW = 'https://deploy-preview-1--whc-concierge.netlify.app'

test('accepts the configured live site and the fixed production Netlify origin', () => {
  assert.equal(getSafeSiteOrigin(LIVE_SITE, LIVE_SITE), LIVE_SITE)
  assert.equal(
    getSafeSiteOrigin('https://whc-concierge.netlify.app', LIVE_SITE),
    'https://whc-concierge.netlify.app',
  )
})

test('accepts a genuine WHC Netlify deploy preview for Stripe return links', () => {
  assert.equal(isWhcDeployPreviewOrigin(PREVIEW), true)
  assert.equal(getSafeSiteOrigin(`${PREVIEW}/advertise`, LIVE_SITE), PREVIEW)
})

test('rejects lookalike and unrelated preview hosts', () => {
  assert.equal(isWhcDeployPreviewOrigin(`${PREVIEW}.attacker.example`), false)
  assert.equal(isWhcDeployPreviewOrigin('https://deploy-preview-1--other-site.netlify.app'), false)
  assert.equal(getSafeSiteOrigin(`${PREVIEW}.attacker.example`, LIVE_SITE), LIVE_SITE)
})

test('blocks live Stripe keys on deploy previews', () => {
  assert.throws(
    () => assertStripeModeMatchesOrigin(PREVIEW, 'sk_live_example'),
    /Live Stripe payments are disabled on deploy previews/,
  )
})

test('allows Stripe test keys on deploy previews and live keys on the live site', () => {
  assert.doesNotThrow(() => assertStripeModeMatchesOrigin(PREVIEW, 'sk_test_example'))
  assert.doesNotThrow(() => assertStripeModeMatchesOrigin(LIVE_SITE, 'sk_live_example'))
})
