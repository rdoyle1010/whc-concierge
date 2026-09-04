import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { featuredBlock, sponsorBlock, safeHttpUrl } from '../src/lib/newsletter-blocks'
import { candidateCard, employerCard } from '../src/lib/newsletter-cards'
import { newsletterWelcomeHtml } from '../src/lib/newsletter-welcome-email'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// The preview drew a grey box of names while the send built proper cards, so
// featuring somebody looked as though it had done nothing at all.
test('the preview and the send use one renderer', () => {
  const page = read('src/app/admin/campaigns/page.tsx')
  const route = read('src/app/api/admin/campaigns/route.ts')
  assert.match(page, /featuredBlock\(/, 'the preview builds real cards')
  assert.match(route, /featuredBlock\(/, 'and so does the send')
  assert.ok(!/Featured this week<\/div>/.test(page), 'no hand-rolled placeholder markup left in the preview')
})

test('a featured card survives a profile with almost nothing on it', () => {
  const card = candidateCard({ id: 'x', full_name: 'Hannah Francis' })
  assert.equal(card.title, 'Hannah Francis')
  assert.match(card.subtitle, /Wellness professional/)
  const html = featuredBlock([card])
  assert.match(html, /Hannah Francis/)
  assert.match(html, /Featured this week/)
  // No image means an initial, not a broken image in somebody's inbox.
  assert.match(html, /border-radius:50%;background:#1c1c1c/)
  assert.equal(featuredBlock([]), '', 'nothing selected renders nothing')
  assert.match(employerCard({ id: 'e', company_name: 'The Grand' }).subtitle, /Preferred Employer/)
})

// Paid placement has to be identifiable. Blurring it spends the trust that
// makes the slot worth buying.
test('a sponsor is always labelled and its link is tagged', () => {
  const html = sponsorBlock({ name: 'ESPA', headline: 'New professional range', text: 'Available now.', url: 'https://espa.com' })
  assert.match(html, /Sponsored &middot; ESPA/)
  assert.match(html, /rel="nofollow sponsored"/, 'a paid link must say so to search engines')
  assert.match(html, /New professional range/)
})

test('a half-filled sponsor renders nothing rather than an empty box', () => {
  assert.equal(sponsorBlock(null), '')
  assert.equal(sponsorBlock({ name: 'ESPA' }), '', 'a name with no message is not an advert')
  assert.equal(sponsorBlock({ headline: 'Something' }), '', 'an advert with no advertiser cannot be labelled')
})

// An email goes somewhere nothing of ours can intervene.
test('only http and https survive into an email', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), '')
  assert.equal(safeHttpUrl('data:text/html,<script>'), '')
  assert.equal(safeHttpUrl('not a url'), '')
  assert.match(safeHttpUrl('https://espa.com/x'), /^https:\/\/espa\.com/)
  const html = sponsorBlock({ name: 'X', headline: 'Y', url: 'javascript:alert(1)' })
  assert.ok(!html.includes('javascript:'), 'a bad link is dropped, not rendered')
  assert.ok(!html.includes('Find out more'), 'and the button goes with it')
})

test('sponsor copy is escaped, not injected', () => {
  const html = sponsorBlock({ name: '<script>x</script>', headline: 'A & B', text: '"quoted"' })
  assert.ok(!html.includes('<script>'))
  assert.match(html, /A &amp; B/)
})

// A subscriber has given an email address and nothing else. Telling them to
// complete a profile sends them to a sign-in wall.
test('the newsletter welcome is written for a subscriber, not a member', () => {
  const html = newsletterWelcomeHtml({ unsubscribeUrl: 'https://talenthousecollective.co.uk/u/1' })
  assert.ok(!/complete your profile/i.test(html), 'they have no profile to complete')
  assert.ok(!/go to my account/i.test(html), 'they have no account to go to')
  assert.match(html, /twice a month/, 'say what arrives and how often')
  assert.match(html, /Unsubscribe/)
  assert.match(html, /Talent House Collective/)
  assert.ok(!/Wellness House Collective/.test(html), 'the platform is not called that any more')
})

// Confirming and then hearing nothing until the next issue is the worst
// version of a double opt-in.
test('confirming a subscription actually sends something', () => {
  const route = read('src/app/api/newsletter/confirm/route.ts')
  assert.match(route, /newsletterWelcomeHtml/)
  // The from address moved into the shared sender, which owns it for every
  // transactional email and records whether the send actually landed. The
  // verified-domain rule is asserted there, at its new home.
  assert.match(route, /sendTransactionalEmail/, 'sent through the logged sender, not a bare fetch')
  assert.ok(!/api\.resend\.com/.test(route), 'no direct provider call left behind')
})

// Offering a lapsed placement gives away free what somebody else is paying for.
test('lapsed featured placements leave the picker', () => {
  const route = read('src/app/api/admin/campaigns/route.ts')
  assert.match(route, /function stillRunning/)
  assert.match(route, /c\.is_featured && stillRunning\(c\.featured_until\)/)
  assert.match(route, /stillRunning\(e\.preferred_until\)/)
})
