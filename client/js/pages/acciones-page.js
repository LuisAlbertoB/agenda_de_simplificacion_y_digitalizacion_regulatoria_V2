import { accionesService, actividadesService, entregablesService } from '../services/crud-factory.js';
import { renderDataTable, renderInstitutionalBanner, showFormModal, showConfirmModal, showToast } from '../components/organisms.js';
import { renderBadge, renderSpinner } from '../components/atoms.js';

export async function renderAccionesPage(container) {
  let selectedAccion = null;
  let selectedActividad = null;

  let accionesList = [];
  let accionesCount = 0;
  let accionesPage = 1;
  let loadingAcciones = true;

  let actividadesList = [];
  let actividadesCount = 0;
  let actividadesPage = 1;
  let loadingActividades = false;

  let entregablesList = [];
  let entregablesCount = 0;
  let entregablesPage = 1;
  let loadingEntregables = false;

  // ── Carga de Acciones (Nivel 1) ──
  async function fetchAcciones(page = 1) {
    loadingAcciones = true;
    render();
    try {
      const res = await accionesService.list({ page, page_size: 20 });
      accionesList = res.results || [];
      accionesCount = res.count || 0;
      accionesPage = page;
    } catch (err) {
      console.error('Error al cargar acciones:', err);
      showToast('Error al cargar catálogo de acciones', 'error');
      accionesList = [];
      accionesCount = 0;
    } finally {
      loadingAcciones = false;
      render();
    }
  }

  // ── Carga de Actividades (Nivel 2) ──
  async function fetchActividades(accion, page = 1) {
    selectedAccion = accion;
    selectedActividad = null;
    loadingActividades = true;
    render();
    try {
      const res = await actividadesService.list({ id_accion: accion.id_accion, page, page_size: 50 });
      actividadesList = res.results || [];
      actividadesCount = res.count || 0;
      actividadesPage = page;
    } catch (err) {
      console.error('Error al cargar actividades:', err);
      showToast('Error al cargar actividades de la acción', 'error');
      actividadesList = [];
      actividadesCount = 0;
    } finally {
      loadingActividades = false;
      render();
    }
  }

  // ── Carga de Entregables (Nivel 3) ──
  async function fetchEntregables(actividad, page = 1) {
    selectedActividad = actividad;
    loadingEntregables = true;
    render();
    try {
      const res = await entregablesService.list({ id_actividad: actividad.id_actividades, page, page_size: 50 });
      entregablesList = res.results || [];
      entregablesCount = res.count || 0;
      entregablesPage = page;
    } catch (err) {
      console.error('Error al cargar entregables:', err);
      showToast('Error al cargar entregables de la actividad', 'error');
      entregablesList = [];
      entregablesCount = 0;
    } finally {
      loadingEntregables = false;
      render();
    }
  }

  // ── CRUD Acciones (Nivel 1) ──
  function openCreateAccionModal() {
    showFormModal({
      title: 'Nueva Acción Regulatoria (LNETB)',
      icon: 'extension',
      fields: [
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
      ],
      submitText: 'Crear Acción',
      onSubmit: async (payload) => {
        if (payload.simplificacion_o_digitalizacion === 'true') payload.simplificacion_o_digitalizacion = true;
        if (payload.simplificacion_o_digitalizacion === 'false') payload.simplificacion_o_digitalizacion = false;
        await accionesService.create(payload);
        showToast('Acción creada exitosamente', 'success');
        await fetchAcciones(accionesPage);
      },
    });
  }

  function openEditAccionModal(item) {
    const initial = {
      ...item,
      simplificacion_o_digitalizacion: String(item.simplificacion_o_digitalizacion),
    };
    showFormModal({
      title: `Editar Acción #${item.clave}`,
      icon: 'edit',
      fields: [
        { name: 'clave', label: 'Clave de Acción (LNETB)', type: 'text', required: true },
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
      ],
      initialData: initial,
      submitText: 'Actualizar Acción',
      onSubmit: async (payload) => {
        if (payload.simplificacion_o_digitalizacion === 'true') payload.simplificacion_o_digitalizacion = true;
        if (payload.simplificacion_o_digitalizacion === 'false') payload.simplificacion_o_digitalizacion = false;
        const updated = await accionesService.partialUpdate(item.id_accion, payload);
        if (selectedAccion && selectedAccion.id_accion === item.id_accion) {
          selectedAccion = updated;
        }
        showToast('Acción actualizada', 'success');
        await fetchAcciones(accionesPage);
      },
    });
  }

  async function confirmDeleteAccion(accion) {
    // Conteo previo de elementos hijos para aviso de borrado en cascada
    let actCount = 0;
    let entCount = 0;

    try {
      const actRes = await actividadesService.list({ id_accion: accion.id_accion, page_size: 100 });
      const acts = actRes.results || [];
      actCount = acts.length;

      const entPromises = acts.map(act => entregablesService.list({ id_actividad: act.id_actividades, page_size: 1 }));
      const entResults = await Promise.all(entPromises);
      entCount = entResults.reduce((acc, r) => acc + (r.count || r.results?.length || 0), 0);
    } catch (e) {
      console.warn('No se pudo precargar el conteo de cascada:', e);
    }

    const warningMsg = actCount > 0 || entCount > 0
      ? `Atención: Esta acción contiene ${actCount} actividad(es) y ${entCount} entregable(s). Eliminarla eliminará en CASCADA todo el árbol asociado.`
      : 'Esta acción se eliminará permanentemente del catálogo.';

    showConfirmModal({
      title: `¿Eliminar Acción #${accion.clave}?`,
      message: warningMsg,
      variant: 'danger',
      onConfirm: async () => {
        await accionesService.remove(accion.id_accion);
        showToast('Acción y sus elementos hijos eliminados', 'success');
        if (selectedAccion && selectedAccion.id_accion === accion.id_accion) {
          selectedAccion = null;
          selectedActividad = null;
        }
        await fetchAcciones(accionesPage);
      },
    });
  }

  // ── CRUD Actividades (Nivel 2) ──
  function openCreateActividadModal() {
    if (!selectedAccion) return;
    showFormModal({
      title: `Nueva Actividad para Acción #${selectedAccion.clave}`,
      icon: 'playlist_add',
      fields: [
        { name: 'accion_info', label: 'Acción Padre (Fija)', type: 'text', defaultValue: `[${selectedAccion.clave}] ${selectedAccion.titulo}`, disabled: true, fullWidth: true },
        { name: 'clave', label: 'Clave de Actividad', type: 'text', required: true, placeholder: `ej. ${selectedAccion.clave}-ACT01` },
        { name: 'titulo', label: 'Título de la Actividad', type: 'text', required: true, fullWidth: true },
        { name: 'descripcion', label: 'Descripción Detallada', type: 'textarea', fullWidth: true },
      ],
      submitText: 'Crear Actividad',
      onSubmit: async (payload) => {
        delete payload.accion_info;
        payload.id_accion_id = selectedAccion.id_accion;
        await actividadesService.create(payload);
        showToast('Actividad agregada a la acción', 'success');
        await fetchActividades(selectedAccion, actividadesPage);
      },
    });
  }

  function openEditActividadModal(actividad) {
    showFormModal({
      title: `Editar Actividad #${actividad.clave}`,
      icon: 'edit',
      fields: [
        { name: 'clave', label: 'Clave de Actividad', type: 'text', required: true },
        { name: 'titulo', label: 'Título de la Actividad', type: 'text', required: true, fullWidth: true },
        { name: 'descripcion', label: 'Descripción Detallada', type: 'textarea', fullWidth: true },
      ],
      initialData: actividad,
      submitText: 'Actualizar Actividad',
      onSubmit: async (payload) => {
        const updated = await actividadesService.partialUpdate(actividad.id_actividades, payload);
        if (selectedActividad && selectedActividad.id_actividades === actividad.id_actividades) {
          selectedActividad = updated;
        }
        showToast('Actividad actualizada', 'success');
        await fetchActividades(selectedAccion, actividadesPage);
      },
    });
  }

  async function confirmDeleteActividad(actividad) {
    let entCount = 0;
    try {
      const entRes = await entregablesService.list({ id_actividad: actividad.id_actividades, page_size: 1 });
      entCount = entRes.count || entRes.results?.length || 0;
    } catch (e) {
      console.warn('Error al verificar entregables de la actividad:', e);
    }

    const warningMsg = entCount > 0
      ? `Atención: Esta actividad contiene ${entCount} entregable(s). Se eliminarán en CASCADA junto con esta actividad.`
      : 'Esta actividad se eliminará permanentemente de la acción.';

    showConfirmModal({
      title: `¿Eliminar Actividad #${actividad.clave}?`,
      message: warningMsg,
      variant: 'danger',
      onConfirm: async () => {
        await actividadesService.remove(actividad.id_actividades);
        showToast('Actividad y sus entregables eliminados', 'success');
        if (selectedActividad && selectedActividad.id_actividades === actividad.id_actividades) {
          selectedActividad = null;
        }
        await fetchActividades(selectedAccion, actividadesPage);
      },
    });
  }

  // ── CRUD Entregables (Nivel 3) ──
  function openCreateEntregableModal() {
    if (!selectedActividad) return;
    showFormModal({
      title: `Nuevo Entregable para Actividad #${selectedActividad.clave}`,
      icon: 'assignment_add',
      fields: [
        { name: 'actividad_info', label: 'Actividad Padre (Fija)', type: 'text', defaultValue: `[${selectedActividad.clave}] ${selectedActividad.titulo}`, disabled: true, fullWidth: true },
        { name: 'clave', label: 'Clave de Entregable', type: 'text', required: true, placeholder: `ej. ${selectedActividad.clave}-ENT01` },
        { name: 'titulo', label: 'Título del Entregable', type: 'text', required: true, fullWidth: true },
        { name: 'descripcion', label: 'Descripción / Requisitos del Entregable', type: 'textarea', fullWidth: true },
        {
          name: 'status',
          label: 'Estado del Entregable',
          type: 'select',
          options: [
            { value: 'false', label: 'Pendiente' },
            { value: 'true', label: 'Completado' },
          ],
        },
      ],
      submitText: 'Crear Entregable',
      onSubmit: async (payload) => {
        delete payload.actividad_info;
        payload.id_actividad_id = selectedActividad.id_actividades;
        payload.status = payload.status === 'true';
        await entregablesService.create(payload);
        showToast('Entregable registrado en la actividad', 'success');
        await fetchEntregables(selectedActividad, entregablesPage);
      },
    });
  }

  function openEditEntregableModal(entregable) {
    const initial = {
      ...entregable,
      status: String(entregable.status),
    };
    showFormModal({
      title: `Editar Entregable #${entregable.clave}`,
      icon: 'edit',
      fields: [
        { name: 'clave', label: 'Clave de Entregable', type: 'text', required: true },
        { name: 'titulo', label: 'Título del Entregable', type: 'text', required: true, fullWidth: true },
        { name: 'descripcion', label: 'Descripción / Requisitos', type: 'textarea', fullWidth: true },
        {
          name: 'status',
          label: 'Estado del Entregable',
          type: 'select',
          options: [
            { value: 'false', label: 'Pendiente' },
            { value: 'true', label: 'Completado' },
          ],
        },
      ],
      initialData: initial,
      submitText: 'Actualizar Entregable',
      onSubmit: async (payload) => {
        payload.status = payload.status === 'true';
        await entregablesService.partialUpdate(entregable.id_entregable, payload);
        showToast('Entregable actualizado', 'success');
        await fetchEntregables(selectedActividad, entregablesPage);
      },
    });
  }

  function confirmDeleteEntregable(id) {
    showConfirmModal({
      title: '¿Eliminar Entregable?',
      message: 'Este entregable se removerá permanentemente de la actividad.',
      onConfirm: async () => {
        await entregablesService.remove(id);
        showToast('Entregable eliminado', 'success');
        await fetchEntregables(selectedActividad, entregablesPage);
      },
    });
  }

  // ── Renderizado Principal ──
  function render() {
    container.innerHTML = `
      ${renderInstitutionalBanner(
        'Catálogo Jerárquico de Acciones, Actividades y Entregables (LNETB)',
        'Estructura oficial de 3 niveles para la planificación y seguimiento de simplificación y digitalización',
        'JERARQUÍA DE ACCIONES LNETB'
      )}

      <!-- Breadcrumbs de Navegación -->
      <div class="flex items-center gap-2 mb-space-md p-3 rounded-xl bg-surface-container border border-border-subtle text-xs font-title-md overflow-x-auto">
        <button type="button" id="bc-acciones" class="flex items-center gap-1 text-primary hover:underline font-bold">
          <span class="material-symbols-outlined text-[16px]">account_tree</span>
          <span>Todas las Acciones (${accionesCount})</span>
        </button>
        ${selectedAccion ? `
          <span class="text-text-tertiary">/</span>
          <button type="button" id="bc-accion" class="flex items-center gap-1 ${selectedActividad ? 'text-primary hover:underline font-semibold' : 'text-text-primary font-bold'}">
            <span class="material-symbols-outlined text-[16px]">architecture</span>
            <span>Acción #${selectedAccion.clave}</span>
          </button>
        ` : ''}
        ${selectedActividad ? `
          <span class="text-text-tertiary">/</span>
          <span class="flex items-center gap-1 text-text-primary font-bold">
            <span class="material-symbols-outlined text-[16px]">checklist</span>
            <span>Actividad #${selectedActividad.clave}</span>
          </span>
        ` : ''}
      </div>

      <!-- Vista Nivel 1: Lista de Acciones -->
      ${!selectedAccion ? renderNivelAcciones() : ''}

      <!-- Vista Nivel 2: Lista de Actividades de la Acción seleccionada -->
      ${selectedAccion && !selectedActividad ? renderNivelActividades() : ''}

      <!-- Vista Nivel 3: Lista de Entregables de la Actividad seleccionada -->
      ${selectedAccion && selectedActividad ? renderNivelEntregables() : ''}
    `;

    attachEvents();
  }

  // Render Nivel 1 (Acciones)
  function renderNivelAcciones() {
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
      {
        header: 'Jerarquía',
        width: 'w-40',
        render: (row) => `
          <button
            type="button"
            data-action="view-actividades"
            data-id="${row.id_accion}"
            class="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-border-gold font-title-md text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <span class="material-symbols-outlined text-[16px]">view_list</span>
            <span>Ver Actividades</span>
          </button>
        `,
      }
    ];

    return `
      <div class="space-y-space-md">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div class="flex items-center gap-space-xs w-full sm:w-auto">
            <span class="font-title-md text-title-md text-text-primary font-bold">Total Acciones LNETB:</span>
            <span class="font-data-mono text-headline-sm text-primary font-bold">${accionesCount}</span>
          </div>
          <button
            type="button"
            id="btn-add-accion"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Nueva Acción</span>
          </button>
        </div>

        <div id="acciones-table-container">
          ${renderDataTable({
            columns,
            data: accionesList,
            loading: loadingAcciones,
            count: accionesCount,
            page: accionesPage,
            pageSize: 20,
            emptyTitle: 'No hay acciones registradas',
            emptyIcon: 'extension',
            idField: 'id_accion',
            renderActions: (row) => `
              <div class="inline-flex items-center justify-end gap-1">
                <button type="button" data-action="edit-accion" data-id="${row.id_accion}" class="p-1 rounded bg-surface-container text-primary hover:bg-surface-container-high border border-border-subtle" title="Editar Acción">
                  <span class="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button type="button" data-action="delete-accion" data-id="${row.id_accion}" class="p-1 rounded bg-surface-container text-status-danger hover:bg-surface-container-high border border-border-subtle" title="Eliminar Acción">
                  <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  // Render Nivel 2 (Actividades)
  function renderNivelActividades() {
    const isSimp = selectedAccion.simplificacion_o_digitalizacion === true;
    const columns = [
      {
        header: 'Clave Actividad',
        field: 'clave',
        width: 'w-44',
        render: (row) => `<span class="font-data-mono font-bold text-primary">${row.clave || '-'}</span>`,
      },
      {
        header: 'Título de la Actividad',
        field: 'titulo',
        render: (row) => `
          <div class="flex flex-col">
            <span class="font-title-md font-semibold text-text-primary">${row.titulo || '-'}</span>
            ${row.descripcion ? `<span class="font-body-sm text-text-tertiary text-xs line-clamp-2 mt-0.5">${row.descripcion}</span>` : ''}
          </div>
        `,
      },
      {
        header: 'Entregables',
        width: 'w-40',
        render: (row) => `
          <button
            type="button"
            data-action="view-entregables"
            data-id="${row.id_actividades}"
            class="px-3 py-1.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary border border-border-tech font-title-md text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <span class="material-symbols-outlined text-[16px]">assignment</span>
            <span>Ver Entregables</span>
          </button>
        `,
      }
    ];

    return `
      <div class="space-y-space-md">
        <!-- Card Resumen Padre -->
        <div class="p-5 rounded-2xl bg-surface-card border border-border-gold shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded bg-primary/15 text-primary font-data-mono font-bold text-xs">#ACC-${selectedAccion.clave}</span>
              ${renderBadge(isSimp ? 'SIMPLIFICACIÓN' : 'DIGITALIZACIÓN', isSimp ? 'primary' : 'tertiary')}
            </div>
            <h3 class="font-headline-sm text-headline-sm font-bold text-text-primary mt-1">${selectedAccion.titulo}</h3>
            ${selectedAccion.descripcion ? `<p class="font-body-sm text-xs text-text-secondary max-w-3xl">${selectedAccion.descripcion}</p>` : ''}
          </div>

          <button
            type="button"
            id="btn-add-actividad"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2 shrink-0"
          >
            <span class="material-symbols-outlined text-[18px]">playlist_add</span>
            <span>+ Nueva Actividad</span>
          </button>
        </div>

        <!-- Mensaje para Acciones Abiertas sin Actividades -->
        ${actividadesList.length === 0 && !loadingActividades ? `
          <div class="p-8 text-center rounded-2xl bg-surface-recessed border border-border-subtle flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-[40px] text-text-tertiary">category</span>
            <h4 class="font-title-md text-body-md font-bold text-text-primary">Acción sin actividades predefinidas en el catálogo</h4>
            <p class="font-body-sm text-xs text-text-tertiary max-w-md">Esta acción representa una categoría abierta (ej. OTRAS_SIMP / OTRAS_DIGI). Puedes agregar actividades personalizadas con el botón "+ Nueva Actividad".</p>
          </div>
        ` : `
          <div id="actividades-table-container">
            ${renderDataTable({
              columns,
              data: actividadesList,
              loading: loadingActividades,
              count: actividadesCount,
              page: actividadesPage,
              pageSize: 50,
              emptyTitle: 'No hay actividades asociadas a esta acción',
              emptyIcon: 'checklist',
              idField: 'id_actividades',
              renderActions: (row) => `
                <div class="inline-flex items-center justify-end gap-1">
                  <button type="button" data-action="edit-actividad" data-id="${row.id_actividades}" class="p-1 rounded bg-surface-container text-primary hover:bg-surface-container-high border border-border-subtle" title="Editar Actividad">
                    <span class="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button type="button" data-action="delete-actividad" data-id="${row.id_actividades}" class="p-1 rounded bg-surface-container text-status-danger hover:bg-surface-container-high border border-border-subtle" title="Eliminar Actividad">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              `
            })}
          </div>
        `}
      </div>
    `;
  }

  // Render Nivel 3 (Entregables)
  function renderNivelEntregables() {
    const columns = [
      {
        header: 'Clave Entregable',
        field: 'clave',
        width: 'w-48',
        render: (row) => `<span class="font-data-mono font-bold text-primary">${row.clave || '-'}</span>`,
      },
      {
        header: 'Título del Entregable',
        field: 'titulo',
        render: (row) => `
          <div class="flex flex-col">
            <span class="font-title-md font-semibold text-text-primary">${row.titulo || '-'}</span>
            ${row.descripcion && row.descripcion !== row.titulo ? `<span class="font-body-sm text-text-tertiary text-xs line-clamp-2 mt-0.5">${row.descripcion}</span>` : ''}
          </div>
        `,
      },
      {
        header: 'Estado',
        field: 'status',
        width: 'w-36',
        render: (row) => renderBadge(row.status ? 'COMPLETADO' : 'PENDIENTE', row.status ? 'tertiary' : 'warning'),
      }
    ];

    return `
      <div class="space-y-space-md">
        <!-- Card Resumen Padre Nivel 2 -->
        <div class="p-5 rounded-2xl bg-surface-card border border-border-tech shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded bg-primary/15 text-primary font-data-mono font-bold text-xs">Acción: #${selectedAccion.clave}</span>
              <span class="px-2.5 py-0.5 rounded bg-secondary/15 text-secondary font-data-mono font-bold text-xs">Actividad: #${selectedActividad.clave}</span>
            </div>
            <h3 class="font-headline-sm text-headline-sm font-bold text-text-primary mt-1">${selectedActividad.titulo}</h3>
            ${selectedActividad.descripcion ? `<p class="font-body-sm text-xs text-text-secondary max-w-3xl">${selectedActividad.descripcion}</p>` : ''}
          </div>

          <button
            type="button"
            id="btn-add-entregable"
            class="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2 shrink-0"
          >
            <span class="material-symbols-outlined text-[18px]">assignment_add</span>
            <span>+ Nuevo Entregable</span>
          </button>
        </div>

        <div id="entregables-table-container">
          ${renderDataTable({
            columns,
            data: entregablesList,
            loading: loadingEntregables,
            count: entregablesCount,
            page: entregablesPage,
            pageSize: 50,
            emptyTitle: 'No hay entregables registrados para esta actividad',
            emptyIcon: 'assignment',
            idField: 'id_entregable',
            renderActions: (row) => `
              <div class="inline-flex items-center justify-end gap-1">
                <button type="button" data-action="edit-entregable" data-id="${row.id_entregable}" class="p-1 rounded bg-surface-container text-primary hover:bg-surface-container-high border border-border-subtle" title="Editar Entregable">
                  <span class="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button type="button" data-action="delete-entregable" data-id="${row.id_entregable}" class="p-1 rounded bg-surface-container text-status-danger hover:bg-surface-container-high border border-border-subtle" title="Eliminar Entregable">
                  <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  // ── Eventos ──
  function attachEvents() {
    // Breadcrumbs
    const bcAcciones = container.querySelector('#bc-acciones');
    const bcAccion = container.querySelector('#bc-accion');

    if (bcAcciones) {
      bcAcciones.addEventListener('click', () => {
        selectedAccion = null;
        selectedActividad = null;
        fetchAcciones(accionesPage);
      });
    }

    if (bcAccion && selectedAccion) {
      bcAccion.addEventListener('click', () => {
        fetchActividades(selectedAccion, actividadesPage);
      });
    }

    // Nivel 1 (Acciones)
    const btnAddAccion = container.querySelector('#btn-add-accion');
    if (btnAddAccion) btnAddAccion.addEventListener('click', openCreateAccionModal);

    const accionesContainer = container.querySelector('#acciones-table-container');
    if (accionesContainer) {
      accionesContainer.addEventListener('click', (e) => {
        const btnView = e.target.closest('[data-action="view-actividades"]');
        const btnEdit = e.target.closest('[data-action="edit-accion"]');
        const btnDel = e.target.closest('[data-action="delete-accion"]');
        const btnPrev = e.target.closest('[data-action="prev-page"]');
        const btnNext = e.target.closest('[data-action="next-page"]');

        if (btnView) {
          const id = parseInt(btnView.dataset.id, 10);
          const item = accionesList.find(a => a.id_accion === id);
          if (item) fetchActividades(item, 1);
        } else if (btnEdit) {
          const id = parseInt(btnEdit.dataset.id, 10);
          const item = accionesList.find(a => a.id_accion === id);
          if (item) openEditAccionModal(item);
        } else if (btnDel) {
          const id = parseInt(btnDel.dataset.id, 10);
          const item = accionesList.find(a => a.id_accion === id);
          if (item) confirmDeleteAccion(item);
        } else if (btnPrev && !btnPrev.disabled) {
          const p = parseInt(btnPrev.dataset.page, 10);
          if (p >= 1) fetchAcciones(p);
        } else if (btnNext && !btnNext.disabled) {
          const p = parseInt(btnNext.dataset.page, 10);
          if (p >= 1) fetchAcciones(p);
        }
      });
    }

    // Nivel 2 (Actividades)
    const btnAddActividad = container.querySelector('#btn-add-actividad');
    if (btnAddActividad) btnAddActividad.addEventListener('click', openCreateActividadModal);

    const actividadesContainer = container.querySelector('#actividades-table-container');
    if (actividadesContainer) {
      actividadesContainer.addEventListener('click', (e) => {
        const btnView = e.target.closest('[data-action="view-entregables"]');
        const btnEdit = e.target.closest('[data-action="edit-actividad"]');
        const btnDel = e.target.closest('[data-action="delete-actividad"]');
        const btnPrev = e.target.closest('[data-action="prev-page"]');
        const btnNext = e.target.closest('[data-action="next-page"]');

        if (btnView) {
          const id = parseInt(btnView.dataset.id, 10);
          const item = actividadesList.find(a => a.id_actividades === id);
          if (item) fetchEntregables(item, 1);
        } else if (btnEdit) {
          const id = parseInt(btnEdit.dataset.id, 10);
          const item = actividadesList.find(a => a.id_actividades === id);
          if (item) openEditActividadModal(item);
        } else if (btnDel) {
          const id = parseInt(btnDel.dataset.id, 10);
          const item = actividadesList.find(a => a.id_actividades === id);
          if (item) confirmDeleteActividad(item);
        } else if (btnPrev && !btnPrev.disabled) {
          const p = parseInt(btnPrev.dataset.page, 10);
          if (p >= 1) fetchActividades(selectedAccion, p);
        } else if (btnNext && !btnNext.disabled) {
          const p = parseInt(btnNext.dataset.page, 10);
          if (p >= 1) fetchActividades(selectedAccion, p);
        }
      });
    }

    // Nivel 3 (Entregables)
    const btnAddEntregable = container.querySelector('#btn-add-entregable');
    if (btnAddEntregable) btnAddEntregable.addEventListener('click', openCreateEntregableModal);

    const entregablesContainer = container.querySelector('#entregables-table-container');
    if (entregablesContainer) {
      entregablesContainer.addEventListener('click', (e) => {
        const btnEdit = e.target.closest('[data-action="edit-entregable"]');
        const btnDel = e.target.closest('[data-action="delete-entregable"]');
        const btnPrev = e.target.closest('[data-action="prev-page"]');
        const btnNext = e.target.closest('[data-action="next-page"]');

        if (btnEdit) {
          const id = parseInt(btnEdit.dataset.id, 10);
          const item = entregablesList.find(e => e.id_entregable === id);
          if (item) openEditEntregableModal(item);
        } else if (btnDel) {
          const id = parseInt(btnDel.dataset.id, 10);
          confirmDeleteEntregable(id);
        } else if (btnPrev && !btnPrev.disabled) {
          const p = parseInt(btnPrev.dataset.page, 10);
          if (p >= 1) fetchEntregables(selectedActividad, p);
        } else if (btnNext && !btnNext.disabled) {
          const p = parseInt(btnNext.dataset.page, 10);
          if (p >= 1) fetchEntregables(selectedActividad, p);
        }
      });
    }
  }

  await fetchAcciones(1);
}
