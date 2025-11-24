import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = '/api';

export interface Appointment {
  id: number;
  paciente_id: string; // char(36)
  profesional_id?: string | null; // char(36)
  fecha_inicio: string; // datetime
  fecha_fin: string; // datetime
  tipo_servicio_id?: number | null;
  observaciones?: string | null;
  estado_id?: number;
  creado_en?: string;
  actualizado_en?: string | null;
  actualizado_por?: string | null;

  // joined/descriptive fields
  paciente_nombre?: string;
  paciente_documento?: string;
  paciente_telefono?: string;
  profesional_nombre?: string;
  tipo_servicio?: string;
  estado?: string;
}

export interface AppointmentsResponse {
  success: boolean;
  data: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    estado_id?: number;
    profesional_id?: string;
    tipo_servicio_id?: number;
    search?: string;
  };
}

export interface AppointmentResponse {
  success: boolean;
  data: Appointment;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene citas paginadas con filtros opcionales
   */
  getAppointments(
    page: number = 1, 
    limit: number = 10, 
    filters?: {
      fecha_inicio?: string;
      fecha_fin?: string;
      estado_id?: number;
      profesional_id?: string;
      tipo_servicio_id?: number;
      search?: string;
    }
  ): Observable<AppointmentsResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (filters) {
      if (filters.fecha_inicio) params = params.set('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params = params.set('fecha_fin', filters.fecha_fin);
      if (filters.estado_id) params = params.set('estado_id', String(filters.estado_id));
      if (filters.profesional_id) params = params.set('profesional_id', filters.profesional_id);
      if (filters.tipo_servicio_id) params = params.set('tipo_servicio_id', String(filters.tipo_servicio_id));
      if (filters.search) params = params.set('search', filters.search);
    }

    console.log('🌐 Llamando API getAppointments:', {
      url: `${API_URL}/appointments`,
      params: params.toString()
    });

    return this.http.get<AppointmentsResponse>(`${API_URL}/appointments`, { params });
  }

  /**
   * Obtiene una cita por ID
   */
  getAppointmentById(id: number): Observable<AppointmentResponse> {
    console.log('🔍 Obteniendo cita por ID:', id);
    return this.http.get<AppointmentResponse>(`${API_URL}/appointments/${id}`);
  }

  /**
   * Crea una nueva cita
   */
  createAppointment(appointment: Partial<Appointment>): Observable<AppointmentResponse> {
    console.log('➕ Creando cita:', appointment);
    return this.http.post<AppointmentResponse>(`${API_URL}/appointments`, appointment);
  }

  /**
   * Actualiza una cita existente
   */
  updateAppointment(id: number, appointment: Partial<Appointment>): Observable<AppointmentResponse> {
    console.log('✏️ Actualizando cita:', id, appointment);
    return this.http.put<AppointmentResponse>(`${API_URL}/appointments/${id}`, appointment);
  }

  /**
   * Cancela una cita (cambia estado a cancelado)
   */
  deleteAppointment(id: number): Observable<{ success: boolean; message: string }> {
    console.log('❌ Cancelando cita:', id);
    return this.http.delete<{ success: boolean; message: string }>(`${API_URL}/appointments/${id}`);
  }

  /**
   * Obtiene citas para vista de calendario
   */
  getCalendarAppointments(start?: string, end?: string, profesional_id?: string): Observable<any> {
    let params = new HttpParams();
    if (start) params = params.set('start', start);
    if (end) params = params.set('end', end);
    if (profesional_id) params = params.set('profesional_id', profesional_id);

    return this.http.get<any>(`${API_URL}/appointments/calendar/view`, { params });
  }
}
