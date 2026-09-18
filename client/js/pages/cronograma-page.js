import { cronogramaService, fichasService, accionesService } from '../services/crud-factory.js';
import { renderDataTable, renderInstitutionalBanner, showFormModal, showConfirmModal, showToast } from '../components/organisms.js';

export async function renderCronogramaPage(container) {
  let currentPage = 1;
  let loading = true;
  let data = [];
  let count = 0;
  let fichasList = [];
  let accionesList = [];

  async function loadCatalogs() {
    try {
      const [resFch, resAcc] = await Promise.all([
        fichasService.list({ page_size: 100 }),
        accionesService.list({ page_size: 100 }),
      ]);
      fichasList = (resFch.results || []).map(f => ({ value: f.id_ficha, label: `#FCH-${f.id_ficha} | ${f.id_tramite_servicio?.nombre_oficial || 'Ficha'}` }));
      accionesList = (resAcc.results || []).map(ac => ({ value: ac.id_accion, label: `${ac.clave} - ${ac.titulo}` }));
    } catch (err) {
      console.error('Error al cargar catálogos para cronograma:', err);
    }
  }

  async function fetchPage(page = 1) {
    loading = true;
    render();
    try {
      const res = await cronogramaService.list({ page });
      data = res.results || [];
      count = res.count || 0;
      currentPage = page;
    } catch (err) {
      console.error('Error al cargar cronograma FASD:', err);
      data = [];
      count = 0;
    } finally {
      loading = false;
      render();
    }
  }

  function getFormFields() {
    const mesOptions = [
      { value: 0, label: 'Mes 0 (No aplica / no definido)' },
      { value: 1, label: 'Mes 1 (Primer mes del semestre)' },
      { value: 2, label: 'Mes 2' },
      { value: 3, label: 'Mes 3' },
      { value: 4, label: 'Mes 4' },
      { value: 5, label: 'Mes 5' },
      { value: 6, label: 'Mes 6 (Sexto mes del semestre)' },
    ];
    return [
      { name: 'id_ficha_id', label: 'Ficha Diagnóstica Padre', type: 'select', required: true, options: fichasList, fullWidth: true },
      { name: 'id_accion_id', label: 'Acción Regulatoria a Calendarizar', type: 'select', required: true, options: accionesList, fullWidth: true },
      { name: 'num_mes_inicio_plazo', label: 'Mes de Inicio del Semestre (0..6)', type: 'select', required: true, options: mesOptions },
      { name: 'num_mes_final_plazo', label: 'Mes Final del Semestre (0..6)', type: 'select', required: true, options: mesOptions },
    ];
  }

  function openCreateModal() {
    showFormModal({
      title: 'Calendarizar Acción en Cronograma',
      icon: 'calendar_add_on',
      fields: getFormFields(),
      submitText: 'Guardar en Cronograma',
      onSubmit: async (payload) => {
        await cronogramaService.create(payload);
        await fetchPage(currentPage);
      },
    });
  }

  function openEditModal(item) {
    const initial = {
      ...item,
      id_ficha_id: item.id_ficha?.id_ficha || item.id_ficha_id,
      id_accion_id: item.id_accion?.id_accion || item.id_accion_id,
    };
    showFormModal({
      title: `Editar Registro de Cronograma #${item.id_cronograma}`,
      icon: 'edit',
      fields: getFormFields(),
      initialData: initial,
      submitText: 'Actualizar Cronograma',
      onSubmit: async (payload) => {
        await cronogramaService.partialUpdate(item.id_cronograma, payload);
        await fetchPage(currentPage);
      },
    });
  }

  function confirmDelete(id) {
    showConfirmModal({
      title: '¿Eliminar Calendarización?',
      message: 'Esta acción removerá esta acción del cronograma de la ficha.',
      onConfirm: async () => {
        await cronogramaService.remove(id);
        showToast('Registro de cronograma eliminado', 'success');
        await fetchPage(currentPage);
      },
    });
  }

  function render() {
    const columns = [
      {
        header: 'ID Cronograma',
        field: 'id_cronograma',
        width: 'w-28',
        render: (row) => `<span class="font-data-mono font-bold text-primary">#CRN-${row.id_cronograma}</span>`,
      },
      {
        header: 'Ficha Diagnóstica',
        field: 'id_ficha.id_ficha',
        render: (row) => row.id_ficha ? `<span class="font-body-sm font-semibold text-secondary">#FCH-${row.id_ficha.id_ficha || row.id_ficha}</span>` : '<span class="text-text-tertiary">-</span>',
      },
      {
        header: 'Acción Calendarizada',
        field: 'id_accion.titulo',
        render: (row) => row.id_accion ? `
          <div class="flex flex-col">
            <span class="font-title-md font-semibold text-text-primary">${row.id_accion.titulo || row.id_accion.clave}</span>
            <span class="font-data-mono text-xs text-text-tertiary">Clave: ${row.id_accion.clave || 'N/A'}</span>
          </div>
        ` : '<span class="text-text-tertiary">-</span>',
      },
      {
        header: 'Rango de Meses (Semestre)',
        field: 'num_mes_inicio_plazo',
        width: 'w-48',
        render: (row) => `
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container border border-border-gold font-data-mono text-body-sm font-bold text-primary">
            <span class="material-symbols-outlined text-[16px] text-primary">date_range</span>
            <span>Mes ${row.num_mes_inicio_plazo ?? 0} al Mes ${row.num_mes_final_plazo ?? 0}</span>
          </div>
        `,
      },
    ];

    container.innerHTML = `
      ${renderInstitutionalBanner(
        'Cronograma FASD de Actividades y Metas',
        'Calendario de ejecución semestral de simplificación y entrega de hitos regulatorios',
        'CRONOGRAMA FASD 2026'
      )}

      <!-- Toolbar Superior -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-space-md mb-space-md">
        <div class="flex items-center gap-space-xs w-full sm:w-auto">
          <span class="font-title-md text-title-md text-text-primary font-bold">Actividades Programadas:</span>
          <span class="font-data-mono text-headline-sm text-primary font-bold">${count}</span>
        </div>
        <div class="flex items-center gap-space-xs w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-add-cronograma"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add_task</span>
            <span>Programar Actividad</span>
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
          emptyTitle: 'No hay actividades en el cronograma',
          emptyIcon: 'event_repeat',
          idField: 'id_cronograma',
        })}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const btnAdd = container.querySelector('#btn-add-cronograma');
    if (btnAdd) btnAdd.addEventListener('click', openCreateModal);

    const tableContainer = container.querySelector('#table-container');
    if (!tableContainer) return;

    tableContainer.addEventListener('click', (e) => {
      const btnEdit = e.target.closest('[data-action="edit"]');
      const btnDelete = e.target.closest('[data-action="delete"]');
      const btnPrev = e.target.closest('[data-action="prev-page"]');
      const btnNext = e.target.closest('[data-action="next-page"]');

      if (btnEdit) {
        const id = parseInt(btnEdit.dataset.id, 10);
        const item = data.find(d => d.id_cronograma === id);
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
