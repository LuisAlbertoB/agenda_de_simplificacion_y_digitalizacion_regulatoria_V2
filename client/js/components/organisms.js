import { renderPagination, renderEmptyState } from './molecules.js';
import { renderSpinner, renderButton } from './atoms.js';

/**
 * Función auxiliar para obtener valores de propiedades anidadas de forma segura
 * Ejemplo: getNestedValue(row, 'id_agenda.anio') -> 2026
 */
export function getNestedValue(obj, path) {
  if (!obj || !path) return null;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
}

/**
 * Encabezado Superior Institucional (TopAppBar)
 */
export function renderTopAppBar(user, currentPath = '#/') {
  const userName = user?.nombre_completo || 'Usuario del Sistema';
  const roleName = user?.role_clave ? user.role_clave.toUpperCase() : 'ADMINISTRADOR';

  const navItems = [
    { label: 'Agenda General', path: '#/', icon: 'dashboard' },
    { label: 'Catálogo de Trámites', path: '#/tramites', icon: 'list_alt' },
    { label: 'Matriz Diagnóstica', path: '#/fichas', icon: 'assignment' },
    { label: 'Cronograma FASD', path: '#/cronograma', icon: 'calendar_month' },
    { label: 'Catálogos Oficiales', path: '#/catalogos-admin', icon: 'folder_managed' },
    { label: 'Centro de Emisión', path: '#/emision-documental', icon: 'print' },
  ];

  return `<header class="sticky top-0 z-50 w-full bg-surface-base/90 backdrop-blur-xl border-b border-border-subtle shadow-md">
    <div class="h-20 w-full max-w-[1440px] mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-md">
      <!-- Identidad y Marca -->
      <div class="flex items-center gap-space-md min-w-0">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[28px]">account_balance</span>
          <div class="flex flex-col">
            <div class="flex items-center gap-space-xs">
              <span class="font-headline-sm text-headline-sm text-primary truncate tracking-tight font-bold">ASDR</span>
              <span class="px-space-2xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider hidden md:inline-block">FASD 2026</span>
            </div>
            <span class="font-label-sm text-label-sm text-text-tertiary truncate hidden sm:block">Tuxtla Gutiérrez • LNETB</span>
          </div>
        </div>
      </div>

      <!-- Navegación Escritorio -->
      <nav class="hidden xl:flex items-center gap-1 bg-surface-container-lowest/80 p-1 rounded-lg border border-border-subtle">
        ${navItems.map(item => {
          const isActive = currentPath === item.path || (item.path === '#/' && (currentPath === '' || currentPath === '#'));
          const activeClass = isActive
            ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
            : 'text-text-secondary hover:bg-surface-container-high hover:text-text-primary';
          return `<a href="${item.path}" class="px-3 py-1.5 rounded text-body-sm font-title-md transition-colors flex items-center gap-1.5 ${activeClass}">
            <span class="material-symbols-outlined text-[18px]">${item.icon}</span>
            <span>${item.label}</span>
          </a>`;
        }).join('')}
      </nav>

      <!-- Usuario y Acciones -->
      <div class="flex items-center gap-space-sm sm:gap-space-md">
        <div class="hidden md:flex items-center gap-space-xs px-space-sm py-1.5 rounded-full bg-surface-container-low border border-border-subtle">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
          </span>
          <span class="font-data-mono text-label-sm text-text-secondary">API REST v1.0</span>
        </div>

        <!-- Tarjeta Usuario -->
        <div class="flex items-center gap-space-xs px-space-sm py-1.5 rounded-lg bg-surface-container border border-border-subtle">
          <span class="material-symbols-outlined text-primary text-[20px]">account_circle</span>
          <div class="flex flex-col text-left min-w-[100px]">
            <span class="font-label-sm text-label-sm text-on-surface leading-none font-semibold truncate max-w-[120px]">${userName}</span>
            <span class="font-data-mono text-label-sm text-text-tertiary leading-none text-[10px] mt-0.5">${roleName}</span>
          </div>
        </div>

        <!-- Botón Logout -->
        <button id="btn-logout" title="Cerrar Sesión" class="p-2 rounded-lg bg-surface-container text-text-secondary hover:text-status-danger hover:bg-surface-container-high border border-border-subtle transition-colors flex items-center justify-center">
          <span class="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Navegación Secundaria Móvil/Tablet -->
  <div class="xl:hidden bg-surface-base border-b border-border-subtle px-gutter-mobile py-2 overflow-x-auto">
    <nav class="flex items-center gap-1 min-w-max">
      ${navItems.map(item => {
        const isActive = currentPath === item.path || (item.path === '#/' && (currentPath === '' || currentPath === '#'));
        const activeClass = isActive
          ? 'bg-primary-container text-on-primary-container font-semibold'
          : 'text-text-secondary hover:bg-surface-container-high hover:text-text-primary';
        return `<a href="${item.path}" class="px-3 py-1.5 rounded text-body-sm font-title-md transition-colors flex items-center gap-1.5 ${activeClass}">
          <span class="material-symbols-outlined text-[16px]">${item.icon}</span>
          <span>${item.label}</span>
        </a>`;
      }).join('')}
    </nav>
  </div>`;
}

