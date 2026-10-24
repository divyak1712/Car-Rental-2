import { Page } from '@playwright/test';

export class CarDetailPage {
  constructor(private page: Page) {}

  async goto(carId: number) {
    await this.page.goto(`/cars/${carId}`);
  }

  async book(startsAt: string, endsAt: string) {
    await this.page.getByLabel('Pickup date').fill(startsAt);
    await this.page.getByLabel('Return date').fill(endsAt);
    await this.page.getByRole('button', { name: /book this car/i }).click();
  }

  successMessage() {
    return this.page.locator('.success');
  }

  errorMessage() {
    return this.page.locator('.error');
  }

  estimate() {
    return this.page.locator('.estimate');
  }

  bookedRanges() {
    return this.page.locator('.booked');
  }
}
