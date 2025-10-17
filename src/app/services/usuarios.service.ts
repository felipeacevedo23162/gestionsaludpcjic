import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Use relative API path so the dev server proxy (proxy.conf.json) can forward requests
const API_URL = '/api';

export interface User {
  id: string; // char(36)
  tipo_documento_id?: number | null; // int
  documento: string; // varchar(20)
  nombres?: string | null; // varchar(100)
  apellidos?: string | null; // varchar(100)
  fecha_nacimiento?: string | null; // date
  telefono?: string | null; // varchar(20)
  contrasena?: string; // varchar(255) - solo para crear/actualizar
  rol_id?: number | null; // int
  genero_id?: number | null; // int
  activo?: boolean; // tinyint(1)
  creado_en?: string; // timestamp
  actualizado_en?: string | null; // timestamp
  actualizado_por?: string | null; // char(36)

  // joined/descriptive fields returned by the API
  rol_nombre?: string | null;
  genero_nombre?: string | null;
  tipo_documento?: string | null; // descripcion from tipos_documento
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene usuarios paginados y filtrados por búsqueda.
   * El interceptor authInterceptor añadirá automáticamente el header Authorization.
   * Solo accesible para administradores (rol_id = 1).
   */
  getUsers(page: number = 1, limit: number = 10, search: string = ''): Observable<UsersResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    console.log('🌐 Llamando API getUsers:', {
      url: `${API_URL}/users`,
      params: params.toString(),
      page,
      limit,
      search
    });

    return this.http.get<UsersResponse>(`${API_URL}/users`, { params });
  }

  // Opcional: wrapper para búsqueda rápida
  searchUsers(query: string, page: number = 1, limit: number = 10) {
    return this.getUsers(page, limit, query);
  }

  /**
   * Obtiene un usuario por su id
   * Los usuarios no administradores solo pueden ver su propia información.
   */
  getUserById(id: string): Observable<{ success: boolean; data: User }> {
    return this.http.get<{ success: boolean; data: User }>(`${API_URL}/users/${id}`);
  }

  /**
   * Crea un nuevo usuario. El backend genera `id`, `creado_en`, etc.
   * Solo accesible para administradores (rol_id = 1).
   */
  createUser(payload: Partial<User>): Observable<any> {
    return this.http.post<any>(`${API_URL}/users`, payload);
  }

  /**
   * Actualiza un usuario existente (por id)
   * Los usuarios pueden actualizar su propia información, o los administradores pueden actualizar cualquier usuario.
   */
  updateUser(id: string, payload: Partial<User>): Observable<any> {
    return this.http.put<any>(`${API_URL}/users/${id}`, payload);
  }

  /**
   * Desactiva un usuario por id (soft delete)
   * Solo accesible para administradores (rol_id = 1).
   */
  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${API_URL}/users/${id}`);
  }

  /**
   * Activa un usuario desactivado
   * Solo accesible para administradores (rol_id = 1).
   */
  activateUser(id: string): Observable<any> {
    return this.updateUser(id, { activo: true });
  }

  /**
   * Desactiva un usuario
   * Solo accesible para administradores (rol_id = 1).
   */
  deactivateUser(id: string): Observable<any> {
    return this.updateUser(id, { activo: false });
  }

  /**
   * Cambia la contraseña de un usuario
   * Los usuarios pueden cambiar su propia contraseña, o los administradores pueden cambiar cualquier contraseña.
   */
  changePassword(id: string, newPassword: string): Observable<any> {
    return this.updateUser(id, { contrasena: newPassword });
  }
}
