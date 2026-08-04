/**
 * Gestión de Pedidos en Panel de Administración
 */
(function () {
  let OS = null;
  let _inited = false;
  let _bootTimer = null;

  function boot() {
    if (_inited) { if (_bootTimer) clearInterval(_bootTimer); return true; }
    OS = window.orderService;
    if (!OS) return false;
    const panel = window.adminPanel;
    if (!panel) return false;
    if (!document.body) return false;
    try {
      initOrdersAdmin(panel);
      _inited = true;
      if (_bootTimer) { clearInterval(_bootTimer); _bootTimer = null; }
      console.log('[AdminOrders] Inicializado OK');
      return true;
    } catch (err) {
      console.error('[AdminOrders] Error en initOrdersAdmin:', err);
      return false;
    }
  }

  if (!boot()) {
    const attempts = { count: 0 };
    _bootTimer = setInterval(() => {
      attempts.count++;
      if (boot() || attempts.count > 80) {
        if (_bootTimer) { clearInterval(_bootTimer); _bootTimer = null; }
      }
    }, 125);
    document.addEventListener('DOMContentLoaded', () => { boot(); }, { once: true });
  }

  function initOrdersAdmin(adminPanel) {
    adminPanel._currentOrderFilter = 'all';
    adminPanel._currentOrderSearch = '';

    if (!adminPanel._ordersOriginalLoadAll) {
      adminPanel._ordersOriginalLoadAll = adminPanel.loadAllSections.bind(adminPanel);
      adminPanel.loadAllSections = function () {
        adminPanel._ordersOriginalLoadAll();
        this.refreshOrders();
      };
    }
    if (!adminPanel._ordersOriginalUpdateStats) {
      adminPanel._ordersOriginalUpdateStats = adminPanel.updateStats.bind(adminPanel);
      adminPanel.updateStats = function () {
        adminPanel._ordersOriginalUpdateStats();
        try { this.updateOrderStats(); } catch (e) { console.warn('[AdminOrders] updateOrderStats error:', e); }
      };
    }

    adminPanel.updateOrderStats = updateOrderStats;
    adminPanel.refreshOrders = refreshOrders;
    adminPanel.renderOrders = renderOrders;
    adminPanel.filterOrders = filterOrders;
    adminPanel.searchOrders = searchOrders;
    adminPanel.openOrderDetail = openOrderDetail;
    adminPanel.changeOrderStatus = changeOrderStatus;
    adminPanel._onStatusStepClick = _onStatusStepClick;
    adminPanel.verifyOrderPayment = verifyOrderPayment;
    adminPanel.setShippingInfo = setShippingInfo;
    adminPanel.sendOrderStatusToWhatsApp = sendOrderStatusToWhatsApp;
    adminPanel._sendShippingWhatsApp = _sendShippingWhatsApp;
    adminPanel.deleteOrder = deleteOrder;

    setupDelegatedEvents();

    refreshOrders();

    if (OS && typeof OS.subscribe === 'function') {
      OS.subscribe(() => { try { refreshOrders(); } catch (e) {} });
    }
  }

  function setupDelegatedEvents() {
    ['orderSearchInput', 'ordersSearchInput'].forEach(id => {
      const input = document.getElementById(id);
      if (input && !input._bound) {
        input._bound = true;
        input.addEventListener('input', (e) => searchOrders(e.target.value));
      }
    });

    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-order-action]');
      if (action) {
        const act = action.dataset.orderAction;
        const orderId = action.dataset.orderId;
        if (!orderId) return;
        if (act === 'open-detail') openOrderDetail(orderId);
        else if (act === 'delete') deleteOrder(orderId);
        else if (act === 'wa-customer') sendOrderStatusToWhatsApp(orderId, 'customer');
        return;
      }
      const stop = e.target.closest('[data-order-stop]');
      if (stop) return;
      const row = e.target.closest('tr.order-row[data-order-action="open-detail"]');
      if (row) {
        const oid = row.dataset.orderId;
        if (oid) openOrderDetail(oid);
      }
    });
  }

  function updateOrderStats() {
    const s = OS ? OS.getStats() : { total: 0, pending: 0, verifying: 0, packing: 0, shipped: 0, completed: 0, cancelled: 0, totalRevenue: 0 };
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-orders-pending', s.pending);
    set('stat-orders-verifying', s.verifying);
    set('stat-orders-packing', s.packing);
    set('stat-orders-shipped', s.shipped);
    set('stat-orders-completed', s.completed);
    set('stat-orders-revenue', Formatters.formatPrice(s.totalRevenue));
  }

  function refreshOrders() {
    updateOrderStats();
    renderOrders();
  }

  function getFilteredOrders() {
    let orders = OS ? OS.orders : [];
    if (window.adminPanel._currentOrderFilter && window.adminPanel._currentOrderFilter !== 'all') {
      orders = orders.filter(o => o.status === window.adminPanel._currentOrderFilter);
    }
    if (window.adminPanel._currentOrderSearch) {
      const q = window.adminPanel._currentOrderSearch.toLowerCase();
      orders = orders.filter(o =>
        o.id.toLowerCase().includes(q) ||
        (o.customer?.fullName || '').toLowerCase().includes(q) ||
        (o.customer?.email || '').toLowerCase().includes(q) ||
        (o.customer?.phone || '').includes(q)
      );
    }
    return orders;
  }

  function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    const orders = getFilteredOrders();

    if (!orders.length) {
      tbody.innerHTML = `
        <tr class="orders-empty-row">
          <td colspan="8">
            <div class="orders-empty">
              <i class="fas fa-box-open"></i>
              <p>No hay pedidos para mostrar</p>
              <span>Realiza un pedido o cambia los filtros de búsqueda</span>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => {
      const statusColor = OS.STATUS_COLORS[o.status] || '#999';
      const statusLabel = OS.STATUS_LABELS[o.status] || o.status;
      const paymentLabel = OS.PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod;
      const paymentIcon = o.paymentMethod === 'transfer' ? 'fa-university' : 'fa-hand-holding-usd';
      const transferBadge = (o.paymentMethod === 'transfer' && !o.payment.verified)
        ? `<span class="order-pay-badge unverified" title="Pago sin verificar"><i class="fas fa-exclamation-triangle"></i> Sin verificar</span>`
        : (o.paymentMethod === 'transfer' && o.payment.verified)
          ? `<span class="order-pay-badge verified" title="Pago verificado"><i class="fas fa-check-circle"></i> Verificado</span>`
          : `<span class="order-pay-badge cod" title="Contra entrega"><i class="fas fa-cash-register"></i> Contra entrega</span>`;

      const date = new Date(o.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      return `
        <tr class="order-row" data-order-action="open-detail" data-order-id="${o.id}" style="cursor:pointer">
          <td>
            <div class="order-cell-id">
              <strong>${o.id}</strong>
              ${transferBadge}
            </div>
          </td>
          <td>
            <div class="order-cell-customer">
              <div class="order-avatar"><i class="fas fa-user"></i></div>
              <div>
                <strong>${Helpers.escapeHtml(o.customer?.fullName || '-')}</strong>
                <small><i class="fas fa-phone"></i> ${Helpers.escapeHtml(o.customer?.phone || '-')}</small>
              </div>
            </div>
          </td>
          <td>
            <div class="order-cell-items">
              <span class="order-items-count"><strong>${o.items?.length || 0}</strong> producto(s)</span>
              <small>${o.items?.slice(0, 2).map(i => Helpers.escapeHtml(i.name)).join(' • ') || ''}${o.items?.length > 2 ? '...' : ''}</small>
            </div>
          </td>
          <td>
            <span class="order-payment">
              <i class="fas ${paymentIcon}"></i> ${paymentLabel}
            </span>
          </td>
          <td><strong class="order-total">${Formatters.formatPrice(o.total)}</strong></td>
          <td>
            <span class="order-status-badge" style="--c:${statusColor}">
              <span class="order-status-dot"></span>${statusLabel}
            </span>
          </td>
          <td><small>${date}</small></td>
          <td data-order-stop="1">
            <div class="order-row-actions">
              <button type="button" class="order-act-btn order-act-view" title="Ver pedido"
                      data-order-action="open-detail" data-order-id="${o.id}">
                <i class="fas fa-eye"></i>
              </button>
              <button type="button" class="order-act-btn order-act-whatsapp" title="WhatsApp Cliente"
                      data-order-action="wa-customer" data-order-id="${o.id}">
                <i class="fab fa-whatsapp"></i>
              </button>
              <button type="button" class="order-act-btn order-act-del" title="Eliminar"
                      data-order-action="delete" data-order-id="${o.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  function filterOrders(btn, status) {
    document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window.adminPanel._currentOrderFilter = status;
    renderOrders();
  }

  function searchOrders(query) {
    window.adminPanel._currentOrderSearch = query || '';
    renderOrders();
  }

  function openOrderDetail(orderId) {
    try {
      const order = OS.getOrderById(orderId);
      if (!order) { notificationService.error('Pedido no encontrado'); console.warn('[AdminOrders] Pedido no existe:', orderId); return; }
      const modal = document.getElementById('orderDetailModal');
      const body = document.getElementById('orderDetailBody');
      if (!modal || !body) {
        console.error('[AdminOrders] Elementos del modal no existen');
        notificationService.error('Error al abrir el modal de detalle');
        return;
      }
      document.getElementById('detailOrderId').textContent = order.id;

    const statusColor = OS.STATUS_COLORS[order.status] || '#999';
    const statusLabel = OS.STATUS_LABELS[order.status] || order.status;
    const paymentLabel = OS.PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;

    const paymentUnverifiedAlert = (order.paymentMethod === 'transfer' && !order.payment.verified) ? `
      <div class="alert-box alert-warn">
        <strong>⚠️ El pago NO se ha reflejado en la cuenta</strong>
        No hemos recibido confirmación del banco. Esto implica que:
        <ul>
          <li>No podrás empaquetar ni enviar el pedido hasta confirmar la transacción.</li>
          <li>Si intentas avanzar el estado manualmente, se te pedirá confirmación explícita.</li>
          <li>Contacta al cliente por WhatsApp para pedir el comprobante y evitar demoras.</li>
        </ul>
      </div>
      <button class="wa-btn wa-btn-cust" style="margin:-4px 0 12px"
              onclick="adminPanel.sendOrderStatusToWhatsApp('${order.id}','customer')">
        <i class="fab fa-whatsapp"></i> Pedir comprobante a ${Helpers.escapeHtml(order.customer?.fullName || 'cliente')}
      </button>
    ` : '';

    const transferInfo = order.paymentMethod === 'transfer' ? `
      <div class="detail-section">
        <h4><i class="fas fa-money-check-alt"></i> Información de Pago (Transferencia)</h4>
        ${paymentUnverifiedAlert}
        <div class="detail-info-row">
          <span>Pago verificado:</span>
          <strong class="${order.payment.verified ? 'txt-success' : 'txt-warning'}">
            ${order.payment.verified ? '✅ Sí' : '⚠️ Pendiente de verificación'}
          </strong>
        </div>
        ${order.payment.verifiedAt ? `<div class="detail-info-row"><span>Fecha verificación:</span><strong>${new Date(order.payment.verifiedAt).toLocaleString('es-CO')}</strong></div>` : ''}
        ${order.payment.transactionReference ? `<div class="detail-info-row"><span>Referencia:</span><strong>${Helpers.escapeHtml(order.payment.transactionReference)}</strong></div>` : ''}
        <div class="detail-form-row">
          <label for="verifyRef">Número de referencia / Comprobante</label>
          <input type="text" id="verifyRef" placeholder="Número de transacción o comprobante" value="${Helpers.escapeAttr(order.payment.transactionReference || '')}">
        </div>
        <button class="ap-btn-save" style="width:auto;margin-top:10px" ${order.payment.verified ? 'disabled' : ''}
                onclick="adminPanel.verifyOrderPayment('${order.id}', document.getElementById('verifyRef').value)">
          <i class="fas fa-check-circle"></i> ${order.payment.verified ? 'Pago ya verificado' : 'Marcar pago como verificado'}
        </button>
      </div>
    ` : `
      <div class="detail-section">
        <h4><i class="fas fa-hand-holding-usd"></i> Pago Contra Entrega</h4>
        <p class="detail-hint">El cliente pagará en efectivo al recibir el pedido. Verifica la cobertura antes de enviar.</p>
      </div>
    `;

    const shippingInfo = `
      <div class="detail-section">
        <h4><i class="fas fa-truck"></i> Información de Envío</h4>
        <div class="detail-grid-2">
          <div class="detail-form-row">
            <label for="shipCarrier">Transportadora / Servicio de entrega</label>
            <select id="shipCarrier">
              <option value="">Seleccionar transportadora...</option>
              <option value="Servientrega" ${order.shipping.carrier === 'Servientrega' ? 'selected' : ''}>Servientrega</option>
              <option value="Interrapidísimo" ${order.shipping.carrier === 'Interrapidísimo' ? 'selected' : ''}>Interrapidísimo</option>
              <option value="Coordinadora" ${order.shipping.carrier === 'Coordinadora' ? 'selected' : ''}>Coordinadora</option>
              <option value="Deprisa" ${order.shipping.carrier === 'Deprisa' ? 'selected' : ''}>Deprisa / ENVIA</option>
              <option value="TCC" ${order.shipping.carrier === 'TCC' ? 'selected' : ''}>TCC</option>
              <option value="Censa" ${order.shipping.carrier === 'Censa' ? 'selected' : ''}>Censa</option>
              <option value="Motorboy / Mensajería" ${order.shipping.carrier === 'Motorboy / Mensajería' ? 'selected' : ''}>Motorboy / Mensajería local</option>
              <option value="Otro" ${order.shipping.carrier === 'Otro' ? 'selected' : ''}>Otro</option>
            </select>
          </div>
          <div class="detail-form-row">
            <label for="shipTracking">Número de Guía</label>
            <input type="text" id="shipTracking" value="${Helpers.escapeAttr(order.shipping.trackingNumber || '')}" placeholder="Número de guía de envío">
          </div>
        </div>
        <div class="detail-actions-inline">
          <button class="ap-btn-add" style="width:auto"
                  onclick="adminPanel.setShippingInfo('${order.id}', document.getElementById('shipCarrier').value, document.getElementById('shipTracking').value)">
            <i class="fas fa-save"></i> Guardar datos envío
          </button>
          <button class="ap-btn-save" style="width:auto" id="sendShipBtn-${order.id}"
                  onclick="adminPanel._sendShippingWhatsApp('${order.id}')">
            <i class="fab fa-whatsapp"></i> Enviar guía al cliente
          </button>
        </div>
        </div>
        ${order.shipping.shippedAt ? `<div class="detail-info-row"><span>Fecha envío:</span><strong>${new Date(order.shipping.shippedAt).toLocaleString('es-CO')}</strong></div>` : ''}
        ${order.shipping.deliveredAt ? `<div class="detail-info-row"><span>Fecha entrega:</span><strong>${new Date(order.shipping.deliveredAt).toLocaleString('es-CO')}</strong></div>` : ''}
      </div>
    `;

    const timelineHtml = (order.timeline || []).slice().reverse().map(t => `
      <div class="timeline-item">
        <div class="timeline-dot" style="--c:${OS.STATUS_COLORS[t.status] || '#999'}"></div>
        <div class="timeline-content">
          <strong>${OS.STATUS_LABELS[t.status] || t.status}</strong>
          <small>${new Date(t.timestamp).toLocaleString('es-CO')}</small>
          <p>${t.message || ''}</p>
        </div>
      </div>
    `).join('');

    body.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-main">
          <span class="order-status-badge" style="--c:${statusColor};--bg:${statusColor}15">
            <span class="order-status-dot"></span>${statusLabel}
          </span>
          <span class="detail-total">Total: <strong>${Formatters.formatPrice(order.total)}</strong></span>
        </div>
        <small>Creado: ${new Date(order.createdAt).toLocaleString('es-CO')}</small>
      </div>

      <div class="detail-grid">
        <div class="detail-col-main">
          <div class="detail-section">
            <h4><i class="fas fa-user"></i> Datos del Cliente</h4>
            <div class="detail-info-row"><span>Nombre:</span><strong>${Helpers.escapeHtml(order.customer?.fullName || '-')}</strong></div>
            <div class="detail-info-row"><span>Email:</span><strong>${Helpers.escapeHtml(order.customer?.email || '-')}</strong></div>
            <div class="detail-info-row"><span>Teléfono:</span><strong>${Helpers.escapeHtml(order.customer?.phone || '-')}</strong></div>
            ${order.customer?.document ? `<div class="detail-info-row"><span>Documento:</span><strong>${order.customer.documentType || ''} ${Helpers.escapeHtml(order.customer.document)}</strong></div>` : ''}
          </div>

          <div class="detail-section">
            <h4><i class="fas fa-map-marker-alt"></i> Dirección de Entrega</h4>
            <div class="detail-info-row"><span>Departamento:</span><strong>${Helpers.escapeHtml(order.customer?.department || '-')}</strong></div>
            <div class="detail-info-row"><span>Ciudad:</span><strong>${Helpers.escapeHtml(order.customer?.city || '-')}</strong></div>
            <div class="detail-info-row"><span>Dirección:</span><strong>${Helpers.escapeHtml(order.customer?.address || '-')}</strong></div>
            ${order.customer?.notes ? `<div class="detail-info-row"><span>Notas:</span><strong style="max-width:350px">${Helpers.escapeHtml(order.customer.notes)}</strong></div>` : ''}
          </div>

          <div class="detail-section">
            <h4><i class="fas fa-clock"></i> Historial del Pedido</h4>
            <div class="timeline">
              ${timelineHtml || '<p class="detail-hint">Sin historial todavía. Aquí aparecerán todos los cambios de estado y verificaciones.</p>'}
            </div>
          </div>

          <div class="detail-section">
            <h4><i class="fas fa-shopping-bag"></i> Productos (${order.items?.length || 0})</h4>
            <div class="detail-items">
              ${order.items.map(item => `
                <div class="detail-item">
                  <img src="${Helpers.sanitizeUrl(item.image, 'https://placehold.co/56x56?text=?')}" alt="" onerror="this.src='https://placehold.co/56x56?text=?'">
                  <div class="detail-item-info">
                    <strong>${Helpers.escapeHtml(item.name)}</strong>
                    <small>Cantidad: x${item.qty} • Unitario: ${Formatters.formatPrice(item.price)}</small>
                  </div>
                  <strong class="detail-item-subtotal">${Formatters.formatPrice(item.subtotal || (parseInt(item.price) * item.qty))}</strong>
                </div>
              `).join('')}
            </div>
            <div class="detail-totals-box">
              <div><span>Subtotal:</span><span>${Formatters.formatPrice(order.subtotal || order.total)}</span></div>
              <div><span>Envío:</span><span class="txt-success">Gratis</span></div>
              <div class="detail-total-row"><span>TOTAL:</span><span>${Formatters.formatPrice(order.total)}</span></div>
            </div>
          </div>

          ${transferInfo}
          ${shippingInfo}
        </div>

        <div class="detail-col-side">
          <div class="detail-section sticky">
            <h4><i class="fas fa-list-check"></i> Cambiar Estado</h4>
            <div class="status-flow">
              ${renderStatusFlow(order)}
            </div>
            <div class="detail-form-row" style="margin-top:14px">
              <label>Nota opcional para el historial</label>
              <input type="text" id="statusNote" placeholder="Ej: Pago confirmado por Bancolombia #123456">
            </div>

            <h4 class="space-h4"><i class="fab fa-whatsapp"></i> Acciones Rápidas</h4>
            <div class="detail-wa-btns">
              <button class="wa-btn wa-btn-admin" onclick="adminPanel.sendOrderStatusToWhatsApp('${order.id}','admin')">
                <i class="fab fa-whatsapp"></i> Abrir chat admin
              </button>
              <button class="wa-btn wa-btn-cust" onclick="adminPanel.sendOrderStatusToWhatsApp('${order.id}','customer')">
                <i class="fab fa-whatsapp"></i> Abrir chat cliente
              </button>
            </div>

            <button type="button" class="btn-danger-outline"
                    ${order.status === 'completed' ? 'disabled title="No puedes cancelar un pedido completado"' :
                      order.status === 'cancelled' ? 'disabled title="El pedido ya se encuentra cancelado"' : ''}
                    onclick="adminPanel.changeOrderStatus('${order.id}','cancelled', document.getElementById('statusNote').value)">
              <i class="fas fa-ban"></i> ${order.status === 'cancelled' ? 'Pedido Cancelado' : 'Cancelar Pedido'}
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    console.log('[AdminOrders] Modal abierto para pedido:', orderId, '| Estado actual:', order.status);
    } catch (err) {
      console.error('[AdminOrders] Error abriendo detalle de pedido:', err);
      notificationService.error('Error abriendo detalle del pedido');
    }
  }

  function renderStatusFlow(order) {
    const flow = ['pending', 'verifying', 'packing', 'shipped', 'completed'];
    const currentIdx = flow.indexOf(order.status);
    const isCancelled = order.status === 'cancelled';

    return flow.map((s, idx) => {
      const label = OS.STATUS_LABELS[s];
      const color = OS.STATUS_COLORS[s];
      const isCurrent = order.status === s;
      const isPast = currentIdx !== -1 && idx < currentIdx;
      const isReachable = !isCancelled && currentIdx !== -1 && idx > currentIdx && OS.isValidTransition(order.status, s);
      const disabled = isCancelled || isCurrent || (!isPast && !isReachable);

      let onclickAttr = '';
      if (!disabled) {
        onclickAttr = `onclick="adminPanel._onStatusStepClick(event, '${order.id}', '${s}')"`;
      }

      return `
        <button class="status-step ${isCurrent ? 'current' : ''} ${isPast ? 'done' : ''} ${disabled ? 'disabled' : ''}"
                style="--c:${color}"
                ${onclickAttr}
                ${disabled ? 'disabled' : ''}>
          <div class="status-step-icon">
            ${isPast ? '<i class="fas fa-check"></i>' : `<span>${idx + 1}</span>`}
          </div>
          <span>${label}</span>
        </button>
      `;
    }).join('');
  }

  function _onStatusStepClick(e, orderId, newStatus) {
    e.stopPropagation();
    const noteEl = document.getElementById('statusNote');
    const note = noteEl ? noteEl.value.trim() : '';
    changeOrderStatus(orderId, newStatus, note);
  }

  async function changeOrderStatus(orderId, newStatus, note) {
    if (!OS) {
      notificationService.error('Servicio de pedidos no disponible');
      return;
    }
    const order = OS.getOrderById(orderId);
    if (!order) {
      notificationService.error('Pedido no encontrado');
      return;
    }

    let force = false;

    if (newStatus === 'packing' && order.paymentMethod === 'transfer' && !order.payment.verified) {
      const ok = confirm('⚠️ El pago por transferencia NO ha sido verificado.\n¿Deseas marcarlo como empaquetando de todos modos?');
      if (!ok) return;
      force = true;
    }

    if (!OS.isValidTransition(order.status, newStatus, { force })) {
      if (confirm(`Transición: ${OS.STATUS_LABELS[order.status] || order.status} → ${OS.STATUS_LABELS[newStatus] || newStatus}\n\nEsta transición no sigue el flujo normal. ¿Deseas forzar el cambio de todos modos?`)) {
        force = true;
      } else {
        return;
      }
    }

    const updated = await OS.updateStatus(orderId, newStatus, note || null, { force });
    if (updated) {
      notificationService.success(`Estado actualizado a: ${OS.STATUS_LABELS[newStatus]}`);
      const noteField = document.getElementById('statusNote');
      if (noteField) noteField.value = '';
      openOrderDetail(orderId);
      refreshOrders();
    } else {
      notificationService.error('Error actualizando estado. Revisa la consola para detalles.');
    }
  }

  async function verifyOrderPayment(orderId, reference) {
    if (!OS) {
      notificationService.error('Servicio de pedidos no disponible');
      return;
    }
    const order = await OS.verifyPayment(orderId, reference || undefined);
    if (order) {
      if ([OS.STATUS.PENDING, OS.STATUS.VERIFYING].includes(order.status)) {
        if (order.status === OS.STATUS.PENDING) {
          await OS.updateStatus(orderId, OS.STATUS.VERIFYING, `Pago verificado${reference ? ` · Ref: ${reference}` : ''}`);
        }
      }
      notificationService.success('Pago marcado como verificado');
      openOrderDetail(orderId);
      refreshOrders();
    } else {
      notificationService.error('Error verificando pago');
    }
  }

  async function setShippingInfo(orderId, carrier, tracking) {
    if (!OS) {
      notificationService.error('Servicio de pedidos no disponible');
      return;
    }
    if (!carrier && !tracking) {
      notificationService.info('Ingresa transportadora o número de guía');
      return;
    }
    await OS.setShippingInfo(orderId, { carrier: carrier || null, trackingNumber: tracking || null });
    const order = OS.getOrderById(orderId);
    if (!order) return;
    if ((carrier && tracking) && order.status !== OS.STATUS.SHIPPED && order.status !== OS.STATUS.COMPLETED) {
      const canShip = OS.isValidTransition(order.status, OS.STATUS.SHIPPED);
      if (canShip) {
        await OS.updateStatus(orderId, OS.STATUS.SHIPPED, `Enviado por ${carrier} - Guía ${tracking}`);
      } else if (confirm('El pedido está en estado "' + OS.STATUS_LABELS[order.status] + '".\n\n¿Deseas forzar el cambio a "Enviado" de todos modos?')) {
        await OS.updateStatus(orderId, OS.STATUS.SHIPPED, `Enviado por ${carrier} - Guía ${tracking}`, { force: true });
      }
    }
    notificationService.success('Información de envío guardada');
    openOrderDetail(orderId);
    refreshOrders();
  }

  function _sendShippingWhatsApp(orderId) {
    const order = OS.getOrderById(orderId);
    if (!order) {
      notificationService.error('Pedido no encontrado');
      return;
    }
    let carrier = order.shipping?.carrier || '';
    let tracking = order.shipping?.trackingNumber || '';
    try {
      const cEl = document.getElementById('shipCarrier');
      const tEl = document.getElementById('shipTracking');
      if (cEl && cEl.value) carrier = cEl.value;
      if (tEl && tEl.value) tracking = tEl.value;
    } catch (_) {}
    if (!carrier || !tracking) {
      notificationService.info('Selecciona una transportadora y escribe el número de guía antes de enviar.');
      try {
        if (!carrier) document.getElementById('shipCarrier')?.focus?.();
        else document.getElementById('shipTracking')?.focus?.();
      } catch (_) {}
      return;
    }
    sendOrderStatusToWhatsApp(orderId, 'shipping');
  }

  function sendOrderStatusToWhatsApp(orderId, target = 'customer') {
    const order = OS.getOrderById(orderId);
    if (!order) return;
    const phoneRaw = target === 'admin'
      ? (window.siteData?.getSection?.('footer')?.whatsapp || '573012345678')
      : order.customer.phone;
    const phone = String(phoneRaw).replace(/\D/g, '');

    let carrier = order.shipping?.carrier || '';
    let tracking = order.shipping?.trackingNumber || '';
    let verified = !!(order.payment?.verified);
    let reference = order.payment?.transactionReference || '';
    try {
      const cEl = document.getElementById('shipCarrier');
      const tEl = document.getElementById('shipTracking');
      const vEl = document.getElementById('verifyRef');
      if (cEl && cEl.value) carrier = cEl.value;
      if (tEl && tEl.value) tracking = tEl.value;
      if (vEl && vEl.value) reference = vEl.value;
    } catch (_) {}

    let message = '';
    const statusLabel = OS.STATUS_LABELS[order.status];

    if (target === 'shipping' || (carrier && tracking)) {
      const showFullShippingBlock = (target === 'shipping') || (carrier && tracking && (order.status === OS.STATUS.SHIPPED || order.status === OS.STATUS.PACKING || order.status === OS.STATUS.COMPLETED || order.status === OS.STATUS.VERIFYING || order.status === OS.STATUS.PENDING));
      if (showFullShippingBlock) {
        message = [
          `¡Hola ${(order.customer.fullName || '').split(' ')[0]}! 👋`,
          ``,
          `📦 *Actualización de tu pedido ${order.id}*`,
          `Estado actual: *${statusLabel}*`,
          reference ? `💳 Comprobante / Ref: *${reference}*` : null,
          ``,
          carrier || tracking ? `✈️ *Información de envío:*` : null,
          carrier ? `• Transportadora: *${carrier}*` : null,
          tracking ? `• Número de Guía: *${tracking}*` : null,
          carrier ? `\nPuedes hacer seguimiento directamente en la página de ${carrier}.` : null,
          ``,
          order.status === 'completed' ? `✅ ¡Tu pedido ha sido entregado exitosamente! Gracias por comprar en Punto Digital. 💛` : `Tu pedido será entregado muy pronto. ¡Gracias por tu compra! 💛`
        ].filter(l => l !== null).join('\n');
      }
    }

    if (!message) {
      if (target === 'admin') {
        const itemsText = order.items.map((i, idx) => `${idx + 1}. ${i.name} x${i.qty}`).join('\n');
        message = [
          `📍 *DETALLE PEDIDO ${order.id}*`,
          ``,
          `Estado: ${statusLabel}`,
          `Cliente: ${order.customer.fullName}`,
          `Tel: ${order.customer.phone}`,
          `Pago: ${OS.PAYMENT_LABELS[order.paymentMethod]} ${verified ? '✅' : (order.paymentMethod === 'transfer' ? '⚠️ No verificado' : '')}${reference ? ` (Ref: ${reference})` : ''}`,
          `Total: ${Formatters.formatPrice(order.total)}`,
          carrier || tracking ? `\nEnvío: ${[carrier, tracking].filter(Boolean).join(' - Guía: ')}` : '',
          ``,
          `Dirección: ${order.customer.department} - ${order.customer.city}\n${order.customer.address}`,
          ``,
          `Productos:\n${itemsText}`
        ].filter(l => l !== '').join('\n');
      } else {
        message = [
          `¡Hola ${(order.customer.fullName || '').split(' ')[0]}! 👋`,
          ``,
          `Actualización de tu pedido *${order.id}*:`,
          `Estado: *${statusLabel}*`,
          reference ? `💳 Comprobante / Ref: *${reference}*` : null,
          ``,
          order.status === 'packing' ? `📦 Estamos preparando tu pedido, será enviado pronto.` : '',
          order.status === 'completed' ? `✅ ¡Tu pedido ha sido entregado exitosamente! Gracias por comprar en Punto Digital. 💛` : '',
          order.status === 'cancelled' ? `❌ Tu pedido ha sido cancelado. Por favor contáctanos para más información.` : '',
          order.status === 'pending' ? `⏳ Hemos recibido tu pedido exitosamente. En breve lo procesaremos.` : '',
          order.status === 'verifying' ? `🔍 Estamos verificando tu pago. En cuanto lo confirmemos, te contactamos.` : '',
          ``,
          carrier && tracking ? `✈️ *Envío:* ${carrier} - Guía ${tracking}\n\n` : '',
          `¿Alguna duda? ¡Estamos para ayudarte!`
        ].filter(l => l !== null && l !== '').join('\n');
      }
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');
  }

  async function deleteOrder(orderId) {
    if (!confirm(`¿Eliminar el pedido ${orderId}? Esta acción no se puede deshacer.`)) return;
    const ok = await OS.deleteOrder(orderId);
    if (ok) {
      notificationService.success('Pedido eliminado');
      refreshOrders();
      closeOrderDetailModal();
    } else {
      notificationService.error('No se pudo eliminar el pedido. Revisa la consola.');
    }
  }

  window.closeOrderDetailModal = function () {
    const modal = document.getElementById('orderDetailModal');
    if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
  };

  window.goSection = function (sec) {
    const btn = document.querySelector(`.ap-nav-item[data-section="${sec}"]`);
    if (btn) btn.click();
  };

  document.addEventListener('click', (e) => {
    const modal = document.getElementById('orderDetailModal');
    if (modal && e.target === modal) closeOrderDetailModal();
  });
})();
