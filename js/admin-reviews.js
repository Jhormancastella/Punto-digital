/**
 * Controlador de Gestión de Reseñas en Admin
 * Renderiza stats, filtros, tabla y modal de detalle/edición de reseñas.
 */
(function () {
  'use strict';

  const state = {
    currentFilter: 'all',
    searchQuery: '',
    selectedId: null,
    _saveTimer: null
  };

  const AdminReviews = {
    init() {
      this.bindDelegation();
      if (window.reviewService?.subscribe) {
        window.reviewService.subscribe(() => this.renderAll());
      }
      this.renderAll();
    },

    refresh() {
      this.renderAll();
      this.notify('Lista actualizada', 'success');
    },

    bindDelegation() {
      document.addEventListener('click', (e) => {
        const row = e.target.closest('[data-rv-row]');
        if (row && !e.target.closest('[data-rv-action]') && !e.target.closest('button,a,input,textarea,select')) {
          this.openDetail(row.dataset.rvRow);
          return;
        }

        const actionBtn = e.target.closest('[data-rv-action]');
        if (actionBtn) {
          e.preventDefault();
          e.stopPropagation();
          const act = actionBtn.dataset.rvAction;
          const id = actionBtn.dataset.rvId;
          switch (act) {
            case 'view': this.openDetail(id); break;
            case 'approve': this.quickApprove(id); break;
            case 'reject': this.quickReject(id); break;
            case 'featured': this.toggleFeatured(id); break;
            case 'delete': this.deleteReview(id); break;
            case 'video': this.previewVideo(id); break;
            case 'photo': this.previewPhoto(id); break;
          }
          return;
        }

        // Acciones dentro del modal de detalle
        const detailAction = e.target.closest('[data-rv-detail-action]');
        if (detailAction) {
          e.preventDefault();
          const act = detailAction.dataset.rvDetailAction;
          const id = detailAction.dataset.rvId || state.selectedId;
          if (!id) return;
          switch (act) {
            case 'save': this.saveEdits(id); break;
            case 'approve': this.approveFromDetail(id); break;
            case 'reject': this.rejectFromDetail(id); break;
            case 'featured': this.toggleFeatured(id); break;
            case 'delete': this.deleteReview(id, true); break;
            case 'cancel': closeReviewDetailModal(); break;
          }
        }
      });

      // Cerrar modal al hacer clic fuera
      document.getElementById('reviewDetailModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'reviewDetailModal') closeReviewDetailModal();
      });
    },

    // ── Render ──────────────────────────────────────────────────

    renderAll() {
      this.renderStats();
      this.renderTable();
      window.adminPanel?.updateStats?.();
    },

    renderStats() {
      const stats = window.reviewService?.getStats?.() || {
        total: 0, pending: 0, approved: 0, rejected: 0,
        featured: 0, avgRating: 0, totalHelpful: 0, ratingDistribution: {}
      };
      const all = window.reviewService?.getReviews?.() || [];
      const videos = all.filter(r => r.videoUrl && r.videoUrl.trim()).length;
      const photos = all.filter(r => r.imageUrl && r.imageUrl.trim()).length;

      setText('rv-stat-pending', String(stats.pending || 0));
      setText('rv-stat-approved', String(stats.approved || 0));
      setText('rv-stat-rejected', String(stats.rejected || 0));
      setText('rv-stat-avg', (stats.avgRating || 0).toFixed(1));
      setText('rv-stat-featured', String(stats.featured || 0));
      setText('rv-stat-videos', String(videos));
      setText('rv-stat-photos', String(photos));
    },

    getFilteredReviews() {
      let list = window.reviewService?.getReviews?.() || [];
      const f = state.currentFilter;
      const q = String(state.searchQuery || '').trim().toLowerCase();

      if (f !== 'all') {
        if (f === 'pending' || f === 'approved' || f === 'rejected') {
          list = list.filter(r => r.status === f);
        } else if (f === 'featured') {
          list = list.filter(r => !!r.isFeatured);
        } else if (f === 'video') {
          list = list.filter(r => r.videoUrl && r.videoUrl.trim());
        } else if (f === 'photo') {
          list = list.filter(r => r.imageUrl && r.imageUrl.trim());
        }
      }

      if (q) {
        list = list.filter(r =>
          (r.reviewerName || '').toLowerCase().includes(q) ||
          (r.reviewerEmail || '').toLowerCase().includes(q) ||
          (r.reviewerPhone || '').toLowerCase().includes(q) ||
          (r.productName || '').toLowerCase().includes(q) ||
          (r.title || '').toLowerCase().includes(q) ||
          (r.comment || '').toLowerCase().includes(q)
        );
      }

      return list;
    },

    renderTable() {
      const tbody = document.getElementById('reviewsTableBody');
      if (!tbody) return;

      const list = this.getFilteredReviews();

      if (list.length === 0) {
        const msg = state.searchQuery
          ? '<p>No hay reseñas que coincidan con la búsqueda</p><span>Intenta con otros términos.</span>'
          : '<p>No hay reseñas con este filtro</p><span>Las reseñas enviadas aparecerán aquí.</span>';
        tbody.innerHTML = `
          <tr class="orders-empty-row">
            <td colspan="10">
              <div class="orders-empty">
                <i class="fas fa-comments"></i>
                ${msg}
              </div>
            </td>
          </tr>`;
        return;
      }

      const STATUS_COLORS = { pending: '#ffc107', approved: '#198754', rejected: '#dc3545' };
      const STATUS_LABELS = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };

      tbody.innerHTML = list.map(r => {
        const color = STATUS_COLORS[r.status] || '#888';
        const label = STATUS_LABELS[r.status] || r.status;
        const hasVideo = !!(r.videoUrl && r.videoUrl.trim());
        const hasImage = !!(r.imageUrl && r.imageUrl.trim());
        const initials = getInitials(r.reviewerName);
        const fecha = formatDateTime(r.createdAt);
        const summary = r.title
          ? truncate(r.title, 42)
          : truncate(r.comment, 60);
        const productHtml = r.productName ? `<div class="order-items-count">${escapeHtml(truncate(r.productName, 22))}</div>` : '<small style="color:var(--text-gray,#888)">—</small>';

        return `
          <tr class="order-row" data-rv-row="${r.id}">
            <td>
              <div class="order-cell-customer">
                <div class="order-avatar">${initials}</div>
                <div>
                  <strong>${escapeHtml(truncate(r.reviewerName, 22))}</strong>
                  <small><i class="far fa-envelope"></i> ${escapeHtml(truncate(r.reviewerEmail, 28))}</small>
                </div>
              </div>
            </td>
            <td>
              <div class="review-stars">${renderStars(r.rating)}</div>
              <div style="font-size:11px;color:var(--text-gray,#888);margin-top:4px">${r.rating}/5 · ${r.helpfulCount || 0} útiles</div>
            </td>
            <td>
              <div style="font-size:12.5px;font-weight:600;color:var(--text-white,#fff);margin-bottom:3px">${escapeHtml(summary)}</div>
              <small style="color:var(--text-gray,#888)">${escapeHtml(truncate(r.comment, 80))}</small>
            </td>
            <td>${productHtml}</td>
            <td>
              ${hasVideo
                ? `<button class="order-act-btn order-act-view" data-rv-action="video" data-rv-id="${r.id}" title="Ver video">
                     <i class="fas fa-play"></i>
                   </button>
                   <small style="color:var(--text-gray,#888);font-size:10.5px;margin-left:4px">${escapeHtml(String(r.videoType || 'link').toUpperCase())}</small>`
                : `<span style="color:var(--text-gray,#777);font-size:11px"><i class="fas fa-video-slash"></i> Sin video</span>`}
            </td>
            <td>
              ${hasImage
                ? `<button class="order-act-btn order-act-view" data-rv-action="photo" data-rv-id="${r.id}" title="Ver foto" style="background:rgba(249,115,22,0.12);color:#f97316">
                     <i class="fas fa-camera"></i>
                   </button>`
                : `<span style="color:var(--text-gray,#777);font-size:11px"><i class="fas fa-image"></i> Sin foto</span>`}
            </td>
            <td>
              <span class="order-status-badge" style="--c:${color}">
                <span class="order-status-dot"></span>${label}
              </span>
            </td>
            <td>
              <button class="order-act-btn" data-rv-action="featured" data-rv-id="${r.id}"
                      title="${r.isFeatured ? 'Quitar de destacadas' : 'Marcar como destacada'}"
                      style="background:${r.isFeatured ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.04)'};color:${r.isFeatured ? '#d4a843' : '#888'}">
                <i class="fas ${r.isFeatured ? 'fa-gem' : 'fa-regular fa-gem'}"></i>
              </button>
            </td>
            <td>
              <div style="font-size:12px;color:var(--text-white,#fff)">${fecha.date}</div>
              <small style="color:var(--text-gray,#888);font-size:10.5px">${fecha.time}</small>
            </td>
            <td>
              <div class="order-row-actions">
                ${r.status === 'pending'
                  ? `<button class="order-act-btn" style="background:rgba(25,135,84,0.1);color:#198754" data-rv-action="approve" data-rv-id="${r.id}" title="Aprobar">
                       <i class="fas fa-check"></i>
                     </button>
                     <button class="order-act-btn order-act-del" data-rv-action="reject" data-rv-id="${r.id}" title="Rechazar">
                       <i class="fas fa-xmark"></i>
                     </button>`
                  : `<button class="order-act-btn order-act-view" data-rv-action="view" data-rv-id="${r.id}" title="Ver / Editar">
                       <i class="fas fa-eye"></i>
                     </button>`}
                <button class="order-act-btn order-act-del" data-rv-action="delete" data-rv-id="${r.id}" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },

    // ── Filtros / Búsqueda ──────────────────────────────────────

    filter(btn, value) {
      document.querySelectorAll('#reviewsStatusFilters .order-filter-btn').forEach(b => b.classList.remove('active'));
      btn?.classList?.add('active');
      state.currentFilter = value;
      this.renderTable();
    },

    search(value) {
      state.searchQuery = value;
      this.renderTable();
    },

    // ── Detail modal ────────────────────────────────────────────

    openDetail(id) {
      const review = window.reviewService?.getReviewById?.(id);
      if (!review) {
        this.notify('Reseña no encontrada', 'error');
        return;
      }
      state.selectedId = id;
      this.renderDetail(review);
      const modal = document.getElementById('reviewDetailModal');
      if (modal) {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
      }
    },

    renderDetail(r) {
      setText('rvDetailId', `· ${r.id}`);
      const body = document.getElementById('reviewDetailBody');
      const actions = document.getElementById('rvDetailActions');
      if (!body) return;

      const STATUS_COLORS = { pending: '#ffc107', approved: '#198754', rejected: '#dc3545' };
      const STATUS_LABELS = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };
      const hasVideo = !!(r.videoUrl && r.videoUrl.trim());
      const hasImage = !!(r.imageUrl && r.imageUrl.trim());
      const embed = window.reviewService?.getEmbedUrl?.(r.videoUrl, r.videoType) || r.videoUrl;

      body.innerHTML = `
        <div class="detail-grid">
          <div class="detail-col-main">
            <!-- Info cliente -->
            <div class="detail-section">
              <h4><i class="fas fa-user"></i> Datos del Cliente</h4>
              <div class="detail-form-row">
                <label>Nombre completo *</label>
                <input type="text" data-rv-field="reviewerName" value="${escapeAttr(r.reviewerName)}">
              </div>
              <div class="detail-grid-2">
                <div class="detail-form-row">
                  <label>Email *</label>
                  <input type="email" data-rv-field="reviewerEmail" value="${escapeAttr(r.reviewerEmail)}">
                </div>
                <div class="detail-form-row">
                  <label>Teléfono</label>
                  <input type="tel" data-rv-field="reviewerPhone" value="${escapeAttr(r.reviewerPhone || '')}">
                </div>
              </div>
              <div class="detail-form-row">
                <label>Producto comprado</label>
                <input type="text" data-rv-field="productName" value="${escapeAttr(r.productName || '')}" placeholder="Ej: iPhone 15 Pro Max">
              </div>
            </div>

            <!-- Puntuación y contenido -->
            <div class="detail-section">
              <h4><i class="fas fa-star" style="color:#d4a843"></i> Contenido de la Reseña</h4>
              <div class="detail-form-row">
                <label>Puntuación (1-5) *</label>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                  <input type="number" min="1" max="5" step="1" data-rv-field="rating" value="${r.rating}"
                         style="width:90px;padding:9px 12px;background:var(--black-bg,#121212);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:var(--text-white,#fff);font-family:inherit;font-size:13px;">
                  <div class="review-stars" id="rvDetailStars" style="font-size:20px">${renderStars(r.rating)}</div>
                </div>
              </div>
              <div class="detail-form-row">
                <label>Título</label>
                <input type="text" data-rv-field="title" value="${escapeAttr(r.title || '')}" placeholder="Título corto (visible en tarjetas)">
              </div>
              <div class="detail-form-row">
                <label>Comentario *</label>
                <textarea rows="5" data-rv-field="comment" style="resize:vertical;min-height:120px">${escapeHtml(r.comment)}</textarea>
              </div>
            </div>

            <!-- Video -->
            <div class="detail-section">
              <h4><i class="fas fa-video" style="color:#0dcaf0"></i> Video Reseña</h4>
              <div class="detail-grid-2">
                <div class="detail-form-row">
                  <label>Tipo de video</label>
                  <select data-rv-field="videoType">
                    <option value="link" ${r.videoType === 'link' ? 'selected' : ''}>Enlace / URL directa</option>
                    <option value="youtube" ${r.videoType === 'youtube' ? 'selected' : ''}>YouTube</option>
                    <option value="drive" ${r.videoType === 'drive' ? 'selected' : ''}>Google Drive</option>
                    <option value="uploaded" ${r.videoType === 'uploaded' ? 'selected' : ''}>Subido (URL)</option>
                  </select>
                </div>
                <div class="detail-form-row">
                  <label>URL miniatura (opcional)</label>
                  <input type="url" data-rv-field="videoThumbnail" value="${escapeAttr(r.videoThumbnail || '')}" placeholder="https://...">
                </div>
              </div>
              <div class="detail-form-row">
                <label>URL del video</label>
                <input type="url" data-rv-field="videoUrl" value="${escapeAttr(r.videoUrl || '')}" placeholder="https://youtube.com/watch?v=...">
              </div>

              ${hasVideo ? `
                <div style="margin-top:12px;border-radius:12px;overflow:hidden;aspect-ratio:16/9;background:#000;border:1px solid rgba(255,255,255,0.06)">
                  <iframe src="${escapeAttr(embed)}" title="Video preview" style="width:100%;height:100%;border:0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div style="margin-top:8px;font-size:11.5px;color:var(--text-gray,#888);word-break:break-all">
                  <i class="fas fa-link"></i> ${escapeHtml(r.videoUrl)}
                </div>
              ` : `
                <div class="detail-hint" style="margin-top:8px"><i class="fas fa-info-circle" style="color:#0dcaf0"></i> Esta reseña no tiene video asociado.</div>
              `}
            </div>

            <!-- Image / Photo -->
            <div class="detail-section">
              <h4><i class="fas fa-camera" style="color:#f97316"></i> Foto del Producto</h4>
              <div class="detail-form-row">
                <label>URL de la foto</label>
                <input type="url" data-rv-field="imageUrl" value="${escapeAttr(r.imageUrl || '')}" placeholder="https://... (Cloudinary, Imgur, etc.)">
              </div>
              ${hasImage ? `
                <div style="margin-top:12px;border-radius:12px;overflow:hidden;background:#000;border:1px solid rgba(255,255,255,0.06);max-height:380px">
                  <img src="${escapeAttr(r.imageUrl)}" alt="Foto reseña" style="width:100%;height:100%;object-fit:contain;max-height:380px;display:block;background:#111">
                </div>
                <div style="margin-top:8px;font-size:11.5px;color:var(--text-gray,#888);word-break:break-all">
                  <i class="fas fa-link"></i> ${escapeHtml(r.imageUrl)}
                </div>
              ` : `
                <div class="detail-hint" style="margin-top:8px"><i class="fas fa-info-circle" style="color:#f97316"></i> Esta reseña no tiene foto adjunta.</div>
              `}
            </div>
          </div>

          <!-- Sidebar -->
          <div class="detail-col-side">
            <div class="sticky">
              <h4 style="margin:0 0 10px;font-size:13.5px;color:var(--gold-primary);text-transform:uppercase;letter-spacing:0.4px">
                <i class="fas fa-gear"></i> Estado y control
              </h4>
              <div style="margin:0 0 14px;padding-bottom:12px;border-bottom:1px dashed rgba(255,255,255,0.08)">
                <span class="order-status-badge" style="--c:${STATUS_COLORS[r.status] || '#888'}">
                  <span class="order-status-dot"></span>${STATUS_LABELS[r.status] || r.status}
                </span>
              </div>

              <div class="detail-info-row" style="border:none;padding:6px 4px">
                <span><i class="far fa-clock"></i> Creada</span>
                <strong>${formatDateTime(r.createdAt).full}</strong>
              </div>
              <div class="detail-info-row" style="border:none;padding:6px 4px">
                <span><i class="far fa-calendar-check"></i> Actualizada</span>
                <strong>${formatDateTime(r.updatedAt).full}</strong>
              </div>
              <div class="detail-info-row" style="border:none;padding:6px 4px">
                <span><i class="fas fa-thumbs-up"></i> Votos útiles</span>
                <strong style="color:#198754">${r.helpfulCount || 0}</strong>
              </div>
              <div class="detail-info-row" style="border:none;padding:6px 4px">
                <span><i class="fas fa-gem"></i> Destacada</span>
                <strong style="color:${r.isFeatured ? '#d4a843' : 'inherit'}">${r.isFeatured ? 'Sí' : 'No'}</strong>
              </div>

              <div class="detail-form-row" style="margin-top:16px">
                <label>Nota de moderación (opcional)</label>
                <textarea rows="3" data-rv-field="moderationNote" placeholder="Razón del rechazo o nota interna..." style="resize:vertical;min-height:80px">${escapeHtml(r.moderationNote || '')}</textarea>
              </div>

              <div class="detail-actions-inline" style="margin-top:16px">
                ${r.status === 'pending' ? `
                  <button class="wa-btn wa-btn-cust" data-rv-detail-action="approve" data-rv-id="${r.id}">
                    <i class="fas fa-check"></i> Aprobar
                  </button>
                  <button class="wa-btn wa-btn-admin" data-rv-detail-action="reject" data-rv-id="${r.id}">
                    <i class="fas fa-xmark"></i> Rechazar
                  </button>
                ` : r.status === 'approved' ? `
                  <button class="wa-btn wa-btn-admin" data-rv-detail-action="reject" data-rv-id="${r.id}">
                    <i class="fas fa-xmark"></i> Rechazar
                  </button>
                ` : `
                  <button class="wa-btn wa-btn-cust" data-rv-detail-action="approve" data-rv-id="${r.id}">
                    <i class="fas fa-check"></i> Re-aprobar
                  </button>
                `}
                <button class="wa-btn" style="background:rgba(212,168,67,0.1);color:#d4a843;border:1px solid rgba(212,168,67,0.25)" data-rv-detail-action="featured" data-rv-id="${r.id}">
                  <i class="fas fa-gem"></i> ${r.isFeatured ? 'Quitar destacada' : 'Destacar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      if (actions) {
        actions.innerHTML = `
          <button class="btn-danger-outline" style="margin:0;width:auto;padding:10px 16px;font-size:12.5px" data-rv-detail-action="delete" data-rv-id="${r.id}">
            <i class="fas fa-trash"></i> Eliminar
          </button>
          <button class="ap-btn-cancel" data-rv-detail-action="cancel">Cancelar</button>
          <button class="ap-btn-save" data-rv-detail-action="save" data-rv-id="${r.id}">
            <i class="fas fa-save"></i> Guardar cambios
          </button>
        `;
      }

      // Live update preview stars on rating change
      const ratingInput = body.querySelector('[data-rv-field="rating"]');
      const starsEl = document.getElementById('rvDetailStars');
      ratingInput?.addEventListener('input', () => {
        let val = parseInt(ratingInput.value, 10);
        if (isNaN(val)) val = 0;
        if (val < 0) val = 0;
        if (val > 5) val = 5;
        if (starsEl) starsEl.innerHTML = renderStars(val);
      });
    },

    getDetailFormData() {
      const body = document.getElementById('reviewDetailBody');
      if (!body) return null;
      const fields = body.querySelectorAll('[data-rv-field]');
      const data = {};
      fields.forEach(f => {
        const key = f.dataset.rvField;
        let val = f.value;
        if (key === 'rating') val = parseInt(val, 10);
        if (key === 'isFeatured') val = f.checked;
        data[key] = val;
      });
      return data;
    },

    async saveEdits(id) {
      const raw = this.getDetailFormData();
      if (!raw) return;

      // Validaciones básicas
      if (!raw.reviewerName || !raw.reviewerEmail || !raw.rating || !raw.comment) {
        this.notify('Faltan campos: nombre, email, puntuación o comentario', 'error');
        return;
      }
      if (raw.rating < 1 || raw.rating > 5) {
        this.notify('La puntuación debe estar entre 1 y 5', 'error');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.reviewerEmail)) {
        this.notify('Correo electrónico no válido', 'error');
        return;
      }

      try {
        const result = await window.reviewService.updateReview(id, raw);
        if (result) {
          this.notify('Cambios guardados correctamente', 'success');
          // Re-render detail with fresh data
          this.renderDetail(result);
        } else {
          this.notify('No se pudieron guardar los cambios', 'error');
        }
      } catch (e) {
        console.error(e);
        this.notify(e?.message || 'Error al guardar', 'error');
      }
    },

    // ── Acciones rápidas ────────────────────────────────────────

    async quickApprove(id) {
      try {
        const r = await window.reviewService.approveReview(id);
        if (r) this.notify('Reseña aprobada ✓', 'success');
      } catch (e) {
        this.notify(e?.message || 'Error al aprobar', 'error');
      }
    },

    async approveFromDetail(id) {
      // Save any edits first (optional: capture note)
      const noteEl = document.querySelector('[data-rv-field="moderationNote"]');
      const note = noteEl ? noteEl.value : '';
      try {
        const r = await window.reviewService.approveReview(id, note);
        if (r) {
          this.notify('Reseña aprobada correctamente', 'success');
          this.renderDetail(r);
        }
      } catch (e) {
        this.notify(e?.message || 'Error al aprobar', 'error');
      }
    },

    async quickReject(id) {
      try {
        const r = await window.reviewService.rejectReview(id);
        if (r) this.notify('Reseña rechazada', 'info');
      } catch (e) {
        this.notify(e?.message || 'Error al rechazar', 'error');
      }
    },

    async rejectFromDetail(id) {
      const noteEl = document.querySelector('[data-rv-field="moderationNote"]');
      const note = noteEl ? noteEl.value : '';
      try {
        const r = await window.reviewService.rejectReview(id, note);
        if (r) {
          this.notify('Reseña rechazada correctamente', 'info');
          this.renderDetail(r);
        }
      } catch (e) {
        this.notify(e?.message || 'Error al rechazar', 'error');
      }
    },

    async toggleFeatured(id) {
      try {
        const r = await window.reviewService.toggleFeatured(id);
        if (r) this.notify(r.isFeatured ? 'Marcada como destacada ✓' : 'Quitada de destacadas', 'success');
      } catch (e) {
        this.notify(e?.message || 'Error al cambiar destacada', 'error');
      }
    },

    async deleteReview(id, fromDetail = false) {
      const ok = window.confirm('¿Estás seguro de eliminar esta reseña? Esta acción no se puede deshacer.');
      if (!ok) return;
      try {
        await window.reviewService.deleteReview(id);
        this.notify('Reseña eliminada', 'info');
        if (fromDetail) closeReviewDetailModal();
      } catch (e) {
        this.notify(e?.message || 'Error al eliminar', 'error');
      }
    },

    previewVideo(id) {
      const r = window.reviewService?.getReviewById?.(id);
      if (!r || !r.videoUrl) {
        this.notify('Esta reseña no tiene video', 'info');
        return;
      }
      this.openDetail(id);
    },

    previewPhoto(id) {
      const r = window.reviewService?.getReviewById?.(id);
      if (!r || !r.imageUrl) {
        this.notify('Esta reseña no tiene foto', 'info');
        return;
      }
      this.openDetail(id);
    },

    notify(message, type = 'info') {
      if (window.notificationService?.toast) {
        window.notificationService.toast(message, type);
        return;
      }
      const map = { success: '#198754', error: '#dc3545', info: '#0dcaf0', warning: '#ffc107' };
      const color = map[type] || map.info;

      let t = document.getElementById('adminReviewsToast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'adminReviewsToast';
        Object.assign(t.style, {
          position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%) translateY(120%)',
          background: 'var(--black-card,#181818)', color: '#fff',
          padding: '14px 22px', borderRadius: '12px',
          border: `1px solid ${color}55`,
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
          fontSize: '13.5px', fontWeight: '600', zIndex: '99999',
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          maxWidth: 'calc(100vw - 40px)', fontFamily: 'Poppins, sans-serif',
          display: 'flex', alignItems: 'center', gap: '10px'
        });
        document.body.appendChild(t);
      }
      const icons = { success: 'fa-check-circle', error: 'fa-xmark-circle', info: 'fa-info-circle', warning: 'fa-triangle-exclamation' };
      t.style.borderColor = `${color}55`;
      t.innerHTML = `<i class="fas ${icons[type] || icons.info}" style="color:${color};font-size:16px"></i><span>${escapeHtml(message)}</span>`;
      t.style.transform = 'translateX(-50%) translateY(0)';
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        t.style.transform = 'translateX(-50%) translateY(120%)';
      }, 3200);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function renderStars(rating) {
    const r = Math.max(0, Math.min(5, parseInt(rating, 10) || 0));
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += `<i class="fas fa-star ${i <= r ? 'star-on' : ''}" style="${i <= r ? 'color:var(--gold-primary,#d4a843)' : 'color:#444'};font-size:inherit"></i>`;
    }
    return html;
  }

  function getInitials(name) {
    const parts = String(name || 'U').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function truncate(str, n) {
    str = String(str ?? '');
    return str.length > n ? str.slice(0, n - 1) + '…' : str;
  }

  function formatDateTime(iso) {
    try {
      const d = new Date(iso);
      if (isNaN(d)) return { date: '—', time: '—', full: '—' };
      const date = d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
      const time = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      return { date, time, full: `${date} · ${time}` };
    } catch (_) {
      return { date: '—', time: '—', full: '—' };
    }
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function escapeAttr(str) {
    return String(str ?? '').replace(/"/g, '&quot;');
  }

  // ── Global close helpers (usados por HTML inline) ────────────

  window.closeReviewDetailModal = function () {
    const modal = document.getElementById('reviewDetailModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    state.selectedId = null;
    // Limpiar contenido para detener videos
    const body = document.getElementById('reviewDetailBody');
    if (body) body.innerHTML = '';
  };

  window.adminReviews = AdminReviews;

  // ── Boot ─────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdminReviews.init());
  } else {
    AdminReviews.init();
  }
})();
