/**
 * Modal de Checkout - Formulario completo para datos del cliente y pago
 */
class CheckoutModal {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.currentItems = [];
    this.currentTotal = 0;
    this.selectedPaymentMethod = 'transfer';
    this.init();
  }

  init() {
    this.createModal();
    this.injectStyles();
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'checkout-overlay';
    this.modal.id = 'checkoutModal';
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-labelledby', 'checkout-title');
    this.modal.setAttribute('aria-hidden', 'true');

    this.modal.innerHTML = `
      <div class="checkout-container">
        <button class="checkout-close" aria-label="Cerrar checkout">
          <i class="fas fa-times"></i>
        </button>

        <div class="checkout-header">
          <div class="checkout-header-icon">
            <i class="fas fa-credit-card"></i>
          </div>
          <div>
            <h2 id="checkout-title">Finalizar Compra</h2>
            <p class="checkout-subtitle">Completa tus datos para procesar tu pedido</p>
          </div>
        </div>

        <div class="checkout-body">
          <div class="checkout-columns">
            <div class="checkout-col-form">
              <form id="checkoutForm" novalidate>
                <div class="checkout-section">
                  <h3><i class="fas fa-user"></i> Datos Personales</h3>
                  <div class="checkout-grid-2">
                    <div class="checkout-field">
                      <label for="ch_fullName">Nombres y Apellidos *</label>
                      <input type="text" id="ch_fullName" name="fullName" required
                             placeholder="Ej: Juan Pérez Gómez" autocomplete="name">
                      <span class="checkout-error" data-error="fullName"></span>
                    </div>
                    <div class="checkout-field">
                      <label for="ch_email">Correo Electrónico *</label>
                      <input type="email" id="ch_email" name="email" required
                             placeholder="tucorreo@email.com" autocomplete="email">
                      <span class="checkout-error" data-error="email"></span>
                    </div>
                    <div class="checkout-field">
                      <label for="ch_phone">Teléfono / Celular *</label>
                      <input type="tel" id="ch_phone" name="phone" required
                             placeholder="300 123 4567" autocomplete="tel">
                      <span class="checkout-error" data-error="phone"></span>
                    </div>
                    <div class="checkout-field">
                      <label>Tipo de Documento</label>
                      <select id="ch_documentType" name="documentType">
                        <option value="CC">Cédula de Ciudadanía</option>
                        <option value="CE">Cédula de Extranjería</option>
                        <option value="NIT">NIT</option>
                        <option value="TI">Tarjeta de Identidad</option>
                        <option value="PP">Pasaporte</option>
                      </select>
                    </div>
                    <div class="checkout-field checkout-span-2">
                      <label for="ch_document">Número de Documento</label>
                      <input type="text" id="ch_document" name="document"
                             placeholder="Número de documento" autocomplete="off">
                      <span class="checkout-error" data-error="document"></span>
                    </div>
                  </div>
                </div>

                <div class="checkout-section">
                  <h3><i class="fas fa-map-marker-alt"></i> Dirección de Entrega</h3>
                  <div class="checkout-grid-2">
                    <div class="checkout-field">
                      <label for="ch_department">Departamento *</label>
                      <select id="ch_department" name="department" required>
                        <option value="">Seleccionar...</option>
                        <option value="Amazonas">Amazonas</option>
                        <option value="Antioquia">Antioquia</option>
                        <option value="Arauca">Arauca</option>
                        <option value="Atlántico">Atlántico</option>
                        <option value="Bolívar">Bolívar</option>
                        <option value="Boyacá">Boyacá</option>
                        <option value="Caldas">Caldas</option>
                        <option value="Caquetá">Caquetá</option>
                        <option value="Casanare">Casanare</option>
                        <option value="Cauca">Cauca</option>
                        <option value="Cesar">Cesar</option>
                        <option value="Chocó">Chocó</option>
                        <option value="Córdoba">Córdoba</option>
                        <option value="Cundinamarca">Cundinamarca</option>
                        <option value="Guainía">Guainía</option>
                        <option value="Guaviare">Guaviare</option>
                        <option value="Huila">Huila</option>
                        <option value="La Guajira">La Guajira</option>
                        <option value="Magdalena">Magdalena</option>
                        <option value="Meta">Meta</option>
                        <option value="Nariño">Nariño</option>
                        <option value="Norte de Santander">Norte de Santander</option>
                        <option value="Putumayo">Putumayo</option>
                        <option value="Quindío">Quindío</option>
                        <option value="Risaralda">Risaralda</option>
                        <option value="San Andrés y Providencia">San Andrés y Providencia</option>
                        <option value="Santander">Santander</option>
                        <option value="Sucre">Sucre</option>
                        <option value="Tolima">Tolima</option>
                        <option value="Valle del Cauca">Valle del Cauca</option>
                        <option value="Vaupés">Vaupés</option>
                        <option value="Vichada">Vichada</option>
                      </select>
                      <span class="checkout-error" data-error="department"></span>
                    </div>
                    <div class="checkout-field">
                      <label for="ch_city">Ciudad / Municipio *</label>
                      <input type="text" id="ch_city" name="city" required
                             placeholder="Ej: Bogotá, Medellín, Cali">
                      <span class="checkout-error" data-error="city"></span>
                    </div>
                    <div class="checkout-field checkout-span-2">
                      <label for="ch_address">Dirección Completa *</label>
                      <input type="text" id="ch_address" name="address" required
                             placeholder="Calle, carrera, número, barrio, torre/apto..." autocomplete="street-address">
                      <span class="checkout-error" data-error="address"></span>
                    </div>
                    <div class="checkout-field checkout-span-2">
                      <label for="ch_notes">Instrucciones o Notas Adicionales</label>
                      <textarea id="ch_notes" name="notes" rows="2"
                                placeholder="Ej: Portería 2, preguntar por Carlos, landmark..."></textarea>
                    </div>
                  </div>
                </div>

                <div class="checkout-section">
                  <h3><i class="fas fa-money-bill-wave"></i> Método de Pago</h3>
                  <div class="payment-methods">
                    <label class="payment-option ${this.selectedPaymentMethod === 'transfer' ? 'selected' : ''}" data-method="transfer">
                      <input type="radio" name="paymentMethod" value="transfer" ${this.selectedPaymentMethod === 'transfer' ? 'checked' : ''}>
                      <div class="payment-option-content">
                        <div class="payment-icon"><i class="fas fa-university"></i></div>
                        <div>
                          <h4>Pago por Transferencia</h4>
                          <p>Realiza transferencia bancaria y confirma el comprobante. Verificaremos el pago antes del envío.</p>
                        </div>
                        <div class="payment-check"><i class="fas fa-check"></i></div>
                      </div>
                    </label>
                    <label class="payment-option ${this.selectedPaymentMethod === 'cod' ? 'selected' : ''}" data-method="cod">
                      <input type="radio" name="paymentMethod" value="cod" ${this.selectedPaymentMethod === 'cod' ? 'checked' : ''}>
                      <div class="payment-option-content">
                        <div class="payment-icon"><i class="fas fa-hand-holding-usd"></i></div>
                        <div>
                          <h4>Pago Contra Entrega</h4>
                          <p>Paga en efectivo al recibir tu pedido en la dirección indicada. Sujeto a disponibilidad por zona.</p>
                        </div>
                        <div class="payment-check"><i class="fas fa-check"></i></div>
                      </div>
                    </label>
                  </div>

                  <div class="payment-info" id="paymentInfo"></div>
                </div>
              </form>
            </div>

            <div class="checkout-col-summary">
              <div class="checkout-summary-card">
                <div class="summary-header">
                  <h3><i class="fas fa-shopping-bag"></i> Resumen del Pedido</h3>
                </div>
                <div class="summary-items" id="summaryItems"></div>
                <div class="summary-totals">
                  <div class="summary-row">
                    <span>Subtotal</span>
                    <span id="summarySubtotal">$0</span>
                  </div>
                  <div class="summary-row">
                    <span>Envío</span>
                    <span class="summary-free">Gratis</span>
                  </div>
                  <div class="summary-divider"></div>
                  <div class="summary-row summary-total-row">
                    <span>Total a Pagar</span>
                    <span id="summaryTotal">$0</span>
                  </div>
                </div>
                <button type="button" class="checkout-place-order" id="btnPlaceOrder">
                  <i class="fas fa-check-circle"></i>
                  <span>Confirmar y Crear Pedido</span>
                </button>
                <p class="checkout-disclaimer">
                  <i class="fas fa-shield-alt"></i>
                  Tus datos están seguros. Al confirmar, recibirás los detalles por WhatsApp y correo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
    this.setupListeners();
    this.renderPaymentInfo();
  }

  setupListeners() {
    this.modal.querySelector('.checkout-close').addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.close(); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    this.modal.querySelectorAll('.payment-option').forEach(opt => {
      opt.addEventListener('click', () => {
        this.selectedPaymentMethod = opt.dataset.method;
        this.modal.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        opt.querySelector('input').checked = true;
        this.renderPaymentInfo();
      });
    });

    this.modal.querySelector('#btnPlaceOrder').addEventListener('click', () => this.submitOrder());
  }

  renderPaymentInfo() {
    const info = this.modal.querySelector('#paymentInfo');
    if (!info) return;

    if (this.selectedPaymentMethod === 'transfer') {
      info.innerHTML = `
        <div class="payment-details">
          <h4><i class="fas fa-info-circle"></i> Datos para Transferencia</h4>
          <div class="transfer-data">
            <div class="transfer-row"><span>Banco:</span><strong>Bancolombia</strong></div>
            <div class="transfer-row"><span>Tipo de Cuenta:</span><strong>Ahorros</strong></div>
            <div class="transfer-row"><span>Número:</span><strong>123-4567890-12</strong></div>
            <div class="transfer-row"><span>Titular:</span><strong>Punto Digital SAS</strong></div>
            <div class="transfer-row"><span>NIT:</span><strong>123.456.789-0</strong></div>
          </div>
          <p class="payment-hint">
            <i class="fas fa-lightbulb"></i>
            Después de confirmar el pedido, envía el comprobante de pago por WhatsApp para agilizar la verificación.
          </p>
        </div>
      `;
    } else {
      info.innerHTML = `
        <div class="payment-details">
          <h4><i class="fas fa-info-circle"></i> Información Contra Entrega</h4>
          <ul class="cod-info-list">
            <li><i class="fas fa-check"></i> Pago en efectivo al recibir el pedido</li>
            <li><i class="fas fa-check"></i> Verificaremos disponibilidad en tu zona</li>
            <li><i class="fas fa-check"></i> Te contactaremos para confirmar la entrega</li>
            <li><i class="fas fa-check"></i> Prepara el dinero exacto si es posible</li>
          </ul>
          <p class="payment-hint">
            <i class="fas fa-exclamation-triangle"></i>
            Este servicio está sujeto a cobertura geográfica. Confirmaremos contigo antes del envío.
          </p>
        </div>
      `;
    }
  }

  open(items = [], total = 0) {
    this.currentItems = items.length ? items : (window.cartService?.items || []);
    this.currentTotal = total > 0 ? total : (window.cartService?.getTotal() || 0);

    this.renderSummary();
    this.resetForm();
    this.modal.classList.add('active');
    this.modal.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.modal.classList.remove('active');
    this.modal.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  renderSummary() {
    const itemsContainer = this.modal.querySelector('#summaryItems');
    if (!itemsContainer) return;

    itemsContainer.innerHTML = this.currentItems.map(item => `
      <div class="summary-item">
        <img src="${Helpers.sanitizeUrl(item.image, 'https://placehold.co/50x50?text=?')}"
             alt="${Helpers.escapeAttr(item.name)}"
             onerror="this.src='https://placehold.co/50x50?text=?'">
        <div class="summary-item-info">
          <p class="summary-item-name">${Helpers.escapeHtml(item.name)}</p>
          <p class="summary-item-qty">x${item.qty}</p>
        </div>
        <span class="summary-item-price">${Formatters.formatPrice(parseInt(item.price) * item.qty)}</span>
      </div>
    `).join('');

    const subtotal = this.currentItems.reduce((sum, i) => sum + parseInt(i.price) * i.qty, 0);
    this.modal.querySelector('#summarySubtotal').textContent = Formatters.formatPrice(subtotal);
    this.modal.querySelector('#summaryTotal').textContent = Formatters.formatPrice(this.currentTotal);
  }

  resetForm() {
    const form = this.modal.querySelector('#checkoutForm');
    if (form) form.reset();
    this.modal.querySelectorAll('.checkout-error').forEach(e => e.textContent = '');
    this.selectedPaymentMethod = 'transfer';
    this.modal.querySelectorAll('.payment-option').forEach(o => {
      o.classList.toggle('selected', o.dataset.method === 'transfer');
      if (o.dataset.method === 'transfer') o.querySelector('input').checked = true;
    });
    this.renderPaymentInfo();
  }

  validateForm(data) {
    const errors = {};
    if (!data.fullName || data.fullName.trim().length < 3) errors.fullName = 'Ingresa tu nombre completo';
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Ingresa un correo válido';
    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) errors.phone = 'Ingresa un teléfono válido (10 dígitos)';
    if (!data.department) errors.department = 'Selecciona un departamento';
    if (!data.city || data.city.trim().length < 3) errors.city = 'Ingresa tu ciudad';
    if (!data.address || data.address.trim().length < 8) errors.address = 'Ingresa una dirección completa';

    Object.keys(errors).forEach(field => {
      const el = this.modal.querySelector(`[data-error="${field}"]`);
      if (el) el.textContent = errors[field];
    });

    this.modal.querySelectorAll('.checkout-field input, .checkout-field select').forEach(input => {
      const field = input.name || input.id.replace('ch_', '');
      input.classList.toggle('has-error', !!errors[field]);
    });

    return Object.keys(errors).length === 0;
  }

  getFormData() {
    const form = this.modal.querySelector('#checkoutForm');
    return {
      fullName: form.fullName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      documentType: form.documentType.value,
      document: form.document.value.trim(),
      department: form.department.value,
      city: form.city.value.trim(),
      address: form.address.value.trim(),
      notes: form.notes.value.trim()
    };
  }

  async submitOrder() {
    const data = this.getFormData();
    if (!this.validateForm(data)) {
      notificationService.error('Por favor corrige los errores en el formulario');
      this.modal.querySelector('.checkout-col-form').scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!this.currentItems.length) {
      notificationService.error('No hay productos en el pedido');
      return;
    }

    const btn = this.modal.querySelector('#btnPlaceOrder');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Procesando...</span>';
    btn.disabled = true;

    try {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Guardando pedido en la nube...</span>';
      const order = await window.orderService.createOrder({
        items: this.currentItems,
        customerData: data,
        paymentMethod: this.selectedPaymentMethod,
        total: this.currentTotal
      });

      if (window.cartService) {
        window.cartService.closeDrawer();
        window.cartService.clear();
      }

      this.showSuccessModal(order);
      notificationService.success(`¡Pedido ${order.id} creado exitosamente!`);

    } catch (e) {
      console.error('Error creando pedido:', e);
      notificationService.error('Error al crear el pedido. Intenta de nuevo.');
    } finally {
      btn.innerHTML = originalContent;
      btn.disabled = false;
    }
  }

  showSuccessModal(order) {
    this.close();
    const paymentLabel = window.orderService.PAYMENT_LABELS[order.paymentMethod];

    const successOverlay = document.createElement('div');
    successOverlay.className = 'checkout-success-overlay';
    successOverlay.innerHTML = `
      <div class="checkout-success-card">
        <div class="success-icon"><i class="fas fa-check-circle"></i></div>
        <h2>¡Pedido Creado Exitosamente!</h2>
        <p class="success-order-id">Número de Pedido: <strong>${order.id}</strong></p>
        <div class="success-details">
          <div class="success-row"><i class="fas fa-user"></i><span>${order.customer.fullName}</span></div>
          <div class="success-row"><i class="fas fa-phone"></i><span>${order.customer.phone}</span></div>
          <div class="success-row"><i class="fas fa-money-bill-wave"></i><span>${paymentLabel}</span></div>
          <div class="success-row"><i class="fas fa-map-marker-alt"></i><span>${order.customer.city} - ${order.customer.address}</span></div>
          <div class="success-row success-total"><i class="fas fa-tags"></i><span>${Formatters.formatPrice(order.total)}</span></div>
        </div>
        <div class="success-message">
          <i class="fab fa-whatsapp"></i>
          <p>Te hemos enviado los detalles por WhatsApp. <br>Nuestro equipo se pondrá en contacto contigo muy pronto.</p>
        </div>
        <div class="success-actions">
          <button class="success-btn success-btn-primary" id="successWhatsappBtn">
            <i class="fab fa-whatsapp"></i> Abrir WhatsApp
          </button>
          <button class="success-btn success-btn-secondary" id="successCloseBtn">
            <i class="fas fa-home"></i> Volver al Inicio
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(successOverlay);

    const footer = window.siteData?.getSection?.('footer') || {};
    const adminPhone = String(footer.whatsapp || footer.phone || '+573012345678').replace(/\D/g, '');
    const msg = `Hola, acabo de realizar el pedido ${order.id}. Quedo atento(a) a la confirmación.`;

    successOverlay.querySelector('#successWhatsappBtn').addEventListener('click', () => {
      window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    });
    successOverlay.querySelector('#successCloseBtn').addEventListener('click', () => {
      successOverlay.remove();
      window.location.href = 'index.html';
    });
    successOverlay.addEventListener('click', (e) => {
      if (e.target === successOverlay) successOverlay.remove();
    });
  }

  injectStyles() {
    if (document.getElementById('checkout-styles')) return;
    const style = document.createElement('style');
    style.id = 'checkout-styles';
    style.textContent = `
      /* ── OVERLAY ── */
      .checkout-overlay {
        position: fixed; inset: 0; z-index: 10002;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; visibility: hidden;
        transition: all 0.3s ease; padding: 16px;
      }
      .checkout-overlay.active { opacity: 1; visibility: visible; }

      .checkout-container {
        background: var(--black-card, #121212);
        width: 100%; max-width: 1180px; max-height: 94vh;
        border-radius: 20px; overflow: hidden; position: relative;
        border: 1px solid rgba(212,168,67,0.25);
        box-shadow: 0 30px 80px rgba(0,0,0,0.6);
        display: flex; flex-direction: column;
        transform: translateY(20px) scale(0.97);
        transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
      }
      .checkout-overlay.active .checkout-container { transform: translateY(0) scale(1); }

      .checkout-close {
        position: absolute; top: 16px; right: 16px; z-index: 20;
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1);
        color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: all 0.25s ease;
      }
      .checkout-close:hover { background: var(--gold-primary); color: #000; transform: rotate(90deg); }

      /* ── HEADER ── */
      .checkout-header {
        padding: 22px 32px;
        background: linear-gradient(135deg, rgba(212,168,67,0.08), transparent);
        border-bottom: 1px solid rgba(212,168,67,0.15);
        display: flex; align-items: center; gap: 16px;
      }
      .checkout-header-icon {
        width: 52px; height: 52px; border-radius: 14px;
        background: linear-gradient(135deg, var(--gold-primary), #c59737);
        display: flex; align-items: center; justify-content: center;
        color: #0a0a0a; font-size: 22px; box-shadow: 0 4px 14px rgba(212,168,67,0.3);
      }
      .checkout-header h2 { margin: 0; font-size: 22px; color: var(--text-white, #fff); font-weight: 700; }
      .checkout-subtitle { margin: 4px 0 0; font-size: 13px; color: var(--text-gray, #aaa); }

      /* ── BODY ── */
      .checkout-body {
        flex: 1; overflow-y: auto; padding: 24px 32px 32px;
      }
      .checkout-body::-webkit-scrollbar { width: 6px; }
      .checkout-body::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.3); border-radius: 3px; }

      .checkout-columns {
        display: grid; grid-template-columns: 1.35fr 1fr; gap: 28px;
      }

      /* ── SECTIONS ── */
      .checkout-section { margin-bottom: 26px; }
      .checkout-section h3 {
        margin: 0 0 16px; font-size: 15px; font-weight: 700;
        color: var(--gold-primary); text-transform: uppercase; letter-spacing: 0.6px;
        display: flex; align-items: center; gap: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(212,168,67,0.12);
      }
      .checkout-section h3 i { font-size: 14px; }

      .checkout-grid-2 {
        display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
      }
      .checkout-span-2 { grid-column: span 2; }

      .checkout-field label {
        display: block; margin-bottom: 6px;
        font-size: 12.5px; font-weight: 600; color: var(--text-gray, #bbb);
      }
      .checkout-field input,
      .checkout-field select,
      .checkout-field textarea {
        width: 100%; padding: 11px 14px;
        background: var(--black-light, #1e1e1e);
        border: 1.5px solid rgba(212,168,67,0.12);
        border-radius: 10px; color: var(--text-white, #fff);
        font-family: inherit; font-size: 13.5px;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }
      .checkout-field input::placeholder,
      .checkout-field textarea::placeholder { color: rgba(255,255,255,0.3); }
      .checkout-field input:focus,
      .checkout-field select:focus,
      .checkout-field textarea:focus {
        outline: none;
        border-color: var(--gold-primary);
        box-shadow: 0 0 0 3px rgba(212,168,67,0.12);
        background: var(--black-bg, #181818);
      }
      .checkout-field input.has-error,
      .checkout-field select.has-error {
        border-color: #dc3545;
        box-shadow: 0 0 0 3px rgba(220,53,69,0.12);
      }
      .checkout-field textarea { resize: vertical; min-height: 54px; }
      .checkout-error {
        display: block; margin-top: 5px;
        font-size: 11.5px; color: #dc3545; font-weight: 500;
        min-height: 14px;
      }

      /* ── PAYMENT OPTIONS ── */
      .payment-methods { display: flex; flex-direction: column; gap: 12px; }
      .payment-option {
        cursor: pointer; border-radius: 14px; overflow: hidden;
        border: 2px solid rgba(212,168,67,0.12);
        transition: all 0.25s ease;
      }
      .payment-option input { display: none; }
      .payment-option:hover { border-color: rgba(212,168,67,0.3); }
      .payment-option.selected {
        border-color: var(--gold-primary);
        box-shadow: 0 0 0 3px rgba(212,168,67,0.12);
      }
      .payment-option-content {
        display: flex; align-items: center; gap: 14px;
        padding: 16px 18px;
        background: var(--black-light, #1e1e1e);
      }
      .payment-icon {
        width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
        background: linear-gradient(135deg, rgba(212,168,67,0.18), rgba(212,168,67,0.06));
        color: var(--gold-primary); display: flex; align-items: center; justify-content: center;
        font-size: 20px;
      }
      .payment-option-content > div:nth-child(2) { flex: 1; min-width: 0; }
      .payment-option-content h4 {
        margin: 0 0 4px; font-size: 14.5px; color: var(--text-white, #fff); font-weight: 700;
      }
      .payment-option-content p {
        margin: 0; font-size: 12.5px; color: var(--text-gray, #aaa); line-height: 1.5;
      }
      .payment-check {
        width: 26px; height: 26px; border-radius: 50%;
        background: rgba(212,168,67,0.12);
        color: transparent; display: flex; align-items: center; justify-content: center;
        font-size: 12px; flex-shrink: 0;
        transition: all 0.2s ease;
      }
      .payment-option.selected .payment-check {
        background: var(--gold-primary); color: #000;
      }

      /* ── PAYMENT INFO ── */
      .payment-info { margin-top: 16px; }
      .payment-details {
        padding: 18px; border-radius: 12px;
        background: rgba(212,168,67,0.05);
        border: 1px solid rgba(212,168,67,0.15);
      }
      .payment-details h4 {
        margin: 0 0 14px; font-size: 14px; font-weight: 700;
        color: var(--text-white, #fff);
        display: flex; align-items: center; gap: 8px;
      }
      .payment-details h4 i { color: var(--gold-primary); }

      .transfer-data { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
      .transfer-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 9px 12px;
        background: var(--black-bg, #181818);
        border-radius: 8px;
      }
      .transfer-row span { font-size: 12.5px; color: var(--text-gray, #aaa); }
      .transfer-row strong { font-size: 13px; color: var(--text-white, #fff); font-weight: 700; }

      .cod-info-list { list-style: none; padding: 0; margin: 0 0 14px; display: flex; flex-direction: column; gap: 8px; }
      .cod-info-list li {
        display: flex; align-items: center; gap: 10px;
        font-size: 13px; color: var(--text-white, #fff);
        padding: 8px 12px;
        background: var(--black-bg, #181818);
        border-radius: 8px;
      }
      .cod-info-list li i { color: #198754; font-size: 12px; }

      .payment-hint {
        margin: 0; padding: 12px 14px; border-radius: 8px;
        background: rgba(13,110,253,0.08);
        border: 1px solid rgba(13,110,253,0.2);
        color: var(--text-white, #fff); font-size: 12.5px; line-height: 1.6;
        display: flex; gap: 8px;
      }
      .payment-hint i { color: #0d6efd; flex-shrink: 0; margin-top: 2px; }

      /* ── SUMMARY CARD ── */
      .checkout-summary-card {
        position: sticky; top: 16px;
        background: linear-gradient(180deg, var(--black-light, #1e1e1e) 0%, var(--black-card, #121212) 100%);
        border: 1px solid rgba(212,168,67,0.2);
        border-radius: 16px; overflow: hidden;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      }
      .summary-header {
        padding: 18px 20px;
        background: rgba(212,168,67,0.08);
        border-bottom: 1px solid rgba(212,168,67,0.15);
      }
      .summary-header h3 {
        margin: 0; font-size: 15px; font-weight: 700;
        color: var(--gold-primary);
        display: flex; align-items: center; gap: 10px;
      }

      .summary-items {
        max-height: 220px; overflow-y: auto;
        padding: 16px 20px;
        display: flex; flex-direction: column; gap: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .summary-items::-webkit-scrollbar { width: 4px; }
      .summary-items::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.25); border-radius: 2px; }

      .summary-item {
        display: grid; grid-template-columns: 44px 1fr auto; gap: 12px;
        align-items: center;
      }
      .summary-item img {
        width: 44px; height: 44px; object-fit: cover; border-radius: 8px;
        background: var(--black-bg, #181818);
      }
      .summary-item-info { min-width: 0; }
      .summary-item-name {
        margin: 0; font-size: 12.5px; font-weight: 600; color: var(--text-white, #fff);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .summary-item-qty { margin: 2px 0 0; font-size: 11.5px; color: var(--text-gray, #999); }
      .summary-item-price { font-size: 12.5px; font-weight: 700; color: var(--gold-primary); white-space: nowrap; }

      .summary-totals { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }
      .summary-row {
        display: flex; justify-content: space-between; align-items: center;
        font-size: 13px; color: var(--text-gray, #bbb);
      }
      .summary-row span:last-child { color: var(--text-white, #fff); font-weight: 600; }
      .summary-free { color: #198754 !important; font-weight: 700 !important; }
      .summary-divider {
        height: 1px; background: rgba(255,255,255,0.08); margin: 4px 0;
      }
      .summary-total-row { font-size: 14px; padding-top: 4px; }
      .summary-total-row span:first-child { color: var(--text-white, #fff); font-weight: 700; font-size: 15px; }
      .summary-total-row span:last-child {
        color: var(--gold-primary) !important; font-weight: 800 !important; font-size: 22px !important;
      }

      .checkout-place-order {
        margin: 4px 20px 16px;
        width: calc(100% - 40px);
        padding: 15px;
        background: linear-gradient(135deg, var(--gold-primary) 0%, #c59737 100%);
        color: #0a0a0a;
        border: none; border-radius: 12px;
        font-family: inherit; font-size: 15px; font-weight: 800;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        box-shadow: 0 6px 20px rgba(212,168,67,0.3);
        transition: all 0.25s ease;
      }
      .checkout-place-order:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(212,168,67,0.4); }
      .checkout-place-order:disabled { opacity: 0.7; cursor: not-allowed; }

      .checkout-disclaimer {
        margin: 0 20px 20px; padding: 12px 14px;
        background: rgba(25,135,84,0.08);
        border: 1px solid rgba(25,135,84,0.18);
        border-radius: 10px;
        font-size: 11.5px; color: var(--text-gray, #bbb); line-height: 1.6;
        display: flex; gap: 8px; align-items: flex-start;
      }
      .checkout-disclaimer i { color: #198754; flex-shrink: 0; margin-top: 2px; }

      /* ── SUCCESS MODAL ── */
      .checkout-success-overlay {
        position: fixed; inset: 0; z-index: 10003;
        background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center; padding: 16px;
        animation: fadeIn 0.3s ease;
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

      .checkout-success-card {
        background: var(--black-card, #121212);
        border: 1px solid rgba(212,168,67,0.25);
        border-radius: 24px; padding: 36px 32px 32px;
        max-width: 480px; width: 100%;
        text-align: center;
        box-shadow: 0 30px 80px rgba(0,0,0,0.6);
        animation: popIn 0.4s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

      .success-icon {
        width: 86px; height: 86px; margin: 0 auto 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #198754, #146c43);
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-size: 46px;
        box-shadow: 0 10px 30px rgba(25,135,84,0.4);
        animation: pulse 2s ease infinite;
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      .checkout-success-card h2 {
        margin: 0 0 8px; font-size: 24px; color: var(--text-white, #fff); font-weight: 800;
      }
      .success-order-id {
        margin: 0 0 22px; padding: 10px 18px;
        display: inline-block;
        background: rgba(212,168,67,0.1);
        border: 1px solid rgba(212,168,67,0.2);
        border-radius: 10px;
        color: var(--gold-primary); font-size: 14px;
      }
      .success-details {
        background: var(--black-light, #1e1e1e);
        border-radius: 14px; padding: 18px;
        margin-bottom: 20px; text-align: left;
        display: flex; flex-direction: column; gap: 10px;
      }
      .success-row {
        display: flex; align-items: center; gap: 12px;
        font-size: 13px; color: var(--text-white, #fff);
      }
      .success-row i {
        width: 28px; height: 28px; border-radius: 8px;
        background: rgba(212,168,67,0.12);
        color: var(--gold-primary);
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; flex-shrink: 0;
      }
      .success-row.success-total i { background: rgba(25,135,84,0.12); color: #198754; }
      .success-row.success-total span { font-weight: 800; color: #198754; font-size: 15px; }

      .success-message {
        padding: 14px 18px;
        background: rgba(37,211,102,0.08);
        border: 1px solid rgba(37,211,102,0.2);
        border-radius: 12px;
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 22px;
        text-align: left;
      }
      .success-message i { font-size: 28px; color: #25D366; flex-shrink: 0; }
      .success-message p { margin: 0; font-size: 13px; color: var(--text-white, #fff); line-height: 1.6; }

      .success-actions { display: flex; gap: 12px; flex-wrap: wrap; }
      .success-btn {
        flex: 1; min-width: 140px;
        padding: 13px 18px;
        border: none; border-radius: 12px;
        font-family: inherit; font-size: 13.5px; font-weight: 700;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: all 0.25s ease;
      }
      .success-btn-primary {
        background: linear-gradient(135deg, #25D366, #128C7E);
        color: #fff;
        box-shadow: 0 6px 20px rgba(37,211,102,0.3);
      }
      .success-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(37,211,102,0.4); }
      .success-btn-secondary {
        background: rgba(212,168,67,0.1);
        color: var(--gold-primary);
        border: 1px solid rgba(212,168,67,0.25);
      }
      .success-btn-secondary:hover { background: rgba(212,168,67,0.18); transform: translateY(-2px); }

      /* ── LIGHT THEME ── */
      [data-theme="light"] .checkout-container { background: #ffffff; }
      [data-theme="light"] .checkout-body { background: #fafafa; }
      [data-theme="light"] .checkout-field input,
      [data-theme="light"] .checkout-field select,
      [data-theme="light"] .checkout-field textarea {
        background: #fff; border-color: #e0e0e0; color: #1a1a1a;
      }
      [data-theme="light"] .checkout-field input::placeholder { color: #999; }
      [data-theme="light"] .checkout-field input:focus { background: #fafafa; }
      [data-theme="light"] .payment-option-content,
      [data-theme="light"] .transfer-row,
      [data-theme="light"] .cod-info-list li { background: #f5f5f5; }
      [data-theme="light"] .payment-details { background: #faf9f5; }
      [data-theme="light"] .checkout-summary-card { background: #ffffff; }
      [data-theme="light"] .summary-totals .summary-row { color: #666; }
      [data-theme="light"] .summary-item-name { color: #1a1a1a; }
      [data-theme="light"] .checkout-success-card { background: #ffffff; }
      [data-theme="light"] .success-details,
      [data-theme="light"] .transfer-row { background: #f5f5f5; }
      [data-theme="light"] .checkout-header h2,
      [data-theme="light"] .success-message p,
      [data-theme="light"] .cod-info-list li,
      [data-theme="light"] .transfer-row strong,
      [data-theme="light"] .success-row,
      [data-theme="light"] .payment-option-content p,
      [data-theme="light"] .checkout-subtitle,
      [data-theme="light"] .checkout-disclaimer,
      [data-theme="light"] .payment-hint,
      [data-theme="light"] .summary-row { color: #333; }

      /* ── RESPONSIVE ── */
      @media (max-width: 960px) {
        .checkout-columns { grid-template-columns: 1fr; gap: 20px; }
        .checkout-summary-card { position: static; }
        .checkout-header { padding: 18px 20px; }
        .checkout-body { padding: 18px 20px 24px; }
      }
      @media (max-width: 560px) {
        .checkout-overlay { padding: 0; align-items: stretch; }
        .checkout-container { max-height: 100vh; border-radius: 0; }
        .checkout-grid-2 { grid-template-columns: 1fr; }
        .checkout-span-2 { grid-column: span 1; }
        .checkout-header { padding: 16px; }
        .checkout-body { padding: 14px 16px 20px; }
        .payment-option-content { padding: 14px; gap: 12px; }
        .checkout-success-card { padding: 28px 20px 24px; border-radius: 20px; }
        .checkout-success-card h2 { font-size: 20px; }
        .success-actions { flex-direction: column; }
        .success-btn { width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }
}

window.checkoutModal = new CheckoutModal();
