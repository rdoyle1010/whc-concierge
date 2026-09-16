import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { CAREER_LADDER } from '../src/lib/academy-meta'

// Forty-eight courses and one URL between them.
//
// Every course lived at /talent/academy/[slug], which robots.txt blocks, and
// the card on /academy was a button rather than a link. So the entire Academy
// was a single page to a search engine, and the thing it sells was invisible.
//
// That matters more than it looks on a platform with no marketplace liquidity.
// A course is one of only two things here that sells to a stranger: fifteen
// pounds, no account, guest checkout, exactly like the document library. And
// the terms are unusually soft, because almost nobody in the UK has written
// this material.
//
// The rule these checks hold: a course has a public page, that page says what
// is in the course without giving it away, and something crawlable links to it.

const read = (file: string) => readFileSync(file, 'utf8')
const body = (file: string) =>
  read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

const PAGE = 'src/app/academy/[slug]/page.tsx'

test('every course has a public page of its own', () => {
  assert.ok(existsSync(PAGE), 'a course needs a URL before anything can find it')
  const page = body(PAGE)
  assert.doesNotMatch(page, /^'use client'/m, 'the syllabus must be in the served HTML')
  assert.match(page, /generateStaticParams/, 'live courses should be prerendered, not built on first ask')
  assert.match(page, /getCourseSyllabus/)
})

test('the syllabus is public and the teaching is not', () => {
  // The distinction the whole page rests on. Lesson titles tell somebody what
  // they are buying; lesson bodies are the thing they are buying, and handing
  // those over on the page that sells them is how the Academy stops earning.
  const lib = body('src/lib/academy-catalog-server.ts')
  const syllabus = lib.slice(lib.indexOf('export function courseSyllabus('), lib.indexOf('export function courseSyllabus(') + 700)
  assert.match(syllabus, /lesson_titles/, 'a syllabus needs the lesson titles')
  assert.doesNotMatch(syllabus, /content/, 'and must never carry lesson content')

  const page = body(PAGE)
  assert.match(page, /lesson_titles\.map/, 'the page should print the syllabus')
  assert.doesNotMatch(page, /lessons\[/, 'and must not reach into lesson bodies')
})

test('a course page can be bought from', () => {
  // A page that describes a course and cannot sell it is a brochure. The guest
  // checkout is the same one the Academy list already uses: no account needed.
  const buy = body('src/app/academy/[slug]/CourseBuyButton.tsx')
  assert.match(buy, /type: 'course_public'/)
  assert.match(buy, /api\/stripe\/checkout/)
  assert.match(body(PAGE), /CourseBuyButton/)
})

test('a crawler can reach a course page', () => {
  // The cards used to be buttons. A page nothing links to is reachable only by
  // sitemap, which is crawled late and ranked low.
  const browser = body('src/app/academy/AcademyBrowser.tsx')
  assert.match(browser, /href=\{`\/academy\/\$\{course\.slug\}`\}/,
    'the course cards must link to the course pages')

  const sitemap = body('src/app/sitemap.ts')
  assert.match(sitemap, /\$\{BASE\}\/academy\/\$\{slug\}/, 'and every course belongs in the sitemap')

  // robots.txt must not block them. /talent/academy is blocked and that is the
  // point: the paid side stays out, the shop window goes in.
  const robots = body('src/app/robots.ts')
  const disallow = robots.match(/disallow: \[([\s\S]*?)\]/)![1]
  assert.ok(!/'\/academy/.test(disallow), 'the public course pages must not be disallowed')
  assert.match(disallow, /'\/talent\//, 'and the paid course player must stay disallowed')
})

test('a course page offers Course structured data with a real price', () => {
  const page = body(PAGE)
  assert.match(page, /'@type': 'Course'/)
  assert.match(page, /educationalCredentialAwarded/)
  assert.match(page, /courseWorkload: `PT\$\{meta\.cpdHours\}H`/, 'CPD hours are the number this industry recognises')
  assert.match(page, /'@type': 'Offer'/)
  assert.match(page, /priceCurrency: 'GBP'/)
  // From the catalogue, never typed in twice. Two prices for one course on two
  // pages of the same site is the sort of thing a buyer remembers.
  assert.match(page, /publicCoursePrice\(course\)/)
})

test('the career ladder is published rather than hidden behind a login', () => {
  // Seven rungs with the courses that move somebody up each one had been in
  // academy-meta.ts for months, behind /talent/career, which robots.txt blocks.
  // "How to become a spa manager" is a real search with an answer already
  // written, visible only to people who had already signed up.
  assert.ok(existsSync('src/app/career/page.tsx'))
  const page = body('src/app/career/page.tsx')
  assert.doesNotMatch(page, /^'use client'/m)
  assert.match(page, /CAREER_LADDER\.map/, 'the page is the ladder')
  assert.match(page, /href=\{`\/academy\/\$\{slug\}`\}/, 'each rung links to the courses that climb it')
  assert.match(page, /'@type': 'FAQPage'/, 'the questions it answers are questions people type')
  assert.match(body('src/app/sitemap.ts'), /\$\{BASE\}\/career/)

  // The ladder is real and worth publishing, not three rungs and a gap.
  assert.ok(CAREER_LADDER.length >= 7, 'the ladder should still run from starting out to director')
  for (const rung of CAREER_LADDER) {
    assert.ok(rung.recommendedSlugs.length > 0, `level ${rung.level} recommends no training`)
  }
})

test('a signed-in surface is kept out of the index rather than titled', () => {
  // /agency/[id] names a therapist, their postcode area and their reviews, and
  // its data needs an approved employer login. The obvious fix for "every
  // freelancer shares one title" is a title per person; it is the wrong fix.
  // Identity protection is something this platform sells to the people on it.
  const layout = body('src/app/agency/[id]/layout.tsx')
  assert.match(layout, /robots: \{ index: false, follow: true \}/)
})

test('an event describes itself to a search engine', () => {
  const page = body('src/app/events/[slug]/page.tsx')
  assert.match(page, /'@type': 'Event'/)
  assert.match(page, /eventAttendanceMode/)
  assert.match(page, /startDate: event\.starts_at/)
  assert.match(page, /VirtualLocation/, 'an online event has no street address')
})

test('a consultancy profile says whose it is', () => {
  const layout = body('src/app/consultancy/[id]/layout.tsx')
  assert.match(layout, /practice_name/)
  // Only a published, approved practice gets its own title, or the metadata
  // leaks a name that is not live yet.
  assert.match(layout, /is_live !== true \|\| data\.approval_status !== 'approved'/)
})
