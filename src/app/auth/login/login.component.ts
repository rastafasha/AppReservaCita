import { Component, NgZone, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ImagenPipe } from '../../pipes/imagen-pipe.pipe';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ImagenPipe
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  public formSumitted = false;
  public auth2: any;

  loginForm: FormGroup;
  formExpress: FormGroup;
  option_selectedd: number = 1;
  solicitud_selectedd: any = 1;

  // Modernización con 'inject' para mayor limpieza
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private ngZone = inject(NgZone);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });
    this.formExpress = this.fb.group({
      first_name: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      remember: [false]
    });
  }

  ngOnInit() {
    this.usuarioService.getLocalStorage();
    // this.escucharTiendaActiva();
  }

  optionSelected(value: number) {
    this.option_selectedd = value;
    if (this.option_selectedd === 1) {


    }
    if (this.option_selectedd === 2) {

    }
  }

  // 🌟 CORRECCIÓN SAAS MULTI-TENANT:
  // Escuchamos en vivo la tienda activa que resolvió la URL sin peticiones HTTP extras
  // escucharTiendaActiva() {
  //   this.tiendaService.selectedTiendaObservable$.subscribe(tienda => {
  //     if (tienda) {
  //       this.tiendaSelected = tienda;
  //       console.log('LoginComponent sincronizado con la tienda:', this.tiendaSelected.nombre);
  //     }
  //   });
  // }

  login() {
    this.formSumitted = true;
    if (this.loginForm.invalid) { return; }

    this.authService.login(this.loginForm.value).subscribe({
      next: (resp) => {
        if (this.loginForm.get('remember')?.value) {
          localStorage.setItem('email', this.loginForm.get('email')?.value);
        } else {
          localStorage.removeItem('email');
        }
        this.authService.getLocalStorage();

        if (localStorage.getItem('user') !== 'undefined') {
          setTimeout(() => {
            this.router.navigateByUrl('/my-account');
          }, 500);
        } else {
          this.router.navigateByUrl('/login');
        }
      },
      error: (err) => {
        this.toastr.error('Error al iniciar sesión.  Verifica tus credenciales.');
        // Swal.fire('Error', err.error.msg, 'error');
      }
    });
  }

enviarFormularioExpress() {
    // 1. Extraemos solo el teléfono del formulario
    const { telefono } = this.formExpress.value;

    // 2. Enviamos únicamente el teléfono al servicio
    this.authService.loginExpress(telefono).subscribe({
      next: (resp: any) => {
        if (resp && resp.ok) {
          this.ngZone.run(() => {
            this.router.navigate(['/']).then(navExitoso => {
              if (!navExitoso) {
                window.location.href = '/';
              }
            });
          });
        }
      },
      error: (err) => {
        console.error('Error en el login express:', err);
      }
    });
}





  async startApp() {
    this.usuarioService.googleInit();
    this.auth2 = this.usuarioService.auth2;
  }



}
