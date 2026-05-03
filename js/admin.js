/**
 * Panel de Administración — Punto Digital
 */
class AdminPanel {
  constructor() {
    this.currentSection = 'dashboard';
    this.selectedFont = 'Poppins';
    this.fonts = ['Poppins','Inter','Roboto','Montserrat','Open Sans','Lato','Nunito','Raleway','Merriweather','Playfair Display'];
    this.colorPresets = [
      { name: 'Dorado', primary: '#d4a843', light: '#f0d68a', dark: '#b89344', bg: '#d4a843' },
      { name: 'Esmeralda', primary: '#10b981', light: '#6ee7b7', dark: '#059669', bg: '#10b981' },
      { name: 'Zafiro', primary: '#3b82f6', light: '#93c5fd', dark: '#1d4ed8', bg: '#3b82f6' },
      { name: 'Rubí', primary: '#ef4444', light: '#fca5a5', dark: '#b91c1c', bg: '#ef4444' },
      { name: 'Violeta', primary: '#8b5cf6', light: '#c4b5fd', dark: '#6d28d9', bg: '#8b5cf6' },
      { name: 'Rosa', primary: '#ec4899', light: '#f9a8d4', dark: '#be185d', bg: '#ec4899' },
      { name: 'Ámbar', primary: '#f59e0b', light: '#fcd34d', dark: '#b45309', bg: '#f59e0b' },
      { name: 'Turquesa', primary: '#06b6d4', light: '#67e8f9', dark: '#0e7490', bg: '#06b6d4' },
      { name: 'Lima', primary: '#84cc16', light: '#bef264', dark: '#4d7c0f', bg: '#84cc16' },
      { name: 'Cobre', primary: '#c2410c', light: '#fdba74', dark: '#7c2d12', bg: '#c2410c' },
    ];
    this.init();
  }

  init() {
    if (!this.isAuthenticated()) { this.redirectToLogin(); return; }
    this.setupNav();
    this.setupSidebar();
    this.setupColorSync();
    this.loadAllSections();
    this.updateStats();
    window.siteData.addObserver(() => this.updateStats());
  }

  isAuthenticated() {
    return sessionStorage.getItem('adminAuthenticated') === 'true';
  }

  redirectToLogin() {
    document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:#d4a843;font-family:Poppins,sans-serif;flex-direction:column;gap:16px"><i class="fas fa-lock" style="font-size:48px"></i><p style="font-size:18px">Acceso no autorizado</p></div>`;
    setTimeout(() => window.location.href = 'index.html', 2000);
  }

