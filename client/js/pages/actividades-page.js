import { actividadesService, accionesService } from '../services/crud-factory.js';
import { renderDataTable, renderInstitutionalBanner, showFormModal, showConfirmModal, showToast } from '../components/organisms.js';

export async function renderActividadesPage(container) {
  let currentPage = 1;
  let loading = true;
  let data = [];
  let count = 0;
  let accionesList = [];

  async function loadAccionesCatalog() {
    try {
      const res = await accionesService.list({ page_size: 100 });
      accionesList = (res.results || []).map(ac => ({ value: ac.id_accion, label: `${ac.clave} - ${ac.titulo}` }));
    } catch (err) {
      console.error('Error al cargar acciones en actividades:', err);
    }
  }

  async function fetchPage(page = 1) {
    loading = true;
    render();
    try {
      const res = await actividadesService.list({ page });
      data = res.results || [];
      count = res.count || 0;
      currentPage = page;
    } catch (err) {
      console.error('Error al cargar actividades:', err);
      data = [];
      count = 0;
    } finally {
      loading = false;
      render();
    }
  }

  function getFormFields() {
    return [
      { name: 'id_accion_id', label: 'Acción Regulatoria Padre', type: 'select', required: true, options: accionesList, fullWidth: true },
      { name: 'clave', label: 'Clave de Actividad', type: 'text', required: true, placeholder: 'ej. ACT-01' },
      { name: 'titulo', label: 'Título de la Actividad', type: 'text', required: true, fullWidth: true },
      { name: 'descripcion', label: 'Descripción de la Tarea Técnica', type: 'textarea', fullWidth: true },
    ];
  }

  function openCreateModal() {
    showFormModal({
      title: 'Nueva Actividad Operativa',
      icon: 'add_task',
      fields: getFormFields(),
      submitText: 'Crear Actividad',
      onSubmit: async (payload) => {
        await actividadesService.create(payload);
        await fetchPage(currentPage);
      },
    });
  }

  function openEditModal(item) {
    const initial = {
      ...item,
      id_accion_id: item.id_accion?.id_accion || item.id_accion_id,
    };
    showFormModal({
      title: `Editar Actividad #${item.id_actividad}`,
      icon: 'edit',
      fields: getFormFields(),
      initialData: initial,
      submitText: 'Actualizar Actividad',
      onSubmit: async (payload) => {
        await actividadesService.partialUpdate(item.id_actividad, payload);
        await fetchPage(currentPage);
      },
    });
  }

  function confirmDelete(id) {
    showConfirmModal({
      title: '¿Eliminar Actividad?',
      message: 'Esta acción eliminará la actividad del catálogo general.',
      onConfirm: async () => {
        await actividadesService.remove(id);
        showToast('Actividad eliminada correctamente', 'success');
        await fetchPage(currentPage);
      },
    });
  }

  function render() {
    const columns = [
      {
        header: 'ID Actividad',
        field: 'id_actividad',
        width: 'w-28',
        render: (row) => `<span class="font-data-mono font-bold text-primary">#ACT-${row.id_actividad}</span>`,
      },
      {
        header: 'Clave / Título',
        field: 'titulo',
        render: (row) => `
          <div class="flex flex-col">
            <span class="font-title-md font-semibold text-text-primary">${row.titulo || row.nombre || '-'}</span>
            <span class="font-data-mono text-xs text-text-tertiary">Clave: ${row.clave || 'N/A'}</span>
          </div>
        `,
      },
      {
        header: 'Acción Regulatoria',
        field: 'id_accion.titulo',
        render: (row) => row.id_accion ? `<span class="font-body-sm font-semibold text-secondary">${row.id_accion.titulo || row.id_accion.clave}</span>` : '<span class="text-text-tertiary">-</span>',
      },
      {
        header: 'Descripción',
        field: 'descripcion',
        render: (row) => `<span class="font-body-sm text-text-secondary line-clamp-2">${row.descripcion || 'Sin descripción'}</span>`,
      },
    ];

    container.innerHTML = `
      ${renderInstitutionalBanner(
        'Catálogo de Actividades Operativas',
        'Definición de tareas técnicas y operativas vinculadas a las acciones regulatorias',
        'CATÁLOGO DE ACTIVIDADES'
      )}

      <div class="flex flex-col sm:flex-row items-center justify-between gap-space-md mb-space-md">
        <div class="flex items-center gap-space-xs w-full sm:w-auto">
          <span class="font-title-md text-title-md text-text-primary font-bold">Total Actividades:</span>
          <span class="font-data-mono text-headline-sm text-primary font-bold">${count}</span>
        </div>
        <div class="flex items-center gap-space-xs w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-add-actividad"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Nueva Actividad</span>
          </button>
        </div>
      </div>

      <div id="table-container">
        ${renderDataTable({
          columns,
          data,
          loading,
          count,
          page: currentPage,
          pageSize: 10,
          emptyTitle: 'No hay actividades registradas',
          emptyIcon: 'task',
          idField: 'id_actividad',
        })}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const btnAdd = container.querySelector('#btn-add-actividad');
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
        const item = data.find(d => d.id_actividad === id);
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

  await loadAccionesCatalog();
  await fetchPage(1);
}
