/**
 * ImageLightbox — Visor de imágenes con zoom y navegación
 * Abre imágenes en alta calidad con funcionalidad de zoom y paneo
 */
class ImageLightbox {
  constructor() {
    this.overlay = null;
    this.container = null;
    this.imageWrapper = null;
    this.image = null;
    this.isOpen = false;
    this.images = [];
    this.currentIndex = 0;
    this.productName = '';

    // Estado de zoom
    this.scale = 1;
    this.minScale = 1;
    this.maxScale = 4;
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.lastTranslateX = 0;
    this.lastTranslateY = 0;

    // Para pinch zoom en móvil
    this.initialPinchDistance = 0;
    this.initialScale = 1;

    this.init();
  }

  init() {
    this.createLightbox();
    this.setupEventListeners();
  }

  createLightbox() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'image-lightbox';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', 'Visor de imágenes del producto');

    this.overlay.innerHTML = `
      <button class="il-close" aria-label="Cerrar visor">
        <i class="fas fa-times"></i>
      </button>

      <div class="il-counter" id="ilCounter"></div>
      <div class="il-title" id="ilTitle"></div>

      <button class="il-nav il-nav--prev" id="ilNavPrev" aria-label="Imagen anterior">
        <i class="fas fa-chevron-left"></i>
      </button>

      <button class="il-nav il-nav--next" id="ilNavNext" aria-label="Imagen siguiente">
        <i class="fas fa-chevron-right"></i>
      </button>

      <div class="il-container">
        <div class="il-loader" id="ilLoader"></div>
        <div class="il-image-wrapper" id="ilImageWrapper">
          <img class="il-image loading" id="ilImage" src="" alt="" draggable="false">
        </div>
      </div>

      <div class="il-zoom-controls">
        <button class="il-zoom-btn" id="ilZoomOut" aria-label="Reducir zoom">
          <i class="fas fa-search-minus"></i>
        </button>
        <div class="il-zoom-level" id="ilZoomLevel">100%</div>
        <button class="il-zoom-btn" id="ilZoomIn" aria-label="Aumentar zoom">
          <i class="fas fa-search-plus"></i>
        </button>
        <button class="il-zoom-btn" id="ilZoomReset" aria-label="Restablecer zoom">
          <i class="fas fa-expand"></i>
        </button>
      </div>

      <div class="il-hint">Rueda del ratón o pincha para arrastrar cuando hay zoom</div>
    `;

    document.body.appendChild(this.overlay);

