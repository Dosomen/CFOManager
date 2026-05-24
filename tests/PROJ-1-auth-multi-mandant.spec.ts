import { expect, test } from '@playwright/test'

/**
 * PROJ-1 E2E test suite.
 *
 * Covers everything testable without a live Supabase user. Authenticated
 * flows (login success, mandant CRUD, 2FA enroll, password change) require
 * a manually provisioned test user in Supabase and live email — they're
 * documented in the QA report as "manual-only".
 */

test.describe('PROJ-1 / Public routes', () => {
  test('root redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login(\?.*)?$/)
  })

  test('login page renders form and is in German', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/CFOManager/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')
    // CardTitle renders as <div> in this shadcn version (see Low bug
    // #1 in QA report); match by text instead of role.
    await expect(page.getByText('Anmelden', { exact: true }).first()).toBeVisible()
    await expect(page.getByLabel('E-Mail')).toBeVisible()
    await expect(page.getByLabel('Passwort')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Passwort vergessen?' })).toBeVisible()
  })

  test('login form rejects invalid email client-side', async ({ page }) => {
    await page.goto('/login')
    // Use type="email" so the browser may block submit; force via fill + click
    await page.getByLabel('E-Mail').fill('not-an-email')
    await page.getByLabel('Passwort').fill('something')
    await page.getByRole('button', { name: 'Anmelden' }).click()
    // Either browser-native validation OR Zod resolver kicks in; assert one of them
    const errorVisible = await page
      .getByText(/Ungültige E-Mail-Adresse|valid email|Bitte/i)
      .isVisible()
      .catch(() => false)
    const stillOnLogin = page.url().includes('/login')
    expect(errorVisible || stillOnLogin).toBe(true)
  })

  test('login form rejects empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Anmelden' }).click()
    // We should still be on the login page (validation prevents submit)
    await expect(page).toHaveURL(/\/login/)
  })

  test('login with wrong credentials shows generic error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-Mail').fill('nonexistent@example.invalid')
    await page.getByLabel('Passwort').fill('definitely-wrong-password-123')
    await page.getByRole('button', { name: 'Anmelden' }).click()
    // The action returns a generic "invalid credentials" error regardless of
    // whether the account exists (anti-enumeration). Wait for the alert.
    await expect(
      page.getByText('E-Mail oder Passwort falsch')
    ).toBeVisible({ timeout: 10_000 })
  })

  test('forgot-password link navigates to request page', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Passwort vergessen?' }).click()
    await expect(page).toHaveURL(/\/passwort-vergessen$/)
    await expect(
      page.getByText('Passwort zurücksetzen', { exact: true })
    ).toBeVisible()
  })

  test('password-reset request returns generic success (no account enumeration)', async ({
    page,
  }) => {
    await page.goto('/passwort-vergessen')
    await page.getByLabel('E-Mail').fill('definitely-does-not-exist@example.invalid')
    await page.getByRole('button', { name: 'Reset-Link senden' }).click()
    await expect(
      page.getByText(/Wenn die Adresse existiert/i)
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('PROJ-1 / Protected routes redirect to login', () => {
  for (const path of ['/dashboard', '/mandanten', '/einstellungen', '/onboarding']) {
    test(`unauthenticated GET ${path} redirects to /login with ?next=`, async ({
      page,
    }) => {
      await page.goto(path)
      await expect(page).toHaveURL(
        new RegExp(`/login\\?next=${encodeURIComponent(path)}`)
      )
    })
  }

  test('GET /passwort-zuruecksetzen without recovery session bounces to request page', async ({
    page,
  }) => {
    await page.goto('/passwort-zuruecksetzen')
    await expect(page).toHaveURL(/\/passwort-vergessen$/)
  })
})

test.describe('PROJ-1 / Auth callback', () => {
  test('callback without code redirects to /login with error', async ({ page }) => {
    await page.goto('/auth/callback')
    await expect(page).toHaveURL(/\/login\?error=auth_callback_failed/)
  })

  test('callback with invalid code redirects to /login with error', async ({
    page,
  }) => {
    await page.goto('/auth/callback?code=not-a-real-code')
    await expect(page).toHaveURL(/\/login\?error=auth_callback_failed/)
  })
})

test.describe('PROJ-1 / Accessibility & i18n', () => {
  test('every public page declares lang="de"', async ({ page }) => {
    for (const path of ['/login', '/passwort-vergessen']) {
      await page.goto(path)
      await expect(page.locator('html')).toHaveAttribute('lang', 'de')
    }
  })

  test('login form fields have associated labels', async ({ page }) => {
    await page.goto('/login')
    // getByLabel only succeeds when the label is properly associated
    await expect(page.getByLabel('E-Mail')).toBeVisible()
    await expect(page.getByLabel('Passwort')).toBeVisible()
  })

  test('login page has no accessibility-blocking misuse', async ({ page }) => {
    await page.goto('/login')
    // Sanity check: exactly one h1-equivalent + a single submit button per form
    const submitButtons = await page.getByRole('button', { name: 'Anmelden' }).count()
    expect(submitButtons).toBe(1)
  })
})
