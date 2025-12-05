import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitasService, Appointment } from '../../services/citas.service';
import { PacientesService, Patient } from '../../services/pacientes.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [Navbar, CommonModule, FormsModule],
  templateUrl: './citas.html',
  styleUrls: ['./citas.css']
})
export class Citas implements OnInit {
  appointments: Appointment[] = [];
  loading = false;
  searchQuery = '';
  fechaInicio = '';
  fechaFin = '';
  selectedEstado: number | null = null;
  selectedProfesional: string | null = null;
  selectedTipoServicio: number | null = null;
  page = 1;
  limit = 10;
  total = 0;
  errorMessage = '';
  showRetry = false;
  showModal = false;
  showViewModal = false;
  showEditModal = false;
  newAppointment: Partial<Appointment> = {};
  selectedAppointment: Appointment | null = null;
  editingAppointment: Partial<Appointment> = {};
  
  // Variables para búsqueda de pacientes
  pacientes: Patient[] = [];
  pacientesFiltered: Patient[] = [];
  pacienteSearchQuery = '';
  loadingPacientes = false;

  constructor(
    private citasService: CitasService,
    private pacientesService: PacientesService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  private handleError(error: any) {
    this.errorMessage = '';
    this.showRetry = false;

    if (error?.status === 401) {
      this.errorMessage = 'Tu sesión ha expirado. Serás redirigido al login.';
      setTimeout(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }, 2000);
    } else if (error?.status === 0 || error?.status === 500) {
      this.errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
      this.showRetry = true;
    } else if (error?.status === 403) {
      this.errorMessage = 'No tienes permisos para acceder a esta información.';
    } else if (error?.status === 409) {
      this.errorMessage = error?.error?.message || 'Conflicto de horarios detectado.';
    } else {
      this.errorMessage = error?.error?.message || 'Error desconocido al cargar los datos.';
      this.showRetry = true;
    }
  }

  retryLoad() {
    this.errorMessage = '';
    this.showRetry = false;
    this.loadAppointments();
  }

  clearError() {
    this.errorMessage = '';
    this.showRetry = false;
  }

  clearFilters() {
    this.searchQuery = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.selectedEstado = null;
    this.selectedProfesional = null;
    this.selectedTipoServicio = null;
    this.page = 1;
    this.loadAppointments(1);
  }

