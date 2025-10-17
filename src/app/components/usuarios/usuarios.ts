import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, User } from '../../services/usuarios.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [Navbar, CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css']
})
export class Usuarios implements OnInit {
  users: User[] = [];
  loading = false;
  searchQuery = '';
  page = 1;
  limit = 10;
  total = 0;
  errorMessage = '';
  showRetry = false;

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
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
      this.errorMessage = 'No tienes permisos para acceder a esta información. Solo administradores pueden gestionar usuarios.';
    } else {
      this.errorMessage = error?.error?.message || 'Error desconocido al cargar los datos.';
      this.showRetry = true;
    }
  }

  retryLoad() {
    this.errorMessage = '';
    this.showRetry = false;
    this.loadUsers();
  }

  clearError() {
    this.errorMessage = '';
    this.showRetry = false;
  }

  loadUsers(page: number = this.page) {
    this.loading = true;
    console.log('🔄 Cargando usuarios - Página:', page, 'Búsqueda:', this.searchQuery);
    
    this.usuariosService.getUsers(page, this.limit, this.searchQuery).subscribe({
      next: (res) => {
        console.log('✅ Respuesta recibida:', res);
        console.log('📊 Datos de usuarios:', res.data);
        console.log('📄 Total de usuarios:', res.pagination?.total);
        
        this.users = res.data || [];
        this.page = res.pagination?.page || 1;
        this.limit = res.pagination?.limit || 10;
        this.total = res.pagination?.total || 0;
        this.loading = false;
        
        console.log('✓ Estado actualizado - Usuarios en memoria:', this.users.length);
        console.log('✓ Array de usuarios:', this.users);
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('🔄 Change detection ejecutado');
      },
      error: (err) => {
        console.error('❌ Error cargando usuarios:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        this.loading = false;
        this.handleError(err);
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.loadUsers(1);
  }

  goToPage(page: number) {
    this.loadUsers(page);
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  viewUser(id: string) {
    // TODO: navegar a vista detalle o mostrar modal
    console.log('view user', id);
  }

  editUser(id: string) {
    // TODO: abrir formulario de edición
    console.log('edit user', id);
  }

  deleteUser(id: string) {
    if (!confirm('¿Desactivar usuario? El usuario no podrá acceder al sistema.')) return;
    
    this.loading = true;
    this.usuariosService.deleteUser(id).subscribe({
      next: () => {
        this.loading = false;
        alert('Usuario desactivado exitosamente');
        this.loadUsers(1);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error desactivando usuario', err);
        if (err?.error?.message === 'Cannot delete your own account') {
          this.errorMessage = 'No puedes desactivar tu propia cuenta.';
        } else {
          this.handleError(err);
        }
      }
    });
  }

  toggleUserStatus(user: User) {
    const newStatus = !user.activo;
    const action = newStatus ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Estás seguro de ${action} a ${user.nombres} ${user.apellidos}?`)) return;
    
    this.loading = true;
    const operation = newStatus 
      ? this.usuariosService.activateUser(user.id)
      : this.usuariosService.deactivateUser(user.id);

    operation.subscribe({
      next: () => {
        this.loading = false;
        alert(`Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
        this.loadUsers(this.page);
      },
      error: (err) => {
        this.loading = false;
        console.error(`Error ${action}ndo usuario`, err);
        this.handleError(err);
      }
    });
  }

  resetPassword(id: string, userName: string) {
    const newPassword = prompt(`Ingrese la nueva contraseña para ${userName}:`);
    if (!newPassword || newPassword.trim().length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.loading = true;
    this.usuariosService.changePassword(id, newPassword).subscribe({
      next: () => {
        this.loading = false;
        alert('Contraseña actualizada exitosamente');
      },
      error: (err) => {
        this.loading = false;
        console.error('Error cambiando contraseña', err);
        this.handleError(err);
      }
    });
  }
}
