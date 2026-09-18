import { accionesService } from '../services/crud-factory.js';
import { renderDataTable, renderInstitutionalBanner, showFormModal, showConfirmModal, showToast } from '../components/organisms.js';
import { renderBadge } from '../components/atoms.js';

export async function renderAccionesPage(container) {
  let currentPage = 1;
  let loading = true;
  let data = [];
  let count = 0;

  async function fetchPage(page = 1) {
    loading = true;
    render();
    try {
      const res = await accionesService.list({ page });
      data = res.results || [];
      count = res.count || 0;
      currentPage = page;
    } catch (err) {
      console.error('Error al cargar catálogo de acciones:', err);
      data = [];
      count = 0;
    } finally {
      loading = false;
      render();
    }
  }

  function getFormFields() {
    return [
      { name: 'clave', label: 'Clave de Acción (LNETB)', type: 'text', required: true, placeholder: 'ej. AMP_VIGENCIA' },
      { name: 'titulo', label: 'Título de la Acción', type: 'text', required: true, fullWidth: true },
      { name: 'descripcion', label: 'Descripción de la Acción Regulatoria', type: 'textarea', fullWidth: true },
      {
        name: 'simplificacion_o_digitalizacion',
        label: 'Eje de Acción LNETB',
        type: 'select',
        required: true,
        options: [
          { value: 'true', label: 'Simplificación Regulatoria' },
          { value: 'false', label: 'Digitalización Tecnológica' },
        ],
      },
    ];
  }

  function openCreateModal() {
    showFormModal({
      title: 'Nueva Acción Regulatoria',
      icon: 'extension',
      fields: getFormFields(),
      submitText: 'Crear Acción',
      onSubmit: async (payload) => {
        if (payload.simplificacion_o_digitalizacion === 'true') payload.simplificacion_o_digitalizacion = true;
        if (payload.simplificacion_o_digitalizacion === 'false') payload.simplificacion_o_digitalizacion = false;
        await accionesService.create(payload);
        await fetchPage(currentPage);
      },
    });
  }

  function openEditModal(item) {
    const initial = {
      ...item,
      simplificacion_o_digitalizacion: String(item.simplificacion_o_digitalizacion),
    };
    showFormModal({
      title: `Editar Acción #${item.id_accion}`,
      icon: 'edit',
      fields: getFormFields(),
      initialData: initial,
      submitText: 'Actualizar Acción',
      onSubmit: async (payload) => {
        if (payload.simplificacion_o_digitalizacion === 'true') payload.simplificacion_o_digitalizacion = true;
        if (payload.simplificacion_o_digitalizacion === 'false') payload.simplificacion_o_digitalizacion = false;
        await accionesService.partialUpdate(item.id_accion, payload);
        await fetchPage(currentPage);
      },
    });
  }

  function confirmDelete(id) {
    showConfirmModal({
      title: '¿Eliminar Acción?',
      message: 'Esta acción eliminará la acción del catálogo si no está vinculada a fichas.',
      onConfirm: async () => {
        await accionesService.remove(id);
        showToast('Acción eliminada correctamente', 'success');
        await fetchPage(currentPage);
      },
    });
  }

  function render() {
    const columns = [
      {
        header: 'Clave Acción',
        field: 'clave',
        width: 'w-36',
        render: (row) => `<span class="font-data-mono font-bold text-primary">${row.clave || '-'}</span>`,
      },
      {
        header: 'Título de la Acción',
        field: 'titulo',
        render: (row) => `
          <div class="flex flex-col">
            <span class="font-title-md font-semibold text-text-primary">${row.titulo || '-'}</span>
            ${row.descripcion ? `<span class="font-body-sm text-text-tertiary text-xs line-clamp-2 mt-0.5">${row.descripcion}</span>` : ''}
          </div>
        `,
      },
      {
        header: 'Eje LNETB',
        field: 'simplificacion_o_digitalizacion',
        width: 'w-44',
        render: (row) => {
          const isSimp = row.simplificacion_o_digitalizacion === true || row.simplificacion_o_digitalizacion === 'true';
          return renderBadge(isSimp ? 'SIMPLIFICACIÓN' : 'DIGITALIZACIÓN', isSimp ? 'primary' : 'tertiary');
        },
      },
    ];

    container.innerHTML = `
      ${renderInstitutionalBanner(
        'Catálogo de Acciones Regulatorias (LNETB)',
        'Acciones de simplificación, reducción de requisitos y optimización de flujos de trámites',
        'CATÁLOGO DE ACCIONES'
      )}

      <div class="flex flex-col sm:flex-row items-center justify-between gap-space-md mb-space-md">
        <div class="flex items-center gap-space-xs w-full sm:w-auto">
          <span class="font-title-md text-title-md text-text-primary font-bold">Total de Acciones LNETB:</span>
          <span class="font-data-mono text-headline-sm text-primary font-bold">${count}</span>
        </div>
        <div class="flex items-center gap-space-xs w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-add-accion"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Nueva Acción</span>
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
          emptyTitle: 'No hay acciones registradas',
          emptyIcon: 'extension',
          idField: 'id_accion',
        })}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const btnAdd = container.querySelector('#btn-add-accion');
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
        const item = data.find(d => d.id_accion === id);
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

  await fetchPage(1);
}
