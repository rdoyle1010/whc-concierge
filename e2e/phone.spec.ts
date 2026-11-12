import { test, expect } from '@playwright/test'

// A phone is where most of these people actually read this.
//
// The whole site was clean at 390px when swept by hand. Nothing was watching
// that, and a sideways-scrolling page is the kind of break that ships quietly
// in a layout change and is never noticed on a laptop.

const PAGES = ['/', '/platform', '/jobs', '/pricing', '/academy', '/standards', '/agency/about', '/contact']

for (const path of PAGES) {
  test(`${path} does not scroll sideways on a phone`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1800)
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      view: window.innerWidth,
    }))
    expect(
      overflow.scroll,
      `${path} is ${overflow.scroll - overflow.view}px wider than the phone it is being read on`,
    ).toBeLessThanOrEqual(overflow.view + 2)
  })
}

test('the menu opens on a phone', async ({ page }) => {
  await page.goto('/')

  // The cookie banner sits over the bottom of the page and will swallow a
  // click meant for something underneath it.
  await page.getByRole('button', { name: /accept/i }).click({ timeout: 4000 }).catch(() => {})

  // By its label, not by position: the first button in the nav is the account
  // menu for a signed-in visitor, which is a different control entirely.
  const toggle = page.getByRole('button', { name: /open navigation menu/i })
  await expect(toggle, 'there is no menu button at phone width').toBeVisible()
  await toggle.click()
  await page.waitForTimeout(800)

  // The panel the button says it controls, with something in it. A menu
  // button that opens nothing leaves a phone visitor with no navigation.
  const panel = page.locator('#mobile-navigation')
  await expect(panel, 'the menu button opened nothing').toBeVisible()
  expect(await panel.locator('a[href^="/"]').count(), 'the menu opened empty').toBeGreaterThan(2)
})
