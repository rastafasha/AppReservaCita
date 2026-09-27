import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SelectorAppleComponent } from './pages/selector-apple/selector-apple.component';
import { subdomainGuard } from './guards/subdomain.guard';
import { HomeClinicaComponent } from './pages/home-clinica/home-clinica.component';

export const routes: Routes = [

  // 🟢 LA RUTA RAÍZ YA NO USA COMPONENTE FIJO
  // El guard evaluará y redirigirá directamente a /home o /clinica de forma limpia UNA SOLA VEZ
  { 
    path: '', 
    canActivate: [subdomainGuard],
    children: [] // Dejamos que el guard maneje la redirección inicial
  },
  
  // Rutas explícitas y aisladas
  { 
    path: 'home', 
    component: HomeComponent 
  },
  { 
    path: 'clinica', 
    component: HomeClinicaComponent 
  },

  // 🛡️ Comodín estricto: Si no coincide con nada, a la raíz para que el guard procese.
  // Esto evita que 'Se quede pegada' la máquina porque redirige a la raíz controlada.
  { 
    path: '**', 
    redirectTo: '' 
  }
    

];

