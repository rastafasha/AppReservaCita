import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Usuario } from '../../models/usuario.model';
import { AuthService } from '../../services/auth.service';
import { AgendarCitaComponent } from '../agendar-cita/agendar-cita.component';
import { Subscription, switchMap, map } from 'rxjs'; // 👈 Asegúrate de importar switchMap y map
import { Clinica } from '../../models/clinica.model';
import { ClinicaService } from '../../services/clinica.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { ImagenPipe } from '../../pipes/imagen-pipe.pipe';
import { Title, Meta } from '@angular/platform-browser';
import { DoctorService } from '../../services/doctor.service';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { CommonModule } from '@angular/common';
import { DoctorAddress } from '../../models/DoctorAddress.model';

declare var bootstrap: any;
@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    AgendarCitaComponent,
    HeaderComponent,
    ImagenPipe,
    LoadingComponent,
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
  doctorSelected: any;
  doctorId: any;
  locations: any;
  
  consultorioSelected: any | null = null; 
  private consultorioSubscription!: Subscription;

  private authService = inject(AuthService);
  private clinicaService = inject(ClinicaService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private doctorService = inject(DoctorService);

  ngOnInit() {
    this.isLoading = true;
    this.user = this.authService.getLocalStorage();
    this.cargarDatosHome(); // 👈 Cambiamos el nombre al método principal unificado
  }

  private cargarDatosHome() {
    this.isLoading = true;
    const slugConsultorio = this.clinicaService.obtenerSlugDeUrl();

    // Enadenamos las peticiones de forma reactiva con RxJS
    this.consultorioSubscription = this.clinicaService.getClinicaBySlugCached(slugConsultorio)
      .pipe(
        switchMap((consultorio: any) => {
          this.consultorioSelected = consultorio;
          this.doctorId = consultorio?.user_id;
          this.getlocaciones();
          // Si hay consultorio, disparamos la búsqueda del perfil del doctor pasándole el objeto consultorio
          return this.doctorService.showDoctorProfile(this.doctorId).pipe(
            map((perfilDoctor: any) => {
              return { consultorio, perfilDoctor }; // Retornamos ambos objetos unificados
            })
          );
          
        })
      )
      .subscribe({
        next: ({ consultorio, perfilDoctor }) => {
          this.doctorSelected = perfilDoctor;
          console.log(this.doctorSelected)

          if (consultorio) {
            // 🎨 INTERPOLACIÓN Y CONTROL DE DISEÑO SAAS INTACTO
            const estiloPrevio = document.getElementById('css-dinamico-consultorio');
            if (estiloPrevio) estiloPrevio.remove();

            if (consultorio.css_personalizado) {
              const estilo = document.createElement('style');
              estilo.id = 'css-dinamico-consultorio'; 
              estilo.innerHTML = consultorio.css_personalizado;
              document.head.appendChild(estilo);
            }

            // 🔥 LLAMADA UNIFICADA: Enviamos ambos objetos a la función SEO
            this.establecerSeoCardPremium(consultorio, perfilDoctor);
          }

          this.isLoading = false;
          console.log(`✅ Datos de Home cargados con éxito para: ${slugConsultorio}`);
        },
        error: (err) => {
          console.error('❌ Error en el flujo de carga del Home:', err);
          this.isLoading = false;
        }
      });
  }

  

  ngOnDestroy() {
    if (this.consultorioSubscription) {
      this.consultorioSubscription.unsubscribe();
    }
  }

  getlocaciones(){
    this.doctorService.getAddressesByDoctor(this.doctorId ).subscribe((resp:any)=>{
      
      this.locations = resp.addresses
    })
  }

  /**
   * Configura las Metaetiquetas recibiendo de forma independiente el consultorio y el perfil del doctor
   */
  private establecerSeoCardPremium(consultorio: any, perfilDoctor: any) {
    // Tomamos propiedades específicas de cada objeto según corresponda
    const nombreDoctor = perfilDoctor?.full_name || consultorio?.name ;
    const especialidad = perfilDoctor?.doctor?.speciality?.name ;
    const ciudad = consultorio?.ciudad;
    
    const tituloCompleto = `${nombreDoctor} - ${especialidad} | Klyntic Express`;
    this.titleService.setTitle(tituloCompleto);

    const descripcionComercial = `Solicita tu cita médica en línea con el especialista ${nombreDoctor} (${especialidad}) en ${ciudad}. Gestión segura a través de Klyntic Express.`;

    // Limpiamos tags antiguos para evitar duplicados si cambia de ruta
    this.metaService.removeTag("name='description'");

    this.metaService.addTags([
      { name: 'description', content: descripcionComercial },
      { name: 'robots', content: 'index, follow' }, 

      { property: 'og:title', content: tituloCompleto },
      { property: 'og:description', content: descripcionComercial },
      { property: 'og:type', content: 'profile' },
      { property: 'og:url', content: window.location.href },
      // Prioriza el logo del perfil o el de la clínica por defecto
      { property: 'og:image', content: perfilDoctor?.img_logo || consultorio?.img_logo || 'https://klyntic.com' },
      { property: 'og:site_name', content: 'Klyntic Express' },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: tituloCompleto },
      { name: 'twitter:description', content: descripcionComercial },
      { name: 'twitter:image', content: perfilDoctor?.img_logo || consultorio?.img_logo || 'https://klyntic.com' }
    ]);
  }
}
