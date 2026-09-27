import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClinicaService } from '../services/clinica.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const subdomainGuard: CanActivateFn = (route, state) => {
  const clinicaService = inject(ClinicaService);
  const router = inject(Router);
  const slug = clinicaService.obtenerSlugDeUrl();

  console.log(`🛡️ [SubdomainGuard]: Validando acceso para el slug: ${slug}`);

  return clinicaService.getClinicaBySlugCached(slug).pipe(
    map((consultorio) => {
      if (consultorio) {
        // 🏢 CASO 1: Es una Clínica Enterprise
        if (consultorio.tipoClinica?.toLowerCase() === 'clinica') {
          console.log(`✅ [SubdomainGuard]: Modo Clínica Detectado. Redirigiendo a /clinica`);
          router.navigate(['/clinica']);
          return false; // Detiene la carga de la raíz ''
        } 
        
        // 🩺 CASO 2: Es un Consultorio Pro (klyntic-generic)
        else {
          console.log(`✅ [SubdomainGuard]: Modo Consultorio Detectado. Redirigiendo a /home`);
          router.navigate(['/home']);
          return false; // Detiene la carga de la raíz ''
        }
      } else {
        console.warn(`❌ [SubdomainGuard]: El subdominio '${slug}' no existe.`);
        router.navigate(['/404']);
        return false;
      }
    }),
    catchError((error) => {
      console.error('🚨 [SubdomainGuard]: Error crítico:', error);
      router.navigate(['/404']);
      return of(false);
    })
  );
};