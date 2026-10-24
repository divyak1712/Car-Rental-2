import { test, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/auth-page';
import { ADMIN, PASSWORD, uniqueEmail } from '../lib/data';

test.describe('access control', () => {
  test('anonymous user can browse cars but not /account/rentals', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /available cars/i })).toBeVisible();
    await page.goto('/account/rentals');
    await expect(page).not.toHaveURL(/account\/rentals/);
  });

  test('anonymous user cannot open /admin/fleet', async ({ page }) => {
    await page.goto('/admin/fleet');
    await expect(page).not.toHaveURL(/admin\/fleet/);
  });

  test('non-admin user cannot open /admin/fleet and sees no admin link', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.signUp(uniqueEmail('plain'), PASSWORD);
    await auth.expectSignedIn();
    await expect(page.getByRole('link', { name: /fleet admin/i })).toHaveCount(0);
    await page.goto('/admin/fleet');
    await expect(page).not.toHaveURL(/admin\/fleet/);
  });

  test('admin sees the Fleet Admin link and can open the page', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.signIn(ADMIN.email, ADMIN.password);
    await page.getByRole('link', { name: /fleet admin/i }).click();
    await expect(page).toHaveURL(/admin\/fleet/);
    await expect(page.getByRole('heading', { name: /fleet admin/i })).toBeVisible();
  });

  test('non-admin API calls to fleet management are rejected', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.signUp(uniqueEmail('api'), PASSWORD);
    await auth.expectSignedIn();
    const res = await page.request.delete('/api/resources/1');
    expect([401, 403]).toContain(res.status());
  });
});
