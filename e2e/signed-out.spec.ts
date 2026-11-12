import { test, expect, Page } from '@playwright/test'

// What a stranger sees, checked in a real browser.
//
// Every page here was swept by hand once and was fine. The point of writing it
// down is that nobody will sweep it by hand again, and the next time something
// breaks it will be at eleven at night before a call rather than while
// somebody happens to be looking.

/** Script errors only. A blocked third party is the network, not the site. */
function collectPageErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e.message).slice(0, 200)))
  return errors
}

const PUBLIC_PAGES = [
  ['/', 'the front door'],
  ['/platform', 'the page an operator is sent before a call'],
  ['/jobs', 'the roles board'],
  ['/roles', 'the roles landing page'],
  ['/pricing', 'what it costs'],
  ['/academy', 'the Academy'],
  ['/standards', 'the document shop'],
  ['/agency/about', 'the Agency explainer'],
  ['/residency', 'Residency'],
  ['/intelligence', 'the market data'],
  ['/consultancy', 'the consultants'],
  ['/brands', 'the product houses'],
  ['/properties', 'the properties'],
  ['/contact', 'the contact form'],
  ['/verify', 'certificate verification'],
] as const

for (const [path, what] of PUBLIC_PAGES) {
  test(`${what} loads and renders`, async ({ page }) => {
    const errors = collectPageErrors(page)
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })

    expect(response?.status(), `${path} did not return 200`).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible()

    // A page that renders its chrome and nothing else is the failure that
    // looks like success in a status check.
    const text = await page.locator('body').innerText()
    expect(text.length, `${path} rendered almost nothing`).toBeGreaterThan(600)

    expect(errors, `${path} threw a script error`).toEqual([])
  })
}

test('the navigation reaches the pages it advertises', async ({ page }) => {
  await page.goto('/')
  const hrefs = await page.locator('header a[href^="/"], nav a[href^="/"]').evaluateAll(
    links => [...new Set(links.map(a => (a as HTMLAnchorElement).getAttribute('href') || ''))]
      .filter(h => h && !h.startsWith('/#')),
  )
  expect(hrefs.length, 'the navigation has no links at all').toBeGreaterThan(3)

  for (const href of hrefs) {
    const res = await page.request.get(href)
    expect(res.status(), `the navigation points at ${href}, which is not there`).toBeLessThan(400)
  }
})

test('an empty roles board explains itself rather than looking broken', async ({ page }) => {
  await page.goto('/jobs')
  await page.waitForTimeout(2500)
  const text = await page.locator('body').innerText()

  // Either roles are live, or the page says why not. A blank panel is the
  // thing that reads as a broken product to somebody being shown it.
  const hasRoles = await page.locator('a[href^="/jobs/"]').count()
  if (hasRoles === 0) {
    expect(text, 'no roles and no explanation - this reads as broken').toMatch(
      /no roles|nothing (live|listed)|appear the moment|check back/i,
    )
    // And it must offer somewhere to go next.
    await expect(page.locator('a[href^="/"]').first()).toBeVisible()
  }
})

test('the site does not offer the old domain to anybody', async ({ page }) => {
  await page.goto('/')
  const stale = await page.locator('a[href*="talent.wellnesshousecollective.co.uk"]').count()
  expect(stale, 'a link still points at the old host').toBe(0)
})

test('the platform has one name in front of a buyer', async ({ page }) => {
  await page.goto('/platform')
  const text = await page.locator('#main-content, main').first().innerText()
  expect(text).not.toMatch(/WHC Concierge/i)
})
