import { api } from './services/api.js';
import { store } from './state.js';
import { renderTopAppBar } from './components/organisms.js';
import { renderToast } from './components/atoms.js';

import { renderLoginPage } from './pages/login-page.js';
import { renderDashboardPage } from './pages/dashboard-page.js';
import { renderTramitesPage } from './pages/tramites-page.js';
import { renderAgendasPage } from './pages/agendas-page.js';
import { renderFichasPage } from './pages/fichas-page.js';
import { renderCronogramaPage } from './pages/cronograma-page.js';
import { renderAccionesPage } from './pages/acciones-page.js';
import { renderActividadesPage } from './pages/actividades-page.js';
import { renderEntregablesPage } from './pages/entregables-page.js';
import { renderCobrosPage } from './pages/cobros-page.js';
import { renderCatalogosAdminPage } from './pages/catalogos-admin-page.js';
import { renderEmisionDocumentalPage } from './pages/emision-documental-page.js';

const routes = {
  '#/login': { component: renderLoginPage, title: 'Iniciar Sesión', public: true },
  '#/': { component: renderDashboardPage, title: 'Panel de Simplificación', public: false },
  '#/tramites': { component: renderTramitesPage, title: 'Catálogo de Trámites', public: false },
  '#/agendas': { component: renderAgendasPage, title: 'Agendas Regulatorias', public: false },
  '#/fichas': { component: renderFichasPage, title: 'Matriz Diagnóstica', public: false },
  '#/cronograma': { component: renderCronogramaPage, title: 'Cronograma FASD', public: false },
  '#/acciones': { component: renderAccionesPage, title: 'Acciones Regulatorias', public: false },
  '#/actividades': { component: renderActividadesPage, title: 'Actividades Operativas', public: false },
  '#/entregables': { component: renderEntregablesPage, title: 'Entregables Oficiales', public: false },
  '#/cobros': { component: renderCobrosPage, title: 'Catálogo de Cobros', public: false },
  '#/catalogos-admin': { component: renderCatalogosAdminPage, title: 'Catálogos Oficiales', public: false },
  '#/emision-documental': { component: renderEmisionDocumentalPage, title: 'Centro de Emisión', public: false },
};

export class Router {
  constructor(appContainer) {
    this.appContainer = appContainer;
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Suscripción al store para renderizar toasts globales
    store.subscribe((state) => {
      this.renderToasts(state.notifications);
    });

    this.handleRoute();
  }

  async handleRoute() {
    let hash = window.location.hash || '#/';
    // Normalizar hash simple
    if (hash === '' || hash === '#') hash = '#/';

    const isAuthenticated = api.isAuthenticated();
    const route = routes[hash] || routes['#/'];

    // 1. Protección de rutas privadas
    if (!route.public && !isAuthenticated) {
      window.location.hash = '#/login';
      return;
    }

    // 2. Redirección si ya está autenticado e intenta ir a login
    if (route.public && isAuthenticated && hash === '#/login') {
      window.location.hash = '#/';
      return;
    }

    store.setCurrentPath(hash);
    document.title = `${route.title} - Tuxtla Digital`;

    // 3. Renderizado de Layout
    if (route.public) {
      // Pantalla de login limpia sin barra institucional
      this.appContainer.innerHTML = `<div id="page-content" class="w-full min-h-screen"></div>`;
      const pageContent = this.appContainer.querySelector('#page-content');
      await route.component(pageContent);
    } else {
      // Shell Institucional Completo
      const user = store.getState().user || api.getUser();
      this.appContainer.innerHTML = `
        ${renderTopAppBar(user, hash)}
        <main class="w-full max-w-[1440px] mx-auto px-gutter-mobile lg:px-gutter-desktop pt-space-lg pb-space-3xl min-h-[calc(100vh-5rem)]">
          <div id="page-content" class="w-full"></div>
        </main>
      `;

      // Vincular Logout
      const btnLogout = this.appContainer.querySelector('#btn-logout');
      if (btnLogout) {
        btnLogout.addEventListener('click', () => {
          api.logout();
          store.setUser(null);
          store.addNotification('Sesión cerrada correctamente', 'info');
        });
      }

      const pageContent = this.appContainer.querySelector('#page-content');
      await route.component(pageContent);
    }
  }

  renderToasts(notifications = []) {
    const toastContainer = document.querySelector('#toast-container');
    if (!toastContainer) return;

    toastContainer.innerHTML = notifications
      .map((n) => renderToast(n))
      .join('');
  }
}
