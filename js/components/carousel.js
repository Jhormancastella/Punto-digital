/**
 * Carousel mejorado para el hero section
 */
class HeroCarousel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.slides = [];
    this.currentSlide = 0;
    this.isPlaying = true;
    this.touchStartX = 0;
    this.touchEndX = 0;
    
    this.options = {
      autoPlay: true,
      interval: 5000,
      pauseOnHover: true,
      swipeThreshold: 50,
      ...options
    };
    
    this.init();
  }

  init() {
    if (!this.container) return;
    
    this.setupSlides();
    this.setupControls();
    this.setupTouchEvents();
    this.setupKeyboardEvents();
    this.setupIntersectionObserver();
    
    if (this.options.autoPlay) {
      this.startAutoPlay();
    }
  }

  /**
   * Configura las slides del carousel
   */
  setupSlides() {
    this.slides = Array.from(this.container.querySelectorAll('.carousel-slide'));
    
    if (this.slides.length === 0) return;
    
    // Asegurar que solo la primera slide esté activa
    this.slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === 0);
      slide.setAttribute('aria-hidden', index !== 0);
    });
  }

  /**
   * Configura controles del carousel
   */
  setupControls() {
    // Crear indicadores
    this.createIndicators();
    
    // Crear botones de navegación
    this.createNavigationButtons();
    
    // Pausar en hover si está configurado
    if (this.options.pauseOnHover) {
      this.container.addEventListener('mouseenter', () => this.pause());
      this.container.addEventListener('mouseleave', () => this.resume());
    }
  }

  /**
   * Crea indicadores de slide
   */
  createIndicators() {
    if (this.slides.length <= 1) return;
    
    const indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'carousel-indicators';
    indicatorsContainer.setAttribute('role', 'tablist');
    
    this.slides.forEach((_, index) => {
      const indicator = document.createElement('button');
      indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
      indicator.setAttribute('role', 'tab');
      indicator.setAttribute('aria-label', `Slide ${index + 1}`);
      indicator.addEventListener('click', () => this.goToSlide(index));
      
      indicatorsContainer.appendChild(indicator);
    });
    
    this.container.appendChild(indicatorsContainer);
    this.indicators = indicatorsContainer.querySelectorAll('.carousel-indicator');
  }

  /**
   * Crea botones de navegación
   */
  createNavigationButtons() {
    if (this.slides.length <= 1) return;
    
    const prevButton = document.createElement('button');
    prevButton.className = 'carousel-nav carousel-prev';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.setAttribute('aria-label', 'Slide anterior');
    prevButton.addEventListener('click', () => this.previousSlide());
    
    const nextButton = document.createElement('button');
    nextButton.className = 'carousel-nav carousel-next';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.setAttribute('aria-label', 'Siguiente slide');
    nextButton.addEventListener('click', () => this.nextSlide());
    
    this.container.appendChild(prevButton);
    this.container.appendChild(nextButton);
  }

  /**
   * Configura eventos táctiles para swipe
   */
  setupTouchEvents() {
    this.container.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    this.container.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  }

  /**
   * Maneja gestos de swipe
   */
  handleSwipe() {
    const swipeDistance = this.touchStartX - this.touchEndX;
    
    if (Math.abs(swipeDistance) > this.options.swipeThreshold) {
      if (swipeDistance > 0) {
        this.nextSlide();
      } else {
        this.previousSlide();
      }
    }
  }

  /**
   * Configura navegación por teclado
   */
  setupKeyboardEvents() {
    this.container.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.previousSlide();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.nextSlide();
          break;
        case ' ':
          e.preventDefault();
          this.toggleAutoPlay();
          break;
      }
    });
  }

  /**
   * Configura observer para pausar cuando no está visible
   */
  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.resume();
        } else {
          this.pause();
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(this.container);
  }

  /**
   * Va a una slide específica
   */
  goToSlide(index) {
    if (index === this.currentSlide || index < 0 || index >= this.slides.length) {
      return;
    }
    
    // Remover clase activa de slide actual
    this.slides[this.currentSlide].classList.remove('active');
    this.slides[this.currentSlide].setAttribute('aria-hidden', 'true');
    
    // Actualizar indicador actual
    if (this.indicators) {
      this.indicators[this.currentSlide].classList.remove('active');
    }
    
    // Activar nueva slide
    this.currentSlide = index;
    this.slides[this.currentSlide].classList.add('active');
    this.slides[this.currentSlide].setAttribute('aria-hidden', 'false');
    
    // Actualizar indicador
    if (this.indicators) {
      this.indicators[this.currentSlide].classList.add('active');
    }
    
    // Emitir evento personalizado
    this.container.dispatchEvent(new CustomEvent('slideChanged', {
      detail: { currentSlide: this.currentSlide }
    }));
  }

  /**
   * Va a la siguiente slide
   */
  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  /**
   * Va a la slide anterior
   */
  previousSlide() {
    const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }

  /**
   * Inicia reproducción automática
   */
  startAutoPlay() {
    if (this.slides.length <= 1) return;
    
    this.autoPlayInterval = setInterval(() => {
      if (this.isPlaying) {
        this.nextSlide();
      }
    }, this.options.interval);
  }

  /**
   * Detiene reproducción automática
   */
  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  /**
   * Pausa el carousel
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * Reanuda el carousel
   */
  resume() {
    if (this.options.autoPlay) {
      this.isPlaying = true;
    }
  }

  /**
   * Alterna reproducción automática
   */
  toggleAutoPlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  /**
   * Actualiza las slides con nuevos datos
   */
  updateSlides(slidesData) {
    this.container.innerHTML = '';
    
    slidesData.forEach((slideData, index) => {
      const slide = this.createSlide(slideData, index === 0);
      this.container.appendChild(slide);
    });
    
    this.setupSlides();
    this.setupControls();
  }

  /**
   * Crea una slide individual
   */
  createSlide(slideData, isActive = false) {
    const slide = document.createElement('div');
    slide.className = `carousel-slide ${isActive ? 'active' : ''}`;
    slide.setAttribute('aria-hidden', !isActive);
    
    slide.innerHTML = `
      <div class="phone-group">
        ${slideData.images.map((phone, pIdx) => `
          <div class="phone-item phone-${pIdx + 1}">
            <img src="${Helpers.sanitizeUrl(phone.url)}" alt="${Helpers.escapeAttr(phone.alt)}" loading="lazy">
          </div>
        `).join('')}
        <div class="golden-orb orb-1"></div>
        <div class="golden-orb orb-2"></div>
        <div class="golden-orb orb-3"></div>
      </div>
    `;
    
    return slide;
  }

  /**
   * Destruye el carousel
   */
  destroy() {
    this.stopAutoPlay();
    
    // Remover event listeners
    this.container.removeEventListener('touchstart', this.handleTouchStart);
    this.container.removeEventListener('touchend', this.handleTouchEnd);
    this.container.removeEventListener('keydown', this.handleKeydown);
  }
}

// Exportar para uso global
window.HeroCarousel = HeroCarousel;
