/**
 * Gestor de temas mejorado con transiciones suaves
 */
class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.transitionDuration = 300;
    this.init();
  }

  init() {
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.setTheme(savedTheme, false);
    
    // Detectar preferencia del sistema
    this.detectSystemPreference();
    
    // Escuchar cambios en preferencia del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Detecta preferencia del sistema si no hay tema guardado
   */
  detectSystemPreference() {
    if (!localStorage.getItem('theme')) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light', false);
    }
  }

  /**
   * Cambia el tema con transición suave
   */
  setTheme(theme, animate = true) {
    if (theme === this.currentTheme) return;

    const root = document.documentElement;
    const body = document.body;

    if (animate) {
      // Añadir clase de transición
      body.style.transition = `background-color ${this.transitionDuration}ms ease, color ${this.transitionDuration}ms ease`;
      
      // Aplicar transición a todos los elementos relevantes
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        el.style.transition = `background-color ${this.transitionDuration}ms ease, color ${this.transitionDuration}ms ease, border-color ${this.transitionDuration}ms ease`;
      });

      // Remover transiciones después del cambio
      setTimeout(() => {
        body.style.transition = '';
        elements.forEach(el => {
          el.style.transition = '';
        });
      }, this.transitionDuration);
    }

    // Aplicar tema
    root.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    
    // Actualizar icono del botón
    this.updateThemeIcon();
    
    // Guardar preferencia
    localStorage.setItem('theme', theme);
    
    // Emitir evento personalizado
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme, previousTheme: this.currentTheme } 
    }));
  }

  /**
   * Alterna entre temas
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Actualiza el icono del botón de tema
   */
  updateThemeIcon() {
    const themeButton = document.getElementById('themeToggle');
    if (themeButton) {
      const icon = themeButton.querySelector('i');
      if (icon) {
        icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      }
    }
  }

  /**
   * Obtiene el tema actual
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Verifica si está en modo oscuro
   */
  isDarkMode() {
    return this.currentTheme === 'dark';
  }

  /**
   * Aplica tema personalizado con colores específicos
   */
  applyCustomTheme(colors) {
    const root = document.documentElement;
    
    Object.entries(colors).forEach(([property, value]) => {
      root.style.setProperty(`--${property}`, value);
    });
  }

  /**
   * Resetea al tema por defecto
   */
  resetToDefault() {
    const root = document.documentElement;
    
    // Remover variables personalizadas
    const customProperties = [
      '--gold-primary', '--gold-light', '--gold-dark',
      '--black-bg', '--black-card', '--black-light',
      '--text-white', '--text-gray', '--text-dark'
    ];
    
    customProperties.forEach(prop => {
      root.style.removeProperty(prop);
    });
    
    // Aplicar tema por defecto
    this.setTheme('dark');
  }

  /**
   * Obtiene los colores actuales del tema
   */
  getCurrentColors() {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    return {
      goldPrimary: computedStyle.getPropertyValue('--gold-primary').trim(),
      goldLight: computedStyle.getPropertyValue('--gold-light').trim(),
      goldDark: computedStyle.getPropertyValue('--gold-dark').trim(),
      blackBg: computedStyle.getPropertyValue('--black-bg').trim(),
      blackCard: computedStyle.getPropertyValue('--black-card').trim(),
      textWhite: computedStyle.getPropertyValue('--text-white').trim()
    };
  }
}

// Crear instancia global
window.themeManager = new ThemeManager();

// Función global para compatibilidad
window.toggleTheme = () => window.themeManager.toggleTheme();