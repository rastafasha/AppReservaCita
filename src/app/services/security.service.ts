import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment'; // Asegúrate de apuntar a tu archivo base de environment


@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

 public disableDeveloperTools(): void {
    // 🚀 SOLUCIÓN AL ERROR TS2339:
    // Casteamos el objeto 'environment' como 'any' para indicarle a TypeScript 
    // que confíe en que la propiedad 'production' sí existirá en tiempo de ejecución.
    const envData = environment as any;

    if (!isPlatformBrowser(this.platformId) || !envData.production) {
      return;
    }

    // 1. Bloquear menú contextual (Clic derecho)
    document.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });

    // 2. Bloquear combinación de teclas de desarrollo (F12, Ctrl+Shift+I, etc.)
    document.addEventListener('keydown', (event) => {
      if (event.key === 'F12') {
        event.preventDefault();
        return;
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShiftOrAlt = event.shiftKey || event.altKey;

      if (
        (isCtrlOrCmd && isShiftOrAlt && (event.key === 'I' || event.key === 'i' || event.key === 'J' || event.key === 'j' || event.key === 'C' || event.key === 'c')) ||
        (isCtrlOrCmd && (event.key === 'U' || event.key === 'u'))
      ) {
        event.preventDefault();
      }
    });

    // 3. Opcional: Silenciar mensajes en la consola en producción
    if (window && window.console) {
      window.console.log = () => {};
      window.console.warn = () => {};
    }
  }
}
