import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { ToastrService } from 'ngx-toastr';
import { DoctorAddress } from '../../models/DoctorAddress.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { DoctorService } from '../../services/doctor.service';
import { LoadingComponent } from '../../shared/loading/loading.component';

@Component({
  selector: 'app-agendar-cita',
  templateUrl: './agendar-cita.component.html',
  styleUrls: ['./agendar-cita.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LoadingComponent
  ],
  standalone: true
})
export class AgendarCitaComponent implements OnInit, OnChanges {

  @Input() consultorio: any;
  public selectedValue!: string;

  valid_form_success: boolean = false;
  public text_validation: string = '';
  public text_success: string = '';

  // Variables para controlar estados de la vista Express
  cargando: boolean = false;
  visible: boolean = false;
  animandoCierre: boolean = false;

  hours: any;
  hour: any;
  specialities: any;
  speciality_id: any;
  specilityie_id: any;
  date_appointment: any;
  speciality: any;


  // Modelos de datos del médico y cita
  DOCTORS: any = [];
  DOCTOR: any = [];
  DOCTOR_SELECTED: any;
  DOCTOR_Det_SELECTED: any;
  selecteDoc: boolean = false;

  selected_segment_hour: any;
  addresses?: DoctorAddress;
  segments: any;

  // 📦 COLECCIÓN MAESTRA PARA HORARIOS REALES (Provenientes del FlatMap de Laravel)
  public scheduleSelecteds: any[] = [];
  public cargandoAgenda: boolean = false;


  // Formulario Reactivo Express para Captura y Pre-Registro Silencioso
  public pasoActual: number = 1;
  public expressPatientForm!: FormGroup;


  constructor(
    public appointmentService: AppointmentService,
    public doctorService: DoctorService,
    public router: Router,
    public activatedRoute: ActivatedRoute,
    public toastr: ToastrService,
  ) { }

  ngOnInit(): void {
    window.scrollTo(0, 0); // [1]

    // 1. Inicialización pura del formulario reactivo para el Paso 2
    this.expressPatientForm = new FormGroup({
      nombre: new FormControl('', [Validators.required, Validators.minLength(2)]),
      apellido: new FormControl('', [Validators.required, Validators.minLength(2)]),
      n_doc: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{5,10}\$')]),
      phone: new FormControl('', [Validators.required])
    });
    this.appointmentService.listConfig().subscribe((resp: any) => {
      this.hours = resp.hours; // 👈 El select del HTML intenta recorrer esta variable

    });

  }
  /**
   * 🔥 EL MOTOR REACTIVO: Captura el instante exacto en que 'consultorioSelected' 
   * deja de ser null en el padre y se llena con los datos del CRM.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Verificamos si la propiedad 'consultorio' sufrió un cambio y ya posee un valor real
    if (changes['consultorio'] && changes['consultorio'].currentValue) {
      const datosNuevos = changes['consultorio'].currentValue;

      // Evaluamos si ya contiene el user_id numérico de Laravel (ej: 9)
      if (datosNuevos && datosNuevos.user_id) {
        console.log(`📡 [ngOnChanges] ¡Llegó la data del CRM! Conectando a Laravel Core para el Médico ID: ${datosNuevos.user_id}`);
        this.DOCTOR_SELECTED = datosNuevos.user_id
        // Ejecutamos la consulta pasándole el ID en caliente de forma segura
        this.cargarAgendaRealDeLaravel();
        // this.filtroDoctor();
      } else {
        console.warn('⚠️ Se recibió el objeto consultorio del CRM, pero el campo user_id está ausente o vacío.');
      }
    }
  }

  /**
   * Consume de forma directa la función 'profile(\$id)' que programamos en tu Laravel
   * para rellenar la grilla del Paso 1 con los bloques legítimos de Supabase
   */
  cargarAgendaRealDeLaravel() {
    this.cargandoAgenda = true;

    this.doctorService.showDoctorProfile(this.DOCTOR_SELECTED).subscribe({
      next: (resp: any) => {
        console.log(resp)
        this.DOCTOR = resp.doctor;
        this.cargandoAgenda = false;
        console.log(`🎉 Agenda del Core vinculada con éxito. ${this.scheduleSelecteds.length} segmentos horarios listos.`);
      },
      error: (err) => {
        console.error('❌ Error crítico al descargar el perfil de agenda desde Laravel:', err);
        this.cargandoAgenda = false;
        this.toastr.error('No se pudo sincronizar la agenda real del especialista.');
      }
    });
  }