/**
 * Banner Institucional de Cabecera
 */
export function renderInstitutionalBanner(title = '', subtitle = '', badgeText = 'FASD 2026') {
  return `<div class="relative w-full rounded-xl overflow-hidden bg-surface-container border border-border-subtle shadow-xl mb-space-lg">
    <div class="absolute inset-0 pointer-events-none bg-gradient-to-r from-gov-gold-muted via-transparent to-surface-container-high/40 opacity-70"></div>
    <div class="relative z-10 p-space-md lg:p-space-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
      <div class="flex items-center gap-space-md">
        <div class="p-3 rounded-xl bg-surface-container-lowest border border-border-gold flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-primary text-[36px]">shield</span>
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-space-xs flex-wrap">
            <h1 class="font-headline-md text-headline-md text-text-primary tracking-tight font-bold">${title}</h1>
            <span class="px-space-xs py-0.5 rounded-full bg-primary/15 text-primary border border-border-gold font-data-mono text-label-sm uppercase tracking-wider">${badgeText}</span>
          </div>
          <p class="font-body-sm text-body-sm text-text-secondary mt-0.5">${subtitle}</p>
        </div>
      </div>
    </div>
  </div>`;
}

/**
 * Tabla Declarativa Genérica de Datos (DataTable)
 */
