import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';

@Component({
  selector: 'app-selector-apple',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selector-apple.component.html',
  styleUrls: ['./selector-apple.component.scss']
})
export class SelectorAppleComponent implements OnInit {

  // 🚀 Envía el médico seleccionado hacia el HomeComponent padre en Instagram Flow
  @Output() onDoctorSelected = new EventEmitter<any>();

  especialidades: any[] = [];
  especialidadSeleccionada: any = null;
  doctorSeleccionado: any = null;
  loading: boolean = true;

  private appointmentService = inject(AppointmentService);

  ngOnInit(): void {
    this.cargarSelector();
  }

  cargarSelector(): void {
    this.loading = true;
    this.appointmentService.getSelectorEspecialistas().subscribe({
      next: (response: any) => {
        this.especialidades = response.results;
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
    // 🎯 Disparamos el evento hacia el HomeComponent padre
    this.onDoctorSelected.emit(doctor);
  }
}