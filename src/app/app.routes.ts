import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

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

//   // 🛡️ CORTAFUEGOS: Cualquier otra ruta rota o inexistente la mandamos también al Home
//   { 
//     path: '**', 
//     redirectTo: 'home' 
//   }

  { path: '', redirectTo: '/', pathMatch: 'full' },
  { path: '**', component: HomeComponent },
    

];

