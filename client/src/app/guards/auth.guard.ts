import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ready$.pipe(
    map(() =>
      auth.session()
        ? true
        : router.createUrlTree(['/login'], { queryParams: { from: state.url } })
    )
  );
};
