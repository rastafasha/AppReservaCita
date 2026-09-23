import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
    return this.http.get(URL); // Solicitud limpia sin restricciones de login
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

  // =========================================================================
  // 🔒 ENDPOINTS PRIVADOS: EXCLUSIVOS PARA PANEL DE MÉDICOS (REQUIEREN TOKEN)
  // =========================================================================
  
  listAppointementAtendidas() {
    const URL = `${url_servicios}/appointments/atendidas`;
    return this.http.get(URL, { headers: this.headers });
  }

  lisFiter(data: any) {
    const URL = `${url_servicios}/appointments/filter`;
    return this.http.post(URL, data, { headers: this.headers });
  }

  getPatient(n_doc: string = '') {
    const URL = `${url_servicios}/appointments/patient?n_doc=${n_doc}`;
    return this.http.get(URL, { headers: this.headers });
  }

  storeAppointment(data: any) {
    const URL = `${url_servicios}/appointments/store`;
    return this.http.post(URL, data, { headers: this.headers });
  }
  
  showAppointment(appointment_id: any) {
    const URL = `${url_servicios}/appointments/show/${appointment_id}`;
    return this.http.get(URL, { headers: this.headers });
  }

  lisFiterByDoctor(data: any, doctor_id: number) {
    const URL = `${url_servicios}/appointments/filterbydoctor/${doctor_id}`;
    return this.http.post(URL, data, { headers: this.headers });
  }

  listAppointmentDocts(doctor_id: any, page = 1, search = '', search_patient = '', date = '') {
    let LINK = "";
    if (search) LINK += `&search=${search}`;
    if (search_patient) LINK += `&search_patient=${search_patient}`;
    if (date) LINK += `&date=${date}`;
    
    const URL = `${url_servicios}/appointments/byDoctor/${doctor_id}/?page=${page}${LINK}`;
    return this.http.get(URL, { headers: this.headers });
  }
  
  showCitamedica(appointment_id: any) {
    const URL = `${url_servicios}/appointment-atention/show/${appointment_id}`;
    return this.http.get(URL, { headers: this.headers });
  }

  getLaboratoryByAppointment(appointment_id: any) {
    const URL = `${url_servicios}/laboratory/showByAppointments/${appointment_id}`;
    return this.http.get(URL, { headers: this.headers });
  }
}
