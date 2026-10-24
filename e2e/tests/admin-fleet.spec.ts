import { test, expect } from '@playwright/test';
import { AuthPage } from '../page-objects/auth-page';
import { AdminFleetPage, CarInput } from '../page-objects/admin-fleet-page';
import { ADMIN } from '../lib/data';

test.describe('admin fleet CRUD', () => {
  test('admin adds, edits, and deletes a car', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.signIn(ADMIN.email, ADMIN.password);
    await auth.expectSignedIn();
    const fleet = new AdminFleetPage(page);
    await fleet.goto();

    const stamp = Date.now();
    const name = `E2E Car ${stamp}`;
    const car: CarInput = {
      name, category: 'Test', description: 'Created by the e2e suite', price: '50',
      make: 'Acme', model: 'Roadster', year: '2024', licensePlate: `E2E-${stamp}`,
      seats: '4', transmission: 'Manual', fuelType: 'Electric', location: 'Test Depot',
    };

    await fleet.addCar(car);
    await expect(fleet.rowByName(name)).toContainText('$50/day');

    await fleet.editCar(name, { price: '75' });
    await expect(fleet.rowByName(name)).toContainText('$75/day');

    // Public listing reflects the new car.
    await page.goto('/');
    await expect(page.locator('a.card', { hasText: name })).toContainText('$75');

    await fleet.goto();
    await fleet.deleteByName(name);
    await expect(fleet.rowByName(name)).toHaveCount(0);
  });
});
