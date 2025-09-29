import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// Reuse same base URL pattern as AuthService
const API_URL = 'http://localhost:3000/api';

export interface Patient {
  id: string; // char(36)
  tipo_documento_id?: number | null; // int
  documento: string; // varchar(20)
  nombres?: string | null; // varchar(100)
  apellidos?: string | null; // varchar(100)
  fecha_nacimiento?: string | null; // date
  telefono?: string | null; // varchar(20)
  correo?: string | null; // varchar(100)
  direccion?: string | null; // text
  genero_id?: number | null; // int
  estado_civil_id?: number | null; // int
  creado_en?: string; // timestamp
  actualizado_en?: string | null; // timestamp
  actualizado_por?: string | null; // char(36)

  // joined/descriptive fields returned by the API
  genero_nombre?: string | null;
  estado_civil?: string | null;
  tipo_documento?: string | null; // descripcion from tipos_documento
}

export interface PatientsResponse {
  success: boolean;
  data: Patient[];
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
export class PacientesService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Obtiene pacientes paginados y filtrados por búsqueda.
   * Añade el header Authorization con el token si está presente.
   */
  getPatients(page: number = 1, limit: number = 10, search: string = ''): Observable<PatientsResponse> {
    const token = this.authService.getAccessToken();

    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PatientsResponse>(`${API_URL}/patients`, { headers, params });
  }

  // Opcional: wrapper para búsqueda rápida
  searchPatients(query: string, page: number = 1, limit: number = 10) {
    return this.getPatients(page, limit, query);
  }

  /**
   * Obtiene un paciente por su id
   */
  getPatientById(id: string): Observable<Patient> {
    const token = this.authService.getAccessToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) { headers = headers.set('Authorization', `Bearer ${token}`); }
    return this.http.get<Patient>(`${API_URL}/patients/${id}`, { headers });
  }

  /**
   * Crea un nuevo paciente. El backend genera `id`, `creado_en`, etc.
   */
  createPatient(payload: Partial<Patient>): Observable<any> {
    const token = this.authService.getAccessToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) { headers = headers.set('Authorization', `Bearer ${token}`); }
    return this.http.post<any>(`${API_URL}/patients`, payload, { headers });
  }

  /**
   * Actualiza un paciente existente (por id)
   */
  updatePatient(id: string, payload: Partial<Patient>): Observable<any> {
    const token = this.authService.getAccessToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) { headers = headers.set('Authorization', `Bearer ${token}`); }
    return this.http.put<any>(`${API_URL}/patients/${id}`, payload, { headers });
  }

  /**
   * Elimina un paciente por id
   */
  deletePatient(id: string): Observable<any> {
    const token = this.authService.getAccessToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) { headers = headers.set('Authorization', `Bearer ${token}`); }
    return this.http.delete<any>(`${API_URL}/patients/${id}`, { headers });
  }
}
