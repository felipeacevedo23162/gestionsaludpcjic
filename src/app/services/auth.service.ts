import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const API_URL = '/api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) {}

  // credentials: { documento, contrasena }
  login(credentials: { documento: string; contrasena: string }): Observable<any> {
    return this.http.post<any>(`${API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        if (response?.success && response.data?.tokens) {
          this.setCookie('accessToken', response.data.tokens.accessToken, 1); // 1 día
          this.setCookie('refreshToken', response.data.tokens.refreshToken, 7); // 7 días
        }
      })
    );
  }

  getAccessToken(): string | null {
    return this.getCookie('accessToken');
  }

  getRefreshToken(): string | null {
    return this.getCookie('refreshToken');
  }

  logout() {
    this.deleteCookie('accessToken');
    this.deleteCookie('refreshToken');
  }

  getCurrentUserId(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      // Decodificar el JWT (formato: header.payload.signature)
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.id || decoded.userId || decoded.sub || null;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict;Secure`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
}
