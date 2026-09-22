import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { ToastrService } from 'ngx-toastr';
import { DoctorAddress } from '../../models/DoctorAddress.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-agendar-cita',
  templateUrl: './agendar-cita.component.html',
  styleUrls: ['./agendar-cita.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  standalone: true
})
export class AgendarCitaComponent implements OnInit {

  @Input() categoriaSelected: any;
  public selectedValue!: string;

  valid_form_success: boolean = false;
  public text_validation: string = '';
  public text_success: string = '';

  

  hours: any;
  hour: any;
  specialities: any;
  speciality_id: any;
  specilityie_id: any;
  date_appointment: any;
  speciality: any;

  // Variables para controlar estados de la vista Express
  cargando: boolean = false;
  visible: boolean = false;
  animandoCierre: boolean = false;

  // Modelos de datos del médico y cita
  DOCTORS: any = [];
  DOCTOR: any = [];
  DOCTOR_SELECTED: any;
  DOCTOR_Det_SELECTED: any;
  selecteDoc: boolean = false;

  selected_segment_hour: any;
  addresses?: DoctorAddress;
  segments: any;

  // 📝 Formulario Reactivo Express para Captura y Pre-Registro Silencioso
  public pasoActual: number = 1; // Controla la pantalla del formulario visible
public expressPatientForm!: FormGroup;

  constructor(
    public appointmentService: AppointmentService,
    public router: Router,
    public activatedRoute: ActivatedRoute,
    public toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0); // [1]

  // Inicialización con los nuevos campos solicitados (Nombre, Apellido, Cédula, WhatsApp)
  this.expressPatientForm = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(2)]),
    apellido: new FormControl('', [Validators.required, Validators.minLength(2)]),
    n_doc: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{5,10}$')]),
    phone: new FormControl('', [Validators.required])
  });

  this.appointmentService.listConfig().subscribe((resp: any) => { // [1]
    this.hours = resp.hours; // [1]
    this.specialities = resp.specialities; // [1]
  }); // [1]
  }

  irAlPaso(paso: number) {
  this.text_validation = '';

  if (paso === 2) {
    // Validación estricta del Paso 1 antes de dejarlo avanzar
    if (!this.date_appointment || !this.specilityie_id || !this.selected_segment_hour) {
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

  // ⚡ GUARDADO EXPRESS: Registra en la central Klyntic y detona WhatsApp
  saveExpress() {
  this.text_validation = '';

  if (this.expressPatientForm.invalid) {
    this.text_validation = "Por favor, completa correctamente todos tus datos personales.";
    this.toastr.warning(this.text_validation);
    return;
  }

  this.cargando = true;

  const dataExpress = {
    doctor_id: this.DOCTOR_SELECTED?.doctor?.id || 3,
    speciality_id: this.specilityie_id,
    date_appointment: this.date_appointment,
    doctor_schedule_join_hour_id: this.selected_segment_hour.id,
    amount: this.DOCTOR_SELECTED?.doctor?.precio_cita || 0,
    status_pay: 1, 
    status: 1,     

    // Datos personales separados
    name: this.expressPatientForm.get('nombre')?.value,
    surname: this.expressPatientForm.get('apellido')?.value,
    n_doc: this.expressPatientForm.get('n_doc')?.value,
    phone: this.expressPatientForm.get('phone')?.value,
    email: `${this.expressPatientForm.get('n_doc')?.value}@klyntic.express` // Email temporal usando la cédula para pasar la regla del backend
  };
    // console.log(dataExpress)
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

  const numeroDestino = this.DOCTOR_SELECTED?.doctor?.mobile || "584120000000"; 
  window.open(`https://wa.me{numeroDestino}?text=${mensaje}`, '_blank');
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