export function renderDataTable({
  columns = [],
  data = [],
  loading = false,
  count = 0,
  page = 1,
  pageSize = 10,
  emptyTitle = 'No hay registros',
  emptyIcon = 'folder_open',
  showActions = true,
  renderActions = null,
  idField = null,
}) {
  if (loading) {
    return `<div class="p-space-2xl bg-surface-card rounded-xl border border-border-subtle flex flex-col items-center justify-center min-h-[300px]">
      ${renderSpinner('lg')}
      <span class="font-body-sm text-body-sm text-text-secondary mt-4 font-data-mono">Cargando datos desde el servidor...</span>
    </div>`;
  }

  if (!data || data.length === 0) {
    return `<div class="bg-surface-card rounded-xl border border-border-subtle overflow-hidden">
      ${renderEmptyState({ title: emptyTitle, description: 'No se encontraron resultados en el servidor.', icon: emptyIcon })}
    </div>`;
  }

  return `<div class="bg-surface-card rounded-xl border border-border-subtle shadow-lg overflow-hidden flex flex-col">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-surface-container-lowest border-b border-border-subtle text-label-sm font-label-sm text-text-tertiary uppercase tracking-wider">
            ${columns.map(col => `<th class="px-4 py-3 font-semibold ${col.width || ''}">${col.header}</th>`).join('')}
            ${showActions ? `<th class="px-4 py-3 font-semibold text-right">Acciones</th>` : ''}
          </tr>
        </thead>
        <tbody class="divide-y divide-border-subtle/40 font-body-sm text-body-sm text-text-primary">
          ${data.map((row, idx) => {
            const rowId = idField ? row[idField] : (row.id || row.id_usuario || row.id_dependencia || row.id_role || row.id_permiso || row.id_tramite_servicio || row.id_agenda || row.id_ficha || row.id_accion || row.id_actividad || row.id_entregable || row.id_cobro || row.id_cronograma || row.id_fichas_has_accion);
            return `
            <tr class="hover:bg-surface-container-high/50 transition-colors">
              ${columns.map(col => {
                let cellValue = '';
                if (typeof col.render === 'function') {
                  cellValue = col.render(row, idx);
                } else if (col.field) {
                  const rawVal = getNestedValue(row, col.field);
                  cellValue = rawVal !== null && rawVal !== undefined ? String(rawVal) : '<span class="text-text-tertiary">-</span>';
                }
                return `<td class="px-4 py-3.5 align-middle">${cellValue}</td>`;
              }).join('')}
              ${showActions ? `
                <td class="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                  ${typeof renderActions === 'function' ? renderActions(row, idx) : `
                    <div class="inline-flex items-center justify-end gap-1">
                      <button
                        type="button"
                        data-action="edit"
                        data-id="${rowId}"
                        title="Editar registro"
                        class="p-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-border-subtle text-primary transition-colors"
                      >
                        <span class="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        type="button"
                        data-action="delete"
                        data-id="${rowId}"
                        title="Eliminar registro"
                        class="p-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-border-subtle text-status-danger transition-colors"
                      >
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  `}
                </td>
              ` : ''}
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Paginación integrada -->
    ${renderPagination({ count, page, pageSize })}
  </div>`;
}

/**
 * Toast / Sistema de Notificaciones Temporales
 */
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const isSuccess = type === 'success';
  const isError = type === 'error' || type === 'danger';
  const bgClass = isSuccess
    ? 'bg-status-success/90 border-status-success text-white'
    : isError
    ? 'bg-status-danger/90 border-status-danger text-white'
    : 'bg-primary border-primary text-white';

  const icon = isSuccess ? 'check_circle' : isError ? 'error' : 'info';

  toast.className = `pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all duration-300 transform translate-y-4 opacity-0 ${bgClass}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px] shrink-0 mt-0.5">${icon}</span>
    <span class="font-body-sm text-body-sm leading-snug font-medium flex-1">${message}</span>
    <button type="button" class="text-white/80 hover:text-white p-0.5" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined text-[16px]">close</span>
    </button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/**
 * Modal de Confirmación Genérico (para eliminaciones y acciones irreversibles)
 */
export function showConfirmModal({ title = '¿Está seguro?', message = 'Esta acción no se puede deshacer.', confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'danger', onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[9000] bg-surface-base/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in';

  const isDanger = variant === 'danger';

  overlay.innerHTML = `
    <div class="bg-surface-card border border-border-subtle shadow-2xl rounded-2xl max-w-md w-full p-6 flex flex-col gap-4 animate-scale-up">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl ${isDanger ? 'bg-status-danger/10 text-status-danger border border-status-danger/20' : 'bg-primary/10 text-primary border border-border-gold'}">
          <span class="material-symbols-outlined text-[28px]">${isDanger ? 'warning' : 'help'}</span>
        </div>
        <h3 class="font-headline-sm text-headline-sm font-bold text-text-primary">${title}</h3>
      </div>
      <p class="font-body-sm text-body-sm text-text-secondary leading-relaxed">${message}</p>
      <div class="flex items-center justify-end gap-3 pt-2">
        <button type="button" id="btn-modal-cancel" class="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-text-primary font-title-md text-body-sm font-semibold border border-border-subtle transition-colors">
          ${cancelText}
        </button>
        <button type="button" id="btn-modal-confirm" class="px-4 py-2 rounded-lg ${isDanger ? 'bg-status-danger text-white hover:bg-status-danger/90' : 'bg-primary text-on-primary hover:bg-primary/90'} font-title-md text-body-sm font-semibold transition-colors flex items-center gap-2">
          <span>${confirmText}</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const btnCancel = overlay.querySelector('#btn-modal-cancel');
  const btnConfirm = overlay.querySelector('#btn-modal-confirm');

  btnCancel.addEventListener('click', () => overlay.remove());
  btnConfirm.addEventListener('click', async () => {
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Procesando...`;
    try {
      if (typeof onConfirm === 'function') {
        await onConfirm();
      }
      overlay.remove();
    } catch (err) {
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = confirmText;
      showToast(err.message || 'Error al procesar la acción', 'error');
    }
  });
}

