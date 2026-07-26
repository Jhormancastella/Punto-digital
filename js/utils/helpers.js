/**
 * Utilidades helper compartidas
 */
class Helpers {
  /**
   * Debounce function para optimizar eventos
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function para optimizar scroll
   */
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Cache de selectores DOM
   */
  static domCache = new Map();
  
  static $(selector) {
    if (!this.domCache.has(selector)) {
      this.domCache.set(selector, document.querySelector(selector));
    }
    return this.domCache.get(selector);
  }

  static $$(selector) {
    if (!this.domCache.has(selector + '_all')) {
      this.domCache.set(selector + '_all', document.querySelectorAll(selector));
    }
    return this.domCache.get(selector + '_all');
  }

  /**
   * Limpia cache de DOM
   */
  static clearDOMCache() {
    this.domCache.clear();
  }

  /**
   * Detecta si es dispositivo móvil
   */
  static isMobile() {
    return window.innerWidth <= 768;
  }

  /**
   * Detecta si prefiere movimiento reducido
   */
  static prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Genera ID único
   */
  static generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Valida email
   */
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Escapa HTML para prevenir XSS
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  }

  static escapeAttr(text) {
    return Helpers.escapeHtml(text).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  static sanitizeUrl(url, fallback = '#') {
    if (!url) return fallback;
    const value = String(url).trim();
    if (/^(https?:|mailto:|tel:|img\/|\.\/|\/|data:image\/)/i.test(value)) return value;
    return fallback;
  }

  /**
   * Copia texto al clipboard
   */
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  }
}

// Exportar para uso global
window.Helpers = Helpers;
