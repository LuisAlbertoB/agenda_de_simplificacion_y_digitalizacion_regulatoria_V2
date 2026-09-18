import { renderBadge } from './atoms.js';

/**
 * Componentes Moleculares (Molecules)
 * Combinación de átomos para funciones específicas (Tarjetas KPI, Paginador, Maturity Badges, Empty States).
 */

/**
 * Tarjeta KPI de Estadísticas
 */
export function renderKPICard({
  title = '',
  value = '0',
  subtitle = '',
  icon = 'analytics',
  colorVariant = 'gold', // 'gold', 'cyan', 'emerald', 'warning'
}) {
  const colorMap = {
    gold: {
      border: 'border-border-gold',
      iconBg: 'bg-primary/10 text-primary',
      text: 'text-primary',
    },
    cyan: {
      border: 'border-border-tech',
      iconBg: 'bg-secondary/10 text-secondary',
      text: 'text-secondary',
    },
    emerald: {
      border: 'border-tertiary/30',
      iconBg: 'bg-tertiary/10 text-tertiary',
      text: 'text-tertiary',
    },
    warning: {
      border: 'border-status-warning/30',
      iconBg: 'bg-status-warning/10 text-status-warning',
      text: 'text-status-warning',
    },
  };

  const scheme = colorMap[colorVariant] || colorMap.gold;

  return `<div class="p-space-md rounded-xl bg-surface-card border ${scheme.border} shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-opacity-100 transition-all duration-200">
    <div class="flex items-start justify-between gap-2">
      <div class="flex flex-col">
        <span class="font-label-sm text-label-sm text-text-tertiary uppercase tracking-wider font-semibold">${title}</span>
        <span class="font-headline-lg text-headline-lg text-text-primary tracking-tight font-bold mt-1">${value}</span>
      </div>
      <div class="p-2.5 rounded-lg ${scheme.iconBg} flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined text-[24px]">${icon}</span>
      </div>
    </div>
    ${subtitle ? `<div class="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between font-body-sm text-body-sm text-text-secondary">
      <span>${subtitle}</span>
    </div>` : ''}
  </div>`;
}

/**
 * Control de Paginación de Tabla (Consistente con PageNumberPagination de DRF)
 */
export function renderPagination({ count = 0, page = 1, pageSize = 10 }) {
  const totalPages = Math.ceil(count / pageSize) || 1;
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  const startItem = count > 0 ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, count);

  return `<div class="px-space-md py-3 bg-surface-container-lowest border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-space-sm rounded-b-xl">
    <div class="font-data-mono text-label-sm text-text-tertiary">
      Mostrando <span class="text-text-primary font-semibold">${startItem}</span> - <span class="text-text-primary font-semibold">${endItem}</span> de <span class="text-text-primary font-semibold">${count}</span> registros
    </div>
    <div class="flex items-center gap-2">
      <button
        type="button"
        data-action="prev-page"
        data-page="${page - 1}"
        ${!hasPrevious ? 'disabled' : ''}
        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container border border-border-subtle text-text-primary font-title-md text-body-sm hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <span class="material-symbols-outlined text-[18px]">chevron_left</span>
        <span>Anterior</span>
      </button>
      <span class="px-3 font-data-mono text-label-sm text-text-secondary">
        Página <strong class="text-primary">${page}</strong> de ${totalPages}
      </span>
      <button
        type="button"
        data-action="next-page"
        data-page="${page + 1}"
        ${!hasNext ? 'disabled' : ''}
        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container border border-border-subtle text-text-primary font-title-md text-body-sm hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <span>Siguiente</span>
        <span class="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </div>
  </div>`;
}

/**
 * Nivel de Digitalización Regulatoria (0 al 3 según LNETB)
 */
export function renderMaturityLevel(level = 0) {
  const levels = {
    0: { label: 'Nivel 0: Presencial', color: 'neutral', icon: 'description' },
    1: { label: 'Nivel 1: Descargable', color: 'secondary', icon: 'download' },
    2: { label: 'Nivel 2: Semi-Digital', color: 'warning', icon: 'settings_suggest' },
    3: { label: 'Nivel 3: 100% En Línea', color: 'tertiary', icon: 'verified' },
  };

  const item = levels[level] || levels[0];
  return `<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-high border border-border-subtle">
    <span class="material-symbols-outlined text-[16px] text-primary">${item.icon}</span>
    <span class="font-data-mono text-label-sm text-text-primary">${item.label}</span>
  </div>`;
}

/**
 * Estado Vacío (Sin Registros)
 */
export function renderEmptyState({
  title = 'No hay registros',
  description = 'No se encontraron datos disponibles para este catálogo.',
  icon = 'folder_open',
}) {
  return `<div class="p-space-2xl text-center flex flex-col items-center justify-center bg-surface-container-lowest/40 rounded-xl border border-dashed border-border-subtle my-space-md">
    <div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-text-tertiary mb-3">
      <span class="material-symbols-outlined text-[36px]">${icon}</span>
    </div>
    <h3 class="font-headline-sm text-headline-sm text-text-primary">${title}</h3>
    <p class="font-body-sm text-body-sm text-text-secondary max-w-md mt-1">${description}</p>
  </div>`;
}
