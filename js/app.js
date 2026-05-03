/**
 * Aplicación principal de Punto Digital
 * Versión modularizada y optimizada
 */
class PuntoDigitalApp {
  constructor() {
    this.isAdmin = false;
    this.heroCarousel = null;
    
    this.init();
  }

  /**
   * Inicializa la aplicación
   */
  async init() {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  /**
   * Inicia la aplicación
   */
  start() {
    this.setupEventListeners();
    this.initializeComponents();
    this.renderInitialContent();
    this.setupAccessibility();
    this.setupPerformanceOptimizations();
  }

  /**
   * Configura event listeners globales
   */
  setupEventListeners() {
    // Escuchar cambios en los datos del sitio
    window.siteData.addObserver((event, data) => {
      this.handleDataChange(event, data);
    });

    // Escuchar cambios de tema
    window.addEventListener('themeChanged', (e) => {
      this.handleThemeChange(e.detail);
    });

    // Manejar errores globales
    window.addEventListener('error', (e) => {
      console.error('Error global:', e.error);
    });

    // Manejar promesas rechazadas
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Promesa rechazada:', e.reason);
    });
  }

  /**
   * Inicializa componentes
   */
  initializeComponents() {
    // Inicializar carousel del hero
    this.heroCarousel = new HeroCarousel('heroCarousel', {
      autoPlay: true,
      interval: 5000,
      pauseOnHover: true
    });

    // Configurar intersection observer para animaciones
    this.setupScrollAnimations();
  }

  /**
   * Renderiza contenido inicial
   */
  renderInitialContent() {
    this.renderHero();
    this.renderFeatures();
    this.renderCategories();
    this.renderProducts();
    this.renderFeaturedProducts();
    this.renderFooter();
  }

  /**
   * Renderiza la sección hero
   */
  renderHero() {
    const heroData = window.siteData.getSection('hero');
    
    // Actualizar texto del hero
    const titleElement = document.getElementById('hero-title');
    const descElement = document.getElementById('hero-description');
    const buttonElement = document.getElementById('hero-button');
    
    if (titleElement && heroData.title) {
      const words = String(heroData.title).split(' ');
      const midPoint = Math.ceil(words.length / 2);
      const firstHalf = Helpers.escapeHtml(words.slice(0, midPoint).join(' '));
      const secondHalf = Helpers.escapeHtml(words.slice(midPoint).join(' '));
      
      titleElement.innerHTML = `
        <span class="gold">${firstHalf}</span><br>
        <span class="white">${secondHalf}</span>
      `;
    }
    
    if (descElement) {
      descElement.textContent = heroData.description;
    }
    
    if (buttonElement) {
      buttonElement.textContent = heroData.buttonText;
    }

    // Actualizar carousel
    this.updateHeroCarousel(heroData.images);
  }

  /**
   * Actualiza el carousel del hero
   */
  updateHeroCarousel(images) {
    const carousel = document.getElementById('heroCarousel');
    if (!carousel || !images) return;

    carousel.innerHTML = images.map((img, index) => `
      <div class="carousel-slide ${index === 0 ? 'active' : ''}" 
           role="tabpanel" aria-label="Slide ${index + 1}">
        <div class="phone-group">
          ${images.map((phone, pIdx) => `
            <div class="phone-item phone-${pIdx + 1}" 
                 style="z-index: ${pIdx === 1 || pIdx === 2 ? 3 : 1}"
                 data-phone-index="${pIdx}">
              <img src="${Helpers.sanitizeUrl(phone.url)}" alt="${Helpers.escapeAttr(phone.alt)}" loading="lazy">
            </div>
          `).join('')}
          <div class="golden-orb orb-1" aria-hidden="true"></div>
          <div class="golden-orb orb-2" aria-hidden="true"></div>
          <div class="golden-orb orb-3" aria-hidden="true"></div>
        </div>
      </div>
    `).join('');

    // Reinicializar carousel si existe
    if (this.heroCarousel) {
      this.heroCarousel.setupSlides();
    }

    // Reinicializar interacciones de teléfonos
    if (window.heroPhones) {
      setTimeout(() => {
        window.heroPhones.refresh();
      }, 100);
    }
  }

  /**
   * Renderiza características
   */
  renderFeatures() {
    const features = window.siteData.getSection('features');
    const container = document.getElementById('featuresContainer');
    
    if (!container || !features) return;

    container.innerHTML = features.map(feature => `
      <div class="feature-item">
        <div class="feature-icon" aria-hidden="true">
          <i class="fas ${Helpers.escapeAttr(feature.icon)}"></i>
        </div>
        <div class="feature-text">
          <h4>${Helpers.escapeHtml(feature.title)}</h4>
          <p>${Helpers.escapeHtml(feature.desc)}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * Renderiza el grid de categorías "Nuestros Productos"
   */
  renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;

    const categories = [
      {
        name: 'Smartphones',
        icon: 'fa-mobile-alt',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop&auto=format',
        description: 'Los últimos modelos',
        filter: 'smartphones'
      },
      {
        name: 'Auriculares Bluetooth',
        icon: 'fa-headphones',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&auto=format',
        description: 'Audio de alta calidad',
        filter: 'auriculares'
      },
      {
        name: 'Smartwatches',
        icon: 'fa-clock',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop&auto=format',
        description: 'Tecnología wearable',
        filter: 'smartwatches'
      },
      {
        name: 'Cargadores y Accesorios',
        icon: 'fa-plug',
        image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop&auto=format',
        description: 'Accesorios esenciales',
        filter: 'accesorios'
      }
    ];

    grid.innerHTML = categories.map((cat, index) => `
      <a href="catalogo.html?category=${cat.filter}"
         class="category-card" role="gridcell" tabindex="0"
         aria-label="Ver ${Helpers.escapeAttr(cat.name)}"
         data-index="${index}" style="--index: ${index}; text-decoration:none">
        <div class="category-image">
          <img src="${Helpers.sanitizeUrl(cat.image)}" alt="${Helpers.escapeAttr(cat.name)}" loading="lazy"
               onerror="this.parentElement.style.background='linear-gradient(135deg,#1a1a1a,#2a1a00)'">
        </div>
        <h3>${Helpers.escapeHtml(cat.name)}</h3>
        <p class="category-desc">${Helpers.escapeHtml(cat.description)}</p>
      </a>
    `).join('');

    this.animateCardsEntrance('.category-card');
  }

  /**
   * Renderiza productos destacados
   */
  renderProducts() {
    const products = window.siteData.getSection('products');
    const grid = document.getElementById('productsGrid');
    
    if (!grid || !products) return;

    // Tomar solo los primeros 4 productos
    const displayProducts = products.slice(0, 4);

    grid.innerHTML = displayProducts.map((product, index) => `
      <div class="product-card" role="gridcell" tabindex="0" 
           aria-label="Producto: ${Helpers.escapeAttr(product.name)}"
           data-index="${index}" data-product-id="${product.id}" style="--index: ${index}">
        <div class="product-image">
          <img src="${Helpers.sanitizeUrl(product.image)}" alt="${Helpers.escapeAttr(product.name)}" loading="lazy"
               onload="this.classList.add('loaded')"
               onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIyMCIgdmlld0JveD0iMCAwIDIwMCAyMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjIwIiBmaWxsPSIjMWExYTFhIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNkNGE4NDMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlByb2R1Y3RvPC90ZXh0Pgo8L3N2Zz4K'">
          ${product.badge ? `<span class="product-badge">${Helpers.escapeHtml(product.badge)}</span>` : ''}
        </div>
        <div class="product-content">
          <h4>${Helpers.escapeHtml(product.name)}</h4>
          <p class="product-description">${Helpers.escapeHtml(product.description || '')}</p>
          <div class="product-price" aria-label="Precio: ${this.formatPrice(product.price)}">
            ${product.originalPrice ? `<span class="original-price">${this.formatPrice(product.originalPrice)}</span>` : ''}
            <span class="current-price">${this.formatPrice(product.price)}</span>
          </div>
          <a href="catalogo.html?search=${encodeURIComponent(product.name)}&brand=${encodeURIComponent(product.brand || '')}"
             class="btn-outline product-view-btn"
             aria-label="Ver más productos relacionados con ${Helpers.escapeAttr(product.name)} en el catálogo">
            <i class="fas fa-search"></i>
            Ver Más
          </a>
        </div>
      </div>
    `).join('');

    // Agregar botón "Ver Catálogo"
    const catalogButtonContainer = document.createElement('div');
    catalogButtonContainer.className = 'catalog-button-container';
    catalogButtonContainer.innerHTML = `
      <a href="catalogo.html" class="btn-catalog">
        <i class="fas fa-th-large"></i>
        Ver Catálogo Completo
      </a>
    `;
    grid.appendChild(catalogButtonContainer);

    this.processRenderedProductImages(grid);

    // Aplicar animaciones de entrada
    this.animateCardsEntrance('.product-card');
  }

  /**
   * Renderiza productos destacados — filtra por featured: true del array único
   */
  renderFeaturedProducts() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    const all = window.siteData.getSection('products') || [];
    const displayProducts = all.filter(p => p.featured).slice(0, 4);

    if (!displayProducts.length) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = displayProducts.map((product, index) => `
      <div class="product-card featured-card" role="gridcell" tabindex="0" 
           aria-label="Producto destacado: ${Helpers.escapeAttr(product.name)}"
           data-index="${index}" data-product-id="${product.id}" style="--index: ${index}">
        <div class="product-image">
          <img src="${Helpers.sanitizeUrl(product.image)}" alt="${Helpers.escapeAttr(product.name)}" loading="lazy"
               onload="this.classList.add('loaded')"
               onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIyMCIgdmlld0JveD0iMCAwIDIwMCAyMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjIwIiBmaWxsPSIjMWExYTFhIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNkNGE4NDMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlByb2R1Y3RvPC90ZXh0Pgo8L3N2Zz4K'">
          ${product.badge ? `<span class="product-badge">${Helpers.escapeHtml(product.badge)}</span>` : ''}
          <span class="featured-badge">Destacado</span>
        </div>
        <div class="product-content">
          <h4>${Helpers.escapeHtml(product.name)}</h4>
          <p class="product-description">${Helpers.escapeHtml(product.description || '')}</p>
          ${product.rating ? `
            <div class="product-rating">
              <div class="stars">
                ${this.generateStars(product.rating)}
              </div>
              <span class="rating-text">${product.rating} (${product.reviews || 0})</span>
            </div>
          ` : ''}
          <div class="product-price" aria-label="Precio: ${this.formatPrice(product.price)}">
            ${product.originalPrice ? `<span class="original-price">${this.formatPrice(product.originalPrice)}</span>` : ''}
            <span class="current-price">${this.formatPrice(product.price)}</span>
          </div>
          <a href="catalogo.html?search=${encodeURIComponent(product.name)}&brand=${encodeURIComponent(product.brand || '')}"
             class="btn-outline product-view-btn"
             aria-label="Ver más productos relacionados con ${Helpers.escapeAttr(product.name)} en el catálogo">
            <i class="fas fa-search"></i>
            Ver Más
          </a>
        </div>
      </div>
    `).join('');

    this.processRenderedProductImages(grid);

    // Aplicar animaciones de entrada
    this.animateCardsEntrance('.featured-card');
  }

  processRenderedProductImages(container) {
    if (!container || !window.imageProcessor?.processImageForCatalog) return;
    const images = container.querySelectorAll('.product-image img');
    images.forEach((img) => {
      const originalSrc = img.getAttribute('src');
      if (!originalSrc) return;
      window.imageProcessor.processImageForCatalog(originalSrc, { outputSize: 500 })
        .then((processedSrc) => {
          if (processedSrc && img.getAttribute('src') === originalSrc) {
            img.src = processedSrc;
          }
        })
        .catch(() => {});
    });
  }

  /**
   * Abre modal de producto
   */
  openProductModal(productId) {
    if (window.productModal) {
      window.productModal.openProduct(productId);
    }
  }

  /**
   * Genera estrellas para rating
   */
  generateStars(rating) {
    return Formatters.generateStars(rating);
  }

  /**
   * Formatea precio
   */
  formatPrice(price) {
    return Formatters.formatPrice(price);
  }

  /**
   * Renderiza footer
   */
  renderFooter() {
    const footerData = window.siteData.getSection('footer');
    const socialData = window.siteData.getSection('social');
    
    this.renderFooterContact(footerData);
    this.renderSocialLinks(socialData);
  }

  /**
   * Renderiza información de contacto
   */
  renderFooterContact(footerData) {
    const container = document.getElementById('footerContact');
    if (!container || !footerData) return;

    container.innerHTML = `
      <a href="tel:${footerData.phone}" class="contact-item">
        <i class="fas fa-phone" aria-hidden="true"></i>
        <span>${Helpers.escapeHtml(footerData.phone)}</span>
      </a>
      <a href="mailto:${Helpers.escapeAttr(footerData.email)}" class="contact-item">
        <i class="fas fa-envelope" aria-hidden="true"></i>
        <span>${Helpers.escapeHtml(footerData.email)}</span>
      </a>
      ${footerData.address ? `
        <div class="contact-item">
          <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
          <span>${Helpers.escapeHtml(footerData.address)}</span>
        </div>
      ` : ''}
      ${footerData.whatsapp ? `
        <a href="https://wa.me/${footerData.whatsapp.replace(/\D/g, '')}" 
           class="contact-item" target="_blank" rel="noopener">
          <i class="fab fa-whatsapp" aria-hidden="true"></i>
          <span>WhatsApp</span>
        </a>
      ` : ''}
    `;
  }

  /**
   * Renderiza enlaces sociales
   */
  renderSocialLinks(socialData) {
    const container = document.getElementById('socialLinks');
    if (!container || !socialData) return;

    const socialIcons = {
      facebook:  'fab fa-facebook-f',
      instagram: 'fab fa-instagram',
      whatsapp:  'fab fa-whatsapp',
      twitter:   'fab fa-x-twitter',
      youtube:   'fab fa-youtube',
      tiktok:    'fab fa-tiktok'
    };

    container.innerHTML = Object.entries(socialData)
      .filter(([, url]) => url && url !== '#')
      .map(([platform, url]) => `
        <a href="${Helpers.sanitizeUrl(url)}" target="_blank" rel="noopener"
           aria-label="${Helpers.escapeAttr(platform.charAt(0).toUpperCase() + platform.slice(1))}"
           title="${Helpers.escapeAttr(platform.charAt(0).toUpperCase() + platform.slice(1))}">
          <i class="${socialIcons[platform] || 'fas fa-link'}" aria-hidden="true"></i>
        </a>
      `).join('');
  }

  /**
   * Configura animaciones de scroll
   */
  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          
          // Si es una tarjeta, añadir animación especial
          if (entry.target.classList.contains('category-card') || 
              entry.target.classList.contains('product-card')) {
            entry.target.classList.add('animate-in');
          }
        }
      });
    }, observerOptions);

    // Observar elementos animables
    const animatableElements = document.querySelectorAll(
      '.category-card, .product-card, .feature-item, .hero-text'
    );
    
    animatableElements.forEach(el => observer.observe(el));
  }

  /**
   * Anima la entrada de las tarjetas de forma escalonada
   */
  animateCardsEntrance(selector) {
    const cards = document.querySelectorAll(selector);
    
    cards.forEach((card, index) => {
      // Resetear estado inicial
      card.style.opacity = '0';
      card.style.transform = 'translateY(50px) scale(0.9)';
      
      // Aplicar animación con delay
      setTimeout(() => {
        card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
        card.classList.add('animate-in');
      }, index * 100 + 200);
    });
  }

  /**
   * Configura accesibilidad
   */
  setupAccessibility() {
    // Manejar navegación por teclado en grids
    this.setupGridNavigation();
    
    // Configurar anuncios para lectores de pantalla
    this.setupScreenReaderAnnouncements();
  }

  /**
   * Configura navegación por teclado en grids
   */
  setupGridNavigation() {
    const grids = document.querySelectorAll('[role="grid"]');
    
    grids.forEach(grid => {
      const cells = grid.querySelectorAll('[role="gridcell"]');
      
      cells.forEach((cell, index) => {
        cell.addEventListener('keydown', (e) => {
          let targetIndex = index;
          
          switch (e.key) {
            case 'ArrowRight':
              targetIndex = Math.min(index + 1, cells.length - 1);
              break;
            case 'ArrowLeft':
              targetIndex = Math.max(index - 1, 0);
              break;
            case 'ArrowDown':
              // Calcular siguiente fila (asumiendo 4 columnas en desktop)
              const cols = window.innerWidth > 768 ? 4 : 1;
              targetIndex = Math.min(index + cols, cells.length - 1);
              break;
            case 'ArrowUp':
              // Calcular fila anterior
              const colsUp = window.innerWidth > 768 ? 4 : 1;
              targetIndex = Math.max(index - colsUp, 0);
              break;
            case 'Home':
              targetIndex = 0;
              break;
            case 'End':
              targetIndex = cells.length - 1;
              break;
            default:
              return;
          }
          
          e.preventDefault();
          cells[targetIndex].focus();
        });
      });
    });
  }

  /**
   * Configura anuncios para lectores de pantalla
   */
  setupScreenReaderAnnouncements() {
    // Crear región live para anuncios
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(liveRegion);
    
    this.liveRegion = liveRegion;
  }

  /**
   * Anuncia mensaje a lectores de pantalla
   */
  announceToScreenReader(message) {
    if (this.liveRegion) {
      this.liveRegion.textContent = message;
      setTimeout(() => {
        this.liveRegion.textContent = '';
      }, 1000);
    }
  }

  /**
   * Configura optimizaciones de rendimiento
   */
  setupPerformanceOptimizations() {
    // Lazy loading para imágenes
    this.setupLazyLoading();
    
    // Preload de recursos críticos
    this.preloadCriticalResources();
  }

  /**
   * Configura lazy loading para imágenes
   */
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      // Observar imágenes con data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Preload de recursos críticos
   */
  preloadCriticalResources() {
    // Fuente ya cargada en el <head> del HTML — no se necesita preload dinámico
  }

  /**
   * Maneja cambios en los datos del sitio
   */
  handleDataChange(event, data) {
    switch (event) {
      case 'sectionUpdated':
        this.handleSectionUpdate(data.section, data.data);
        break;
      case 'itemAdded':
      case 'itemRemoved':
      case 'itemUpdated':
        this.handleItemChange(data.section);
        break;
      case 'dataReset':
        this.renderInitialContent();
        break;
    }
  }

  /**
   * Maneja actualización de sección
   */
  handleSectionUpdate(section, data) {
    switch (section) {
      case 'hero':
        this.renderHero();
        break;
      case 'features':
        this.renderFeatures();
        break;
      case 'categories':
      case 'products':
        this.renderCategories();
        this.renderProducts();
        this.renderFeaturedProducts();
        break;
      case 'footer':
      case 'social':
        this.renderFooter();
        break;
      case 'colors':
        this.applyColorChanges(data);
        break;
      case 'typography':
        this.applyTypographyChanges(data);
        break;
    }
  }

  /**
   * Maneja cambios en items de arrays
   */
  handleItemChange(section) {
    switch (section) {
      case 'features':
        this.renderFeatures();
        break;
      case 'categories':
        this.renderCategories();
        break;
      case 'products':
        this.renderProducts();
        break;
    }
  }

  /**
   * Aplica cambios de colores
   */
  applyColorChanges(colors) {
    const root = document.documentElement;
    
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
  }

  applyTypographyChanges(typography) {
    const root = document.documentElement;
    if (typography.fontFamily) {
      root.style.setProperty('--font-family', `'${typography.fontFamily}', 'Segoe UI', 'Roboto', 'Arial', sans-serif`);
    }
    if (typography.heroTitleSize) {
      root.style.setProperty('--font-size-hero', `clamp(28px, 5vw, ${parseInt(typography.heroTitleSize, 10)}px)`);
    }
    if (typography.sectionTitleSize) {
      root.style.setProperty('--font-size-section', `clamp(20px, 4vw, ${parseInt(typography.sectionTitleSize, 10)}px)`);
    }
    if (typography.baseSize) {
      root.style.setProperty('--font-size-base', `clamp(14px, 2vw, ${parseInt(typography.baseSize, 10)}px)`);
    }
  }

  /**
   * Maneja cambios de tema
   */
  handleThemeChange(themeData) {
    // Actualizar partículas según el tema
    if (window.particleSystem) {
      const isDark = themeData.theme === 'dark';
      window.particleSystem.updateConfig({
        opacity: { min: isDark ? 0.1 : 0.05, max: isDark ? 0.4 : 0.2 }
      });
    }
    
    this.announceToScreenReader(`Tema cambiado a ${themeData.theme === 'dark' ? 'oscuro' : 'claro'}`);
  }
}

// Funciones globales para compatibilidad con el HTML existente
// Nota: openLoginModal, closeLoginModal y loginAdmin se definen en el bloque
// inline de index.html (después de cargar app.js) para tener acceso al DOM del modal.

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
  const modal = document.getElementById('loginModal');
  if (e.target === modal) {
    window.closeLoginModal?.();
  }
});

// Inicializar aplicación
window.app = new PuntoDigitalApp();

// Re-renderizar cuando productLoader termine (puede llegar después del render inicial)
window.addEventListener('productsLoaded', () => {
  if (window.app) {
    window.app.renderProducts();
    window.app.renderFeaturedProducts();
    window.app.renderCategories();
  }
});
