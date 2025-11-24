import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PacientesService, Patient } from '../../services/pacientes.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [Navbar, CommonModule, FormsModule],
  templateUrl: './pacientes.html',
  styleUrls: ['./pacientes.css']
})
export class Pacientes implements OnInit {
  patients: Patient[] = [];
  loading = false;
  searchQuery = '';
  selectedGender: number | null = null;
  selectedCivilStatus: number | null = null;
  page = 1;
  limit = 10;
  total = 0;
  errorMessage = '';
  showRetry = false;
  showModal = false;
  showViewModal = false;
  showEditModal = false;
  newPatient: Partial<Patient> = {};
  selectedPatient: Patient | null = null;
  editingPatient: Partial<Patient> = {};

  constructor(
    private pacientesService: PacientesService, 
    private router: Router, 
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  private handleError(error: any) {
    this.errorMessage = '';
    this.showRetry = false;

    if (error?.status === 401) {
      // Unauthorized - session expired or invalid token
      this.errorMessage = 'Tu sesión ha expirado. Serás redirigido al login.';
      setTimeout(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }, 2000);
    } else if (error?.status === 0 || error?.status === 500) {
      // Network error or server error
      this.errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
      this.showRetry = true;
    } else if (error?.status === 403) {
      this.errorMessage = 'No tienes permisos para acceder a esta información.';
    } else {
      this.errorMessage = error?.error?.message || 'Error desconocido al cargar los datos.';
      this.showRetry = true;
    }
  }

  retryLoad() {
    this.errorMessage = '';
    this.showRetry = false;
    this.loadPatients();
  }

  clearError() {
    this.errorMessage = '';
    this.showRetry = false;
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedGender = null;
    this.selectedCivilStatus = null;
    this.page = 1;
    this.loadPatients(1);
  }

  loadPatients(page: number = this.page) {
    this.loading = true;
    console.log('🔄 Cargando pacientes - Página:', page, 'Búsqueda:', this.searchQuery);
    
    this.pacientesService.getPatients(page, this.limit, this.searchQuery).subscribe({
      next: (res) => {
        console.log('✅ Respuesta recibida:', res);
        console.log('📊 Datos de pacientes:', res.data);
        console.log('📄 Total de pacientes:', res.pagination?.total);
        
        this.patients = res.data || [];
        this.page = res.pagination?.page || 1;
        this.limit = res.pagination?.limit || 10;
        this.total = res.pagination?.total || 0;
        this.loading = false;
        
        console.log('✓ Estado actualizado - Pacientes en memoria:', this.patients.length);
        console.log('✓ Array de pacientes:', this.patients);
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('🔄 Change detection ejecutado');
      },
      error: (err) => {
        console.error('❌ Error cargando pacientes:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        this.loading = false;
        this.handleError(err);
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.loadPatients(1);
  }

  goToPage(page: number) {
    this.loadPatients(page);
  }

  trackByPatientId(index: number, patient: Patient): string {
    return patient.id;
  }

  viewPatient(id: string) {
    console.log('👁️ Abriendo modal Ver paciente:', id);
    this.loading = true;
    this.cdr.detectChanges();
    
    this.pacientesService.getPatientById(id).subscribe({
      next: (patient) => {
        console.log('✅ Paciente cargado para ver:', patient);
        this.selectedPatient = patient;
        this.showViewModal = true;
        this.loading = false;
        document.body.style.overflow = 'hidden';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando paciente:', err);
        this.loading = false;
        this.handleError(err);
        this.cdr.detectChanges();
      }
    });
  }

  editPatient(id: string) {
    console.log('✏️ Abriendo modal Editar paciente:', id);
    this.loading = true;
    this.cdr.detectChanges();
    
    this.pacientesService.getPatientById(id).subscribe({
      next: (patient) => {
        console.log('✅ Paciente cargado para editar:', patient);
        this.editingPatient = { ...patient };
        this.showEditModal = true;
        this.loading = false;
        document.body.style.overflow = 'hidden';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando paciente:', err);
        this.loading = false;
        this.handleError(err);
        this.cdr.detectChanges();
      }
    });
  }

  deletePatient(id: string) {
    if (!confirm('¿Eliminar paciente?')) return;

    this.loading = true;
    this.pacientesService.deletePatient(id).subscribe({
      next: () => {
        this.loading = false;
        this.loadPatients(1);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error eliminando paciente', err);
        this.handleError(err);
      }
    });
  }

  openNewPatientModal() {
    this.newPatient = {};
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.showModal = false;
    this.newPatient = {};
    document.body.style.overflow = '';
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedPatient = null;
    document.body.style.overflow = '';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingPatient = {};
    document.body.style.overflow = '';
  }

  savePatient() {
    if (!this.newPatient.documento || !this.newPatient.nombres || !this.newPatient.apellidos) {
      this.errorMessage = 'Por favor completa los campos requeridos';
      return;
    }

    this.loading = true;
    this.pacientesService.createPatient(this.newPatient).subscribe({
      next: () => {
        this.loading = false;
        this.closeModal();
        this.loadPatients(1);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error creando paciente', err);
        this.handleError(err);
      }
    });
  }

  updatePatient() {
    if (!this.editingPatient.id || !this.editingPatient.documento || !this.editingPatient.nombres || !this.editingPatient.apellidos) {
      this.errorMessage = 'Por favor completa los campos requeridos';
      return;
    }

    this.loading = true;
    this.pacientesService.updatePatient(this.editingPatient.id, this.editingPatient).subscribe({
      next: () => {
        this.loading = false;
        this.closeEditModal();
        this.loadPatients(this.page);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error actualizando paciente', err);
        this.handleError(err);
      }
    });
  }
}
