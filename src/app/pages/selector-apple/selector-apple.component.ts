import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import { ImagenPipe } from '../../pipes/imagen-pipe.pipe';
import { Router } from '@angular/router';
import { ClinicaService } from '../../services/clinica.service';
import { HeaderComponent } from '../../shared/header/header.component';

@Component({
  selector: 'app-selector-apple',
  standalone: true,
  imports: [CommonModule, ImagenPipe, HeaderComponent],
  templateUrl: './selector-apple.component.html',
  styleUrls: ['./selector-apple.component.scss']
})
export class SelectorAppleComponent implements OnInit {

  // 🚀 Envía el médico seleccionado hacia el HomeComponent padre en Instagram Flow
  @Output() onDoctorSelected = new EventEmitter<any>();

  especialidades: any[] = [];
  clinica: any;
  especialidadSeleccionada: any = null;
  doctorSeleccionado: any = null;
  loading: boolean = true;

  private appointmentService = inject(AppointmentService);
  private clinicaService = inject(ClinicaService);
  private router = inject(Router);
  

  ngOnInit() {
    const slug = this.clinicaService.obtenerSlugDeUrl();

    // Consultamos la información del tenant guardada en la caché
    this.clinicaService.getClinicaBySlugCached(slug).subscribe((consultorio: any) => {
      
      if (consultorio?.tipoClinica?.toLowerCase() !== 'clinica') {
        // 🩺 CASO B: Es 'klyntic-generic' (Consultorio Pro).
        // No necesita selector estilo Apple. Lo mandamos directo al Home tradicional de reservas.
        console.log(`🩺 [SelectorApple]: Detectado Consultorio Pro. Redirigiendo a /home.`);
        this.router.navigate(['/home']);
      } else {
        // 🏢 CASO A: Es 'clinica-prueba' (Clinica Enterprise).
        // Se queda en este componente cargando las especialidades y el catálogo estilo Apple.
        console.log(`🏢 [SelectorApple]: Detectada Clínica Enterprise. Cargando catálogo...`);
        this.cargarSelector(); // Tu función original que llena el selector
      }

    });
  }

  cargarSelector(): void {
    this.loading = true;
    this.appointmentService.getSelectorEspecialistas().subscribe({
      next: (response: any) => {
        this.especialidades = response.results;
        this.clinica = response.clinica;
        // Seleccionamos la primera especialidad por defecto al estilo Apple Configurator
        if (this.especialidades.length > 0) {
          this.seleccionarEspecialidad(this.especialidades[0]);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error cargando el selector Enterprise en el Front-End:', err);
        this.loading = false;
      }
    });
  }

  seleccionarEspecialidad(especialidad: any): void {
    this.especialidadSeleccionada = especialidad;
    this.doctorSeleccionado = null; // Reiniciamos selección de doctor al cambiar de rama médica
  }

  seleccionarDoctor(doctor: any): void {
  this.doctorSeleccionado = doctor;
  console.log('🎯 [SelectorApple]: Especialista elegido, emitiendo evento al padre:', doctor.full_name);
  
  // Emite limpiamente al padre que lo contiene en la misma pantalla
  this.onDoctorSelected.emit(doctor);
}
}