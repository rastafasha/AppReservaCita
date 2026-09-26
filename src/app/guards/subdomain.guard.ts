import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClinicaService } from '../services/clinica.service'; // Ajusta la ruta según tus carpetas
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const subdomainGuard: CanActivateFn = (route, state) => {
  const clinicaService = inject(ClinicaService);
  const router = inject(Router);

  // 1. Extraemos dinámicamente el subdominio/slug usando tu propio método de producción
  const slug = clinicaService.obtenerSlugDeUrl();

  console.log(`🛡️ [SubdomainGuard]: Validando acceso para el slug: ${slug}`);

  // 2. Le preguntamos a tu servicio con caché si la clínica/consultorio existe en Node.js
  return clinicaService.getClinicaBySlugCached(slug).pipe(
    map((consultorio) => {
      if (consultorio) {
        // La clínica existe y está registrada en Klyntic. ¡Damos luz verde! 🟢
        console.log(`✅ [SubdomainGuard]: Acceso aprobado para el centro: ${consultorio.nombre}`);
        return true;
      } else {
        // El subdominio no existe en el sistema. Redirigimos a una página de error o al home
        console.warn(`❌ [SubdomainGuard]: El subdominio '${slug}' no existe en Klyntic.`);
        router.navigate(['/404']); // O la ruta de fallback que manejes
        return false;
      }
    }),
    catchError((error) => {
      console.error('🚨 [SubdomainGuard]: Error crítico al validar el subdominio:', error);
      router.navigate(['/404']);
      return of(false);
    })
  );
};