  irAlPaso(paso: number) {
    this.text_validation = '';

    if (paso === 2) {
      // Validación estricta del Paso 1 antes de dejarlo avanzar
      if (!this.date_appointment || !this.selected_segment_hour) {
        this.text_validation = "Debes seleccionar la fecha y una hora válida para continuar.";
        this.toastr.warning(this.text_validation);
        return;
      }
    }

    this.pasoActual = paso;
  }

  getPrice() {
    this.appointmentService.showSpeciality(this.specilityie_id).subscribe((resp: any) => {
      this.speciality = resp;
    });
  }

  selecSegment(SEGMENT: any) {
    this.selected_segment_hour = SEGMENT;
  }

  filtroDoctor() {
    const data = {
      date_appointment: this.date_appointment,
      hour: this.hour,
      speciality_id: this.speciality_id
    }

    console.log(`📡 [Filtro Directo] Consultando con ID: ${this.DOCTOR_SELECTED}`);

    this.appointmentService.lisFiterByDoctor(data, this.DOCTOR_SELECTED).subscribe((resp: any) => {
      console.log('📦 Respuesta cruda de Laravel:', resp);

      if (resp.message === 403 || !resp.doctor || resp.doctor.length === 0) {
        this.text_validation = resp.message_text;
        this.toastr.warning(this.text_validation);
        this.segments = [];
      } else {
        this.DOCTOR = resp.doctor;

        // Extraemos todos los segmentos que devolvió el servidor para el día
        let todosLosSegmentos = [];
        if (resp.doctor && Array.isArray(resp.doctor.segments)) {
          todosLosSegmentos = resp.doctor.segments;
        } else if (Array.isArray(resp.doctor)) {
          todosLosSegmentos = resp.doctor;
        } else {
          todosLosSegmentos = resp.segments || [];
        }

        // 🔥 EL FILTRO DE AGRUPACIÓN IDÉNTICO AL OTRO COMPONENTE:
        // Si el paciente seleccionó una hora en el select de arriba (this.hour), 
        // filtramos el arreglo en caliente para dejar SOLO los segmentos que pertenezcan a ese bloque.
        // Mapeamos contra 'hour_id' o 'doctor_schedule_hour_id' según tu Mongoose/Postgres
        if (this.hour) {
          this.segments = todosLosSegmentos.filter((seg: any) => {
            return seg.hour_id == this.hour ||
              seg.doctor_schedule_hour_id == this.hour ||
              (seg.format_segment && seg.format_segment.hour_id == this.hour);
          });
          console.log(`🎯 [Grupo Filtrado] Mostrando solo el grupo de la hora ID: ${this.hour}. Total: ${this.segments.length}`);
        } else {
          // Si no ha seleccionado ninguna hora arriba, las muestra todas por defecto
          this.segments = todosLosSegmentos;
        }

        // Si el filtro por grupo dejó la lista vacía, avisamos de forma sutil
        if (this.segments.length === 0 && this.hour) {
          this.toastr.info('No hay turnos libres específicos para el rango horario seleccionado.');
        }
      }
    });
  }




