import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// The audit's commercial findings, held in place.
//
// None of these was a crash. The site worked perfectly while doing every one of
// them, which is why they survived: a page that quotes fourteen prices and links
// nowhere renders beautifully, and a listing page that serves a crawler the word
// "Loading" returns a clean two hundred.

const read = (file: string) => readFileSync(file, 'utf8')
const body = (file: string) => read(file).replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

test('the roles listing is in the HTML, not fetched after it', () => {
  // /jobs is the first item in the navigation and the highest-priority URL in
  // the sitemap, and its whole static document was an h1 and "Loading live
  // roles...". Its subtree reads useSearchParams, so it bails out of
  // prerendering and the Suspense fallback is all a crawler ever sees. The
  // fallback is now rendered on the server with the roles already in it.
  const page = body('src/app/jobs/page.tsx')
  assert.doesNotMatch(page, /^'use client'/m, '/jobs must be a server component to fetch anything')
  assert.match(page, /await getPublicRoles\(\)/, 'the roles must be read on the server')
  assert.match(page, /fallback=\{<JobsFirstPaint roles=\{roles\} \/>\}/,
    'the roles must be in the fallback, because the fallback is the static document')

  // And the fallback must actually print them.
  const paint = body('src/components/JobsFirstPaint.tsx')
  assert.doesNotMatch(paint, /'use client'/, 'the first paint must render on the server')
  assert.match(paint, /roles\.map/, 'it has to list the roles')
  assert.match(paint, /href=\{`\/jobs\/\$\{role\.id\}`\}/, 'and link to each one')
})

test('the blog serves its post titles', () => {
  // Same shape, same cost: /blog rendered a heading and nothing else, so not one
  // article had a crawlable link anywhere on the public site.
  const page = body('src/app/blog/page.tsx')
  assert.doesNotMatch(page, /'use client'/)
  assert.match(page, /initialPosts=/, 'the posts must be handed in from the server')
  assert.match(body('src/app/blog/BlogList.tsx'), /useState<any\[\]>\(initialPosts\)/,
    'and must be the list state, not an empty array the browser fills later')
})

