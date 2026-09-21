import { fichasService, agendasService, tramitesService, accionesService, fichasHasAccionesService, cronogramaService } from '../services/crud-factory.js';
import { api } from '../services/api.js';
import { renderDataTable, renderInstitutionalBanner, showFormModal, showConfirmModal, showToast } from '../components/organisms.js';
import { renderMaturityLevel } from '../components/molecules.js';
import { renderBadge, renderSpinner } from '../components/atoms.js';
import { showFichaWizardModal } from '../components/ficha-wizard-modal.js';

export async function renderFichasPage(container) {
  let currentPage = 1;
  let loading = true;
  let data = [];
  let count = 0;
  let selectedFicha = null;
  let selectedFichaAcciones = [];
  let selectedFichaCronograma = [];
  let selectedFichaPriorizacion = null;
  let loadingDetail = false;

  let agendasList = [];
  let tramitesList = [];
  let accionesList = [];

  async function loadCatalogs() {
    try {
      const [resAg, resTr, resAcc] = await Promise.all([
        agendasService.list({ page_size: 100 }),
        tramitesService.list({ page_size: 100 }),
        accionesService.list({ page_size: 100 }),
      ]);
      agendasList = (resAg.results || []).map(a => ({ value: a.id_agenda, label: `#AG-${a.id_agenda} | ${a.id_dependencia?.clave || 'Dep'} - ${a.anio}` }));
      tramitesList = (resTr.results || []).map(t => ({ value: t.id_tramite_servicio, label: `${t.clave} - ${t.nombre_oficial}` }));
      accionesList = (resAcc.results || []).map(ac => ({ value: ac.id_accion, label: `${ac.clave} - ${ac.titulo}` }));
    } catch (err) {
      console.error('Error al cargar catálogos en fichas:', err);
    }
  }

  async function fetchPage(page = 1) {
    loading = true;
    render();
    try {
      const res = await fichasService.list({ page });
      data = res.results || [];
      count = res.count || 0;
      currentPage = page;
    } catch (err) {
      console.error('Error al cargar fichas diagnósticas:', err);
      data = [];
      count = 0;
    } finally {
      loading = false;
      render();
    }
  }

  async function selectFicha(fichaId) {
    loadingDetail = true;
    render();

    try {
      const [fichaRes, accionesRes, cronogramaRes, prioRes] = await Promise.all([
        fichasService.getById(fichaId),
        fichasHasAccionesService.list({ id_ficha: fichaId }),
        cronogramaService.list({ id_ficha: fichaId }),
        api.get(`/fichas/${fichaId}/priorizacion/`).catch(() => null),
      ]);

      selectedFicha = fichaRes;
      selectedFichaAcciones = accionesRes.results || [];
      selectedFichaCronograma = cronogramaRes.results || [];
      selectedFichaPriorizacion = prioRes;
    } catch (err) {
      console.error('Error al cargar detalle de ficha:', err);
      showToast('Error al cargar detalle de ficha', 'error');
    } finally {
      loadingDetail = false;
      render();
    }
  }

  function getFormFields() {
    return [
      { name: 'id_agenda_id', label: 'Agenda Perteneciente', type: 'select', required: true, options: agendasList, fullWidth: true },
      { name: 'id_tramite_servicio_id', label: 'Trámite o Servicio Diagnosticado', type: 'select', required: true, options: tramitesList, fullWidth: true },
      {
        name: 'solicitud_tipo',
        label: 'Tipo de Solicitud',
        type: 'select',
        options: [
          { value: 0, label: '0 = Nueva apertura' },
          { value: 1, label: '1 = Renovación' },
          { value: 2, label: '2 = Modificación' },
          { value: 3, label: '3 = Baja' },
        ],
      },
      { name: 'plazo_maximo_resolucion_dias', label: 'Plazo Máximo de Resolución (Días)', type: 'number', min: 0 },
      { name: 'is_dia_habil_o_inhabil', label: 'Plazo expresado en Días Hábiles (Desmarcar = Días Naturales)', type: 'checkbox' },
      { name: 'vigencia_del_documento_obtenido', label: 'Vigencia del Documento Obtenido', type: 'text', placeholder: 'ej. 1 año, Indefinido' },
      { name: 'poblacion_prioritaria_atencion_preferente', label: 'Atención a Población Vulnerable / Prioritaria', type: 'checkbox' },
      { name: 'solicitudes_recibidas_semestre_anterior', label: 'Solicitudes Recibidas (Semestre Anterior)', type: 'number', min: 0 },
      { name: 'resoluciones_positivas', label: 'Resoluciones Positivas (Semestre Anterior)', type: 'number', min: 0 },
      { name: 'areas_administrativas_interfieren', label: 'Áreas Administrativas Involucradas', type: 'number', min: 0 },
      { name: 'habile_ventanilla_presencial', label: 'Ventanilla Presencial', type: 'checkbox' },
      { name: 'habile_portal_web_municipal', label: 'Portal Web Municipal', type: 'checkbox' },
      { name: 'habile_app_mobile', label: 'App Móvil', type: 'checkbox' },
      { name: 'habile_linea_telefonica', label: 'Línea Telefónica', type: 'checkbox' },
      { name: 'cuellos_de_botella', label: 'Cuellos de Botella Operativos', type: 'textarea', fullWidth: true },
      { name: 'requisitos_sin_valor', label: 'Requisitos Identificados Sin Valor Agregado', type: 'textarea', fullWidth: true },
      { name: 'propuestas_de_mejora', label: 'Propuestas de Mejora de Procesos', type: 'textarea', fullWidth: true },
      { name: 'regulacion_fundamenta_existencia_tramite', label: 'Regulación que Fundamenta la Existencia del Trámite', type: 'textarea', fullWidth: true },
      { name: 'fundamento_en_ley_de_ingresos', label: 'Fundamento Jurídico en Ley de Ingresos', type: 'textarea', fullWidth: true },
      {
        name: 'niveles_digitalizacion_ids',
        label: 'Niveles de Madurez Digital (Selección Múltiple)',
        type: 'multi-checkbox',
        fullWidth: true,
        options: [
          { value: 0, label: 'Nivel 0: Presencial' },
          { value: 1, label: 'Nivel 1: Informativo' },
          { value: 2, label: 'Nivel 2: Formatos disponibles' },
          { value: 3, label: 'Nivel 3: Interactivo parcial' },
          { value: 4, label: 'Nivel 4: Digital end-to-end' },
        ],
      },
      { name: 'propuesta_mejora_transaccion_tecnologica', label: 'Propuesta de Transacción Tecnológica', type: 'textarea', fullWidth: true },
    ];
  }

  function openCreateModal() {
    showFichaWizardModal({
      onComplete: () => {
        fetchPage(currentPage);
      }
    });
  }

  function openEditModal(item) {
    const initial = {
      ...item,
      id_agenda_id: item.id_agenda?.id_agenda || item.id_agenda_id,
      id_tramite_servicio_id: item.id_tramite_servicio?.id_tramite_servicio || item.id_tramite_servicio_id,
      niveles_digitalizacion_ids: Array.isArray(item.niveles_digitalizacion)
        ? item.niveles_digitalizacion.map(n => n.nivel)
        : (item.nivel_digitalizacion_actual !== null && item.nivel_digitalizacion_actual !== undefined ? [item.nivel_digitalizacion_actual] : []),
    };
    showFormModal({
      title: `Editar Ficha Diagnóstica #FCH-${item.id_ficha}`,
      icon: 'edit',
      fields: getFormFields(),
      initialData: initial,
      submitText: 'Actualizar Ficha',
      onSubmit: async (payload) => {
        await fichasService.partialUpdate(item.id_ficha, payload);
        if (selectedFicha && selectedFicha.id_ficha === item.id_ficha) {
          await selectFicha(item.id_ficha);
        }
        await fetchPage(currentPage);
      },
    });
  }

  function confirmDelete(id) {
    showConfirmModal({
      title: '¿Eliminar Ficha Diagnóstica?',
      message: 'Esta acción eliminará permanentemente la ficha y sus vinculaciones de acciones.',
      onConfirm: async () => {
        await fichasService.remove(id);
        if (selectedFicha && selectedFicha.id_ficha === id) {
          selectedFicha = null;
        }
        showToast('Ficha eliminada correctamente', 'success');
        await fetchPage(currentPage);
      },
    });
  }

  function openAddActionModal(fichaId) {
    showFormModal({
      title: `Vincular Acción Regulatoria a Ficha #FCH-${fichaId}`,
      icon: 'add_link',
      fields: [
        { name: 'id_accion_id', label: 'Acción Regulatoria (LNETB)', type: 'select', required: true, options: accionesList, fullWidth: true },
      ],
      submitText: 'Vincular Acción',
      onSubmit: async (payload) => {
        await fichasHasAccionesService.create({ id_ficha_id: fichaId, id_accion_id: payload.id_accion_id });
        showToast('Acción vinculada a la ficha', 'success');
        await selectFicha(fichaId);
      }
    });
  }

  function openAddCronogramaModal(fichaId) {
    showFormModal({
      title: `Agregar Calendarización a Ficha #FCH-${fichaId}`,
      icon: 'calendar_month',
      fields: [
        { name: 'id_accion_id', label: 'Acción Calendarizada', type: 'select', required: true, options: accionesList, fullWidth: true },
        {
          name: 'num_mes_inicio_plazo',
          label: 'Mes de Inicio del Semestre',
          type: 'select',
          required: true,
          options: [
            { value: 0, label: 'Mes 0 (No aplica)' },
            { value: 1, label: 'Mes 1' },
            { value: 2, label: 'Mes 2' },
            { value: 3, label: 'Mes 3' },
            { value: 4, label: 'Mes 4' },
            { value: 5, label: 'Mes 5' },
            { value: 6, label: 'Mes 6' },
          ]
        },
        {
          name: 'num_mes_final_plazo',
          label: 'Mes Final del Semestre',
          type: 'select',
          required: true,
          options: [
            { value: 0, label: 'Mes 0 (No aplica)' },
            { value: 1, label: 'Mes 1' },
            { value: 2, label: 'Mes 2' },
            { value: 3, label: 'Mes 3' },
            { value: 4, label: 'Mes 4' },
            { value: 5, label: 'Mes 5' },
            { value: 6, label: 'Mes 6' },
          ]
        },
      ],
      submitText: 'Guardar Calendarización',
      onSubmit: async (payload) => {
        await cronogramaService.create({ ...payload, id_ficha_id: fichaId });
        showToast('Calendarización agregada a la ficha', 'success');
        await selectFicha(fichaId);
      }
    });
  }

  function render() {
    const columns = [
      {
        header: 'ID Ficha',
        field: 'id_ficha',
        width: 'w-24',
        render: (row) => `<span class="font-data-mono font-bold text-primary">#FCH-${row.id_ficha}</span>`,
      },
      {
        header: 'Trámite / Servicio Diagnosticado',
        field: 'id_tramite_servicio.nombre_oficial',
        render: (row) => `
          <div class="flex flex-col">
            <span class="font-title-md font-semibold text-text-primary">${row.id_tramite_servicio?.nombre_oficial || 'Sin Trámite'}</span>
            <span class="font-data-mono text-xs text-text-tertiary">Clave: ${row.id_tramite_servicio?.clave || 'N/A'}</span>
          </div>
        `,
      },
      {
        header: 'Agenda / Periodo',
        field: 'id_agenda.anio',
        width: 'w-40',
        render: (row) => row.id_agenda ? `
          <div class="flex flex-col">
            <span class="font-data-mono text-body-sm font-semibold text-text-primary">${row.id_agenda.unidad_administrativa || 'Unidad'}</span>
            <span class="font-data-mono text-xs text-text-tertiary">${row.id_agenda.anio} - Semestre ${row.id_agenda.semestre ? '1' : '2'}</span>
          </div>
        ` : '<span class="text-text-tertiary">-</span>',
      },
      {
        header: 'Nivel Digital',
        field: 'nivel_digitalizacion_actual',
        width: 'w-44',
        render: (row) => renderMaturityLevel(row.nivel_digitalizacion_actual || 0),
      },
      {
        header: 'Plazo (Días)',
        field: 'plazo_maximo_resolucion_dias',
        width: 'w-28',
        render: (row) => `<span class="font-data-mono text-body-sm font-semibold text-primary">${row.plazo_maximo_resolucion_dias ?? '-'} d.</span>`,
      },
      {
        header: 'Acción',
        width: 'w-28',
        render: (row) => `
          <button
            type="button"
            data-action="view-detail"
            data-id="${row.id_ficha}"
            class="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-border-gold text-primary font-title-md text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span class="material-symbols-outlined text-[14px]">visibility</span>
            <span>Ver Ficha</span>
          </button>
        `,
      }
    ];

    container.innerHTML = `
      ${renderInstitutionalBanner(
        'Matriz Diagnóstica de Fichas de Simplificación',
        'Evaluación integral de plazos, fundamentación jurídica y niveles de madurez digital (LNETB)',
        'MATRIZ DIAGNÓSTICA'
      )}

      <!-- Layout Principal Split -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-md mb-space-lg">
        <!-- Tabla de Fichas -->
        <div class="${selectedFicha ? 'lg:col-span-6' : 'lg:col-span-12'} transition-all duration-300">
          <div class="flex items-center justify-between gap-space-md mb-space-md">
            <div class="flex items-center gap-space-xs">
              <span class="font-title-md text-title-md text-text-primary font-bold">Fichas Evaluadas:</span>
              <span class="font-data-mono text-headline-sm text-primary font-bold">${count}</span>
            </div>
            <button
              type="button"
              id="btn-add-ficha"
              class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[18px]">add</span>
              <span>Nueva Ficha</span>
            </button>
          </div>

          <div id="table-container">
            ${renderDataTable({
              columns,
              data,
              loading,
              count,
              page: currentPage,
              pageSize: 10,
              emptyTitle: 'No hay fichas diagnósticas registradas',
              emptyIcon: 'assignment',
              idField: 'id_ficha',
              renderActions: (row) => `
                <div class="inline-flex items-center justify-end gap-1">
                  <button type="button" data-action="view-detail" data-id="${row.id_ficha}" class="p-1 rounded bg-surface-container text-primary hover:bg-surface-container-high border border-border-subtle" title="Ver Detalle">
                    <span class="material-symbols-outlined text-[16px]">visibility</span>
                  </button>
                  <button type="button" data-action="edit" data-id="${row.id_ficha}" class="p-1 rounded bg-surface-container text-primary hover:bg-surface-container-high border border-border-subtle" title="Editar Ficha">
                    <span class="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button type="button" data-action="delete" data-id="${row.id_ficha}" class="p-1 rounded bg-surface-container text-status-danger hover:bg-surface-container-high border border-border-subtle" title="Eliminar Ficha">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              `
            })}
          </div>
        </div>

        <!-- Panel de Detalle (Drawer / Card) -->
        ${selectedFicha ? `
          <div class="lg:col-span-6 flex flex-col gap-space-md">
            <div class="p-space-md rounded-xl bg-surface-card border border-border-gold shadow-2xl relative overflow-hidden flex flex-col gap-4">
              <!-- Header Panel -->
              <div class="flex items-center justify-between border-b border-border-subtle pb-space-sm">
                <div class="flex items-center gap-space-xs">
                  <span class="material-symbols-outlined text-primary text-[24px]">description</span>
                  <h3 class="font-headline-sm text-headline-sm text-text-primary font-bold">Ficha Diagnóstica #FCH-${selectedFicha.id_ficha}</h3>
                </div>
                <div class="flex items-center gap-2">
                  <button id="btn-edit-selected" class="p-1.5 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high border border-border-subtle" title="Editar Ficha">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button id="btn-close-detail" class="p-1.5 rounded-lg bg-surface-container text-text-secondary hover:text-text-primary" title="Cerrar Panel">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>

              ${loadingDetail ? `<div class="py-12 text-center">${renderSpinner('md')}</div>` : `
                <!-- Widget Priorización Parcial (FASD 01) -->
                ${selectedFichaPriorizacion ? `
                  <div class="p-4 rounded-xl bg-surface-container border border-border-gold shadow-md flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                      <span class="font-title-md text-title-md text-primary font-bold flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[20px]">equalizer</span>
                        Puntaje de Priorización (FASD 01)
                      </span>
                      <span class="px-3 py-1 rounded-full bg-primary/15 text-primary border border-border-gold font-data-mono font-bold text-headline-sm">
                        ${selectedFichaPriorizacion.puntaje_total} / 90 pts
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs font-body-sm">
                      <div class="p-2 rounded bg-surface-recessed border border-border-subtle flex flex-col">
                        <span class="text-text-tertiary">Plazo Respuesta:</span>
                        <span class="font-semibold text-text-primary font-data-mono">+${selectedFichaPriorizacion.desglose?.plazo_resolucion?.puntaje || 0} pts</span>
                      </div>
                      <div class="p-2 rounded bg-surface-recessed border border-border-subtle flex flex-col">
                        <span class="text-text-tertiary">Población Vulnerable:</span>
                        <span class="font-semibold text-text-primary font-data-mono">+${selectedFichaPriorizacion.desglose?.poblacion_vulnerable?.puntaje || 0} pts</span>
                      </div>
                      <div class="p-2 rounded bg-surface-recessed border border-border-subtle flex flex-col">
                        <span class="text-text-tertiary">Volumen Solicitudes:</span>
                        <span class="font-semibold text-text-primary font-data-mono">+${selectedFichaPriorizacion.desglose?.volumen_solicitudes?.puntaje || 0} pts</span>
                      </div>
                      <div class="p-2 rounded bg-surface-recessed border border-border-subtle flex flex-col">
                        <span class="text-text-tertiary">Fundamento Jurídico:</span>
                        <span class="font-semibold text-text-primary font-data-mono">+${selectedFichaPriorizacion.desglose?.fundamento_juridico_aproximado?.puntaje || 0} pts</span>
                      </div>
                    </div>

                    <!-- Aviso de factores no evaluados -->
                    <div class="p-2.5 rounded-lg bg-surface-recessed border border-border-subtle flex flex-col gap-1">
                      <span class="font-label-sm text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">info</span>
                        Puntaje Parcial — Factores del modelo oficial no evaluados en el canon:
                      </span>
                      <ul class="list-disc list-inside text-[11px] text-text-tertiary space-y-0.5">
                        ${(selectedFichaPriorizacion.factores_no_evaluados || []).map(f => `<li>${f}</li>`).join('')}
                      </ul>
                    </div>
                  </div>
                ` : ''}

                <!-- Trámite e Información General -->
                <div class="flex flex-col gap-2">
                  <span class="font-label-sm text-xs text-text-tertiary uppercase">Trámite Diagnosticado:</span>
                  <h4 class="font-title-md text-title-md text-text-primary font-bold">${selectedFicha.id_tramite_servicio?.nombre_oficial || 'N/A'}</h4>
                  <span class="font-data-mono text-xs text-text-tertiary">Clave: ${selectedFicha.id_tramite_servicio?.clave || 'N/A'}</span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs font-body-sm">
                  <div class="p-2.5 rounded-lg bg-surface-recessed border border-border-subtle">
                    <span class="font-label-sm text-text-tertiary block">Plazo de Resolución</span>
                    <span class="font-data-mono text-body-md font-bold text-primary">${selectedFicha.plazo_maximo_resolucion_dias ?? '-'} Días (${selectedFicha.is_dia_habil_o_inhabil ? 'Hábiles' : 'Inhábiles'})</span>
                  </div>
                  <div class="p-2.5 rounded-lg bg-surface-recessed border border-border-subtle">
                    <span class="font-label-sm text-text-tertiary block">Solicitudes / Positivas</span>
                    <span class="font-data-mono text-body-md font-bold text-secondary">${selectedFicha.solicitudes_recibidas_semestre_anterior ?? 0} / ${selectedFicha.resoluciones_positivas ?? 0}</span>
                  </div>
                  <div class="p-2.5 rounded-lg bg-surface-recessed border border-border-subtle">
                    <span class="font-label-sm text-text-tertiary block">Esquema de Cobro</span>
                    <span class="font-data-mono font-bold text-text-primary">${selectedFicha.unidad_de_cobro || 'Gratuito'} (${selectedFicha.importe_tramite || '0'})</span>
                  </div>
                  <div class="p-2.5 rounded-lg bg-surface-recessed border border-border-subtle">
                    <span class="font-label-sm text-text-tertiary block">Dirigido A</span>
                    <span class="font-data-mono font-bold text-text-primary">${selectedFicha.tipo_tramite_dirigido || 'Ciudadano'}</span>
                  </div>
                </div>

                ${(selectedFicha.analisis_requisitos_json || []).length > 0 ? `
                  <div class="p-3 rounded-xl bg-surface-recessed border border-border-subtle flex flex-col gap-2">
                    <span class="font-label-sm text-xs font-bold text-primary uppercase">Análisis Operativo (${selectedFicha.analisis_requisitos_json.length} Requisitos Evaluados)</span>
                    <div class="space-y-1 max-h-32 overflow-y-auto pr-1">
                      ${selectedFicha.analisis_requisitos_json.map(r => `
                        <div class="p-2 rounded bg-surface-container text-xs flex flex-col gap-0.5 border border-border-subtle/60">
                          <span class="font-bold text-text-primary">${r.requisito}</span>
                          <span class="text-text-tertiary text-[11px]">${r.observacion || 'Sin observación'}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <div>
                  <span class="font-label-sm text-xs text-text-tertiary uppercase block mb-1">Nivel(es) de Digitalización:</span>
                  ${renderMaturityLevel(selectedFicha)}
                </div>

                <!-- Subsección 1: FichaHasAcciones (Relación N:M) -->
                <div class="pt-3 border-t border-border-subtle flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <span class="font-title-md text-body-sm text-primary font-bold flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">checklist</span>
                      Acciones Vinculadas (${selectedFichaAcciones.length})
                    </span>
                    <button type="button" id="btn-add-action-link" class="px-2 py-1 rounded bg-primary/10 text-primary border border-border-gold hover:bg-primary/20 text-xs font-semibold flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px]">add</span>
                      Vincular
                    </button>
                  </div>

                  ${selectedFichaAcciones.length === 0 ? `
                    <p class="font-body-sm text-xs text-text-tertiary italic p-2.5 rounded bg-surface-container text-center">No hay acciones vinculadas a esta ficha.</p>
                  ` : `
                    <div class="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                      ${selectedFichaAcciones.map(fa => `
                        <div class="p-2 rounded bg-surface-container border border-border-subtle flex items-center justify-between text-xs">
                          <span class="font-medium text-text-primary">${fa.id_accion?.titulo || `Acción #${fa.id_accion_id || fa.id_accion}`}</span>
                          <button type="button" data-action="delete-action-link" data-id="${fa.id_fichas_has_accion}" class="text-status-danger hover:text-status-danger/80 p-0.5" title="Desvincular">
                            <span class="material-symbols-outlined text-[16px]">remove_circle</span>
                          </button>
                        </div>
                      `).join('')}
                    </div>
                  `}
                </div>

                <!-- Subsección 2: Cronograma de Actividades por Ficha -->
                <div class="pt-3 border-t border-border-subtle flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <span class="font-title-md text-body-sm text-primary font-bold flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">calendar_month</span>
                      Calendarización (${selectedFichaCronograma.length})
                    </span>
                    <button type="button" id="btn-add-cronograma-entry" class="px-2 py-1 rounded bg-primary/10 text-primary border border-border-gold hover:bg-primary/20 text-xs font-semibold flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px]">add</span>
                      Calendarizar
                    </button>
                  </div>

                  ${selectedFichaCronograma.length === 0 ? `
                    <p class="font-body-sm text-xs text-text-tertiary italic p-2.5 rounded bg-surface-container text-center">No hay actividades calendarizadas en el cronograma.</p>
                  ` : `
                    <div class="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                      ${selectedFichaCronograma.map(cr => `
                        <div class="p-2 rounded bg-surface-container border border-border-subtle flex items-center justify-between text-xs">
                          <div class="flex flex-col">
                            <span class="font-medium text-text-primary">${cr.id_accion?.titulo || `Acción #${cr.id_accion}`}</span>
                            <span class="font-data-mono text-[11px] text-text-tertiary">Meses ${cr.num_mes_inicio_plazo} al ${cr.num_mes_final_plazo}</span>
                          </div>
                          <button type="button" data-action="delete-cronograma-entry" data-id="${cr.id_cronograma}" class="text-status-danger hover:text-status-danger/80 p-0.5" title="Eliminar entry">
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      `).join('')}
                    </div>
                  `}
                </div>
              `}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const btnAdd = container.querySelector('#btn-add-ficha');
    if (btnAdd) btnAdd.addEventListener('click', openCreateModal);

    const tableContainer = container.querySelector('#table-container');
    if (tableContainer) {
      tableContainer.addEventListener('click', (e) => {
        const btnView = e.target.closest('[data-action="view-detail"]');
        const btnEdit = e.target.closest('[data-action="edit"]');
        const btnDelete = e.target.closest('[data-action="delete"]');
        const btnPrev = e.target.closest('[data-action="prev-page"]');
        const btnNext = e.target.closest('[data-action="next-page"]');

        if (btnView) {
          const fid = parseInt(btnView.dataset.id, 10);
          selectFicha(fid);
        } else if (btnEdit) {
          const fid = parseInt(btnEdit.dataset.id, 10);
          const item = data.find(d => d.id_ficha === fid);
          if (item) openEditModal(item);
        } else if (btnDelete) {
          const fid = parseInt(btnDelete.dataset.id, 10);
          confirmDelete(fid);
        } else if (btnPrev && !btnPrev.disabled) {
          const p = parseInt(btnPrev.dataset.page, 10);
          if (p >= 1) fetchPage(p);
        } else if (btnNext && !btnNext.disabled) {
          const p = parseInt(btnNext.dataset.page, 10);
          if (p >= 1) fetchPage(p);
        }
      });
    }

    const btnClose = container.querySelector('#btn-close-detail');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        selectedFicha = null;
        render();
      });
    }

    const btnEditSelected = container.querySelector('#btn-edit-selected');
    if (btnEditSelected && selectedFicha) {
      btnEditSelected.addEventListener('click', () => openEditModal(selectedFicha));
    }

    const btnAddActionLink = container.querySelector('#btn-add-action-link');
    if (btnAddActionLink && selectedFicha) {
      btnAddActionLink.addEventListener('click', () => openAddActionModal(selectedFicha.id_ficha));
    }

    const btnAddCrono = container.querySelector('#btn-add-cronograma-entry');
    if (btnAddCrono && selectedFicha) {
      btnAddCrono.addEventListener('click', () => openAddCronogramaModal(selectedFicha.id_ficha));
    }

    container.querySelectorAll('[data-action="delete-action-link"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const linkId = parseInt(btn.dataset.id, 10);
        showConfirmModal({
          title: '¿Desvincular Acción?',
          message: 'Esta acción removerá la relación entre la ficha y esta acción.',
          onConfirm: async () => {
            await fichasHasAccionesService.remove(linkId);
            showToast('Acción desvinculada', 'success');
            await selectFicha(selectedFicha.id_ficha);
          }
        });
      });
    });

    container.querySelectorAll('[data-action="delete-cronograma-entry"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cronoId = parseInt(btn.dataset.id, 10);
        showConfirmModal({
          title: '¿Eliminar Calendarización?',
          message: 'Esta acción eliminará el registro de cronograma.',
          onConfirm: async () => {
            await cronogramaService.remove(cronoId);
            showToast('Calendarización eliminada', 'success');
            await selectFicha(selectedFicha.id_ficha);
          }
        });
      });
    });
  }

  await loadCatalogs();
  await fetchPage(1);
}