  loadAppointments(page: number = this.page) {
    this.loading = true;
    console.log('🔄 Cargando citas - Página:', page);
    
    const filters = {
      fecha_inicio: this.fechaInicio || undefined,
      fecha_fin: this.fechaFin || undefined,
      estado_id: this.selectedEstado || undefined,
      profesional_id: this.selectedProfesional || undefined,
      tipo_servicio_id: this.selectedTipoServicio || undefined,
      search: this.searchQuery || undefined
    };
    
    this.citasService.getAppointments(page, this.limit, filters).subscribe({
      next: (res) => {
        console.log('✅ Respuesta recibida:', res);
        
        this.appointments = res.data || [];
        this.page = res.pagination?.page || 1;
        this.limit = res.pagination?.limit || 10;
        this.total = res.pagination?.total || 0;
        this.loading = false;
        
        console.log('✓ Estado actualizado - Citas en memoria:', this.appointments.length);
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando citas:', err);
        this.loading = false;
        this.handleError(err);
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.loadAppointments(1);
  }

  goToPage(page: number) {
    this.loadAppointments(page);
  }

  trackByAppointmentId(index: number, appointment: Appointment): number {
    return appointment.id;
  }

  viewAppointment(id: number) {
    console.log('👁️ Abriendo modal Ver cita:', id);
    this.loading = true;
    this.cdr.detectChanges();
    
    this.citasService.getAppointmentById(id).subscribe({
      next: (response) => {
        console.log('✅ Cita cargada para ver:', response);
        this.selectedAppointment = response.data;
        this.showViewModal = true;
        this.loading = false;
        document.body.style.overflow = 'hidden';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando cita:', err);
        this.loading = false;
        this.handleError(err);
        this.cdr.detectChanges();
      }
    });
  }

  editAppointment(id: number) {
    console.log('✏️ Abriendo modal Editar cita:', id);
    this.loading = true;
    this.cdr.detectChanges();
    
    this.citasService.getAppointmentById(id).subscribe({
      next: (response) => {
        console.log('✅ Cita cargada para editar:', response);
        this.editingAppointment = { ...response.data };
        this.showEditModal = true;
        this.loading = false;
        document.body.style.overflow = 'hidden';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando cita:', err);
        this.loading = false;
        this.handleError(err);
        this.cdr.detectChanges();
      }
    });
  }

  deleteAppointment(id: number) {
    if (!confirm('¿Cancelar esta cita? Esta acción cambiará el estado a "Cancelado".')) return;
    
    this.loading = true;
    this.citasService.deleteAppointment(id).subscribe({
      next: () => {
        this.loading = false;
        alert('Cita cancelada exitosamente');
        this.loadAppointments(1);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error cancelando cita', err);
        this.handleError(err);
      }
    });
  }

  openNewAppointmentModal() {
    const currentUserId = this.authService.getCurrentUserId();
    this.newAppointment = {
      estado_id: 1, // Default: Programada
      profesional_id: currentUserId || undefined // ID del usuario logueado
    };
    this.pacienteSearchQuery = '';
    this.loadPacientes(); // Cargar pacientes al abrir modal
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.showModal = false;
    this.newAppointment = {};
    document.body.style.overflow = '';
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedAppointment = null;
    document.body.style.overflow = '';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingAppointment = {};
    document.body.style.overflow = '';
  }

  saveAppointment() {
    // Validar campos requeridos
    if (!this.newAppointment.paciente_id || !this.newAppointment.fecha_inicio || !this.newAppointment.fecha_fin) {
      this.errorMessage = 'Por favor completa los campos requeridos (paciente, fecha inicio, fecha fin)';
      return;
    }

    // Validar fechas
    const startDate = new Date(this.newAppointment.fecha_inicio);
    const endDate = new Date(this.newAppointment.fecha_fin);
    
    if (startDate >= endDate) {
      this.errorMessage = 'La fecha de fin debe ser posterior a la fecha de inicio';
      return;
    }

    if (startDate < new Date()) {
      this.errorMessage = 'No se pueden crear citas en el pasado';
      return;
    }

    this.loading = true;
    this.citasService.createAppointment(this.newAppointment).subscribe({
      next: () => {
        this.loading = false;
        this.closeModal();
        alert('Cita creada exitosamente');
        this.loadAppointments(1);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error creando cita', err);
        this.handleError(err);
      }
    });
  }

  updateAppointment() {
    if (!this.editingAppointment.id) {
      this.errorMessage = 'Error: ID de cita no válido';
      return;
    }

    // Validar fechas si se están actualizando
    if (this.editingAppointment.fecha_inicio && this.editingAppointment.fecha_fin) {
      const startDate = new Date(this.editingAppointment.fecha_inicio);
      const endDate = new Date(this.editingAppointment.fecha_fin);
      
      if (startDate >= endDate) {
        this.errorMessage = 'La fecha de fin debe ser posterior a la fecha de inicio';
        return;
      }
    }

    this.loading = true;
    this.citasService.updateAppointment(this.editingAppointment.id, this.editingAppointment).subscribe({
      next: () => {
        this.loading = false;
        this.closeEditModal();
        alert('Cita actualizada exitosamente');
        this.loadAppointments(this.page);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error actualizando cita', err);
        this.handleError(err);
      }
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
  }

  formatTime(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  // Métodos para búsqueda de pacientes
  loadPacientes() {
    this.loadingPacientes = true;
    this.pacientesService.getPatients(1, 100).subscribe({
      next: (res) => {
        this.pacientes = res.data || [];
        this.pacientesFiltered = this.pacientes;
        this.loadingPacientes = false;
        console.log('✅ Pacientes cargados:', this.pacientes.length);
      },
      error: (err) => {
        console.error('❌ Error cargando pacientes:', err);
        this.pacientes = [];
        this.pacientesFiltered = [];
        this.loadingPacientes = false;
      }
    });
  }

  onPacienteSearch() {
    const query = this.pacienteSearchQuery.toLowerCase().trim();
    if (!query) {
      this.pacientesFiltered = this.pacientes;
      return;
    }

    this.pacientesFiltered = this.pacientes.filter(p => {
      const nombreCompleto = `${p.nombres || ''} ${p.apellidos || ''}`.toLowerCase();
      const documento = (p.documento || '').toLowerCase();
      return nombreCompleto.includes(query) || documento.includes(query);
    });
  }

  getPacienteDisplayName(paciente: Patient): string {
    if (!paciente) return '';
    const nombre = `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim();
    return nombre || paciente.documento || paciente.id;
  }
}
