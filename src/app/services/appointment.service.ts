import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const url_servicios = environment.url_servicios;

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  constructor(public http: HttpClient) { }

  // 🔑 Token y cabeceras privadas para cuando el usuario YA está autenticado en su panel
  get token(): string {
    return localStorage.getItem('token') || '';
  }

  get headers() {
    return new HttpHeaders({
      'x-token': this.token,
      'Authorization': `Bearer ${this.token}`
    });
  }

  // =========================================================================
  // 🌍 ENDPOINTS PÚBLICOS: ACCESO ABIERTO PARA PACIENTES (SIN TOKEN)
  // =========================================================================
  
  /**
   * Carga las configuraciones base de la pasarela médica
   */
  listConfig() {
    const URL = `${url_servicios}/appointments/config`;
    return this.http.get(URL);
  }

  /**
   * Registra la cita express de forma anónima y crea el pre-registro del paciente
   */
  storeAppointmentExpress(data: any) {
    const URL = `${url_servicios}/appointments/store-express`; 
    return this.http.post(URL, data);
  }

  /**
   * Obtiene la tarifa y detalles de una especialidad específica en la landing pública
   */
  showSpeciality(speciality: any) {
    const URL = `${url_servicios}/specialities/show/${speciality}`;
    return this.http.get(URL);
  }
  
  lisFiterByDoctor(data: any, doctor_id: number) {
    const URL = `${url_servicios}/appointments/filterbydoctor/${doctor_id}`;
    return this.http.post(URL, data);
  }

  /**
   *  NUEVO ENTORNO ENTERPRISE KLYNTIC
   * Obtiene las especialidades y doctores del subdominio clínico actual desde Laravel
   */
  getSelectorEspecialistas(): Observable<any> {
    const URL = `${url_servicios}/clinica/selector-especialistas`;
    return this.http.get<any>(URL);
  }
}