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
import { AppointmentService } from '../../services/appointment.service';
import { SelectorAppleComponent } from '../selector-apple/selector-apple.component';

@Component({
  selector: 'app-home-clinica',
  standalone: true,
  imports: [
    CommonModule,
    AgendarCitaComponent,
    HeaderComponent,
    ImagenPipe,
    LoadingComponent,
    SelectorAppleComponent
  ],
  templateUrl: './home-clinica.component.html',
  styleUrl: './home-clinica.component.scss'
})
export class HomeClinicaComponent implements OnInit, OnDestroy {

  @Output() msm_success: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() msm_success_value: boolean = false;

  user!: any;
  isLoading = false;
  isVisible = false;

  // Control de fases: Inicia en null para obligar a pasar por el catálogo Apple
  doctorSelected: any = null;
  doctorId: any;
  locations: any;
  paymentMetods: any;
  consultorioSelected: any | null = null;

  especialidadesEnterprise: any[] = [];
  private consultorioSubscription!: Subscription;

  private authService = inject(AuthService);
  private clinicaService = inject(ClinicaService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private doctorService = inject(DoctorService);
  private appointmentService = inject(AppointmentService);

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


          if (consultorio?.tipoClinica?.toLowerCase() === 'clinica') {
            return this.appointmentService.getSelectorEspecialistas().pipe(
              map((respSelector: any) => {

                return {
                  consultorio,
                  isEnterprise: true,
                  metaSettings: respSelector?.clinica, // 👈 Captura los datos de Settingeneral enviados por Laravel
                  idRelacionalLaravel: respSelector?.tenant, // 👈 1. CAPTURAMOS EL 'tenant' (ID numérico de Laravel)
                  results: respSelector?.results || []
                };
              })
            );
          }

          return this.doctorService.showDoctorProfile(consultorio?.user_id).pipe(map(perf => ({ consultorio, isEnterprise: false, perf })));
        })
      )
      .subscribe({
        next: (resultado: any) => {
          if (resultado?.isEnterprise) {
            this.especialidadesEnterprise = resultado.results;
            // 🔥 ASIGNAMOS EL ID DE LARAVEL: Rellenamos el hueco que Node.js dejó vacío
            this.consultorioSelected.id = resultado.idRelacionalLaravel; 

            // 🚀 PARCHADO EN CALIENTE: Consolidamos la data de Settingeneral sobre el objeto de la vista
            if (this.consultorioSelected && resultado.metaSettings) {
              this.consultorioSelected.name = resultado.metaSettings.name;
              this.consultorioSelected.ciudad = resultado.metaSettings.address; // Mapea a tus interpolaciones existentes
              this.consultorioSelected.phone = resultado.metaSettings.phone;
              this.consultorioSelected.moneda = resultado.metaSettings.moneda;
            }

            this.isLoading = false;
            console.log(`✅ Datos de Settingeneral e Inyección consolidada exitosamente.`);
            return;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error unificando metadatos:', err);
          this.isLoading = false;
        }
      });
  }

  getTiposPago() {
    this.doctorService.getPaymentMetodhByDoctor(this.doctorId).subscribe((resp: any) => {
      this.paymentMetods = resp.tiposdepagos;
    })
  }

  getHorarioConsolidado(scheduleSelecteds: any[]): any[] {
    if (!scheduleSelecteds || scheduleSelecteds.length === 0) return [];

    // Mapa para agrupar los bloques crudos por cada día de la semana
    const bloquesPorDia: { [key: string]: { start: string; end: string }[] } = {};

    scheduleSelecteds.forEach(slot => {
      // Saltamos los registros inconsistentes o duplicaciones huérfanas en desarrollo local
      if (!slot.day_name || !slot.item) return;

      const dia = slot.day_name;
      const inicio = slot.item.hour_start.slice(0, 5); // Cortamos a "HH:MM"
      const fin = slot.item.hour_end.slice(0, 5);

      if (!bloquesPorDia[dia]) {
        bloquesPorDia[dia] = [];
      }
      bloquesPorDia[dia].push({ start: inicio, end: fin });
    });

    // Procesamos cada día para calcular los rangos consolidados continuos
    return Object.keys(bloquesPorDia).map(dia => {
      const rangos = bloquesPorDia[dia];

      // Ordenamos cronológicamente por la hora de inicio por seguridad
      rangos.sort((a, b) => a.start.localeCompare(b.start));

      const rangosFusionados: string[] = [];
      let rangoActual = rangos[0];

      for (let i = 1; i < rangos.length; i++) {
        const siguienteRango = rangos[i];

        // Si el inicio del bloque siguiente coincide con el fin del actual, son consecutivos
        if (siguienteRango.start === rangoActual.end) {
          rangoActual.end = siguienteRango.end; // Extendemos el bloque continuo
        } else {
          // Guardamos el rango continuo que se interrumpió y abrimos uno nuevo
          rangosFusionados.push(`${rangoActual.start} a ${rangoActual.end}`);
          rangoActual = siguienteRango;
        }
      }
      // Guardamos el último tramo procesado
      if (rangoActual) {
        rangosFusionados.push(`${rangoActual.start} a ${rangoActual.end}`);
      }

      return {
        dia: dia,
        // Unimos los tramos por si el médico tiene turnos partidos (ej: Mañana y Tarde)
        textoRangos: rangosFusionados.join(' y ')
      };
    });
  }


  /**
   * 🎯 RECIBE LA EMISIÓN DEL HIJO: Se gatilla al hacer clic en el doctor dentro del selector Apple
   */
  recibirDoctorDeSelector(medicoSeleccionado: any) {
    this.isLoading = true; // Prende el spinner durante la descarga de la agenda
    this.doctorId = medicoSeleccionado.id;

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
        this.consultorioSelected.user_id = this.doctorId;

        this.getTiposPago();
        this.establecerSeoCardPremium(this.consultorioSelected, perfilDoctor);
        this.isLoading = false; // 🔥 Apaga el spinner: Se revela la agenda del médico con toda su info
        console.log(`🚀 [Instagram Flow] Agenda activa para: ${perfilDoctor?.full_name}`);
      },
      error: (err) => {
        console.error('Error vinculando la agenda del doctor seleccionado:', err);
        this.isLoading = false;
      }
    });
  }

  private establecerSeoCardPremium(consultorio: any, perfilDoctor: any) {
    const nombreDoctor = perfilDoctor?.full_name || consultorio?.name;
    const especialidad = perfilDoctor?.doctor?.speciality?.name;
    const ciudad = consultorio?.ciudad;

    const tituloCompleto = `${nombreDoctor} - ${especialidad} | Klyntic Express`;
    this.titleService.setTitle(tituloCompleto);

    const descripcionComercial = `Solicita tu cita médica en línea con el especialista ${nombreDoctor} (${especialidad}) en ${ciudad}. Gestión segura a través de Klyntic Express.`;

    this.metaService.removeTag("name='description'");
    this.metaService.addTags([
      { name: 'description', content: descripcionComercial },
      { property: 'og:title', content: tituloCompleto },
      { property: 'og:description', content: descripcionComercial },
      { property: 'og:image', content: perfilDoctor?.img_logo || consultorio?.img_logo || 'https://klyntic.com' }
    ]);
  }

  volverAlSelectorDeEspecialistas() {
    this.doctorSelected = null;
    this.locations = [];
    this.paymentMetods = [];
    this.doctorId = null;
    if (this.consultorioSelected) {
      this.consultorioSelected.user_id = null;
    }
  }

  ngOnDestroy() {
    if (this.consultorioSubscription) {
      this.consultorioSubscription.unsubscribe();
    }
  }
}