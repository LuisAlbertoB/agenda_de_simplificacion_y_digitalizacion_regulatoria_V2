import { api } from './services/api.js';

/**
 * Estado Global Reactivo de la Aplicación
 * Implementa patrón Observador (Pub/Sub) para notificar cambios de estado a la interfaz.
 */
class StateStore {
  constructor() {
    this.state = {
      user: api.getUser(),
      currentPath: window.location.hash || '#/',
      isLoading: false,
      notifications: [],
    };

    this.listeners = new Set();
  }

  getState() {
    return { ...this.state };
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // ── Métodos Específicos de Modificación ──

  setUser(user) {
    if (user) {
      api.setUser(user);
    }
    this.setState({ user });
  }

  setCurrentPath(path) {
    this.setState({ currentPath: path });
  }

  setLoading(isLoading) {
    this.setState({ isLoading });
  }

  addNotification(message, type = 'info') {
    const id = Date.now();
    const notification = { id, message, type };
    const notifications = [...this.state.notifications, notification];
    this.setState({ notifications });

    // Auto eliminar la notificación tras 4 segundos
    setTimeout(() => {
      this.removeNotification(id);
    }, 4000);
  }

  removeNotification(id) {
    const notifications = this.state.notifications.filter((n) => n.id !== id);
    this.setState({ notifications });
  }
}

export const store = new StateStore();
