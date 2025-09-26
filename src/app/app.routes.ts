import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Pacientes } from './components/pacientes/pacientes';
import { Usuarios } from './components/usuarios/usuarios';
import { Citas } from './components/citas/citas';
import { HistoriasClinicas } from './components/historias-clinicas/historias-clinicas';
import { Configuracion } from './components/configuracion/configuracion';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: Login, title: 'Login' },
    { path: 'dashboard', component: Dashboard, title: 'Dashboard' },
    { path: 'pacientes', component: Pacientes, title: 'Pacientes' },
    { path: 'usuarios', component: Usuarios, title: 'Usuarios' },
    { path: 'citas', component: Citas, title: 'Citas' },
    { path: 'historias-clinicas', component: HistoriasClinicas, title: 'Historias Clínicas' },
    { path: 'configuracion', component: Configuracion, title: 'Configuración' }
];
