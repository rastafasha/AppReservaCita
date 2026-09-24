import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DoctorAddress } from '../models/DoctorAddress.model';
import { environment } from '../../environments/environment';

const base_url = environment.url_servicios;

@Injectable({
  providedIn: 'root'
})
export class DoctorService {

  constructor(public http: HttpClient) { }

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
  // 🌍 ENDPOINT PÚBLICO: CONSULTA DE HORARIOS DESDE LA WEB (SIN TOKEN)
  // =========================================================================
  
  /**
   * Descarga la agenda y los turnos reales de Supabase usando el ID del Core
   */
  showDoctorProfile(doctor_id: number): Observable<any> {
    // Liberada de cabeceras para que el paciente anónimo lea la agenda real sin estar logueado
    const URL = `${base_url}/doctors/profile/${doctor_id}`;
    return this.http.get<any>(URL);
  }
  
  // =========================================================================
  // 🔒 ENDPOINTS PRIVADOS: CONTROL DIRECCIONES DEL PANEL (REQUIEREN TOKEN)
  // =========================================================================

  getAddressesByDoctor(doctorId: number): Observable<any> {
    const url = `${base_url}/doctor-addresses/doctor/${doctorId}`;
    return this.http.get<any>(url);
  }
  getPaymentMetodhByDoctor(doctorId: number): Observable<any> {
    const url = `${base_url}/paymentmethods/bydoctor/${doctorId}`;
    return this.http.get<any>(url);
  }

}
