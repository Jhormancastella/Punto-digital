/**
 * Modal de producto con detalles completos
 */
class ProductModal {
  constructor() {
    this.modal = null;
    this.currentProduct = null;
    this.isOpen = false;
    this.lastFocusedElement = null;
    
    this.init();
  }

  init() {
    this.createModal();
    this.setupEventListeners();
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'product-modal-overlay';
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-labelledby', 'product-modal-title');
    this.modal.setAttribute('aria-hidden', 'true');
    
    this.modal.innerHTML = `
      <div class="product-modal">
        <button class="product-modal-close" aria-label="Cerrar modal">
          <i class="fas fa-times"></i>
        </button>
        
        <div class="product-modal-content">
          <div class="product-modal-gallery">
            <div class="product-modal-thumbs product-modal-thumbs--vertical" id="product-modal-thumbs"></div>
            <div class="product-modal-image-wrapper">
              <div class="product-modal-image">
                <img id="product-modal-img" src="" alt="" loading="lazy">
                <div class="product-modal-badge" id="product-modal-badge"></div>
                <button class="product-modal-nav product-modal-nav--prev" id="product-modal-prev" aria-label="Imagen anterior">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button class="product-modal-nav product-modal-nav--next" id="product-modal-next" aria-label="Imagen siguiente">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div class="product-modal-info">
            <div class="product-modal-header">
              <h2 id="product-modal-title"></h2>
              <div class="product-modal-rating">
                <div class="stars" id="product-modal-stars"></div>
                <span class="rating-text" id="product-modal-rating-text"></span>
              </div>
            </div>
            
            <div class="product-modal-price">
              <span class="current-price" id="product-modal-price"></span>
              <span class="original-price" id="product-modal-original-price"></span>
              <span class="discount" id="product-modal-discount"></span>
            </div>
            
            <div class="product-modal-description">
              <p id="product-modal-desc"></p>
            </div>
            
            <div class="product-modal-specs">
              <h3>Especificaciones</h3>
              <div class="specs-grid" id="product-modal-specs-grid"></div>
            </div>
            
            <div class="product-modal-stock">
              <div class="stock-info">
                <i class="fas fa-box"></i>
                <span id="product-modal-stock-text"></span>
              </div>
            </div>

            <!-- Botones: visibles en desktop dentro del scroll -->
            <div class="product-modal-actions product-modal-actions--desktop">
              <button class="btn-add-cart" id="product-modal-add-cart">
                <i class="fas fa-shopping-cart"></i>
                Agregar al Carrito
              </button>
              <button class="btn-buy-now" id="product-modal-buy-now">
                <i class="fas fa-bolt"></i>
                Comprar Ahora
              </button>
              <button class="btn-whatsapp" id="product-modal-whatsapp">
                <i class="fab fa-whatsapp"></i>
                Consultar por WhatsApp
              </button>
            </div>
          </div>
        </div>

        <!-- Botones: footer fijo en móvil (fuera del scroll) -->
        <div class="product-modal-footer-actions">
          <button class="btn-add-cart" id="product-modal-add-cart-m">
            <i class="fas fa-shopping-cart"></i>
            Agregar al Carrito
          </button>
          <button class="btn-buy-now" id="product-modal-buy-now-m">
            <i class="fas fa-bolt"></i>
            Comprar Ahora
          </button>
          <button class="btn-whatsapp" id="product-modal-whatsapp-m">
            <i class="fab fa-whatsapp"></i>
            WhatsApp
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.modal);
  }

  setupEventListeners() {
    const closeBtn = this.modal.querySelector('.product-modal-close');
    closeBtn.addEventListener('click', () => this.close());
    
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Desktop buttons
    this.modal.querySelector('#product-modal-add-cart').addEventListener('click', () => this.addToCart());
    this.modal.querySelector('#product-modal-buy-now').addEventListener('click', () => this.buyNow());
    this.modal.querySelector('#product-modal-whatsapp').addEventListener('click', () => this.contactWhatsApp());

    // Mobile footer buttons (misma acción)
    this.modal.querySelector('#product-modal-add-cart-m').addEventListener('click', () => this.addToCart());
    this.modal.querySelector('#product-modal-buy-now-m').addEventListener('click', () => this.buyNow());
    this.modal.querySelector('#product-modal-whatsapp-m').addEventListener('click', () => this.contactWhatsApp());

    // Navegación de imágenes
    this.modal.querySelector('#product-modal-prev').addEventListener('click', () => this._prevImage());
    this.modal.querySelector('#product-modal-next').addEventListener('click', () => this._nextImage());

    // Flechas del teclado
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'ArrowLeft') this._prevImage();
      if (e.key === 'ArrowRight') this._nextImage();
    });
  }

  open(product) {
    if (!product || !product.id) {
      console.warn('ProductModal: producto inválido, no se puede redirigir a página de detalle');
      return;
    }
    // Redirigir a la página dedicada de producto en lugar del modal
    const url = `producto.html?id=${encodeURIComponent(product.id)}`;
    try {
      window.location.assign(url);
    } catch (_) {
      window.location.href = url;
    }
  }

  close() {
    const activeElement = document.activeElement;
    if (activeElement && this.modal.contains(activeElement)) {
      activeElement.blur();
    }

    this.modal.classList.remove('active');
    this.modal.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
    
    // Restaurar scroll del body
    document.body.style.overflow = '';
    
    // Tracking
    if (this.currentProduct) {
      this.trackEvent('product_modal_closed', {
        product_id: this.currentProduct.id
      });
    }
    
    this.currentProduct = null;

    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      this.lastFocusedElement.focus();
    }
    this.lastFocusedElement = null;
  }

  populateModal(product) {
    const images = Array.isArray(product.images) && product.images.length
      ? product.images
      : (product.image ? [product.image] : []);

    this._currentImageIndex = 0;
    this._modalImages = images;

    const img = this.modal.querySelector('#product-modal-img');
    img.src = '';
    img.alt = product.name;

    this._renderThumbs();
    this._loadModalImage(this._currentImageIndex, product);

    const badge = this.modal.querySelector('#product-modal-badge');
    if (product.badge) {
      badge.textContent = product.badge;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }

    // Título
    this.modal.querySelector('#product-modal-title').textContent = product.name;

    // Rating
    this.populateRating(product);

    // Precio
    this.populatePrice(product);

    // Descripción
    this.modal.querySelector('#product-modal-desc').textContent = product.description || '';

    // Especificaciones
    this.populateSpecs(product);

    // Stock
    this.populateStock(product);
  }

  populateRating(product) {
    const starsContainer = this.modal.querySelector('#product-modal-stars');
    const ratingText = this.modal.querySelector('#product-modal-rating-text');
    
    if (product.rating && product.reviews) {
      // Crear estrellas usando utilidad compartida
      starsContainer.innerHTML = Formatters.generateStars(product.rating);
      ratingText.textContent = `${product.rating} (${product.reviews} reseñas)`;
    } else {
      starsContainer.style.display = 'none';
      ratingText.style.display = 'none';
    }
  }

  populatePrice(product) {
    const currentPrice = this.modal.querySelector('#product-modal-price');
    const originalPrice = this.modal.querySelector('#product-modal-original-price');
    const discount = this.modal.querySelector('#product-modal-discount');
    
    // Formatear precio
    const formattedPrice = this.formatPrice(product.price);
    currentPrice.textContent = formattedPrice;
    
    if (product.originalPrice) {
      const formattedOriginalPrice = this.formatPrice(product.originalPrice);
      originalPrice.textContent = formattedOriginalPrice;
      originalPrice.style.display = 'inline';
      
      // Calcular descuento
      const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      discount.textContent = `-${discountPercent}%`;
      discount.style.display = 'inline';
    } else {
      originalPrice.style.display = 'none';
      discount.style.display = 'none';
    }
  }

  populateSpecs(product) {
    const specsGrid = this.modal.querySelector('#product-modal-specs-grid');
    specsGrid.innerHTML = '';
    
    if (product.specifications) {
      Object.entries(product.specifications).forEach(([key, value]) => {
        const specItem = document.createElement('div');
        specItem.className = 'spec-item';
        specItem.innerHTML = `
          <span class="spec-label">${Helpers.escapeHtml(this.capitalizeFirst(key))}:</span>
          <span class="spec-value">${Helpers.escapeHtml(value)}</span>
        `;
        specsGrid.appendChild(specItem);
      });
    }
  }

  populateStock(product) {
    const stockText = this.modal.querySelector('#product-modal-stock-text');
    
    if (product.stock !== undefined) {
      if (product.stock > 10) {
        stockText.innerHTML = '<span class="stock-available">En stock</span>';
      } else if (product.stock > 0) {
        stockText.innerHTML = `<span class="stock-low">Quedan ${product.stock} unidades</span>`;
      } else {
        stockText.innerHTML = '<span class="stock-out">Agotado</span>';
      }
    } else {
      stockText.innerHTML = '<span class="stock-available">Disponible</span>';
    }
  }

  _renderThumbs() {
    const thumbsContainer = this.modal.querySelector('#product-modal-thumbs');
    if (!thumbsContainer) return;
    const currentIdx = this._currentImageIndex ?? 0;
    thumbsContainer.innerHTML = this._modalImages.map((src, i) => `
      <img src="${Helpers.sanitizeUrl(src, 'https://placehold.co/80x80?text=?')}"
           alt="Miniatura ${i + 1}"
           class="product-modal-thumb ${i === currentIdx ? 'active' : ''}"
           loading="lazy"
           onerror="this.src='https://placehold.co/80x80?text=?'"
           data-idx="${i}">
    `).join('');
    thumbsContainer.querySelectorAll('.product-modal-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        this._currentImageIndex = parseInt(thumb.dataset.idx);
        this._renderThumbs();
        this._loadModalImage(this._currentImageIndex, this.currentProduct);
      });
    });
  }

  _loadModalImage(index, product) {
    const img = this.modal.querySelector('#product-modal-img');
    const src = this._modalImages[index] || '';
    const fallbackSrc = `https://placehold.co/400x400/1a1a1a/d4a843?text=${encodeURIComponent(product.name)}`;
    const originalSrc = Helpers.sanitizeUrl(src, fallbackSrc);
    const canProcess = window.imageProcessor?.processImageForCatalog;

    img.src = '';
    img.alt = product.name;

    if (canProcess) {
      window.imageProcessor.processImageForCatalog(originalSrc, { outputSize: 700 })
        .then((processedSrc) => {
          const stillSameProduct = this.currentProduct && this.currentProduct.id === product.id
            && this._currentImageIndex === index;
          if (stillSameProduct) img.src = processedSrc || originalSrc;
        })
        .catch(() => {
          const stillSameProduct = this.currentProduct && this.currentProduct.id === product.id
            && this._currentImageIndex === index;
          if (stillSameProduct) img.src = fallbackSrc;
        });
    } else {
      const tempImg = new Image();
      tempImg.onload = () => { img.src = originalSrc; };
      tempImg.onerror = () => { img.src = fallbackSrc; };
      tempImg.src = originalSrc;
    }
  }

