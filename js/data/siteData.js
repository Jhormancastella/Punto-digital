/**
 * Gestor de datos del sitio
 * Lee/escribe en Firestore. Usa localStorage como caché offline.
 *
 * Estructura Firestore:
 *   /siteConfig/{hero|features|categories|footer|social|colors|typography|seo}
 *   /products/{productId}
 */
class SiteDataManager {
  constructor() {
    this.storageKey = 'puntoDigitalData_v3';
    this.observers  = [];
    this.fontCatalog = {
      'Poppins':          'family=Poppins:wght@300;400;500;600;700;800',
      'Inter':            'family=Inter:wght@300;400;500;600;700;800',
      'Roboto':           'family=Roboto:wght@300;400;500;700',
      'Montserrat':       'family=Montserrat:wght@300;400;500;600;700;800',
      'Open Sans':        'family=Open+Sans:wght@300;400;500;600;700;800',
      'Lato':             'family=Lato:wght@300;400;700;900',
      'Nunito':           'family=Nunito:wght@300;400;500;600;700;800',
      'Raleway':          'family=Raleway:wght@300;400;500;600;700;800',
      'Merriweather':     'family=Merriweather:wght@300;400;700;900',
      'Playfair Display': 'family=Playfair+Display:wght@400;500;600;700;800'
    };

    // Datos en memoria (se llenan desde caché y luego desde Firestore)
    this.data = this._loadCache();
    this.applyVisualSettings();

    // Cargar desde Firestore en cuanto Firebase esté listo
    this._waitForFirebaseAndLoad();
  }

  // ── Carga inicial ─────────────────────────────────────────────

  _waitForFirebaseAndLoad() {
    if (window.firebaseClient?.ready) {
      this._loadFromFirestore();
    } else {
      window.addEventListener('firebaseReady', () => this._loadFromFirestore(), { once: true });
    }
  }