    // Referencias a elementos
    this.container = this.overlay.querySelector('.il-container');
    this.imageWrapper = this.overlay.querySelector('#ilImageWrapper');
    this.image = this.overlay.querySelector('#ilImage');
    this.loader = this.overlay.querySelector('#ilLoader');
  }

  setupEventListeners() {
    // Botón cerrar
    this.overlay.querySelector('.il-close').addEventListener('click', () => this.close());

    // Click en el fondo para cerrar
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Navegación
    this.overlay.querySelector('#ilNavPrev').addEventListener('click', () => this.prevImage());
    this.overlay.querySelector('#ilNavNext').addEventListener('click', () => this.nextImage());

    // Controles de zoom
    this.overlay.querySelector('#ilZoomIn').addEventListener('click', () => this.zoomIn());
    this.overlay.querySelector('#ilZoomOut').addEventListener('click', () => this.zoomOut());
    this.overlay.querySelector('#ilZoomReset').addEventListener('click', () => this.resetZoom());

    // Zoom con rueda del ratón
    this.overlay.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoomIn(e.clientX, e.clientY);
      } else {
        this.zoomOut();
      }
    }, { passive: false });

    // Arrastrar cuando hay zoom
    this.imageWrapper.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.endDrag());

    // Touch events para móvil
    this.imageWrapper.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    document.addEventListener('touchend', () => this.handleTouchEnd());

    // Teclado
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.prevImage();
          break;
        case 'ArrowRight':
          this.nextImage();
          break;
        case '+':
        case '=':
          this.zoomIn();
          break;
        case '-':
          this.zoomOut();
          break;
        case '0':
          this.resetZoom();
          break;
      }
    });

    // Double click para zoom
    this.imageWrapper.addEventListener('dblclick', (e) => {
      if (this.scale > 1) {
        this.resetZoom();
      } else {
        this.zoomTo(2.5, e.clientX, e.clientY);
      }
    });
  }

  open(images, index = 0, productName = '') {
    if (!images || !images.length) return;

    this.images = Array.isArray(images) ? images : [images];
    this.currentIndex = Math.max(0, Math.min(index, this.images.length - 1));
    this.productName = productName;

    this.resetZoom();
    this.loadImage();
    this.updateUI();

    this.overlay.classList.add('active');
    this.overlay.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.overlay.classList.remove('active');
    this.overlay.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
    document.body.style.overflow = '';
    this.resetZoom();

    // Limpiar src después de la animación
    setTimeout(() => {
      if (!this.isOpen) {
        this.image.src = '';
        this.image.classList.add('loading');
      }
    }, 350);
  }

  loadImage() {
    const src = this.images[this.currentIndex];
    if (!src) return;

    this.image.classList.add('loading');
    this.loader.style.display = 'block';

    // Cargar imagen en alta calidad
    const highResSrc = this.getHighResUrl(src);

    const tempImg = new Image();
    tempImg.onload = () => {
      this.image.src = highResSrc;
      this.image.alt = `${this.productName} - Imagen ${this.currentIndex + 1}`;
      this.image.classList.remove('loading');
      this.loader.style.display = 'none';
    };
    tempImg.onerror = () => {
      // Fallback a URL original si la alta resolución falla
      const fallback = `https://placehold.co/1200x1200/1a1a1a/d4a843?text=${encodeURIComponent(this.productName)}`;
      this.image.src = fallback;
      this.image.alt = `${this.productName} - Imagen ${this.currentIndex + 1}`;
      this.image.classList.remove('loading');
      this.loader.style.display = 'none';
    };
    tempImg.src = highResSrc;
  }

  getHighResUrl(url) {
    // Si es de Cloudinary, solicitar versión de alta resolución FHD
    if (url && url.includes('cloudinary.com')) {
      // Transformación Cloudinary para máxima calidad FHD
      return url.replace('/upload/', '/upload/q_auto:best,f_auto,w_1920/');
    }
    return url;
  }

  updateUI() {
    // Contador
    const counter = this.overlay.querySelector('#ilCounter');
    if (this.images.length > 1) {
      counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
      counter.style.display = 'block';
    } else {
      counter.style.display = 'none';
    }

    // Título
    const title = this.overlay.querySelector('#ilTitle');
    if (this.productName) {
      title.textContent = this.productName;
      title.style.display = 'block';
    } else {
      title.style.display = 'none';
    }

    // Botones de navegación
    const prevBtn = this.overlay.querySelector('#ilNavPrev');
    const nextBtn = this.overlay.querySelector('#ilNavNext');

    if (this.images.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }
  }

  prevImage() {
    if (this.images.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.resetZoom();
    this.loadImage();
    this.updateUI();
  }

  nextImage() {
    if (this.images.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.resetZoom();
    this.loadImage();
    this.updateUI();
  }

  // === Funcionalidad de Zoom ===

  zoomIn(centerX, centerY) {
    const newScale = Math.min(this.scale * 1.3, this.maxScale);
    if (centerX !== undefined && centerY !== undefined) {
      this.zoomTo(newScale, centerX, centerY);
    } else {
      this.zoomTo(newScale);
    }
  }

  zoomOut() {
    const newScale = Math.max(this.scale * 0.7, this.minScale);
    this.zoomTo(newScale);
  }

  zoomTo(newScale, centerX, centerY) {
    const prevScale = this.scale;
    this.scale = Math.max(this.minScale, Math.min(newScale, this.maxScale));

    // Si volvemos al mínimo, centrar
    if (this.scale === 1) {
      this.translateX = 0;
      this.translateY = 0;
    } else if (centerX !== undefined && centerY !== undefined) {
      // Zoom hacia el punto del cursor
      const rect = this.imageWrapper.getBoundingClientRect();
      const offsetX = centerX - rect.left - rect.width / 2;
      const offsetY = centerY - rect.top - rect.height / 2;

      const scaleRatio = this.scale / prevScale;
      this.translateX = offsetX - (offsetX - this.translateX) * scaleRatio;
      this.translateY = offsetY - (offsetY - this.translateY) * scaleRatio;
    }

    // Limitar el desplazamiento
    this.constrainTranslation();
    this.applyTransform();
    this.updateZoomLevel();
  }

  resetZoom() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
    this.imageWrapper.classList.remove('zoomed', 'dragging');
    this.applyTransform();
    this.updateZoomLevel();
  }

  applyTransform() {
    this.imageWrapper.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    this.imageWrapper.classList.toggle('zoomed', this.scale > 1);
  }

  updateZoomLevel() {
    const level = this.overlay.querySelector('#ilZoomLevel');
    level.textContent = `${Math.round(this.scale * 100)}%`;
  }

  constrainTranslation() {
    if (this.scale <= 1) {
      this.translateX = 0;
      this.translateY = 0;
      return;
    }

    const rect = this.imageWrapper.getBoundingClientRect();
    const maxX = (rect.width * (this.scale - 1)) / 2;
    const maxY = (rect.height * (this.scale - 1)) / 2;

    this.translateX = Math.max(-maxX, Math.min(maxX, this.translateX));
    this.translateY = Math.max(-maxY, Math.min(maxY, this.translateY));
  }

  // === Arrastrar con Mouse ===

  startDrag(e) {
    if (this.scale <= 1) return;
    if (e.button !== 0) return;

    this.isDragging = true;
    this.imageWrapper.classList.add('dragging');
    this.startX = e.clientX - this.translateX;
    this.startY = e.clientY - this.translateY;
  }

  drag(e) {
    if (!this.isDragging) return;

    this.translateX = e.clientX - this.startX;
    this.translateY = e.clientY - this.startY;
    this.constrainTranslation();
    this.applyTransform();
  }

  endDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.imageWrapper.classList.remove('dragging');
  }

  // === Touch Events para Móvil ===

  handleTouchStart(e) {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      this.initialPinchDistance = this.getPinchDistance(e.touches);
      this.initialScale = this.scale;
    } else if (e.touches.length === 1 && this.scale > 1) {
      // Arrastrar
      this.isDragging = true;
      this.startX = e.touches[0].clientX - this.translateX;
      this.startY = e.touches[0].clientY - this.translateY;
    }
  }

  handleTouchMove(e) {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = this.getPinchDistance(e.touches);
      const scaleChange = currentDistance / this.initialPinchDistance;
      const newScale = Math.max(1, Math.min(this.initialScale * scaleChange, this.maxScale));
      this.zoomTo(newScale);
    } else if (e.touches.length === 1 && this.isDragging && this.scale > 1) {
      // Arrastrar
      e.preventDefault();
      this.translateX = e.touches[0].clientX - this.startX;
      this.translateY = e.touches[0].clientY - this.startY;
      this.constrainTranslation();
      this.applyTransform();
    }
  }

  handleTouchEnd() {
    this.isDragging = false;
  }

  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // === API Pública estática ===

  /**
   * Extrae las URLs de imagen de un objeto producto
   */
  static extractImages(product) {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length) return product.images;
    if (product.image) return [product.image];
    return [];
  }

  /**
   * Abre el lightbox con las imágenes de un producto
   */
  openProductImages(product, startIndex = 0) {
    const images = ImageLightbox.extractImages(product);
    if (images.length) {
      this.open(images, startIndex, product.name || '');
    }
  }
}

