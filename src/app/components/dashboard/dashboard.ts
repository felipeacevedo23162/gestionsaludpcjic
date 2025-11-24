import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { CommonModule } from '@angular/common';
import { PacientesService } from '../../services/pacientes.service';
import { UsuariosService } from '../../services/usuarios.service';
import { CitasService, Appointment } from '../../services/citas.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface DashboardStats {
  totalPacientes: number;
  totalProfesionales: number;
  totalCitas: number;
}

@Component({
  selector: 'dashboard',
  standalone: true,
  imports: [Navbar, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  stats: DashboardStats = {
    totalPacientes: 0,
    totalProfesionales: 0,
    totalCitas: 0
  };
  
  upcomingAppointments: Appointment[] = [];
  loading = false;
  errorMessage = '';
  private loadedCalls = 0;

  constructor(
    private pacientesService: PacientesService,
    private usuariosService: UsuariosService,
    private citasService: CitasService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.errorMessage = '';
    console.log('🔄 Cargando dashboard...');

    this.loadPacientesCount();
    this.loadProfesionalesCount();
    this.loadCitasCount();
    this.loadUpcomingAppointments();
  }

  private loadPacientesCount(): void {
    this.pacientesService.getPatients(1, 1).subscribe({
      next: (res) => {
        this.stats.totalPacientes = res.pagination?.total || 0;
        console.log('✅ Total pacientes:', this.stats.totalPacientes);
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('❌ Error cargando pacientes:', err);
        this.stats.totalPacientes = 0;
        this.checkLoadingComplete();
      }
    });
  }

  private loadProfesionalesCount(): void {
    this.usuariosService.getUsers(1, 1).subscribe({
      next: (res) => {
        this.stats.totalProfesionales = res.pagination?.total || 0;
        console.log('✅ Total profesionales:', this.stats.totalProfesionales);
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('❌ Error cargando usuarios:', err);
        this.stats.totalProfesionales = 0;
        this.checkLoadingComplete();
      }
    });
  }

  private loadCitasCount(): void {
    this.citasService.getAppointments(1, 1).subscribe({
      next: (res) => {
        this.stats.totalCitas = res.pagination?.total || 0;
        console.log('✅ Total citas:', this.stats.totalCitas);
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('❌ Error cargando citas:', err);
        this.stats.totalCitas = 0;
        this.checkLoadingComplete();
      }
    });
  }

  private loadUpcomingAppointments(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.citasService.getAppointments(1, 5, {
      fecha_inicio: today
    }).subscribe({
      next: (res) => {
        this.upcomingAppointments = (res.data || []).filter(a => a.estado_id !== 4);
        console.log('✅ Próximas citas:', this.upcomingAppointments.length);
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('❌ Error cargando próximas citas:', err);
        this.upcomingAppointments = [];
        this.checkLoadingComplete();
      }
    });
  }
  
  private checkLoadingComplete(): void {
    this.loadedCalls++;
    console.log(`✓ Llamadas completadas: ${this.loadedCalls}/4`);
    
    if (this.loadedCalls >= 4) {
      this.loading = false;
      this.loadedCalls = 0;
      console.log('✅ Dashboard cargado completamente');
      this.cdr.detectChanges();
    }
  }

  private handleError(error: any): void {
    if (error?.status === 401) {
      this.errorMessage = 'Tu sesión ha expirado. Serás redirigido al login.';
      setTimeout(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }, 2000);
    } else if (error?.status === 0 || error?.status === 500) {
      this.errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
    } else {
      this.errorMessage = 'Error al cargar los datos del dashboard.';
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  formatTime(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  getEstadoBadgeClass(estadoId: number | undefined): string {
    switch(estadoId) {
      case 1: return 'bg-primary';
      case 2: return 'bg-warning text-dark';
      case 3: return 'bg-success';
      case 4: return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
