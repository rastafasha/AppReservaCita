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
  public expressPatientForm!: FormGroup;

  constructor(
    public appointmentService: AppointmentService,
    public router: Router,
    public activatedRoute: ActivatedRoute,
    public toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    
    // Inicialización del formulario express para capturar al nuevo paciente
    this.expressPatientForm = new FormGroup({
      nombre: new FormControl('', [Validators.required, Validators.minLength(3)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [Validators.required, Validators.pattern('^[0-9+ ]{7,15}\$')]),
    });

    this.appointmentService.listConfig().subscribe((resp: any) => {
      this.hours = resp.hours;
      this.specialities = resp.specialities;
    });
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

    // Validamos campos de fecha, especialidad e información de horas del backend
    if (!this.date_appointment || !this.specilityie_id || !this.selected_segment_hour) {
      this.text_validation = "Falta seleccionar la fecha o el bloque de hora para tu cita.";
      this.toastr.warning(this.text_validation);
      return;
    }

    // Validamos que los datos del formulario rápido del paciente estén completos
    if (this.expressPatientForm.invalid) {
      this.text_validation = "Por favor, ingresa tu nombre, correo electrónico y teléfono correctamente.";
      this.toastr.warning(this.text_validation);
      return;
    }

    this.cargando = true;

    // Estructuramos la data unificada para Klyntic Express (Pre-registro + Cita)
    const dataExpress = {
      doctor_id: this.DOCTOR_SELECTED?.doctor?.id || 3, // ID asignado o recuperado de la URL
      speciality_id: this.specilityie_id,
      date_appointment: this.date_appointment,
      doctor_schedule_join_hour_id: this.selected_segment_hour.id,
      amount: this.DOCTOR_SELECTED?.doctor?.precio_cita || 0,
      status_pay: 1, // 1 = Pendiente de pago (Pagan después en consulta física)
      status: 1,     // 1 = Solicitada/Pendiente por verificar por el médico
      
      // Datos del cliente para creación automática de cuenta en background (Laravel)
      name: this.expressPatientForm.get('nombre')?.value,
      email: this.expressPatientForm.get('email')?.value,
      phone: this.expressPatientForm.get('phone')?.value,
    };

    // Consumimos el servicio del backend
    this.appointmentService.storeAppointmentExpress(dataExpress).subscribe({
      next: (resp: any) => {
        this.toastr.success('¡Solicitud enviada a la central con éxito!');
        this.cargando = false;
        
        this.cerrarOffcanvas();

        // 📲 Detonamos la redirección automática a WhatsApp con el formato Premium
        this.enviarNotificacionWhatsApp(dataExpress);
      },
      error: (err) => {
        this.cargando = false;
        this.toastr.error('Ocurrió un error al procesar la reserva. Intenta de nuevo.');
      }
    });
  }

  private enviarNotificacionWhatsApp(data: any) {
    const mensaje = encodeURIComponent(
      `✨ *NUEVA SOLICITUD DE CITA - KLYNTIC EXPRESS* ✨\n\n` +
      `👋 Hola, un saludo. Acabo de solicitar una cita médica a través de la web:\n\n` +
      `👤 *Paciente:* ${data.name}\n` +
      `📞 *Teléfono:* ${data.phone}\n` +
      `✉️ *Correo:* ${data.email}\n\n` +
      `🗓️ *Fecha Solicitada:* ${data.date_appointment}\n` +
      `⏰ *Bloque de Hora:* Seleccionado en sistema\n\n` +
      `🚀 _Quedo a la espera de su confirmación para agendarla formalmente en mi app de Klyntic Paciente._`
    );

    // Número de contacto del consultorio del doctor o clínica asociada
    const numeroDestino = this.DOCTOR_SELECTED?.doctor?.mobile || "584120000000"; 

    window.open(`https://wa.me{numeroDestino}?text=${mensaje}`, '_blank');
  }

  cancel() {
    this.date_appointment = '';
    this.hour = '';
    if (this.selected_segment_hour) this.selected_segment_hour.id = null;
    this.expressPatientForm.reset();
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
