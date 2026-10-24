import { Page } from '@playwright/test';

export class CarListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  cards() {
    return this.page.locator('a.card');
  }

  cardByName(name: string) {
    return this.page.locator('a.card', { hasText: name });
  }

  async openCar(name: string) {
    await this.cardByName(name).click();
  }
}
