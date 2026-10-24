import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule, RouterLink],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  error = signal<string | null>(null);
  submitting = signal(false);

  submit(): void {
    this.error.set(null);
    this.submitting.set(true);
    this.auth.signIn(this.email, this.password).subscribe({
      next: () => {
        this.submitting.set(false);
        const from = this.route.snapshot.queryParamMap.get('from') || '/';
        this.router.navigateByUrl(from);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.error || 'Sign in failed.');
      },
    });
  }
}
