/**
 * Servicio de Gestión de Pedidos
 * Maneja creación, almacenamiento, estados y notificaciones de pedidos
 * Persiste en localStorage (offline) y Firestore (multi-dispositivo).
 */
class OrderService {
  constructor() {
    this.storageKey = 'puntoDigitalOrders';
    this.orders = this.load();
    this.observers = [];
    this._firestoreUnsubscribe = null;
    this.setupCrossTabSync();
    this.STATUS = {
      PENDING: 'pending',
      VERIFYING: 'verifying',
      PACKING: 'packing',
      SHIPPED: 'shipped',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled'
    };
    this.STATUS_LABELS = {
      pending: 'Nuevo / Activo',
      verifying: 'Verificando Pago',
      packing: 'Empaquetando',
      shipped: 'Enviado',
      completed: 'Completado',
      cancelled: 'Cancelado'
    };
    this.STATUS_COLORS = {
      pending: '#0d6efd',
      verifying: '#ffc107',
      packing: '#6f42c1',
      shipped: '#0dcaf0',
      completed: '#198754',
      cancelled: '#dc3545'
    };
    this.PAYMENT_METHODS = {
      TRANSFER: 'transfer',
      CASH_ON_DELIVERY: 'cod'
    };
    this.PAYMENT_LABELS = {
      transfer: 'Pago por Transferencia',
      cod: 'Contra Entrega'
    };

    this._initFirestoreSync();
  }

  // ── Firestore Sync ─────────────────────────────────────────────

  _initFirestoreSync() {
    const boot = () => this._ensureAdminFirestoreListener();
    if (!window.firebaseClient?.ready) {
      window.addEventListener('firebaseReady', boot, { once: true });
    } else {
      boot();
    }
    window.addEventListener('userSignedIn', () => this._ensureAdminFirestoreListener());
  }

  async _ensureAdminFirestoreListener() {
    if (this._firestoreUnsubscribe) return;
    const fbUser = window.firebaseClient?.getCurrentUser?.();
    const adminEmail = 'puntodigitalti@gmail.com';
    if (!fbUser || String(fbUser.email || '').toLowerCase() !== adminEmail) {
      return;
    }
    await this._startFirestoreListener();
  }

  async _startFirestoreListener() {
    if (this._firestoreUnsubscribe) return;
    if (window.firebaseClient?.waitReady) await window.firebaseClient.waitReady();
    if (!window.firebaseClient?.db) return;
    try {
      const { collection, onSnapshot, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      const q = query(collection(window.firebaseClient.db, 'orders'), orderBy('createdAt', 'desc'));
      this._firestoreUnsubscribe = onSnapshot(q, (snapshot) => {
        const remoteOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        this._mergeRemoteOrders(remoteOrders);
      }, (err) => {
        console.warn('[OrderService] Error en listener de Firestore:', err);
      });
      console.log('[OrderService] Suscrito a cambios de pedidos en Firestore');
    } catch (e) {
      console.warn('[OrderService] No se pudo suscribir a Firestore:', e);
    }
  }

  _mergeRemoteOrders(remoteOrders) {
    const fbUser = window.firebaseClient?.getCurrentUser?.();
    const isAdmin = fbUser && String(fbUser.email || '').toLowerCase() === 'puntodigitalti@gmail.com';

    let merged;
    if (isAdmin) {
      const localMap = new Map(this.orders.map(o => [o.id, o]));
      merged = remoteOrders.map(remote => {
        const local = localMap.get(remote.id);
        return local ? { ...local, ...remote } : { ...remote };
      });
    } else {
      const localMap = new Map(this.orders.map(o => [o.id, o]));
      const ids = new Set();
      merged = [];
      for (const remote of remoteOrders) {
        ids.add(remote.id);
        const local = localMap.get(remote.id);
        merged.push(local ? { ...local, ...remote } : { ...remote });
      }
      for (const local of this.orders) {
        if (!ids.has(local.id)) merged.push(local);
      }
    }

    merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    this.orders = merged;
    this.save();
    this.notify('ordersUpdated', this.orders);
  }

  async _createOrderInFirestore(order) {
    try {
      if (window.firebaseClient?.waitReady) await window.firebaseClient.waitReady();
    } catch (e) {
      console.warn('[OrderService] Firebase no inicializó a tiempo para guardar pedido:', e);
    }
    if (!window.firebaseClient?.db) return null;
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      const ref = doc(window.firebaseClient.db, 'orders', order.id);
      await setDoc(ref, order);
      return order.id;
    } catch (e) {
      console.warn('[OrderService] No se pudo guardar el pedido en Firestore:', e);
      return null;
    }
  }

