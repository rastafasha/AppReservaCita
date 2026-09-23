import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

const base_url = environment.backend_node;

@Injectable({
  providedIn: 'root'
})
export class ClinicaService {

  private selectedClinicaSubject = new BehaviorSubject<any | null>(null);
  selectedClinicaObservable$ = this.selectedClinicaSubject.asObservable();
  
  // Caché para consultorios/clínicas por su slug para mitigar peticiones HTTP repetitivas
  private clinicaCache = new Map<string, Observable<any | null>>();
  private cacheTimestamps = new Map<string, number>();
  private readonly CACHE_SIZE = 10;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos de tiempo de vida en caché

  constructor(
    private http: HttpClient
  ) { }

  get token(): string {
    return localStorage.getItem('token') || '';
  }

  get headers() {
    return {
      headers: {
        'x-token': this.token
      }
    };
  }

  /**
   * Extrae dinámicamente el slug/subdominio desde la URL del navegador.
   */
  /**
 * Extrae dinámicamente el subdominio/slug desde la URL del navegador.
 * Optimizado para Localhost, entornos de despliegue de Vercel y Dominios Propios.
 */
public obtenerSlugDeUrl(): string {
  const hostname = window.location.hostname.toLowerCase().trim(); // Ej: dr-perez.vercel.app o dr-perez.com
  const partes = hostname.split('.');

  // 1. Control para desarrollo local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return environment.nombreSelected; // Ej: 'dra-belen-silvestri' para tus pruebas locales
  }
  
  // 2. Control para subdominios (Ej: dra-belen.vercel.app o ://klyntic.com)
  if (partes.length >= 3) {
    const subdominio = partes[0];
    
    // Ignoramos subdominios técnicos o comunes que no pertenecen a un doctor
    if (subdominio !== 'www' && subdominio !== 'api' && subdominio !== 'admin') { 
      return subdominio; // Retorna limpiamente 'dra-belen'
    }
  }

  // 3. Fallback por si entran directamente al dominio raíz
  return environment.nombreSelected;
}


  /**
   * Obtiene los datos del consultorio por su slug desde el CRM (Node.js) con caché.
   * Este es el método clave que llamará tu app.component.ts al arrancar.
   */
  getClinicaBySlugCached(slug?: string): Observable<any | null> {
    const slugClinica = slug || this.obtenerSlugDeUrl();
    const now = Date.now();
    
    const cached = this.clinicaCache.get(slugClinica);
    const cachedTimestamp = this.cacheTimestamps.get(slugClinica);
    
    // Validar si la caché sigue activa
    if (cached && cachedTimestamp && (now - cachedTimestamp) < this.CACHE_TTL) {
      return cached;
    }
    
    // Limpieza de caché si se excede el tamaño máximo
    if (this.clinicaCache.size >= this.CACHE_SIZE) {
      const oldestKey = this.cacheTimestamps.keys().next().value as string;
      if (oldestKey) {
        this.clinicaCache.delete(oldestKey);
        this.cacheTimestamps.delete(oldestKey);
      }
    }
    
    // 🔥 ENLACE DIRECTO CON NODEJS: Apunta a /consultorios/by-slug/:slug
    const url = `${base_url}/consultorios/by-slug/${slugClinica}`;
    const request = this.http.get<any>(url).pipe(
      map((resp: { ok: boolean, consultorio: any }) => resp.consultorio),
      tap(consultorio => {
        this.selectedClinicaSubject.next(consultorio);
        this.aplicarEstilosDinamicos(consultorio);
      }),
      shareReplay(1)
    );
    
    this.clinicaCache.set(slugClinica, request);
    this.cacheTimestamps.set(slugClinica, now);
    
    return request;
  }

  /**
   * Aplica los colores de marca definidos en el CRM a las variables CSS globales de Angular
   */
  private aplicarEstilosDinamicos(consultorio: any): void {
    if (consultorio && consultorio.color_primario) {
      document.documentElement.style.setProperty('--color-primario-dinamico', consultorio.color_primario);
    }
  }

  /**
   * Fuerza la actualización de los datos ignorando la caché anterior
   */
  refreshClinica(slug?: string): Observable<any | null> {
    const slugClinica = slug || this.obtenerSlugDeUrl();
    const url = `${base_url}/consultorios/by-slug/${slugClinica}`;
    
    const request = this.http.get<any>(url).pipe(
      map((resp: { ok: boolean, consultorio: any }) => resp.consultorio),
      tap(consultorio => {
        this.selectedClinicaSubject.next(consultorio);
        this.clinicaCache.set(slugClinica, request);
        this.cacheTimestamps.set(slugClinica, Date.now());
      }),
      shareReplay(1)
    );
    
    this.clinicaCache.delete(slugClinica);
    this.clinicaCache.set(slugClinica, request);
    this.cacheTimestamps.set(slugClinica, Date.now());
    
    return request;
  }

  /**
   * Operaciones CRUD Generales para tu Panel Administrativo del CRM (Node.js)
   */

  cargarClinicas(): Observable<any[]> {
    const url = `${base_url}/consultorios`;
    return this.http.get<any>(url, this.headers).pipe(
      map((resp: { ok: boolean, consultorios: any[] }) => resp.consultorios)
    );
  }

  getClinicaById(_id: string): Observable<any> {
    const url = `${base_url}/consultorios/${_id}`;
    return this.http.get<any>(url, this.headers).pipe(
      map((resp: { ok: boolean, consultorio: any }) => resp.consultorio)
    );
  }

  crearClinica(consultorio: any): Observable<any> {
    const url = `${base_url}/consultorios/store`; // Ajusta según la ruta exacta de tu router en Node
    return this.http.post(url, consultorio, this.headers);
  }

  actualizarClinica(consultorio: any): Observable<any> {
    const url = `${base_url}/consultorios/update/${consultorio._id}`;
    return this.http.put(url, consultorio, this.headers);
  }

  borrarClinica(_id: string): Observable<any> {
    const url = `${base_url}/consultorios/delete/${_id}`;
    return this.http.delete(url, this.headers);
  }

  clearCache(): void {
    this.clinicaCache.clear();
    this.cacheTimestamps.clear();
    this.selectedClinicaSubject.next(null);
  }

  setSelectedClinica(clinica: any | null): void {
    this.selectedClinicaSubject.next(clinica);
  }

  getSelectedClinicaSync(): any | null {
    return this.selectedClinicaSubject.value;
  }
}
