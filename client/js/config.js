/**
 * Configuración global de la aplicación cliente
 */

export const CONFIG = {
  // Resuelve la URL base de la API dinámicamente según el entorno
  get API_BASE_URL() {
    let host = window.location.hostname || 'localhost';
    if (host === '0.0.0.0') {
      host = 'localhost';
    }
    if (window.location.protocol === 'https:') {
      return `${window.location.origin}/api`;
    }
    return `http://${host}:8000/api`;
  },
  
  // Tamaño de página configurado en DRF (PageNumberPagination)
  PAGE_SIZE: 10,
  
  // Rutas de endpoints para las 14 entidades del sistema
  ENDPOINTS: {
    AUTH_TOKEN: '/token/',
    AUTH_REFRESH: '/token/refresh/',
    ROLES: '/roles/',
    PERMISOS: '/permisos/',
    ROLES_HAS_PERMISOS: '/roles-has-permisos/',
    DEPENDENCIAS: '/dependencias/',
    USUARIOS: '/usuarios/',
    TRAMITES_O_SERVICIOS: '/tramites-o-servicios/',
    AGENDAS: '/agendas/',
    FICHAS: '/fichas/',
    COBROS: '/cobros/',
    ACCIONES: '/acciones/',
    ACTIVIDADES: '/actividades/',
    ENTREGABLES: '/entregables/',
    FICHAS_HAS_ACCIONES: '/fichas-has-acciones/',
    CRONOGRAMA: '/cronograma/',
  }
};
