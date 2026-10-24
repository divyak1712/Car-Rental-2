import { Page, expect } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  async signUp(email: string, password: string, name = 'E2E User') {
    await this.page.goto('/signup');
    await this.page.getByLabel('Name').fill(name);
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: /sign up/i }).click();
  }

  async signIn(email: string, password: string) {
    await this.page.goto('/login');
    await this.fillAndSubmitSignIn(email, password);
  }

  async fillAndSubmitSignIn(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: /^sign in$/i }).click();
  }

  async signOut() {
    await this.page.getByRole('button', { name: /sign out/i }).click();
  }

  async expectSignedIn() {
    await expect(this.page.getByRole('button', { name: /sign out/i })).toBeVisible();
  }

  async expectSignedOut() {
    await expect(this.page.getByRole('link', { name: /^sign in$/i })).toBeVisible();
  }

  errorMessage() {
    return this.page.locator('.error');
  }
}
