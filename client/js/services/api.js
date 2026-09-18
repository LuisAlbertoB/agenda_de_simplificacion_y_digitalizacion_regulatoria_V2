import { CONFIG } from '../config.js';

/**
 * Cliente HTTP Centralizado para la API Django REST Framework
 * Gestiona autenticación JWT, almacenamiento de tokens, refresco automático en 401
 * y peticiones REST para todas las entidades del sistema.
 */
class ApiService {
  constructor() {
    this.baseUrl = CONFIG.API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  setTokens(access, refresh) {
    if (access) localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  }

  getUser() {
    try {
      const raw = localStorage.getItem('user_info');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setUser(user) {
    localStorage.setItem('user_info', JSON.stringify(user));
  }

  /**
   * Garantiza que la ruta tenga la barra inclinada final requerida por DRF
   */
  normalizeEndpoint(endpoint) {
    if (!endpoint) return '/';
    let path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const queryIndex = path.indexOf('?');
    if (queryIndex !== -1) {
      const base = path.substring(0, queryIndex);
      const query = path.substring(queryIndex);
      if (!base.endsWith('/')) {
        return base + '/' + query;
      }
      return path;
    }
    if (!path.endsWith('/')) {
      path += '/';
    }
    return path;
  }

  async request(endpoint, options = {}) {
    const normEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.baseUrl}${normEndpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // Interceptor 401: Intento de refresco automático si expiró el token de acceso
      if (response.status === 401 && this.getRefreshToken() && !normEndpoint.includes('/token/')) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.getToken()}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          this.clearTokens();
          window.location.hash = '#/login';
          throw new Error('Su sesión ha expirado. Por favor ingrese de nuevo.');
        }
      }

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        let msg = 'Error en la petición al servidor.';
        if (typeof data === 'object' && data !== null) {
          if (data.detail) {
            msg = data.detail;
          } else if (data.mensaje) {
            msg = data.mensaje;
          } else {
            // Formatear errores de validación de campos DRF
            const errors = [];
            for (const [key, val] of Object.entries(data)) {
              const valStr = Array.isArray(val) ? val.join(', ') : String(val);
              errors.push(`${key}: ${valStr}`);
            }
            if (errors.length > 0) msg = errors.join(' | ');
          }
        } else if (typeof data === 'string' && data.length > 0) {
          msg = data;
        }
        throw new Error(msg);
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${normEndpoint}:`, error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const res = await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.AUTH_REFRESH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.getRefreshToken() }),
      });
      if (res.ok) {
        const data = await res.json();
        this.setTokens(data.access, null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ── Métodos HTTP Básicos ──

  get(endpoint, params = {}) {
    const cleanParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        cleanParams[key] = value;
      }
    }
    const query = new URLSearchParams(cleanParams).toString();
    const fullEndpoint = query ? `${endpoint}?${query}` : endpoint;
    return this.request(fullEndpoint, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put(endpoint, body = {}) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  patch(endpoint, body = {}) {
    return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ── Autenticación de Usuario ──

  async login(correo_electronico, password) {
    const data = await this.post(CONFIG.ENDPOINTS.AUTH_TOKEN, {
      correo_electronico,
      password,
    });
    this.setTokens(data.access, data.refresh);
    if (data.user) {
      this.setUser(data.user);
    }
    return data;
  }

  logout() {
    this.clearTokens();
    window.location.hash = '#/login';
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export const api = new ApiService();
