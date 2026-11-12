import { test, expect } from '@playwright/test'
import { existsSync } from 'node:fs'
import { TALENT_STATE, EMPLOYER_STATE, account, MISSING } from './accounts'

// The half a hotel actually buys, and the half nothing watched.
//
// Every test here reuses a session signed in once by auth.setup.ts. Signing in
// per test tripped the platform's own rate limiter - "Too many sign-in
// attempts" - and failed eight checks for a reason that had nothing to do with
// what they were checking. The limiter was right; the suite was wrong.
//
// Nothing here writes. These run against production, so they look and never
// touch: no role posted, no application submitted, no payment started.

const hasTalent = !!account('TALENT')
const hasEmployer = !!account('EMPLOYER')

test.describe('a professional', () => {
  test.skip(!hasTalent, MISSING('talent'))
  test.use({ storageState: existsSync(TALENT_STATE) ? TALENT_STATE : undefined })

  test('is signed in and lands on their own dashboard', async ({ page }) => {
    await page.goto('/talent/dashboard')
    await expect(page).toHaveURL(/\/talent\//)
    await expect(page.locator('h1, [class*="dashboard-title"]').first()).toBeVisible()
  })

  test('is not shown an error where their roles should be', async ({ page }) => {
    await page.goto('/talent/jobs')
    await page.waitForTimeout(2500)
    const text = await page.locator('body').innerText()
    // 406 is the shape an RLS mistake takes on this platform, and it has
    // happened before. It must never reach a person's screen.
    expect(text).not.toMatch(/406|something went wrong|failed to fetch|unexpected error/i)
  })

  test('can open saved roles without hitting a dead end', async ({ page }) => {
    const res = await page.goto('/talent/saved')
    expect(res?.status()).toBeLessThan(400)
    const text = await page.locator('body').innerText()
    expect(text).not.toMatch(/404|not found/i)
  })

  test('can reach their own profile and edit it', async ({ page }) => {
    const res = await page.goto('/talent/profile')
    expect(res?.status()).toBeLessThan(400)
    // A visible field, not simply the first input in the DOM: that one is the
    // hidden file picker behind the photograph upload.
    await expect(
      page.locator('input:visible, textarea:visible, select:visible').first(),
      'the profile page has no editable field on it',
    ).toBeVisible()
  })
})

test.describe('a property', () => {
  test.skip(!hasEmployer, MISSING('employer'))
  test.use({ storageState: existsSync(EMPLOYER_STATE) ? EMPLOYER_STATE : undefined })

  test('is signed in and lands on their own dashboard', async ({ page }) => {
    await page.goto('/employer/dashboard')
    await expect(page).toHaveURL(/\/employer\//)
    await expect(page.locator('h1, [class*="dashboard-title"]').first()).toBeVisible()
  })

  test('can open the page where a role is posted', async ({ page }) => {
    const res = await page.goto('/employer/post-role')
    expect(res?.status()).toBeLessThan(400)
    // The form itself, not just the shell. Nothing is submitted.
    await expect(page.locator('input:visible, textarea:visible, select:visible').first()).toBeVisible()
  })

  test('can see their listings and applications without an error', async ({ page }) => {
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

// These sign in on purpose, so they stay few and deliberate.
test.describe('the front door', () => {
  test('refuses a password that is wrong, and says so', async ({ page }) => {
    await page.goto('/login')
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /accept/i }).click({ timeout: 4000 }).catch(() => {})
    await page.locator('input[type="email"]').first().fill('nobody@qa.talenthousecollective.co.uk')
    await page.locator('input[type="password"]').first().fill('definitely-not-the-password')
    await page.locator('button[type="submit"]').first().click()
    await page.waitForTimeout(4000)

    // Still outside, and told why. Silence here is the bug that makes people
    // believe the site is broken when in fact they mistyped. A rate-limit
    // message is also a refusal with a reason, so it counts.
    await expect(page).toHaveURL(/\/login/)
    const text = await page.locator('body').innerText()
    expect(text, 'a failed sign-in said nothing at all').toMatch(
      /invalid|incorrect|not match|try again|check your|wrong|too many/i,
    )
  })

  test('keeps a stranger out of the dashboards', async ({ page }) => {
    // Admin has its own door at /admin-sign-in rather than sharing /login, so
    // the administrator entrance is not advertised to everybody who finds the
    // sign-in page.
    for (const path of ['/talent/dashboard', '/employer/dashboard', '/admin/dashboard']) {
      await page.goto(path)
      await page.waitForTimeout(1200)
      expect(page.url(), `${path} let a signed-out visitor straight in`)
        .toMatch(/\/(log[-_]?in|sign[-_]?in|admin-sign-in)|talenthousecollective\.co\.uk\/?$/i)
      expect(page.url(), `${path} rendered for a signed-out visitor`).not.toContain(path)
    }
  })
})
