import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Car } from '../../services/api.service';

@Component({
  selector: 'app-car-list',
  imports: [RouterLink],
  templateUrl: './car-list.html',
  styleUrl: './car-list.css',
})
export class CarList {
  private api = inject(ApiService);

  cars = signal<Car[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.api.listCars().subscribe({
      next: (cars) => {
        this.cars.set(cars);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the fleet. Please try again later.');
        this.loading.set(false);
      },
    });
  }
}