/**
 * Modal Genérico de Formulario (Alta / Edición de registros)
 */
export function showFormModal({
  title = 'Formulario',
  icon = 'edit_note',
  fields = [],
  initialData = {},
  submitText = 'Guardar Registro',
  onSubmit,
}) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[8000] bg-surface-base/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in';

  overlay.innerHTML = `
    <div class="bg-surface-card border border-border-gold shadow-2xl rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-scale-up">
      <!-- Modal Header -->
      <div class="p-space-md border-b border-border-subtle flex items-center justify-between bg-surface-container-lowest">
        <div class="flex items-center gap-space-xs">
          <span class="material-symbols-outlined text-primary text-[24px]">${icon}</span>
          <h3 class="font-headline-sm text-headline-sm font-bold text-text-primary">${title}</h3>
        </div>
        <button type="button" id="btn-close-modal" class="p-1 rounded-lg bg-surface-container text-text-secondary hover:text-text-primary">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Server Error Banner Container -->
      <div id="modal-error-banner" class="hidden px-space-md pt-space-md">
        <div class="p-3 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger font-body-sm text-xs leading-relaxed flex items-start gap-2">
          <span class="material-symbols-outlined text-[18px] shrink-0">error</span>
          <span id="modal-error-text"></span>
        </div>
      </div>

      <!-- Form Body -->
      <form id="modal-form" class="p-space-md overflow-y-auto flex-1 flex flex-col gap-space-md">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          ${fields.map(f => {
            const val = initialData[f.name] !== undefined && initialData[f.name] !== null ? initialData[f.name] : (f.defaultValue ?? '');
            const colSpan = f.fullWidth ? 'md:col-span-2' : 'md:col-span-1';

            if (f.type === 'select') {
              return `
                <div class="${colSpan} flex flex-col gap-1">
                  <label class="font-label-sm text-label-sm text-text-secondary font-semibold">${f.label} ${f.required ? '<span class="text-status-danger">*</span>' : ''}</label>
                  <select name="${f.name}" ${f.required ? 'required' : ''} class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm focus:border-primary focus:outline-none">
                    <option value="">-- Seleccionar --</option>
                    ${(f.options || []).map(opt => {
                      const optVal = typeof opt === 'object' ? opt.value : opt;
                      const optLbl = typeof opt === 'object' ? opt.label : opt;
                      const selected = String(val) === String(optVal) ? 'selected' : '';
                      return `<option value="${optVal}" ${selected}>${optLbl}</option>`;
                    }).join('')}
                  </select>
                  ${f.helpText ? `<span class="font-label-sm text-[11px] text-text-tertiary">${f.helpText}</span>` : ''}
                  <span class="field-error text-status-danger font-label-sm text-[11px] hidden"></span>
                </div>
              `;
            }

            if (f.type === 'textarea') {
              return `
                <div class="${colSpan} flex flex-col gap-1">
                  <label class="font-label-sm text-label-sm text-text-secondary font-semibold">${f.label} ${f.required ? '<span class="text-status-danger">*</span>' : ''}</label>
                  <textarea name="${f.name}" rows="${f.rows || 3}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm focus:border-primary focus:outline-none">${val}</textarea>
                  ${f.helpText ? `<span class="font-label-sm text-[11px] text-text-tertiary">${f.helpText}</span>` : ''}
                  <span class="field-error text-status-danger font-label-sm text-[11px] hidden"></span>
                </div>
              `;
            }

            if (f.type === 'checkbox' || f.type === 'boolean') {
              const checked = Boolean(val) ? 'checked' : '';
              return `
                <div class="${colSpan} flex items-center gap-3 pt-4">
                  <input type="checkbox" name="${f.name}" id="field-${f.name}" ${checked} class="w-5 h-5 accent-primary rounded cursor-pointer" />
                  <label for="field-${f.name}" class="font-body-sm text-body-sm text-text-primary font-semibold cursor-pointer">${f.label}</label>
                </div>
              `;
            }

            return `
              <div class="${colSpan} flex flex-col gap-1">
                <label class="font-label-sm text-label-sm text-text-secondary font-semibold">${f.label} ${f.required ? '<span class="text-status-danger">*</span>' : ''}</label>
                <input
                  type="${f.type || 'text'}"
                  name="${f.name}"
                  value="${val}"
                  ${f.required ? 'required' : ''}
                  ${f.min !== undefined ? `min="${f.min}"` : ''}
                  ${f.max !== undefined ? `max="${f.max}"` : ''}
                  placeholder="${f.placeholder || ''}"
                  class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm focus:border-primary focus:outline-none"
                />
                ${f.helpText ? `<span class="font-label-sm text-[11px] text-text-tertiary">${f.helpText}</span>` : ''}
                <span class="field-error text-status-danger font-label-sm text-[11px] hidden"></span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Modal Footer -->
        <div class="mt-4 pt-4 border-t border-border-subtle flex items-center justify-end gap-space-sm">
          <button type="button" id="btn-cancel-form" class="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-text-primary font-title-md text-body-sm font-semibold border border-border-subtle transition-colors">
            Cancelar
          </button>
          <button type="submit" id="btn-submit-form" class="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2">
            <span>${submitText}</span>
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const form = overlay.querySelector('#modal-form');
  const btnClose = overlay.querySelector('#btn-close-modal');
  const btnCancel = overlay.querySelector('#btn-cancel-form');
  const btnSubmit = overlay.querySelector('#btn-submit-form');
  const errorBanner = overlay.querySelector('#modal-error-banner');
  const errorText = overlay.querySelector('#modal-error-text');

  const close = () => overlay.remove();
  btnClose.addEventListener('click', close);
  btnCancel.addEventListener('click', close);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBanner.classList.add('hidden');
    form.querySelectorAll('.field-error').forEach(el => el.classList.add('hidden'));

    const formData = new FormData(form);
    const payload = {};

    fields.forEach(f => {
      if (f.type === 'checkbox' || f.type === 'boolean') {
        payload[f.name] = formData.has(f.name);
      } else if (f.type === 'number') {
        const val = formData.get(f.name);
        payload[f.name] = val !== '' && val !== null ? Number(val) : null;
      } else {
        const val = formData.get(f.name);
        payload[f.name] = val !== '' && val !== null ? val : null;
      }
    });

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Guardando...`;

    try {
      if (typeof onSubmit === 'function') {
        await onSubmit(payload);
      }
      close();
      showToast('Registro guardado exitosamente', 'success');
    } catch (err) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<span>${submitText}</span>`;

      // Mapear errores de validación DRF a los campos si existen
      const msg = err.message || 'Error al procesar el formulario';
      errorText.textContent = msg;
      errorBanner.classList.remove('hidden');

      // Intentar resaltar campos erróneos si viene en formato "campo: mensaje"
      if (msg.includes('|')) {
        const parts = msg.split('|');
        parts.forEach(p => {
          const [fieldKey, fieldMsg] = p.split(':').map(s => s.trim());
          const inputEl = form.querySelector(`[name="${fieldKey}"]`);
          if (inputEl) {
            const errSpan = inputEl.parentElement.querySelector('.field-error');
            if (errSpan) {
              errSpan.textContent = fieldMsg;
              errSpan.classList.remove('hidden');
            }
          }
        });
      }
    }
  });
}
