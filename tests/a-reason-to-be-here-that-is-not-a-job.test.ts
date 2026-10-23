import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  eventDateLabel, eventKindLabel, eventSlug, eventWhereLabel, isEventKind, isUpcoming,
} from '../src/lib/events'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// Perhaps five per cent of spa professionals are looking for work at any
// moment. All of them want to know what is on. Events is the reason the other
// ninety-five per cent open an email, and it costs a therapist nothing to be
// seen reading it.

test('a date reads the way a person would write it', () => {
  assert.equal(eventDateLabel('2026-10-12T09:00:00Z'), '12 October 2026')
  // One event over three days in one month says the month once.
  assert.equal(eventDateLabel('2026-10-12T09:00:00Z', '2026-10-14T17:00:00Z'), '12 to 14 October 2026')
  // Across months, both are named.
  assert.equal(eventDateLabel('2026-10-30T09:00:00Z', '2026-11-02T17:00:00Z'), '30 October to 2 November 2026')
  // Across years, both years are named.
  assert.equal(eventDateLabel('2026-12-30T09:00:00Z', '2027-01-02T17:00:00Z'), '30 December 2026 to 2 January 2027')
  // A start and end on the same day is one date, not a range to itself.
  assert.equal(eventDateLabel('2026-10-12T09:00:00Z', '2026-10-12T17:00:00Z'), '12 October 2026')
  // Rubbish in does not produce "Invalid Date" on a public page.
  assert.equal(eventDateLabel('not a date'), '')
  assert.equal(eventDateLabel('2026-10-12T09:00:00Z', 'not a date'), '12 October 2026')
})

// An event runs until the end of its last day. Filing today's trade show
// under history at one minute past midnight is how a listing page loses trust.
test('today s event is still on today', () => {
  const during = new Date('2026-10-12T14:00:00Z')
  assert.equal(isUpcoming({ starts_at: '2026-10-12T09:00:00Z', ends_at: null }, during), true)
  // And late in the evening of its own day.
  assert.equal(isUpcoming({ starts_at: '2026-10-12T09:00:00Z', ends_at: null }, new Date('2026-10-12T22:30:00Z')), true)
  // Yesterday is over.
  assert.equal(isUpcoming({ starts_at: '2026-10-11T09:00:00Z', ends_at: null }, during), false)
  // A run of days is on until the last one finishes.
  assert.equal(isUpcoming({ starts_at: '2026-10-10T09:00:00Z', ends_at: '2026-10-14T17:00:00Z' }, during), true)
  assert.equal(isUpcoming({ starts_at: 'nonsense', ends_at: null }, during), false)
})

test('an online event does not pretend to have an address', () => {
  assert.equal(eventWhereLabel({ is_online: true, location: null }), 'Online')
  assert.equal(eventWhereLabel({ is_online: true, location: 'Ignored' }), 'Online')
  assert.equal(eventWhereLabel({ is_online: false, location: 'Claridge\'s, London' }), 'Claridge\'s, London')
  // And an unknown location says so rather than showing an empty line.
  assert.equal(eventWhereLabel({ is_online: false, location: null }), 'Location to be confirmed')
})

// Next season's running of the same event must not collide with this one.
test('a slug carries the year', () => {
  assert.equal(eventSlug('Carol Joy London Masterclass', '2026-10-12T09:00:00Z'), 'carol-joy-london-masterclass-2026')
  assert.equal(eventSlug('Carol Joy London Masterclass', '2027-10-12T09:00:00Z'), 'carol-joy-london-masterclass-2027')
  assert.equal(eventSlug('Spa & Wellness Awards', '2026-06-01T09:00:00Z'), 'spa-and-wellness-awards-2026')
  assert.equal(eventSlug('!!!', '2026-06-01T09:00:00Z'), 'event-2026')
})

test('an unknown kind falls back rather than breaking the page', () => {
  assert.equal(isEventKind('masterclass'), true)
  assert.equal(isEventKind('party'), false)
  assert.equal(eventKindLabel('masterclass'), 'Masterclass')
  assert.equal(eventKindLabel('nonsense'), 'Event')
})

// Publishing puts it on the site and is reversible. Announcing puts it in
// several hundred inboxes and is not.
test('announcing is a separate, once-only decision', () => {
  const route = body('src/app/api/admin/events/route.ts')
  assert.match(route, /if \(!event\.is_published\)/, 'nobody is emailed a page they cannot open')
  assert.match(route, /if \(event\.announced_at\)/, 'a second press must not send it twice')
  // The flag is written after the send, so a run that died halfway can be
  // finished rather than locked out.
  const announceBlock = route.slice(route.indexOf("action === 'announce'"))
  assert.ok(
    announceBlock.indexOf('let sent = 0') < announceBlock.indexOf("update({ announced_at"),
    'announced_at must be written after the send, not before',
  )
})

// A second copy of consent logic is how one send reaches somebody who opted
// out. There is one.
test('only people who confirmed consent are emailed, through the one helper', () => {
  const route = body('src/app/api/admin/events/route.ts')
  assert.match(route, /consentedRecipients\(admin, 'candidates'\)/)
  assert.match(route, /unsubscribeUrl: recipient\.unsubscribe/)
  assert.doesNotMatch(route, /from\('privacy_preferences'\)/, 'consent is resolved in one place, not here')

  const helper = body('src/lib/consented-recipients.ts')
  assert.match(helper, /eq\('marketing_email_status', 'confirmed'\)/)
  // The standalone newsletter list is people with no account, so it belongs
  // only in a send aimed at everybody.
  assert.match(helper, /includeNewsletterList && scope === 'all'/)
})

test('the public page shows only what is published, and only what has not finished', () => {
  const page = body('src/app/events/page.tsx')
  assert.match(page, /\.eq\('is_published', true\)/)
  assert.match(page, /\.filter\(event => isUpcoming\(event\)\)/)
  // A missing table must read as "nothing listed yet", never as a crash.
  assert.match(page, /catch \{[\s\S]{0,120}unavailable: true/)

  const detail = body('src/app/events/[slug]/page.tsx')
  assert.match(detail, /\.eq\('is_published', true\)/)
  assert.match(detail, /notFound\(\)/)
})

// The whole argument of this page is that it is worth finding.
test('events are reachable and in the sitemap', () => {
  // Off the top bar, because it lists nothing yet and a header that
  // advertises a season and delivers an empty page teaches a visitor the
  // site is thinner than it looks. In the footer, so it is not orphaned, and
  // still in the sitemap, which is what actually matters for a page with no
  // nav link: search is now the only way in, so being crawled is not
  // optional.
  const footer = body('src/components/Footer.tsx')
  assert.match(footer, /href: '\/events'/)
  const sitemap = body('src/app/sitemap.ts')
  assert.match(sitemap, /\$\{BASE\}\/events/)
  assert.match(sitemap, /\$\{BASE\}\/events\/\$\{row\.slug\}/)
  // That events are IN the dynamic set, not what else is in it. Pinning the
  // whole array meant adding course pages to the sitemap broke a test about
  // events, which tells you nothing and costs somebody ten minutes.
  const dynamicCall = sitemap.match(/Promise\.all\(\[([^\]]*)\]\)/)
  assert.ok(dynamicCall, 'the sitemap should still gather its dynamic sections in one place')
  assert.ok(dynamicCall[1].split(',').map(name => name.trim()).includes('events'),
    `events must be among the sitemap's dynamic sections, found: ${dynamicCall[1]}`)
})
