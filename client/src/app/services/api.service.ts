import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface CarMetadata {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  seats: number;
  transmission: string;
  fuelType: string;
  location: string;
}

export interface Car {
  id: number;
  name: string;
  category: string;
  description: string;
  image: string | null;
  price: number;
  capacity: number;
  metadata: CarMetadata;
}

export interface CarInput {
  name: string;
  category: string;
  description: string;
  image: string | null;
  price: number;
  metadata: CarMetadata;
}

export interface BookedRange { startsAt: string; endsAt: string; }

export interface Booking {
  bookingRef: string;
  startsAt: string;
  endsAt: string;
  total: number;
}

export interface MyBooking {
  bookingRef: string;
  startsAt: string;
  endsAt: string;
  status: string;
  total: number;
  car: Car;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  listCars(): Observable<Car[]> {
    return this.http.get<Car[]>('/api/resources');
  }

  getCar(id: number): Observable<Car> {
    return this.http.get<Car>(`/api/resources/${id}`);
  }

  createCar(payload: CarInput): Observable<Car> {
    return this.http.post<Car>('/api/resources', payload);
  }

  updateCar(id: number, payload: CarInput): Observable<Car> {
    return this.http.put<Car>(`/api/resources/${id}`, payload);
  }

  deleteCar(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`/api/resources/${id}`);
  }

  getBookedRanges(carId: number): Observable<BookedRange[]> {
    return this.http.get<BookedRange[]>(`/api/availability/${carId}`);
  }

  createBooking(payload: { resourceId: number; startsAt: string; endsAt: string }): Observable<Booking> {
    return this.http.post<Booking>('/api/bookings', {
      resource_id: payload.resourceId,
      starts_at: payload.startsAt,
      ends_at: payload.endsAt,
    });
  }

  getMyBookings(): Observable<MyBooking[]> {
    return this.http.get<MyBooking[]>('/api/my-bookings');
  }
}
