/**
 * Componente de navegación mejorado
 */
class Navbar {
  constructor() {
    this.navbar = document.getElementById('navbar');
    this.hamburger = document.getElementById('hamburger');
    this.navMenu = document.getElementById('navMenu');
    this.isMenuOpen = false;
    this.scrollThreshold = 50;
    
    this.init();
  }

  init() {
    this.setupScrollEffect();
    this.setupMobileMenu();
    this.setupSmoothScroll();
    this.setupKeyboardNavigation();
    this.setupHardReloadLogo();
  }

  /**
   * Configura el efecto de scroll en la navbar
   */
  setupScrollEffect() {
    let ticking = false;
    
    const updateNavbar = () => {
      if (window.scrollY > this.scrollThreshold) {
        this.navbar.classList.add('scrolled');
      } else {
        this.navbar.classList.remove('scrolled');
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    });
  }

  /**
   * Configura el menú móvil
   */
  setupMobileMenu() {
    if (this.hamburger) {
      this.hamburger.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Cerrar menú al hacer clic en un enlace
    const navLinks = this.navMenu?.querySelectorAll('.nav-link');
    navLinks?.forEach(link => {
      link.addEventListener('click', () => {
        if (this.isMenuOpen) {
          this.closeMobileMenu();
        }
      });
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen && 
          !this.navMenu.contains(e.target) && 
          !this.hamburger.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Cerrar menú con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  /**
   * Alterna el menú móvil
   */
  toggleMobileMenu() {
    if (this.isMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  /**
   * Abre el menú móvil
   */
  openMobileMenu() {
    this.isMenuOpen = true;
    this.hamburger?.classList.add('active');
    this.navMenu?.classList.add('active');
    
    // Actualizar aria-expanded
    this.hamburger?.setAttribute('aria-expanded', 'true');
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    // Enfocar primer enlace para accesibilidad
    const firstLink = this.navMenu?.querySelector('.nav-link');
    firstLink?.focus();
  }

  /**
   * Cierra el menú móvil
   */
  closeMobileMenu() {
    this.isMenuOpen = false;
    this.hamburger?.classList.remove('active');
    this.navMenu?.classList.remove('active');
    
    // Actualizar aria-expanded
    this.hamburger?.setAttribute('aria-expanded', 'false');
    
    // Restaurar scroll del body
    document.body.style.overflow = '';
  }

  /**
   * Configura scroll suave para enlaces internos
   */
  setupSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          const offsetTop = targetElement.offsetTop - 80; // Compensar altura navbar
          
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
          
          // Actualizar URL sin recargar página
          history.pushState(null, null, `#${targetId}`);
        }
      });
    });
  }

  /**
   * Configura navegación por teclado
   */
  setupKeyboardNavigation() {
    const navLinks = this.navMenu?.querySelectorAll('.nav-link');
    
    navLinks?.forEach((link, index) => {
      link.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            const nextIndex = (index + 1) % navLinks.length;
            navLinks[nextIndex].focus();
            break;
            
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            const prevIndex = (index - 1 + navLinks.length) % navLinks.length;
            navLinks[prevIndex].focus();
            break;
            
          case 'Home':
            e.preventDefault();
            navLinks[0].focus();
            break;
            
          case 'End':
            e.preventDefault();
            navLinks[navLinks.length - 1].focus();
            break;
        }
      });
    });
  }

  setupHardReloadLogo() {
    const logos = document.querySelectorAll('.js-hard-reload-logo');
    logos.forEach((logo) => {
      const hardReload = (e) => {
        e.preventDefault();
        const targetPath = logo.getAttribute('href') || window.location.href;
        const normalized = targetPath.startsWith('http')
          ? targetPath
          : new URL(targetPath, window.location.href).pathname;
        window.location.assign(`${normalized}?_r=${Date.now()}`);
      };
      logo.addEventListener('click', hardReload);
      logo.addEventListener('touchend', hardReload, { passive: false });
    });
  }

  /**
   * Actualiza el estado activo de los enlaces según la sección visible
   */
  updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    let currentSection = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      
      if (window.scrollY >= sectionTop && 
          window.scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }

  /**
   * Oculta/muestra navbar en scroll
   */
  setupAutoHide() {
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    const updateNavbarVisibility = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navbar
        this.navbar.style.transform = 'translateY(-100%)';
      } else {
        // Scrolling up - show navbar
        this.navbar.style.transform = 'translateY(0)';
      }
      
      lastScrollY = currentScrollY;
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateNavbarVisibility);
        ticking = true;
      }
    });
  }
}

// Inicializar navbar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.navbar = new Navbar();
});
