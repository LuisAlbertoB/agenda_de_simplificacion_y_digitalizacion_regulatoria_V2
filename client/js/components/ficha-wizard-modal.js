import { agendasService, tramitesService, accionesService, actividadesService } from '../services/crud-factory.js';
import { api } from '../services/api.js';
import { showToast, showFormModal } from './organisms.js';
import { renderSpinner } from './atoms.js';

export async function showFichaWizardModal({ onComplete }) {
  let step = 1;
  let loadingCatalogs = true;

  let agendasList = [];
  let tramitesList = [];
  let accionesList = [];
  let actividadesList = [];

  let wizardData = {
    id_agenda_id: '',
    id_tramite_servicio_id: '',
    solicitud_tipo: 0,
    plazo_maximo_resolucion_dias: 15,
    is_dia_habil_o_inhabil: true,
    vigencia_del_documento_obtenido: '1 Año',
    poblacion_prioritaria_atencion_preferente: false,
    solicitudes_recibidas_semestre_anterior: 100,
    resoluciones_positivas: 95,
    areas_administrativas_interfieren: 2,
    habile_ventanilla_presencial: true,
    habile_portal_web_municipal: false,
    habile_app_mobile: false,
    habile_linea_telefonica: false,
    cuellos_de_botella: '',
    requisitos_sin_valor: '',
    propuestas_de_mejora: '',
    regulacion_fundamenta_existencia_tramite: '',
    fundamento_en_ley_de_ingresos: '',
    nivel_digitalizacion_actual: 1,
    id_accion_ids: [],
    cronograma_items: [],
  };

  async function loadCatalogs() {
    loadingCatalogs = true;
    try {
      const [resAg, resTr, resAcc, resAct] = await Promise.all([
        agendasService.list({ page_size: 100 }),
        tramitesService.list({ page_size: 100 }),
        accionesService.list({ page_size: 100 }),
        actividadesService.list({ page_size: 100 }),
      ]);
      agendasList = resAg.results || [];
      tramitesList = resTr.results || [];
      accionesList = resAcc.results || [];
      actividadesList = resAct.results || [];
    } catch (err) {
      console.error('Error al cargar catálogos en asistente:', err);
      showToast('Error al cargar catálogos del servidor', 'error');
    } finally {
      loadingCatalogs = false;
    }
  }

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[8000] bg-surface-base/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in';

  function renderWizard() {
    overlay.innerHTML = `
      <div class="bg-surface-card border border-border-gold shadow-2xl rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-scale-up">
        <!-- Header -->
        <div class="p-space-md border-b border-border-subtle bg-surface-container-lowest flex items-center justify-between">
          <div class="flex items-center gap-space-xs">
            <div class="p-2 rounded-lg bg-primary/10 text-primary border border-border-gold">
              <span class="material-symbols-outlined text-[24px]">auto_awesome</span>
            </div>
            <div>
              <h3 class="font-headline-sm text-headline-sm font-bold text-text-primary">Asistente de Registro de Ficha (FASD)</h3>
              <p class="font-body-sm text-xs text-text-secondary">Registro guiado en 4 pasos con generación dinámica de cronograma</p>
            </div>
          </div>
          <button type="button" id="btn-close-wizard" class="p-1.5 rounded-lg bg-surface-container text-text-secondary hover:text-text-primary">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Stepper Indicator -->
        <div class="px-space-md py-3 bg-surface-container-low border-b border-border-subtle flex items-center justify-between gap-2 overflow-x-auto">
          ${[
            { stepNum: 1, label: '1. Prerrequisitos', icon: 'verified' },
            { stepNum: 2, label: '2. Datos Generales', icon: 'description' },
            { stepNum: 3, label: '3. Acciones LNETB', icon: 'checklist' },
            { stepNum: 4, label: '4. Cronograma', icon: 'calendar_month' },
          ].map(s => {
            const isActive = step === s.stepNum;
            const isDone = step > s.stepNum;
            const bgClass = isActive
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : isDone
              ? 'bg-primary/20 text-primary font-semibold'
              : 'bg-surface-container text-text-tertiary';
            return `
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-title-md transition-all ${bgClass}">
                <span class="material-symbols-outlined text-[16px]">${isDone ? 'check_circle' : s.icon}</span>
                <span>${s.label}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Error Banner -->
        <div id="wizard-error-banner" class="hidden px-space-md pt-space-md">
          <div class="p-3 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger font-body-sm text-xs leading-relaxed flex items-start gap-2">
            <span class="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span id="wizard-error-text"></span>
          </div>
        </div>

        <!-- Step Content Body -->
        <div class="p-space-md overflow-y-auto flex-1">
          ${loadingCatalogs ? `
            <div class="py-16 text-center flex flex-col items-center justify-center">
              ${renderSpinner('lg')}
              <span class="font-data-mono text-body-sm text-text-secondary mt-4">Cargando catálogos del sistema...</span>
            </div>
          ` : renderStepBody()}
        </div>

        <!-- Footer Navigation Controls -->
        <div class="p-space-md border-t border-border-subtle bg-surface-container-lowest flex items-center justify-between gap-space-md">
          <button type="button" id="btn-prev-step" ${step === 1 ? 'disabled' : ''} class="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-text-primary font-title-md text-body-sm font-semibold border border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Anterior</span>
          </button>

          <div class="flex items-center gap-2">
            <button type="button" id="btn-cancel-wizard" class="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-text-primary font-title-md text-body-sm font-semibold border border-border-subtle transition-colors">
              Cancelar
            </button>
            ${step < 4 ? `
              <button type="button" id="btn-next-step" class="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-1">
                <span>Siguiente</span>
                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            ` : `
              <button type="button" id="btn-submit-wizard" class="px-5 py-2 rounded-lg bg-tertiary hover:bg-tertiary/90 text-on-tertiary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">task_alt</span>
                <span>Finalizar y Guardar Ficha</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    attachWizardEvents();
  }

  function renderStepBody() {
    if (step === 1) {
      return `
        <div class="flex flex-col gap-space-md">
          <div class="p-4 rounded-xl bg-primary/10 border border-border-gold text-primary font-body-sm text-xs leading-relaxed flex items-start gap-3">
            <span class="material-symbols-outlined text-[24px] shrink-0">info</span>
            <div>
              <strong class="font-bold block text-sm mb-0.5">Paso 1: Verificación de Prerrequisitos</strong>
              Para registrar una ficha diagnóstica es obligatorio contar con una <strong>Agenda Semestral</strong> y un <strong>Trámite/Servicio</strong> previamente registrados. Si no existen, puedes crearlos rápidamente desde esta pantalla.
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-2">
            <!-- Selección / Alta de Agenda -->
            <div class="p-4 rounded-xl bg-surface-container border border-border-subtle flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <label class="font-label-sm text-label-sm font-bold text-text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
                  1.1 Seleccionar Agenda Regulatoria *
                </label>
                <button type="button" id="btn-quick-add-agenda" class="px-2.5 py-1 rounded bg-primary/15 text-primary border border-border-gold hover:bg-primary/25 font-title-md text-xs font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">add</span>
                  + Nueva Agenda
                </button>
              </div>

              ${agendasList.length === 0 ? `
                <p class="font-body-sm text-xs text-status-danger italic p-3 rounded bg-status-danger/10 border border-status-danger/20">
                  No hay agendas registradas en el sistema. Haz clic en "+ Nueva Agenda" para crear una.
                </p>
              ` : `
                <select id="select-agenda" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm focus:border-primary focus:outline-none">
                  <option value="">-- Seleccionar Agenda --</option>
                  ${agendasList.map(a => `
                    <option value="${a.id_agenda}" ${String(wizardData.id_agenda_id) === String(a.id_agenda) ? 'selected' : ''}>
                      #AG-${a.id_agenda} | ${a.id_dependencia?.clave || 'Dep'} (${a.anio} - Semestre ${a.semestre ? '1' : '2'})
                    </option>
                  `).join('')}
                </select>
              `}
            </div>

            <!-- Selección / Alta de Trámite -->
            <div class="p-4 rounded-xl bg-surface-container border border-border-subtle flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <label class="font-label-sm text-label-sm font-bold text-text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-secondary text-[20px]">list_alt</span>
                  1.2 Seleccionar Trámite o Servicio *
                </label>
                <button type="button" id="btn-quick-add-tramite" class="px-2.5 py-1 rounded bg-secondary/15 text-secondary border border-border-tech hover:bg-secondary/25 font-title-md text-xs font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">add</span>
                  + Nuevo Trámite
                </button>
              </div>

              ${tramitesList.length === 0 ? `
                <p class="font-body-sm text-xs text-status-danger italic p-3 rounded bg-status-danger/10 border border-status-danger/20">
                  No hay trámites registrados en el catálogo. Haz clic en "+ Nuevo Trámite" para crear uno.
                </p>
              ` : `
                <select id="select-tramite" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm focus:border-primary focus:outline-none">
                  <option value="">-- Seleccionar Trámite/Servicio --</option>
                  ${tramitesList.map(t => `
                    <option value="${t.id_tramite_servicio}" ${String(wizardData.id_tramite_servicio_id) === String(t.id_tramite_servicio) ? 'selected' : ''}>
                      ${t.clave} - ${t.nombre_oficial}
                    </option>
                  `).join('')}
                </select>
              `}
            </div>
          </div>
        </div>
      `;
    }

    if (step === 2) {
      return `
        <div class="flex flex-col gap-space-md">
          <h4 class="font-title-md text-title-md font-bold text-text-primary flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">description</span>
            Paso 2: Diagnóstico Operativo y Fundamento Jurídico
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Tipo de Solicitud *</label>
              <select id="field-solicitud-tipo" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm">
                <option value="0" ${Number(wizardData.solicitud_tipo) === 0 ? 'selected' : ''}>0 = Nueva apertura</option>
                <option value="1" ${Number(wizardData.solicitud_tipo) === 1 ? 'selected' : ''}>1 = Renovación</option>
                <option value="2" ${Number(wizardData.solicitud_tipo) === 2 ? 'selected' : ''}>2 = Modificación</option>
                <option value="3" ${Number(wizardData.solicitud_tipo) === 3 ? 'selected' : ''}>3 = Baja</option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Plazo Máximo de Resolución (Días) *</label>
              <input type="number" min="0" id="field-plazo" value="${wizardData.plazo_maximo_resolucion_dias ?? 15}" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" />
            </div>

            <div class="flex items-center gap-3 pt-2">
              <input type="checkbox" id="field-habil" ${wizardData.is_dia_habil_o_inhabil ? 'checked' : ''} class="w-5 h-5 accent-primary rounded cursor-pointer" />
              <label for="field-habil" class="font-body-sm text-xs text-text-primary font-semibold cursor-pointer">¿Días Hábiles?</label>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <input type="checkbox" id="field-vulnerable" ${wizardData.poblacion_prioritaria_atencion_preferente ? 'checked' : ''} class="w-5 h-5 accent-primary rounded cursor-pointer" />
              <label for="field-vulnerable" class="font-body-sm text-xs text-text-primary font-semibold cursor-pointer">¿Atención a Población Vulnerable / Prioritaria?</label>
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Solicitudes Recibidas (Semestre Anterior)</label>
              <input type="number" min="0" id="field-solicitudes" value="${wizardData.solicitudes_recibidas_semestre_anterior ?? 0}" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Resoluciones Positivas (Semestre Anterior)</label>
              <input type="number" min="0" id="field-resoluciones" value="${wizardData.resoluciones_positivas ?? 0}" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" />
            </div>

            <div class="md:col-span-2 flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Regulación que Fundamenta la Existencia del Trámite</label>
              <textarea id="field-regulacion" rows="2" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" placeholder="ej. Reglamento Municipal de Construcciones Art 15">${wizardData.regulacion_fundamenta_existencia_tramite || ''}</textarea>
            </div>

            <div class="md:col-span-2 flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Fundamento en Ley de Ingresos</label>
              <textarea id="field-ley-ingresos" rows="2" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" placeholder="ej. Ley de Ingresos Municipal Art 45 Fracc I">${wizardData.fundamento_en_ley_de_ingresos || ''}</textarea>
            </div>
          </div>
        </div>
      `;
    }

    if (step === 3) {
      return `
        <div class="flex flex-col gap-space-md">
          <div>
            <h4 class="font-title-md text-title-md font-bold text-text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">checklist</span>
              Paso 3: Selección de Acciones de Simplificación y Digitalización (LNETB)
            </h4>
            <p class="font-body-sm text-xs text-text-secondary mt-1">Selecciona una o más acciones regulatorias del catálogo oficial para incorporarlas a la ficha.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
            ${accionesList.map(ac => {
              const isChecked = wizardData.id_accion_ids.includes(ac.id_accion);
              const isSimp = ac.simplificacion_o_digitalizacion === true;
              return `
                <div class="p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${isChecked ? 'bg-primary/10 border-border-gold shadow-sm' : 'bg-surface-container border-border-subtle hover:border-border-gold/50'}" onclick="document.getElementById('chk-acc-${ac.id_accion}').click()">
                  <input type="checkbox" id="chk-acc-${ac.id_accion}" data-accion-id="${ac.id_accion}" ${isChecked ? 'checked' : ''} class="w-5 h-5 accent-primary rounded cursor-pointer mt-0.5" onclick="event.stopPropagation()" />
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-data-mono font-bold text-xs text-primary">${ac.clave}</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-data-mono font-bold ${isSimp ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}">
                        ${isSimp ? 'SIMPLIFICACIÓN' : 'DIGITALIZACIÓN'}
                      </span>
                    </div>
                    <span class="font-title-md text-xs font-bold text-text-primary">${ac.titulo}</span>
                    <p class="font-body-sm text-[11px] text-text-tertiary line-clamp-2">${ac.descripcion || ''}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (step === 4) {
      const selectedAccionesObjects = accionesList.filter(ac => wizardData.id_accion_ids.includes(ac.id_accion));
      return `
        <div class="flex flex-col gap-space-md">
          <div>
            <h4 class="font-title-md text-title-md font-bold text-text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">calendar_month</span>
              Paso 4: Generación Dinámica del Cronograma de Actividades
            </h4>
            <p class="font-body-sm text-xs text-text-secondary mt-1">Configura el rango de meses del semestre (0 a 6) para cada acción seleccionada.</p>
          </div>

          ${selectedAccionesObjects.length === 0 ? `
            <div class="p-4 rounded-xl bg-status-warning/10 border border-status-warning/30 text-status-warning text-xs text-center">
              No has seleccionado ninguna acción en el Paso 3. Regresa al paso anterior para marcar al menos una acción.
            </div>
          ` : `
            <div class="bg-surface-card rounded-xl border border-border-subtle overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-surface-container-lowest border-b border-border-subtle text-xs font-semibold text-text-tertiary uppercase">
                    <th class="px-4 py-3">Acción LNETB</th>
                    <th class="px-4 py-3">Mes Inicio (0..6)</th>
                    <th class="px-4 py-3">Mes Fin (0..6)</th>
                    <th class="px-4 py-3">Periodo Semestral</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-subtle/40 font-body-sm text-xs">
                  ${selectedAccionesObjects.map(ac => {
                    const cItem = wizardData.cronograma_items.find(ci => ci.id_accion_id === ac.id_accion) || { num_mes_inicio_plazo: 1, num_mes_final_plazo: 6 };
                    return `
                      <tr>
                        <td class="px-4 py-3 font-semibold text-text-primary">
                          <span class="font-data-mono text-primary font-bold block">${ac.clave}</span>
                          <span>${ac.titulo}</span>
                        </td>
                        <td class="px-4 py-3">
                          <select data-crono-inicio="${ac.id_accion}" class="px-2.5 py-1.5 rounded bg-surface-recessed border border-border-subtle text-text-primary">
                            ${[0, 1, 2, 3, 4, 5, 6].map(m => `<option value="${m}" ${Number(cItem.num_mes_inicio_plazo) === m ? 'selected' : ''}>Mes ${m}</option>`).join('')}
                          </select>
                        </td>
                        <td class="px-4 py-3">
                          <select data-crono-final="${ac.id_accion}" class="px-2.5 py-1.5 rounded bg-surface-recessed border border-border-subtle text-text-primary">
                            ${[0, 1, 2, 3, 4, 5, 6].map(m => `<option value="${m}" ${Number(cItem.num_mes_final_plazo) === m ? 'selected' : ''}>Mes ${m}</option>`).join('')}
                          </select>
                        </td>
                        <td class="px-4 py-3">
                          <span class="px-2.5 py-1 rounded bg-surface-container border border-border-gold font-data-mono font-bold text-primary">
                            Semestre 1 (M${cItem.num_mes_inicio_plazo}–M${cItem.num_mes_final_plazo})
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    }
  }

  function attachWizardEvents() {
    const btnClose = overlay.querySelector('#btn-close-wizard');
    const btnCancel = overlay.querySelector('#btn-cancel-wizard');
    const btnPrev = overlay.querySelector('#btn-prev-step');
    const btnNext = overlay.querySelector('#btn-next-step');
    const btnSubmit = overlay.querySelector('#btn-submit-wizard');
    const errorBanner = overlay.querySelector('#wizard-error-banner');
    const errorText = overlay.querySelector('#wizard-error-text');

    const close = () => overlay.remove();
    if (btnClose) btnClose.addEventListener('click', close);
    if (btnCancel) btnCancel.addEventListener('click', close);

    if (step === 1) {
      const selectAg = overlay.querySelector('#select-agenda');
      const selectTr = overlay.querySelector('#select-tramite');
      if (selectAg) selectAg.addEventListener('change', (e) => wizardData.id_agenda_id = Number(e.target.value));
      if (selectTr) selectTr.addEventListener('change', (e) => wizardData.id_tramite_servicio_id = Number(e.target.value));

      const btnQuickAg = overlay.querySelector('#btn-quick-add-agenda');
      const btnQuickTr = overlay.querySelector('#btn-quick-add-tramite');

      if (btnQuickAg) {
        btnQuickAg.addEventListener('click', () => {
          showFormModal({
            title: 'Creación Rápida de Agenda',
            icon: 'calendar_today',
            fields: [
              { name: 'anio', label: 'Año', type: 'number', required: true, defaultValue: 2026 },
              { name: 'semestre', label: 'Semestre', type: 'select', required: true, options: [{ value: 'true', label: '1er Semestre' }, { value: 'false', label: '2do Semestre' }] },
              { name: 'unidad_administrativa', label: 'Unidad Administrativa', type: 'text', required: true },
            ],
            submitText: 'Crear Agenda',
            onSubmit: async (payload) => {
              payload.semestre = payload.semestre === 'true';
              const created = await agendasService.create(payload);
              showToast('Agenda creada exitosamente', 'success');
              await loadCatalogs();
              wizardData.id_agenda_id = created.id_agenda;
              renderWizard();
            }
          });
        });
      }

      if (btnQuickTr) {
        btnQuickTr.addEventListener('click', () => {
          showFormModal({
            title: 'Creación Rápida de Trámite',
            icon: 'list_alt',
            fields: [
              { name: 'clave', label: 'Clave Única', type: 'text', required: true },
              { name: 'nombre_oficial', label: 'Nombre Oficial', type: 'text', required: true, fullWidth: true },
            ],
            submitText: 'Crear Trámite',
            onSubmit: async (payload) => {
              const created = await tramitesService.create(payload);
              showToast('Trámite creado exitosamente', 'success');
              await loadCatalogs();
              wizardData.id_tramite_servicio_id = created.id_tramite_servicio;
              renderWizard();
            }
          });
        });
      }
    }

    if (step === 2) {
      const fieldSol = overlay.querySelector('#field-solicitud-tipo');
      const fieldPlazo = overlay.querySelector('#field-plazo');
      const fieldHabil = overlay.querySelector('#field-habil');
      const fieldVuln = overlay.querySelector('#field-vulnerable');
      const fieldSolRec = overlay.querySelector('#field-solicitudes');
      const fieldResPos = overlay.querySelector('#field-resoluciones');
      const fieldReg = overlay.querySelector('#field-regulacion');
      const fieldLey = overlay.querySelector('#field-ley-ingresos');

      if (fieldSol) fieldSol.addEventListener('change', (e) => wizardData.solicitud_tipo = Number(e.target.value));
      if (fieldPlazo) fieldPlazo.addEventListener('change', (e) => wizardData.plazo_maximo_resolucion_dias = Number(e.target.value));
      if (fieldHabil) fieldHabil.addEventListener('change', (e) => wizardData.is_dia_habil_o_inhabil = e.target.checked);
      if (fieldVuln) fieldVuln.addEventListener('change', (e) => wizardData.poblacion_prioritaria_atencion_preferente = e.target.checked);
      if (fieldSolRec) fieldSolRec.addEventListener('change', (e) => wizardData.solicitudes_recibidas_semestre_anterior = Number(e.target.value));
      if (fieldResPos) fieldResPos.addEventListener('change', (e) => wizardData.resoluciones_positivas = Number(e.target.value));
      if (fieldReg) fieldReg.addEventListener('change', (e) => wizardData.regulacion_fundamenta_existencia_tramite = e.target.value);
      if (fieldLey) fieldLey.addEventListener('change', (e) => wizardData.fundamento_en_ley_de_ingresos = e.target.value);
    }

    if (step === 3) {
      overlay.querySelectorAll('[data-accion-id]').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const accId = Number(e.target.dataset.accionId);
          if (e.target.checked) {
            if (!wizardData.id_accion_ids.includes(accId)) {
              wizardData.id_accion_ids.push(accId);
              wizardData.cronograma_items.push({ id_accion_id: accId, num_mes_inicio_plazo: 1, num_mes_final_plazo: 6 });
            }
          } else {
            wizardData.id_accion_ids = wizardData.id_accion_ids.filter(id => id !== accId);
            wizardData.cronograma_items = wizardData.cronograma_items.filter(ci => ci.id_accion_id !== accId);
          }
        });
      });
    }

    if (step === 4) {
      overlay.querySelectorAll('[data-crono-inicio]').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const accId = Number(e.target.dataset.cronoInicio);
          const cItem = wizardData.cronograma_items.find(ci => ci.id_accion_id === accId);
          if (cItem) cItem.num_mes_inicio_plazo = Number(e.target.value);
        });
      });

      overlay.querySelectorAll('[data-crono-final]').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const accId = Number(e.target.dataset.cronoFinal);
          const cItem = wizardData.cronograma_items.find(ci => ci.id_accion_id === accId);
          if (cItem) cItem.num_mes_final_plazo = Number(e.target.value);
        });
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (step > 1) {
          step--;
          renderWizard();
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        errorBanner.classList.add('hidden');
        if (step === 1) {
          if (!wizardData.id_agenda_id) {
            errorText.textContent = 'Debe seleccionar una Agenda Regulatoria para continuar.';
            errorBanner.classList.remove('hidden');
            return;
          }
          if (!wizardData.id_tramite_servicio_id) {
            errorText.textContent = 'Debe seleccionar un Trámite o Servicio para continuar.';
            errorBanner.classList.remove('hidden');
            return;
          }
        }
        step++;
        renderWizard();
      });
    }

    if (btnSubmit) {
      btnSubmit.addEventListener('click', async () => {
        errorBanner.classList.add('hidden');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Guardando...`;

        try {
          await api.post('/fichas/registrar-con-cronograma/', wizardData);
          showToast('Ficha y Cronograma registrados exitosamente', 'success');
          close();
          if (typeof onComplete === 'function') {
            await onComplete();
          }
        } catch (err) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<span class="material-symbols-outlined text-[18px]">task_alt</span><span>Finalizar y Guardar Ficha</span>`;
          errorText.textContent = err.message || 'Error al guardar la ficha transaccional';
          errorBanner.classList.remove('hidden');
        }
      });
    }
  }

  document.body.appendChild(overlay);
  await loadCatalogs();
  renderWizard();
}
