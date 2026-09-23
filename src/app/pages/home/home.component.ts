import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Usuario } from '../../models/usuario.model';
import { AuthService } from '../../services/auth.service';
import { AgendarCitaComponent } from '../agendar-cita/agendar-cita.component';
import { Subscription, switchMap, map } from 'rxjs'; 
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
    this.cargarDatosHome(); 
  }

   private cargarDatosHome() {
    this.isLoading = true;
    const slugConsultorio = this.clinicaService.obtenerSlugDeUrl();

    this.consultorioSubscription = this.clinicaService.getClinicaBySlugCached(slugConsultorio)
      .pipe(
        switchMap((consultorio: any) => {
          this.consultorioSelected = consultorio;
          
          // 1. 🔍 Extraemos el ID corrupto original (ej: "11',")
          let rawId = consultorio?.user_id;
          
          // 2. 🧽 LIMPIEZA ULTRA ESTRICTA: Forzamos a un número entero puro
          if (rawId) {
            // Removemos cualquier cosa que no sea dígito y convertimos a número entero
            const idLimpioString = String(rawId).replace(/[^0-9]/g, '');
            this.doctorId = parseInt(idLimpioString, 10); 
          } else {
            this.doctorId = null;
          }

          console.log(`Buscando datos en el Backend para el ID Limpio de Doctor: ${this.doctorId}`);

          // Si por alguna razón el ID no es válido, detenemos el flujo para no romper el backend
          if (!this.doctorId || isNaN(this.doctorId)) {
            throw new Error(`El consultorio no tiene un user_id válido asignado en el CRM: ${rawId}`);
          }

          // 3. 🌐 Ejecutamos las llamadas asíncronas con el ID numérico garantizado
          return this.doctorService.showDoctorProfile(this.doctorId).pipe(
            switchMap((perfilDoctor: any) => {
              return this.doctorService.getAddressesByDoctor(this.doctorId).pipe(
                map((respLocaciones: any) => {
                  return { 
                    consultorio, 
                    perfilDoctor, 
                    direcciones: respLocaciones?.addresses 
                  };
                })
              );
            })
          );
        })
      )
      .subscribe({
        next: ({ consultorio, perfilDoctor, direcciones }) => {
          this.doctorSelected = perfilDoctor;
          this.locations = direcciones;

          if (consultorio) {
            const estiloPrevio = document.getElementById('css-dinamico-consultorio');
            if (estiloPrevio) estiloPrevio.remove();

            if (consultorio.css_personalizado) {
              const estilo = document.createElement('style');
              estilo.id = 'css-dinamico-consultorio'; 
              estilo.innerHTML = consultorio.css_personalizado;
              document.head.appendChild(estilo);
            }

            this.establecerSeoCardPremium(consultorio, perfilDoctor);
          }

          this.isLoading = false;
          console.log(`✅ Datos de Home y Locaciones cargados con éxito para: ${slugConsultorio}`);
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

  /**
   * Configura las Metaetiquetas recibiendo de forma independiente el consultorio y el perfil del doctor
   */
  private establecerSeoCardPremium(consultorio: any, perfilDoctor: any) {
    const nombreDoctor = perfilDoctor?.full_name || consultorio?.name ;
    const especialidad = perfilDoctor?.doctor?.speciality?.name ;
    const ciudad = consultorio?.ciudad;
    
    const tituloCompleto = `${nombreDoctor} - ${especialidad} | Klyntic Express`;
    this.titleService.setTitle(tituloCompleto);

    const descripcionComercial = `Solicita tu cita médica en línea con el especialista ${nombreDoctor} (${especialidad}) en ${ciudad}. Gestión segura a través de Klyntic Express.`;

    this.metaService.removeTag("name='description'");

    this.metaService.addTags([
      { name: 'description', content: descripcionComercial },
      { name: 'robots', content: 'index, follow' }, 

      { property: 'og:title', content: tituloCompleto },
      { property: 'og:description', content: descripcionComercial },
      { property: 'og:type', content: 'profile' },
      { property: 'og:url', content: window.location.href },
      { property: 'og:image', content: perfilDoctor?.img_logo || consultorio?.img_logo || 'https://klyntic.com' },
      { property: 'og:site_name', content: 'Klyntic Express' },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: tituloCompleto },
      { name: 'twitter:description', content: descripcionComercial },
      { name: 'twitter:image', content: perfilDoctor?.img_logo || consultorio?.img_logo || 'https://klyntic.com' }
    ]);
  }
}
