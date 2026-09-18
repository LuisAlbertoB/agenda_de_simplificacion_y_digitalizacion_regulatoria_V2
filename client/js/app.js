import { Router } from './router.js';

/**
 * Punto de entrada principal (Bootstrap de la aplicación cliente ES6)
 */
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.querySelector('#app');
  if (!appContainer) {
    console.error('No se encontró el contenedor #app');
    return;
  }

  // Inicializar Enrutador Hash-based
  window.appRouter = new Router(appContainer);

  // Registro Opcional de Service Worker para PWA / Shell Caching
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          console.log('[SW] Service Worker registrado exitosamente con scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[SW] Falló el registro del Service Worker:', err);
        });
    });
  }
});
