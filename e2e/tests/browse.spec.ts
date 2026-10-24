import { test, expect } from '@playwright/test';
import { CarListPage } from '../page-objects/car-list-page';

test.describe('browse', () => {
  test('lists the seeded fleet and opens a car detail page', async ({ page }) => {
    const list = new CarListPage(page);
    await list.goto();
    await expect(list.cards().first()).toBeVisible();
    expect(await list.cards().count()).toBeGreaterThanOrEqual(6);
    await expect(list.cardByName('Toyota Camry')).toContainText('$45');

    await list.openCar('Toyota Camry');
    await expect(page).toHaveURL(/\/cars\/1$/);
    await expect(page.getByRole('heading', { name: 'Toyota Camry' })).toBeVisible();
    await expect(page.getByText('Downtown Depot')).toBeVisible();
  });

  test('unknown car shows not found', async ({ page }) => {
    await page.goto('/cars/999999');
    await expect(page.locator('.error')).toContainText(/not found/i);
  });
});
