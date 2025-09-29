import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// TODO: replace with an environment variable or proxy when moving to other environments
const API_URL = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) {}

  // credentials: { documento, contrasena }
  login(credentials: { documento: string; contrasena: string }): Observable<any> {
    return this.http.post<any>(`${API_URL}/auth/login`, credentials);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}
