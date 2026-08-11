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

  /* ── Footer / Contacto / Social (compartido: index, reseñas, catálogo) ── */
  static phoneDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  static phoneToTelHref(value) {
    const digits = Helpers.phoneDigits(value);
    return digits ? `tel:+${digits.startsWith('57') ? digits : `57${digits}`}` : '';
  }

  static phoneToWhatsappNumber(value) {
    const digits = Helpers.phoneDigits(value);
    if (!digits) return '';
    return digits.startsWith('57') ? digits : `57${digits}`;
  }

  static whatsappUrl(value) {
    const phone = Helpers.phoneToWhatsappNumber(value);
    return phone ? `https://wa.me/${phone}` : '';
  }

  static renderFooterContact(footerData) {
    const container = document.getElementById('footerContact');
    if (!container || !footerData) return;
    const telHref = Helpers.phoneToTelHref(footerData.phone);
    const whatsappHref = Helpers.whatsappUrl(footerData.whatsapp || footerData.phone);

    container.innerHTML = `
      ${footerData.phone ? `
      <a href="${Helpers.escapeAttr(telHref)}" class="contact-item" role="listitem">
        <i class="fas fa-phone" aria-hidden="true"></i>
        <span>${Helpers.escapeHtml(footerData.phone)}</span>
      </a>
      ` : ''}
      ${footerData.email ? `
      <a href="mailto:${Helpers.escapeAttr(footerData.email)}" class="contact-item" role="listitem">
        <i class="fas fa-envelope" aria-hidden="true"></i>
        <span>${Helpers.escapeHtml(footerData.email)}</span>
      </a>
      ` : ''}
      ${footerData.address ? `
        <div class="contact-item" role="listitem">
          <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
          <span>${Helpers.escapeHtml(footerData.address)}</span>
        </div>
      ` : ''}
      ${whatsappHref ? `
        <a href="${Helpers.escapeAttr(whatsappHref)}"
           class="contact-item" target="_blank" rel="noopener" role="listitem">
          <i class="fab fa-whatsapp" aria-hidden="true"></i>
          <span>WhatsApp</span>
        </a>
      ` : ''}
      ${footerData.website ? `
        <a href="${Helpers.sanitizeUrl(footerData.website)}"
           class="contact-item" target="_blank" rel="noopener" role="listitem">
          <i class="fas fa-globe" aria-hidden="true"></i>
          <span>${Helpers.escapeHtml(footerData.website)}</span>
        </a>
      ` : ''}
    `;
  }

  static renderSocialLinks(socialData) {
    const container = document.getElementById('socialLinks');
    if (!container || !socialData) return;

    const socialIcons = {
      facebook:  'fab fa-facebook-f',
      instagram: 'fab fa-instagram',
      whatsapp:  'fab fa-whatsapp',
      twitter:   'fab fa-x-twitter',
      youtube:   'fab fa-youtube',
      tiktok:    'fab fa-tiktok',
      linkedin:  'fab fa-linkedin-in'
    };

    container.innerHTML = Object.entries(socialData)
      .map(([platform, url]) => [platform, Helpers.sanitizeUrl(url)])
      .filter(([, url]) => url && url !== '#')
      .map(([platform, url]) => `
        <a href="${Helpers.escapeAttr(url)}" target="_blank" rel="noopener" role="listitem"
           aria-label="${Helpers.escapeAttr(platform.charAt(0).toUpperCase() + platform.slice(1))}"
           title="${Helpers.escapeAttr(platform.charAt(0).toUpperCase() + platform.slice(1))}">
          <i class="${socialIcons[platform] || 'fas fa-link'}" aria-hidden="true"></i>
        </a>
      `).join('');
  }

  static renderFooter() {
    if (!window.siteData || typeof window.siteData.getSection !== 'function') return;
    const footerData = window.siteData.getSection('footer');
    const socialData = window.siteData.getSection('social');
    const whatsappUrl = Helpers.whatsappUrl(footerData?.whatsapp || footerData?.phone);
    Helpers.renderFooterContact(footerData);
    Helpers.renderSocialLinks(whatsappUrl ? { ...(socialData || {}), whatsapp: whatsappUrl } : socialData);
  }
}

// Exportar para uso global
window.Helpers = Helpers;
