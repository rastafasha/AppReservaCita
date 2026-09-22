import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';
import { HttpRequest, HttpHandlerFn, HttpEvent, provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { Observable } from 'rxjs';
import { provideAnimations } from '@angular/platform-browser/animations'; // 👈 Asegúrate de esta ruta de importación


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(
      withInterceptors([imageInterceptor])
    ),
    
    provideAnimations(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-center',
      preventDuplicates: true,
    }),
    provideRouter(routes),
    
  ],
};

function imageInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  // Check if the request is for an image
  if (
  req.url.endsWith('.jpg') || 
  req.url.endsWith('.png') || 
  req.url.endsWith('.jpeg') || 
  req.url.includes('cloudinary.com') // 🚀 Asegura capturar las imágenes de Cloudinary
) {
    const jwtToken = window.localStorage.getItem('auth_token');
    const modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${jwtToken}`
      }
    });
    return next(modifiedReq);
  }
  // Pass through other requests unmodified
  return next(req);
}