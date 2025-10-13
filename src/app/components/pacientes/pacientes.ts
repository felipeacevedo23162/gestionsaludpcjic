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
  page = 1;
  limit = 10;
  total = 0;
  errorMessage = '';
  showRetry = false;

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
    // TODO: navegar a vista detalle o mostrar modal
    console.log('view', id);
  }

  editPatient(id: string) {
    // TODO: abrir formulario de edición
    console.log('edit', id);
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
}
