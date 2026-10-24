import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Car, CarInput } from '../../services/api.service';

const EMPTY_FORM: CarInput = {
  name: '',
  category: '',
  description: '',
  image: '',
  price: 0,
  metadata: {
    make: '', model: '', year: new Date().getFullYear(), licensePlate: '',
    seats: 5, transmission: 'Automatic', fuelType: 'Petrol', location: '',
  },
};

@Component({
  selector: 'app-admin-fleet',
  imports: [FormsModule],
  templateUrl: './admin-fleet.html',
  styleUrl: './admin-fleet.css',
})
export class AdminFleet {
  private api = inject(ApiService);

  cars = signal<Car[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  editingId = signal<number | null>(null);
  form: CarInput = structuredClone(EMPTY_FORM);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.api.listCars().subscribe({
      next: (cars) => {
        this.cars.set(cars);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the fleet.');
        this.loading.set(false);
      },
    });
  }

  startCreate(): void {
    this.editingId.set(-1);
    this.form = structuredClone(EMPTY_FORM);
  }

  startEdit(car: Car): void {
    this.editingId.set(car.id);
    this.form = {
      name: car.name,
      category: car.category,
      description: car.description,
      image: car.image,
      price: car.price,
      metadata: { ...car.metadata },
    };
  }

  cancel(): void {
    this.editingId.set(null);
  }

  save(): void {
    this.error.set(null);
    const id = this.editingId();
    const request = id && id > 0 ? this.api.updateCar(id, this.form) : this.api.createCar(this.form);
    request.subscribe({
      next: () => {
        this.editingId.set(null);
        this.refresh();
      },
      error: (err) => this.error.set(err.error?.error || 'Could not save car.'),
    });
  }

  remove(car: Car): void {
    if (!confirm(`Remove ${car.name} from the fleet?`)) return;
    this.api.deleteCar(car.id).subscribe({
      next: () => this.refresh(),
      error: (err) => this.error.set(err.error?.error || 'Could not delete car.'),
    });
  }
}
