import { Page } from '@playwright/test';

export class MyRentalsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/account/rentals');
  }

  rows() {
    return this.page.locator('.list .row');
  }

  rowByConfirmation(ref: string) {
    return this.page.locator('.list .row', { hasText: ref });
  }
}
