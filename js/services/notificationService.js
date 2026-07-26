/**
 * Servicio centralizado de notificaciones
 */
class NotificationService {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 5;
    this.defaultDuration = 3000;
    
    this.createContainer();
    this.addStyles();
  }

  /**
   * Crea contenedor de notificaciones
   */
  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'notifications-container';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(this.container);
  }

  /**
   * Añade estilos CSS
   */
  addStyles() {
    if (document.getElementById('notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      #notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }

      .notification {
        background: var(--black-card);
        color: var(--text-white);
        padding: 15px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border-left: 4px solid var(--gold-primary);
        min-width: 300px;
        max-width: 400px;
        pointer-events: auto;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .notification.show {
        transform: translateX(0);
        opacity: 1;
      }

      .notification.hide {
        transform: translateX(100%);
        opacity: 0;
      }

      .notification-success {
        border-left-color: #28a745;
      }

      .notification-success .notification-icon {
        color: #28a745;
      }

      .notification-error {
        border-left-color: #dc3545;
      }

      .notification-error .notification-icon {
        color: #dc3545;
      }

      .notification-warning {
        border-left-color: #ffc107;
      }

      .notification-warning .notification-icon {
        color: #ffc107;
      }

      .notification-info {
        border-left-color: #17a2b8;
      }

      .notification-info .notification-icon {
        color: #17a2b8;
      }

      .notification-close {
        background: none;
        border: none;
        color: var(--text-gray);
        cursor: pointer;
        padding: 0;
        margin-left: auto;
        font-size: 16px;
        transition: color 0.2s ease;
      }

      .notification-close:hover {
        color: var(--text-white);
      }

      @media (max-width: 480px) {
        #notifications-container {
          top: 10px;
          right: 10px;
          left: 10px;
        }

        .notification {
          min-width: auto;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Muestra notificación
   */
  show(message, type = 'info', duration = this.defaultDuration) {
    const notification = this.createNotification(message, type, duration);
    this.addNotification(notification);
    return notification.id;
  }

  /**
   * Crea elemento de notificación
   */
  createNotification(message, type, duration) {
    const id = Helpers.generateId('notification');
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.id = id;
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    notification.innerHTML = `
      <i class="fas ${icons[type] || icons.info} notification-icon"></i>
      <span class="notification-message">${Helpers.escapeHtml(message)}</span>
      <button class="notification-close" aria-label="Cerrar notificación">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Event listener para cerrar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.hide(id);
    });

    // Auto-hide si tiene duración
    if (duration > 0) {
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }

    return { element: notification, id, type, message };
  }

  /**
   * Añade notificación al contenedor
   */
  addNotification(notification) {
    // Limitar número de notificaciones
    if (this.notifications.length >= this.maxNotifications) {
      const oldest = this.notifications.shift();
      this.hide(oldest.id);
    }

    this.notifications.push(notification);
    this.container.appendChild(notification.element);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.element.classList.add('show');
    });
  }

  /**
   * Oculta notificación
   */
  hide(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return;

    notification.element.classList.add('hide');
    
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications = this.notifications.filter(n => n.id !== id);
    }, 300);
  }

  /**
   * Limpia todas las notificaciones
   */
  clear() {
    this.notifications.forEach(notification => {
      this.hide(notification.id);
    });
  }

  /**
   * Métodos de conveniencia
   */
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Crear instancia global
window.notificationService = new NotificationService();
window.NotificationService = NotificationService;