/**
 * Página de detalle de producto
 * Carga desde URL ?id=, renderiza galería + info + especificaciones categorizadas
 */
class ProductPage {
  constructor() {
    this.currentProduct = null;
    this._currentImageIndex = 0;
    this._images = [];
    this._boot();
  }

  async _boot() {
    const siteReady = () => {
      this.renderFooter();
      this.loadProduct();
    };

    if (window.siteData && window.siteData.getData) {
      siteReady();
    } else {
      window.addEventListener('siteDataReady', siteReady, { once: true });
    }

    this.setupKeyboard();
  }

  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (!this.currentProduct) return;
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowLeft') this._prevImage();
      if (e.key === 'ArrowRight') this._nextImage();
    });
  }

  getProductIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  loadProduct() {
    const id = this.getProductIdFromURL();
    if (!id) { this.showError(); return; }

    const allProducts =
      (window.siteData?.getSection?.('products')) ||
      (window.siteData?.getData?.()?.products) ||
      [];

    const product = allProducts.find(p => p.id === id);
    if (!product) {
      // fallback: buscar después de siteDataReady por si las promesas tardan
      const onReady = () => {
        const list =
          (window.siteData?.getSection?.('products')) ||
          (window.siteData?.getData?.()?.products) ||
          [];
        const p = list.find(x => x.id === id);
        if (p) { this.render(p); } else { this.showError(); }
      };
      if (window.siteData) onReady();
      else window.addEventListener('siteDataReady', onReady, { once: true });
      return;
    }
    this.render(product);
  }

  showError() {
    document.getElementById('ppLoading').style.display = 'none';
    document.getElementById('ppContainer').style.display = 'none';
    document.getElementById('ppError').style.display = 'block';
    document.getElementById('ppMobileActions').style.display = 'none';
  }

  render(product) {
    this.currentProduct = product;

    // Imágenes
    this._images = Array.isArray(product.images) && product.images.length
      ? product.images
      : (product.image ? [product.image] : []);
    this._currentImageIndex = 0;

    // Breadcrumb + SEO
    document.title = `${product.name} | Punto Digital`;
    document.getElementById('ppBreadcrumbProduct').textContent = product.name;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', product.name);
    document.querySelector('meta[name="description"]')?.setAttribute('content', product.description || '');

    // Info principal
    document.getElementById('ppTitle').textContent = product.name;
    document.getElementById('ppBrand').textContent = product.brand || 'Punto Digital';
    document.getElementById('ppDescription').textContent = product.description || 'Sin descripción disponible.';

    // Badge
    const badge = document.getElementById('ppBadge');
    if (product.badge) {
      badge.textContent = product.badge;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }

    // Rating
    this.renderRating(product);

    // Precios
    this.renderPrice(product);

    // Stock
    this.renderStock(product);

    // Galería
    this.renderGallery();

    // Especificaciones categorizadas
    this.renderSpecifications(product);

    // Contenido de la caja
    this.renderBoxContent(product);

    // Garantía
    const warranty = product.techSpecs?.garantia || product.specifications?.garantia || '1 año fabricante';
    document.getElementById('ppWarrantyText').textContent = warranty;
    document.getElementById('ppPolicyWarranty').textContent = `${warranty} contra defectos de fábrica. Aplican términos y condiciones.`;

    // Ocultar loading, mostrar contenedor
    document.getElementById('ppLoading').style.display = 'none';
    document.getElementById('ppContainer').style.display = 'block';

    // Limpiar inline style para que CSS media query controle la visibilidad
    document.getElementById('ppMobileActions').style.display = '';

    // Setup event listeners de botones
    this.setupActionButtons();

    // Tracking
    this.trackEvent('product_page_viewed', {
      product_id: product.id,
      product_name: product.name,
      product_price: product.price
    });
  }

  renderRating(product) {
    const wrap = document.getElementById('ppRatingWrap');
    const stars = document.getElementById('ppStars');
    const text = document.getElementById('ppRatingText');

    if (product.rating) {
      wrap.style.display = 'flex';
      stars.innerHTML = Formatters.generateStars(product.rating);
      const count = product.reviews || 0;
      text.textContent = `${product.rating} · ${count} reseña${count === 1 ? '' : 's'}`;
    } else {
      wrap.style.display = 'none';
    }
  }

  renderPrice(product) {
    const price = typeof product.price === 'string' ? parseInt(product.price) : product.price;
    document.getElementById('ppPrice').textContent = Formatters.formatPrice(price);

    const original = document.getElementById('ppOriginalPrice');
    const discount = document.getElementById('ppDiscount');

    if (product.originalPrice) {
      const orig = typeof product.originalPrice === 'string' ? parseInt(product.originalPrice) : product.originalPrice;
      original.textContent = Formatters.formatPrice(orig);
      original.style.display = 'inline';
      const pct = Math.round(((orig - price) / orig) * 100);
      discount.textContent = `-${pct}%`;
      discount.style.display = 'inline';
    } else {
      original.style.display = 'none';
      discount.style.display = 'none';
    }
  }

  renderStock(product) {
    const el = document.getElementById('ppStockText');
    const stock = product.stock;
    if (stock === undefined || stock === null) {
      el.innerHTML = '<span class="stock-available">Disponible · Envío inmediato</span>';
      return;
    }
    if (stock > 10) {
      el.innerHTML = `<span class="stock-available">En stock · ${stock} unidades disponibles</span>`;
    } else if (stock > 0) {
      el.innerHTML = `<span class="stock-low">¡Últimas unidades! Quedan ${stock} en existencia</span>`;
    } else {
      el.innerHTML = '<span class="stock-out">Agotado · Consulta disponibilidad por WhatsApp</span>';
    }
  }

  renderGallery() {
    const mainImg = document.getElementById('ppMainImage');
    const galleryMain = document.querySelector('.pp-gallery__main');

    // Cursor zoom para indicar que se puede hacer click
    if (mainImg) {
      mainImg.style.cursor = 'zoom-in';
    }

    // Click en imagen principal para abrir lightbox con zoom
    if (galleryMain) {
      galleryMain.addEventListener('click', (e) => {
        // No abrir si se hizo click en los botones de navegación
        if (e.target.closest('.pp-gallery__nav')) return;
        if (!this.currentProduct) return;

        const images = ImageLightbox.extractImages(this.currentProduct);
        if (images.length && window.imageLightbox) {
          window.imageLightbox.open(images, this._currentImageIndex, this.currentProduct.name);
        }
      });
    }

    this._loadMainImage(mainImg);
    this._renderThumbs();
    document.getElementById('ppNavPrev').addEventListener('click', () => this._prevImage());
    document.getElementById('ppNavNext').addEventListener('click', () => this._nextImage());
  }

  _renderThumbs() {
    const container = document.getElementById('ppThumbs');
    if (!container) return;
    const idx = this._currentImageIndex;
    container.innerHTML = this._images.map((src, i) => `
      <button type="button" class="pp-thumb ${i === idx ? 'active' : ''}"
              data-idx="${i}" role="option" aria-selected="${i === idx}"
              aria-label="Ver imagen ${i + 1}">
        <img src="${Helpers.sanitizeUrl(src, 'https://placehold.co/80x80?text=?')}"
             alt="Miniatura ${i + 1}"
             loading="lazy"
             onerror="this.src='https://placehold.co/80x80?text=?'">
      </button>
    `).join('');
    container.querySelectorAll('.pp-thumb').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.idx, 10);
        this._currentImageIndex = i;
        this._renderThumbs();
        const mainImg = document.getElementById('ppMainImage');
        this._loadMainImage(mainImg);
      });
    });
  }

  _loadMainImage(mainImg) {
    const product = this.currentProduct;
    const src = this._images[this._currentImageIndex] || '';
    const fallback = `https://placehold.co/700x700/1a1a1a/d4a843?text=${encodeURIComponent(product.name)}`;
    const originalSrc = Helpers.sanitizeUrl(src, fallback);

    mainImg.alt = `${product.name} - Imagen ${this._currentImageIndex + 1}`;
    mainImg.src = '';

    if (window.imageProcessor?.processImageForCatalog) {
      window.imageProcessor.processImageForCatalog(originalSrc, { outputSize: 1920 })
        .then(processed => {
          if (this.currentProduct?.id === product.id) {
            mainImg.src = processed || originalSrc;
          }
        })
        .catch(() => {
          if (this.currentProduct?.id === product.id) mainImg.src = fallback;
        });
    } else {
      const tmp = new Image();
      tmp.onload = () => { mainImg.src = originalSrc; };
      tmp.onerror = () => { mainImg.src = fallback; };
      tmp.src = originalSrc;
    }
  }

  _prevImage() {
    if (this._images.length <= 1) return;
    this._currentImageIndex = (this._currentImageIndex - 1 + this._images.length) % this._images.length;
    this._renderThumbs();
    this._loadMainImage(document.getElementById('ppMainImage'));
  }

  _nextImage() {
    if (this._images.length <= 1) return;
    this._currentImageIndex = (this._currentImageIndex + 1) % this._images.length;
    this._renderThumbs();
    this._loadMainImage(document.getElementById('ppMainImage'));
  }

  /**
   * Especificaciones agrupadas por categorías lógicas.
   * Prioriza techSpecs (nueva estructura), hace fallback a specifications (flat)
   */
  renderSpecifications(product) {
    const body = document.getElementById('ppSpecsBody');
    body.innerHTML = '';

    // Categorías conocidas con su ícono + label
    const CATEGORIES = [
      { key: 'pantalla',     label: 'Pantalla',          icon: 'fa-display' },
      { key: 'rendimiento',  label: 'Rendimiento',       icon: 'fa-microchip' },
      { key: 'memoria',      label: 'Memoria y Almacenamiento', icon: 'fa-sd-card' },
      { key: 'camara',       label: 'Cámara',            icon: 'fa-camera-retro' },
      { key: 'bateria',      label: 'Batería y Carga',   icon: 'fa-battery-full' },
      { key: 'conectividad', label: 'Conectividad',      icon: 'fa-wifi' },
      { key: 'diseno',       label: 'Diseño y Dimensiones', icon: 'fa-ruler-combined' },
      { key: 'software',     label: 'Software',          icon: 'fa-code' },
      { key: 'audio',        label: 'Audio',             icon: 'fa-headphones-alt' },
      { key: 'seguridad',    label: 'Seguridad',         icon: 'fa-fingerprint' },
      { key: 'otros',        label: 'Otras Características', icon: 'fa-star' }
    ];

    // Recolectar datos: priorizar techSpecs
    const tech = product.techSpecs || {};
    const flat = product.specifications || {};

    // Construir categorías desde techSpecs si existe, o mapear desde specifications
    const categorized = {};

    if (Object.keys(tech).length > 0) {
      // Ya viene categorizado
      for (const cat of CATEGORIES) {
        if (tech[cat.key] && typeof tech[cat.key] === 'object' && Object.keys(tech[cat.key]).length) {
          categorized[cat.key] = tech[cat.key];
        } else if (typeof tech[cat.key] === 'string') {
          categorized[cat.key] = { [cat.key]: tech[cat.key] };
        }
      }
      // Atributos extra no categorizados
      for (const k of Object.keys(tech)) {
        if (!CATEGORIES.find(c => c.key === k)) {
          if (typeof tech[k] === 'object') {
            categorized[k] = tech[k];
          } else {
            categorized.otros = categorized.otros || {};
            categorized.otros[k] = tech[k];
          }
        }
      }
    } else {
      // Fallback: specifications flat
      const specMap = {
        pantalla: ['pantalla', 'display', 'resolucion'],
        memoria: ['almacenamiento', 'ram', 'memoria'],
        camara: ['camara', 'camara frontal', 'camara trasera', 'selfie', 'video'],
        bateria: ['bateria', 'carga', 'carga rapida', 'autonomia'],
        conectividad: ['red', 'wifi', 'bluetooth', 'nfc', 'gps', 'usb', 'conectividad'],
        diseno: ['dimensiones', 'peso', 'color', 'materiales', 'diseno'],
        rendimiento: ['procesador', 'cpu', 'gpu', 'chipset', 'rendimiento'],
        software: ['sistema operativo', 'so', 'android', 'ios', 'software'],
        audio: ['audio', 'altavoces', 'jack'],
        seguridad: ['huella', 'face id', 'reconocimiento', 'seguridad']
      };
      for (const [key, value] of Object.entries(flat)) {
        const k = String(key).toLowerCase();
        let target = 'otros';
        for (const [cat, keys] of Object.entries(specMap)) {
          if (keys.some(x => k.includes(x))) { target = cat; break; }
        }
        if (!categorized[target]) categorized[target] = {};
        categorized[target][key] = value;
      }
    }

    if (!Object.keys(categorized).length) {
      body.innerHTML = `<p style="color:var(--text-gray);font-size:14px">Sin especificaciones técnicas detalladas.</p>`;
      return;
    }

    // Renderizar por categorías en orden establecido
    for (const cat of CATEGORIES) {
      const data = categorized[cat.key];
      if (!data || !Object.keys(data).length) continue;
      body.appendChild(this._buildSpecCard(cat, data));
    }
    // Categorías extra
    for (const [key, data] of Object.entries(categorized)) {
      if (CATEGORIES.find(c => c.key === key)) continue;
      if (!data || !Object.keys(data).length) continue;
      body.appendChild(this._buildSpecCard({ key, label: Formatters.capitalizeFirst(key), icon: 'fa-info-circle' }, data));
    }
  }

  _buildSpecCard(cat, data) {
    const card = document.createElement('div');
    card.className = 'pp-spec-card';
    const rows = Object.entries(data)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(([k, v]) => `
        <div class="pp-spec-row">
          <span class="pp-spec-row__label">${Helpers.escapeHtml(Formatters.capitalizeFirst(k))}</span>
          <span class="pp-spec-row__value">${Helpers.escapeHtml(String(v))}</span>
        </div>
      `).join('');
    if (!rows) return card;
    card.innerHTML = `
      <div class="pp-spec-card__head">
        <i class="fas ${cat.icon}"></i>
        <h3>${Helpers.escapeHtml(cat.label)}</h3>
      </div>
      <div class="pp-spec-card__body">${rows}</div>
    `;
    return card;
  }

  renderBoxContent(product) {
    const section = document.getElementById('ppBoxSection');
    const list = document.getElementById('ppBoxList');
    const items = product.boxContents || product.techSpecs?.contenidoCaja || [];
    if (!Array.isArray(items) || !items.length) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';
    list.innerHTML = items.map(item => `
      <li><i class="fas fa-check-circle"></i> ${Helpers.escapeHtml(item)}</li>
    `).join('');
  }

  setupActionButtons() {
    const ids = ['ppBtnAddCart', 'ppBtnBuyNow', 'ppBtnWhatsApp',
                 'ppBtnAddCartM', 'ppBtnBuyNowM', 'ppBtnWhatsAppM'];
    const [addC, buy, wa, addCm, buym, wam] = ids.map(id => document.getElementById(id));

    const addToCart = () => this.addToCart();
    const buyNow = () => this.buyNow();
    const whatsapp = () => this.contactWhatsApp();

    addC.addEventListener('click', addToCart);
    addCm.addEventListener('click', addToCart);
    buy.addEventListener('click', buyNow);
    buym.addEventListener('click', buyNow);
    wa.addEventListener('click', whatsapp);
    wam.addEventListener('click', whatsapp);
  }

  addToCart() {
    const p = this.currentProduct;
    if (!p) return;
    if (window.cartService) {
      window.cartService.add(p);
    } else {
      notificationService.success('Producto agregado al carrito');
    }
    this.trackEvent('add_to_cart_from_product_page', {
      product_id: p.id, product_name: p.name, product_price: p.price
    });
  }

  buyNow() {
    const p = this.currentProduct;
    if (!p) return;

    if (window.cartService && window.checkoutModal) {
      const existing = window.cartService.items.find(i => i.id === p.id);
      if (!existing) window.cartService.items.push({ ...p, qty: 1 });
      else existing.qty += 1;
      window.cartService.save();
      window.cartService.updateBadge();
      window.checkoutModal.open(window.cartService.items, window.cartService.getTotal());
    } else {
      const footer = window.siteData?.getSection?.('footer') || {};
      const phone = Helpers.phoneToWhatsappNumber(footer.whatsapp || footer.phone || '+57 301 7059737');
      const price = typeof p.price === 'string' ? parseInt(p.price) : p.price;
      const msg = [
        'Hola! Quiero comprar este producto en Punto Digital:',
        '',
        `*${p.name}*`,
        `Precio: ${Formatters.formatPrice(price)}`,
        '',
        'Quedo atento para confirmar disponibilidad y envío.'
      ].join('\n');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    }
    this.trackEvent('buy_now_from_product_page', {
      product_id: p.id, product_name: p.name
    });
  }

  contactWhatsApp() {
    const p = this.currentProduct;
    if (!p) return;
    const price = typeof p.price === 'string' ? parseInt(p.price) : p.price;
    const message = `Hola! Me interesa el *${p.name}* por ${Formatters.formatPrice(price)}. ¿Podrías darme más información, disponibilidad y envío a mi ciudad?`;
    const footer = window.siteData?.getSection?.('footer') || {};
    const phone = Helpers.phoneToWhatsappNumber(footer.whatsapp || footer.phone || '+57 301 7059737');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    this.trackEvent('whatsapp_from_product_page', {
      product_id: p.id, product_name: p.name
    });
  }

  renderFooter() {
    const footer = window.siteData?.getSection?.('footer');
    const social = window.siteData?.getSection?.('social');
    const whatsappUrl = Helpers.whatsappUrl(footer?.whatsapp || footer?.phone);
    this.renderFooterContact(footer);
    this.renderSocialLinks(whatsappUrl ? { ...(social || {}), whatsapp: whatsappUrl } : social);
    const slogan = window.siteData?.getSection?.('slogan') || 'Siempre Conectados';
    document.querySelectorAll('#navSloganText').forEach(el => { el.textContent = slogan; });
  }

  renderFooterContact(footerData) {
    Helpers.renderFooterContact(footerData);
  }

  renderSocialLinks(socialData) {
    const container = document.getElementById('socialLinks');
    if (!container || !socialData) return;
    const ICONS = {
      facebook: 'fab fa-facebook-f',
      instagram: 'fab fa-instagram',
      whatsapp: 'fab fa-whatsapp',
      twitter: 'fab fa-x-twitter',
      youtube: 'fab fa-youtube',
      tiktok: 'fab fa-tiktok'
    };
    container.innerHTML = Object.entries(socialData)
      .map(([platform, url]) => [platform, Helpers.sanitizeUrl(url)])
      .filter(([, url]) => url && url !== '#')
      .map(([platform, url]) => `
        <a href="${Helpers.escapeAttr(url)}" target="_blank" rel="noopener"
           aria-label="${Helpers.escapeAttr(Formatters.capitalizeFirst(platform))}"
           title="${Helpers.escapeAttr(Formatters.capitalizeFirst(platform))}">
          <i class="${ICONS[platform] || 'fas fa-link'}"></i>
        </a>
      `).join('');
  }

  trackEvent(name, data = {}) {
    if (window.seoManager) window.seoManager.trackEvent(name, data);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.productPage = new ProductPage();
});

window.ProductPage = ProductPage;
