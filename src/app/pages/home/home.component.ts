import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Usuario } from '../../models/usuario.model';
import { AuthService } from '../../services/auth.service';
import { AgendarCitaComponent } from '../agendar-cita/agendar-cita.component';
import { Subscription } from 'rxjs';
import { Clinica } from '../../models/clinica.model';
import { ClinicaService } from '../../services/clinica.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { ImagenPipe } from '../../pipes/imagen-pipe.pipe';
import { Title, Meta } from '@angular/platform-browser';

declare var bootstrap: any;
@Component({
  selector: 'app-home',
  imports: [
    AgendarCitaComponent,
    HeaderComponent,
    ImagenPipe
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
  private metaService = inject(Meta);

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
          this.establecerSeoCardPremium(consultorio);
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

  /**
   * Configura las Metaetiquetas Open Graph (Facebook/Instagram/WhatsApp) y Twitter Cards
   * basándose en la identidad única del médico dueño de la URL.
   */
  private establecerSeoCardPremium(medico: any) {
    const nombreDoctor = medico.nombre || 'Especialista';
    const especialidad = medico.speciality?.nombre || 'Médico Especialista';
    const ciudad = medico.ciudad || 'Caracas';
    
    // Título dinámico para la pestaña del navegador: "Dra. Belén Silvestri - Gastroenterólogo | Klyntic"
    const tituloCompleto = `${nombreDoctor} - ${especialidad} | Klyntic Express`;
    this.titleService.setTitle(tituloCompleto);

    // Descripción comercial atractiva para el snippet de Google y WhatsApp
    const descripcionComercial = `Solicita tu cita médica en línea con el especialista ${nombreDoctor} (${especialidad}) en ${ciudad}. Gestión segura a través de Klyntic Express.`;

    // 🍏 Inyección Masiva de Metaetiquetas en el HTML en caliente
    this.metaService.addTags([
      { name: 'description', content: descripcionComercial },
      { name: 'robots', content: 'index, follow' }, // Le dice a Google que sí indexe este subdominio

      // 🌐 METAETIQUETAS OPEN GRAPH (Para que WhatsApp e Instagram pinten una tarjeta hermosa)
      { property: 'og:title', content: tituloCompleto },
      { property: 'og:description', content: descripcionComercial },
      { property: 'og:type', content: 'profile' },
      { property: 'og:url', content: window.location.href },
      // Foto de perfil real del médico guardada en MongoDB (Aparecerá la miniatura en WhatsApp)
      { property: 'og:image', content: medico.img_logo || 'https://klyntic.com/assets/images/logoklyntic.png' },
      { property: 'og:site_name', content: 'Klyntic Express' },

      // 🐦 TWITTER CARDS
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: tituloCompleto },
      { name: 'twitter:description', content: descripcionComercial },
      { name: 'twitter:image', content: medico.img_logo || 'https://klyntic.com/assets/images/logoklyntic.png' }
    ]);
  }


}

