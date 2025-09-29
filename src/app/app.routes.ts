import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Pacientes } from './components/pacientes/pacientes';
import { Usuarios } from './components/usuarios/usuarios';
import { Citas } from './components/citas/citas';
import { HistoriasClinicas } from './components/historias-clinicas/historias-clinicas';
import { Configuracion } from './components/configuracion/configuracion';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: Login, title: 'Login' },
    { path: 'dashboard', component: Dashboard, title: 'Dashboard', canActivate: [authGuard] },
    { path: 'pacientes', component: Pacientes, title: 'Pacientes', canActivate: [authGuard] },
    { path: 'usuarios', component: Usuarios, title: 'Usuarios', canActivate: [authGuard] },
    { path: 'citas', component: Citas, title: 'Citas', canActivate: [authGuard] },
    { path: 'historias-clinicas', component: HistoriasClinicas, title: 'Historias Clínicas', canActivate: [authGuard] },
    { path: 'configuracion', component: Configuracion, title: 'Configuración', canActivate: [authGuard] }
];
