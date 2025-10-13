import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Solo aplicar a rutas de la API
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  // Excluir rutas públicas que no necesitan token
  const publicRoutes = ['/api/auth/login', '/api/auth/register'];
  if (publicRoutes.some(route => req.url.includes(route))) {
    return next(req);
  }

  const token = authService.getAccessToken();

  if (!token) {
    console.warn('[AuthInterceptor] ⚠️ No token found for:', req.url);
    // Redirigir a login si no hay token en rutas protegidas
    router.navigate(['/login']);
    return next(req);
  }

  console.log('[AuthInterceptor] 🔑 Token encontrado:', token.substring(0, 20) + '...');

  let normToken = token.trim();
  if (/^".*"$/.test(normToken)) {
    normToken = normToken.slice(1, -1); // elimina comillas
  }

  const authHeaderValue = /^Bearer\s+/i.test(normToken)
    ? normToken
    : `Bearer ${normToken}`;

  console.log('[AuthInterceptor] 📤 Enviando request con Authorization:', authHeaderValue.substring(0, 30) + '...');

  const authReq = req.clone({
    setHeaders: { Authorization: authHeaderValue }
  });

  return next(authReq).pipe(
    tap({
      next: (event) => {
        console.log('[AuthInterceptor] ✅ Response OK para:', req.url);
      },
      error: (error) => {
        if (error.status === 401) {
          console.warn('[AuthInterceptor] Unauthorized - redirecting to login');
          authService.logout(); // limpia sesión
          router.navigate(['/login']);
        } else if (error.status === 403) {
          console.warn('[AuthInterceptor] Forbidden - no access to:', req.url);
        } else if (error.status === 0) {
          console.error('[AuthInterceptor] Network error for:', req.url);
        }
      }
    })
  );
};
