import { rolesService, permisosService, rolesHasPermisosService, dependenciasService, usuariosService } from '../services/crud-factory.js';
import { renderDataTable, renderInstitutionalBanner, showFormModal, showConfirmModal, showToast } from '../components/organisms.js';
import { renderBadge } from '../components/atoms.js';

export async function renderCatalogosAdminPage(container) {
  let activeTab = 'dependencias'; // 'dependencias' | 'usuarios' | 'roles' | 'permisos' | 'roles-permisos'
  let currentPage = 1;
  let loading = true;
  let data = [];
  let count = 0;

  let dependenciasList = [];
  let rolesList = [];
  let permisosList = [];

  async function loadCatalogsForSelects() {
    try {
      const [resDep, resRol, resPerm] = await Promise.all([
        dependenciasService.list({ page_size: 100 }),
        rolesService.list({ page_size: 100 }),
        permisosService.list({ page_size: 100 }),
      ]);
      dependenciasList = (resDep.results || []).map(d => ({ value: d.id_dependencia, label: `${d.clave} - ${d.nombre_oficial}` }));
      rolesList = (resRol.results || []).map(r => ({ value: r.id_role, label: `${r.clave} - ${r.nombre_oficial}` }));
      permisosList = (resPerm.results || []).map(p => ({ value: p.id_permiso, label: `${p.clave} - ${p.nombre_oficial}` }));
    } catch (err) {
      console.error('Error al cargar catálogos auxiliares:', err);
    }
  }

  async function fetchCurrentTab(tab = activeTab, page = 1) {
    activeTab = tab;
    currentPage = page;
    loading = true;
    render();

    try {
      let res;
      switch (tab) {
        case 'dependencias':
          res = await dependenciasService.list({ page });
          break;
        case 'usuarios':
          res = await usuariosService.list({ page });
          break;
        case 'roles':
          res = await rolesService.list({ page });
          break;
        case 'permisos':
          res = await permisosService.list({ page });
          break;
        case 'roles-permisos':
          res = await rolesHasPermisosService.list({ page });
          break;
        default:
          res = { results: [], count: 0 };
      }
      data = res.results || [];
      count = res.count || 0;
    } catch (err) {
      console.error(`Error al cargar catálogo [${tab}]:`, err);
      data = [];
      count = 0;
    } finally {
      loading = false;
      render();
    }
  }

  function getFieldsForTab(isEdit = false) {
    switch (activeTab) {
      case 'dependencias':
        return [
          { name: 'clave', label: 'Clave de Dependencia', type: 'text', required: true, placeholder: 'ej. DEP-01' },
          { name: 'nombre_oficial', label: 'Nombre Oficial de la Dependencia/Secretaría', type: 'text', required: true, fullWidth: true },
          { name: 'siglas', label: 'Siglas Oficiales', type: 'text', placeholder: 'ej. SEDUM' },
          { name: 'titular_dependencia', label: 'Titular / Secretario', type: 'text' },
          {
            name: 'ambito',
            label: 'Ámbito Gubernamental',
            type: 'select',
            options: [
              { value: 0, label: '0 = Estatal' },
              { value: 1, label: '1 = Municipal' },
              { value: 2, label: '2 = Federal' },
            ],
            defaultValue: 1,
          },
          { name: 'status', label: 'Activo en Sistema', type: 'checkbox', defaultValue: true },
        ];
      case 'usuarios':
        return [
          { name: 'correo_electronico', label: 'Correo Electrónico (Login)', type: 'text', required: true, placeholder: 'usuario@tuxtla.gob.mx' },
          { name: 'nombres', label: 'Nombre(s)', type: 'text', required: true },
          { name: 'apellido1', label: 'Primer Apellido', type: 'text', required: true },
          { name: 'apellido2', label: 'Segundo Apellido', type: 'text' },
          { name: 'curp', label: 'CURP (18 caracteres)', type: 'text', placeholder: '18 caracteres' },
          { name: 'cargo_oficial', label: 'Cargo Oficial', type: 'text' },
          { name: 'id_dependencia_id', label: 'Dependencia Adscrita', type: 'select', options: dependenciasList },
          { name: 'id_role_id', label: 'Rol de Sistema (RBAC)', type: 'select', options: rolesList },
          { name: 'is_oficial_link_person', label: '¿Es Enlace Oficial de la Dependencia?', type: 'checkbox' },
          {
            name: 'password',
            label: isEdit ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso',
            type: 'password',
            required: !isEdit,
            helpText: isEdit ? 'Dejar en blanco para mantener la contraseña actual encriptada.' : 'Mínimo 6 caracteres (se encriptará con Bcrypt).',
          },
          { name: 'status', label: 'Usuario Activo', type: 'checkbox', defaultValue: true },
        ];
      case 'roles':
        return [
          { name: 'clave', label: 'Clave del Rol', type: 'text', required: true, placeholder: 'ej. ADMIN_DEP' },
          { name: 'nombre_oficial', label: 'Nombre Oficial del Rol', type: 'text', required: true, fullWidth: true },
          { name: 'siglas', label: 'Siglas / Abreviatura', type: 'text' },
          { name: 'status', label: 'Rol Activo', type: 'checkbox', defaultValue: true },
        ];
      case 'permisos':
        return [
          { name: 'clave', label: 'Clave del Permiso', type: 'text', required: true, placeholder: 'ej. AGENDAS_CREATE' },
          { name: 'nombre_oficial', label: 'Nombre del Permiso', type: 'text', required: true, fullWidth: true },
          { name: 'modulo', label: 'Módulo / Ámbito', type: 'text', placeholder: 'ej. Agendas, Fichas' },
        ];
      case 'roles-permisos':
        return [
          { name: 'id_role_id', label: 'Rol', type: 'select', required: true, options: rolesList },
          { name: 'id_permiso_id', label: 'Permiso a Asignar', type: 'select', required: true, options: permisosList },
        ];
      default:
        return [];
    }
  }

  function getServiceForTab() {
    switch (activeTab) {
      case 'dependencias': return dependenciasService;
      case 'usuarios': return usuariosService;
      case 'roles': return rolesService;
      case 'permisos': return permisosService;
      case 'roles-permisos': return rolesHasPermisosService;
    }
  }

  function getIdFieldForTab() {
    switch (activeTab) {
      case 'dependencias': return 'id_dependencia';
      case 'usuarios': return 'id_usuario';
      case 'roles': return 'id_role';
      case 'permisos': return 'id_permiso';
      case 'roles-permisos': return 'id';
    }
  }

  function openCreateModal() {
    const titles = {
      dependencias: 'Nueva Dependencia Municipal',
      usuarios: 'Nuevo Usuario de Sistema',
      roles: 'Nuevo Rol de Sistema',
      permisos: 'Nuevo Permiso',
      'roles-permisos': 'Asignar Permiso a Rol',
    };
    showFormModal({
      title: titles[activeTab] || 'Nuevo Registro',
      icon: 'add_circle',
      fields: getFieldsForTab(false),
      submitText: 'Guardar Registro',
      onSubmit: async (payload) => {
        await getServiceForTab().create(payload);
        await loadCatalogsForSelects();
        await fetchCurrentTab(activeTab, currentPage);
      },
    });
  }

  function openEditModal(item) {
    const service = getServiceForTab();
    const idField = getIdFieldForTab();
    const id = item[idField];

    const initial = {
      ...item,
      id_dependencia_id: item.id_dependencia?.id_dependencia || item.id_dependencia_id,
      id_role_id: item.id_role?.id_role || item.id_role_id,
      id_permiso_id: item.id_permiso?.id_permiso || item.id_permiso_id,
      password: '', // nunca enviar contraseña actual
    };

    showFormModal({
      title: `Editar Registro #${id}`,
      icon: 'edit',
      fields: getFieldsForTab(true),
      initialData: initial,
      submitText: 'Actualizar Registro',
      onSubmit: async (payload) => {
        // En edición de usuario, si el password viene vacío, lo eliminamos para no sobreescribir con cadena vacía
        if (activeTab === 'usuarios' && !payload.password) {
          delete payload.password;
        }
        await service.partialUpdate(id, payload);
        await loadCatalogsForSelects();
        await fetchCurrentTab(activeTab, currentPage);
      },
    });
  }

  function confirmDelete(id) {
    const service = getServiceForTab();
    showConfirmModal({
      title: '¿Eliminar Registro?',
      message: 'Esta acción eliminará permanentemente el registro si no está protegido por relaciones del sistema.',
      onConfirm: async () => {
        await service.remove(id);
        showToast('Registro eliminado correctamente', 'success');
        await loadCatalogsForSelects();
        await fetchCurrentTab(activeTab, currentPage);
      },
    });
  }

  function getColumnsForTab() {
    switch (activeTab) {
      case 'dependencias':
        return [
          { header: 'ID', field: 'id_dependencia', width: 'w-20', render: (r) => `<span class="font-data-mono font-bold text-primary">#DEP-${r.id_dependencia}</span>` },
          { header: 'Clave', field: 'clave', width: 'w-32', render: (r) => `<span class="font-data-mono font-semibold text-primary">${r.clave || '-'}</span>` },
          { header: 'Nombre de la Dependencia', field: 'nombre_oficial', render: (r) => `<span class="font-title-md font-semibold text-text-primary">${r.nombre_oficial || '-'}</span>` },
          { header: 'Siglas', field: 'siglas', width: 'w-28', render: (r) => renderBadge(r.siglas || 'S/N', 'secondary') },
          { header: 'Titular', field: 'titular_dependencia', render: (r) => `<span class="font-body-sm text-text-secondary">${r.titular_dependencia || 'Sin titular'}</span>` },
        ];
      case 'usuarios':
        return [
          { header: 'ID', field: 'id_usuario', width: 'w-20', render: (r) => `<span class="font-data-mono font-bold text-primary">#USR-${r.id_usuario}</span>` },
          { header: 'Correo Electrónico', field: 'correo_electronico', render: (r) => `<span class="font-data-mono font-semibold text-secondary">${r.correo_electronico || '-'}</span>` },
          { header: 'Nombre Completo', field: 'nombres', render: (r) => `<span class="font-title-md font-semibold text-text-primary">${r.nombres} ${r.apellido1} ${r.apellido2 || ''}</span>` },
          { header: 'Rol Clave', field: 'id_role.clave', width: 'w-36', render: (r) => renderBadge(r.id_role?.clave ? r.id_role.clave.toUpperCase() : 'SIN ROL', 'primary') },
          { header: 'Dependencia', field: 'id_dependencia.clave', width: 'w-36', render: (r) => `<span class="font-data-mono text-text-secondary">${r.id_dependencia?.clave || 'N/A'}</span>` },
        ];
      case 'roles':
        return [
          { header: 'ID Rol', field: 'id_role', width: 'w-20', render: (r) => `<span class="font-data-mono font-bold text-primary">#ROL-${r.id_role}</span>` },
          { header: 'Clave del Rol', field: 'clave', render: (r) => renderBadge(r.clave ? r.clave.toUpperCase() : '-', 'primary') },
          { header: 'Nombre Descriptivo', field: 'nombre_oficial', render: (r) => `<span class="font-title-md font-semibold text-text-primary">${r.nombre_oficial || '-'}</span>` },
        ];
      case 'permisos':
        return [
          { header: 'ID Permiso', field: 'id_permiso', width: 'w-24', render: (r) => `<span class="font-data-mono font-bold text-primary">#PERM-${r.id_permiso}</span>` },
          { header: 'Clave Permiso', field: 'clave', render: (r) => renderBadge(r.clave || '-', 'secondary') },
          { header: 'Nombre', field: 'nombre_oficial', render: (r) => `<span class="font-title-md font-semibold text-text-primary">${r.nombre_oficial || '-'}</span>` },
          { header: 'Módulo / Ámbito', field: 'modulo', width: 'w-36', render: (r) => `<span class="font-data-mono text-text-tertiary">${r.modulo || 'General'}</span>` },
        ];
      case 'roles-permisos':
        return [
          { header: 'ID Pivote', field: 'id', width: 'w-20', render: (r) => `<span class="font-data-mono font-bold text-primary">#RP-${r.id || '-'}</span>` },
          { header: 'Rol', field: 'id_role.clave', render: (r) => r.id_role ? renderBadge(r.id_role.clave ? r.id_role.clave.toUpperCase() : `Rol #${r.id_role}`, 'primary') : `<span class="font-data-mono text-text-tertiary">Rol #${r.id_role_id || '-'}</span>` },
          { header: 'Permiso Asignado', field: 'id_permiso.clave', render: (r) => r.id_permiso ? renderBadge(r.id_permiso.clave || `Permiso #${r.id_permiso}`, 'secondary') : `<span class="font-data-mono text-text-tertiary">Permiso #${r.id_permiso_id || '-'}</span>` },
        ];
      default:
        return [];
    }
  }

  function render() {
    const tabs = [
      { id: 'dependencias', label: 'Dependencias Municipales', icon: 'corporate_fare' },
      { id: 'usuarios', label: 'Usuarios y Cuentas', icon: 'group' },
      { id: 'roles', label: 'Roles de Sistema', icon: 'admin_panel_settings' },
      { id: 'permisos', label: 'Catálogo de Permisos', icon: 'key' },
      { id: 'roles-permisos', label: 'Matriz Rol ↔ Permisos', icon: 'rule' },
    ];

    container.innerHTML = `
      ${renderInstitutionalBanner(
        'Gestión de Catálogos Oficiales del Sistema',
        'Administración centralizada de dependencias, usuarios, roles y permisos de acceso RBAC',
        'CATÁLOGOS ESTRUCTURALES'
      )}

      <!-- Pestañas de Navegación entre Catálogos -->
      <div class="mb-space-md bg-surface-container-lowest/80 p-1.5 rounded-xl border border-border-subtle flex items-center gap-1 overflow-x-auto">
        ${tabs.map(t => {
          const isActive = activeTab === t.id;
          return `<button
            type="button"
            data-action="switch-tab"
            data-tab="${t.id}"
            class="px-4 py-2 rounded-lg font-title-md text-body-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${isActive ? 'bg-primary-container text-on-primary-container shadow-md' : 'text-text-secondary hover:text-text-primary hover:bg-surface-container-high'}"
          >
            <span class="material-symbols-outlined text-[18px]">${t.icon}</span>
            <span>${t.label}</span>
          </button>`;
        }).join('')}
      </div>

      <!-- Toolbar Superior -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-space-md mb-space-md">
        <div class="flex items-center gap-space-xs w-full sm:w-auto">
          <span class="font-title-md text-title-md text-text-primary font-bold">Registros en Catálogo:</span>
          <span class="font-data-mono text-headline-sm text-primary font-bold">${count}</span>
        </div>
        <div class="flex items-center gap-space-xs w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-add-record"
            class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-title-md text-body-sm font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Agregar Registro</span>
          </button>
        </div>
      </div>

      <!-- Tabla de Datos -->
      <div id="table-container">
        ${renderDataTable({
          columns: getColumnsForTab(),
          data,
          loading,
          count,
          page: currentPage,
          pageSize: 10,
          emptyTitle: 'No hay registros en este catálogo',
          emptyIcon: 'folder_managed',
          idField: getIdFieldForTab(),
        })}
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const btnAdd = container.querySelector('#btn-add-record');
    if (btnAdd) btnAdd.addEventListener('click', openCreateModal);

    container.addEventListener('click', (e) => {
      const btnTab = e.target.closest('[data-action="switch-tab"]');
      if (btnTab) {
        const tab = btnTab.dataset.tab;
        if (tab && tab !== activeTab) {
          fetchCurrentTab(tab, 1);
        }
        return;
      }

      const btnEdit = e.target.closest('[data-action="edit"]');
      const btnDelete = e.target.closest('[data-action="delete"]');
      const btnPrev = e.target.closest('[data-action="prev-page"]');
      const btnNext = e.target.closest('[data-action="next-page"]');

      if (btnEdit) {
        const id = parseInt(btnEdit.dataset.id, 10);
        const idField = getIdFieldForTab();
        const item = data.find(d => d[idField] === id);
        if (item) openEditModal(item);
      } else if (btnDelete) {
        const id = parseInt(btnDelete.dataset.id, 10);
        confirmDelete(id);
      } else if (btnPrev && !btnPrev.disabled) {
        const p = parseInt(btnPrev.dataset.page, 10);
        if (p >= 1) fetchCurrentTab(activeTab, p);
      } else if (btnNext && !btnNext.disabled) {
        const p = parseInt(btnNext.dataset.page, 10);
        if (p >= 1) fetchCurrentTab(activeTab, p);
      }
    });
  }

  await loadCatalogsForSelects();
  await fetchCurrentTab('dependencias', 1);
}
