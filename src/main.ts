import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

/** Global que Capacitor inyecta solo cuando corre dentro del contenedor nativo. */
interface CapacitorGlobal {
  readonly Capacitor?: { readonly isNativePlatform?: () => boolean };
}

/**
 * Ñeque es portrait-only. La media query de `styles.scss` cubre la web; en
 * nativo hace falta bloquearlo de verdad, o el sistema rota la vista igual.
 *
 * Ni `@capacitor/core` ni el plugin se importan de forma estatica: juntos
 * sumaban ~9 kB al bundle inicial, que ya roza el budget de 500 kB, y en web
 * no se usan. La deteccion va por el global y el plugin por import dinamico.
 */
async function lockPortrait(): Promise<void> {
  if ((globalThis as CapacitorGlobal).Capacitor?.isNativePlatform?.() !== true) {
    return;
  }

  try {
    const { ScreenOrientation } = await import('@capacitor/screen-orientation');
    await ScreenOrientation.lock({ orientation: 'portrait' });
  } catch (error) {
    // Un dispositivo que no permita fijar la orientacion no debe impedir que
    // la app arranque: la media query sigue mostrando el aviso de rotar.
    console.warn('No se pudo fijar la orientacion vertical', error);
  }
}

void lockPortrait();

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