// Crear instancia global
window.imageLightbox = new ImageLightbox();
window.ImageLightbox = ImageLightbox;

/**
 * Utilidad para agregar click handlers a imágenes de productos
 * Busca todas las imágenes de producto y les añade el evento click para zoom
 */
function setupProductImageZoom(options = {}) {
  const config = {
    selector: '.product-image img, .catalog-card-img img, .pp-gallery__main img',
    excludeSelector: '.pp-thumb img',
    cursorZoom: true,
    ...options
  };

  const images = document.querySelectorAll(config.selector);

  images.forEach(img => {
    // Excluir elementos específicos
    if (config.excludeSelector && img.matches(config.excludeSelector)) return;
    if (img.closest(config.excludeSelector)) return;

    if (config.cursorZoom) {
      img.style.cursor = 'zoom-in';
    }

    // Evitar doble binding
    if (img.dataset.lightbound) return;
    img.dataset.lightbound = 'true';

    img.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const product = findProductFromImage(img);
      const images = ImageLightbox.extractImages(product);
      const currentIndex = getCurrentImageIndex(img);

      window.imageLightbox.open(images, currentIndex, product?.name || '');
    });
  });
}

/**
 * Encuentra el producto asociado a una imagen
 */
function findProductFromImage(img) {
  // Buscar el contenedor del producto más cercano
  const card = img.closest('[data-product-id], .product-card, .catalog-card');
  if (card) {
    const productId = card.dataset.productId;
    if (productId && window.siteData) {
      const products = window.siteData.getSection('products') || [];
      const product = products.find(p => p.id === productId);
      if (product) return product;
    }
  }

  // Para la página de producto
  if (window.productPage?.currentProduct) {
    return window.productPage.currentProduct;
  }

  // Buscar en el catálogo
  if (window.catalog?.allProducts) {
    const src = img.src;
    return window.catalog.allProducts.find(p =>
      (p.images?.some(i => src.includes(i))) || src.includes(p.image)
    );
  }

  return null;
}

/**
 * Obtiene el índice de la imagen actual en el array de imágenes del producto
 */
function getCurrentImageIndex(img) {
  const card = img.closest('[data-product-id], .product-card, .catalog-card, .pp-gallery');
  if (!card) return 0;

  const product = findProductFromImage(img);
  if (!product) return 0;

  const images = ImageLightbox.extractImages(product);
  const currentSrc = img.src;

  // Intentar encontrar por URL
  for (let i = 0; i < images.length; i++) {
    if (currentSrc.includes(images[i]) || images[i].includes(currentSrc)) {
      return i;
    }
  }

  return 0;
}

// Exportar funciones globales
window.setupProductImageZoom = setupProductImageZoom;
window.findProductFromImage = findProductFromImage;
