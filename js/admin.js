/**
 * Panel de Administración — Punto Digital
 * Protegido con Firebase Auth real (no solo sessionStorage).
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
    this._boot();
  }

  async _boot() {
    try {
      if (window.firebaseClient?.waitReady) {
        await window.firebaseClient.waitReady();
      } else {
        await new Promise(res => window.addEventListener('firebaseReady', res, { once: true }));
      }
    } catch (e) {
      console.warn('[AdminPanel] Firebase no inicializó a tiempo, continuando con Auth state:', e);
    }

    const authUser = window.firebaseClient?.getCurrentUser?.();
    if (authUser && this._isAdminEmail(authUser.email)) {
      this._enterPanel();
      return;
    }

    window.addEventListener('firebaseAuthChanged', (e) => {
      const user = e.detail?.user;
      if (user && this._isAdminEmail(user.email)) this._enterPanel();
      else this._showLogin();
    }, { once: true });

    if (!authUser) this._showLogin();
    else this._showLogin();
  }

  _isAdminEmail(email) {
    return String(email || '').toLowerCase() === 'puntodigitalti@gmail.com';
  }

  _showLogin() {
    const app = document.getElementById('apMain')?.parentElement?.parentElement;
    if (document.getElementById('adminLoginScreen')) return;

    const overlay = document.createElement('div');
    overlay.id = 'adminLoginScreen';
    overlay.className = 'admin-login-overlay';
    overlay.innerHTML = `
      <div class="admin-login-card">
        <div class="admin-login-icon"><i class="fas fa-user-shield"></i></div>
        <h1>Acceso Admin</h1>
        <p class="admin-login-sub">Inicia sesión con tu cuenta autorizada</p>
        <form id="adminLoginForm" novalidate>
          <div class="admin-login-field">
            <label for="lg_email">Correo electrónico</label>
            <div class="admin-login-input-wrap">
              <i class="fas fa-envelope"></i>
              <input type="email" id="lg_email" name="email" autocomplete="username" placeholder="admin@puntodigital.com" required>
            </div>
          </div>
          <div class="admin-login-field">
            <label for="lg_password">Contraseña</label>
            <div class="admin-login-input-wrap">
              <i class="fas fa-lock"></i>
              <input type="password" id="lg_password" name="password" autocomplete="current-password" placeholder="••••••••" required>
            </div>
          </div>
          <button type="submit" class="admin-login-submit" id="adminLoginSubmitBtn">
            <i class="fas fa-sign-in-alt"></i>
            <span>Iniciar Sesión</span>
          </button>
          <p class="admin-login-error" id="adminLoginError" role="alert"></p>
        </form>
        <a href="index.html" class="admin-login-back">
          <i class="fas fa-arrow-left"></i>
          Volver al sitio web
        </a>
        <p class="admin-login-footer">
          <i class="fas fa-shield-alt"></i>
          Acceso restringido solo a personal autorizado de Punto Digital
        </p>
      </div>
    `;
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.textContent = `
      .admin-login-overlay{
        position:fixed;inset:0;z-index:99999;
        background:radial-gradient(ellipse at top, rgba(212,168,67,0.12), transparent 60%), #0a0a0a;
        display:flex;align-items:center;justify-content:center;
        padding:20px;
      }
      .admin-login-card{
        width:100%;max-width:420px;
        background:linear-gradient(180deg, #161616, #0e0e0e);
        border:1px solid rgba(212,168,67,0.25);
        border-radius:20px;
        padding:38px 32px 28px;
        box-shadow:0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset;
        text-align:center;
        animation:adminLoginPop 0.35s cubic-bezier(.16,1,.3,1);
      }
      @keyframes adminLoginPop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
      .admin-login-icon{
        width:68px;height:68px;border-radius:18px;
        background:linear-gradient(135deg, var(--gold-primary,#d4a843), #b89344);
        color:#0a0a0a;font-size:28px;
        display:flex;align-items:center;justify-content:center;
        margin:0 auto 18px;
        box-shadow:0 8px 24px rgba(212,168,67,0.28);
      }
      .admin-login-card h1{
        margin:0 0 6px;font-size:24px;font-weight:800;color:var(--text-white,#fff);
        letter-spacing:-0.2px;
      }
      .admin-login-sub{
        margin:0 0 26px;font-size:13px;color:var(--text-gray,#aaa);
      }
      .admin-login-field{
        margin-bottom:16px;text-align:left;
      }
      .admin-login-field label{
        display:block;margin-bottom:6px;font-size:12px;font-weight:700;
        color:var(--text-gray,#bbb);text-transform:uppercase;letter-spacing:.5px;
      }
      .admin-login-input-wrap{
        position:relative;
      }
      .admin-login-input-wrap i{
        position:absolute;left:14px;top:50%;transform:translateY(-50%);
        color:rgba(212,168,67,0.7);font-size:13px;
      }
      .admin-login-input-wrap input{
        width:100%;padding:13px 14px 13px 40px;
        background:#111;border:1.5px solid rgba(255,255,255,0.07);
        border-radius:11px;color:var(--text-white,#fff);
        font-family:inherit;font-size:14px;
        transition:all .2s ease;box-sizing:border-box;
      }
      .admin-login-input-wrap input:focus{
        outline:none;border-color:var(--gold-primary,#d4a843);
        box-shadow:0 0 0 3px rgba(212,168,67,0.1);
        background:#161616;
      }
      .admin-login-input-wrap input::placeholder{color:rgba(255,255,255,0.28)}
      .admin-login-submit{
        width:100%;margin-top:6px;padding:14px;
        background:linear-gradient(135deg, var(--gold-primary,#d4a843), #b89344);
        color:#0a0a0a;border:none;border-radius:12px;
        font-family:inherit;font-size:15px;font-weight:800;
        display:flex;align-items:center;justify-content:center;gap:9px;
        cursor:pointer;transition:all .2s ease;
        box-shadow:0 8px 20px rgba(212,168,67,0.25);
      }
      .admin-login-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 28px rgba(212,168,67,0.35)}
      .admin-login-submit:disabled{opacity:.7;cursor:not-allowed}
      .admin-login-submit .fa-spinner{font-size:15px}
      .admin-login-error{
        min-height:20px;margin:12px 0 0;font-size:12.5px;color:#ff6b7a;font-weight:600;
      }
      .admin-login-footer{
        margin:24px 0 0;padding-top:18px;
        border-top:1px solid rgba(255,255,255,0.06);
        font-size:11.5px;color:var(--text-gray,#888);
        display:flex;align-items:center;justify-content:center;gap:7px;
      }
      .admin-login-footer i{color:rgba(212,168,67,0.7)}
      .admin-login-back{
        display:flex;align-items:center;justify-content:center;gap:8px;
        margin:14px 0 0;padding:11px 14px;
        background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.08);
        border-radius:11px;
        color:var(--text-gray,#aaa);
        font-size:13.5px;font-weight:600;
        text-decoration:none;
        transition:all .2s ease;
      }
      .admin-login-back:hover{
        background:rgba(255,255,255,0.08);
        border-color:rgba(255,255,255,0.15);
        color:var(--text-white,#fff);
        transform:translateY(-1px);
      }
      .admin-login-back i{font-size:12px;}
    `;
    document.head.appendChild(style);

    const form = overlay.querySelector('#adminLoginForm');
    const errEl = overlay.querySelector('#adminLoginError');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value;
      const btn = overlay.querySelector('#adminLoginSubmitBtn');
      const originalHTML = btn.innerHTML;

      errEl.textContent = '';
      if (!email || !password) {
        errEl.textContent = 'Ingresa correo y contraseña';
        return;
      }
      if (!this._isAdminEmail(email)) {
        errEl.textContent = 'Esta cuenta no tiene permisos de administrador';
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Verificando...</span>';
      try {
        await window.authService.signIn(email, password);
        if (!this._isAdminEmail(window.firebaseClient?.getCurrentUser?.()?.email)) {
          await window.authService.signOut();
          throw new Error('Usuario no autorizado como administrador');
        }
        overlay.remove();
        this._enterPanel();
      } catch (err) {
        errEl.textContent = err.message || 'Error al iniciar sesión';
        btn.disabled = false;
        btn.innerHTML = originalHTML;
      }
    });
  }

  _enterPanel() {
    sessionStorage.setItem('adminAuthenticated', 'true');
    try {
      if (window.orderService) {
        window.orderService.orders = [];
        localStorage.removeItem('puntoDigitalOrders');
        window.orderService.notify('ordersUpdated', []);
      }
    } catch (_) {}
    document.getElementById('adminLoginScreen')?.remove();
    if (window.orderService?._ensureAdminFirestoreListener) {
      window.orderService._ensureAdminFirestoreListener();
    }
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
    const fbUser = window.firebaseClient?.getCurrentUser?.();
    const sessionFlag = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (fbUser && this._isAdminEmail(fbUser.email)) return true;
    if (sessionFlag && fbUser && this._isAdminEmail(fbUser.email)) return true;
    return false;
  }

  redirectToLogin() {
    this._showLogin();
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
        this.closeMobileSidebar();
      });
    });
  }

  setupSidebar() {
    // La gestión del toggle/backdrop/cierre del sidebar móvil
    // ya la hace la IIFE bindSidebarToggle() de admin.html.
    // Aquí solo gestionamos el estado colapsado del sidebar desktop
    const sidebar = document.getElementById('apSidebar');
    if (!sidebar) return;
    // No registrar listener del toggle aquí para evitar duplicados
  }

  closeMobileSidebar() {
    const sidebar = document.getElementById('apSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) {
      backdrop.classList.remove('show');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    try { document.body.style.overflow = ''; } catch (_) {}
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
    const hero   = window.siteData.getSection('hero') || {};
    const slogan = window.siteData.getSection('slogan') || 'Siempre Conectados';
    this.setVal('siteSlogan', slogan);
    this.setVal('heroTitle',  hero.title       || '');
    this.setVal('heroDesc',   hero.description || '');
    this.setVal('heroBtnText',hero.buttonText  || '');
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
    hero.title       = this.getVal('heroTitle');
    hero.description = this.getVal('heroDesc');
    hero.buttonText  = this.getVal('heroBtnText');
    const slogan     = this.getVal('siteSlogan') || 'Siempre Conectados';
    window.siteData.updateSection('hero',   hero);
    window.siteData.updateSection('slogan', slogan);
    // Actualizar slogan en tiempo real en el admin
    document.querySelectorAll('#navSloganText').forEach(el => { el.textContent = slogan; });
    notificationService.success('Hero y slogan guardados correctamente');
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
         <img src="${Helpers.sanitizeUrl(p.images?.[0] || p.image, 'https://placehold.co/240x160?text=?')}" alt="${Helpers.escapeAttr(p.name)}"
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
        <label>Imágenes del producto <span style="color:#dc3545">*</span> (mínimo 3)</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <input type="text" id="m-pImgUrl" placeholder="https://ejemplo.com/imagen.jpg"
                 style="flex:1;min-width:200px">
          <button type="button" id="m-pImgAddUrl" class="ap-item-btn ap-item-btn-edit"
                  style="white-space:nowrap">
            <i class="fas fa-link"></i> Agregar
          </button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <input type="file" id="m-pImgFile" accept="image/*" multiple
                 style="color:var(--text-white);flex:1">
          <button type="button" id="m-pImgAddFile" class="ap-item-btn ap-item-btn-edit"
                  style="white-space:nowrap">
            <i class="fas fa-upload"></i> Subir
          </button>
        </div>
        <p class="ap-hint" style="margin-top:4px">El fondo blanco/claro se eliminará automáticamente</p>
        <div id="m-pImagesContainer" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px;margin-top:10px">
          <!-- Miniaturas dinámicas -->
        </div>
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

      const images = window.adminPanel._productImages || [];
      if (images.length < 3) {
        notificationService.error('Debes agregar al menos 3 imágenes');
        return false;
      }

      const item = {
        id: data.id || name.toLowerCase().replace(/\s+/g,'-') + '-' + Date.now(),
        name, brand: this.getVal('m-pBrand'),
        price: this.getVal('m-pPrice'),
        originalPrice: this.getVal('m-pOriginal') || null,
        image: images[0],
        images: images,
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

    // Inicializar gestor de imágenes múltiples
    setTimeout(() => {
      window.adminPanel._initProductImages(data);
    }, 100);
  }

  _initProductImages(data) {
    const existing = Array.isArray(data.images) && data.images.length
      ? data.images
      : (data.image ? [data.image] : []);
    this._productImages = existing;
    this._productImageSettings = {};

    const container = document.getElementById('m-pImagesContainer');
    const addUrlBtn = document.getElementById('m-pImgAddUrl');
    const addFileBtn = document.getElementById('m-pImgAddFile');
    const urlInput = document.getElementById('m-pImgUrl');
    const fileInput = document.getElementById('m-pImgFile');

    this._renderProductImages();

    addUrlBtn?.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!url) { notificationService.error('Ingresa una URL válida'); return; }
      try {
        urlInput.disabled = true;
        addUrlBtn.disabled = true;
        notificationService.info('Procesando imagen...');
        const processed = await window.imageProcessor.processImage(url, { tolerance: 35, outputSize: 700, smooth: 3 });
        this._openImageEditor(url, processed, { tolerance: 35, smooth: 3, isUrl: true });
      } catch (e) {
        console.error(e);
        notificationService.error('Error al procesar la URL. Verifica que sea pública y permita CORS.');
      } finally {
        urlInput.disabled = false;
        addUrlBtn.disabled = false;
        urlInput.value = '';
      }
    });

    addFileBtn?.addEventListener('click', async () => {
      const files = fileInput.files;
      if (!files || !files.length) { notificationService.error('Selecciona al menos un archivo'); return; }
      for (const file of files) {
        if (!window.imageProcessor.validateImageFormat(file)) {
          notificationService.error(`Formato no válido: ${file.name}`);
          continue;
        }
        try {
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const previewProcessed = await window.imageProcessor.previewRemoveBackground(dataUrl, { tolerance: 35, smooth: 3 });
          this._openImageEditor(dataUrl, previewProcessed, { tolerance: 35, smooth: 3, fileName: file.name, isFile: true });
        } catch {
          notificationService.error(`Error procesando: ${file.name}`);
        }
      }
      fileInput.value = '';
    });
  }

  _renderProductImages() {
    const container = document.getElementById('m-pImagesContainer');
    if (!container) return;
    container.innerHTML = this._productImages.map((src, i) => `
      <div class="ap-product-img-card" data-idx="${i}">
        <div class="ap-product-img-wrap">
          <img src="${Helpers.sanitizeUrl(src, 'https://placehold.co/100x100?text=?')}"
               alt="Producto imagen ${i + 1}"
               onerror="this.src='https://placehold.co/100x100?text=?'">
          ${i === 0 ? '<div class="ap-product-img-primary">Principal</div>' : ''}
        </div>
        <div class="ap-product-img-actions">
          <button type="button" class="ap-product-img-btn" onclick="adminPanel._editProductImage(${i})" title="Ajustar transparencia">
            <i class="fas fa-magic"></i>
          </button>
          ${i > 0 ? `<button type="button" class="ap-product-img-btn" onclick="adminPanel._reorderProductImage(${i}, ${i - 1})" title="Mover izquierda"><i class="fas fa-chevron-left"></i></button>` : ''}
          ${i < this._productImages.length - 1 ? `<button type="button" class="ap-product-img-btn" onclick="adminPanel._reorderProductImage(${i}, ${i + 1})" title="Mover derecha"><i class="fas fa-chevron-right"></i></button>` : ''}
          <button type="button" class="ap-product-img-btn ap-product-img-btn--del" onclick="adminPanel._removeProductImage(${i})" title="Eliminar">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `).join('');
    const count = this._productImages.length;
    const hint = document.querySelector('.ap-hint');
    if (hint) hint.innerHTML = `Puedes ajustar la transparencia individualmente con <i class="fas fa-magic"></i> · <strong>${count}/3</strong> mínimas`;
  }

  _reorderProductImage(from, to) {
    const arr = this._productImages;
    [arr[from], arr[to]] = [arr[to], arr[from]];
    this._renderProductImages();
  }

  _editProductImage(idx) {
    const currentUrl = this._productImages[idx];
    const settings = this._productImageSettings[idx] || { tolerance: 35, smooth: 3 };
    this._openImageEditor(currentUrl, null, { ...settings, editIndex: idx, existing: true });
  }

  async _openImageEditor(originalSrc, initialProcessed, opts = {}) {
    const toleranceDefault = opts.tolerance ?? 35;
    const smoothDefault    = opts.smooth    ?? 3;

    const overlay = document.createElement('div');
    overlay.className = 'ap-image-editor-overlay';
    overlay.innerHTML = `
      <div class="ap-image-editor">
        <div class="ap-image-editor__header">
          <h3><i class="fas fa-magic" style="color:var(--gold-primary);margin-right:8px"></i>Ajustar Quitar Fondo</h3>
          <button type="button" class="ap-image-editor__close" title="Cancelar">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="ap-image-editor__compare">
          <div class="ap-image-editor__col">
            <div class="ap-image-editor__label">Original</div>
            <div class="ap-image-editor__canvas">
              <img class="ap-img-original" src="" alt="Original" crossorigin="anonymous">
            </div>
          </div>
          <div class="ap-image-editor__col">
            <div class="ap-image-editor__label ap-image-editor__label--ok">
              Sin Fondo <span class="ap-img-check">●</span>
            </div>
            <div class="ap-image-editor__canvas ap-image-editor__canvas--checker">
              <img class="ap-img-processed" src="" alt="Procesada">
            </div>
          </div>
        </div>

        <div class="ap-image-editor__controls">
          <div class="ap-image-editor__slider">
            <div class="ap-image-editor__slider-head">
              <label>Sensibilidad de corte (tolerancia)</label>
              <span class="ap-chip" id="chipTol">${toleranceDefault}</span>
            </div>
            <input type="range" id="sliderTol" min="10" max="80" value="${toleranceDefault}" step="1">
            <small>↑ Mayor = más fondo eliminado ·  ↓ Menor = más preciso</small>
          </div>
          <div class="ap-image-editor__slider">
            <div class="ap-image-editor__slider-head">
              <label>Suavizado de bordes</label>
              <span class="ap-chip" id="chipSmooth">${smoothDefault}</span>
            </div>
            <input type="range" id="sliderSmooth" min="0" max="6" value="${smoothDefault}" step="1">
            <small>0 = duro ·  3 = recomendado  ·  6 = muy suave</small>
          </div>
          <div class="ap-image-editor__slider">
            <div class="ap-image-editor__slider-head">
              <label>Tamaño de salida</label>
              <span class="ap-chip" id="chipSize">700px</span>
            </div>
            <input type="range" id="sliderSize" min="500" max="900" value="700" step="50">
            <small>Resolución al subir a Cloudinary</small>
          </div>
        </div>

        <div class="ap-image-editor__footer">
          <button type="button" class="ap-btn ap-btn--ghost ap-image-editor__cancel">Cancelar</button>
          <button type="button" class="ap-btn ap-btn--primary ap-image-editor__confirm" disabled>
            <i class="fas fa-cloud-upload-alt"></i>
            Confirmar y Subir
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const el = sel => overlay.querySelector(sel);
    const imgOrig     = el('.ap-img-original');
    const imgProc     = el('.ap-img-processed');
    const sliderTol   = el('#sliderTol');
    const sliderSmooth= el('#sliderSmooth');
    const sliderSize  = el('#sliderSize');
    const chipTol     = el('#chipTol');
    const chipSmooth  = el('#chipSmooth');
    const chipSize    = el('#chipSize');
    const btnCancel   = el('.ap-image-editor__cancel, .ap-image-editor__close');
    const btnConfirm  = el('.ap-image-editor__confirm');

    let lastT = +sliderTol.value, lastS = +sliderSmooth.value;
    let debounceTimer = null;

    const rerenderProcessed = async () => {
      const tol    = +sliderTol.value;
      const smooth = +sliderSmooth.value;
      chipTol.textContent    = tol;
      chipSmooth.textContent = smooth;
      chipSize.textContent   = sliderSize.value + 'px';
      lastT = tol; lastS = smooth;
      try {
        imgProc.style.opacity = '0.55';
        const dataUrl = await window.imageProcessor.previewRemoveBackground(imgOrig.src, { tolerance: tol, smooth, outputSize: +sliderSize.value });
        imgProc.src = dataUrl;
        imgProc.style.opacity = '1';
        btnConfirm.disabled = false;
      } catch (e) {
        console.warn(e);
      }
    };

    const onSliderInput = () => {
      chipTol.textContent    = sliderTol.value;
      chipSmooth.textContent = sliderSmooth.value;
      chipSize.textContent   = sliderSize.value + 'px';
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(rerenderProcessed, 120);
    };

    imgOrig.onload = async () => {
      if (initialProcessed) {
        imgProc.src = initialProcessed;
        btnConfirm.disabled = false;
      } else {
        await rerenderProcessed();
      }
    };
    imgOrig.src = originalSrc;

    sliderTol.addEventListener('input', onSliderInput);
    sliderSmooth.addEventListener('input', onSliderInput);
    sliderSize.addEventListener('change', rerenderProcessed);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeEditor();
    });
    document.addEventListener('keydown', escClose);
    function escClose(e) { if (e.key === 'Escape') closeEditor(); }

    function closeEditor() {
      document.removeEventListener('keydown', escClose);
      overlay.remove();
    }
    btnCancel.addEventListener('click', closeEditor);

    btnConfirm.addEventListener('click', async () => {
      try {
        btnConfirm.disabled = true;
        const origLabel = btnConfirm.innerHTML;
        btnConfirm.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo a Cloudinary...';
        const tol    = +sliderTol.value;
        const smooth = +sliderSmooth.value;
        const size   = +sliderSize.value;
        const finalUrl = await window.imageProcessor.processImage(originalSrc, { tolerance: tol, smooth, outputSize: size });
        if (typeof opts.editIndex === 'number') {
          this._productImages[opts.editIndex] = finalUrl;
          this._productImageSettings[opts.editIndex] = { tolerance: tol, smooth };
        } else {
          if (this._productImages.includes(finalUrl)) { closeEditor(); return; }
          this._productImages.push(finalUrl);
          this._productImageSettings[this._productImages.length - 1] = { tolerance: tol, smooth };
        }
        this._renderProductImages();
        notificationService.success(opts.editIndex !== undefined ? 'Imagen ajustada' : 'Imagen agregada');
        closeEditor();
      } catch (e) {
        console.error(e);
        notificationService.error('Error al subir la imagen');
        btnConfirm.disabled = false;
      }
    });
  }

  _addProductImage(src) {
    if (!src) return;
    if (this._productImages.includes(src)) return;
    this._productImages.push(src);
    this._renderProductImages();
  }

  _removeProductImage(index) {
    this._productImages.splice(index, 1);
    const settings = [];
    Object.keys(this._productImageSettings || {}).forEach(k => {
      const ki = +k;
      if (ki !== index) settings[ki < index ? ki : ki - 1] = this._productImageSettings[k];
    });
    this._productImageSettings = settings;
    this._renderProductImages();
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

  async saveFooter() {
    await window.siteData.updateSection('footer', {
      phone: this.getVal('footerPhone'),
      email: this.getVal('footerEmail'),
      address: this.getVal('footerAddress'),
      whatsapp: this.getVal('footerWhatsapp'),
    });
    window.dispatchEvent(new CustomEvent('siteFooterUpdated'));
    notificationService.success('Contacto guardado');
  }

  async saveSocial() {
    await window.siteData.updateSection('social', {
      facebook:  this.normalizeSocialUrl(this.getVal('socialFacebook')),
      instagram: this.normalizeSocialUrl(this.getVal('socialInstagram')),
      whatsapp:  this.normalizeSocialUrl(this.getVal('socialWhatsapp'), 'whatsapp'),
      twitter:   this.normalizeSocialUrl(this.getVal('socialTwitter')),
      youtube:   this.normalizeSocialUrl(this.getVal('socialYoutube')),
    });
    this.loadFooter();
    window.dispatchEvent(new CustomEvent('siteFooterUpdated'));
    notificationService.success('Redes sociales guardadas');
  }

  normalizeSocialUrl(value, platform = '') {
    const raw = String(value || '').trim();
    if (!raw || raw === '#') return '';
    if (platform === 'whatsapp' && /^\+?\d[\d\s().-]+$/.test(raw)) {
      return `https://wa.me/${raw.replace(/\D/g, '')}`;
    }
    if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw;
    return `https://${raw.replace(/^\/+/, '')}`;
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

async function adminLogout() {
  sessionStorage.removeItem('adminAuthenticated');
  try {
    if (window.authService) await window.authService.signOut();
    else if (window.firebaseClient?.signOut) await window.firebaseClient.signOut();
  } catch (e) {
    console.warn('Error al cerrar sesión Firebase:', e);
  }
  window.location.reload();
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