test('a role link goes to the role, not to the sign-in wall', () => {
  // /roles is the one server-rendered listing on the site and it wrapped every
  // role in /login?redirect=, which robots.txt disallows. So the only crawlable
  // listing passed nothing at all to any job page.
  const browser = body('src/components/PublicRolesBrowser.tsx')
  assert.match(browser, /href=\{`\/jobs\/\$\{job\.id\}`\}/, 'the role link must be the role')
  assert.doesNotMatch(browser, /login\?redirect=\$\{encodeURIComponent\(`\/jobs/,
    'a role must not be reachable only through a page robots.txt blocks')
})

test('the count of roles is spelled correctly in both branches', () => {
  // 'opportunity' + 'ies' is "opportunityies", and 'opportunity' + 'y' is
  // "opportunityy". Every visitor to this page has seen a misspelling, whichever
  // branch they landed in.
  const browser = read('src/components/PublicRolesBrowser.tsx')
  assert.doesNotMatch(browser, /opportunity\{/, 'the plural must not be built by gluing a suffix to the singular')
  assert.match(browser, /'opportunity' : 'opportunities'/)
})

test('every price on the pricing page has somewhere to go', () => {
  // Fourteen prices, from ten pounds to nine hundred and ninety-five, and a
  // single link out - which was for talent. An employer who had just decided to
  // spend nine hundred and ninety-five pounds could not do it from the page that
  // quoted the number.
  const page = read('src/app/pricing/page.tsx')
  const links = page.match(/<Link href=/g) || []
  assert.ok(links.length >= 12, `only ${links.length} links on a page with fourteen prices`)
  for (const destination of ['/register/employer', '/contact', '/academy', '/agency/about', '/residency', '/advertise']) {
    assert.ok(page.includes(`href="${destination}"`), `nothing on the pricing page leads to ${destination}`)
  }
})

test('pressing Apply remembers which role it was', () => {
  // The apply link carried ?intent=apply&role=<id>, and the registration form
  // reads neither. Somebody who pressed Apply on one specific job made an
  // account and landed on an empty profile editor with no way back to it.
  const buttons = body('src/components/JobApplyButtons.tsx')
  assert.match(buttons, /register\/talent\?redirect=\$\{encodeURIComponent\(`\/jobs\/\$\{roleId\}`\)\}/,
    'apply must use the parameter the registration form actually reads')

  const form = body('src/app/register/talent/page.tsx')
  assert.match(form, /params\.get\('redirect'\)/, 'and the form must still read it')
})

test('the pricing page does not download the course catalogue to show a price range', () => {
  // /api/academy/catalog is 305KB, uncompressed, and is the heaviest asset on
  // the site. It was being fetched by a page that shows no courses, so that one
  // line could read a low and a high number.
  const page = body('src/app/pricing/page.tsx')
  assert.doesNotMatch(page, /fetch\('\/api\/academy\/catalog'\)/)
  assert.match(page, /fetch\('\/api\/academy\/price-range'\)/)
})

test('/agency serves a heading', () => {
  // The first-paint branch was skeleton blocks with no h1 at all, so the served
  // HTML for /agency had no heading and, on a phone, the whole first screen was
  // grey rectangles that then reflowed.
  const page = body('src/app/agency/page.tsx')
  const skeleton = page.match(/if \(!directoryChecked\) \{[\s\S]*?\n  \}/)
  assert.ok(skeleton, 'the first-paint branch should still exist')
  assert.match(skeleton[0], /<h1/, 'the first paint must carry a heading')
})

test('the sitemap advertises the agency page that exists', () => {
  const sitemap = body('src/app/sitemap.ts')
  assert.match(sitemap, /\$\{BASE\}\/agency\/about/, 'the real, server-rendered agency page must be listed')
  assert.doesNotMatch(sitemap, /\$\{BASE\}\/agency`/, 'the skeleton one must not be')
})

test('a paid advert tells Google when it actually expires', () => {
  // validThrough decides how long a posting stays in the jobs panel. Without it
  // Google drops it about thirty days after datePosted whether or not the role
  // is live - and this page filters on expires_at, so it already knew.
  const page = body('src/app/jobs/[id]/page.tsx')
  assert.match(page, /const expiry = job\.application_deadline \|\| job\.expires_at/)
  assert.match(page, /jobPostingLd\.validThrough = new Date\(expiry\)\.toISOString\(\)/)
})

test('the FAQ answers are offered as answers', () => {
  const layout = body('src/app/faq/layout.tsx')
  assert.match(layout, /'@type': 'FAQPage'/)
  assert.match(layout, /acceptedAnswer/)
})

test('an upload that did not reach the profile says so', () => {
  // The attach was unchecked: a file could land in storage, fail to reach the
  // profile row, and the member was still told it had uploaded.
  const route = body('src/app/api/upload/route.ts')
  assert.match(route, /const \{ error: attachError \}[\s\S]{0,200}?if \(attachError\)/,
    'the profile update must be checked')
  assert.match(route, /attached: false/, 'and the caller must be told when it failed')
})

test('a fulfilment that could not be recorded is not reported as done', () => {
  // Stripe redelivers on any non-2xx and the featured window extends from the
  // existing featured_until, so an unrecorded fulfilment adds another thirty
  // days for one payment on the next delivery.
  const lib = body('src/lib/commercial-fulfilment.ts')
  assert.match(lib, /const \{ error: stampError \}[\s\S]{0,300}?if \(stampError\)/)
})

test('a coaching score is never invented', () => {
  // The fallback returned sixty out of a hundred whenever the model was
  // unavailable. Sixty on your interview answer reads as a judgement, and
  // somebody could rewrite a good answer on the strength of a constant.
  const route = body('src/app/api/interview-ready/route.ts')
  assert.doesNotMatch(route, /score: 60/, 'a made-up score must not be presented as a mark')
  assert.match(route, /score: null/)

  // And the page must not turn that null into a nought.
  const page = body('src/app/talent/interview-ready/page.tsx')
  assert.doesNotMatch(page, /feedback\.score \|\| 0/, '`score || 0` prints 0% for "we could not score it"')
  assert.match(page, /typeof feedback\.score === 'number'/)
})

test('the employer story fields are not discarded in silence', () => {
  // A property wrote the part of the advert that does the selling, pressed
  // publish, got a success, and the words were gone with nothing in the logs.
  const route = body('src/app/api/employer/jobs/create/route.ts')
  assert.match(route, /droppedStoryFields/)
  assert.match(route, /console\.error\('\[jobs\] story columns missing/)
  assert.match(route, /warning:/, 'and the employer has to be told')
})
