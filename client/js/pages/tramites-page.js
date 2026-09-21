import { tramitesService } from '../services/crud-factory.js';
import { renderDataTable, renderInstitutionalBanner, showFormModal, showConfirmModal, showToast } from '../components/organisms.js';
import { renderBadge, renderButton } from '../components/atoms.js';

export async function renderTramitesPage(container) {
  let currentPage = 1;
  let loading = true;
  let data = [];
  let count = 0;

  async function fetchPage(page = 1) {
    loading = true;
    render();
    try {
      const res = await tramitesService.list({ page });
      data = res.results || [];
      count = res.count || 0;
      currentPage = page;
    } catch (err) {
      console.error('Error al cargar trámites y servicios:', err);
      data = [];
      count = 0;
    } finally {
      loading = false;
      render();
    }
  }

  function getFormFields() {
    return [
      { name: 'clave', label: 'Clave Única del Trámite', type: 'text', required: true, fullWidth: true, placeholder: 'ej. TR-001' },
      { name: 'nombre_oficial', label: 'Nombre Oficial Completo', type: 'text', required: true, fullWidth: true },
      { name: 'descripcion', label: 'Descripción del Trámite/Servicio', type: 'textarea', fullWidth: true },
      { name: 'objetivo', label: 'Objetivo Institucional', type: 'textarea', fullWidth: true },
      {
        name: 'tipos_atencion_ids',
        label: 'Tipo de Trámite o Servicio (Modalidades)',
        type: 'multi-checkbox',
        fullWidth: true,
        options: [
          { value: 0, label: 'Presencial' },
          { value: 1, label: 'Vía Telefónica' },
          { value: 2, label: 'Vía Digital' },
        ],
      },
      { name: 'tramite_o_servicio', label: 'Categoría del Trámite o Servicio', type: 'radio-bool', trueLabel: 'Trámite', falseLabel: 'Servicio', defaultValue: true },
    ];
  }

  function openCreateModal() {
    showFormModal({
      title: 'Nuevo Trámite o Servicio',
      icon: 'add_task',
      fields: getFormFields(),
      submitText: 'Crear Trámite',
      onSubmit: async (payload) => {
        await tramitesService.create(payload);
        await fetchPage(currentPage);
      },
    });
  }

  function openEditModal(item) {
    const formattedItem = {
      ...item,
      tipos_atencion_ids: Array.isArray(item.tipos_atencion)
        ? item.tipos_atencion.map((t) => t.tipo)
        : [],
    };
    showFormModal({
      title: `Editar Trámite #${item.id_tramite_servicio}`,
      icon: 'edit',
      fields: getFormFields(),
      initialData: formattedItem,
      submitText: 'Actualizar Trámite',
      onSubmit: async (payload) => {
        await tramitesService.partialUpdate(item.id_tramite_servicio, payload);
        await fetchPage(currentPage);
      },
    });
  }

  function confirmDelete(id) {
    showConfirmModal({
      title: '¿Eliminar Trámite?',
      message: 'Esta acción eliminará el trámite/servicio del catálogo general si no está vinculado a fichas existentes.',
      onConfirm: async () => {
        await tramitesService.remove(id);
        showToast('Trámite eliminado correctamente', 'success');
        await fetchPage(currentPage);
      },
    });
  }

  function render() {
    const columns = [
      {
        header: 'Clave',
        field: 'clave',
        width: 'w-40',
        render: (row) => `<span class="font-data-mono font-semibold text-primary">${row.clave || '-'}</span>`,
      },
      {
        header: 'Nombre del Trámite / Servicio',
        field: 'nombre_oficial',
        render: (row) => `
          <div class="flex flex-col">
            <span class="font-title-md font-semibold text-text-primary">${row.nombre_oficial || '-'}</span>
            ${row.descripcion ? `<span class="font-body-sm text-text-tertiary text-xs truncate max-w-md mt-0.5">${row.descripcion}</span>` : ''}
          </div>
        `,
      },
      {
        header: 'Categoría',
        field: 'tramite_o_servicio',
        width: 'w-32',
        render: (row) => {
          const isTramite = row.tramite_o_servicio !== false;
          return renderBadge(isTramite ? 'TRÁMITE' : 'SERVICIO', isTramite ? 'primary' : 'secondary');
        },
      },
      {
        header: 'Modalidad (Tipo)',
        field: 'tipos_atencion',
        width: 'w-56',
        render: (row) => {
          const labels = { 0: 'Presencial', 1: 'Vía Telefónica', 2: 'Vía Digital' };
          const tipos = Array.isArray(row.tipos_atencion) && row.tipos_atencion.length > 0
            ? row.tipos_atencion.map(t => labels[t.tipo] ?? `Tipo ${t.tipo}`)
            : ['Sin especificar'];
          return `<div class="flex flex-wrap gap-1">${tipos.map(l => renderBadge(l, 'tertiary')).join('')}</div>`;
        },
      },
    ];

    container.innerHTML = `
      ${renderInstitutionalBanner(
        'Catálogo Oficial de Trámites y Servicios',
        'Registro municipal completo de trámites y servicios del H. Ayuntamiento de Tuxtla Gutiérrez',
        'CATÁLOGO GENERAL'
      )}

      <!-- Toolbar Superior -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-space-md mb-space-md">
        <div class="flex items-center gap-space-xs w-full sm:w-auto">
          <span class="font-title-md text-title-md text-text-primary font-bold">Trámites Registrados:</span>
          <span class="font-data-mono text-headline-sm text-primary font-bold">${count}</span>
        </div>
        <div class="flex items-center gap-space-xs w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-add-tramite"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Nuevo Trámite</span>
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
          emptyTitle: 'No hay trámites registrados',
          emptyIcon: 'list_alt',
          idField: 'id_tramite_servicio',
        })}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const btnAdd = container.querySelector('#btn-add-tramite');
    if (btnAdd) {
      btnAdd.addEventListener('click', openCreateModal);
    }

    const tableContainer = container.querySelector('#table-container');
    if (!tableContainer) return;

    tableContainer.addEventListener('click', (e) => {
      const btnEdit = e.target.closest('[data-action="edit"]');
      const btnDelete = e.target.closest('[data-action="delete"]');
      const btnPrev = e.target.closest('[data-action="prev-page"]');
      const btnNext = e.target.closest('[data-action="next-page"]');

      if (btnEdit) {
        const id = parseInt(btnEdit.dataset.id, 10);
        const item = data.find(d => d.id_tramite_servicio === id);
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
