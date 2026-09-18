/**
 * Componentes Atómicos (Atoms)
 * Elementos UI indivisibles (botones, badges, inputs, spinners, toasts).
 */

/**
 * Badge de Estado o Etiqueta
 */
export function renderBadge(text, variant = 'neutral') {
  const variants = {
    primary: 'bg-primary/15 text-primary border border-border-gold',
    secondary: 'bg-secondary/15 text-secondary border border-border-tech',
    tertiary: 'bg-tertiary/15 text-tertiary border border-tertiary/30',
    warning: 'bg-status-warning/15 text-status-warning border border-status-warning/30',
    danger: 'bg-status-danger/15 text-status-danger border border-status-danger/30',
    neutral: 'bg-surface-container-high text-on-surface-variant border border-border-subtle',
  };

  const styleClass = variants[variant] || variants.neutral;

  return `<span class="px-space-xs py-0.5 rounded-full font-data-mono text-label-sm uppercase tracking-wider ${styleClass}">
    ${text}
  </span>`;
}

/**
 * Botón Estándar de la Aplicación
 */
export function renderButton({
  label = '',
  icon = '',
  variant = 'primary',
  disabled = false,
  tooltip = '',
  id = '',
  className = '',
  type = 'button',
}) {
  const baseClass = 'inline-flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-lg font-title-md text-body-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50';

  const variants = {
    primary: 'bg-gradient-to-r from-gov-gold-light to-primary-container text-white hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(198,146,59,0.35)] active:translate-y-0',
    secondary: 'bg-surface-container border border-border-prominent text-text-primary hover:bg-surface-container-high hover:border-border-gold',
    tertiary: 'bg-surface-container-lowest text-text-secondary hover:text-text-primary hover:bg-surface-container-low',
    danger: 'bg-status-danger/20 border border-status-danger/40 text-status-danger hover:bg-status-danger/30',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high',
  };

  const disabledClass = 'opacity-50 cursor-not-allowed pointer-events-none hover:transform-none shadow-none';
  const variantClass = disabled ? `${variants[variant]} ${disabledClass}` : variants[variant];
  const tooltipAttr = tooltip ? `title="${tooltip}" data-tooltip="${tooltip}"` : '';
  const idAttr = id ? `id="${id}"` : '';

  return `<button type="${type}" ${idAttr} ${disabled ? 'disabled' : ''} ${tooltipAttr} class="${baseClass} ${variantClass} ${className}">
    ${icon ? `<span class="material-symbols-outlined text-[20px]">${icon}</span>` : ''}
    ${label ? `<span>${label}</span>` : ''}
  </button>`;
}

/**
 * Campo de Entrada de Texto / Formulario
 */
export function renderInput({
  id = '',
  label = '',
  type = 'text',
  placeholder = '',
  value = '',
  required = false,
  error = '',
  disabled = false,
  icon = '',
  helpText = '',
}) {
  return `<div class="flex flex-col gap-1.5 w-full">
    ${label ? `<label for="${id}" class="font-label-md text-label-md text-text-secondary flex items-center justify-between">
      <span>${label} ${required ? '<span class="text-status-danger">*</span>' : ''}</span>
    </label>` : ''}
    <div class="relative flex items-center">
      ${icon ? `<span class="material-symbols-outlined absolute left-3 text-text-tertiary text-[20px] pointer-events-none">${icon}</span>` : ''}
      <input
        type="${type}"
        id="${id}"
        name="${id}"
        value="${value}"
        placeholder="${placeholder}"
        ${required ? 'required' : ''}
        ${disabled ? 'disabled' : ''}
        class="w-full ${icon ? 'pl-10' : 'px-3'} py-2.5 rounded-lg bg-surface-recessed border ${error ? 'border-status-danger' : 'border-border-subtle'} text-text-primary placeholder:text-text-tertiary font-data-mono text-body-sm focus:outline-none focus:border-tech-cyan-glow focus:ring-2 focus:ring-tech-cyan-glow/20 transition-colors ${disabled ? 'opacity-60 cursor-not-allowed' : ''}"
      />
    </div>
    ${error ? `<span class="font-label-sm text-label-sm text-status-danger flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">error</span> ${error}</span>` : ''}
    ${helpText && !error ? `<span class="font-label-sm text-label-sm text-text-tertiary">${helpText}</span>` : ''}
  </div>`;
}

/**
 * Elemento Notificación Toast
 */
export function renderToast({ message, type = 'info' }) {
  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

  const borderMap = {
    success: 'border-tertiary text-tertiary',
    error: 'border-status-danger text-status-danger',
    warning: 'border-status-warning text-status-warning',
    info: 'border-tech-cyan-glow text-tech-cyan-glow',
  };

  return `<div class="animate-slide-in pointer-events-auto flex items-center gap-space-xs px-space-md py-3 rounded-lg bg-surface-elevated border-l-4 ${borderMap[type] || borderMap.info} shadow-2xl min-w-[280px] max-w-[420px]">
    <span class="material-symbols-outlined text-[22px]">${iconMap[type] || 'info'}</span>
    <span class="font-body-sm text-body-sm text-text-primary flex-1">${message}</span>
  </div>`;
}

/**
 * Spinner de Carga
 */
export function renderSpinner(size = 'md') {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return `<div class="inline-block animate-spin rounded-full border-solid border-primary border-t-transparent ${sizeMap[size] || sizeMap.md}" role="status">
    <span class="sr-only">Cargando...</span>
  </div>`;
}
