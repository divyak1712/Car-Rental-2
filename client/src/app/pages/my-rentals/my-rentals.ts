import { SlicePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ApiService, MyBooking } from '../../services/api.service';

@Component({
  selector: 'app-my-rentals',
  imports: [SlicePipe],
  templateUrl: './my-rentals.html',
  styleUrl: './my-rentals.css',
})
export class MyRentals {
  private api = inject(ApiService);

  bookings = signal<MyBooking[]>([]);
  loading = signal(true);

  constructor() {
    this.api.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
