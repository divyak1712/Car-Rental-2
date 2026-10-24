import { Page } from '@playwright/test';

export interface CarInput {
  name: string;
  category: string;
  description: string;
  price: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  seats: string;
  transmission: string;
  fuelType: string;
  location: string;
}

export class AdminFleetPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/admin/fleet');
  }

  rowByName(name: string) {
    return this.page.locator('.fleet-table tbody tr', { hasText: name });
  }

  private async fillForm(c: Partial<CarInput>) {
    const fields: [string, keyof CarInput][] = [
      ['Name', 'name'], ['Category', 'category'], ['Description', 'description'],
      ['Daily rate', 'price'], ['Make', 'make'], ['Model', 'model'], ['Year', 'year'],
      ['License plate', 'licensePlate'], ['Seats', 'seats'], ['Transmission', 'transmission'],
      ['Fuel type', 'fuelType'], ['Location', 'location'],
    ];
    for (const [label, key] of fields) {
      const v = c[key];
      if (v !== undefined) await this.page.getByLabel(label).fill(v);
    }
  }

  async addCar(c: CarInput) {
    await this.page.getByRole('button', { name: /add car/i }).click();
    await this.fillForm(c);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async editCar(currentName: string, changes: Partial<CarInput>) {
    await this.rowByName(currentName).getByRole('button', { name: 'Edit' }).click();
    await this.fillForm(changes);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async deleteByName(name: string) {
    this.page.once('dialog', (d) => d.accept());
    await this.rowByName(name).getByRole('button', { name: 'Delete' }).click();
  }
}