  async _updateOrderInFirestore(orderId, updates) {
    try {
      if (window.firebaseClient?.waitReady) await window.firebaseClient.waitReady();
    } catch (_) {}
    if (!window.firebaseClient?.db) return;
    try {
      const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      const ref = doc(window.firebaseClient.db, 'orders', orderId);
      await updateDoc(ref, updates);
    } catch (e) {
      console.warn('[OrderService] No se pudo actualizar el pedido en Firestore:', e);
    }
  }

  async _loadOrdersFromFirestore() {
    try {
      if (window.firebaseClient?.waitReady) await window.firebaseClient.waitReady();
    } catch (_) {}
    if (!window.firebaseClient?.db) return [];
    try {
      const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      const q = query(collection(window.firebaseClient.db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('[OrderService] No se pudieron cargar pedidos desde Firestore:', e);
      return [];
    }
  }

  // ── Persistencia local ─────────────────────────────────────────

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.orders));
      this.notify('ordersUpdated', this.orders);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('[OrderService] localStorage lleno. No se pudo guardar los pedidos.');
      }
    }
  }

  setupCrossTabSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.orders = this.load();
        this.notify('ordersUpdated', this.orders);
      }
    });
  }

  // ── CRUD ──────────────────────────────────────────────────────

  async createOrder({ items, customerData, paymentMethod, total }) {
    const order = {
      id: this.generateOrderId(),
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        image: item.image || null,
        subtotal: parseInt(item.price) * item.qty
      })),
      customer: {
        fullName: customerData.fullName,
        email: customerData.email,
        phone: customerData.phone,
        document: customerData.document || '',
        documentType: customerData.documentType || 'CC',
        address: customerData.address,
        city: customerData.city,
        department: customerData.department,
        notes: customerData.notes || ''
      },
      paymentMethod,
      total,
      subtotal: total,
      shippingCost: 0,
      status: this.STATUS.PENDING,
      shipping: {
        carrier: null,
        trackingNumber: null,
        shippedAt: null,
        deliveredAt: null
      },
      payment: {
        verified: false,
        verifiedAt: null,
        transactionReference: null
      },
      timeline: [
        {
          status: this.STATUS.PENDING,
          timestamp: new Date().toISOString(),
          message: 'Pedido creado exitosamente'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notifiedWhatsApp: false,
      notifiedEmail: false
    };

    this.orders.unshift(order);
    this.save();

    await this._createOrderInFirestore(order);

    this.sendWhatsAppNotification(order);
    this.createTicketInAdmin(order);

    return order;
  }

  async updateStatus(orderId, newStatus, message = null, { force = false } = {}) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      console.error('[OrderService] Pedido no encontrado:', orderId);
      return null;
    }

    if (!this.isValidTransition(order.status, newStatus, { force })) {
      console.warn(`[OrderService] Transición no válida: ${order.status} → ${newStatus}`);
      return null;
    }

    const previousStatus = order.status;
    order.status = newStatus;

    order.timeline.push({
      status: order.status,
      previousStatus,
      timestamp: new Date().toISOString(),
      message: message || this.getStatusMessage(order.status)
    });

    if (order.status === this.STATUS.SHIPPED && !order.shipping.shippedAt) {
      order.shipping.shippedAt = new Date().toISOString();
    }
    if (order.status === this.STATUS.COMPLETED && !order.shipping.deliveredAt) {
      order.shipping.deliveredAt = new Date().toISOString();
    }

    order.updatedAt = new Date().toISOString();
    this.save();

    const firestoreUpdates = {
      status: order.status,
      'shipping.carrier': order.shipping.carrier,
      'shipping.trackingNumber': order.shipping.trackingNumber,
      'shipping.shippedAt': order.shipping.shippedAt,
      'shipping.deliveredAt': order.shipping.deliveredAt,
      'payment.verified': order.payment.verified,
      'payment.verifiedAt': order.payment.verifiedAt,
      'payment.transactionReference': order.payment.transactionReference,
      timeline: order.timeline,
      updatedAt: order.updatedAt
    };
    this._updateOrderInFirestore(orderId, firestoreUpdates).catch(e => console.warn('[OrderService] Error sync Firestore:', e));

    if ([this.STATUS.SHIPPED, this.STATUS.COMPLETED].includes(order.status)) {
      try {
        this.sendStatusUpdateToCustomer(order);
      } catch (e) {
        console.warn('[OrderService] Error notificando cliente:', e);
      }
    }

    return order;
  }

  async verifyPayment(orderId, transactionReference = null) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      console.error('[OrderService] verifyPayment: Pedido no encontrado:', orderId);
      return null;
    }
    order.payment.verified = true;
    order.payment.verifiedAt = new Date().toISOString();
    if (transactionReference) order.payment.transactionReference = transactionReference;
    order.timeline.push({
      status: order.status,
      timestamp: new Date().toISOString(),
      message: `Pago verificado${transactionReference ? ` · Referencia: ${transactionReference}` : ''}`
    });
    order.updatedAt = new Date().toISOString();
    this.save();

    const updates = {
      'payment.verified': true,
      'payment.verifiedAt': order.payment.verifiedAt,
      'payment.transactionReference': order.payment.transactionReference,
      timeline: order.timeline,
      updatedAt: order.updatedAt
    };
    if (order.status === this.STATUS.PENDING) {
      updates.status = this.STATUS.VERIFYING;
      order.status = this.STATUS.VERIFYING;
      order.timeline.push({
        status: this.STATUS.VERIFYING,
        previousStatus: this.STATUS.PENDING,
        timestamp: new Date().toISOString(),
        message: `Pago verificado${transactionReference ? ` · Ref: ${transactionReference}` : ''}`
      });
      updates.timeline = order.timeline;
    }
    this._updateOrderInFirestore(orderId, updates).catch(e => {});
    return order;
  }

  async setShippingInfo(orderId, { carrier, trackingNumber }) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      console.error('[OrderService] setShippingInfo: Pedido no encontrado:', orderId);
      return null;
    }
    const changes = [];
    if (carrier && order.shipping.carrier !== carrier) {
      changes.push(`Transportadora: ${carrier}`);
    }
    if (trackingNumber && order.shipping.trackingNumber !== trackingNumber) {
      changes.push(`Guía: ${trackingNumber}`);
    }
    order.shipping.carrier = carrier;
    order.shipping.trackingNumber = trackingNumber;
    if (changes.length) {
      order.timeline.push({
        status: order.status,
        timestamp: new Date().toISOString(),
        message: `Información de envío actualizada · ${changes.join(' · ')}`
      });
    }
    order.updatedAt = new Date().toISOString();
    this.save();

    const updates = {
      'shipping.carrier': carrier,
      'shipping.trackingNumber': trackingNumber,
      timeline: order.timeline,
      updatedAt: order.updatedAt
    };
    this._updateOrderInFirestore(orderId, updates).catch(e => {});
    return order;
  }

  async deleteOrder(orderId) {
    this.orders = this.orders.filter(o => o.id !== orderId);
    this.save();
    try {
      const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      await deleteDoc(doc(window.firebaseClient.db, 'orders', orderId));
    } catch (e) {
      console.warn('[OrderService] No se pudo eliminar el pedido de Firestore:', e);
    }
    return true;
  }

  generateOrderId() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `PD-${year}${month}${day}-${random}`;
  }

  isValidTransition(currentStatus, newStatus, { force = false } = {}) {
    if (force) return true;
    if (currentStatus === newStatus) return false;
    if (currentStatus === this.STATUS.CANCELLED) return newStatus === this.STATUS.PENDING;
    if (newStatus === this.STATUS.CANCELLED) return currentStatus !== this.STATUS.COMPLETED;
    const flow = [this.STATUS.PENDING, this.STATUS.VERIFYING, this.STATUS.PACKING, this.STATUS.SHIPPED, this.STATUS.COMPLETED];
    const currentIdx = flow.indexOf(currentStatus);
    const newIdx = flow.indexOf(newStatus);
    if (currentIdx === -1 || newIdx === -1) return false;
    return newIdx >= currentIdx;
  }

  getStatusMessage(status) {
    const messages = {
      pending: 'Pedido creado exitosamente',
      verifying: 'Verificando pago del cliente',
      packing: 'Pedido en proceso de empaquetado',
      shipped: 'Pedido enviado al cliente',
      completed: 'Pedido entregado y completado',
      cancelled: 'Pedido cancelado'
    };
    return messages[status] || 'Estado actualizado';
  }

  sendWhatsAppNotification(order) {
    const footer = window.siteData?.getSection?.('footer') || {};
    const adminPhone = String(footer.whatsapp || footer.phone || '+573012345678').replace(/\D/g, '');

    const itemsText = order.items.map((item, idx) =>
      `${idx + 1}. ${item.name} x${item.qty} - ${Formatters.formatPrice(item.subtotal)}`
    ).join('\n');

    const paymentLabel = this.PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;

    const adminMessage = [
      `🛒 *NUEVO PEDIDO RECIBIDO*`,
      `*Pedido:* ${order.id}`,
      `*Fecha:* ${new Date(order.createdAt).toLocaleString('es-CO')}`,
      ``,
      `👤 *DATOS DEL CLIENTE*`,
      `Nombre: ${order.customer.fullName}`,
      `Teléfono: ${order.customer.phone}`,
      `Email: ${order.customer.email}`,
      order.customer.document ? `Documento: ${order.customer.documentType} ${order.customer.document}` : '',
      ``,
      `📍 *DIRECCIÓN DE ENTREGA*`,
      `${order.customer.department} - ${order.customer.city}`,
      `${order.customer.address}`,
      ``,
      `💰 *MÉTODO DE PAGO:* ${paymentLabel}`,
      ``,
      `📦 *PRODUCTOS*`,
      itemsText,
      ``,
      `*TOTAL:* ${Formatters.formatPrice(order.total)}`,
      order.customer.notes ? `\n📝 *Notas:* ${order.customer.notes}` : '',
      ``,
      `Por favor gestionar este pedido desde el panel admin.`
    ].filter(Boolean).join('\n');

    const adminUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(adminMessage)}`;
    setTimeout(() => window.open(adminUrl, '_blank', 'noopener'), 300);

    const customerPhone = String(order.customer.phone).replace(/\D/g, '');
    if (customerPhone && customerPhone.length >= 10) {
      const customerMessage = [
        `¡Hola ${order.customer.fullName.split(' ')[0]}! 👋`,
        ``,
        `Gracias por tu compra en *Punto Digital*.`,
        ``,
        `✅ Tu pedido ha sido recibido exitosamente.`,
        `*Número de pedido:* ${order.id}`,
        ``,
        `💳 *Método de pago:* ${paymentLabel}`,
        `💰 *Total:* ${Formatters.formatPrice(order.total)}`,
        ``,
        order.paymentMethod === 'transfer' ? [
          `📋 *Instrucciones de pago por transferencia:*`,
          `Banco: Bancolombia`,
          `Tipo: Cuenta de Ahorros`,
          `Número: 123-45678-90`,
          `Titular: Punto Digital SAS`,
          `NIT: 123.456.789-0`,
          ``,
          `Una vez realices la transferencia, por favor envía el comprobante a este WhatsApp y nos pondremos en contacto contigo.`
        ].join('\n') : [
          `📋 *Pago Contra Entrega:*`,
          `Tu pedido será enviado y pagarás al recibirlo.`,
          `Nuestro equipo te contactará para coordinar la entrega.`
        ].join('\n'),
        ``,
        `Si tienes alguna duda, ¡estamos para ayudarte! 🚀`
      ].join('\n');

      setTimeout(() => {
        const custUrl = `https://wa.me/${customerPhone}?text=${encodeURIComponent(customerMessage)}`;
        console.log('Enviar WhatsApp a cliente:', custUrl);
      }, 1500);
    }

    order.notifiedWhatsApp = true;
    this.save();
  }

  createTicketInAdmin(order) {
    console.log(`🎫 Ticket creado en Admin - Pedido ${order.id}`);
    this.notify('newOrder', order);
  }

  getOrders(filter = {}) {
    let result = [...this.orders];
    if (filter.status) result = result.filter(o => o.status === filter.status);
    if (filter.paymentMethod) result = result.filter(o => o.paymentMethod === filter.paymentMethod);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.customer.phone.includes(q)
      );
    }
    return result;
  }

  getOrderById(orderId) {
    return this.orders.find(o => o.id === orderId);
  }

  getStats() {
    return {
      total: this.orders.length,
      pending: this.orders.filter(o => o.status === this.STATUS.PENDING).length,
      verifying: this.orders.filter(o => o.status === this.STATUS.VERIFYING).length,
      packing: this.orders.filter(o => o.status === this.STATUS.PACKING).length,
      shipped: this.orders.filter(o => o.status === this.STATUS.SHIPPED).length,
      completed: this.orders.filter(o => o.status === this.STATUS.COMPLETED).length,
      cancelled: this.orders.filter(o => o.status === this.STATUS.CANCELLED).length,
      totalRevenue: this.orders
        .filter(o => [this.STATUS.COMPLETED, this.STATUS.SHIPPED, this.STATUS.PACKING, this.STATUS.VERIFYING].includes(o.status))
        .reduce((sum, o) => sum + o.total, 0)
    };
  }

  notify(event, data) {
    this.observers.forEach(fn => {
      try { fn(event, data); } catch (e) {}
    });
  }

  subscribe(fn) {
    this.observers.push(fn);
    return () => {
      this.observers = this.observers.filter(f => f !== fn);
    };
  }
}

window.orderService = new OrderService();
