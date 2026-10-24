import { test, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/auth-page';
import { CarDetailPage } from '../page-objects/car-detail-page';
import { MyRentalsPage } from '../page-objects/my-rentals-page';
import { PASSWORD, dateOffset, nextFreeOffset, uniqueEmail } from '../lib/data';

// Car 2 (Honda CR-V, $65/day), each run starts after the car's latest booking (base 1000 days out).
const CAR_ID = 2;
const DAILY = 65;

test.describe('booking flow', () => {
  test('anonymous booking attempt redirects to sign-in, then returns to the car', async ({ page, request }) => {
    const detail = new CarDetailPage(page);
    const auth = new AuthPage(page);
    const email = uniqueEmail('redir');

    // Create the account, then sign out so we're anonymous for the attempt.
    await auth.signUp(email, PASSWORD);
    await auth.expectSignedIn();
    await auth.signOut();
    await auth.expectSignedOut();

    await detail.goto(CAR_ID);
    const start = await nextFreeOffset(request, CAR_ID, 1000);
    await detail.book(dateOffset(start), dateOffset(start + 1));
    await expect(page).toHaveURL(/\/login\?from=%2Fcars%2F2/);

    await auth.fillAndSubmitSignIn(email, PASSWORD);
    await expect(page).toHaveURL(/\/cars\/2$/);
  });

  test('signed-in user books a car, sees server-computed total, and finds it in My Rentals', async ({ page, request }) => {
    const auth = new AuthPage(page);
    const detail = new CarDetailPage(page);
    const rentals = new MyRentalsPage(page);
    await auth.signUp(uniqueEmail('book'), PASSWORD);
    await auth.expectSignedIn();

    await detail.goto(CAR_ID);
    const start = await nextFreeOffset(request, CAR_ID, 1000);
    const days = 3;
    await detail.book(dateOffset(start), dateOffset(start + days));
    await expect(detail.successMessage()).toContainText(`total $${DAILY * days}`);
    const ref = /BK-\d+/.exec((await detail.successMessage().textContent()) ?? '')?.[0];
    expect(ref).toBeTruthy();
    await expect(detail.bookedRanges()).toContainText(dateOffset(start));

    await rentals.goto();
    await expect(rentals.rowByConfirmation(ref!)).toContainText('Honda CR-V');
    await expect(rentals.rowByConfirmation(ref!)).toContainText('confirmed');
  });

  test('estimate updates as dates are chosen', async ({ page, request }) => {
    const detail = new CarDetailPage(page);
    await detail.goto(CAR_ID);
    const start = await nextFreeOffset(request, CAR_ID, 1000);
    await page.getByLabel('Pickup date').fill(dateOffset(start));
    await page.getByLabel('Return date').fill(dateOffset(start + 2));
    await expect(detail.estimate()).toContainText(`$${DAILY * 2}`);
  });
});
