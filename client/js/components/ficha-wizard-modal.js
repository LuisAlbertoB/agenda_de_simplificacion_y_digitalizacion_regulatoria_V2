import { agendasService, tramitesService, accionesService, actividadesService, dependenciasService } from '../services/crud-factory.js';
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
  let dependenciasList = [];

  let wizardData = {
    id_agenda_id: '',
    id_tramite_servicio_id: '',
    
    // Apartado 2: Datos Generales
    solicitud_tipo: 0, // 0: No tiene, 1: Escrito libre, 2: Formato específico, 3: Formato único
    plazo_maximo_resolucion_dias: 15,
    is_dia_habil_o_inhabil: true,
    vigencia_del_documento_obtenido: '1 Año',
    conceptos_con_fundamento: ['tramite_o_servicio', 'requisitos', 'plazo_de_resolucion', 'vigencia'],
    numero_requisitos: 5,
    solicitudes_recibidas_semestre_anterior: 100,
    resoluciones_positivas: 95,
    cantidad_personas_intervienen: 3,
    areas_administrativas_interfieren: 2,
    poblacion_prioritaria_atencion_preferente: false,

    // Apartado 3: Fundamento Jurídico
    regulacion_fundamenta_existencia_tramite: '',
    regulacion_faculta_organo: '',
    fundamento_en_ley_de_ingresos: '',
    unidad_de_cobro: 'UMAs', // UMAs, Moneda Nacional, Gratuito
    importe_tramite: '0.00',
    tipo_tramite_dirigido: 'Ciudadano', // Ciudadano, Empresarial, Ambos
    formas_de_pago: ['caja_propia', 'bancos'], // caja_propia, bancos, banca_electronica, otros

    // Apartado 4: Análisis de la Operación (Clave-Valor)
    analisis_requisitos_json: [
      { requisito: 'Identificación Oficial Vigente', observacion: 'Requisito estandarizado sin inconvenientes' },
      { requisito: 'Comprobante de Domicilio', observacion: 'Se sugiere aceptar versión digital' }
    ],

    // Apartado 5: Matriz de Diagnóstico
    nivel_digitalizacion_actual: 1, // 1 a 4

    // Apartado 6: Hallazgos y Oportunidades
    cuellos_de_botella: '',
    requisitos_sin_valor: '',
    propuestas_de_mejora: '',

    // Apartado 7 & 8: Acciones LNETB & Cronograma
    id_accion_ids: [],
    cronograma_items: [],
  };

  async function loadCatalogs() {
    loadingCatalogs = true;
    try {
      const [resAg, resTr, resAcc, resAct, resDep] = await Promise.all([
        agendasService.list({ page_size: 100 }),
        tramitesService.list({ page_size: 100 }),
        accionesService.list({ page_size: 100 }),
        actividadesService.list({ page_size: 100 }),
        dependenciasService.list({ page_size: 100 }),
      ]);
      agendasList = resAg.results || [];
      tramitesList = resTr.results || [];
      accionesList = resAcc.results || [];
      actividadesList = resAct.results || [];
      dependenciasList = (resDep.results || []).map(d => ({ value: d.id_dependencia, label: `${d.clave} - ${d.nombre_oficial}` }));
    } catch (err) {
      console.error('Error al cargar catálogos en asistente:', err);
      showToast('Error al cargar catálogos del servidor', 'error');
    } finally {
      loadingCatalogs = false;
    }
  }

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[8000] bg-surface-base/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in';

  const stepsInfo = [
    { stepNum: 1, label: '1. Prerrequisitos', icon: 'verified' },
    { stepNum: 2, label: '2. Datos Generales', icon: 'description' },
    { stepNum: 3, label: '3. Fundamento Jurídico', icon: 'gavel' },
    { stepNum: 4, label: '4. Análisis Operativo', icon: 'analytics' },
    { stepNum: 5, label: '5. Matriz Diagnóstico', icon: 'equalizer' },
    { stepNum: 6, label: '6. Hallazgos', icon: 'find_in_page' },
    { stepNum: 7, label: '7. Acciones LNETB', icon: 'checklist' },
    { stepNum: 8, label: '8. Cronograma', icon: 'calendar_month' },
  ];

  function getMonthNames(semestreIsFirst) {
    if (semestreIsFirst) {
      return {
        1: 'Enero',
        2: 'Febrero',
        3: 'Marzo',
        4: 'Abril',
        5: 'Mayo',
        6: 'Junio'
      };
    } else {
      return {
        1: 'Julio',
        2: 'Agosto',
        3: 'Septiembre',
        4: 'Octubre',
        5: 'Noviembre',
        6: 'Diciembre'
      };
    }
  }

  function renderWizard() {
    const currentAgenda = agendasList.find(a => String(a.id_agenda) === String(wizardData.id_agenda_id));
    const semestreIsFirst = currentAgenda ? (currentAgenda.semestre === true || currentAgenda.semestre === 1) : true;
    const monthMap = getMonthNames(semestreIsFirst);

    overlay.innerHTML = `
      <div class="bg-surface-card border border-border-gold shadow-2xl rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-scale-up">
        <!-- Header -->
        <div class="p-space-md border-b border-border-subtle bg-surface-container-lowest flex items-center justify-between">
          <div class="flex items-center gap-space-xs">
            <div class="p-2 rounded-lg bg-primary/10 text-primary border border-border-gold">
              <span class="material-symbols-outlined text-[24px]">auto_awesome</span>
            </div>
            <div>
              <h3 class="font-headline-sm text-headline-sm font-bold text-text-primary">Asistente de Registro de Ficha Diagnóstica (FASD)</h3>
              <p class="font-body-sm text-xs text-text-secondary">Estructura por apartados oficial de simplificación y digitalización regulatoria</p>
            </div>
          </div>
          <button type="button" id="btn-close-wizard" class="p-1.5 rounded-lg bg-surface-container text-text-secondary hover:text-text-primary">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Stepper Indicator -->
        <div class="px-space-md py-3 bg-surface-container-low border-b border-border-subtle flex items-center justify-start gap-2 overflow-x-auto shrink-0">
          ${stepsInfo.map(s => {
            const isActive = step === s.stepNum;
            const isDone = step > s.stepNum;
            const bgClass = isActive
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : isDone
              ? 'bg-primary/20 text-primary font-semibold'
              : 'bg-surface-container text-text-tertiary';
            return `
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-title-md shrink-0 transition-all cursor-pointer ${bgClass}" onclick="window.__jumpStep(${s.stepNum})">
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
          ` : renderStepBody(monthMap, semestreIsFirst)}
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
            ${step < 8 ? `
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

    window.__jumpStep = (targetStep) => {
      if (targetStep < step) {
        step = targetStep;
        renderWizard();
      } else if (targetStep === step + 1) {
        const btnNext = overlay.querySelector('#btn-next-step');
        if (btnNext) btnNext.click();
      }
    };

    attachWizardEvents(monthMap);
  }

  function renderStepBody(monthMap, semestreIsFirst) {
    // ── Apartado 1: Prerrequisitos ──
    if (step === 1) {
      return `
        <div class="flex flex-col gap-space-md">
          <div class="p-4 rounded-xl bg-primary/10 border border-border-gold text-primary font-body-sm text-xs leading-relaxed flex items-start gap-3">
            <span class="material-symbols-outlined text-[24px] shrink-0">info</span>
            <div>
              <strong class="font-bold block text-sm mb-0.5">Apartado 1: Verificación de Prerrequisitos</strong>
              Selecciona la <strong>Agenda Semestral</strong> y el <strong>Trámite/Servicio</strong> a diagnosticar. Si aún no existen, puedes crearlos con los botones rápidos.
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-2">
            <div class="p-4 rounded-xl bg-surface-container border border-border-subtle flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <label class="font-label-sm text-label-sm font-bold text-text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
                  1.1 Agenda Regulatoria *
                </label>
                <button type="button" id="btn-quick-add-agenda" class="px-2.5 py-1 rounded bg-primary/15 text-primary border border-border-gold hover:bg-primary/25 font-title-md text-xs font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">add</span>
                  + Nueva Agenda
                </button>
              </div>

              ${agendasList.length === 0 ? `
                <p class="font-body-sm text-xs text-status-danger italic p-3 rounded bg-status-danger/10 border border-status-danger/20">
                  No hay agendas registradas en el sistema.
                </p>
              ` : `
                <select id="select-agenda" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm focus:border-primary focus:outline-none">
                  <option value="">-- Seleccionar Agenda --</option>
                  ${agendasList.map(a => `
                    <option value="${a.id_agenda}" ${String(wizardData.id_agenda_id) === String(a.id_agenda) ? 'selected' : ''}>
                      #AG-${a.id_agenda} | ${a.id_dependencia?.clave || 'Dep'} (${a.anio} - Semestre ${a.semestre ? '1 (Ene-Jun)' : '2 (Jul-Dic)'})
                    </option>
                  `).join('')}
                </select>
              `}
            </div>

            <div class="p-4 rounded-xl bg-surface-container border border-border-subtle flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <label class="font-label-sm text-label-sm font-bold text-text-primary flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-secondary text-[20px]">list_alt</span>
                  1.2 Trámite o Servicio *
                </label>
                <button type="button" id="btn-quick-add-tramite" class="px-2.5 py-1 rounded bg-secondary/15 text-secondary border border-border-tech hover:bg-secondary/25 font-title-md text-xs font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">add</span>
                  + Nuevo Trámite
                </button>
              </div>

              ${tramitesList.length === 0 ? `
                <p class="font-body-sm text-xs text-status-danger italic p-3 rounded bg-status-danger/10 border border-status-danger/20">
                  No hay trámites registrados en el catálogo.
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

    // ── Apartado 2: Datos Generales ──
    if (step === 2) {
      return `
        <div class="flex flex-col gap-space-md">
          <h4 class="font-title-md text-title-md font-bold text-text-primary flex items-center gap-2 border-b border-border-subtle pb-2">
            <span class="material-symbols-outlined text-primary">description</span>
            Apartado 2: Datos Generales del Trámite o Servicio
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Tipo de Solicitud *</label>
              <select id="field-solicitud-tipo" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm">
                <option value="0" ${Number(wizardData.solicitud_tipo) === 0 ? 'selected' : ''}>No tiene</option>
                <option value="1" ${Number(wizardData.solicitud_tipo) === 1 ? 'selected' : ''}>Escrito libre</option>
                <option value="2" ${Number(wizardData.solicitud_tipo) === 2 ? 'selected' : ''}>Formato específico</option>
                <option value="3" ${Number(wizardData.solicitud_tipo) === 3 ? 'selected' : ''}>Formato único</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div class="flex flex-col gap-1">
                <label class="font-label-sm text-xs font-semibold text-text-secondary">Plazo para Resolver (Días)</label>
                <input type="number" min="0" id="field-plazo" value="${wizardData.plazo_maximo_resolucion_dias ?? 15}" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="font-label-sm text-xs font-semibold text-text-secondary">Tipo de Días</label>
                <select id="field-habil" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm">
                  <option value="true" ${wizardData.is_dia_habil_o_inhabil ? 'selected' : ''}>Días Hábiles</option>
                  <option value="false" ${!wizardData.is_dia_habil_o_inhabil ? 'selected' : ''}>Días Inhábiles / Naturales</option>
                </select>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Vigencia del Resolutivo</label>
              <input type="text" id="field-vigencia" value="${wizardData.vigencia_del_documento_obtenido || ''}" placeholder="ej. 1 Año, Indefinido" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Número de Requisitos</label>
              <input type="number" min="0" id="field-num-requisitos" value="${wizardData.numero_requisitos ?? 0}" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" />
            </div>

            <div class="md:col-span-2 p-3.5 rounded-xl bg-surface-container border border-border-subtle flex flex-col gap-2">
              <label class="font-label-sm text-xs font-bold text-primary uppercase tracking-wider">Seleccione los conceptos que tienen fundamento:</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                ${[
                  { key: 'tramite_o_servicio', label: 'Trámite o servicio' },
                  { key: 'requisitos', label: 'Requisitos' },
                  { key: 'plazo_de_resolucion', label: 'Plazo de resolución' },
                  { key: 'vigencia', label: 'Vigencia' },
                ].map(c => `
                  <label class="flex items-center gap-2 cursor-pointer p-2 rounded bg-surface-recessed border border-border-subtle hover:border-border-gold">
                    <input type="checkbox" data-concept-key="${c.key}" ${wizardData.conceptos_con_fundamento.includes(c.key) ? 'checked' : ''} class="w-4 h-4 accent-primary rounded" />
                    <span class="font-medium text-text-primary">${c.label}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Solicitudes Recibidas (Ejercicio Anterior)</label>
              <input type="number" min="0" id="field-solicitudes" value="${wizardData.solicitudes_recibidas_semestre_anterior ?? 0}" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Resoluciones Positivas (Ejercicio Anterior)</label>
              <input type="number" min="0" id="field-resoluciones" value="${wizardData.resoluciones_positivas ?? 0}" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Cantidad de Personas que Intervienen</label>
              <input type="number" min="0" id="field-personas" value="${wizardData.cantidad_personas_intervienen ?? 1}" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Cantidad de Áreas que Intervienen</label>
              <input type="number" min="0" id="field-areas" value="${wizardData.areas_administrativas_interfieren ?? 1}" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" />
            </div>

            <div class="md:col-span-2 p-3.5 rounded-xl bg-surface-container border border-border-subtle flex items-center justify-between">
              <span class="font-body-sm text-xs font-semibold text-text-primary">¿Este trámite está dirigido a personas o grupos en atención prioritaria o vulnerable?</span>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-1.5 cursor-pointer font-body-sm text-xs">
                  <input type="radio" name="rad-vulnerable" value="true" ${wizardData.poblacion_prioritaria_atencion_preferente ? 'checked' : ''} class="w-4 h-4 accent-primary" />
                  <span>Sí</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer font-body-sm text-xs">
                  <input type="radio" name="rad-vulnerable" value="false" ${!wizardData.poblacion_prioritaria_atencion_preferente ? 'checked' : ''} class="w-4 h-4 accent-primary" />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ── Apartado 3: Fundamento Jurídico ──
    if (step === 3) {
      return `
        <div class="flex flex-col gap-space-md">
          <h4 class="font-title-md text-title-md font-bold text-text-primary flex items-center gap-2 border-b border-border-subtle pb-2">
            <span class="material-symbols-outlined text-primary">gavel</span>
            Apartado 3: Fundamento Jurídico y Esquema de Tarifas
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div class="md:col-span-2 flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Nombre, artículo y fracción de la regulación en la que se fundamenta el trámite o servicio</label>
              <textarea id="field-regulacion" rows="2" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" placeholder="ej. Reglamento Municipal de Construcciones Art 15 Fracc III">${wizardData.regulacion_fundamenta_existencia_tramite || ''}</textarea>
            </div>

            <div class="md:col-span-2 flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Nombre de la regulación que faculta al órgano administrativo</label>
              <textarea id="field-faculta-organo" rows="2" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" placeholder="ej. Reglamento Interior de la Administración Pública Municipal Art 24">${wizardData.regulacion_faculta_organo || ''}</textarea>
            </div>

            <div class="md:col-span-2 flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Fundamento legal en la ley de ingresos</label>
              <textarea id="field-ley-ingresos" rows="2" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" placeholder="ej. Ley de Ingresos Municipal Art 45 Fracc I">${wizardData.fundamento_en_ley_de_ingresos || ''}</textarea>
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Unidad de Cobro</label>
              <select id="field-unidad-cobro" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm">
                <option value="UMAs" ${wizardData.unidad_de_cobro === 'UMAs' ? 'selected' : ''}>UMAs</option>
                <option value="Moneda Nacional" ${wizardData.unidad_de_cobro === 'Moneda Nacional' ? 'selected' : ''}>Moneda Nacional ($ MXN)</option>
                <option value="Gratuito" ${wizardData.unidad_de_cobro === 'Gratuito' ? 'selected' : ''}>Gratuito</option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Indique el Importe del Trámite</label>
              <input type="text" id="field-importe" value="${wizardData.importe_tramite || ''}" placeholder="ej. 5.5 UMAs / $450.00" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" />
            </div>

            <div class="flex flex-col gap-1 md:col-span-2">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">Tipo de Trámite o Servicio</label>
              <select id="field-tipo-dirigido" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm">
                <option value="Ciudadano" ${wizardData.tipo_tramite_dirigido === 'Ciudadano' ? 'selected' : ''}>Ciudadano</option>
                <option value="Empresarial" ${wizardData.tipo_tramite_dirigido === 'Empresarial' ? 'selected' : ''}>Empresarial</option>
                <option value="Ambos" ${wizardData.tipo_tramite_dirigido === 'Ambos' ? 'selected' : ''}>Ambos</option>
              </select>
            </div>

            <div class="md:col-span-2 p-3.5 rounded-xl bg-surface-container border border-border-subtle flex flex-col gap-2">
              <label class="font-label-sm text-xs font-bold text-primary uppercase tracking-wider">Formas de Pago Aceptadas:</label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                ${[
                  { key: 'caja_propia', label: 'Caja propia' },
                  { key: 'bancos', label: 'Bancos' },
                  { key: 'banca_electronica', label: 'Banca electrónica' },
                  { key: 'otros', label: 'Otros' },
                ].map(fp => `
                  <label class="flex items-center gap-2 cursor-pointer p-2 rounded bg-surface-recessed border border-border-subtle hover:border-border-gold">
                    <input type="checkbox" data-pago-key="${fp.key}" ${wizardData.formas_de_pago.includes(fp.key) ? 'checked' : ''} class="w-4 h-4 accent-primary rounded" />
                    <span class="font-medium text-text-primary">${fp.label}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ── Apartado 4: Análisis de la Operación ──
    if (step === 4) {
      return `
        <div class="flex flex-col gap-space-md">
          <div class="flex items-center justify-between border-b border-border-subtle pb-2">
            <div>
              <h4 class="font-title-md text-title-md font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">analytics</span>
                Apartado 4: Análisis de la Operación (Clave-Valor)
              </h4>
              <p class="font-body-sm text-xs text-text-secondary mt-0.5">Captura los requisitos del trámite y las observaciones o problemas detectados en cada uno.</p>
            </div>
            <button type="button" id="btn-add-requisito-row" class="px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-border-gold hover:bg-primary/25 font-title-md text-xs font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">add</span>
              + Agregar Requisito
            </button>
          </div>

          <div class="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
            ${(wizardData.analisis_requisitos_json || []).length === 0 ? `
              <div class="p-6 text-center rounded-xl bg-surface-recessed border border-border-subtle text-text-tertiary">
                No hay requisitos registrados en el análisis. Haz clic en "+ Agregar Requisito".
              </div>
            ` : (wizardData.analisis_requisitos_json || []).map((req, idx) => `
              <div class="p-3.5 rounded-xl bg-surface-container border border-border-subtle flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div class="w-full md:w-1/3 flex flex-col gap-1">
                  <label class="font-label-sm text-[11px] font-bold text-text-tertiary uppercase">Requisito #${idx + 1}</label>
                  <input type="text" data-req-idx="${idx}" data-req-field="requisito" value="${req.requisito || ''}" placeholder="Nombre del requisito" class="w-full px-3 py-1.5 rounded bg-surface-recessed border border-border-subtle text-text-primary text-xs" />
                </div>
                <div class="w-full md:flex-1 flex flex-col gap-1">
                  <label class="font-label-sm text-[11px] font-bold text-text-tertiary uppercase">Observación / Problemas Detectados</label>
                  <input type="text" data-req-idx="${idx}" data-req-field="observacion" value="${req.observacion || ''}" placeholder="Detalle problemas o cuellos de botella detectados" class="w-full px-3 py-1.5 rounded bg-surface-recessed border border-border-subtle text-text-primary text-xs" />
                </div>
                <button type="button" data-delete-req-idx="${idx}" class="p-1.5 rounded bg-surface-recessed hover:bg-status-danger/20 text-status-danger mt-4 md:mt-0 transition-colors" title="Eliminar Requisito">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // ── Apartado 5: Matriz de Diagnóstico ──
    if (step === 5) {
      const niveles = [
        { num: 1, title: 'Nivel 1: Informativo', desc: 'La información del trámite o servicio está publicada en medios electrónicos.' },
        { num: 2, title: 'Nivel 2: Formatos Disponibles', desc: 'Los formatos del trámite o servicio están disponibles electrónicamente.' },
        { num: 3, title: 'Nivel 3: Interactivo', desc: 'El usuario puede iniciar la gestión, recibir o reenviar la información del trámite.' },
        { num: 4, title: 'Nivel 4: Digital End-to-End', desc: 'El trámite o servicio se gestiona desde el inicio hasta el final a través de un medio electrónico.' },
      ];

      return `
        <div class="flex flex-col gap-space-md">
          <h4 class="font-title-md text-title-md font-bold text-text-primary flex items-center gap-2 border-b border-border-subtle pb-2">
            <span class="material-symbols-outlined text-primary">equalizer</span>
            Apartado 5: Matriz de Diagnóstico y Nivel de Digitalización
          </h4>

          <p class="font-body-sm text-xs text-text-secondary">Indique el nivel de digitalización actual del trámite o servicio:</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${niveles.map(n => {
              const isSelected = Number(wizardData.nivel_digitalizacion_actual) === n.num;
              return `
                <div class="p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${isSelected ? 'bg-primary/10 border-border-gold shadow-md' : 'bg-surface-container border-border-subtle hover:border-border-gold/50'}" onclick="document.getElementById('rad-nivel-${n.num}').click()">
                  <input type="radio" id="rad-nivel-${n.num}" name="rad-nivel-digital" value="${n.num}" ${isSelected ? 'checked' : ''} class="w-5 h-5 accent-primary mt-0.5" onclick="event.stopPropagation()" />
                  <div class="flex flex-col gap-1">
                    <span class="font-title-md font-bold text-sm text-text-primary">${n.title}</span>
                    <p class="font-body-sm text-xs text-text-tertiary leading-relaxed">${n.desc}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    // ── Apartado 6: Hallazgos y Oportunidades ──
    if (step === 6) {
      return `
        <div class="flex flex-col gap-space-md">
          <h4 class="font-title-md text-title-md font-bold text-text-primary flex items-center gap-2 border-b border-border-subtle pb-2">
            <span class="material-symbols-outlined text-primary">find_in_page</span>
            Apartado 6: Hallazgos y Oportunidades de Mejora
          </h4>

          <div class="flex flex-col gap-space-md">
            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">¿Dónde están los cuellos de botella generados?</label>
              <textarea id="field-cuellos" rows="2" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" placeholder="Describa la fase u oficina donde se generan retrasos">${wizardData.cuellos_de_botella || ''}</textarea>
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">¿Qué requisitos no agregan valor al resolutivo del trámite?</label>
              <textarea id="field-req-sin-valor" rows="2" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" placeholder="Especifique los requisitos repetitivos o innecesarios">${wizardData.requisitos_sin_valor || ''}</textarea>
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-label-sm text-xs font-semibold text-text-secondary">¿Indique propuesta de mejora de los problemas detectados?</label>
              <textarea id="field-propuestas-mejora" rows="2" class="w-full px-3 py-2 rounded-lg bg-surface-recessed border border-border-subtle text-text-primary font-body-sm" placeholder="Proponga soluciones concretas de optimización digital o normativa">${wizardData.propuestas_de_mejora || ''}</textarea>
            </div>
          </div>
        </div>
      `;
    }

    // ── Apartado 7: Acciones LNETB (Simplificación vs Digitalización) ──
    if (step === 7) {
      const accionesSimp = accionesList.filter(a => a.simplificacion_o_digitalizacion === true);
      const accionesDig = accionesList.filter(a => a.simplificacion_o_digitalizacion === false);

      return `
        <div class="flex flex-col gap-space-md">
          <h4 class="font-title-md text-title-md font-bold text-text-primary flex items-center gap-2 border-b border-border-subtle pb-2">
            <span class="material-symbols-outlined text-primary">checklist</span>
            Apartado 7: Acciones de Simplificación y/o Digitalización (LNETB)
          </h4>

          <div class="space-y-6 max-h-[52vh] overflow-y-auto pr-1">
            <!-- Sección 1: Acciones de Simplificación -->
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-primary font-title-md font-bold text-sm">
                <span class="material-symbols-outlined text-[20px]">architecture</span>
                <span>Sección A: Acciones de Simplificación Regulatoria</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${accionesSimp.map(ac => {
                  const isChecked = wizardData.id_accion_ids.includes(ac.id_accion);
                  return `
                    <div class="p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${isChecked ? 'bg-primary/10 border-border-gold shadow-sm' : 'bg-surface-container border-border-subtle hover:border-border-gold/50'}" onclick="document.getElementById('chk-acc-${ac.id_accion}').click()">
                      <input type="checkbox" id="chk-acc-${ac.id_accion}" data-accion-id="${ac.id_accion}" ${isChecked ? 'checked' : ''} class="w-5 h-5 accent-primary rounded cursor-pointer mt-0.5" onclick="event.stopPropagation()" />
                      <div class="flex flex-col gap-1">
                        <span class="font-data-mono font-bold text-xs text-primary">${ac.clave}</span>
                        <span class="font-title-md text-xs font-bold text-text-primary">${ac.titulo}</span>
                        <p class="font-body-sm text-[11px] text-text-tertiary line-clamp-2">${ac.descripcion || ''}</p>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Sección 2: Acciones de Digitalización -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center gap-2 text-secondary font-title-md font-bold text-sm">
                <span class="material-symbols-outlined text-[20px]">devices</span>
                <span>Sección B: Acciones de Digitalización Tecnológica</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${accionesDig.map(ac => {
                  const isChecked = wizardData.id_accion_ids.includes(ac.id_accion);
                  return `
                    <div class="p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${isChecked ? 'bg-secondary/10 border-border-tech shadow-sm' : 'bg-surface-container border-border-subtle hover:border-border-tech/50'}" onclick="document.getElementById('chk-acc-${ac.id_accion}').click()">
                      <input type="checkbox" id="chk-acc-${ac.id_accion}" data-accion-id="${ac.id_accion}" ${isChecked ? 'checked' : ''} class="w-5 h-5 accent-secondary rounded cursor-pointer mt-0.5" onclick="event.stopPropagation()" />
                      <div class="flex flex-col gap-1">
                        <span class="font-data-mono font-bold text-xs text-secondary">${ac.clave}</span>
                        <span class="font-title-md text-xs font-bold text-text-primary">${ac.titulo}</span>
                        <p class="font-body-sm text-[11px] text-text-tertiary line-clamp-2">${ac.descripcion || ''}</p>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ── Apartado 8: Cronograma de Actividades ──
    if (step === 8) {
      const selectedAccionesObjects = accionesList.filter(ac => wizardData.id_accion_ids.includes(ac.id_accion));
      return `
        <div class="flex flex-col gap-space-md">
          <div class="flex items-center justify-between border-b border-border-subtle pb-2">
            <div>
              <h4 class="font-title-md text-title-md font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">calendar_month</span>
                Apartado 8: Calendarización de Actividades del Cronograma
              </h4>
              <p class="font-body-sm text-xs text-text-secondary mt-0.5">
                Periodo asignado: <strong>${semestreIsFirst ? '1er Semestre (Enero a Junio)' : '2do Semestre (Julio a Diciembre)'}</strong>
              </p>
            </div>
          </div>

          ${selectedAccionesObjects.length === 0 ? `
            <div class="p-6 rounded-xl bg-status-warning/10 border border-status-warning/30 text-status-warning text-xs text-center">
              No has seleccionado ninguna acción en el Apartado 7. Regresa al paso anterior para marcar al menos una acción.
            </div>
          ` : `
            <div class="bg-surface-card rounded-xl border border-border-subtle overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-surface-container-lowest border-b border-border-subtle text-xs font-semibold text-text-tertiary uppercase">
                    <th class="px-4 py-3">Acción LNETB</th>
                    <th class="px-4 py-3">Mes Inicio</th>
                    <th class="px-4 py-3">Mes Término</th>
                    <th class="px-4 py-3">Proyección Calendarizada</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-subtle/40 font-body-sm text-xs">
                  ${selectedAccionesObjects.map(ac => {
                    const cItem = wizardData.cronograma_items.find(ci => ci.id_accion_id === ac.id_accion) || { num_mes_inicio_plazo: 1, num_mes_final_plazo: 6 };
                    const iniName = monthMap[cItem.num_mes_inicio_plazo] || `Mes ${cItem.num_mes_inicio_plazo}`;
                    const finName = monthMap[cItem.num_mes_final_plazo] || `Mes ${cItem.num_mes_final_plazo}`;
                    return `
                      <tr>
                        <td class="px-4 py-3 font-semibold text-text-primary">
                          <span class="font-data-mono text-primary font-bold block">${ac.clave}</span>
                          <span>${ac.titulo}</span>
                        </td>
                        <td class="px-4 py-3">
                          <select data-crono-inicio="${ac.id_accion}" class="px-2.5 py-1.5 rounded bg-surface-recessed border border-border-subtle text-text-primary">
                            ${[1, 2, 3, 4, 5, 6].map(m => `<option value="${m}" ${Number(cItem.num_mes_inicio_plazo) === m ? 'selected' : ''}>${monthMap[m]}</option>`).join('')}
                          </select>
                        </td>
                        <td class="px-4 py-3">
                          <select data-crono-final="${ac.id_accion}" class="px-2.5 py-1.5 rounded bg-surface-recessed border border-border-subtle text-text-primary">
                            ${[1, 2, 3, 4, 5, 6].map(m => `<option value="${m}" ${Number(cItem.num_mes_final_plazo) === m ? 'selected' : ''}>${monthMap[m]}</option>`).join('')}
                          </select>
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex items-center gap-1.5">
                            <span class="px-2.5 py-1 rounded bg-primary/15 border border-border-gold font-data-mono font-bold text-primary">
                              ${iniName} ➔ ${finName}
                            </span>
                          </div>
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

  function attachWizardEvents(monthMap) {
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
          const user = api.getUser();
          const userDepId = user?.id_dependencia?.id_dependencia || user?.id_dependencia || '';
          showFormModal({
            title: 'Creación Rápida de Agenda',
            icon: 'calendar_today',
            fields: [
              { name: 'id_dependencia_id', label: 'Dependencia Gubernamental', type: 'select', options: dependenciasList, defaultValue: userDepId, helpText: 'Si se omite, se asignará la dependencia del usuario.' },
              { name: 'anio', label: 'Año', type: 'number', required: true, defaultValue: 2026 },
              { name: 'semestre', label: 'Semestre', type: 'select', required: true, options: [{ value: 'true', label: '1er Semestre' }, { value: 'false', label: '2do Semestre' }] },
              { name: 'unidad_administrativa', label: 'Unidad Administrativa', type: 'text', required: true },
            ],
            submitText: 'Crear Agenda',
            onSubmit: async (payload) => {
              payload.semestre = payload.semestre === 'true';
              if (!payload.id_dependencia_id && userDepId) {
                payload.id_dependencia_id = userDepId;
              }
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
              {
                name: 'tipo',
                label: 'Tipo de Trámite/Servicio',
                type: 'select',
                options: [
                  { value: 0, label: '0 = Trámite presencial' },
                  { value: 1, label: '1 = Trámite digital' },
                  { value: 2, label: '2 = Servicio presencial' },
                  { value: 3, label: '3 = Servicio digital' },
                  { value: 4, label: '4 = Mixto' },
                  { value: 5, label: '5 = Vía telefónica' },
                ],
              },
              { name: 'tramite_o_servicio', label: '¿Es Trámite? (Marcar = Trámite, Desmarcar = Servicio)', type: 'checkbox' },
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
      const fieldVigencia = overlay.querySelector('#field-vigencia');
      const fieldNumReq = overlay.querySelector('#field-num-requisitos');
      const fieldSolRec = overlay.querySelector('#field-solicitudes');
      const fieldResPos = overlay.querySelector('#field-resoluciones');
      const fieldPersonas = overlay.querySelector('#field-personas');
      const fieldAreas = overlay.querySelector('#field-areas');

      if (fieldSol) fieldSol.addEventListener('change', (e) => wizardData.solicitud_tipo = Number(e.target.value));
      if (fieldPlazo) fieldPlazo.addEventListener('change', (e) => wizardData.plazo_maximo_resolucion_dias = Number(e.target.value));
      if (fieldHabil) fieldHabil.addEventListener('change', (e) => wizardData.is_dia_habil_o_inhabil = e.target.value === 'true');
      if (fieldVigencia) fieldVigencia.addEventListener('change', (e) => wizardData.vigencia_del_documento_obtenido = e.target.value);
      if (fieldNumReq) fieldNumReq.addEventListener('change', (e) => wizardData.numero_requisitos = Number(e.target.value));
      if (fieldSolRec) fieldSolRec.addEventListener('change', (e) => wizardData.solicitudes_recibidas_semestre_anterior = Number(e.target.value));
      if (fieldResPos) fieldResPos.addEventListener('change', (e) => wizardData.resoluciones_positivas = Number(e.target.value));
      if (fieldPersonas) fieldPersonas.addEventListener('change', (e) => wizardData.cantidad_personas_intervienen = Number(e.target.value));
      if (fieldAreas) fieldAreas.addEventListener('change', (e) => wizardData.areas_administrativas_interfieren = Number(e.target.value));

      overlay.querySelectorAll('[data-concept-key]').forEach(chk => {
        chk.addEventListener('change', () => {
          const key = chk.dataset.conceptKey;
          if (chk.checked) {
            if (!wizardData.conceptos_con_fundamento.includes(key)) wizardData.conceptos_con_fundamento.push(key);
          } else {
            wizardData.conceptos_con_fundamento = wizardData.conceptos_con_fundamento.filter(k => k !== key);
          }
        });
      });

      overlay.querySelectorAll('[name="rad-vulnerable"]').forEach(rad => {
        rad.addEventListener('change', (e) => wizardData.poblacion_prioritaria_atencion_preferente = e.target.value === 'true');
      });
    }

    if (step === 3) {
      const fieldReg = overlay.querySelector('#field-regulacion');
      const fieldFaculta = overlay.querySelector('#field-faculta-organo');
      const fieldLey = overlay.querySelector('#field-ley-ingresos');
      const fieldUnidad = overlay.querySelector('#field-unidad-cobro');
      const fieldImporte = overlay.querySelector('#field-importe');
      const fieldTipoDir = overlay.querySelector('#field-tipo-dirigido');

      if (fieldReg) fieldReg.addEventListener('change', (e) => wizardData.regulacion_fundamenta_existencia_tramite = e.target.value);
      if (fieldFaculta) fieldFaculta.addEventListener('change', (e) => wizardData.regulacion_faculta_organo = e.target.value);
      if (fieldLey) fieldLey.addEventListener('change', (e) => wizardData.fundamento_en_ley_de_ingresos = e.target.value);
      if (fieldUnidad) fieldUnidad.addEventListener('change', (e) => wizardData.unidad_de_cobro = e.target.value);
      if (fieldImporte) fieldImporte.addEventListener('change', (e) => wizardData.importe_tramite = e.target.value);
      if (fieldTipoDir) fieldTipoDir.addEventListener('change', (e) => wizardData.tipo_tramite_dirigido = e.target.value);

      overlay.querySelectorAll('[data-pago-key]').forEach(chk => {
        chk.addEventListener('change', () => {
          const key = chk.dataset.pagoKey;
          if (chk.checked) {
            if (!wizardData.formas_de_pago.includes(key)) wizardData.formas_de_pago.push(key);
          } else {
            wizardData.formas_de_pago = wizardData.formas_de_pago.filter(k => k !== key);
          }
        });
      });
    }

    if (step === 4) {
      const btnAddRow = overlay.querySelector('#btn-add-requisito-row');
      if (btnAddRow) {
        btnAddRow.addEventListener('click', () => {
          wizardData.analisis_requisitos_json.push({ requisito: '', observacion: '' });
          renderWizard();
        });
      }

      overlay.querySelectorAll('[data-req-field]').forEach(input => {
        input.addEventListener('change', (e) => {
          const idx = Number(e.target.dataset.reqIdx);
          const field = e.target.dataset.reqField;
          if (wizardData.analisis_requisitos_json[idx]) {
            wizardData.analisis_requisitos_json[idx][field] = e.target.value;
          }
        });
      });

      overlay.querySelectorAll('[data-delete-req-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.deleteReqIdx);
          wizardData.analisis_requisitos_json.splice(idx, 1);
          renderWizard();
        });
      });
    }

    if (step === 5) {
      overlay.querySelectorAll('[name="rad-nivel-digital"]').forEach(rad => {
        rad.addEventListener('change', (e) => wizardData.nivel_digitalizacion_actual = Number(e.target.value));
      });
    }

    if (step === 6) {
      const fieldCuellos = overlay.querySelector('#field-cuellos');
      const fieldReqSinVal = overlay.querySelector('#field-req-sin-valor');
      const fieldProp = overlay.querySelector('#field-propuestas-mejora');

      if (fieldCuellos) fieldCuellos.addEventListener('change', (e) => wizardData.cuellos_de_botella = e.target.value);
      if (fieldReqSinVal) fieldReqSinVal.addEventListener('change', (e) => wizardData.requisitos_sin_valor = e.target.value);
      if (fieldProp) fieldProp.addEventListener('change', (e) => wizardData.propuestas_de_mejora = e.target.value);
    }

    if (step === 7) {
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

    if (step === 8) {
      overlay.querySelectorAll('[data-crono-inicio]').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const accId = Number(e.target.dataset.cronoInicio);
          const cItem = wizardData.cronograma_items.find(ci => ci.id_accion_id === accId);
          if (cItem) {
            cItem.num_mes_inicio_plazo = Number(e.target.value);
            renderWizard();
          }
        });
      });

      overlay.querySelectorAll('[data-crono-final]').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const accId = Number(e.target.dataset.cronoFinal);
          const cItem = wizardData.cronograma_items.find(ci => ci.id_accion_id === accId);
          if (cItem) {
            cItem.num_mes_final_plazo = Number(e.target.value);
            renderWizard();
          }
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
        btnSubmit.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Guardando Ficha...`;

        try {
          await api.post('/fichas/registrar-con-cronograma/', wizardData);
          showToast('Ficha Diagnóstica y Cronograma registrados exitosamente', 'success');
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
