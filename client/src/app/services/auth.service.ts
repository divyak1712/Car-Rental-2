import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, ReplaySubject, catchError, of, tap } from 'rxjs';

export interface Session {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  readonly session = signal<Session | null>(null);
  private readonly readySubject = new ReplaySubject<void>(1);
  readonly ready$ = this.readySubject.asObservable();

  constructor() {
    this.refreshSession();
  }

  refreshSession(): void {
    this.http.get<Session | null>('/api/auth/session').pipe(
      catchError(() => of(null))
    ).subscribe((session) => {
      this.session.set(session);
      this.readySubject.next();
    });
  }

  signUp(email: string, password: string, name?: string): Observable<Session> {
    return this.http.post<Session>('/api/auth/signup', { email, password, name }).pipe(
      tap((session) => this.session.set(session))
    );
  }

  signIn(email: string, password: string): Observable<Session> {
    return this.http.post<Session>('/api/auth/signin', { email, password }).pipe(
      tap((session) => this.session.set(session))
    );
  }

  signOut(): Observable<unknown> {
    return this.http.post('/api/auth/signout', {}).pipe(
      tap(() => this.session.set(null))
    );
  }
}
