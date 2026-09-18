import { agendasService, fichasService, tramitesService, cronogramaService } from '../services/crud-factory.js';
import { renderKPICard } from '../components/molecules.js';
import { renderInstitutionalBanner } from '../components/organisms.js';
import { renderSpinner } from '../components/atoms.js';

export async function renderDashboardPage(container) {
  let loading = true;
  let stats = {
    agendasCount: 0,
    tramitesCount: 0,
    fichasCount: 0,
    cronogramaCount: 0,
  };

  container.innerHTML = `<div class="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
    ${renderSpinner('lg')}
    <span class="font-body-sm text-body-sm text-text-secondary mt-4 font-data-mono">Cargando indicadores del Panel FASD...</span>
  </div>`;

  try {
    const [agendasRes, tramitesRes, fichasRes, cronoRes] = await Promise.all([
      agendasService.list({ page: 1 }),
      tramitesService.list({ page: 1 }),
      fichasService.list({ page: 1 }),
      cronogramaService.list({ page: 1 }),
    ]);

    stats.agendasCount = agendasRes.count || 0;
    stats.tramitesCount = tramitesRes.count || 0;
    stats.fichasCount = fichasRes.count || 0;
    stats.cronogramaCount = cronoRes.count || 0;
  } catch (err) {
    console.error('Error al cargar métricas del dashboard:', err);
  } finally {
    loading = false;
  }

  container.innerHTML = `
    ${renderInstitutionalBanner(
      'Panel de Simplificación Regulatoria',
      'Programa Anual de Simplificación y Digitalización (FASD 2026) • H. Ayuntamiento de Tuxtla Gutiérrez',
      'VISTA EJECUTIVA'
    )}

    <!-- KPI Metric Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
      ${renderKPICard({
        title: 'Agendas Registradas',
        value: stats.agendasCount.toString(),
        subtitle: 'Planes Anuales de Trabajo',
        icon: 'calendar_today',
        colorVariant: 'gold',
      })}
      ${renderKPICard({
        title: 'Trámites y Servicios',
        value: stats.tramitesCount.toString(),
        subtitle: 'Catálogo de trámites dictaminados',
        icon: 'menu_book',
        colorVariant: 'cyan',
      })}
      ${renderKPICard({
        title: 'Fichas Diagnósticas',
        value: stats.fichasCount.toString(),
        subtitle: 'Diagnósticos de madurez digital',
        icon: 'assignment_turned_in',
        colorVariant: 'emerald',
      })}
      ${renderKPICard({
        title: 'Actividades FASD',
        value: stats.cronogramaCount.toString(),
        subtitle: 'Entregables e hitos del cronograma',
        icon: 'event_repeat',
        colorVariant: 'warning',
      })}
    </div>

    <!-- Quick Access Cards & Summary Section -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-md mb-space-lg">
      <!-- Módulos Principales -->
      <div class="lg:col-span-8 flex flex-col gap-space-md">
        <div class="p-space-md rounded-xl bg-surface-card border border-border-subtle shadow-lg">
          <div class="flex items-center justify-between mb-space-md">
            <h2 class="font-headline-sm text-headline-sm text-text-primary font-bold flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">apps</span>
              Módulos del Sistema Regulatorio
            </h2>
            <span class="font-data-mono text-label-sm text-text-tertiary">LNETB ART. 14</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <a href="#/tramites" class="p-space-md rounded-lg bg-surface-container border border-border-subtle hover:border-border-gold transition-all duration-200 group flex items-start gap-space-md">
              <div class="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-[24px]">list_alt</span>
              </div>
              <div class="flex flex-col">
                <h3 class="font-title-md text-title-md text-text-primary group-hover:text-primary transition-colors">Catálogo de Trámites</h3>
                <p class="font-body-sm text-body-sm text-text-secondary mt-1">Directorio oficial de trámites y servicios municipales dictaminados.</p>
              </div>
            </a>

            <a href="#/fichas" class="p-space-md rounded-lg bg-surface-container border border-border-subtle hover:border-border-tech transition-all duration-200 group flex items-start gap-space-md">
              <div class="p-2.5 rounded-lg bg-secondary/10 text-secondary group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-[24px]">assignment</span>
              </div>
              <div class="flex flex-col">
                <h3 class="font-title-md text-title-md text-text-primary group-hover:text-secondary transition-colors">Matriz Diagnóstica</h3>
                <p class="font-body-sm text-body-sm text-text-secondary mt-1">Fichas de simplificación, medición de plazos y niveles de madurez.</p>
              </div>
            </a>

            <a href="#/cronograma" class="p-space-md rounded-lg bg-surface-container border border-border-subtle hover:border-tertiary/30 transition-all duration-200 group flex items-start gap-space-md">
              <div class="p-2.5 rounded-lg bg-tertiary/10 text-tertiary group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-[24px]">calendar_month</span>
              </div>
              <div class="flex flex-col">
                <h3 class="font-title-md text-title-md text-text-primary group-hover:text-tertiary transition-colors">Cronograma FASD</h3>
                <p class="font-body-sm text-body-sm text-text-secondary mt-1">Calendario de actividades por semestre, responsable e hito.</p>
              </div>
            </a>

            <a href="#/catalogos-admin" class="p-space-md rounded-lg bg-surface-container border border-border-subtle hover:border-status-warning/30 transition-all duration-200 group flex items-start gap-space-md">
              <div class="p-2.5 rounded-lg bg-status-warning/10 text-status-warning group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-[24px]">folder_managed</span>
              </div>
              <div class="flex flex-col">
                <h3 class="font-title-md text-title-md text-text-primary group-hover:text-status-warning transition-colors">Catálogos Oficiales</h3>
                <p class="font-body-sm text-body-sm text-text-secondary mt-1">Administración de roles, permisos, dependencias y usuarios.</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Panel Lateral Informativo -->
      <div class="lg:col-span-4 flex flex-col gap-space-md">
        <div class="p-space-md rounded-xl bg-surface-card border border-border-subtle shadow-lg flex flex-col justify-between">
          <div>
            <span class="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">Marco Normativo</span>
            <h3 class="font-headline-sm text-headline-sm text-text-primary mt-1 font-bold">Ley Nacional de Eficiencia Regulatoria</h3>
            <p class="font-body-sm text-body-sm text-text-secondary mt-2">
              El Ayuntamiento de Tuxtla Gutiérrez implementa el modelo integral para la eliminación de trámites burocráticos y la digitalización de servicios públicos.
            </p>
          </div>

          <div class="mt-4 pt-4 border-t border-border-subtle flex flex-col gap-2">
            <div class="flex items-center justify-between font-data-mono text-label-sm">
              <span class="text-text-tertiary">Estado del Servidor API:</span>
              <span class="text-tertiary flex items-center gap-1 font-semibold">
                <span class="w-2 h-2 rounded-full bg-tertiary"></span> CONECTADO
              </span>
            </div>
            <div class="flex items-center justify-between font-data-mono text-label-sm">
              <span class="text-text-tertiary">Base URL:</span>
              <span class="text-text-secondary truncate max-w-[180px]">http://localhost:8000/api</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
