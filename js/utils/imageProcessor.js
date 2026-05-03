/**
 * Procesador de imágenes — remoción de fondo blanco/claro
 * y aplicación de fondo predeterminado dorado/negro
 */
class ImageProcessor {
  constructor() {
    this.canvas   = document.createElement('canvas');
    this.ctx      = this.canvas.getContext('2d', { willReadFrequently: true });
    this.bgCanvas = document.createElement('canvas');
    this.bgCtx    = this.bgCanvas.getContext('2d');

    // Fondo predeterminado generado con Canvas (sin CORS)
    this.defaultBgImg = this._createDefaultBg();
    this._processedCache = new Map();
  }

  /**
   * Genera el fondo dorado/negro con destellos usando Canvas puro
   */
  _createDefaultBg() {
    // Si productBg.js ya generó el fondo, reutilizarlo
    if (window.productBgDataUrl) {
      const img = new Image();
      img.src = window.productBgDataUrl;
      return img;
    }

    const size = 600;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');

    // Fondo negro
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);

    // Gradiente radial dorado en el centro
    const radial = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.6);
    radial.addColorStop(0,   'rgba(212,168,67,0.18)');
    radial.addColorStop(0.5, 'rgba(212,168,67,0.06)');
    radial.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, size, size);

    // Destellos / partículas doradas
    const rng = (min, max) => Math.random() * (max - min) + min;
    for (let i = 0; i < 120; i++) {
      const x = rng(0, size);
      const y = rng(0, size);
      const r = rng(0.5, 2.5);
      const alpha = rng(0.2, 0.9);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,168,67,${alpha.toFixed(2)})`;
      ctx.fill();
    }

    // Algunos destellos blancos pequeños
    for (let i = 0; i < 60; i++) {
      const x = rng(0, size);
      const y = rng(0, size);
      const r = rng(0.3, 1.2);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${rng(0.3, 0.8).toFixed(2)})`;
      ctx.fill();
    }

    // Convertir a Image para reutilizar en _compose
    const img = new Image();
    img.src = c.toDataURL('image/png');
    return img;
  }

  /* ── API pública ────────────────────────────────────────────── */

  /**
   * Procesa una imagen: quita fondo blanco/claro y aplica fondo predeterminado.
   * @param {File|string} input  Archivo o URL
   * @param {object}      opts   { tolerance: 30, outputSize: 600 }
   * @returns {Promise<string>}  dataURL PNG
   */
  async processImage(input, opts = {}) {
    const { tolerance = 35, outputSize = 600 } = opts;
    try {
      const img = await this.loadImage(input);
      return this._compose(img, tolerance, outputSize);
    } catch (err) {
      console.warn('ImageProcessor: error procesando imagen', err);
      return this._fallbackDataURL(outputSize);
    }
  }

  /**
   * Solo quita el fondo sin aplicar fondo predeterminado.
   * Devuelve PNG con transparencia.
   */
  async removeBackground(input, tolerance = 35) {
    const img = await this.loadImage(input);
    this._setupCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    this.ctx.drawImage(img, 0, 0);
    const id = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this._floodFillRemove(id, tolerance);
    this.ctx.putImageData(id, 0, 0);
    return this.canvas.toDataURL('image/png');
  }

  /* ── Internos ───────────────────────────────────────────────── */

  /**
   * Compone: fondo predeterminado + imagen sin fondo
   */
  _compose(img, tolerance, outputSize) {
    const w = outputSize;
    const h = outputSize;

    // 1. Dibujar imagen original en canvas temporal para leer píxeles
    this._setupCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    this.ctx.drawImage(img, 0, 0);
    const id = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // 2. Quitar fondo
    this._floodFillRemove(id, tolerance);
    this.ctx.putImageData(id, 0, 0);

    // 3. Componer sobre fondo predeterminado en bgCanvas
    this.bgCanvas.width  = w;
    this.bgCanvas.height = h;

    // Fondo: imagen predeterminada o gradiente de respaldo
    if (this.defaultBgImg) {
      this.bgCtx.drawImage(this.defaultBgImg, 0, 0, w, h);
    } else {
      const grad = this.bgCtx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0a0a0a');
      grad.addColorStop(0.5, '#1a1a1a');
      grad.addColorStop(1, '#2a1a00');
      this.bgCtx.fillStyle = grad;
      this.bgCtx.fillRect(0, 0, w, h);
    }

    // Dibujar imagen procesada centrada con object-fit: contain
    const { dx, dy, dw, dh } = this._contain(
      this.canvas.width, this.canvas.height, w, h, 0.85
    );
    this.bgCtx.drawImage(this.canvas, dx, dy, dw, dh);

    return this.bgCanvas.toDataURL('image/png');
  }

  /**
   * Flood-fill desde las 4 esquinas para detectar y eliminar el fondo.
   * Más preciso que recorrer todos los píxeles.
   */
  _floodFillRemove(imageData, tolerance) {
    const { width, height, data } = imageData;
    const visited = new Uint8Array(width * height);

    // Color de referencia: promedio de las 4 esquinas
    const corners = [
      this._getPixel(data, 0, 0, width),
      this._getPixel(data, width - 1, 0, width),
      this._getPixel(data, 0, height - 1, width),
      this._getPixel(data, width - 1, height - 1, width),
    ];
    const ref = {
      r: Math.round(corners.reduce((s, c) => s + c.r, 0) / 4),
      g: Math.round(corners.reduce((s, c) => s + c.g, 0) / 4),
      b: Math.round(corners.reduce((s, c) => s + c.b, 0) / 4),
    };

    // Solo aplicar si el fondo es claro (blanco/gris/beige)
    const brightness = (ref.r + ref.g + ref.b) / 3;
    if (brightness < 160) {
      // Fondo oscuro — no quitar nada
      return;
    }

    // BFS flood fill desde las 4 esquinas
    const queue = [
      [0, 0], [width - 1, 0],
      [0, height - 1], [width - 1, height - 1],
    ];

    while (queue.length) {
      const [x, y] = queue.pop();
      const idx = y * width + x;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const px = this._getPixel(data, x, y, width);
      if (!this._colorMatch(px, ref, tolerance)) continue;

      // Hacer transparente con suavizado en los bordes
      const i4 = idx * 4;
      const dist = this._colorDist(px, ref);
      const alpha = Math.min(255, Math.round((dist / tolerance) * 255));
      data[i4 + 3] = alpha < 30 ? 0 : alpha;

      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  _getPixel(data, x, y, width) {
    const i = (y * width + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  }

  _colorDist(a, b) {
    return Math.sqrt(
      (a.r - b.r) ** 2 +
      (a.g - b.g) ** 2 +
      (a.b - b.b) ** 2
    );
  }

  _colorMatch(px, ref, tolerance) {
    return this._colorDist(px, ref) <= tolerance;
  }

  _setupCanvas(w, h) {
    this.canvas.width  = w;
    this.canvas.height = h;
    this.ctx.clearRect(0, 0, w, h);
  }

  /** Calcula posición/tamaño para object-fit: contain con padding */
  _contain(srcW, srcH, dstW, dstH, padding = 1) {
    const maxW = dstW * padding;
    const maxH = dstH * padding;
    const ratio = Math.min(maxW / srcW, maxH / srcH);
    const dw = srcW * ratio;
    const dh = srcH * ratio;
    return {
      dx: (dstW - dw) / 2,
      dy: (dstH - dh) / 2,
      dw, dh,
    };
  }

  _fallbackDataURL(size = 300) {
    this.bgCanvas.width  = size;
    this.bgCanvas.height = size;
    const grad = this.bgCtx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(1, '#d4a843');
    this.bgCtx.fillStyle = grad;
    this.bgCtx.fillRect(0, 0, size, size);
    this.bgCtx.fillStyle = 'rgba(255,255,255,0.4)';
    this.bgCtx.font = `bold ${size / 10}px sans-serif`;
    this.bgCtx.textAlign = 'center';
    this.bgCtx.textBaseline = 'middle';
    this.bgCtx.fillText('Imagen', size / 2, size / 2);
    return this.bgCanvas.toDataURL('image/png');
  }

  /* ── Utilidades públicas ────────────────────────────────────── */

  async loadImage(input) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload  = () => resolve(img);
      img.onerror = reject;
      if (input instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(input);
      } else {
        img.src = input;
      }
    });
  }

  validateImageFormat(file) {
    return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
  }

  /**
   * Procesa una URL solo si detecta fondo claro (blanco/gris claro).
   * Si no aplica, devuelve la URL original.
   */
  async processImageForCatalog(url, opts = {}) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:')) return url;
    if (this._processedCache.has(url)) return this._processedCache.get(url);

    try {
      const img = await this.loadImage(url);
      if (!this._hasLightCornerBackground(img)) {
        this._processedCache.set(url, url);
        return url;
      }

      const processed = this._compose(img, opts.tolerance || 35, opts.outputSize || 600);
      this._processedCache.set(url, processed);
      return processed;
    } catch (err) {
      console.warn('ImageProcessor: no se pudo procesar URL', url, err);
      this._processedCache.set(url, url);
      return url;
    }
  }

  _hasLightCornerBackground(img) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return false;

    const sampleW = Math.max(4, Math.floor(w * 0.08));
    const sampleH = Math.max(4, Math.floor(h * 0.08));
    this._setupCanvas(w, h);
    this.ctx.drawImage(img, 0, 0);

    const areas = [
      [0, 0],
      [w - sampleW, 0],
      [0, h - sampleH],
      [w - sampleW, h - sampleH]
    ];

    let totalBrightness = 0;
    let sampleCount = 0;

    areas.forEach(([sx, sy]) => {
      const id = this.ctx.getImageData(sx, sy, sampleW, sampleH).data;
      for (let i = 0; i < id.length; i += 4) {
        const r = id[i];
        const g = id[i + 1];
        const b = id[i + 2];
        totalBrightness += (r + g + b) / 3;
        sampleCount++;
      }
    });

    const avgBrightness = sampleCount ? (totalBrightness / sampleCount) : 0;
    return avgBrightness >= 165;
  }
}

// Instancia global
window.imageProcessor = new ImageProcessor();
window.ImageProcessor  = ImageProcessor;
