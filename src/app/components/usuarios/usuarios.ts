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
  selectedRole: number | null = null;
  selectedStatus: boolean | null = null;
  page = 1;
  limit = 10;
  total = 0;
  errorMessage = '';
  showRetry = false;
  showModal = false;
  showViewModal = false;
  showEditModal = false;
  newUser: Partial<User> = {};
  selectedUser: User | null = null;
  editingUser: Partial<User> = {};

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

  clearFilters() {
    this.searchQuery = '';
    this.selectedRole = null;
    this.selectedStatus = null;
    this.page = 1;
    this.loadUsers(1);
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
    console.log('👁️ Abriendo modal Ver usuario:', id);
    this.loading = true;
    this.cdr.detectChanges();
    
    this.usuariosService.getUserById(id).subscribe({
      next: (response) => {
        console.log('✅ Usuario cargado para ver:', response);
        this.selectedUser = response.data;
        this.showViewModal = true;
        this.loading = false;
        document.body.style.overflow = 'hidden';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando usuario:', err);
        this.loading = false;
        this.handleError(err);
        this.cdr.detectChanges();
      }
    });
  }

  editUser(id: string) {
    console.log('✏️ Abriendo modal Editar usuario:', id);
    this.loading = true;
    this.cdr.detectChanges();
    
    this.usuariosService.getUserById(id).subscribe({
      next: (response) => {
        console.log('✅ Usuario cargado para editar:', response);
        this.editingUser = { ...response.data };
        // No incluir contraseña en edición
        delete this.editingUser.contrasena;
        this.showEditModal = true;
        this.loading = false;
        document.body.style.overflow = 'hidden';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando usuario:', err);
        this.loading = false;
        this.handleError(err);
        this.cdr.detectChanges();
      }
    });
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

  openNewUserModal() {
    this.newUser = {};
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.showModal = false;
    this.newUser = {};
    document.body.style.overflow = '';
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedUser = null;
    document.body.style.overflow = '';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingUser = {};
    document.body.style.overflow = '';
  }

  saveUser() {
    // Validar campos requeridos
    if (!this.newUser.documento || !this.newUser.nombres || !this.newUser.apellidos || !this.newUser.contrasena || !this.newUser.rol_id) {
      this.errorMessage = 'Por favor completa todos los campos requeridos (documento, nombres, apellidos, contraseña y rol)';
      return;
    }

    // Validar longitud de contraseña
    if (this.newUser.contrasena.length < 8) {
      this.errorMessage = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    // Validar complejidad de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(this.newUser.contrasena)) {
      this.errorMessage = 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales (@$!%*?&)';
      return;
    }

    // Asegurar valores por defecto
    const userData = {
      ...this.newUser,
      tipo_documento_id: this.newUser.tipo_documento_id || 1,
      activo: this.newUser.activo !== undefined ? this.newUser.activo : true,
      fecha_nacimiento: this.newUser.fecha_nacimiento || null
    };

    this.loading = true;
    this.usuariosService.createUser(userData).subscribe({
      next: () => {
        this.loading = false;
        this.closeModal();
        alert('Usuario creado exitosamente');
        this.loadUsers(1);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error creando usuario', err);
        console.error('Detalles del error:', err.error);
        this.handleError(err);
      }
    });
  }

  updateUser() {
    if (!this.editingUser.id || !this.editingUser.documento || !this.editingUser.nombres || !this.editingUser.apellidos) {
      this.errorMessage = 'Por favor completa los campos requeridos';
      return;
    }

    this.loading = true;
    this.usuariosService.updateUser(this.editingUser.id, this.editingUser).subscribe({
      next: () => {
        this.loading = false;
        this.closeEditModal();
        this.loadUsers(this.page);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error actualizando usuario', err);
        this.handleError(err);
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
