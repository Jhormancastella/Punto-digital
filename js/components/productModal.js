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
          <div class="product-modal-image">
            <img id="product-modal-img" src="" alt="" loading="lazy">
            <div class="product-modal-badge" id="product-modal-badge"></div>
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
  }

  open(product) {
    this.lastFocusedElement = document.activeElement;
    this.currentProduct = product;
    this.populateModal(product);
    
    // Mostrar modal
    this.modal.classList.add('active');
    this.modal.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    // Focus en el modal
    setTimeout(() => {
      const closeBtn = this.modal.querySelector('.product-modal-close');
      closeBtn.focus();
    }, 100);
    
    // Tracking
    this.trackEvent('product_modal_opened', {
      product_id: product.id,
      product_name: product.name,
      product_price: product.price
    });
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
    // Imagen
    const img = this.modal.querySelector('#product-modal-img');
    img.src = '';
    img.alt = product.name;

    // Cargar imagen con fallback + procesamiento automático de fondo claro
    const fallbackSrc = `https://placehold.co/400x400/1a1a1a/d4a843?text=${encodeURIComponent(product.name)}`;
    const originalSrc = Helpers.sanitizeUrl(product.image, fallbackSrc);
    const canProcess = window.imageProcessor?.processImageForCatalog;

    if (canProcess) {
      window.imageProcessor.processImageForCatalog(originalSrc, { outputSize: 700 })
        .then((processedSrc) => {
          const stillSameProduct = this.currentProduct && this.currentProduct.id === product.id;
          if (stillSameProduct) img.src = processedSrc || originalSrc;
        })
        .catch(() => {
          const stillSameProduct = this.currentProduct && this.currentProduct.id === product.id;
          if (stillSameProduct) img.src = fallbackSrc;
        });
    } else {
      const tempImg = new Image();
      tempImg.onload = () => { img.src = originalSrc; };
      tempImg.onerror = () => { img.src = fallbackSrc; };
      tempImg.src = originalSrc;
    }

    // Badge
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

    // Tracking
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
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  padding: 20px;
}

.product-modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.product-modal {
  background: var(--black-card);
  border-radius: var(--border-radius-lg);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  transform: scale(0.9);
  transition: transform 0.3s ease;
  border: 1px solid rgba(212, 168, 67, 0.2);
}

.product-modal-overlay.active .product-modal {
  transform: scale(1);
}

.product-modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  z-index: 10;
  transition: all 0.3s ease;
}

.product-modal-close:hover {
  background: rgba(212, 168, 67, 0.8);
  transform: scale(1.1);
}

.product-modal-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  padding: 30px;
}

.product-modal-image {
  position: relative;
}

.product-modal-image img {
  width: 100%;
  height: 400px;
  object-fit: contain;
  border-radius: var(--border-radius-md);
  background: var(--product-bg, linear-gradient(135deg, #0d0d0d 0%, #2a1a00 60%, #0d0d0d 100%));
  background-size: cover;
  background-position: center;
}

.product-modal-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: var(--gold-primary);
  color: var(--black-bg);
  padding: 5px 12px;
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.product-modal-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-modal-header h2 {
  font-size: 28px;
  color: var(--text-white);
  margin-bottom: 10px;
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
  font-size: 14px;
}

.product-modal-price {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.current-price {
  font-size: 32px;
  font-weight: 700;
  color: var(--gold-primary);
}

.original-price {
  font-size: 20px;
  color: var(--text-gray);
  text-decoration: line-through;
}

.discount {
  background: #dc3545;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.product-modal-description p {
  color: var(--text-gray);
  line-height: 1.6;
  font-size: 16px;
}

.product-modal-specs h3 {
  color: var(--text-white);
  margin-bottom: 15px;
  font-size: 18px;
}

.specs-grid {
  display: grid;
  gap: 10px;
}

.spec-item {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.spec-label {
  color: var(--text-gray);
  font-weight: 500;
}

.spec-value {
  color: var(--text-white);
}

.product-modal-stock {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stock-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.stock-available { color: #28a745; }
.stock-low { color: #ffc107; }
.stock-out { color: #dc3545; }

.product-modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

.product-modal-actions button {
  padding: 12px 20px;
  border: none;
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.btn-add-cart {
  background: var(--gold-primary);
  color: var(--black-bg);
}

.btn-add-cart:hover {
  background: var(--gold-light);
  transform: translateY(-2px);
}

.btn-buy-now {
  background: #28a745;
  color: white;
}

.btn-buy-now:hover {
  background: #218838;
  transform: translateY(-2px);
}

.btn-whatsapp {
  background: #25d366;
  color: white;
}

.btn-whatsapp:hover {
  background: #128c7e;
  transform: translateY(-2px);
}

/* Footer de botones móvil — oculto en desktop */
.product-modal-footer-actions {
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .product-modal-content {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }

  .product-modal-image img {
    height: 240px;
  }

  .product-modal-header h2 {
    font-size: 20px;
  }

  .current-price { font-size: 24px; }

  .spec-item {
    grid-template-columns: 1fr;
    gap: 3px;
  }
}

@media (max-width: 480px) {
  /* Overlay sin padding — bottom sheet */
  .product-modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  /* Bottom sheet */
  .product-modal {
    border-radius: 20px 20px 0 0;
    max-height: 88vh;
    /* Flex column para separar scroll del footer */
    display: flex;
    flex-direction: column;
  }

  /* Área scrollable */
  .product-modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 14px 14px 8px;
    gap: 10px;
    /* Evitar que el scroll tape el footer */
    -webkit-overflow-scrolling: touch;
  }

  .product-modal-image img { height: 180px; }
  .product-modal-header h2 { font-size: 17px; }
  .current-price { font-size: 20px; }
  .product-modal-description p { font-size: 13px; }
  .product-modal-specs h3 { font-size: 14px; margin-bottom: 8px; }
  .spec-item { padding: 5px 0; }
  .spec-label, .spec-value { font-size: 12px; }

  /* Ocultar botones dentro del scroll en móvil */
  .product-modal-actions--desktop { display: none !important; }

  /* Footer fijo con los 3 botones — siempre visible */
  .product-modal-footer-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px 20px;
    border-top: 1px solid rgba(255,255,255,0.08);
    background: var(--black-card);
    flex-shrink: 0;
  }

  .product-modal-footer-actions button {
    width: 100%;
    padding: 13px 16px;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: var(--font-family);
    transition: opacity 0.2s ease;
  }
  .product-modal-footer-actions button:active { opacity: 0.8; }
  .product-modal-footer-actions .btn-add-cart  { background: var(--gold-primary); color: var(--black-bg); }
  .product-modal-footer-actions .btn-buy-now   { background: #28a745; color: white; }
  .product-modal-footer-actions .btn-whatsapp  { background: #25d366; color: white; }
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
