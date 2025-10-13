import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true, // muy importante si es standalone
  imports: [CommonModule, FormsModule], // acá habilitás ngIf y ngModel
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  loginData = {
    documento: '',
    contrasena: ''
  };

  loading = false;
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {
    const token = this.auth.getAccessToken();
    if (token) {
      // if session active, redirect to dashboard
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit() {
    this.errorMessage = '';
    this.loading = true;
    this.auth.login(this.loginData).subscribe({
      next: (res) => {
        this.loading = false;
        console.log('Login success', res);
        // based on the Postman response in the screenshot, tokens are in res.data.tokens
        const tokens = res?.data?.tokens;
        if (tokens?.accessToken) {
          localStorage.setItem('accessToken', tokens.accessToken);
        }
        if (tokens?.refreshToken) {
          localStorage.setItem('refreshToken', tokens.refreshToken);
        }
        // redirect to dashboard after successful login
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        console.error('Login error', err);
        if (err?.status === 429) {
          this.errorMessage = 'Demasiados intentos. Intenta nuevamente en un momento.';
        } else {
          this.errorMessage = err?.error?.message || 'Error en el login';
        }
      }
    });
  }
}
