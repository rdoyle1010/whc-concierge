import { test, expect, Page } from '@playwright/test'

// The half a hotel actually buys, and the half nothing watched.
//
// These need two permanent QA accounts. Without the credentials they skip with
// a message saying exactly what is missing, rather than failing - a suite that
// goes red on every machine that has no business holding a password is a suite
// people start ignoring, and an ignored suite is worse than none.
//
// Nothing here writes. See e2e/README.md: these run against production, so
// they look and never touch. Submitting an application or posting a role on a
// live site leaves litter in front of real customers.

type Account = { email: string; password: string }

function account(role: 'TALENT' | 'EMPLOYER'): Account | null {
  const email = process.env[`E2E_${role}_EMAIL`]
  const password = process.env[`E2E_${role}_PASSWORD`]
  return email && password ? { email, password } : null
}

const MISSING = (role: string) =>
  `No ${role} QA account configured. Set E2E_${role.toUpperCase()}_EMAIL and ` +
  `E2E_${role.toUpperCase()}_PASSWORD to check the signed-in journeys.`

/**
 * Signs in and waits to be somewhere that is not the login page.
 *
 * Deliberately tolerant about which dashboard it lands on: the redirect is
 * decided by the role on the profile, and asserting the destination here would
 * make this helper fail for a reason that has nothing to do with signing in.
 */
async function signIn(page: Page, who: Account) {
  await page.goto('/login')
  await page.locator('input[type="email"]').first().fill(who.email)
  await page.locator('input[type="password"]').first().fill(who.password)
  await Promise.all([
    page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 30_000 }),
    page.locator('button[type="submit"]').first().click(),
  ])
}

test.describe('a professional', () => {
  const who = account('TALENT')
  test.skip(!who, MISSING('talent'))

  test('can sign in and reach their dashboard', async ({ page }) => {
    await signIn(page, who!)
    await expect(page).toHaveURL(/\/talent\//)
    await expect(page.locator('h1, [class*="dashboard-title"]').first()).toBeVisible()
  })

  test('is not shown an error where their roles should be', async ({ page }) => {
    await signIn(page, who!)
    await page.goto('/talent/jobs')
    await page.waitForTimeout(2500)
    const text = await page.locator('body').innerText()
    // 406 is the shape an RLS mistake takes on this platform, and it has
    // happened before. It must never reach a person's screen.
    expect(text).not.toMatch(/406|something went wrong|failed to fetch|unexpected error/i)
  })

  test('can open saved roles without hitting a dead end', async ({ page }) => {
    await signIn(page, who!)
    const res = await page.goto('/talent/saved')
    expect(res?.status()).toBeLessThan(400)
    const text = await page.locator('body').innerText()
    expect(text).not.toMatch(/404|not found/i)
  })

  test('can reach their own profile', async ({ page }) => {
    await signIn(page, who!)
    const res = await page.goto('/talent/profile')
    expect(res?.status()).toBeLessThan(400)
    await expect(page.locator('input, textarea, select').first()).toBeVisible()
  })
})

test.describe('a property', () => {
  const who = account('EMPLOYER')
  test.skip(!who, MISSING('employer'))

  test('can sign in and reach their dashboard', async ({ page }) => {
    await signIn(page, who!)
    await expect(page).toHaveURL(/\/employer\//)
    await expect(page.locator('h1, [class*="dashboard-title"]').first()).toBeVisible()
  })

  test('can open the page where a role is posted', async ({ page }) => {
    await signIn(page, who!)
    const res = await page.goto('/employer/post-role')
    expect(res?.status()).toBeLessThan(400)
    // The form itself, not just the shell. Nothing is submitted.
    await expect(page.locator('input, textarea, select').first()).toBeVisible()
  })

  test('can see their listings and applications without an error', async ({ page }) => {
    await signIn(page, who!)
    for (const path of ['/employer/jobs', '/employer/applications']) {
      await page.goto(path)
      await page.waitForTimeout(2200)
      const text = await page.locator('body').innerText()
      expect(text, `${path} showed an error to the property`).not.toMatch(
        /406|something went wrong|failed to fetch|unexpected error/i,
      )
    }
  })
})

test.describe('the front door', () => {
  test('refuses a password that is wrong, and says so', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').first().fill('nobody@demo.talenthousecollective.co.uk')
    await page.locator('input[type="password"]').first().fill('definitely-not-the-password')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(3500)

    // Still outside, and told why. Silence here is the bug that makes people
    // think the site is broken when in fact they mistyped.
    await expect(page).toHaveURL(/\/login/)
    const text = await page.locator('body').innerText()
    expect(text, 'a failed sign-in said nothing at all').toMatch(
      /invalid|incorrect|not match|try again|check your|wrong/i,
    )
  })

  test('keeps a stranger out of the dashboards', async ({ page }) => {
    // Admin has its own door at /admin-sign-in rather than sharing /login,
    // so the administrator entrance is not advertised to everybody who finds
    // the sign-in page. Any of them is a correct answer here; landing on the
    // dashboard itself is not.
    for (const path of ['/talent/dashboard', '/employer/dashboard', '/admin/dashboard']) {
      await page.goto(path)
      await page.waitForTimeout(1200)
      expect(page.url(), `${path} let a signed-out visitor straight in`)
        .toMatch(/\/(log[-_]?in|sign[-_]?in|admin-sign-in)|talenthousecollective\.co\.uk\/?$/i)
      expect(page.url(), `${path} rendered for a signed-out visitor`).not.toContain(path)
    }
  })
})
