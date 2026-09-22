import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Usuario } from '../../models/usuario.model';
import { AuthService } from '../../services/auth.service';
import { AgendarCitaComponent } from '../agendar-cita/agendar-cita.component';
declare var bootstrap: any;
@Component({
  selector: 'app-home',
  imports: [
    AgendarCitaComponent
],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  @Output() msm_success: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() msm_success_value: boolean = false;

  user!: any;
  isLoading = false;
  isVisible = false;
  doctor!: Usuario;
  activeCategory!: string;
  categoriaPrincipal: string = 'all';


  categoriaActiva: string = '';

  private authService = inject(AuthService);


 ngOnInit() {
    this.isLoading = true;
    this.user = this.authService.getLocalStorage();
    
  }
  
abrirModalCita() {
  // Aquí puedes poner lógica previa si la deseas...
  
  const el = document.getElementById('offcanvasCita');
  const myOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(el);
  myOffcanvas.show();
}


}

