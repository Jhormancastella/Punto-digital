/**
 * Servicio de Gestión de Reseñas (Reviews)
 * Maneja creación, almacenamiento, moderación y notificaciones de reseñas
 * Persiste en localStorage (offline) y Firestore (multi-dispositivo).
 */
class ReviewService {
  constructor() {
    this.storageKey = 'puntoDigitalReviews';
    this.pendingOpsKey = 'puntoDigitalReviews_pendingOps';
    this.reviews = this.load();
    this.observers = [];
    this._firestoreUnsubscribe = null;
    this._isStartingListener = false;
    this._retryTimer = null;
    this._retryCount = 0;
    this._maxRetries = 5;
    this._pendingOps = this._loadPendingOps();
    this._flushingOps = false;

    this.STATUS = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected'
    };

    this.STATUS_LABELS = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      rejected: 'Rechazada'
    };

    this.STATUS_COLORS = {
      pending: '#ffc107',
      approved: '#198754',
      rejected: '#dc3545'
    };

    this.VIDEO_TYPES = {
      YOUTUBE: 'youtube',
      DRIVE: 'drive',
      UPLOADED: 'uploaded',
      LINK: 'link'
    };

    this.setupCrossTabSync();
    this._sanitizePendingOps();
    this._initFirestoreSync();
    window.addEventListener('online', () => {
      this._flushOpRetryCount = 0;
      this._flushPendingOps();
    });
    window.addEventListener('firebaseReady', () => {
      this._flushOpRetryCount = 0;
      this._flushPendingOps();
    });
  }

  _sanitizePendingOps() {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const seen = new Map();
    const cleaned = [];
    for (const op of this._pendingOps) {
      if (!op || !op.type || !op.id) continue;
      if (op.ts && (now - op.ts) > ONE_DAY) continue;
      const key = `${op.type}|${op.id}`;
      if (seen.has(key)) {
        const prev = seen.get(key);
        if (op.type === 'update') {
          prev.payload = { ...(prev.payload || {}), ...(op.payload || {}) };
          prev.ts = Math.max(prev.ts || 0, op.ts || 0);
          prev._attempts = Math.min(prev._attempts || 0, op._attempts || 0);
        }
        continue;
      }
      seen.set(key, op);
      cleaned.push(op);
    }
    if (cleaned.length !== this._pendingOps.length) {
      this._pendingOps = cleaned;
      this._savePendingOps();
    }
  }

  _loadPendingOps() {
    try {
      const raw = localStorage.getItem(this.pendingOpsKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  _savePendingOps() {
    try {
      localStorage.setItem(this.pendingOpsKey, JSON.stringify(this._pendingOps));
    } catch (e) {
      console.warn('[ReviewService] No se pudo guardar cola de operaciones pendientes:', e?.message);
    }
  }

  _enqueueOp(type, id, payload) {
    this._pendingOps.push({ type, id, payload, ts: Date.now() });
    this._savePendingOps();
    setTimeout(() => this._flushPendingOps(), 500);
  }

  async _flushPendingOps() {
    if (this._flushingOps) return;
    if (this._pendingOps.length === 0) return;
    this._flushingOps = true;
    try {
      if (window.firebaseClient?.waitReady) await window.firebaseClient.waitReady();
    } catch (_) {}
    if (!window.firebaseClient?.db) {
      this._flushingOps = false;
      return;
    }

    const UNRECOVERABLE = new Set([
      'permission-denied',
      'invalid-argument',
      'not-found',
      'already-exists',
      'cancelled',
      'out-of-range',
      'data-loss'
    ]);
    const MAX_OP_ATTEMPTS = 3;
    const FLUSH_MAX_ATTEMPTS = 10;

    const remaining = [];
    const seen = new Map();
    for (const op of this._pendingOps) {
      const key = `${op.type}|${op.id}`;
      if (seen.has(key)) continue;
      seen.set(key, true);

      op._attempts = (op._attempts || 0) + 1;
      let success = false;
      try {
        if (op.type === 'create') {
          await this._rawCreateInFirestore(op.payload);
          success = true;
        } else if (op.type === 'update') {
          await this._rawUpdateInFirestore(op.id, op.payload);
          success = true;
        } else if (op.type === 'delete') {
          await this._rawDeleteInFirestore(op.id);
          success = true;
        }
      } catch (e) {
        const code = e?.code;
        if (UNRECOVERABLE.has(code)) {
          if (op.type === 'update' && code === 'not-found') {
            const localReview = this.reviews.find(r => r.id === op.id);
            if (localReview) {
              try {
                await this._rawCreateInFirestore({ ...localReview, ...(op.payload || {}) });
                console.warn(`[ReviewService] Update ${op.id} convertido a create (doc no existía en Firestore). Recuperado OK.`);
                success = true;
              } catch (innerErr) {
                console.warn(`[ReviewService] Update ${op.id} no existía, fallback a create también falló [${innerErr?.code || 'unknown'}]. Descartado.`, innerErr?.message);
                success = true;
              }
            } else {
              console.warn(`[ReviewService] Update ${op.id} descartado (not-found + sin copia local).`);
              success = true;
            }
          } else if (op.type === 'delete' && code === 'not-found') {
            console.warn(`[ReviewService] Delete ${op.id} descartado (doc ya no existía en Firestore).`);
            success = true;
          } else if (op.type === 'create' && code === 'already-exists') {
            console.warn(`[ReviewService] Create ${op.id} descartado (doc ya existía en Firestore).`);
            success = true;
          } else {
            console.warn(`[ReviewService] Operación ${op.type} ${op.id} descartada (irrecuperable) [${code}]:`, e?.message);
            success = true;
          }
        } else if (op._attempts >= MAX_OP_ATTEMPTS) {
          console.warn(`[ReviewService] Operación ${op.type} ${op.id} superó ${MAX_OP_ATTEMPTS} intentos, descartada. Último error [${code || 'unknown'}]:`, e?.message);
          success = true;
        } else {
          console.warn(`[ReviewService] Operación pendiente ${op.type} ${op.id} fallida (intento ${op._attempts}/${MAX_OP_ATTEMPTS}), re-agendando:`, e?.message || e);
        }
      }
      if (!success) remaining.push(op);
    }
    this._pendingOps = remaining;
    this._savePendingOps();
    this._flushingOps = false;

    if (this._pendingOps.length > 0) {
      this._flushOpRetryCount = (this._flushOpRetryCount || 0) + 1;
      if (this._flushOpRetryCount <= FLUSH_MAX_ATTEMPTS) {
        setTimeout(() => this._flushPendingOps(), 10000);
      } else {
        console.warn(`[ReviewService] Se alcanzaron ${FLUSH_MAX_ATTEMPTS} ciclos de reintento. Cola detenida; limpiar localStorage si persiste.`);
      }
    } else {
      this._flushOpRetryCount = 0;
    }
  }

  async _rawCreateInFirestore(review) {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const ref = doc(window.firebaseClient.db, 'reviews', review.id);
    await setDoc(ref, review);
  }

  async _rawUpdateInFirestore(reviewId, updates) {
    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const ref = doc(window.firebaseClient.db, 'reviews', reviewId);
    await updateDoc(ref, updates);
  }

  async _rawDeleteInFirestore(reviewId) {
    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    await deleteDoc(doc(window.firebaseClient.db, 'reviews', reviewId));
  }

  async _createReviewInFirestore(review) {
    try {
      if (window.firebaseClient?.waitReady) await window.firebaseClient.waitReady();
    } catch (_) {}
    if (!window.firebaseClient?.db) {
      this._enqueueOp('create', review.id, review);
      return review.id;
    }
    try {
      await this._rawCreateInFirestore(review);
      return review.id;
    } catch (e) {
      console.warn('[ReviewService] No se pudo guardar la reseña en Firestore (encolada):', e?.code || e?.message);
      this._enqueueOp('create', review.id, review);
      return review.id;
    }
  }

  async _updateReviewInFirestore(reviewId, updates) {
    try {
      if (window.firebaseClient?.waitReady) await window.firebaseClient.waitReady();
    } catch (_) {}
    if (!window.firebaseClient?.db) {
      this._enqueueOp('update', reviewId, updates);
      return;
    }
    try {
      await this._rawUpdateInFirestore(reviewId, updates);
    } catch (e) {
      console.warn('[ReviewService] No se pudo actualizar la reseña en Firestore (encolada):', e?.code || e?.message);
      this._enqueueOp('update', reviewId, updates);
    }
  }

  async _deleteReviewInFirestore(reviewId) {
    try {
      if (window.firebaseClient?.waitReady) await window.firebaseClient.waitReady();
    } catch (_) {}
    if (!window.firebaseClient?.db) {
      this._enqueueOp('delete', reviewId, null);
      return;
    }
    try {
      await this._rawDeleteInFirestore(reviewId);
    } catch (e) {
      console.warn('[ReviewService] No se pudo eliminar la reseña de Firestore (encolada):', e?.code || e?.message);
      this._enqueueOp('delete', reviewId, null);
    }
  }

  _initFirestoreSync() {
    const boot = () => this._ensureFirestoreListener();
    if (!window.firebaseClient?.ready) {
      window.addEventListener('firebaseReady', boot, { once: true });
    } else {
      boot();
    }
    window.addEventListener('firebaseAuthChanged', () => {
      this._retryCount = 0;
      if (this._retryTimer) {
        clearTimeout(this._retryTimer);
        this._retryTimer = null;
      }
      const hadListener = !!this._firestoreUnsubscribe;
      if (this._firestoreUnsubscribe) {
        try { this._firestoreUnsubscribe(); } catch (_) {}
        this._firestoreUnsubscribe = null;
      }
      if (hadListener || window.firebaseClient?.ready) {
        if (this._isStartingListener) return;
        this._ensureFirestoreListener();
      }
    });
  }

  _scheduleRetry(reason = '') {
    if (this._retryCount >= this._maxRetries) {
      console.warn(`[ReviewService] Máximo de reintentos alcanzado (${this._maxRetries}). Sincronización Firestore pausada. Los datos siguen funcionando con localStorage.`);
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, this._retryCount), 30000);
    this._retryCount++;
    console.log(`[ReviewService] Reintento ${this._retryCount}/${this._maxRetries} en ${delay}ms${reason ? ': ' + reason : ''}`);
    if (this._retryTimer) clearTimeout(this._retryTimer);
    this._retryTimer = setTimeout(() => {
      this._firestoreUnsubscribe = null;
      this._isStartingListener = false;
      this._startFirestoreListener();
    }, delay);
  }

  async _ensureFirestoreListener() {
    if (this._firestoreUnsubscribe || this._isStartingListener) return;
    if (!window.firebaseClient?.db) return;
    await this._startFirestoreListener();
  }

  async _startFirestoreListener() {
    if (this._firestoreUnsubscribe || this._isStartingListener) return;
    this._isStartingListener = true;
    try {
      if (window.firebaseClient?.waitReady) await window.firebaseClient.waitReady();
    } catch (e) {
      if (this._firestoreUnsubscribe) { this._isStartingListener = false; return; }
      this._isStartingListener = false;
      console.warn('[ReviewService] Firebase no está listo, re-agendando:', e?.message);
      this._scheduleRetry('firebase-no-listo');
      return;
    }
    if (this._firestoreUnsubscribe) { this._isStartingListener = false; return; }
    if (!window.firebaseClient?.db) {
      this._isStartingListener = false;
      this._scheduleRetry('db-nula');
      return;
    }
    try {
      const { collection, onSnapshot, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      if (this._firestoreUnsubscribe) { this._isStartingListener = false; return; }
      const q = query(collection(window.firebaseClient.db, 'reviews'), orderBy('createdAt', 'desc'));
      this._firestoreUnsubscribe = onSnapshot(q, { includeMetadataChanges: false }, (snapshot) => {
        this._retryCount = 0;
        const remoteReviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        this._mergeRemoteReviews(remoteReviews);
      }, (err) => {
        const code = err?.code || 'unknown';
        console.warn(`[ReviewService] Error en listener de Firestore [${code}]:`, err?.message || err);
        this._firestoreUnsubscribe = null;
        if (code === 'permission-denied' || code === 'unavailable' || code === 'unknown') {
          this._scheduleRetry(`firestore-error-${code}`);
        }
      });
      this._isStartingListener = false;
      console.log('[ReviewService] Suscrito a cambios de reseñas en Firestore');
      this._loadInitialFromFirestore().catch(() => {});
    } catch (e) {
      if (this._firestoreUnsubscribe) { this._isStartingListener = false; return; }
      this._isStartingListener = false;
      console.warn('[ReviewService] No se pudo suscribir a Firestore:', e?.message || e);
      this._firestoreUnsubscribe = null;
      this._scheduleRetry('subscribe-fail');
    }
  }

  async _loadInitialFromFirestore() {
    try {
      const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      const q = query(collection(window.firebaseClient.db, 'reviews'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const remoteReviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (remoteReviews.length > 0) {
        this._mergeRemoteReviews(remoteReviews);
      }
    } catch (e) {
      console.warn('[ReviewService] Carga inicial desde Firestore fallida:', e?.message || e);
    }
  }

  _mergeRemoteReviews(remoteReviews) {
    const localMap = new Map(this.reviews.map(o => [o.id, o]));
    const ids = new Set();
    const merged = [];
    for (const remote of remoteReviews) {
      ids.add(remote.id);
      const local = localMap.get(remote.id);
      merged.push(local ? { ...local, ...remote } : { ...remote });
    }
    for (const local of this.reviews) {
      if (!ids.has(local.id)) merged.push(local);
    }
    merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    this.reviews = merged;
    this.save();
    this.notify('reviewsUpdated', this.reviews);
  }

  // ── Persistencia local ─────────────────────────────────────────

  load() {
    try {
      if (this._isAdminMode()) return [];
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  save() {
    if (this._isAdminMode()) {
      this.notify('reviewsUpdated', this.reviews);
      return;
    }
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.reviews));
      this.notify('reviewsUpdated', this.reviews);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('[ReviewService] localStorage lleno. No se pudo guardar las reseñas.');
      }
    }
  }

  _isAdminMode() {
    const fbUser = window.firebaseClient?.getCurrentUser?.();
    return !!(fbUser && String(fbUser.email || '').toLowerCase() === 'puntodigitalti@gmail.com');
  }

  setupCrossTabSync() {
    window.addEventListener('storage', (e) => {
      if (this._isAdminMode()) return;
      if (e.key === this.storageKey) {
        this.reviews = this.load();
        this.notify('reviewsUpdated', this.reviews);
      }
    });
  }

  // ── CRUD ──────────────────────────────────────────────────────

  generateReviewId() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `RV-${year}${month}${day}-${random}`;
  }

  async createReview({ reviewerName, reviewerEmail, reviewerPhone = '', productName = '', rating, title = '', comment, videoUrl = '', videoType = 'link', videoThumbnail = '', imageUrl = '' }) {
    if (!reviewerName || !reviewerEmail || !rating || !comment) {
      throw new Error('Faltan campos obligatorios: nombre, email, puntuación o comentario');
    }
    if (rating < 1 || rating > 5) {
      throw new Error('La puntuación debe ser entre 1 y 5');
    }

    const review = {
      id: this.generateReviewId(),
      reviewerName: String(reviewerName).trim(),
      reviewerEmail: String(reviewerEmail).trim().toLowerCase(),
      reviewerPhone: String(reviewerPhone || '').trim(),
      productName: String(productName || '').trim(),
      rating: parseInt(rating),
      title: String(title || '').trim(),
      comment: String(comment).trim(),
      videoUrl: String(videoUrl || '').trim(),
      videoType: videoType || this.VIDEO_TYPES.LINK,
      videoThumbnail: String(videoThumbnail || '').trim(),
      imageUrl: String(imageUrl || '').trim(),
      status: this.STATUS.PENDING,
      isFeatured: false,
      moderationNote: '',
      helpfulCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.reviews.unshift(review);
    this.save();

    await this._createReviewInFirestore(review);
    this.notify('newReview', review);

    return review;
  }

  async updateReview(reviewId, updates) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) {
      console.error('[ReviewService] Reseña no encontrada:', reviewId);
      return null;
    }

    if (updates.rating !== undefined) {
      const r = parseInt(updates.rating);
      if (r < 1 || r > 5) throw new Error('La puntuación debe ser entre 1 y 5');
      updates.rating = r;
    }

    Object.assign(review, updates, { updatedAt: new Date().toISOString() });
    this.save();

    const firestoreUpdates = { ...updates, updatedAt: review.updatedAt };
    this._updateReviewInFirestore(reviewId, firestoreUpdates).catch(e => {});

    this.notify('reviewUpdated', review);
    return review;
  }

  async approveReview(reviewId, moderationNote = '') {
    return this.updateReview(reviewId, {
      status: this.STATUS.APPROVED,
      moderationNote
    });
  }

  async rejectReview(reviewId, moderationNote = '') {
    return this.updateReview(reviewId, {
      status: this.STATUS.REJECTED,
      moderationNote
    });
  }

  async toggleFeatured(reviewId) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) return null;
    return this.updateReview(reviewId, { isFeatured: !review.isFeatured });
  }

  async deleteReview(reviewId) {
    this.reviews = this.reviews.filter(r => r.id !== reviewId);
    this.save();
    await this._deleteReviewInFirestore(reviewId);
    this.notify('reviewDeleted', reviewId);
    return true;
  }

  markHelpful(reviewId) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) return null;
    review.helpfulCount = (review.helpfulCount || 0) + 1;
    review.updatedAt = new Date().toISOString();
    this.save();
    this._updateReviewInFirestore(reviewId, { helpfulCount: review.helpfulCount, updatedAt: review.updatedAt }).catch(e => {});
    return review;
  }

  // ── Query helpers ──────────────────────────────────────────────

  getReviews(filter = {}) {
    let result = [...this.reviews];
    if (filter.status) result = result.filter(r => r.status === filter.status);
    if (filter.isFeatured !== undefined) result = result.filter(r => !!r.isFeatured === !!filter.isFeatured);
    if (filter.rating) result = result.filter(r => r.rating === parseInt(filter.rating));
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(r =>
        r.reviewerName.toLowerCase().includes(q) ||
        r.reviewerEmail.toLowerCase().includes(q) ||
        (r.productName || '').toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        (r.title || '').toLowerCase().includes(q)
      );
    }
    return result;
  }

  getApprovedReviews() {
    return this.getReviews({ status: this.STATUS.APPROVED });
  }

  getReviewById(reviewId) {
    return this.reviews.find(r => r.id === reviewId);
  }

  getStats() {
    const approved = this.reviews.filter(r => r.status === this.STATUS.APPROVED);
    const avgRating = approved.length
      ? approved.reduce((sum, r) => sum + r.rating, 0) / approved.length
      : 0;

    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approved.forEach(r => { ratingDist[r.rating] = (ratingDist[r.rating] || 0) + 1; });

    return {
      total: this.reviews.length,
      pending: this.reviews.filter(r => r.status === this.STATUS.PENDING).length,
      approved: approved.length,
      rejected: this.reviews.filter(r => r.status === this.STATUS.REJECTED).length,
      featured: this.reviews.filter(r => r.isFeatured && r.status === this.STATUS.APPROVED).length,
      avgRating: Math.round(avgRating * 10) / 10,
      totalHelpful: this.reviews.reduce((sum, r) => sum + (r.helpfulCount || 0), 0),
      ratingDistribution: ratingDist
    };
  }

  // ── Observer pattern ───────────────────────────────────────────

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

  // ── Video URL helpers ──────────────────────────────────────────

  getEmbedUrl(videoUrl, videoType) {
    const url = String(videoUrl || '').trim();
    if (!url) return null;

    switch (videoType) {
      case this.VIDEO_TYPES.YOUTUBE: {
        const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
        const id = ytMatch ? ytMatch[1] : url;
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      case this.VIDEO_TYPES.DRIVE: {
        const driveMatch = url.match(/\/d\/([A-Za-z0-9_-]+)/);
        const id = driveMatch ? driveMatch[1] : null;
        return id ? `https://drive.google.com/file/d/${id}/preview` : url;
      }
      default:
        return url;
    }
  }

  getVideoThumbnail(videoUrl, videoType, fallback) {
    if (fallback) return fallback;
    const url = String(videoUrl || '').trim();
    if (videoType === this.VIDEO_TYPES.YOUTUBE) {
      const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
      const id = ytMatch ? ytMatch[1] : url;
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
    }
    return '';
  }
}

window.reviewService = new ReviewService();
