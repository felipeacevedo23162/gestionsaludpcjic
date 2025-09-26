import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true, // muy importante si es standalone
  imports: [CommonModule, FormsModule], // acá habilitás ngIf y ngModel
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  loginData = {
    documento: '',
    contrasena: ''
  };

  onSubmit() {
    console.log('Datos de login:', this.loginData);
  }
}