  // ⚡ GUARDADO EXPRESS: Registra en la central Klyntic y detona WhatsApp
  saveExpress() {
    this.text_validation = '';

    if (this.expressPatientForm.invalid) {
      this.text_validation = "Por favor, completa correctamente todos tus datos personales.";
      this.toastr.warning(this.text_validation);
      return;
    }

    this.cargando = true;

    // 🔒 VINCULACIÓN MAESTRA CON EL TENANT: Extraemos datos del @Input() consultorio
    const dataExpress = {
      // Si el CRM tiene el ID de Laravel, úsalo; si no, enviamos el del CRM o el fallback requerido
      doctor_id: this.consultorio?.user_id || this.consultorio?._id || 3,
      speciality_id: this.DOCTOR.speciality.id,
      date_appointment: this.date_appointment,
      doctor_schedule_join_hour_id: this.selected_segment_hour.id,
      amount: this.DOCTOR.precio_cita || 0, // Usamos el precio de la especialidad consultada
      status_pay: 2,
      status: 1,

      // Datos personales separados capturados del formulario reactivo
      name: this.expressPatientForm.get('nombre')?.value,
      surname: this.expressPatientForm.get('apellido')?.value,
      n_doc: this.expressPatientForm.get('n_doc')?.value,
      phone: this.expressPatientForm.get('phone')?.value,
      email: `${this.expressPatientForm.get('n_doc')?.value}@klyntic.express`
    };

    this.appointmentService.storeAppointmentExpress(dataExpress).subscribe({
      next: (resp: any) => {
        this.toastr.success('¡Solicitud enviada a la central con éxito!');
        this.cargando = false;
        this.cerrarOffcanvas();
        this.enviarNotificacionWhatsApp(dataExpress);
      },
      error: (err) => {
        this.cargando = false;
        this.toastr.error('Ocurrió un error al procesar la reserva.');
      }
    });
  }

  private enviarNotificacionWhatsApp(data: any) {
    const mensaje = encodeURIComponent(
      `✨ *SOLICITUD DE CITA - KLYNTIC EXPRESS* ✨\n\n` +
      `👋 Hola, un saludo. Acabo de solicitar una cita médica desde el perfil web:\n\n` +
      `👤 *Paciente:* ${data.name} ${data.surname}\n` +
      `🪪 *Cédula:* ${data.n_doc}\n` +
      `📞 *WhatsApp:* ${data.phone}\n\n` +
      `🗓️ *Fecha Solicitada:* ${data.date_appointment}\n` +
      `⏰ *Estatus:* Pendiente por confirmación de disponibilidad\n\n` +
      `🚀 _Quedo atento a su respuesta para agendar formalmente._`
    );

    // 📞 CONEXIÓN CON EL TELÉFONO DE MONGO: Le enviamos el mensaje al WhatsApp del médico dueño del subdominio
    const numeroDestino = this.consultorio?.phone || "584120000000";

    // Corregida la interpolación de la URL de WhatsApp wa.me/
    // window.open(`https://wa.me{numeroDestino}?text=${mensaje}`, '_blank');

    const url = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');

    
  }


  cancel() {
    // 🚀 ASIGNAMOS NULL PARA FORZAR EL RESET VISUAL DEL INPUT FECHA
    this.date_appointment = null;
    this.hour = null;

    if (this.selected_segment_hour) {
      this.selected_segment_hour = null;
    }

    // Limpiamos los textos de errores previos si los había
    this.text_validation = '';

    // Reseteamos el formulario reactivo del Paso 2
    if (this.expressPatientForm) {
      this.expressPatientForm.reset();
    }
    // Regresamos el asistente al primer paso obligatoriamente
    this.pasoActual = 1;
  }


  abrirOffcanvas(idDeLaEspecialidad: string) {
    this.specilityie_id = idDeLaEspecialidad;
    this.visible = true;
    this.getPrice();
  }

  cerrarOffcanvas() {
    this.visible = false;
    this.animandoCierre = true;
    this.cancel();
    setTimeout(() => {
      this.animandoCierre = false;
      this.specilityie_id = '';
      this.speciality = null;
      this.DOCTORS = null;
      this.DOCTOR_Det_SELECTED = null;
      this.DOCTOR_SELECTED = null;
    }, 350);
  }
}