  _prevImage() {
    if (!this._modalImages || this._modalImages.length <= 1) return;
    this._currentImageIndex = (this._currentImageIndex - 1 + this._modalImages.length) % this._modalImages.length;
    this._renderThumbs();
    this._loadModalImage(this._currentImageIndex, this.currentProduct);
  }

  _nextImage() {
    if (!this._modalImages || this._modalImages.length <= 1) return;
    this._currentImageIndex = (this._currentImageIndex + 1) % this._modalImages.length;
    this._renderThumbs();
    this._loadModalImage(this._currentImageIndex, this.currentProduct);
  }

  // Acciones de botones
  addToCart() {
    if (!this.currentProduct) return;
    
    if (window.cartService) {
      window.cartService.add(this.currentProduct);
    } else {
      notificationService.success('Producto agregado al carrito');
    }
    
    this.trackEvent('add_to_cart', {
      product_id: this.currentProduct.id,
      product_name: this.currentProduct.name,
      product_price: this.currentProduct.price
    });
  }

  buyNow() {
    if (!this.currentProduct) return;

    if (window.cartService && window.checkoutModal) {
      const existing = window.cartService.items.find(i => i.id === this.currentProduct.id);
      if (!existing) {
        window.cartService.items.push({ ...this.currentProduct, qty: 1 });
      } else {
        existing.qty += 1;
      }
      window.cartService.save();
      window.cartService.updateBadge();
      window.checkoutModal.open(window.cartService.items, window.cartService.getTotal());
    } else {
      const footer = window.siteData?.getSection?.('footer') || {};
      const phone = String(footer.whatsapp || footer.phone || '+573012345678').replace(/\D/g, '');
      const message = [
        'Hola, quiero comprar este producto en Punto Digital:',
        '',
        `${this.currentProduct.name}`,
        `Precio: ${this.formatPrice(this.currentProduct.price)}`,
        '',
        'Quedo atento para confirmar disponibilidad y entrega.'
      ].join('\n');

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
      this.showNotification('Compra abierta en WhatsApp', 'success');
    }

    this.trackEvent('buy_now_clicked', {
      product_id: this.currentProduct.id,
      product_name: this.currentProduct.name,
      product_price: this.currentProduct.price
    });
  }

