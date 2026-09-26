import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClinicaService } from './services/clinica.service'; // Ajusta la ruta a tu proyecto
import { SecurityService } from './services/security.service'; 


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'appReservaCita';

  public cargandoTenant = true;
  public errorTenant = false;
  public mensajeError = '';

  private clinicaService = inject(ClinicaService);
  private securityService = inject(SecurityService);

  ngOnInit(): void {
    // this.securityService.disableDeveloperTools(); // seguridad evitando acceder a la consola
    this.validarSubdominioEnProduccion();
  }

  validarSubdominioEnProduccion(): void {
    this.cargandoTenant = true;

    // 🚀 El servicio extrae dinámicamente 'joaqun-paez' de la URL y consulta a Render
    this.clinicaService.getClinicaBySlugCached().subscribe({
      next: (consultorio) => {
        if (consultorio) {
          console.log('🎉 [Klyntic Multi-Tenant] Datos cargados con éxito para:', consultorio.name);
          this.cargandoTenant = false;
        } else {
          this.errorTenant = true;
          this.cargandoTenant = false;
          this.mensajeError = 'El consultorio solicitado no está disponible o se encuentra inactivo.';
        }
      },
      error: (err) => {
        console.error('❌ Error crítico de conexión con el CRM en Render:', err);
        this.errorTenant = true;
        this.cargandoTenant = false;
        this.mensajeError = err.error?.msg || 'Error de comunicación con el servidor central.';
      }
    });
  }
}
