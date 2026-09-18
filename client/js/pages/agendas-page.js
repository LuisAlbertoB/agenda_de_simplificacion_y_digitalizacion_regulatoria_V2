import { agendasService, dependenciasService, usuariosService } from '../services/crud-factory.js';
import { api } from '../services/api.js';
import { renderDataTable, renderInstitutionalBanner, showFormModal, showConfirmModal, showToast } from '../components/organisms.js';
import { renderBadge } from '../components/atoms.js';

export async function renderAgendasPage(container) {
  let currentPage = 1;
  let loading = true;
  let data = [];
  let count = 0;
  let dependenciasList = [];
  let usuariosList = [];

  const statusLabels = {
    0: { label: 'BORRADOR', variant: 'warning' },
    1: { label: 'ENVIADA', variant: 'secondary' },
    2: { label: 'APROBADA', variant: 'tertiary' },
    3: { label: 'OBSERVADA', variant: 'neutral' },
    4: { label: 'RECHAZADA', variant: 'danger' },
  };

  async function loadCatalogs() {
    try {
      const [resDep, resUsr] = await Promise.all([
        dependenciasService.list({ page_size: 100 }),
        usuariosService.list({ page_size: 100 }),
      ]);
      dependenciasList = (resDep.results || []).map(d => ({ value: d.id_dependencia, label: `${d.clave} - ${d.nombre_oficial}` }));
      usuariosList = (resUsr.results || []).map(u => ({ value: u.id_usuario, label: `${u.nombres} ${u.apellido1} (${u.correo_electronico})` }));
    } catch (err) {
      console.error('Error al cargar catálogos para formulario de agenda:', err);
    }
  }

  async function fetchPage(page = 1) {
    loading = true;
    render();
    try {
      const res = await agendasService.list({ page });
      data = res.results || [];
      count = res.count || 0;
      currentPage = page;
    } catch (err) {
      console.error('Error al cargar agendas regulatorias:', err);
      data = [];
      count = 0;
    } finally {
      loading = false;
      render();
    }
  }

  function getFormFields() {
    return [
      {
        name: 'id_dependencia_id',
        label: 'Dependencia Gubernamental',
        type: 'select',
        options: dependenciasList,
        helpText: 'Nota: para usuarios de enlace, la dependencia se forzará automáticamente.',
      },
      { name: 'anio', label: 'Año de la Agenda', type: 'number', required: true, defaultValue: 2026, min: 2020 },
      {
        name: 'semestre',
        label: 'Semestre del Periodo',
        type: 'select',
        required: true,
        options: [
          { value: 'true', label: '1er Semestre (Ene – Jun)' },
          { value: 'false', label: '2do Semestre (Jul – Dic)' },
        ],
      },
      { name: 'unidad_administrativa', label: 'Unidad Administrativa Responsable', type: 'text', required: true },
      { name: 'titular_unidad_admin', label: 'Titular de la Unidad Administrativa', type: 'text' },
      { name: 'enlace_oficial_id', label: 'Servidor Público Enlace Oficial', type: 'select', options: usuariosList },
    ];
  }

  function openCreateModal() {
    showFormModal({
      title: 'Nueva Agenda Semestral de Simplificación',
      icon: 'calendar_today',
      fields: getFormFields(),
      submitText: 'Registrar Agenda',
      onSubmit: async (payload) => {
        // Convertir string boolean de semestre
        if (payload.semestre === 'true') payload.semestre = true;
        if (payload.semestre === 'false') payload.semestre = false;
        await agendasService.create(payload);
        await fetchPage(currentPage);
      },
    });
  }

  function openEditModal(item) {
    const initial = {
      ...item,
      id_dependencia_id: item.id_dependencia?.id_dependencia || item.id_dependencia_id,
      enlace_oficial_id: item.enlace_oficial?.id_usuario || item.enlace_oficial_id,
      semestre: String(item.semestre),
    };
    showFormModal({
      title: `Editar Agenda #AG-${item.id_agenda}`,
      icon: 'edit',
      fields: getFormFields(),
      initialData: initial,
      submitText: 'Actualizar Agenda',
      onSubmit: async (payload) => {
        if (payload.semestre === 'true') payload.semestre = true;
        if (payload.semestre === 'false') payload.semestre = false;
        await agendasService.partialUpdate(item.id_agenda, payload);
        await fetchPage(currentPage);
      },
    });
  }

  function openChangeStatusModal(item) {
    showFormModal({
      title: `Cambiar Estado de Agenda #AG-${item.id_agenda}`,
      icon: 'sync_alt',
      fields: [
        {
          name: 'status',
          label: 'Nuevo Estado',
          type: 'select',
          required: true,
          options: [
            { value: 0, label: '0 = Borrador' },
            { value: 1, label: '1 = Enviada' },
            { value: 2, label: '2 = Aprobada' },
            { value: 3, label: '3 = Observada' },
            { value: 4, label: '4 = Rechazada' },
          ],
          defaultValue: item.status,
        }
      ],
      submitText: 'Aplicar Cambio de Estado',
      onSubmit: async (payload) => {
        const newStatus = Number(payload.status);
        if (item.status === 2 && newStatus === 4) {
          // Confirmación adicional para transiciones críticas
          return new Promise((resolve, reject) => {
            showConfirmModal({
              title: '¿Confirmar Rechazo de Agenda Aprobada?',
              message: 'Atención: Esta cambiando el estado de APROBADA a RECHAZADA. ¿Desea continuar?',
              variant: 'danger',
              onConfirm: async () => {
                try {
                  await agendasService.partialUpdate(`${item.id_agenda}/cambiar-estado`, { status: newStatus });
                  showToast('Estado actualizado a Rechazada', 'success');
                  await fetchPage(currentPage);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            });
          });
        }

        await agendasService.partialUpdate(`${item.id_agenda}/cambiar-estado`, { status: newStatus });
        showToast('Estado de agenda actualizado exitosamente', 'success');
        await fetchPage(currentPage);
      }
    });
  }

  async function openConsolidadoModal(item) {
    try {
      const res = await api.get(`/agendas/${item.id_agenda}/consolidado/`);
      const dataCons = res.agenda || {};
      const fichas = dataCons.fichas || [];

      const backdrop = document.createElement('div');
      backdrop.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in';

      backdrop.innerHTML = `
        <div class="relative w-full max-w-4xl max-h-[90vh] bg-surface-card border border-border-gold rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-border-subtle bg-surface-container flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary text-[28px]">account_tree</span>
              <div>
                <h3 class="font-headline-sm text-headline-sm text-text-primary font-bold">Consolidado Institucional de la Agenda #AG-${dataCons.id_agenda}</h3>
                <p class="font-body-sm text-xs text-text-tertiary">${dataCons.unidad_administrativa || 'Unidad Administrativa'} — Año ${dataCons.anio} (${dataCons.semestre ? '1er Semestre' : '2do Semestre'})</p>
              </div>
            </div>
            <button id="btn-close-consolidado" class="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-text-primary transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Body Scrollable -->
          <div class="p-6 overflow-y-auto space-y-6">
            <!-- Summary cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="p-4 rounded-xl bg-surface-container border border-border-subtle flex flex-col">
                <span class="font-label-sm text-xs text-text-tertiary">Total Fichas Diagnósticas</span>
                <span class="font-data-mono text-headline-sm font-bold text-primary">${fichas.length}</span>
              </div>
              <div class="p-4 rounded-xl bg-surface-container border border-border-subtle flex flex-col">
                <span class="font-label-sm text-xs text-text-tertiary">Dependencia Responsable</span>
                <span class="font-title-md text-body-md font-semibold text-text-primary">${dataCons.id_dependencia?.nombre_oficial || 'N/A'}</span>
              </div>
              <div class="p-4 rounded-xl bg-surface-container border border-border-subtle flex flex-col">
                <span class="font-label-sm text-xs text-text-tertiary">Estatus Regulatorio</span>
                <span class="font-data-mono text-body-md font-bold text-secondary">${statusLabels[dataCons.status]?.label || 'BORRADOR'}</span>
              </div>
            </div>

            <!-- Tree of Fichas and Activities -->
            <div class="space-y-4">
              <h4 class="font-title-md text-body-md font-bold text-text-primary flex items-center gap-2 border-b border-border-subtle pb-2">
                <span class="material-symbols-outlined text-primary text-[20px]">folder_open</span>
                Estructura Consolidada (Fichas > Acciones > Calendarización)
              </h4>

              ${fichas.length === 0 ? `
                <div class="p-8 text-center bg-surface-recessed rounded-xl border border-border-subtle text-text-tertiary">
                  <span class="material-symbols-outlined text-[40px] block mb-2 opacity-50">description</span>
                  <p class="font-body-sm text-sm">Esta agenda no contiene fichas diagnósticas registradas.</p>
                </div>
              ` : `
                <div class="space-y-4">
                  ${fichas.map(f => {
                    const acciones = f.acciones_vinculadas || [];
                    const cronograma = f.cronograma_actividades || [];
                    return `
                      <div class="p-4 rounded-xl bg-surface-container border border-border-subtle space-y-3">
                        <div class="flex items-center justify-between border-b border-border-subtle pb-2">
                          <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded bg-primary/10 text-primary font-data-mono text-xs font-bold">#FCH-${f.id_ficha}</span>
                            <span class="font-title-md font-semibold text-text-primary text-sm">${f.id_tramite_servicio?.nombre_oficial || 'Trámite'}</span>
                          </div>
                          <span class="font-data-mono text-xs text-text-tertiary">Plazo: ${f.plazo_maximo_resolucion_dias ?? '-'} días</span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <!-- Acciones LNETB -->
                          <div class="p-3 rounded-lg bg-surface-recessed border border-border-subtle">
                            <span class="font-label-sm font-bold text-primary flex items-center gap-1 mb-1">
                              <span class="material-symbols-outlined text-[14px]">checklist</span>
                              Acciones de Simplificación (${acciones.length})
                            </span>
                            ${acciones.length === 0 ? '<p class="text-text-tertiary italic">Sin acciones vinculadas.</p>' : `
                              <ul class="list-disc list-inside space-y-1 text-text-secondary">
                                ${acciones.map(a => `<li>${a.id_accion?.titulo || `Acción #${a.id_accion_id}`}</li>`).join('')}
                              </ul>
                            `}
                          </div>

                          <!-- Cronograma -->
                          <div class="p-3 rounded-lg bg-surface-recessed border border-border-subtle">
                            <span class="font-label-sm font-bold text-secondary flex items-center gap-1 mb-1">
                              <span class="material-symbols-outlined text-[14px]">calendar_month</span>
                              Calendarización de Actividades (${cronograma.length})
                            </span>
                            ${cronograma.length === 0 ? '<p class="text-text-tertiary italic">Sin calendarización.</p>' : `
                              <div class="space-y-1 text-text-secondary">
                                ${cronograma.map(c => `
                                  <div class="flex items-center justify-between text-[11px] border-b border-border-subtle/50 pb-0.5">
                                    <span>${c.id_accion?.titulo || `Acción #${c.id_accion_id}`}</span>
                                    <span class="font-data-mono font-bold text-primary">Meses ${c.num_mes_inicio_plazo}–${c.num_mes_final_plazo}</span>
                                  </div>
                                `).join('')}
                              </div>
                            `}
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      const closeBtn = backdrop.querySelector('#btn-close-consolidado');
      const closeHandler = () => backdrop.remove();

      closeBtn.addEventListener('click', closeHandler);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeHandler();
      });
    } catch (err) {
      console.error('Error al cargar consolidado de agenda:', err);
      showToast('Error al cargar consolidado de agenda', 'error');
    }
  }

  function confirmDelete(id) {
    showConfirmModal({
      title: '¿Eliminar Agenda?',
      message: 'Esta acción eliminará la agenda y sus fichas asociadas.',
      onConfirm: async () => {
        await agendasService.remove(id);
        showToast('Agenda eliminada correctamente', 'success');
        await fetchPage(currentPage);
      },
    });
  }

  function render() {
    const columns = [
      {
        header: 'ID Agenda',
        field: 'id_agenda',
        width: 'w-28',
        render: (row) => `<span class="font-data-mono font-bold text-primary">#AG-${row.id_agenda}</span>`,
      },
      {
        header: 'Dependencia / Secretaría',
        field: 'id_dependencia.nombre_oficial',
        render: (row) => `
          <div class="flex flex-col">
            <span class="font-title-md font-semibold text-text-primary">${row.id_dependencia?.nombre_oficial || 'Dependencia'}</span>
            <span class="font-data-mono text-xs text-text-tertiary">Clave: ${row.id_dependencia?.clave || 'N/A'}</span>
          </div>
        `,
      },
      {
        header: 'Año / Periodo',
        field: 'anio',
        width: 'w-32',
        render: (row) => `<span class="font-data-mono font-semibold text-text-primary">${row.anio || '-'}</span>`,
      },
      {
        header: 'Semestre',
        field: 'semestre',
        width: 'w-32',
        render: (row) => renderBadge(row.semestre === true || row.semestre === 1 ? '1er Semestre' : '2do Semestre', 'secondary'),
      },
      {
        header: 'Unidad Administrativa',
        field: 'unidad_administrativa',
        render: (row) => `<span class="font-body-sm text-text-primary font-medium">${row.unidad_administrativa || 'Dirección General'}</span>`,
      },
      {
        header: 'Estado',
        field: 'status',
        width: 'w-36',
        render: (row) => {
          const st = statusLabels[row.status] || { label: `ESTADO ${row.status}`, variant: 'neutral' };
          return renderBadge(st.label, st.variant);
        },
      },
    ];

    container.innerHTML = `
      ${renderInstitutionalBanner(
        'Agendas de Simplificación Regulatoria',
        'Programas anuales y semestrales de simplificación de trámites y servicios municipales',
        'AGENDAS GENERALES'
      )}

      <!-- Toolbar Superior -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-space-md mb-space-md">
        <div class="flex items-center gap-space-xs w-full sm:w-auto">
          <span class="font-title-md text-title-md text-text-primary font-bold">Agendas en Catálogo:</span>
          <span class="font-data-mono text-headline-sm text-primary font-bold">${count}</span>
        </div>
        <div class="flex items-center gap-space-xs w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-add-agenda"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Nueva Agenda</span>
          </button>
        </div>
      </div>

      <!-- Tabla de Datos -->
      <div id="table-container">
        ${renderDataTable({
          columns,
          data,
          loading,
          count,
          page: currentPage,
          pageSize: 10,
          emptyTitle: 'No hay agendas registradas',
          emptyIcon: 'calendar_today',
          idField: 'id_agenda',
          renderActions: (row) => `
            <div class="inline-flex items-center justify-end gap-1">
              <button
                type="button"
                data-action="consolidado"
                data-id="${row.id_agenda}"
                title="Ver Consolidado de Agenda"
                class="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-border-gold text-secondary font-body-sm text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span class="material-symbols-outlined text-[14px]">account_tree</span>
                <span>Consolidado</span>
              </button>
              <button
                type="button"
                data-action="status"
                data-id="${row.id_agenda}"
                title="Cambiar Estado de la Agenda"
                class="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-border-gold text-primary font-body-sm text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span class="material-symbols-outlined text-[14px]">sync_alt</span>
                <span>Estado</span>
              </button>
              <button
                type="button"
                data-action="edit"
                data-id="${row.id_agenda}"
                title="Editar agenda"
                class="p-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-border-subtle text-primary transition-colors"
              >
                <span class="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <button
                type="button"
                data-action="delete"
                data-id="${row.id_agenda}"
                title="Eliminar agenda"
                class="p-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-border-subtle text-status-danger transition-colors"
              >
                <span class="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          `,
        })}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const btnAdd = container.querySelector('#btn-add-agenda');
    if (btnAdd) {
      btnAdd.addEventListener('click', openCreateModal);
    }

    const tableContainer = container.querySelector('#table-container');
    if (!tableContainer) return;

    tableContainer.addEventListener('click', (e) => {
      const btnConsolidado = e.target.closest('[data-action="consolidado"]');
      const btnStatus = e.target.closest('[data-action="status"]');
      const btnEdit = e.target.closest('[data-action="edit"]');
      const btnDelete = e.target.closest('[data-action="delete"]');
      const btnPrev = e.target.closest('[data-action="prev-page"]');
      const btnNext = e.target.closest('[data-action="next-page"]');

      if (btnConsolidado) {
        const id = parseInt(btnConsolidado.dataset.id, 10);
        const item = data.find(d => d.id_agenda === id);
        if (item) openConsolidadoModal(item);
      } else if (btnStatus) {
        const id = parseInt(btnStatus.dataset.id, 10);
        const item = data.find(d => d.id_agenda === id);
        if (item) openChangeStatusModal(item);
      } else if (btnEdit) {
        const id = parseInt(btnEdit.dataset.id, 10);
        const item = data.find(d => d.id_agenda === id);
        if (item) openEditModal(item);
      } else if (btnDelete) {
        const id = parseInt(btnDelete.dataset.id, 10);
        confirmDelete(id);
      } else if (btnPrev && !btnPrev.disabled) {
        const p = parseInt(btnPrev.dataset.page, 10);
        if (p >= 1) fetchPage(p);
      } else if (btnNext && !btnNext.disabled) {
        const p = parseInt(btnNext.dataset.page, 10);
        if (p >= 1) fetchPage(p);
      }
    });
  }

  await loadCatalogs();
  await fetchPage(1);
}
