import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { RegisterForm } from '../auth/interfaces/register-form.interface';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

const baseUrl = environment.url_backend;

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  public usuario: Usuario | null = null;
  public estaAutenticado = false;
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  public auth2: any;

  constructor(
    private router: Router,
    public http: HttpClient
  ) {
    this.getLocalStorage();//devuelve el usuario logueado
  }

  get token():string{
    return localStorage.getItem('token') || '';
  }

 get role(): 'ADMIN' | 'USER' | 'VENTAS' {
    return this.usuario?.role ?? 'USER';
  }

  get uid():string{
    return this.usuario?.uid || '';
  }

  get headers(){
    return{
      headers: {
        'x-token': this.token
      }
    }
  }

  guardarLocalStorage(token: string, userData: any){
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    this.getLocalStorage();  // Populate service state and emit
  }

  getLocalStorage(): Usuario | null {
    const authStr = localStorage.getItem('estaAutenticado');
    this.estaAutenticado = authStr === 'true';


    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        // Create User instance from parsed data (match JSON shape)
        this.usuario = new Usuario(
          userData.first_name || '',
          userData.last_name || '',
          userData.pais || '',
          userData.telefono || '',
          userData.numdoc || '',
          userData.email || '',
          userData.img || '',
          undefined,  // password not stored
          userData.google || false,
          userData.role,
          userData.uid,
          userData.createdAt ? new Date(userData.createdAt) : undefined,
        );
        this.currentUserSubject.next(this.usuario);
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        this.usuario = null;
        this.currentUserSubject.next(null);
      }
    } else {
      this.usuario = null;
      this.currentUserSubject.next(null);
    }

    return this.usuario;
  }

  getEstaAutenticado(): boolean {
    return this.estaAutenticado;
  }

  login(formData: any) {
    return this.http.post(`${baseUrl}/auth/login`, formData)
      .pipe(
        tap((resp: any) => {
          localStorage.setItem('estaAutenticado', 'true');
          this.guardarLocalStorage(resp.token, resp.user);
        })
      )
  }

  loginExpress(telefono: any) {
  // 🟢 CORRECCIÓN DEFINITIVA: Cambiado a '/login/express'
  return this.http.post(`${baseUrl}/login/express`, { telefono })
    .pipe(
      tap((resp: any) => {
        localStorage.setItem('estaAutenticado', 'true');
        this.guardarLocalStorage(resp.token, resp.usuario);
      })
    );
}

  logout(){
    this.currentUserSubject.next(null);
    this.refresh();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('estaAutenticado');
    localStorage.removeItem('cart');
    this.usuario = null;
    this.estaAutenticado = false;
    this.router.navigateByUrl('./login');
  }

  refresh(): void {
    window.location.reload();
    this.router.navigateByUrl('/home');
  }

  crearUsuario(formData: RegisterForm) {
    let URL = baseUrl + "/register";
    return this.http.post(URL, formData)
      .pipe(map(user => {
        localStorage.setItem('auth_token', JSON.stringify(user));

        return user;
      }));
  }

  

  


  


}
