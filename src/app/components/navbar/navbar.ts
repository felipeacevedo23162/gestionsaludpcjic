// navbar.component.ts
import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  mobileSidebarActive = false;

  toggleSidebar() {
    this.mobileSidebarActive = true;
    document.body.style.overflow = 'hidden';
  }

  closeSidebar() {
    this.mobileSidebarActive = false;
    document.body.style.overflow = '';
  }

  // Cierra el sidebar si se hace resize a escritorio
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth >= 768) {
      this.closeSidebar();
    }
  }
}