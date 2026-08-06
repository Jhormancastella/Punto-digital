/**
 * Controlador público de Reseñas
 * Maneja la UI de reseñas.html: summary, grid, formulario, modales y video player
 */
(function () {
  'use strict';

  const state = {
    currentRating: 0,
    currentFilter: 'all',
    votedHelpful: new Set(),
    pendingReviewEmail: null,
    selectedImageFile: null,
    uploadedImageUrl: '',
    lastFocused: null
  };

  const PENDING_KEY = 'puntoDigital_pendingReviews_email';

  // ── Init ──────────────────────────────────────────────────────

  function init() {
    try {
      const saved = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
      if (Array.isArray(saved)) {
        state.pendingReviewEmail = saved;
      }
    } catch (_) {
      state.pendingReviewEmail = [];
    }

    buildRatingPicker();
    bindEvents();
    renderAll();
    renderFooter();

    if (window.reviewService?.subscribe) {
      window.reviewService.subscribe(() => renderAll());
    }
  }

  function lockBodyScroll(lock) {
    if (!document.body) return;
    if (lock) {
      const prev = document.body.style.overflow || '';
      document.body.dataset.prevOverflow = prev;
      document.body.style.overflow = 'hidden';
    } else {
      const prev = document.body.dataset.prevOverflow;
      document.body.style.overflow = prev == null ? '' : prev;
    }
  }
  function anyModalOpen() {
    return !!(document.getElementById('reviewFormModal')?.classList.contains('open'))
        || !!(document.getElementById('videoPlayerModal')?.classList.contains('open'))
        || !!(document.getElementById('imageViewerModal')?.classList.contains('open'));
  }
  function bindEvents() {
    document.getElementById('openReviewBtn')?.addEventListener('click', openReviewFormModal);
    document.getElementById('reviewFormModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'reviewFormModal') closeReviewFormModal();
    });
    document.getElementById('videoPlayerModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'videoPlayerModal') closeVideoPlayerModal();
    });
    document.getElementById('imageViewerModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'imageViewerModal') closeImageViewerModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const vp = document.getElementById('videoPlayerModal');
      const rf = document.getElementById('reviewFormModal');
      const iv = document.getElementById('imageViewerModal');
      if (iv?.classList.contains('open')) closeImageViewerModal();
      else if (vp?.classList.contains('open')) closeVideoPlayerModal();
      else if (rf?.classList.contains('open')) closeReviewFormModal();
    });

    document.querySelectorAll('[data-rating-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-rating-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.dataset.ratingFilter;
        renderGrid();
      });
    });

    bindImageUploadEvents();
  }

  // ── Image Upload ───────────────────────────────────────────────

  function bindImageUploadEvents() {
    const fileInput = document.getElementById('rvImageFile');
    const browseBtn = document.getElementById('rvBrowseBtn');
    const dropZone = document.getElementById('rvImageDropZone');
    const removeBtn = document.getElementById('rvImageRemoveBtn');

    browseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput?.click();
    });
    dropZone?.addEventListener('click', (e) => {
      if (e.target.closest('.rv-image-remove')) return;
      if (e.target.closest('.rv-browse-btn')) return;
      if (state.selectedImageFile || state.uploadedImageUrl) return;
      fileInput?.click();
    });
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) handleImageFile(file);
    });

    dropZone?.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    });
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    });
    dropZone?.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target === dropZone) dropZone.classList.remove('dragover');
    });
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer?.files?.[0];
      if (file) handleImageFile(file);
    });

    removeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      clearImageSelection();
    });
  }

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('El archivo seleccionado no es una imagen válida.', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('La imagen es muy grande. Máximo 8MB.', 'error');
      return;
    }
    state.selectedImageFile = file;
    state.uploadedImageUrl = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const previewImg = document.getElementById('rvImagePreviewImg');
      const placeholder = document.getElementById('rvImagePlaceholder');
      const previewWrap = document.getElementById('rvImagePreview');
      const progressWrap = document.getElementById('rvImageProgress');
      if (previewImg) previewImg.src = ev.target.result;
      placeholder?.setAttribute('hidden', 'true');
      progressWrap?.setAttribute('hidden', 'true');
      previewWrap?.removeAttribute('hidden');
    };
    reader.readAsDataURL(file);
  }

  function clearImageSelection() {
    state.selectedImageFile = null;
    state.uploadedImageUrl = '';
    const fileInput = document.getElementById('rvImageFile');
    const previewImg = document.getElementById('rvImagePreviewImg');
    const placeholder = document.getElementById('rvImagePlaceholder');
    const previewWrap = document.getElementById('rvImagePreview');
    const progressWrap = document.getElementById('rvImageProgress');
    if (fileInput) fileInput.value = '';
    if (previewImg) previewImg.removeAttribute('src');
    previewWrap?.setAttribute('hidden', 'true');
    progressWrap?.setAttribute('hidden', 'true');
    placeholder?.removeAttribute('hidden');
  }

  function setImageProgress(percent, label) {
    const progressWrap = document.getElementById('rvImageProgress');
    const fill = document.getElementById('rvProgressFill');
    const labelEl = document.getElementById('rvProgressLabel');
    const placeholder = document.getElementById('rvImagePlaceholder');
    const previewWrap = document.getElementById('rvImagePreview');
    placeholder?.setAttribute('hidden', 'true');
    previewWrap?.setAttribute('hidden', 'true');
    progressWrap?.removeAttribute('hidden');
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    if (labelEl) labelEl.textContent = label || 'Subiendo imagen...';
  }

  async function uploadSelectedImage() {
    if (!state.selectedImageFile) return state.uploadedImageUrl || '';
    if (!window.ImageProcessor && !window.imageProcessor) {
      const reader = new FileReader();
      return await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result || '');
        reader.readAsDataURL(state.selectedImageFile);
      });
    }
    const processor = window.imageProcessor || new window.ImageProcessor();
    window.imageProcessor = processor;

    let finished = false;
    const progressTimer = setInterval(() => {
      if (finished) return;
      const fill = document.getElementById('rvProgressFill');
      if (!fill) return;
      const current = parseInt(fill.style.width || '0', 10) || 0;
      const next = Math.min(current + Math.max(3, Math.round((92 - current) * 0.15)), 92);
      fill.style.width = `${next}%`;
    }, 220);

    try {
      setImageProgress(8, 'Preparando imagen...');
      const url = await processor.processImage(state.selectedImageFile, {
        folder: 'puntodigital/reviews',
        tolerance: 20,
        outputSize: 1200,
        smooth: 2
      });
      finished = true;
      clearInterval(progressTimer);
      setImageProgress(100, '¡Imagen lista!');
      state.uploadedImageUrl = url || '';
      state.selectedImageFile = null;
      await new Promise((r) => setTimeout(r, 280));
      return state.uploadedImageUrl;
    } catch (err) {
      finished = true;
      clearInterval(progressTimer);
      console.warn('Error al subir imagen:', err);
      showToast('No se pudo subir la imagen, la reseña se enviará sin foto.', 'info');
      state.uploadedImageUrl = '';
      clearImageSelection();
      return '';
    }
  }

  // ── Rating Picker ─────────────────────────────────────────────

  function buildRatingPicker() {
    const picker = document.getElementById('rvRatingPicker');
    if (!picker) return;
    picker.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'star-pick';
      btn.dataset.value = String(i);
      btn.innerHTML = '<i class="fas fa-star"></i>';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-label', `${i} estrella${i > 1 ? 's' : ''}`);

      btn.addEventListener('mouseenter', () => hoverStars(i));
      btn.addEventListener('mouseleave', () => hoverStars(state.currentRating));
      btn.addEventListener('click', () => {
        state.currentRating = i;
        updateStarsUI();
      });

      picker.appendChild(btn);
    }
  }

  function hoverStars(value) {
    document.querySelectorAll('#rvRatingPicker .star-pick').forEach((el, idx) => {
      el.classList.toggle('hover', idx < value);
    });
  }

  function updateStarsUI() {
    document.querySelectorAll('#rvRatingPicker .star-pick').forEach((el, idx) => {
      el.classList.toggle('on', idx < state.currentRating);
      el.setAttribute('aria-checked', String(idx < state.currentRating));
    });
  }

  function renderStars(rating, cls = '') {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += `<i class="fas fa-star ${i <= rating ? ('star-on ' + cls) : ''}"></i>`;
    }
    return html;
  }

  // ── Render Summary ────────────────────────────────────────────

  function renderSummary() {
    const stats = window.reviewService?.getStats?.() || {
      total: 0, pending: 0, approved: 0, rejected: 0, featured: 0, avgRating: 0, totalHelpful: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    const approved = stats.approved || 0;
    const avg = stats.avgRating || 0;

    document.getElementById('reviewsAvgBig').textContent = avg.toFixed(1);
    document.getElementById('reviewsAvgStars').innerHTML = renderStars(Math.round(avg));
    document.getElementById('reviewsAvgTotal').textContent = `${approved} reseña${approved === 1 ? '' : 's'} verificada${approved === 1 ? '' : 's'}`;

    const dist = stats.ratingDistribution || {};
    const distEl = document.getElementById('reviewsRatingDist');
    distEl.innerHTML = '';

    for (let r = 5; r >= 1; r--) {
      const count = dist[r] || 0;
      const pct = approved ? Math.round((count / approved) * 100) : 0;
      const row = document.createElement('div');
      row.className = 'reviews-rating-row';
      row.innerHTML = `
        <strong>${r}</strong>
        <div class="reviews-rating-bar"><div class="reviews-rating-fill" style="width:${pct}%"></div></div>
        <strong>${count}</strong>
      `;
      distEl.appendChild(row);
    }
  }

  // ── Render Grid ───────────────────────────────────────────────

  function getFilteredReviews() {
    let list = window.reviewService?.getApprovedReviews?.() || [];
    const f = state.currentFilter;
    if (f === 'all') return list;
    if (f === 'video') return list.filter(r => r.videoUrl && r.videoUrl.trim());
    if (f === 'photo') return list.filter(r => r.imageUrl && r.imageUrl.trim());
    if (f === '5' || f === '4' || f === '3') return list.filter(r => r.rating === parseInt(f));
    return list;
  }

  function getInitials(name) {
    const parts = String(name || 'U').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      if (isNaN(d)) return '';
      return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (_) {
      return '';
    }
  }

  function renderGrid() {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;

    const list = getFilteredReviews();

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="reviews-empty">
          <i class="fas fa-comment-slash"></i>
          <p>No hay reseñas con este filtro</p>
          <span>Prueba con otra puntuación o espera nuevas aprobaciones.</span>
        </div>`;
      return;
    }

    grid.innerHTML = list.map(r => {
      const hasVideo = !!(r.videoUrl && r.videoUrl.trim());
      const voted = state.votedHelpful.has(r.id);
      const embed = window.reviewService?.getEmbedUrl?.(r.videoUrl, r.videoType) || r.videoUrl;
      const thumb = window.reviewService?.getVideoThumbnail?.(r.videoUrl, r.videoType, r.videoThumbnail) || '';

      let videoHtml = '';
      if (hasVideo) {
        const thumbSafe = thumb ? `style="background-image:url('${encodeURI(thumb)}')"` : '';
        videoHtml = `
          <div class="review-video" data-review-id="${r.id}" data-video-embed="${encodeURIComponent(embed || '')}" data-video-title="${encodeURIComponent(r.reviewerName + ' · ' + (r.productName || 'Reseña'))}">
            <div class="review-video-thumb" ${thumbSafe}>
              <div class="review-play-btn"><i class="fas fa-play"></i></div>
            </div>
          </div>
        `;
      }

      const titleHtml = r.title ? `<h3 class="review-title">${escapeHtml(r.title)}</h3>` : '';
      const productHtml = r.productName ? `<span class="review-product"><i class="fas fa-shopping-bag"></i> ${escapeHtml(r.productName)}</span>` : '';
      const hasImage = !!(r.imageUrl && r.imageUrl.trim());
      const imageHtml = hasImage ? `
        <div class="review-image" data-review-id="${r.id}" data-image-src="${encodeURIComponent(r.imageUrl)}" data-image-title="${encodeURIComponent(r.reviewerName + ' · ' + (r.productName || 'Foto reseña'))}">
          <img src="${escapeAttr(r.imageUrl)}" alt="Foto de ${escapeAttr(r.reviewerName)}" loading="lazy">
          <div class="review-image-overlay"><i class="fas fa-search-plus"></i></div>
        </div>
      ` : '';

      return `
        <article class="review-card ${r.isFeatured ? 'featured' : ''}" data-review-id="${r.id}">
          <div class="review-head">
            <div class="review-avatar">${getInitials(r.reviewerName)}</div>
            <div class="review-head-info">
              <div class="review-name">${escapeHtml(r.reviewerName)}</div>
              <div class="review-meta">
                ${productHtml}
                <span><i class="far fa-clock"></i> ${formatDate(r.createdAt)}</span>
              </div>
            </div>
          </div>
          <div class="review-stars">${renderStars(r.rating)}</div>
          ${titleHtml}
          <p class="review-comment">${escapeHtml(r.comment)}</p>
          ${imageHtml}
          ${videoHtml}
          <div class="review-foot">
            <button class="review-helpful ${voted ? 'voted' : ''}" data-helpful-id="${r.id}" ${voted ? 'disabled' : ''}>
              <i class="fas fa-thumbs-up"></i>
              <span>Útil${voted ? ' ✓' : ''}</span>
              <strong>(${r.helpfulCount || 0})</strong>
            </button>
            <span class="review-date">${formatDate(r.updatedAt)}</span>
          </div>
        </article>
      `;
    }).join('');

    // Bind de eventos interactivos
    grid.querySelectorAll('.review-video').forEach(el => {
      el.addEventListener('click', () => {
        const embed = decodeURIComponent(el.dataset.videoEmbed || '');
        const title = decodeURIComponent(el.dataset.videoTitle || 'Video reseña');
        openVideoPlayer(embed, title);
      });
    });

    grid.querySelectorAll('.review-image').forEach(el => {
      el.addEventListener('click', () => {
        const src = decodeURIComponent(el.dataset.imageSrc || '');
        const title = decodeURIComponent(el.dataset.imageTitle || 'Foto reseña');
        openImageViewer(src, title);
      });
    });

    grid.querySelectorAll('[data-helpful-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.helpfulId;
        if (state.votedHelpful.has(id)) return;
        e.preventDefault();
        state.votedHelpful.add(id);
        try {
          window.reviewService?.markHelpful?.(id);
        } catch (_) {}
        showToast('¡Gracias por tu voto!', 'success');
        renderGrid();
      });
    });
  }

  // ── Pending banner ────────────────────────────────────────────

  function renderPendingBanner() {
    const banner = document.getElementById('reviewsPendingBanner');
    if (!banner) return;

    if (!Array.isArray(state.pendingReviewEmail) || state.pendingReviewEmail.length === 0) {
      banner.innerHTML = '';
      return;
    }

    const pending = window.reviewService?.getReviews?.({ status: 'pending' }) || [];
    const mine = pending.filter(p => state.pendingReviewEmail.includes(String(p.reviewerEmail).toLowerCase()));
    if (mine.length === 0) {
      banner.innerHTML = '';
      return;
    }

    banner.innerHTML = `
      <div class="reviews-pending-banner">
        <i class="fas fa-hourglass-half"></i>
        <div>
          <strong>Tienes ${mine.length === 1 ? 'una reseña pendiente de moderación' : `${mine.length} reseñas pendientes de moderación`}</strong>
          Gracias por compartir tu experiencia. Nuestro equipo revisará tu reseña antes de publicarla. ¡Normalmente lo hacemos en menos de 24 horas!
        </div>
      </div>
    `;
  }

  // ── Render all ────────────────────────────────────────────────

  function renderAll() {
    renderSummary();
    renderPendingBanner();
    renderGrid();
    // Sync cart count
    const cartCount = window.cartService?.getCart?.()?.length || 0;
    const cc = document.getElementById('cartCount');
    if (cc) cc.textContent = cartCount;
  }

  // ── Modals: Form ──────────────────────────────────────────────

  function openReviewFormModal() {
    const modal = document.getElementById('reviewFormModal');
    if (!modal) return;
    state.lastFocused = document.activeElement;
    resetForm();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    lockBodyScroll(true);
    setTimeout(() => document.getElementById('rvName')?.focus({ preventScroll: true }), 50);
  }
  window.openReviewFormModal = openReviewFormModal;

  function closeReviewFormModal() {
    const modal = document.getElementById('reviewFormModal');
    if (!modal) return;
    if (document.activeElement && modal.contains(document.activeElement)) {
      document.activeElement.blur?.();
    }
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (!anyModalOpen()) lockBodyScroll(false);
    if (state.lastFocused && typeof state.lastFocused.focus === 'function') {
      try { state.lastFocused.focus({ preventScroll: true }); } catch (_) {}
      state.lastFocused = null;
    }
  }
  window.closeReviewFormModal = closeReviewFormModal;

  function resetForm() {
    state.currentRating = 0;
    const f = document.getElementById('reviewForm');
    if (f) f.reset();
    buildRatingPicker();
    clearImageSelection();
  }

  function submitReviewForm(e) {
    if (e) e.preventDefault();

    const name = document.getElementById('rvName')?.value.trim();
    const email = document.getElementById('rvEmail')?.value.trim().toLowerCase();
    const phone = document.getElementById('rvPhone')?.value.trim() || '';
    const product = document.getElementById('rvProduct')?.value.trim() || '';
    const title = document.getElementById('rvTitle')?.value.trim() || '';
    const comment = document.getElementById('rvComment')?.value.trim();
    const videoUrl = document.getElementById('rvVideoUrl')?.value.trim() || '';
    const videoType = document.getElementById('rvVideoType')?.value || 'link';

    if (!name || !email || !state.currentRating || !comment) {
      showToast('Completa nombre, email, puntuación y comentario.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Ingresa un correo electrónico válido.', 'error');
      return;
    }

    const submitBtn = document.getElementById('rvSubmitBtn');
    const originalHtml = submitBtn?.innerHTML;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    }

    Promise.resolve()
      .then(async () => {
        const imageUrl = await uploadSelectedImage();
        return window.reviewService.createReview({
          reviewerName: name,
          reviewerEmail: email,
          reviewerPhone: phone,
          productName: product,
          rating: state.currentRating,
          title,
          comment,
          videoUrl,
          videoType,
          imageUrl
        });
      })
      .then((rv) => {
        if (rv) {
          if (!Array.isArray(state.pendingReviewEmail)) state.pendingReviewEmail = [];
          if (!state.pendingReviewEmail.includes(email)) state.pendingReviewEmail.push(email);
          try {
            localStorage.setItem(PENDING_KEY, JSON.stringify(state.pendingReviewEmail));
          } catch (_) {}
        }
        showToast('¡Reseña enviada! Queda pendiente de aprobación.', 'success');
        closeReviewFormModal();
      })
      .catch((err) => {
        console.error(err);
        showToast(err?.message || 'No pudimos enviar la reseña. Inténtalo de nuevo.', 'error');
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHtml || '<i class="fas fa-paper-plane"></i> Enviar reseña';
        }
      });
  }
  window.submitReviewForm = submitReviewForm;

  // ── Modals: Video Player ──────────────────────────────────────

  function openVideoPlayer(embedUrl, title) {
    const modal = document.getElementById('videoPlayerModal');
    const body = document.getElementById('videoPlayerBody');
    const titleEl = document.getElementById('videoPlayerTitle');
    if (!modal || !body) return;

    state.lastFocused = document.activeElement;
    if (titleEl) {
      titleEl.innerHTML = `<i class="fas fa-play-circle" style="color:var(--gold-primary)"></i> ${escapeHtml(title || 'Video reseña')}`;
    }

    const isYt = /youtube\.com\/embed|youtu\.be/.test(embedUrl);
    const isDrive = /drive\.google\.com\/file\/d/.test(embedUrl);

    if (isYt || isDrive || /<iframe/i.test(embedUrl)) {
      const allow = isYt
        ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
        : 'autoplay';
      body.innerHTML = `<iframe src="${escapeAttr(embedUrl)}" title="Video reseña" allow="${allow}" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    } else {
      body.innerHTML = `<video controls autoplay playsinline preload="metadata" src="${escapeAttr(embedUrl)}">Tu navegador no soporta el reproductor de video.</video>`;
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    lockBodyScroll(true);
  }
  window.openVideoPlayer = openVideoPlayer;

  function closeVideoPlayerModal() {
    const modal = document.getElementById('videoPlayerModal');
    const body = document.getElementById('videoPlayerBody');
    if (!modal) return;
    if (document.activeElement && modal.contains(document.activeElement)) {
      document.activeElement.blur?.();
    }
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (body) body.innerHTML = '';
    if (!anyModalOpen()) lockBodyScroll(false);
    if (state.lastFocused && typeof state.lastFocused.focus === 'function') {
      try { state.lastFocused.focus({ preventScroll: true }); } catch (_) {}
      state.lastFocused = null;
    }
  }
  window.closeVideoPlayerModal = closeVideoPlayerModal;

  // ── Modals: Image Viewer ───────────────────────────────────────

  function openImageViewer(src, title) {
    const modal = document.getElementById('imageViewerModal');
    const body = document.getElementById('imageViewerBody');
    const titleEl = document.getElementById('imageViewerTitle');
    if (!modal || !body) return;

    state.lastFocused = document.activeElement;
    if (titleEl) {
      titleEl.innerHTML = `<i class="fas fa-image" style="color:var(--gold-primary)"></i> ${escapeHtml(title || 'Foto reseña')}`;
    }

    body.innerHTML = `<img src="${escapeAttr(src)}" alt="${escapeAttr(title || 'Foto reseña')}">`;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    lockBodyScroll(true);
  }
  window.openImageViewer = openImageViewer;

  function closeImageViewerModal() {
    const modal = document.getElementById('imageViewerModal');
    const body = document.getElementById('imageViewerBody');
    if (!modal) return;
    if (document.activeElement && modal.contains(document.activeElement)) {
      document.activeElement.blur?.();
    }
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (body) body.innerHTML = '';
    if (!anyModalOpen()) lockBodyScroll(false);
    if (state.lastFocused && typeof state.lastFocused.focus === 'function') {
      try { state.lastFocused.focus({ preventScroll: true }); } catch (_) {}
      state.lastFocused = null;
    }
  }
  window.closeImageViewerModal = closeImageViewerModal;

  // ── Toast ─────────────────────────────────────────────────────

  let toastTimer = null;
  function showToast(message, type = 'info') {
    const el = document.getElementById('reviewsToast');
    if (!el) return;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const cls = { success: 'success', error: 'error', info: 'info' };
    el.className = `reviews-toast show ${cls[type] || ''}`;
    el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, 3600);
  }

  // ── Utils ─────────────────────────────────────────────────────

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(str) {
    return String(str ?? '').replace(/"/g, '&quot;');
  }

  // ── Footer ────────────────────────────────────────────────────

  function renderFooter() {
    if (typeof Helpers?.renderFooter === 'function') {
      Helpers.renderFooter();
    }
  }

  // ── Boot ──────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Renderizar footer cuando los datos del sitio estén listos
  window.addEventListener('siteDataReady', renderFooter);

  // Si siteData ya cargó antes de que este script se ejecute
  if (window.siteData?.getData?.()?.footer) {
    renderFooter();
  }
})();
