import { cobrosService, fichasService } from '../services/crud-factory.js';
import { renderDataTable, renderInstitutionalBanner, showFormModal, showConfirmModal, showToast } from '../components/organisms.js';

export async function renderCobrosPage(container) {
  let currentPage = 1;
  let loading = true;
  let data = [];
  let count = 0;
  let fichasList = [];

  async function loadFichasCatalog() {
    try {
      const res = await fichasService.list({ page_size: 100 });
      fichasList = (res.results || []).map(f => ({ value: f.id_ficha, label: `#FCH-${f.id_ficha} | ${f.id_tramite_servicio?.nombre_oficial || 'Sin Trámite'}` }));
    } catch (err) {
      console.error('Error al cargar fichas en cobros:', err);
    }
  }

  async function fetchPage(page = 1) {
    loading = true;
    render();
    try {
      const res = await cobrosService.list({ page });
      data = res.results || [];
      count = res.count || 0;
      currentPage = page;
    } catch (err) {
      console.error('Error al cargar catálogo de cobros:', err);
      data = [];
      count = 0;
    } finally {
      loading = false;
      render();
    }
  }

  function getFormFields() {
    return [
      { name: 'id_ficha_id', label: 'Ficha Diagnóstica Asociada', type: 'select', required: true, options: fichasList, fullWidth: true },
      { name: 'concepto', label: 'Concepto del Pago / Cobro', type: 'text', required: true, fullWidth: true },
      { name: 'unidad_medida', label: 'Unidad de Medida (ej. UMA, MXN)', type: 'text', placeholder: 'UMA' },
      { name: 'importe', label: 'Importe / Monto del Cobro', type: 'number', min: 0 },
      { name: 'forma_pago', label: 'Forma de Pago Aceptada', type: 'text', placeholder: 'ej. Transferencia, Ventanilla, Tarjeta' },
    ];
  }

  function openCreateModal() {
    showFormModal({
      title: 'Nuevo Concepto de Cobro',
      icon: 'payments',
      fields: getFormFields(),
      submitText: 'Crear Concepto de Cobro',
      onSubmit: async (payload) => {
        await cobrosService.create(payload);
        await fetchPage(currentPage);
      },
    });
  }

  function openEditModal(item) {
    const initial = {
      ...item,
      id_ficha_id: item.id_ficha?.id_ficha || item.id_ficha_id,
    };
    showFormModal({
      title: `Editar Cobro #${item.id_cobros}`,
      icon: 'edit',
      fields: getFormFields(),
      initialData: initial,
      submitText: 'Actualizar Cobro',
      onSubmit: async (payload) => {
        await cobrosService.partialUpdate(item.id_cobros, payload);
        await fetchPage(currentPage);
      },
    });
  }

  function confirmDelete(id) {
    showConfirmModal({
      title: '¿Eliminar Concepto de Cobro?',
      message: 'Esta acción eliminará el registro de cobro.',
      onConfirm: async () => {
        await cobrosService.remove(id);
        showToast('Cobro eliminado correctamente', 'success');
        await fetchPage(currentPage);
      },
    });
  }

  function render() {
    const columns = [
      {
        header: 'ID Cobro',
        field: 'id_cobros',
        width: 'w-24',
        render: (row) => `<span class="font-data-mono font-bold text-primary">#COB-${row.id_cobros}</span>`,
      },
      {
        header: 'Ficha Diagnóstica',
        field: 'id_ficha.id_ficha',
        render: (row) => row.id_ficha ? `<span class="font-body-sm font-semibold text-secondary">#FCH-${row.id_ficha.id_ficha || row.id_ficha}</span>` : '<span class="text-text-tertiary">-</span>',
      },
      {
        header: 'Concepto del Pago',
        field: 'concepto',
        render: (row) => `<span class="font-body-sm text-text-primary font-semibold">${row.concepto || '-'}</span>`,
      },
      {
        header: 'Importe / Medida',
        field: 'importe',
        width: 'w-44',
        render: (row) => {
          const num = parseFloat(row.importe);
          const formatted = isNaN(num) ? '$0.00' : `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
          return `
            <div class="flex flex-col">
              <span class="font-data-mono font-bold text-tertiary text-body-md">${formatted}</span>
              <span class="font-data-mono text-xs text-text-tertiary">${row.unidad_medida || 'MXN'}</span>
            </div>
          `;
        },
      },
      {
        header: 'Forma de Pago',
        field: 'forma_pago',
        render: (row) => `<span class="font-body-sm text-text-secondary">${row.forma_pago || 'No especificada'}</span>`,
      },
    ];

    container.innerHTML = `
      ${renderInstitutionalBanner(
        'Catálogo de Derechos, Tasas y Cobros',
        'Registro de cuotas, montos y fundamentos normativos de cobro en trámites municipales',
        'CATÁLOGO DE COBROS'
      )}

      <div class="flex flex-col sm:flex-row items-center justify-between gap-space-md mb-space-md">
        <div class="flex items-center gap-space-xs w-full sm:w-auto">
          <span class="font-title-md text-title-md text-text-primary font-bold">Conceptos de Cobro:</span>
          <span class="font-data-mono text-headline-sm text-primary font-bold">${count}</span>
        </div>
        <div class="flex items-center gap-space-xs w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-add-cobro"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Nuevo Concepto de Cobro</span>
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
          emptyTitle: 'No hay conceptos de cobro registrados',
          emptyIcon: 'payments',
          idField: 'id_cobros',
        })}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const btnAdd = container.querySelector('#btn-add-cobro');
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
        const item = data.find(d => d.id_cobros === id);
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

  await loadFichasCatalog();
  await fetchPage(1);
}
