import { SlicePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, BookedRange, Car } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-car-detail',
  imports: [FormsModule, SlicePipe],
  templateUrl: './car-detail.html',
  styleUrl: './car-detail.css',
})
export class CarDetail {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  car = signal<Car | null>(null);
  bookedRanges = signal<BookedRange[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  submitting = signal(false);
  success = signal<string | null>(null);

  startsAt = '';
  endsAt = '';

  private carId = Number(this.route.snapshot.paramMap.get('id'));

  constructor() {
    this.api.getCar(this.carId).subscribe({
      next: (car) => {
        this.car.set(car);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Car not found.');
        this.loading.set(false);
      },
    });

    this.api.getBookedRanges(this.carId).subscribe((ranges) => this.bookedRanges.set(ranges));
  }

  estimatedTotal(): number | null {
    const car = this.car();
    if (!car || !this.startsAt || !this.endsAt) return null;
    const days = Math.max(1, Math.round((new Date(this.endsAt).getTime() - new Date(this.startsAt).getTime()) / 86400000));
    return days > 0 ? days * car.price : null;
  }

  submitBooking(): void {
    if (!this.auth.session()) {
      this.router.navigate(['/login'], { queryParams: { from: `/cars/${this.carId}` } });
      return;
    }
    if (!this.startsAt || !this.endsAt) {
      this.error.set('Please choose a pickup and return date.');
      return;
    }

    this.error.set(null);
    this.success.set(null);
    this.submitting.set(true);

    this.api.createBooking({ resourceId: this.carId, startsAt: this.startsAt, endsAt: this.endsAt }).subscribe({
      next: (booking) => {
        this.submitting.set(false);
        this.success.set(`Booked! Confirmation ${booking.bookingRef} — total $${booking.total}.`);
        this.api.getBookedRanges(this.carId).subscribe((ranges) => this.bookedRanges.set(ranges));
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.error || 'Could not create booking. Please try again.');
      },
    });
  }
}
