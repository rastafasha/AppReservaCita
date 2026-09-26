import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SelectorAppleComponent } from './pages/selector-apple/selector-apple.component';
import { subdomainGuard } from './guards/subdomain.guard';

export const routes: Routes = [
   // 🚀 LA CORRECCIÓN CRÍTICA PARA EL LINK DE INSTAGRAM:
  // Le dice a Angular que cuando el paciente entre a la raíz '/', lo mande mágicamente a '/home'
//   { 
//     path: '', 
//     redirectTo: 'home', 
//     pathMatch: 'full' 
//   },
  
//   // Tu ruta original que renderiza las tarjetas estilo Apple
//   { 
//     path: 'home', 
//     component: HomeComponent 
//   },

//   // 🛡️ solo local
  { 
    path: '**', 
    redirectTo: 'home' 
  },
  //   // 🛡️ solo local
  { path: '', component: SelectorAppleComponent, canActivate: [subdomainGuard] },
  { path: '', redirectTo: '/', pathMatch: 'full' },
  { path: '**', component: HomeComponent },
    

];

