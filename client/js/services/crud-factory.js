import { api } from './api.js';
import { CONFIG } from '../config.js';

/**
 * Fábrica genérica de servicios CRUD por recurso.
 * Permite listar y obtener por ID en este sprint (Capa A),
 * y deja preparados e implementados los métodos de escritura (create, update, partialUpdate, remove)
 * para la Capa B sin requerir rediseño arquitectónico.
 * 
 * @param {string} resourcePath Endpoint base del recurso (ej: '/fichas/' o 'fichas')
 */
export function createResourceService(resourcePath) {
  const cleanPath = resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`;
  const basePath = cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`;

  return {
    /**
     * Lista elementos paginados del recurso.
     * @param {Object} params Parámetros de consulta (page, search, etc.)
     */
    list(params = {}) {
      return api.get(basePath, params);
    },

    /**
     * Obtiene un registro por su identificador primario.
     * @param {number|string} id 
     */
    getById(id) {
      return api.get(`${basePath}${id}/`);
    },

    /*
     * ------------------------------------------------------------------------
     * Métodos de Escritura (Capa B - Preparados y listos para ser consumidos)
     * ------------------------------------------------------------------------
     */

    // Disponible desde ya; aún no se usa en las páginas de este sprint para dejar constancia de que está listo para cuando existan los formularios de alta.
    create(data) {
      return api.post(basePath, data);
    },

    // Disponible desde ya; aún no se usa en las páginas de este sprint para dejar constancia de que está listo para cuando existan los formularios de edición completa.
    update(id, data) {
      return api.put(`${basePath}${id}/`, data);
    },

    // Disponible desde ya; aún no se usa en las páginas de este sprint para dejar constancia de que está listo para actualizaciones parciales.
    partialUpdate(id, data) {
      return api.patch(`${basePath}${id}/`, data);
    },

    // Disponible desde ya; aún no se usa en las páginas de este sprint para dejar constancia de que está listo para eliminación de registros.
    remove(id) {
      return api.delete(`${basePath}${id}/`);
    }
  };
}

// ── Instanciación de Servicios para las 14 Entidades del Modelo ──

export const rolesService = createResourceService(CONFIG.ENDPOINTS.ROLES);
export const permisosService = createResourceService(CONFIG.ENDPOINTS.PERMISOS);
export const rolesHasPermisosService = createResourceService(CONFIG.ENDPOINTS.ROLES_HAS_PERMISOS);
export const dependenciasService = createResourceService(CONFIG.ENDPOINTS.DEPENDENCIAS);
export const usuariosService = createResourceService(CONFIG.ENDPOINTS.USUARIOS);
export const tramitesService = createResourceService(CONFIG.ENDPOINTS.TRAMITES_O_SERVICIOS);
export const agendasService = createResourceService(CONFIG.ENDPOINTS.AGENDAS);
export const fichasService = createResourceService(CONFIG.ENDPOINTS.FICHAS);
export const cobrosService = createResourceService(CONFIG.ENDPOINTS.COBROS);
export const accionesService = createResourceService(CONFIG.ENDPOINTS.ACCIONES);
export const actividadesService = createResourceService(CONFIG.ENDPOINTS.ACTIVIDADES);
export const entregablesService = createResourceService(CONFIG.ENDPOINTS.ENTREGABLES);
export const fichasHasAccionesService = createResourceService(CONFIG.ENDPOINTS.FICHAS_HAS_ACCIONES);
export const cronogramaService = createResourceService(CONFIG.ENDPOINTS.CRONOGRAMA);
