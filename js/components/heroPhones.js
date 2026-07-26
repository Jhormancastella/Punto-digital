/**
 * Gestor de interacciones para los teléfonos del hero
 */
class HeroPhones {
  constructor() {
    this.activePhone = null;
    this.phoneGroup = null;
    this.phones = [];
    this.originalPositions = new Map();
    
    this.init();
  }

  init() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.phoneGroup = document.querySelector('.phone-group');
    this.phones = document.querySelectorAll('.phone-item');
    
    if (!this.phoneGroup || this.phones.length === 0) {
      // Intentar de nuevo después de que se rendericen
      setTimeout(() => this.setup(), 1000);
      return;
    }

    this.setupEventListeners();
    this.storeOriginalPositions();
  }

  /**
   * Configura los event listeners
   */
  setupEventListeners() {
    this.phones.forEach((phone, index) => {
      // Click para activar/desactivar
      phone.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.togglePhone(phone, index);
      });

      // Hover effects mejorados
      phone.addEventListener('mouseenter', () => {
        if (!phone.classList.contains('active')) {
          this.addHoverEffect(phone);
        }
      });

      phone.addEventListener('mouseleave', () => {
        if (!phone.classList.contains('active')) {
          this.removeHoverEffect(phone);
        }
      });

      // Keyboard support
      phone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.togglePhone(phone, index);
        }
      });

      // Hacer focusable
      phone.setAttribute('tabindex', '0');
      phone.setAttribute('role', 'button');
      phone.setAttribute('aria-label', `Teléfono ${index + 1} - Hacer clic para ver en detalle`);
    });

    // Click fuera para desactivar
    document.addEventListener('click', (e) => {
      if (!this.phoneGroup.contains(e.target)) {
        this.deactivateAll();
      }
    });

    // Escape key para desactivar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activePhone) {
        this.deactivateAll();
      }
    });
  }

  /**
   * Guarda las posiciones originales de los teléfonos
   */
  storeOriginalPositions() {
    this.phones.forEach((phone, index) => {
      const computedStyle = getComputedStyle(phone);
      const rect = phone.getBoundingClientRect();
      
      this.originalPositions.set(phone, {
        left: computedStyle.left,
        right: computedStyle.right,
        top: computedStyle.top,
        width: computedStyle.width,
        height: computedStyle.height,
        transform: computedStyle.transform,
        zIndex: computedStyle.zIndex
      });
    });
  }

  /**
   * Alterna el estado activo de un teléfono
   */
  togglePhone(phone, index) {
    if (phone.classList.contains('active')) {
      this.deactivateAll();
    } else {
      this.activatePhone(phone, index);
    }
  }

  /**
   * Activa un teléfono específico
   */
  activatePhone(phone, index) {
    // Desactivar teléfono anterior si existe
    if (this.activePhone) {
      this.deactivatePhone(this.activePhone);
    }

    // Activar nuevo teléfono
    this.activePhone = phone;
    phone.classList.add('active');
    this.phoneGroup.classList.add('has-active');

    // Añadir efectos visuales
    this.addActivationEffects(phone, index);

    // Actualizar aria-label
    phone.setAttribute('aria-label', `Teléfono ${index + 1} - Activo. Presiona Escape o haz clic fuera para cerrar`);

    // Anunciar a lectores de pantalla
    this.announceToScreenReader(`Teléfono ${index + 1} seleccionado`);

    // Auto-desactivar después de 10 segundos
    this.autoDeactivateTimer = setTimeout(() => {
      this.deactivateAll();
    }, 10000);
  }

  /**
   * Desactiva un teléfono específico
   */
  deactivatePhone(phone) {
    if (!phone) return;

    phone.classList.remove('active');
    this.removeActivationEffects(phone);

    // Restaurar aria-label
    const index = Array.from(this.phones).indexOf(phone);
    phone.setAttribute('aria-label', `Teléfono ${index + 1} - Hacer clic para ver en detalle`);
  }

  /**
   * Desactiva todos los teléfonos
   */
  deactivateAll() {
    if (this.activePhone) {
      this.deactivatePhone(this.activePhone);
      this.activePhone = null;
    }

    this.phoneGroup.classList.remove('has-active');

    // Limpiar timer
    if (this.autoDeactivateTimer) {
      clearTimeout(this.autoDeactivateTimer);
      this.autoDeactivateTimer = null;
    }

    // Anunciar a lectores de pantalla
    this.announceToScreenReader('Selección de teléfono cancelada');
  }

  /**
   * Añade efectos de hover
   */
  addHoverEffect(phone) {
    phone.style.transform = phone.style.transform.replace(/translateY\([^)]*\)/, '') + ' translateY(-10px)';
  }

  /**
   * Remueve efectos de hover
   */
  removeHoverEffect(phone) {
    phone.style.transform = phone.style.transform.replace(/translateY\([^)]*\)/, '');
  }

  /**
   * Añade efectos de activación
   */
  addActivationEffects(phone, index) {
    // Crear efecto de ondas
    this.createRippleEffect(phone);

    // Crear partículas doradas
    this.createGoldenParticles(phone);

    // Vibración sutil si está disponible
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  }

  /**
   * Remueve efectos de activación
   */
  removeActivationEffects(phone) {
    // Remover efectos temporales
    const ripples = phone.querySelectorAll('.phone-ripple');
    const particles = phone.querySelectorAll('.golden-particle');
    
    ripples.forEach(ripple => ripple.remove());
    particles.forEach(particle => particle.remove());
  }

  /**
   * Crea efecto de ondas al activar
   */
  createRippleEffect(phone) {
    const ripple = document.createElement('div');
    ripple.className = 'phone-ripple';
    ripple.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: radial-gradient(circle, rgba(212,168,67,0.4) 0%, transparent 70%);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 10;
      animation: phoneRipple 0.8s ease-out forwards;
    `;

    phone.appendChild(ripple);

    // Remover después de la animación
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    }, 800);
  }

  /**
   * Crea partículas doradas
   */
  createGoldenParticles(phone) {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'golden-particle';
        
        const angle = (i * 60) * (Math.PI / 180);
        const distance = 80 + Math.random() * 40;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        particle.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          width: 6px;
          height: 6px;
          background: var(--gold-primary);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 15;
          animation: goldenParticle 1.5s ease-out forwards;
          --end-x: ${x}px;
          --end-y: ${y}px;
        `;

        phone.appendChild(particle);

        // Remover después de la animación
        setTimeout(() => {
          if (particle.parentNode) {
            particle.remove();
          }
        }, 1500);
      }, i * 100);
    }
  }

  /**
   * Anuncia a lectores de pantalla
   */
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Actualiza las referencias después de re-renderizado
   */
  refresh() {
    this.setup();
  }
}

// Añadir animaciones CSS necesarias
const phoneAnimationsStyle = document.createElement('style');
phoneAnimationsStyle.textContent = `
  @keyframes phoneRipple {
    0% {
      width: 0;
      height: 0;
      opacity: 1;
    }
    100% {
      width: 200px;
      height: 200px;
      opacity: 0;
    }
  }

  @keyframes goldenParticle {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y))) scale(0);
      opacity: 0;
    }
  }

  /* Mejoras responsive para teléfonos activos */
  @media (max-width: 768px) {
    .phone-item.active {
      transform: translate(-50%, -50%) rotate(0deg) scale(1.1) !important;
    }
  }

  @media (max-width: 480px) {
    .phone-item.active {
      transform: translate(-50%, -50%) rotate(0deg) scale(1.05) !important;
    }
  }
`;

document.head.appendChild(phoneAnimationsStyle);

// Crear instancia global
window.heroPhones = new HeroPhones();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeroPhones;
}