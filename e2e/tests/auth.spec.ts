import { test, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/auth-page';
import { ADMIN, PASSWORD, uniqueEmail } from '../lib/data';

test.describe('auth', () => {
  test('sign up signs the user in, sign out and sign back in works', async ({ page }) => {
    const auth = new AuthPage(page);
    const email = uniqueEmail('auth');
    await auth.signUp(email, PASSWORD);
    await expect(page).toHaveURL('/');
    await auth.expectSignedIn();

    await auth.signOut();
    await auth.expectSignedOut();

    await auth.signIn(email, PASSWORD);
    await auth.expectSignedIn();
  });

  test('duplicate email on sign up shows an error', async ({ page }) => {
    const auth = new AuthPage(page);
    const email = uniqueEmail('dup');
    await auth.signUp(email, PASSWORD);
    await auth.signOut();
    await auth.signUp(email, PASSWORD);
    await expect(auth.errorMessage()).toContainText(/already exists/i);
  });

  test('wrong password shows an error', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.signIn(ADMIN.email, 'definitely-wrong');
    await expect(auth.errorMessage()).toContainText(/invalid email or password/i);
  });

  test('session persists across a reload', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.signUp(uniqueEmail('persist'), PASSWORD);
    await auth.expectSignedIn();
    await page.reload();
    await auth.expectSignedIn();
  });
});