  async _loadFromFirestore() {
    // Reintentar hasta 3 veces con espera entre intentos
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const [config, products] = await Promise.all([
          this._loadSiteConfig(),
          this._loadProducts()
        ]);

        this.data = { ...this._getDefaultData(), ...config, products };
        this._saveCache();
        this.applyVisualSettings();
        this.notifyObservers('dataLoaded', this.data);

        window.dispatchEvent(new CustomEvent('siteDataReady', { detail: this.data }));
        console.log('✅ siteData cargado desde Firestore');
        return;

      } catch (err) {
        console.warn(`⚠️ Intento ${attempt}/3 fallido:`, err.message);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, attempt * 1500));
        } else {
          console.warn('⚠️ Usando caché local (Firestore no disponible)');
          window.dispatchEvent(new CustomEvent('siteDataReady', { detail: this.data }));
        }
      }
    }
  }

  async _loadSiteConfig() {
    const sections = ['hero', 'features', 'categories', 'footer', 'social', 'colors', 'typography', 'seo', 'slogan'];
    const results  = await Promise.all(
      sections.map(s => window.firebaseClient.getDoc(`siteConfig/${s}`))
    );
    const config = {};
    sections.forEach((s, i) => {
      if (results[i]) {
        // Si el doc tiene solo { value: ... }, extraer el valor primitivo
        const doc = results[i];
        config[s] = (doc && Object.keys(doc).length === 1 && 'value' in doc)
          ? doc.value
          : doc;
      }
    });
    return config;
  }

  async _loadProducts() {
    const docs = await window.firebaseClient.getCollection('products');
    // Ordenar por nombre si no tienen campo order
    return docs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  // ── Caché local ───────────────────────────────────────────────

  _loadCache() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return this._getDefaultData();
      const parsed = JSON.parse(raw);
      const arraySections = ['features', 'categories', 'products'];
      const corrupt = arraySections.some(k => parsed[k] !== undefined && !Array.isArray(parsed[k]));
      if (corrupt) { localStorage.removeItem(this.storageKey); return this._getDefaultData(); }
      return this._mergeWithDefaults(parsed);
    } catch {
      localStorage.removeItem(this.storageKey);
      return this._getDefaultData();
    }
  }

  _saveCache() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this._stripBase64(this.data)));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this._minimalData(this.data)));
        } catch { /* sin espacio */ }
      }
    }
  }

  // ── API pública ───────────────────────────────────────────────

  getData() { return { ...this.data }; }

  getSection(section) {
    const v = this.data[section];
    if (v === undefined || v === null) return null;
    if (Array.isArray(v)) return [...v];
    if (typeof v === 'object') return { ...v };
    return v;
  }

  /**
   * Actualiza una sección en memoria, caché y Firestore.
   * Los productos se guardan en la colección /products.
   * El resto va a /siteConfig/{section}.
   */
  async updateSection(section, newData) {
    // Actualizar en memoria
    if (Array.isArray(newData)) {
      this.data[section] = [...newData];
    } else if (typeof newData === 'object' && newData !== null) {
      this.data[section] = Array.isArray(this.data[section])
        ? [...newData]
        : { ...(this.data[section] || {}), ...newData };
    } else {
      this.data[section] = newData;
    }

    if (section === 'colors' || section === 'typography') this.applyVisualSettings();

    this._saveCache();
    this.notifyObservers('sectionUpdated', { section, data: this.data[section] });

    // Persistir en Firestore
    try {
      if (section === 'products') {
        await this._syncProducts(this.data.products);
      } else {
        const raw = this.data[section];
        const payload = Array.isArray(raw)
          ? { items: raw }
          : (raw !== null && typeof raw === 'object' ? raw : { value: raw });
        await window.firebaseClient.setDoc(`siteConfig/${section}`, payload);
      }
    } catch (err) {
      console.warn(`⚠️ No se pudo guardar "${section}" en Firestore:`, err.message);
    }
  }

  async updateItem(section, index, newData) {
    if (!Array.isArray(this.data[section])) return;
    this.data[section][index] = { ...this.data[section][index], ...newData };
    await this.updateSection(section, this.data[section]);
    this.notifyObservers('itemUpdated', { section, index });
  }

  async addItem(section, newItem) {
    if (!Array.isArray(this.data[section])) return;
    this.data[section].push(newItem);
    await this.updateSection(section, this.data[section]);
    this.notifyObservers('itemAdded', { section, item: newItem });
  }

  async removeItem(section, index) {
    if (!Array.isArray(this.data[section])) return;
    const removed = this.data[section].splice(index, 1)[0];
    await this.updateSection(section, this.data[section]);
    this.notifyObservers('itemRemoved', { section, index, item: removed });
  }

  async resetToDefaults() {
    this.data = this._getDefaultData();
    this.applyVisualSettings();
    this._saveCache();
    this.notifyObservers('dataReset', this.data);
  }

  exportData()        { return JSON.stringify(this.data, null, 2); }
  addObserver(fn)     { this.observers.push(fn); }
  removeObserver(fn)  { this.observers = this.observers.filter(o => o !== fn); }

  notifyObservers(event, data) {
    this.observers.forEach(fn => { try { fn(event, data); } catch (e) { console.error(e); } });
  }

  // ── Sincronización productos con Firestore ────────────────────

  async _syncProducts(products) {
    if (!Array.isArray(products)) return;

    // IDs actuales en memoria
    const currentIds = new Set(products.map(p => p.id));

    // Obtener IDs que existen en Firestore para borrar los que ya no están
    const existing = await window.firebaseClient.getCollection('products');
    const toDelete = existing.filter(p => !currentIds.has(p.id));

    await Promise.all([
      // Guardar/actualizar los productos actuales
      ...products.map(p => window.firebaseClient.setDoc(`products/${p.id}`, p)),
      // Eliminar los que fueron borrados
      ...toDelete.map(p => window.firebaseClient.deleteDoc(`products/${p.id}`))
    ]);
  }

  // ── Datos por defecto ─────────────────────────────────────────

  _getDefaultData() {
    return {
      colors: { goldPrimary: '#d4a843', goldLight: '#f0d68a', goldDark: '#b89344' },
      hero: {
        title: 'Los Mejores Productos de Tecnología y Telefonía',
        description: 'Encuentra aquí lo último en smartphones, gadgets y accesorios de las mejores marcas.',
        buttonText: 'VER PRODUCTOS',
        images: [
          { url: 'img/i_Phone_15_Pro_Max parte trasera.webp', alt: 'iPhone 15 Pro Max' },
          { url: 'img/samsung 24 ultra parte trasera.webp',   alt: 'Samsung Galaxy S24 Ultra' },
          { url: 'img/pixel 8 trasera.png',                   alt: 'Google Pixel 8' },
          { url: 'img/xiaomi_14t_negro_04_ad_trasera.jpeg',   alt: 'Xiaomi 14' }
        ]
      },
      features: [
        { icon: 'fa-shield-halved', title: 'GARANTÍA DE CALIDAD',   desc: 'Productos de primeras marcas con garantía completa' },
        { icon: 'fa-truck-fast',    title: 'ENVÍO RÁPIDO',          desc: 'Entrega rápida y segura a todo Colombia' },
        { icon: 'fa-headset',       title: 'SOPORTE PROFESIONAL',   desc: 'Atención al cliente especializada 24/7' }
      ],
      categories: [
        { name: 'Smartphones',            description: 'Los últimos modelos de las mejores marcas',  image: '' },
        { name: 'Auriculares Bluetooth',  description: 'Audio de alta calidad sin cables',           image: '' },
        { name: 'Smartwatches',           description: 'Tecnología wearable inteligente',            image: '' },
        { name: 'Cargadores y Accesorios',description: 'Accesorios esenciales para tus dispositivos',image: '' }
      ],
      products: [],
      footer:     { phone: '+57 301 234 5678', email: 'puntodigitalti@gmail.com', address: 'Colombia', whatsapp: '+57 301 234 5678' },
      social:     { facebook: 'https://facebook.com/puntodigital', instagram: 'https://instagram.com/puntodigital', whatsapp: 'https://wa.me/573012345678', twitter: 'https://twitter.com/puntodigital', youtube: 'https://youtube.com/puntodigital' },
      typography: { fontFamily: 'Poppins', heroTitleSize: 58, sectionTitleSize: 28, baseSize: 16 },
      seo:        { title: 'Punto Digital | Tecnología y Telefonía', description: 'Tienda especializada en tecnología y telefonía.', keywords: 'smartphones, tecnología, telefonía' },
      slogan:     'Siempre Conectados'
    };
  }

  _mergeWithDefaults(saved) {
    const def    = this._getDefaultData();
    const merged = { ...def };
    Object.keys(saved).forEach(k => {
      const s = saved[k];
      const d = def[k];
      if (Array.isArray(d))                            merged[k] = Array.isArray(s) ? s : d;
      else if (d && typeof d === 'object')             merged[k] = { ...d, ...s };
      else                                             merged[k] = s;
    });
    return merged;
  }

  // ── Utilidades de storage ─────────────────────────────────────

  _stripBase64(data) {
    const strip = v => (typeof v === 'string' && v.startsWith('data:') && v.length > 50000) ? '' : v;
    const walk  = obj => {
      if (Array.isArray(obj)) return obj.map(walk);
      if (obj && typeof obj === 'object') {
        const r = {};
        for (const [k, v] of Object.entries(obj)) r[k] = (k === 'image' || k === 'url') ? strip(v) : walk(v);
        return r;
      }
      return obj;
    };
    return walk(data);
  }

  _minimalData(data) {
    const walk = obj => {
      if (Array.isArray(obj)) return obj.map(walk);
      if (obj && typeof obj === 'object') {
        const r = {};
        for (const [k, v] of Object.entries(obj)) r[k] = (k === 'image' || k === 'url') ? '' : walk(v);
        return r;
      }
      return obj;
    };
    return walk(data);
  }

  // ── CSS Variables ─────────────────────────────────────────────

  applyVisualSettings() {
    const root     = document.documentElement;
    const colors   = this.data.colors   || {};
    const typo     = this.data.typography || {};

    root.style.setProperty('--gold-primary', colors.goldPrimary || '#d4a843');
    root.style.setProperty('--gold-light',   colors.goldLight   || '#f0d68a');
    root.style.setProperty('--gold-dark',    colors.goldDark    || '#b89344');

    const font = typo.fontFamily || 'Poppins';
    this.ensureFontLoaded(font);
    root.style.setProperty('--font-family', `'${font}', 'Segoe UI', 'Roboto', 'Arial', sans-serif`);

    const heroSize    = parseInt(typo.heroTitleSize,    10);
    const sectionSize = parseInt(typo.sectionTitleSize, 10);
    const baseSize    = parseInt(typo.baseSize,         10);

    if (!isNaN(heroSize))    root.style.setProperty('--font-size-hero',    `clamp(28px, 5vw, ${heroSize}px)`);
    if (!isNaN(sectionSize)) root.style.setProperty('--font-size-section', `clamp(20px, 4vw, ${sectionSize}px)`);
    if (!isNaN(baseSize))    root.style.setProperty('--font-size-base',    `clamp(14px, 2vw, ${baseSize}px)`);

    // Actualizar slogan en navbar
    const slogan = this.data.slogan || 'Siempre Conectados';
    document.querySelectorAll('#navSloganText').forEach(el => { el.textContent = slogan; });
  }

  ensureFontLoaded(fontFamily) {
    const q = this.fontCatalog[fontFamily];
    if (!q) return;
    const id = `dynamic-font-${fontFamily.toLowerCase().replace(/\s+/g, '-')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id   = id;
    link.rel  = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${q}&display=swap`;
    document.head.appendChild(link);
  }
}

window.siteData = new SiteDataManager();
