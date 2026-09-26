import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AgendarCitaComponent } from '../agendar-cita/agendar-cita.component';
import { Subscription, switchMap, map } from 'rxjs'; 
import { ClinicaService } from '../../services/clinica.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { ImagenPipe } from '../../pipes/imagen-pipe.pipe';
import { Title, Meta } from '@angular/platform-browser';
import { DoctorService } from '../../services/doctor.service';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service'; // 👈 INYECTADO PARA EL SELECTOR APPLE

// 🚀 IMPORTACIÓN SIMULADA DEL COMPONENTE SELECTOR (Asegúrate de que la ruta sea correcta en tu carpeta)
import { SelectorAppleComponent } from '../selector-apple/selector-apple.component'; 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    AgendarCitaComponent,
    HeaderComponent,
    ImagenPipe,
    LoadingComponent,
    SelectorAppleComponent 
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {

  @Output() msm_success: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() msm_success_value: boolean = false;

  user!: any;
  isLoading = false;
  isVisible = false;
  
  // Variables de control de estados
  doctorSelected: any = null; // Inicia en null para las clínicas multi-médico
  doctorId: any;
  locations: any;
  paymentMetods: any;
  consultorioSelected: any | null = null; 
  
  // Lista de especialidades mapeadas para el selector de la clínica
  especialidadesEnterprise: any[] = [];

  private consultorioSubscription!: Subscription;

  // Inyección de dependencias nativa de Angular
  private authService = inject(AuthService);
  private clinicaService = inject(ClinicaService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private doctorService = inject(DoctorService);
  private appointmentService = inject(AppointmentService); // 👈 MOTOR UNIFICADO DE CITAS

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
          
          // =========================================================================
          // 🏢 CAMBIO 1: INTERCEPCIÓN ENTORNO CLINICA ENTERPRISE (LA DOCTORA)
          // =========================================================================
          if (consultorio?.tipoClinica?.toLowerCase() === 'clinica') {
            console.log('🏢 [Modo Enterprise Validado]: Activando pasarela del Selector Apple.');
            this.doctorId = null;
            
            return this.appointmentService.getSelectorEspecialistas().pipe(
              map((respSelector: any) => {
                return { 
                  consultorio, 
                  isEnterprise: true, 
                  results: respSelector?.results || [] 
                };
              })
            );
          }

          // =========================================================================
          // 🟢 FLUJO TRADICIONAL (MÉDICO INDEPENDIENTE - DR. JOAQUÍN PÁEZ)
          // =========================================================================
          let rawId = consultorio?.user_id;
          if (rawId) {
            const idLimpioString = String(rawId).replace(/[^0-9]/g, '');
            this.doctorId = parseInt(idLimpioString, 10); 
          } else {
            this.doctorId = null;
          }

          if (!this.doctorId || isNaN(this.doctorId)) {
            throw new Error(`El consultorio no tiene un user_id válido asignado en el CRM: ${rawId}`);
          }
          
          this.getTiposPago();

          return this.doctorService.showDoctorProfile(this.doctorId).pipe(
            switchMap((perfilDoctor: any) => {
              return this.doctorService.getAddressesByDoctor(this.doctorId).pipe(
                map((respLocaciones: any) => {
                  return { 
                    consultorio, 
                    isEnterprise: false,
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
        next: (resultado: any) => {
          
          // 🏢 CAMBIO 2: Si es entorno clínico, guardamos los especialistas y apagamos el loading
          if (resultado?.isEnterprise) {
            this.especialidadesEnterprise = resultado.results;
            this.isLoading = false;
            console.log(`✅ Catálogo Enterprise cargado para la clínica: ${slugConsultorio}`);
            return;
          }

          // Asignación tradicional e intacta para Consultorio Pro
          const { consultorio, perfilDoctor, direcciones } = resultado;
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
          console.log(`✅ Datos de Home cargados para Consultorio Independiente: ${slugConsultorio}`);
        },
        error: (err) => {
          console.error('❌ Error en el flujo de carga del Home:', err);
          this.isLoading = false;
        }
      });
  }

  getTiposPago(){
    this.doctorService.getPaymentMetodhByDoctor(this.doctorId).subscribe((resp:any)=>{
      this.paymentMetods = resp.tiposdepagos;
    })
  }

  // =========================================================================
  //  CAMBIO 3: NUEVA FUNCIÓN DISPARADORA ENTERPRISE
  // =========================================================================
  /**
   * Se ejecuta cuando el paciente toca un médico en el componente SelectorApple.
   * Descarga la agenda de Supabase del doctor elegido y enciende la interfaz de reserva.
   */
  recibirDoctorDeSelector(medicoSeleccionado: any) {
    this.isLoading = true;
    this.doctorId = medicoSeleccionado.id;
    
    // Consultamos el perfil completo y locaciones a Laravel en MAMP
    this.doctorService.showDoctorProfile(this.doctorId).pipe(
      switchMap((perfilDoctor: any) => {
        return this.doctorService.getAddressesByDoctor(this.doctorId).pipe(
          map((respLocaciones: any) => {
            return { perfilDoctor, direcciones: respLocaciones?.addresses };
          })
        );
      })
    ).subscribe({
      next: ({ perfilDoctor, direcciones }) => {
        this.doctorSelected = perfilDoctor;
        this.locations = direcciones;
        
        // Seteamos el user_id en caliente para activar el ngOnChanges() del calendario hijo
        this.consultorioSelected.user_id = this.doctorId;
        
        this.getTiposPago();
        this.establecerSeoCardPremium(this.consultorioSelected, perfilDoctor);
        this.isLoading = false;
        console.log(`🚀 [Instagram Flow] Agenda activa para: ${perfilDoctor?.full_name}`);
      },
      error: (err) => {
        console.error('Error vinculando la agenda del doctor seleccionado:', err);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.consultorioSubscription) {
      this.consultorioSubscription.unsubscribe();
    }
  }

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


  volverAlSelectorDeEspecialistas() {
    this.isLoading = true;
    
    // 1. Limpiamos las variables de estado que amarraban al doctor
    this.doctorSelected = null;
    this.locations = [];
    this.paymentMetods = [];
    
    // 2. Apagamos el ID para restaurar el flujo en blanco
    this.doctorId = null;
    if (this.consultorioSelected) {
      this.consultorioSelected.user_id = null;
    }

    this.isLoading = false;
    console.log('↩️ [Enterprise Flow]: El paciente regresó al catálogo estilo Apple.');
  }
}