  /* ── Navigation ─────────────────────────────────────────────── */
  setupNav() {
    document.querySelectorAll('.ap-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.dataset.section;
        document.querySelectorAll('.ap-nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.ap-section').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`sec-${sec}`);
        if (target) target.classList.add('active');
        this.currentSection = sec;
        if (window.innerWidth <= 900) this.closeMobileSidebar();
      });
    });
  }

  setupSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('apSidebar');
    if (!toggle || !sidebar) return;
    toggle.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        sidebar.classList.toggle('mobile-open');
      } else {
        sidebar.classList.toggle('collapsed');
      }
    });
  }

  closeMobileSidebar() {
    document.getElementById('apSidebar')?.classList.remove('mobile-open');
  }

  /* ── Stats ──────────────────────────────────────────────────── */
  updateStats() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const products = window.siteData.getSection('products') || [];
    set('stat-products', products.length);
    set('stat-featured', products.filter(p => p.featured).length);
    set('stat-categories', (window.siteData.getSection('categories') || []).length);
    const hero = window.siteData.getSection('hero');
    set('stat-images', Array.isArray(hero?.images) ? hero.images.length : 0);
  }

  /* ── Load all sections ──────────────────────────────────────── */
  loadAllSections() {
    this.loadHero();
    this.loadFeatures();
    this.loadCategories();
    this.loadProducts();
    this.loadFeatured();
    this.loadColors();
    this.loadTypography();
    this.loadFooter();
    this.loadSEO();
  }

  /* ── HERO ───────────────────────────────────────────────────── */
  loadHero() {
    const hero = window.siteData.getSection('hero') || {};
    this.setVal('heroTitle', hero.title || '');
    this.setVal('heroDesc', hero.description || '');
    this.setVal('heroBtnText', hero.buttonText || '');
    this.renderHeroImages(hero.images || []);
  }

  renderHeroImages(images) {
    const list = document.getElementById('heroImagesList');
    if (!list) return;
    if (!images.length) { list.innerHTML = '<p style="color:var(--text-dark);font-size:13px">Sin imágenes</p>'; return; }
    list.innerHTML = images.map((img, i) => `
      <div class="ap-item">
        <img src="${Helpers.sanitizeUrl(img.url, 'https://placehold.co/56x56?text=?')}" alt="${Helpers.escapeAttr(img.alt)}" class="ap-item-thumb"
             onerror="this.src='https://placehold.co/56x56?text=?'">
        <div class="ap-item-info">
          <strong>${Helpers.escapeHtml(img.alt || 'Imagen ' + (i+1))}</strong>
          <small>${Helpers.escapeHtml((img.url || '').substring(0,45))}…</small>
        </div>
        <div class="ap-item-actions">
          <button class="ap-item-btn ap-item-btn-edit" onclick="adminPanel.editHeroImage(${i})" title="Editar"><i class="fas fa-pen"></i></button>
          <button class="ap-item-btn ap-item-btn-del" onclick="adminPanel.deleteHeroImage(${i})" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
      </div>`).join('');
  }

  saveHero() {
    const hero = window.siteData.getSection('hero') || {};
    hero.title = this.getVal('heroTitle');
    hero.description = this.getVal('heroDesc');
    hero.buttonText = this.getVal('heroBtnText');
    window.siteData.updateSection('hero', hero);
    notificationService.success('Hero guardado correctamente');
  }

  openAddImageModal() {
    this._openImageModal('Agregar imagen al carrusel', { url: '', alt: '' }, async (url, alt) => {
      const hero = window.siteData.getSection('hero') || {};
      if (!Array.isArray(hero.images)) hero.images = [];
      hero.images.push({ url, alt });
      window.siteData.updateSection('hero', hero);
      this.loadHero();
      notificationService.success('Imagen agregada');
    });
  }

  editHeroImage(index) {
    const hero = window.siteData.getSection('hero') || {};
    const img = hero.images[index];
    if (!img) return;
    this._openImageModal('Editar imagen', img, async (url, alt) => {
      hero.images[index] = { url, alt };
      window.siteData.updateSection('hero', hero);
      this.loadHero();
      notificationService.success('Imagen actualizada');
    });
  }

  /**
   * Modal unificado para agregar/editar imágenes del hero.
   * Soporta URL y archivo. Procesa el fondo automáticamente.
   */
  _openImageModal(title, data, onSave) {
    const isEdit = !!data.url;
    this.openModal(title, `
      <div class="ap-field">
        <label>URL de la imagen</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="m-imgUrl" value="${Helpers.escapeAttr(data.url || '')}" placeholder="https://..." style="flex:1">
          <button type="button" id="m-imgProcessBtn"
                  style="padding:0 14px;background:rgba(212,168,67,0.15);border:1px solid rgba(212,168,67,0.3);
                         border-radius:8px;color:var(--gold-primary);cursor:pointer;font-size:12px;
                         font-family:var(--font-family);white-space:nowrap;transition:all 0.2s ease"
                  title="Quitar fondo blanco de la URL">
            <i class="fas fa-magic"></i> Procesar
          </button>
        </div>
        <p class="ap-hint" style="margin-top:4px">Pega la URL y haz clic en "Procesar" para quitar el fondo blanco</p>
      </div>
      <div class="ap-field">
        <label>O sube un archivo</label>
        <input type="file" id="m-imgFile" accept="image/*" style="color:var(--text-white)">
      </div>
      <div class="ap-field">
        <label>Texto alternativo</label>
        <input type="text" id="m-imgAlt" value="${Helpers.escapeAttr(data.alt || '')}" placeholder="Ej: iPhone 15 Pro">
      </div>

      <!-- Preview -->
      <div id="m-imgPreviewWrap" style="margin-top:12px;${isEdit ? '' : 'display:none'}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <p style="font-size:12px;color:var(--text-gray);margin:0">Vista previa</p>
          <span id="m-imgStatus" style="font-size:11px;color:var(--text-dark)"></span>
        </div>
        <div style="position:relative;background:var(--black-light);border-radius:10px;overflow:hidden;min-height:120px;
                    display:flex;align-items:center;justify-content:center">
          <img id="m-imgPreviewImg" src="${Helpers.sanitizeUrl(data.url, '')}"
               style="max-width:100%;max-height:220px;object-fit:contain;display:block;transition:opacity 0.3s ease">
          <div id="m-imgSpinner" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,0.5);
               align-items:center;justify-content:center;flex-direction:column;gap:8px">
            <div style="width:32px;height:32px;border:3px solid rgba(212,168,67,0.3);border-top-color:var(--gold-primary);
                        border-radius:50%;animation:spin 0.8s linear infinite"></div>
            <p style="color:var(--gold-primary);font-size:12px;margin:0">Procesando...</p>
          </div>
        </div>
      </div>

      <!-- URL procesada oculta -->
      <input type="hidden" id="m-imgProcessed" value="${Helpers.escapeAttr(data.url || '')}">
    `, async () => {
      const alt = this.getVal('m-imgAlt') || 'Imagen';
      const processed = document.getElementById('m-imgProcessed')?.value;
      if (!processed) { notificationService.error('Agrega una imagen primero'); return false; }
      await onSave(processed, alt);
    });

    // Lógica del modal después de renderizar
    setTimeout(() => {
      const urlInput    = document.getElementById('m-imgUrl');
      const fileInput   = document.getElementById('m-imgFile');
      const processBtn  = document.getElementById('m-imgProcessBtn');
      const previewWrap = document.getElementById('m-imgPreviewWrap');
      const previewImg  = document.getElementById('m-imgPreviewImg');
      const spinner     = document.getElementById('m-imgSpinner');
      const status      = document.getElementById('m-imgStatus');
      const processed   = document.getElementById('m-imgProcessed');

      const setStatus = (msg, color = 'var(--text-dark)') => {
        if (status) { status.textContent = msg; status.style.color = color; }
      };

      const showSpinner = (show) => {
        if (spinner) spinner.style.display = show ? 'flex' : 'none';
      };

      const processSource = async (src) => {
        previewWrap.style.display = 'block';
        showSpinner(true);
        setStatus('Procesando imagen...', 'var(--gold-primary)');
        try {
          const result = await window.imageProcessor.processImage(src);
          previewImg.src = result;
          processed.value = result;
          setStatus('✓ Fondo eliminado', '#22c55e');
        } catch {
          // Si falla (CORS u otro), usar la URL original
          const fallback = src instanceof File
            ? URL.createObjectURL(src)
            : src;
          previewImg.src = fallback;
          processed.value = typeof src === 'string' ? src : fallback;
          setStatus('⚠ Sin procesar (CORS)', '#f59e0b');
        } finally {
          showSpinner(false);
        }
      };

      // Botón "Procesar" para URL
      processBtn?.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (!url) { notificationService.error('Ingresa una URL primero'); return; }
        processSource(url);
      });

      // Procesar automáticamente al pegar URL (Enter o blur)
      urlInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); processBtn?.click(); }
      });

      // Archivo seleccionado — procesar automáticamente
      fileInput?.addEventListener('change', () => {
        if (fileInput.files[0]) processSource(fileInput.files[0]);
      });

      // Si es edición y ya hay imagen, mostrar preview inicial
      if (isEdit && data.url) {
        setStatus('Imagen actual', 'var(--text-dark)');
      }
    }, 80);
  }

  deleteHeroImage(index) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    const hero = window.siteData.getSection('hero') || {};
    hero.images.splice(index, 1);
    window.siteData.updateSection('hero', hero);
    this.loadHero();
    notificationService.success('Imagen eliminada');
  }

  /* ── FEATURES ───────────────────────────────────────────────── */
  loadFeatures() {
    const features = window.siteData.getSection('features') || [];
    const list = document.getElementById('featuresList');
    if (!list) return;
    list.innerHTML = features.map((f, i) => `
      <div class="ap-item">
        <div class="ap-item-thumb-icon"><i class="fas ${Helpers.escapeAttr(f.icon)}"></i></div>
        <div class="ap-item-info">
          <strong>${Helpers.escapeHtml(f.title)}</strong>
          <small>${Helpers.escapeHtml(f.desc)}</small>
        </div>
        <div class="ap-item-actions">
          <button class="ap-item-btn ap-item-btn-edit" onclick="adminPanel.editFeature(${i})"><i class="fas fa-pen"></i></button>
          <button class="ap-item-btn ap-item-btn-del" onclick="adminPanel.deleteFeature(${i})"><i class="fas fa-trash"></i></button>
        </div>
      </div>`).join('');
  }

  openAddFeatureModal(data = {}, index = -1) {
    this.openModal(index >= 0 ? 'Editar característica' : 'Nueva característica', `
      <div class="ap-field"><label>Ícono FontAwesome (ej: fa-star)</label><input type="text" id="m-fIcon" value="${Helpers.escapeAttr(data.icon || 'fa-star')}"></div>
      <div class="ap-field"><label>Título</label><input type="text" id="m-fTitle" value="${Helpers.escapeAttr(data.title || '')}"></div>
      <div class="ap-field"><label>Descripción</label><textarea id="m-fDesc" rows="2">${Helpers.escapeHtml(data.desc || '')}</textarea></div>
    `, () => {
      const item = { icon: this.getVal('m-fIcon'), title: this.getVal('m-fTitle'), desc: this.getVal('m-fDesc') };
      const features = window.siteData.getSection('features') || [];
      if (index >= 0) features[index] = item; else features.push(item);
      window.siteData.updateSection('features', features);
      this.loadFeatures();
      notificationService.success('Característica guardada');
    });
  }

  editFeature(i) { this.openAddFeatureModal((window.siteData.getSection('features') || [])[i], i); }
  deleteFeature(i) {
    if (!confirm('¿Eliminar?')) return;
    const f = window.siteData.getSection('features') || [];
    f.splice(i, 1);
    window.siteData.updateSection('features', f);
    this.loadFeatures();
    notificationService.success('Eliminado');
  }

  /* ── CATEGORIES ─────────────────────────────────────────────── */
  loadCategories() {
    const cats = window.siteData.getSection('categories') || [];
    const list = document.getElementById('categoriesList');
    if (!list) return;
    list.innerHTML = cats.map((c, i) => `
      <div class="ap-item">
        <img src="${Helpers.sanitizeUrl(c.image, 'https://placehold.co/56x56?text=?')}" class="ap-item-thumb"
             onerror="this.src='https://placehold.co/56x56?text=?'">
        <div class="ap-item-info">
          <strong>${Helpers.escapeHtml(c.name)}</strong>
          <small>${Helpers.escapeHtml(c.description || '')}</small>
        </div>
        <div class="ap-item-actions">
          <button class="ap-item-btn ap-item-btn-edit" onclick="adminPanel.editCategory(${i})"><i class="fas fa-pen"></i></button>
          <button class="ap-item-btn ap-item-btn-del" onclick="adminPanel.deleteCategory(${i})"><i class="fas fa-trash"></i></button>
        </div>
      </div>`).join('');
  }

  openAddCategoryModal(data = {}, index = -1) {
    this.openModal(index >= 0 ? 'Editar categoría' : 'Nueva categoría', `
      <div class="ap-field"><label>Nombre</label><input type="text" id="m-cName" value="${Helpers.escapeAttr(data.name || '')}"></div>
      <div class="ap-field"><label>Descripción</label><input type="text" id="m-cDesc" value="${Helpers.escapeAttr(data.description || '')}"></div>
      <div class="ap-field"><label>URL de imagen</label><input type="text" id="m-cImg" value="${Helpers.escapeAttr(data.image || '')}"></div>
    `, () => {
      const item = { name: this.getVal('m-cName'), description: this.getVal('m-cDesc'), image: this.getVal('m-cImg') };
      if (!item.name) { notificationService.error('El nombre es requerido'); return false; }
      const cats = window.siteData.getSection('categories') || [];
      if (index >= 0) cats[index] = item; else cats.push(item);
      window.siteData.updateSection('categories', cats);
      this.loadCategories();
      notificationService.success('Categoría guardada');
    });
  }

  editCategory(i) { this.openAddCategoryModal((window.siteData.getSection('categories') || [])[i], i); }
  deleteCategory(i) {
    if (!confirm('¿Eliminar categoría?')) return;
    const cats = window.siteData.getSection('categories') || [];
    cats.splice(i, 1);
    window.siteData.updateSection('categories', cats);
    this.loadCategories();
    notificationService.success('Eliminada');
  }

  /* ── PRODUCTS ───────────────────────────────────────────────── */
  loadProducts() { this.renderProductGrid('products', 'productsList'); }
  loadFeatured() { /* ya no se usa — los destacados son un filtro de products */ }

  renderProductGrid(section, containerId) {
    const products = window.siteData.getSection('products') || [];
    const grid = document.getElementById(containerId);
    if (!grid) return;
    if (!products.length) { grid.innerHTML = '<p style="color:var(--text-dark);font-size:13px;padding:8px">Sin productos</p>'; return; }
    grid.innerHTML = products.map((p, i) => `
      <div class="ap-product-card">
        <img src="${Helpers.sanitizeUrl(p.image, 'https://placehold.co/240x160?text=?')}" alt="${Helpers.escapeAttr(p.name)}"
             onerror="this.src='https://placehold.co/240x160?text=?'">
        <div class="ap-product-card-body">
          ${p.badge ? `<span class="ap-badge">${Helpers.escapeHtml(p.badge)}</span>` : ''}
          <strong>${Helpers.escapeHtml(p.name)}</strong>
          <p class="ap-price">${Formatters.formatPrice(p.price)}</p>

          <!-- Toggle destacado -->
          <button class="ap-featured-toggle ${p.featured ? 'active' : ''}"
                  onclick="adminPanel.toggleFeatured(${i})"
                  title="${p.featured ? 'Quitar de destacados' : 'Marcar como destacado'}">
            <i class="fas fa-star"></i>
            ${p.featured ? 'Destacado' : 'Destacar'}
          </button>

          <div class="ap-product-card-actions">
            <button class="ap-item-btn ap-item-btn-edit" onclick="adminPanel.editProduct(${i})">
              <i class="fas fa-pen"></i> Editar
            </button>
            <button class="ap-item-btn ap-item-btn-del" onclick="adminPanel.deleteProduct(${i})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>`).join('');
  }

  toggleFeatured(index) {
    const products = window.siteData.getSection('products') || [];
    if (!products[index]) return;
    products[index].featured = !products[index].featured;
    window.siteData.updateSection('products', products);
    this.loadProducts();
    const state = products[index].featured ? 'marcado como destacado' : 'quitado de destacados';
    notificationService.success(`${products[index].name} ${state}`);
  }

  openAddProductModal(section = 'products', data = {}, index = -1) {
    this.openModal(index >= 0 ? 'Editar producto' : 'Nuevo producto', `
      <div class="ap-field"><label>Nombre</label><input type="text" id="m-pName" value="${Helpers.escapeAttr(data.name || '')}"></div>
      <div class="ap-field"><label>Marca</label><input type="text" id="m-pBrand" value="${Helpers.escapeAttr(data.brand || '')}"></div>
      <div class="ap-field"><label>Precio (COP, sin puntos)</label><input type="number" id="m-pPrice" value="${Helpers.escapeAttr(data.price || '')}"></div>
      <div class="ap-field"><label>Precio original (opcional)</label><input type="number" id="m-pOriginal" value="${Helpers.escapeAttr(data.originalPrice || '')}"></div>
      <div class="ap-field">
        <label>Imagen — URL</label>
        <input type="text" id="m-pImg" value="${Helpers.escapeAttr(data.image || '')}" placeholder="https://...">
      </div>
      <div class="ap-field">
        <label>Imagen — o sube un archivo</label>
        <input type="file" id="m-pImgFile" accept="image/*" style="color:var(--text-white)">
        <p class="ap-hint" style="margin-top:4px">El fondo blanco/claro se eliminará automáticamente</p>
      </div>
      <div id="m-pImgPreview" style="margin-top:8px;display:${data.image ? 'block' : 'none'}">
        <img id="m-pImgPreviewImg" src="${Helpers.sanitizeUrl(data.image, '')}"
             style="width:100%;max-height:180px;object-fit:contain;border-radius:10px;background:var(--black-light)">
      </div>
      <div class="ap-field"><label>Categoría</label>
        <select id="m-pCat">
          <option value="smartphones" ${data.category==='smartphones'?'selected':''}>Smartphones</option>
          <option value="auriculares" ${data.category==='auriculares'?'selected':''}>Auriculares</option>
          <option value="smartwatches" ${data.category==='smartwatches'?'selected':''}>Smartwatches</option>
          <option value="accesorios" ${data.category==='accesorios'?'selected':''}>Accesorios</option>
        </select>
      </div>
      <div class="ap-field"><label>Badge (ej: Nuevo, Oferta)</label><input type="text" id="m-pBadge" value="${Helpers.escapeAttr(data.badge || '')}"></div>
      <div class="ap-field"><label>Descripción</label><textarea id="m-pDesc" rows="3">${Helpers.escapeHtml(data.description || '')}</textarea></div>
      <div class="ap-field"><label>Stock</label><input type="number" id="m-pStock" value="${Helpers.escapeAttr(data.stock || 10)}"></div>
      <div class="ap-field"><label>Rating (0-5)</label><input type="number" id="m-pRating" min="0" max="5" step="0.1" value="${Helpers.escapeAttr(data.rating || 4.5)}"></div>
      <div class="ap-field" style="display:flex;align-items:center;gap:12px;padding:8px 0">
        <input type="checkbox" id="m-pFeatured" ${data.featured ? 'checked' : ''}
               style="width:18px;height:18px;accent-color:var(--gold-primary)">
        <label for="m-pFeatured" style="font-size:14px;color:var(--text-white);cursor:pointer;text-transform:none;letter-spacing:0">
          <i class="fas fa-star" style="color:var(--gold-primary);margin-right:6px"></i>
          Marcar como producto destacado
        </label>
      </div>
    `, async () => {
      const name = this.getVal('m-pName');
      if (!name) { notificationService.error('El nombre es requerido'); return false; }

      let imageUrl = this.getVal('m-pImg');
      const fileInput = document.getElementById('m-pImgFile');
      if (fileInput?.files?.[0]) {
        try {
          imageUrl = await window.imageProcessor.processImage(fileInput.files[0]);
        } catch (e) {
          notificationService.error('Error procesando imagen');
          return false;
        }
      }

      const item = {
        id: data.id || name.toLowerCase().replace(/\s+/g,'-') + '-' + Date.now(),
        name, brand: this.getVal('m-pBrand'),
        price: this.getVal('m-pPrice'),
        originalPrice: this.getVal('m-pOriginal') || null,
        image: imageUrl,
        category: this.getVal('m-pCat'),
        badge: this.getVal('m-pBadge') || null,
        description: this.getVal('m-pDesc'),
        stock: parseInt(this.getVal('m-pStock')) || 10,
        rating: parseFloat(this.getVal('m-pRating')) || 4.5,
        reviews: data.reviews || 0,
        featured: document.getElementById('m-pFeatured')?.checked || false,
        specifications: data.specifications || {}
      };
      const list = window.siteData.getSection('products') || [];
      if (index >= 0) list[index] = item; else list.push(item);
      window.siteData.updateSection('products', list);
      this.loadProducts();
      notificationService.success('Producto guardado');
    });

    // Preview en tiempo real
    setTimeout(() => {
      const fileInput = document.getElementById('m-pImgFile');
      const urlInput  = document.getElementById('m-pImg');
      if (!fileInput) return;
      const showPreview = async (src) => {
        const wrap = document.getElementById('m-pImgPreview');
        const img  = document.getElementById('m-pImgPreviewImg');
        if (!wrap || !img) return;
        wrap.style.display = 'block';
        img.style.opacity = '0.4';
        try {
          const processed = await window.imageProcessor.processImage(src);
          img.src = processed; img.style.opacity = '1';
        } catch { img.src = typeof src === 'string' ? src : ''; img.style.opacity = '1'; }
      };
      fileInput.addEventListener('change', () => { if (fileInput.files[0]) showPreview(fileInput.files[0]); });
      urlInput.addEventListener('blur', () => { if (urlInput.value.trim()) showPreview(urlInput.value.trim()); });
    }, 100);
  }

  editProduct(index) {
    this.openAddProductModal('products', (window.siteData.getSection('products') || [])[index], index);
  }

  deleteProduct(index) {
    if (!confirm('¿Eliminar producto?')) return;
    const list = window.siteData.getSection('products') || [];
    list.splice(index, 1);
    window.siteData.updateSection('products', list);
    this.loadProducts();
    notificationService.success('Producto eliminado');
  }

  /* ── COLORS ─────────────────────────────────────────────────── */
  loadColors() {
    const colors = window.siteData.getSection('colors') || {};
    this.setColorField('GoldPrimary', colors.goldPrimary || '#d4a843');
    this.setColorField('GoldLight', colors.goldLight || '#f0d68a');
    this.setColorField('GoldDark', colors.goldDark || '#b89344');
    this.renderPresets();
  }

  setColorField(name, value) {
    const picker = document.getElementById(`color${name}`);
    const hex = document.getElementById(`color${name}Hex`);
    const prev = document.getElementById(`prev${name}`);
    if (picker) picker.value = value;
    if (hex) hex.value = value;
    if (prev) prev.style.background = value;
  }

  setupColorSync() {
    ['GoldPrimary','GoldLight','GoldDark'].forEach(name => {
      const picker = document.getElementById(`color${name}`);
      const hex = document.getElementById(`color${name}Hex`);
      const prev = document.getElementById(`prev${name}`);
      if (picker) picker.addEventListener('input', () => {
        if (hex) hex.value = picker.value;
        if (prev) prev.style.background = picker.value;
      });
      if (hex) hex.addEventListener('input', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) {
          if (picker) picker.value = hex.value;
          if (prev) prev.style.background = hex.value;
        }
      });
    });
  }

  saveColors() {
    const colors = {
      goldPrimary: document.getElementById('colorGoldPrimary')?.value || '#d4a843',
      goldLight: document.getElementById('colorGoldLight')?.value || '#f0d68a',
      goldDark: document.getElementById('colorGoldDark')?.value || '#b89344',
    };
    window.siteData.updateSection('colors', colors);
    this.applyColorsToDOM(colors);
    notificationService.success('Colores aplicados al sitio');
  }

  applyColorsToDOM(colors) {
    const root = document.documentElement;
    root.style.setProperty('--gold-primary', colors.goldPrimary);
    root.style.setProperty('--gold-light', colors.goldLight);
    root.style.setProperty('--gold-dark', colors.goldDark);
  }

  renderPresets() {
    const container = document.getElementById('colorPresets');
    if (!container) return;
    container.innerHTML = this.colorPresets.map((p, i) => `
      <div class="ap-preset" style="background:${p.bg};color:#fff"
           onclick="adminPanel.applyPreset(${i})" title="${p.name}">
        ${p.name}
      </div>`).join('');
  }

  applyPreset(i) {
    const p = this.colorPresets[i];
    this.setColorField('GoldPrimary', p.primary);
    this.setColorField('GoldLight', p.light);
    this.setColorField('GoldDark', p.dark);
    this.saveColors();
    document.querySelectorAll('.ap-preset').forEach((el, idx) => el.classList.toggle('selected', idx === i));
  }

  /* ── TYPOGRAPHY ─────────────────────────────────────────────── */
  loadTypography() {
    const typo = window.siteData.getSection('typography') || {};
    this.selectedFont = typo.fontFamily || 'Poppins';
    const heroSize = typo.heroTitleSize || 58;
    const secSize = typo.sectionTitleSize || 28;
    const baseSize = typo.baseSize || 16;
    this.setVal('fontHeroTitle', heroSize);
    this.setVal('fontSectionTitle', secSize);
    this.setVal('fontBase', baseSize);
    document.getElementById('heroSizeVal').textContent = heroSize;
    document.getElementById('sectionSizeVal').textContent = secSize;
    document.getElementById('baseSizeVal').textContent = baseSize;
    this.renderFontGrid();
  }

  renderFontGrid() {
    const grid = document.getElementById('fontGrid');
    if (!grid) return;
    this.fonts.forEach((font) => window.siteData?.ensureFontLoaded?.(font));
    grid.innerHTML = this.fonts.map(f => `
      <div class="ap-font-option ${f === this.selectedFont ? 'selected' : ''}"
           style="font-family:'${f}',sans-serif"
           onclick="adminPanel.selectFont('${f}')">
        ${f}<small>Aa Bb Cc</small>
      </div>`).join('');
  }

  selectFont(font) {
    this.selectedFont = font;
    this.renderFontGrid();
  }

  saveFontFamily() {
    window.siteData.updateSection('typography', { fontFamily: this.selectedFont });
    document.documentElement.style.setProperty('--font-family', `'${this.selectedFont}', 'Segoe UI', 'Roboto', 'Arial', sans-serif`);
    notificationService.success(`Fuente "${this.selectedFont}" aplicada`);
  }

  saveTypography() {
    const current = window.siteData.getSection('typography') || {};
    window.siteData.updateSection('typography', {
      ...current,
      heroTitleSize: parseInt(this.getVal('fontHeroTitle')),
      sectionTitleSize: parseInt(this.getVal('fontSectionTitle')),
      baseSize: parseInt(this.getVal('fontBase')),
    });
    notificationService.success('Tamaños guardados');
  }

  /* ── FOOTER ─────────────────────────────────────────────────── */
  loadFooter() {
    const f = window.siteData.getSection('footer') || {};
    const s = window.siteData.getSection('social') || {};
    this.setVal('footerPhone', f.phone || '');
    this.setVal('footerEmail', f.email || '');
    this.setVal('footerAddress', f.address || '');
    this.setVal('footerWhatsapp', f.whatsapp || '');
    this.setVal('socialFacebook', s.facebook || '');
    this.setVal('socialInstagram', s.instagram || '');
    this.setVal('socialTwitter', s.twitter || '');
    this.setVal('socialYoutube', s.youtube || '');
    this.setVal('socialWhatsapp', s.whatsapp || '');
  }

  saveFooter() {
    window.siteData.updateSection('footer', {
      phone: this.getVal('footerPhone'),
      email: this.getVal('footerEmail'),
      address: this.getVal('footerAddress'),
      whatsapp: this.getVal('footerWhatsapp'),
    });
    notificationService.success('Contacto guardado');
  }

  saveSocial() {
    window.siteData.updateSection('social', {
      facebook:  this.getVal('socialFacebook'),
      instagram: this.getVal('socialInstagram'),
      whatsapp:  this.getVal('socialWhatsapp'),
      twitter:   this.getVal('socialTwitter'),
      youtube:   this.getVal('socialYoutube'),
    });
    notificationService.success('Redes sociales guardadas');
  }

  /* ── SEO ────────────────────────────────────────────────────── */
  loadSEO() {
    const seo = window.siteData.getSection('seo') || {};
    this.setVal('seoTitle', seo.title || '');
    this.setVal('seoDesc', seo.description || '');
    this.setVal('seoKeywords', seo.keywords || '');
  }

  saveSEO() {
    window.siteData.updateSection('seo', {
      title: this.getVal('seoTitle'),
      description: this.getVal('seoDesc'),
      keywords: this.getVal('seoKeywords'),
    });
    notificationService.success('SEO guardado');
  }

  /* ── Modal ──────────────────────────────────────────────────── */
  openModal(title, bodyHTML, onSave) {
    document.getElementById('apModalTitle').textContent = title;
    document.getElementById('apModalBody').innerHTML = bodyHTML;
    const overlay = document.getElementById('apModal');
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden'); // nunca ocultar con aria-hidden cuando está abierto
    const saveBtn = document.getElementById('apModalSave');
    saveBtn.onclick = () => { if (onSave() !== false) closeModal(); };
  }

  /* ── Helpers ────────────────────────────────────────────────── */
  getVal(id) { return document.getElementById(id)?.value?.trim() || ''; }
  setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
}

/* ── Globals ──────────────────────────────────────────────────── */
function closeModal() {
  const overlay = document.getElementById('apModal');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
}

function goSection(name) {
  document.querySelector(`.ap-nav-item[data-section="${name}"]`)?.click();
}

function adminLogout() {
  sessionStorage.removeItem('adminAuthenticated');
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  window.adminPanel = new AdminPanel();

  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    window.themeManager?.toggleTheme();
  });

  // Close modal on overlay click
  document.getElementById('apModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'apModal') closeModal();
  });

  // Escape closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});