  contactWhatsApp() {
    if (!this.currentProduct) return;
    
    const message = `Hola! Me interesa el ${this.currentProduct.name} por ${this.formatPrice(this.currentProduct.price)}. ¿Podrías darme más información?`;
    const footer = window.siteData?.getSection?.('footer') || {};
    const phone = String(footer.whatsapp || footer.phone || '+573012345678').replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Tracking
    this.trackEvent('whatsapp_contact', {
      product_id: this.currentProduct.id,
      product_name: this.currentProduct.name
    });
  }

  // Utilidades
  formatPrice(price) {
    return Formatters.formatPrice(price);
  }

  capitalizeFirst(str) {
    return Formatters.capitalizeFirst(str);
  }

  showNotification(message, type = 'info') {
    return notificationService.show(message, type);
  }

  trackEvent(eventName, data = {}) {
    if (window.seoManager) {
      window.seoManager.trackEvent(eventName, data);
    }
  }

  // API pública
  openProduct(productId) {
    const allProducts = window.siteData?.getData().products || [];
    let product = allProducts.find(p => p.id === productId);

    // Fallback: buscar en el catálogo si está disponible
    if (!product && window.catalog) {
      product = window.catalog.allProducts?.find(p => p.id === productId);
    }

    if (product) {
      this.open(product);
    } else {
      console.warn('ProductModal: producto no encontrado', productId);
    }
  }

