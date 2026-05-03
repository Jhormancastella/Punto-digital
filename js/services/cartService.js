/**
 * Servicio de carrito de compras
 */
class CartService {
  constructor() {
    this.storageKey = 'puntoDigitalCart';
    this.items = this.load();
    this.observers = [];
    this.init();
  }

  init() {
    this.renderCartDrawer();
    this.setupCartButton();
    this.updateBadge();
  }

  // ── Persistencia ──────────────────────────────────────────────
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    } catch {
      return [];
    }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.items));
  }

  // ── CRUD ──────────────────────────────────────────────────────
  add(product) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.items.push({ ...product, qty: 1 });
    }
    this.save();
    this.updateBadge();
    this.renderItems();
    notificationService.success(`${product.name} agregado al carrito`);
    this.notify('itemAdded', product);
  }

  remove(productId) {
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
    this.updateBadge();
    this.renderItems();
    this.notify('itemRemoved', productId);
  }

  updateQty(productId, qty) {
    const item = this.items.find(i => i.id === productId);
    if (!item) return;
    if (qty <= 0) { this.remove(productId); return; }
    item.qty = qty;
    this.save();
    this.updateBadge();
    this.renderItems();
  }

  clear() {
    this.items = [];
    this.save();
    this.updateBadge();
    this.renderItems();
    this.notify('cleared');
  }

  getTotal() {
    return this.items.reduce((sum, i) => sum + parseInt(i.price) * i.qty, 0);
  }

  getCount() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  }

  // ── Badge del navbar ──────────────────────────────────────────
  updateBadge() {
    const count = this.getCount();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  // ── Botón del carrito ─────────────────────────────────────────
  setupCartButton() {
    // Esperar a que el DOM esté listo
    const attach = () => {
      document.querySelectorAll('#cartBtn, [data-cart-toggle]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleDrawer();
        });
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    } else {
      attach();
    }
  }

  // ── Drawer del carrito ────────────────────────────────────────
  renderCartDrawer() {
    if (document.getElementById('cart-drawer')) return;

    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Carrito de compras');
    drawer.setAttribute('aria-hidden', 'true');

    drawer.innerHTML = `
      <div class="cart-overlay" id="cart-overlay"></div>
      <div class="cart-panel">
        <div class="cart-header">
          <h2><i class="fas fa-shopping-cart"></i> Carrito</h2>
          <button class="cart-close" aria-label="Cerrar carrito">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="cart-body" id="cart-items"></div>
        <div class="cart-footer" id="cart-footer"></div>
      </div>
    `;

    document.body.appendChild(drawer);

    // Cerrar con overlay o botón
    drawer.querySelector('.cart-overlay').addEventListener('click', () => this.closeDrawer());
    drawer.querySelector('.cart-close').addEventListener('click', () => this.closeDrawer());

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) this.closeDrawer();
    });

    this.injectStyles();
    this.renderItems();
  }

  toggleDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    drawer.classList.contains('open') ? this.closeDrawer() : this.openDrawer();
  }

  openDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  renderItems() {
    const body = document.getElementById('cart-items');
    const footer = document.getElementById('cart-footer');
    if (!body || !footer) return;

    if (this.items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <i class="fas fa-shopping-cart"></i>
          <p>Tu carrito está vacío</p>
          <a href="#productos-lista" class="btn-cart-shop" onclick="window.cartService.closeDrawer()">
            Ver Productos
          </a>
        </div>`;
      footer.innerHTML = '';
      return;
    }

    body.innerHTML = this.items.map(item => `
      <div class="cart-item" data-id="${Helpers.escapeAttr(item.id)}">
        <img src="${Helpers.sanitizeUrl(item.image, 'https://placehold.co/60x60?text=?')}" alt="${Helpers.escapeAttr(item.name)}" class="cart-item-img"
             onerror="this.src='https://placehold.co/60x60?text=?'">
        <div class="cart-item-info">
          <p class="cart-item-name">${Helpers.escapeHtml(item.name)}</p>
          <p class="cart-item-price">${Formatters.formatPrice(item.price)}</p>
          <div class="cart-item-qty">
            <button class="qty-btn" data-action="dec" data-id="${Helpers.escapeAttr(item.id)}" aria-label="Reducir cantidad">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${Helpers.escapeAttr(item.id)}" aria-label="Aumentar cantidad">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-id="${Helpers.escapeAttr(item.id)}" aria-label="Eliminar ${Helpers.escapeAttr(item.name)}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');

    footer.innerHTML = `
      <div class="cart-total">
        <span>Total</span>
        <span class="cart-total-price">${Formatters.formatPrice(this.getTotal())}</span>
      </div>
      <button class="btn-checkout" id="btn-checkout">
        <i class="fas fa-bolt"></i> Proceder al Pago
      </button>
      <button class="btn-cart-clear" id="btn-cart-clear">
        <i class="fas fa-trash"></i> Vaciar carrito
      </button>
    `;

    // Event listeners en los items
    body.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = this.items.find(i => i.id === id);
        if (!item) return;
        this.updateQty(id, item.qty + (btn.dataset.action === 'inc' ? 1 : -1));
      });
    });

    body.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => this.remove(btn.dataset.id));
    });

    footer.querySelector('#btn-checkout')?.addEventListener('click', () => this.checkout());
    footer.querySelector('#btn-cart-clear')?.addEventListener('click', () => this.clear());
  }

  checkout() {
    if (!this.items.length) {
      notificationService.info('Tu carrito está vacío');
      return;
    }

    const footer = window.siteData?.getSection?.('footer') || {};
    const phone = String(footer.whatsapp || footer.phone || '+573012345678').replace(/\D/g, '');
    const lines = this.items.map((item, index) => {
      const subtotal = parseInt(item.price) * item.qty;
      return `${index + 1}. ${item.name} x${item.qty} - ${Formatters.formatPrice(subtotal)}`;
    });
    const message = [
      'Hola, quiero hacer este pedido en Punto Digital:',
      '',
      ...lines,
      '',
      `Total: ${Formatters.formatPrice(this.getTotal())}`,
      '',
      'Quedo atento para confirmar disponibilidad y entrega.'
    ].join('\n');

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    notificationService.success('Pedido abierto en WhatsApp');
  }

  // ── Observers ─────────────────────────────────────────────────
  notify(event, data) {
    this.observers.forEach(fn => { try { fn(event, data); } catch {} });
  }

  onUpdate(fn) {
    this.observers.push(fn);
  }

  // ── Estilos ───────────────────────────────────────────────────
  injectStyles() {
    if (document.getElementById('cart-styles')) return;
    const style = document.createElement('style');
    style.id = 'cart-styles';
    style.textContent = `
      /* ── Drawer ── */
      #cart-drawer {
        position: fixed;
        inset: 0;
        z-index: 10000;
        pointer-events: none;
      }
      #cart-drawer.open { pointer-events: all; }

      .cart-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      #cart-drawer.open .cart-overlay { opacity: 1; }

      .cart-panel {
        position: absolute;
        top: 0;
        right: 0;
        width: min(420px, 100vw);
        height: 100%;
        background: var(--black-card);
        border-left: 1px solid rgba(212,168,67,0.2);
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
        box-shadow: -10px 0 40px rgba(0,0,0,0.4);
      }
      #cart-drawer.open .cart-panel { transform: translateX(0); }

      /* ── Header ── */
      .cart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(212,168,67,0.15);
        background: linear-gradient(135deg, var(--black-card), rgba(212,168,67,0.05));
      }
      .cart-header h2 {
        font-size: 20px;
        font-weight: 700;
        color: var(--gold-primary);
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
      }
      .cart-close {
        background: rgba(212,168,67,0.1);
        border: 1px solid rgba(212,168,67,0.2);
        color: var(--text-white);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .cart-close:hover {
        background: var(--gold-primary);
        color: var(--black-bg);
        transform: rotate(90deg);
      }

      /* ── Body ── */
      .cart-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .cart-body::-webkit-scrollbar { width: 4px; }
      .cart-body::-webkit-scrollbar-track { background: transparent; }
      .cart-body::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.3); border-radius: 2px; }

      /* ── Empty ── */
      .cart-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 40px 20px;
        color: var(--text-gray);
        text-align: center;
      }
      .cart-empty i { font-size: 48px; color: rgba(212,168,67,0.3); }
      .cart-empty p { font-size: 16px; }
      .btn-cart-shop {
        padding: 10px 24px;
        background: var(--gold-primary);
        color: var(--black-bg);
        border-radius: 50px;
        font-weight: 600;
        font-size: 14px;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      .btn-cart-shop:hover { background: var(--gold-light); transform: translateY(-2px); }

      /* ── Item ── */
      .cart-item {
        display: grid;
        grid-template-columns: 60px 1fr auto;
        gap: 12px;
        align-items: center;
        background: var(--black-light);
        border: 1px solid rgba(212,168,67,0.08);
        border-radius: 12px;
        padding: 12px;
        transition: border-color 0.2s ease;
      }
      .cart-item:hover { border-color: rgba(212,168,67,0.2); }
      .cart-item-img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
        background: var(--black-bg);
      }
      .cart-item-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
      .cart-item-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-white);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 0;
      }
      .cart-item-price { font-size: 14px; font-weight: 700; color: var(--gold-primary); margin: 0; }
      .cart-item-qty {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
      }
      .cart-item-qty span { font-size: 14px; font-weight: 600; color: var(--text-white); min-width: 20px; text-align: center; }
      .qty-btn {
        width: 26px;
        height: 26px;
        background: rgba(212,168,67,0.15);
        border: 1px solid rgba(212,168,67,0.3);
        color: var(--gold-primary);
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .qty-btn:hover { background: var(--gold-primary); color: var(--black-bg); }
      .cart-item-remove {
        background: none;
        border: none;
        color: var(--text-gray);
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        transition: all 0.2s ease;
        font-size: 14px;
      }
      .cart-item-remove:hover { color: #dc3545; background: rgba(220,53,69,0.1); }

      /* ── Footer ── */
      .cart-footer {
        padding: 16px 24px 24px;
        border-top: 1px solid rgba(212,168,67,0.15);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .cart-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-white);
      }
      .cart-total-price { font-size: 22px; font-weight: 700; color: var(--gold-primary); }
      .btn-checkout {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, var(--gold-primary), var(--gold-light));
        color: var(--black-bg);
        border: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(212,168,67,0.3);
      }
      .btn-checkout:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(212,168,67,0.4); }
      .btn-cart-clear {
        width: 100%;
        padding: 10px;
        background: transparent;
        border: 1px solid rgba(220,53,69,0.3);
        color: #dc3545;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s ease;
      }
      .btn-cart-clear:hover { background: rgba(220,53,69,0.1); border-color: #dc3545; }

      /* ── Badge ── */
      .cart-count {
        position: absolute;
        top: -6px;
        right: -6px;
        background: var(--gold-primary);
        color: var(--black-bg);
        font-size: 10px;
        font-weight: 700;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: none;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }

      /* ── Modo claro ── */
      [data-theme="light"] .cart-panel {
        background: #ffffff;
        border-left-color: rgba(212,168,67,0.3);
      }
      [data-theme="light"] .cart-item {
        background: #f8f9fa;
        border-color: rgba(212,168,67,0.15);
      }
      [data-theme="light"] .cart-header {
        background: linear-gradient(135deg, #ffffff, rgba(212,168,67,0.08));
      }
    `;
    document.head.appendChild(style);
  }
}

// Instancia global
window.cartService = new CartService();
