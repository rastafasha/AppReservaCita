import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Usuario } from '../../models/usuario.model';
import { AuthService } from '../../services/auth.service';
import { AgendarCitaComponent } from '../agendar-cita/agendar-cita.component';
import { Subscription } from 'rxjs';
import { Clinica } from '../../models/clinica.model';
import { Title } from '@angular/platform-browser';
import { ClinicaService } from '../../services/clinica.service';
import { HeaderComponent } from '../../shared/header/header.component';
declare var bootstrap: any;
@Component({
  selector: 'app-home',
  imports: [
    AgendarCitaComponent,
    HeaderComponent
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
  
  // Guardará la información del consultorio/clínica resuelta por el CRM
  consultorioSelected: any | null = null; 
  private consultorioSubscription!: Subscription;

  // Inyecciones de dependencias con sintaxis inject()
  private authService = inject(AuthService);
  private clinicaService = inject(ClinicaService);
  private titleService = inject(Title);

  ngOnInit() {
    this.isLoading = true;
    this.user = this.authService.getLocalStorage();
    this.cargarDatosConsultorioPorSubdominio();
  }

  private cargarDatosConsultorioPorSubdominio() {
    this.isLoading = true;

    // 1. Extraemos el slug utilizando el método unificado del servicio
    const slugConsultorio = this.clinicaService.obtenerSlugDeUrl();

    // 2. Consumimos el endpoint del CRM (Node.js/Mongo) con la estrategia de caché
    this.consultorioSubscription = this.clinicaService.getClinicaBySlugCached(slugConsultorio).subscribe({
      next: (consultorio: any) => {
        this.consultorioSelected = consultorio;

        if (consultorio) {
          // Asignamos el título dinámico en el navegador con el nombre del médico o clínica
          this.titleService.setTitle(`Klyntic | ${consultorio.nombre}`);

          // 🎨 INTERPOLACIÓN Y CONTROL DE DISEÑO SAAS INTACTO
          // Si el doctor definió estilos CSS específicos en el CRM, los inyectamos en el DOM
          const estiloPrevio = document.getElementById('css-dinamico-consultorio');
          if (estiloPrevio) estiloPrevio.remove();

          if (consultorio.css_personalizado) {
            const estilo = document.createElement('style');
            estilo.id = 'css-dinamico-consultorio'; 
            estilo.innerHTML = consultorio.css_personalizado;
            document.head.appendChild(estilo);
          }
        }

        this.isLoading = false;
        console.log(`✅ Consultorio Médico cargado de forma dinámica: ${slugConsultorio}`);
      },
      error: (err) => {
        console.error('❌ Error al obtener el consultorio por subdominio en el CRM:', err);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    // Desuscripción higiénica para evitar fugas de memoria (Memory Leaks)
    if (this.consultorioSubscription) {
      this.consultorioSubscription.unsubscribe();
    }
  }


}

