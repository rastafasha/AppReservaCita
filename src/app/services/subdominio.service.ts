import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubdominioService {

  private base_url = environment.backend_node;
  
  // Guardamos los datos de la clínica/consultorio actual de forma reactiva
  private consultorioActivoSubject = new BehaviorSubject<any | null>(null);
  public consultorioActivo$ = this.consultorioActivoSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Extrae el subdominio/slug directamente del navegador.
   */
  public obtenerSlugDeUrl(): string {
    const hostname = window.location.hostname; // Ej: clinica-perez.com o localhost
    const partes = hostname.split('.');

    // 1. Control para desarrollo local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return environment.nombreSelected; 
    }
    
    // 2. Control para subdominios en producción
    if (partes.length >= 3) {
      const subdominio = partes[0];
      if (subdominio !== 'www') {
        return subdominio; // Retorna 'clinica-dental'
      }
    }

    return environment.nombreSelected;
  }

  /**
   * Consulta al CRM en Node.js si el subdominio es válido y obtiene su configuración.
   */
  public validarYObtenerConsultorio(): Observable<any> {
    const slug = this.obtenerSlugDeUrl();
    const url = `${this.base_url}/consultorios/by-slug/${slug}`;

    return this.http.get<any>(url).pipe(
      map(resp => resp.consultorio),
      tap(consultorio => {
        // Almacenamos los datos en el estado global
        this.consultorioActivoSubject.next(consultorio);
        // Aplicamos dinámicamente el tema o colores de la clínica si vienen de la BD
        this.aplicarEstilosDinamicos(consultorio);
      }),
      shareReplay(1)
    );
  }

  /**
   * Aplica los colores de marca definidos por el doctor en el CRM a las variables CSS de Angular
   */
  private aplicarEstilosDinamicos(consultorio: any): void {
    if (consultorio && consultorio.color_primario) {
      document.documentElement.style.setProperty('--color-primario-dinamico', consultorio.color_primario);
    }
  }

  /**
   * Obtener los datos del consultorio de manera síncrona en cualquier parte del código
   */
  public getConsultorioSync(): any | null {
    return this.consultorioActivoSubject.value;
  }
}