  /**
   * Abre el modal pasando el objeto producto directamente (sin búsqueda por ID)
   */
  openProductObject(product) {
    if (product) this.open(product);
  }
}

// CSS para el modal
const modalCSS = `
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

.product-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  padding: 24px;
}

.product-modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.product-modal {
  background: var(--black-card);
  border-radius: 20px;
  max-width: 1150px;
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  transform: scale(0.92);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(212, 168, 67, 0.25);
  box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,168,67,0.08);
}

.product-modal-overlay.active .product-modal {
  transform: scale(1);
}

/* Scrollbar personalizado */
.product-modal::-webkit-scrollbar {
  width: 8px;
}
.product-modal::-webkit-scrollbar-track {
  background: transparent;
}
.product-modal::-webkit-scrollbar-thumb {
  background: rgba(212,168,67,0.3);
  border-radius: 4px;
}
.product-modal::-webkit-scrollbar-thumb:hover {
  background: rgba(212,168,67,0.5);
}

.product-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  z-index: 20;
  transition: all 0.25s ease;
}

.product-modal-close:hover {
  background: var(--gold-primary);
  color: var(--black-bg);
  transform: rotate(90deg) scale(1.08);
  border-color: var(--gold-primary);
}

.product-modal-content {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 0;
  min-height: 600px;
}

/* ===== GALERÍA (columna izquierda) ===== */
.product-modal-gallery {
  display: flex;
  gap: 16px;
  padding: 32px 24px 32px 32px;
  background: linear-gradient(180deg, rgba(212,168,67,0.04) 0%, transparent 100%);
  border-right: 1px solid rgba(255,255,255,0.05);
}

/* Miniaturas verticales */
.product-modal-thumbs--vertical {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 0;
  flex-shrink: 0;
}

.product-modal-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  opacity: 0.55;
  transition: all 0.25s ease;
  background: var(--black-light, #1a1a1a);
  flex-shrink: 0;
}

.product-modal-thumb:hover {
  opacity: 0.85;
  transform: translateY(-2px);
}

.product-modal-thumb.active {
  border-color: var(--gold-primary);
  opacity: 1;
  box-shadow: 0 0 0 3px rgba(212,168,67,0.15);
}

.product-modal-image-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.product-modal-image {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, var(--product-bg-start, #111) 0%, var(--product-bg-end, #1a1408) 50%, var(--product-bg-start, #111) 100%);
  border-radius: 16px;
  overflow: hidden;
  min-height: 420px;
  padding: 24px;
  box-shadow: inset 0 0 60px rgba(0,0,0,0.4);
}

.product-modal-image img {
  width: 100%;
  height: 100%;
  max-height: 460px;
  object-fit: contain;
  transition: transform 0.4s ease;
  filter:
    drop-shadow(0 0 2px rgba(212,168,67,0.18))
    drop-shadow(0 6px 18px rgba(0,0,0,0.45));
  -webkit-mask-image: -webkit-radial-gradient(white, black);
          mask-image: radial-gradient(white, black);
}

.product-modal-image:hover img {
  transform: scale(1.035);
  filter:
    drop-shadow(0 0 4px rgba(212,168,67,0.28))
    drop-shadow(0 10px 26px rgba(0,0,0,0.55));
}

.product-modal-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--text-white);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  z-index: 5;
  transition: all 0.25s ease;
}

.product-modal-nav:hover {
  background: var(--gold-primary);
  color: var(--black-bg);
  transform: translateY(-50%) scale(1.12);
  border-color: var(--gold-primary);
}

.product-modal-nav--prev { left: 14px; }
.product-modal-nav--next { right: 14px; }

.product-modal-badge {
  position: absolute;
  top: 18px;
  left: 18px;
  background: linear-gradient(135deg, var(--gold-primary) 0%, #e8c064 100%);
  color: var(--black-bg);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(212,168,67,0.4);
  z-index: 6;
}

/* ===== INFORMACIÓN (columna derecha) ===== */
.product-modal-info {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 32px 32px 32px 24px;
}

.product-modal-header {
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.product-modal-header h2 {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-white);
  margin-bottom: 12px;
  line-height: 1.25;
  letter-spacing: -0.3px;
}

.product-modal-rating {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stars {
  display: flex;
  gap: 2px;
}

.stars i {
  color: var(--gold-primary);
  font-size: 14px;
}

.rating-text {
  color: var(--text-gray);
  font-size: 13px;
}

/* Bloque de precio */
.product-modal-price {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
  padding: 18px 20px;
  background: linear-gradient(135deg, rgba(212,168,67,0.08) 0%, rgba(212,168,67,0.02) 100%);
  border-radius: 14px;
  border: 1px solid rgba(212,168,67,0.12);
  margin-bottom: 20px;
}

.current-price {
  font-size: 30px;
  font-weight: 800;
  color: var(--gold-primary);
  letter-spacing: -0.5px;
}

.original-price {
  font-size: 17px;
  color: var(--text-gray);
  text-decoration: line-through;
  opacity: 0.8;
}

.discount {
  background: linear-gradient(135deg, #dc3545 0%, #a71d2a 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

/* Descripción */
.product-modal-description {
  margin-bottom: 20px;
}

.product-modal-description p {
  color: var(--text-gray, #b0b0b0);
  line-height: 1.7;
  font-size: 14px;
}

/* Especificaciones */
.product-modal-specs {
  margin-bottom: 20px;
}

.product-modal-specs h3 {
  color: var(--text-white);
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--gold-primary);
  opacity: 0.9;
}

.specs-grid {
  display: grid;
  gap: 0;
  background: rgba(255,255,255,0.02);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.05);
}

.spec-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.spec-item:last-child {
  border-bottom: none;
}

.spec-label {
  color: var(--text-gray);
  font-weight: 500;
  font-size: 13px;
  opacity: 0.85;
}

.spec-value {
  color: var(--text-white);
  font-size: 13px;
  line-height: 1.5;
}

/* Stock */
.product-modal-stock {
  margin-bottom: 24px;
}

.stock-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid rgba(255,255,255,0.06);
}

.stock-info i { font-size: 12px; }

.stock-available { color: #28a745; font-weight: 600; }
.stock-low { color: #ffc107; font-weight: 600; }
.stock-out { color: #dc3545; font-weight: 600; }

/* Botones desktop */
.product-modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
  padding-top: 8px;
}

.product-modal-actions button {
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  letter-spacing: 0.2px;
}

.btn-add-cart {
  background: linear-gradient(135deg, var(--gold-primary) 0%, #c59737 100%);
  color: var(--black-bg);
  box-shadow: 0 4px 14px rgba(212,168,67,0.25);
}

.btn-add-cart:hover {
  background: linear-gradient(135deg, #e8c064 0%, var(--gold-primary) 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(212,168,67,0.35);
}

.btn-buy-now {
  background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(40,167,69,0.25);
}

.btn-buy-now:hover {
  background: linear-gradient(135deg, #32c558 0%, #28a745 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(40,167,69,0.35);
}

.btn-whatsapp {
  background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(37,211,102,0.25);
}

.btn-whatsapp:hover {
  background: linear-gradient(135deg, #34e07a 0%, #25d366 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(37,211,102,0.35);
}

/* Footer de botones móvil — oculto en desktop */
.product-modal-footer-actions {
  display: none;
}

/* ================================
   RESPONSIVE: Tablet (769-1024px)
   ================================ */
@media (max-width: 1024px) {
  .product-modal {
    max-width: 95vw;
  }
  
  .product-modal-content {
    grid-template-columns: 1fr 1fr;
    min-height: auto;
  }
  
  .product-modal-gallery {
    padding: 24px 16px 24px 24px;
  }
  
  .product-modal-info {
    padding: 24px 24px 24px 16px;
  }
  
  .product-modal-image {
    min-height: 340px;
    padding: 20px;
  }
  
  .product-modal-image img {
    max-height: 360px;
    filter:
      drop-shadow(0 0 2px rgba(212,168,67,0.15))
      drop-shadow(0 4px 14px rgba(0,0,0,0.45));
  }
  
  .product-modal-thumb {
    width: 60px;
    height: 60px;
  }
  
  .product-modal-header h2 {
    font-size: 22px;
  }
  
  .current-price {
    font-size: 26px;
  }
}

/* ================================
   RESPONSIVE: Mobile <= 768px
   ================================ */
@media (max-width: 768px) {
  .product-modal-overlay {
    padding: 0;
    align-items: flex-end;
    background: rgba(0, 0, 0, 0.92);
  }

  .product-modal {
    border-radius: 22px 22px 0 0;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    max-width: 100%;
    box-shadow: 0 -20px 60px rgba(0,0,0,0.6);
  }

  .product-modal-content {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 0;
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    min-height: auto;
  }

  /* Galería en móvil: miniaturas arriba horizontal */
  .product-modal-gallery {
    flex-direction: column-reverse;
    gap: 12px;
    padding: 20px 16px 16px;
    border-right: none;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .product-modal-thumbs--vertical {
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .product-modal-thumb {
    width: 62px;
    height: 62px;
    border-radius: 10px;
  }

  .product-modal-image-wrapper {
    width: 100%;
  }

  .product-modal-image {
    min-height: 240px;
    padding: 18px;
    border-radius: 14px;
  }

  .product-modal-image img {
    max-height: 260px;
    filter:
      drop-shadow(0 0 1px rgba(212,168,67,0.15))
      drop-shadow(0 3px 10px rgba(0,0,0,0.45));
  }

  .product-modal-nav {
    width: 36px;
    height: 36px;
    font-size: 13px;
  }
  .product-modal-nav--prev { left: 10px; }
  .product-modal-nav--next { right: 10px; }

  /* Info móvil */
  .product-modal-info {
    padding: 18px 16px 16px;
    gap: 0;
  }

  .product-modal-header {
    padding-bottom: 14px;
    margin-bottom: 14px;
  }

  .product-modal-header h2 {
    font-size: 19px;
    margin-bottom: 8px;
  }

  .product-modal-price {
    padding: 14px 16px;
    margin-bottom: 16px;
    gap: 12px;
  }

  .current-price {
    font-size: 24px;
  }

  .original-price {
    font-size: 15px;
  }

  .product-modal-description {
    margin-bottom: 16px;
  }

  .product-modal-description p {
    font-size: 13.5px;
    line-height: 1.65;
  }

  .product-modal-specs {
    margin-bottom: 16px;
  }

  .product-modal-specs h3 {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .spec-item {
    grid-template-columns: 110px 1fr;
    padding: 10px 14px;
    gap: 8px;
  }

  .spec-label,
  .spec-value {
    font-size: 12.5px;
  }

  .product-modal-stock {
    margin-bottom: 18px;
  }

  .stock-info {
    padding: 7px 12px;
    font-size: 12.5px;
  }

  /* Ocultar botones dentro del scroll en móvil */
  .product-modal-actions--desktop {
    display: none !important;
  }

  /* Footer fijo con los 3 botones — siempre visible */
  .product-modal-footer-actions {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 14px 16px calc(18px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid rgba(255,255,255,0.08);
    background: var(--black-card);
    flex-shrink: 0;
    box-shadow: 0 -10px 30px rgba(0,0,0,0.3);
  }

  .product-modal-footer-actions button {
    width: 100%;
    padding: 14px 16px;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: var(--font-family);
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
  .product-modal-footer-actions button:active {
    opacity: 0.85;
    transform: scale(0.98);
  }
  .product-modal-footer-actions .btn-add-cart  {
    background: linear-gradient(135deg, var(--gold-primary) 0%, #c59737 100%);
    color: var(--black-bg);
  }
  .product-modal-footer-actions .btn-buy-now   {
    background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
    color: white;
  }
  .product-modal-footer-actions .btn-whatsapp  {
    background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
    color: white;
  }
}

/* ================================
   EXTRA SMALL: <= 480px
   ================================ */
@media (max-width: 480px) {
  .product-modal-gallery {
    padding: 16px 12px 12px;
    gap: 10px;
  }

  .product-modal-image {
    min-height: 200px;
    padding: 14px;
    border-radius: 12px;
  }

  .product-modal-image img {
    max-height: 220px;
    filter:
      drop-shadow(0 0 1px rgba(212,168,67,0.12))
      drop-shadow(0 2px 8px rgba(0,0,0,0.45));
  }

  .product-modal-thumb {
    width: 52px;
    height: 52px;
    border-radius: 8px;
  }

  .product-modal-info {
    padding: 14px 14px 12px;
  }

  .product-modal-header h2 {
    font-size: 17px;
  }

  .product-modal-price {
    padding: 12px 14px;
    margin-bottom: 14px;
  }

  .current-price {
    font-size: 21px;
  }

  .original-price {
    font-size: 14px;
  }

  .product-modal-description p {
    font-size: 13px;
  }

  .spec-item {
    grid-template-columns: 1fr;
    gap: 2px;
    padding: 9px 12px;
  }

  .spec-label {
    opacity: 0.7;
    font-size: 11.5px;
  }

  .spec-value {
    font-size: 12.5px;
  }

  .product-modal-close {
    width: 38px;
    height: 38px;
    font-size: 16px;
    top: 12px;
    right: 12px;
  }

  .product-modal-badge {
    top: 14px;
    left: 14px;
    padding: 5px 11px;
    font-size: 10px;
  }

  .product-modal-footer-actions {
    padding: 12px 14px calc(16px + env(safe-area-inset-bottom, 0px));
    gap: 8px;
  }

  .product-modal-footer-actions button {
    padding: 13px 14px;
    font-size: 13px;
    border-radius: 11px;
  }
}
`;

// Inyectar CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = modalCSS;
document.head.appendChild(styleSheet);

// Crear instancia global
window.productModal = new ProductModal();

// Exportar para uso en módulos
window.ProductModal = ProductModal;
