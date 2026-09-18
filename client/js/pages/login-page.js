import { api } from '../services/api.js';
import { store } from '../state.js';
import { renderInput, renderButton, renderSpinner } from '../components/atoms.js';

export async function renderLoginPage(container) {
  let isSubmitting = false;
  let errorMessage = '';

  function buildHtml() {
    return `<div class="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <!-- Background Ambient Glow -->
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="w-full max-w-md bg-surface-card border border-border-prominent rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative z-10">
        <!-- Logo & Header -->
        <div class="flex flex-col items-center text-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-surface-container-lowest border border-border-gold flex items-center justify-center shadow-lg mb-4">
            <span class="material-symbols-outlined text-primary text-[36px]">account_balance</span>
          </div>
          <h1 class="font-headline-md text-headline-md text-text-primary tracking-tight font-bold">
            Tuxtla Digital
          </h1>
          <p class="font-body-sm text-body-sm text-text-secondary mt-1">
            Agenda de Simplificación y Digitalización Regulatoria
          </p>
          <span class="mt-2 px-3 py-0.5 rounded-full bg-primary/15 text-primary border border-border-gold font-data-mono text-label-sm uppercase tracking-wider">
            Acceso Institucional FASD 2026
          </span>
        </div>

        <!-- Error Message Banner -->
        ${errorMessage ? `<div class="mb-6 p-4 rounded-xl bg-status-danger/15 border border-status-danger/30 text-status-danger font-body-sm text-body-sm flex items-start gap-3">
          <span class="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
          <div>
            <strong class="font-semibold block">Error de autenticación</strong>
            <span>${errorMessage}</span>
          </div>
        </div>` : ''}

        <!-- Formulario -->
        <form id="form-login" class="flex flex-col gap-5" novalidate>
          ${renderInput({
            id: 'correo_electronico',
            label: 'Correo Electrónico Institucional',
            type: 'email',
            placeholder: 'usuario@ejemplo.gob.mx',
            required: true,
            icon: 'mail',
            disabled: isSubmitting,
          })}

          ${renderInput({
            id: 'password',
            label: 'Contraseña de Acceso',
            type: 'password',
            placeholder: '••••••••••••',
            required: true,
            icon: 'lock',
            disabled: isSubmitting,
          })}

          <div class="pt-2">
            ${renderButton({
              label: isSubmitting ? 'Verificando credenciales...' : 'Iniciar Sesión',
              icon: isSubmitting ? '' : 'login',
              variant: 'primary',
              disabled: isSubmitting,
              type: 'submit',
              className: 'w-full py-3 text-base justify-center',
            })}
          </div>
        </form>

        <div class="mt-8 pt-6 border-t border-border-subtle text-center flex flex-col gap-1">
          <span class="font-label-sm text-label-sm text-text-tertiary">
            H. Ayuntamiento de Tuxtla Gutiérrez, Chiapas
          </span>
          <span class="font-data-mono text-label-sm text-text-tertiary text-[10px]">
            Ley Nacional para Eliminar Trámites Burocráticos (LNETB)
          </span>
        </div>
      </div>
    </div>`;
  }

  function update() {
    container.innerHTML = buildHtml();
    attachEvents();
  }

  function attachEvents() {
    const form = container.querySelector('#form-login');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMessage = '';

      const correoInput = container.querySelector('#correo_electronico');
      const passwordInput = container.querySelector('#password');

      const correo = correoInput?.value.trim();
      const password = passwordInput?.value.trim();

      if (!correo || !password) {
        errorMessage = 'Por favor complete todos los campos obligatorios.';
        update();
        return;
      }

      try {
        isSubmitting = true;
        update();

        const data = await api.login(correo, password);
        store.setUser(data.user);
        store.addNotification('Sesión iniciada correctamente', 'success');
        window.location.hash = '#/';
      } catch (err) {
        isSubmitting = false;
        errorMessage = err.message || 'Credenciales inválidas. Verifique su correo y contraseña.';
        update();
      }
    });
  }

  update();
}
