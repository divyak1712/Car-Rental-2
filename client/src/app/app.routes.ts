import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/car-list/car-list').then(m => m.CarList) },
  { path: 'cars/:id', loadComponent: () => import('./pages/car-detail/car-detail').then(m => m.CarDetail) },
  { path: 'login', loadComponent: () => import('./pages/sign-in/sign-in').then(m => m.SignIn) },
  { path: 'signup', loadComponent: () => import('./pages/sign-up/sign-up').then(m => m.SignUp) },
  { path: 'account/rentals', canActivate: [authGuard], loadComponent: () => import('./pages/my-rentals/my-rentals').then(m => m.MyRentals) },
  { path: 'admin/fleet', canActivate: [adminGuard], loadComponent: () => import('./pages/admin-fleet/admin-fleet').then(m => m.AdminFleet) },
];
