import { test, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/auth-page';
import { CarDetailPage } from '../page-objects/car-detail-page';
import { PASSWORD, dateOffset, nextFreeOffset, uniqueEmail } from '../lib/data';

// Car 3 (VW Golf), each run starts after the car's latest booking (base 2000 days out).
const CAR_ID = 3;

test.describe('booking validation', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.signUp(uniqueEmail('val'), PASSWORD);
    await auth.expectSignedIn();
  });

  test('return date before pickup is rejected', async ({ page, request }) => {
    const detail = new CarDetailPage(page);
    await detail.goto(CAR_ID);
    const start = await nextFreeOffset(request, CAR_ID, 2000);
    await detail.book(dateOffset(start + 3), dateOffset(start));
    await expect(detail.errorMessage()).toContainText(/after pickup/i);
  });

  test('missing dates are rejected client-side', async ({ page, request }) => {
    const detail = new CarDetailPage(page);
    await detail.goto(CAR_ID);
    await page.getByRole('button', { name: /book this car/i }).click();
    await expect(detail.errorMessage()).toBeVisible();
  });

  test('overlapping an existing booking is rejected with a conflict', async ({ browser, page, request }) => {
    const detail = new CarDetailPage(page);
    await detail.goto(CAR_ID);
    const start = await nextFreeOffset(request, CAR_ID, 2000);
    await detail.book(dateOffset(start), dateOffset(start + 4));
    await expect(detail.successMessage()).toBeVisible();

    // A second user tries a partially overlapping range.
    const ctx = await browser.newContext();
    const page2 = await ctx.newPage();
    const auth2 = new AuthPage(page2);
    await auth2.signUp(uniqueEmail('val2'), PASSWORD);
    await auth2.expectSignedIn();
    const detail2 = new CarDetailPage(page2);
    await detail2.goto(CAR_ID);
    await detail2.book(dateOffset(start + 2), dateOffset(start + 6));
    await expect(detail2.errorMessage()).toContainText(/already booked/i);
    await ctx.close();
  });
});
