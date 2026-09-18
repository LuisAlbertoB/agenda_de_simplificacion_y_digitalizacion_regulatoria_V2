import { entregablesService, actividadesService } from '../services/crud-factory.js';
import { renderDataTable, renderInstitutionalBanner, showFormModal, showConfirmModal, showToast } from '../components/organisms.js';

export async function renderEntregablesPage(container) {
  let currentPage = 1;
  let loading = true;
  let data = [];
  let count = 0;
  let actividadesList = [];

  async function loadActividadesCatalog() {
    try {
      const res = await actividadesService.list({ page_size: 100 });
      actividadesList = (res.results || []).map(act => ({ value: act.id_actividad, label: `${act.clave || act.id_actividad} - ${act.titulo || act.nombre}` }));
    } catch (err) {
      console.error('Error al cargar actividades en entregables:', err);
    }
  }

  async function fetchPage(page = 1) {
    loading = true;
    render();
    try {
      const res = await entregablesService.list({ page });
      data = res.results || [];
      count = res.count || 0;
      currentPage = page;
    } catch (err) {
      console.error('Error al cargar entregables:', err);
      data = [];
      count = 0;
    } finally {
      loading = false;
      render();
    }
  }

  function getFormFields() {
    return [
      { name: 'id_actividad_id', label: 'Actividad Operativa Padre', type: 'select', required: true, options: actividadesList, fullWidth: true },
      { name: 'clave', label: 'Clave del Entregable', type: 'text', required: true, placeholder: 'ej. ENT-01' },
      { name: 'titulo', label: 'Título del Entregable / Producto', type: 'text', required: true, fullWidth: true },
      { name: 'descripcion', label: 'Descripción / Criterio de Aceptación', type: 'textarea', fullWidth: true },
    ];
  }

  function openCreateModal() {
    showFormModal({
      title: 'Nuevo Entregable',
      icon: 'inventory_2',
      fields: getFormFields(),
      submitText: 'Crear Entregable',
      onSubmit: async (payload) => {
        await entregablesService.create(payload);
        await fetchPage(currentPage);
      },
    });
  }

  function openEditModal(item) {
    const initial = {
      ...item,
      id_actividad_id: item.id_actividad?.id_actividad || item.id_actividad_id,
    };
    showFormModal({
      title: `Editar Entregable #${item.id_entregable}`,
      icon: 'edit',
      fields: getFormFields(),
      initialData: initial,
      submitText: 'Actualizar Entregable',
      onSubmit: async (payload) => {
        await entregablesService.partialUpdate(item.id_entregable, payload);
        await fetchPage(currentPage);
      },
    });
  }

  function confirmDelete(id) {
    showConfirmModal({
      title: '¿Eliminar Entregable?',
      message: 'Esta acción eliminará el entregable del catálogo.',
      onConfirm: async () => {
        await entregablesService.remove(id);
        showToast('Entregable eliminado correctamente', 'success');
        await fetchPage(currentPage);
      },
    });
  }

  function render() {
    const columns = [
      {
        header: 'ID Entregable',
        field: 'id_entregable',
        width: 'w-28',
        render: (row) => `<span class="font-data-mono font-bold text-primary">#ENT-${row.id_entregable}</span>`,
      },
      {
        header: 'Clave / Título del Entregable',
        field: 'titulo',
        render: (row) => `
          <div class="flex flex-col">
            <span class="font-title-md font-semibold text-text-primary">${row.titulo || row.nombre || '-'}</span>
            <span class="font-data-mono text-xs text-text-tertiary">Clave: ${row.clave || 'N/A'}</span>
          </div>
        `,
      },
      {
        header: 'Actividad Vinculada',
        field: 'id_actividad.titulo',
        render: (row) => row.id_actividad ? `<span class="font-body-sm font-semibold text-secondary">${row.id_actividad.titulo || row.id_actividad.clave}</span>` : '<span class="text-text-tertiary">-</span>',
      },
      {
        header: 'Descripción',
        field: 'descripcion',
        render: (row) => `<span class="font-body-sm text-text-secondary line-clamp-2">${row.descripcion || 'Sin descripción'}</span>`,
      },
    ];

    container.innerHTML = `
      ${renderInstitutionalBanner(
        'Catálogo Oficial de Entregables',
        'Evidencias documentales y productos requeridos para el cumplimiento de hitos FASD',
        'CATÁLOGO DE ENTREGABLES'
      )}

      <div class="flex flex-col sm:flex-row items-center justify-between gap-space-md mb-space-md">
        <div class="flex items-center gap-space-xs w-full sm:w-auto">
          <span class="font-title-md text-title-md text-text-primary font-bold">Total Entregables:</span>
          <span class="font-data-mono text-headline-sm text-primary font-bold">${count}</span>
        </div>
        <div class="flex items-center gap-space-xs w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-add-entregable"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Nuevo Entregable</span>
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
          emptyTitle: 'No hay entregables registrados',
          emptyIcon: 'inventory_2',
          idField: 'id_entregable',
        })}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const btnAdd = container.querySelector('#btn-add-entregable');
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
        const item = data.find(d => d.id_entregable === id);
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

  await loadActividadesCatalog();
  await fetchPage(1);
}
