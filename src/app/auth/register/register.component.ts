import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { NgClass, NgIf, NgStyle } from '@angular/common';
import { ImagenPipe } from '../../pipes/imagen-pipe.pipe';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgIf,
    NgClass,
    ImagenPipe,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  public formSumitted = false;
  registerForm: FormGroup;

  public currentStep: number = 1;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuarioService: UsuarioService,
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      password2: ['', Validators.required],
      local: [''],
      terminos: [false],

    }, {
      validators: this.passwordsIguales('password', 'password2')

    });
  }

  ngOnInit(): void {
    // this.escucharTiendaActiva();
  }

  // escucharTiendaActiva() {
  //   this.tiendaService.selectedTiendaObservable$.subscribe(tienda => {
  //     if (tienda) {
  //       this.tiendaSelected = tienda;
  //       console.log('LoginComponent sincronizado con la tienda:', this.tiendaSelected.nombre);
  //     }
  //   });
  // }



  nextStep() {
    // Validate step 1 fields (first_name, last_name)
    const firstName = this.registerForm.get('first_name');
    const lastName = this.registerForm.get('last_name');

    if (firstName?.invalid || lastName?.invalid) {
      firstName?.markAsTouched();
      lastName?.markAsTouched();
      return;
    }

    this.currentStep = 2;
  }

  prevStep() {
    this.currentStep = 1;
  }

  crearUsuario() {
    this.formSumitted = true;
    //agregamos el id de la tienda a la respuesta

    // this.registerForm.value.local = this.tiendaSelected._id;
    console.log(this.registerForm.value);

    if (this.registerForm.invalid) {
      return;
    }

    //realizar el posteo del usuario
    this.usuarioService.crearUsuario(this.registerForm.value).subscribe(
      resp => {
        console.log(resp);
        this.usuarioService.getLocalStorage();
        // Swal.fire('Gracias por Registrate!, En breve te enviaremos a tu perfil para completar los datos requeridos')
        if (localStorage.getItem('user')) {
          this.router.navigateByUrl('/my-account');
        }
      }, (err) => {
        // Swal.fire('Error', err.error.msg, 'error');
      }
    );

  }

  campoNoValido(campo: string): boolean {
    if (this.registerForm.get(campo)?.invalid && this.formSumitted) {
      return true;
    } else {
      return false;
    }


  }

  aceptaTerminos() {
    return !this.registerForm.get('terminos')?.value && this.formSumitted;
  }

  passwordNoValido() {
    const pass1 = this.registerForm.get('password')?.value;
    const pass2 = this.registerForm.get('password2')?.value;

    if ((pass1 !== pass2) && this.formSumitted) {
      return true;
    } else {
      return false;
    }
  }

  passwordsIguales(pass1Name: string, pass2Name: string) {
    return (formGroup: FormGroup) => {
      const pass1Control = formGroup.get(pass1Name);
      const pass2Control = formGroup.get(pass2Name);

      if (pass1Control?.value === pass2Control?.value) {
        pass2Control?.setErrors(null)
      } else {
        pass2Control?.setErrors({ noEsIgual: true });
      }
    }
  }

}
