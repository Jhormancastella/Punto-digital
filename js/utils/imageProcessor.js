/**
 * Procesador de imagenes
 * - Quita fondo blanco/claro con flood-fill
 * - Sube a Cloudinary y devuelve la URL publica
 * - Si Cloudinary no esta configurado, devuelve dataURL (modo offline)
 */
class ImageProcessor {
  constructor() {
    this.canvas   = document.createElement('canvas');
    this.ctx      = this.canvas.getContext('2d', { willReadFrequently: true });
    this.bgCanvas = document.createElement('canvas');
    this.bgCtx    = this.bgCanvas.getContext('2d');

    // Cloudinary - upload sin firma (unsigned preset)
    this.cloudinaryCloud  = 'khigze40';
    this.cloudinaryPreset = 'puntodigital_unsigned'; // crear en Settings > Upload > Upload presets

    this.defaultBgImg    = this._createDefaultBg();
    this._processedCache = new Map();
  }

  async processImage(input, opts = {}) {
    const { folder = 'puntodigital/products', tolerance = 35, outputSize = 600 } = opts;
    try {
      const img     = await this.loadImage(input);
      const dataUrl = this._compose(img, tolerance, outputSize);
      if (this.cloudinaryCloud && this.cloudinaryPreset) {
        return await this._uploadToCloudinary(dataUrl, folder);
      }
      return dataUrl;
    } catch (err) {
      console.warn('ImageProcessor:', err);
      return this._fallbackDataURL(outputSize);
    }
  }

  async removeBackground(input, tolerance = 35) {
    const img = await this.loadImage(input);
    this._setupCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    this.ctx.drawImage(img, 0, 0);
    const id = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this._floodFillRemove(id, tolerance);
    this.ctx.putImageData(id, 0, 0);
    return this.canvas.toDataURL('image/png');
  }

  async processImageForCatalog(url, opts = {}) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:'))         return url;
    if (this._processedCache.has(url))   return this._processedCache.get(url);
    try {
      const img = await this.loadImage(url);
      if (!this._hasLightCornerBackground(img)) {
        this._processedCache.set(url, url);
        return url;
      }
      const processed = this._compose(img, opts.tolerance || 35, opts.outputSize || 600);
      this._processedCache.set(url, processed);
      return processed;
    } catch {
      this._processedCache.set(url, url);
      return url;
    }
  }

  async _uploadToCloudinary(dataUrl, folder) {
    const url  = 'https://api.cloudinary.com/v1_1/' + this.cloudinaryCloud + '/image/upload';
    const body = new FormData();
    body.append('file',          dataUrl);
    body.append('upload_preset', this.cloudinaryPreset);
    body.append('folder',        folder);
    const res  = await fetch(url, { method: 'POST', body });
    if (!res.ok) throw new Error('Cloudinary error: ' + res.status);
    const json = await res.json();
    return json.secure_url.replace('/upload/', '/upload/f_webp,q_auto,w_800/');
  }

  _createDefaultBg() {
    if (window.productBgDataUrl) {
      const img = new Image();
      img.src = window.productBgDataUrl;
      return img;
    }
    const size = 600;
    const c    = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx  = c.getContext('2d');
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);
    const radial = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.6);
    radial.addColorStop(0,   'rgba(212,168,67,0.18)');
    radial.addColorStop(0.5, 'rgba(212,168,67,0.06)');
    radial.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, size, size);
    const rng = function(min, max) { return Math.random() * (max - min) + min; };
    for (var i = 0; i < 120; i++) {
      ctx.beginPath();
      ctx.arc(rng(0,size), rng(0,size), rng(0.5,2.5), 0, Math.PI*2);
      ctx.fillStyle = 'rgba(212,168,67,' + rng(0.2,0.9).toFixed(2) + ')';
      ctx.fill();
    }
    for (var j = 0; j < 60; j++) {
      ctx.beginPath();
      ctx.arc(rng(0,size), rng(0,size), rng(0.3,1.2), 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,' + rng(0.3,0.8).toFixed(2) + ')';
      ctx.fill();
    }
    const img = new Image();
    img.src = c.toDataURL('image/png');
    return img;
  }

  _compose(img, tolerance, outputSize) {
    const w = outputSize, h = outputSize;
    this._setupCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
    this.ctx.drawImage(img, 0, 0);
    const id = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this._floodFillRemove(id, tolerance);
    this.ctx.putImageData(id, 0, 0);
    this.bgCanvas.width = w; this.bgCanvas.height = h;
    if (this.defaultBgImg && this.defaultBgImg.src) {
      this.bgCtx.drawImage(this.defaultBgImg, 0, 0, w, h);
    } else {
      var grad = this.bgCtx.createLinearGradient(0,0,w,h);
      grad.addColorStop(0,'#0a0a0a'); grad.addColorStop(1,'#2a1a00');
      this.bgCtx.fillStyle = grad;
      this.bgCtx.fillRect(0,0,w,h);
    }
    var c2 = this._contain(this.canvas.width, this.canvas.height, w, h, 0.85);
    this.bgCtx.drawImage(this.canvas, c2.dx, c2.dy, c2.dw, c2.dh);
    return this.bgCanvas.toDataURL('image/png');
  }

  _floodFillRemove(imageData, tolerance) {
    var width = imageData.width, height = imageData.height, data = imageData.data;
    var visited = new Uint8Array(width * height);
    var corners = [
      this._getPixel(data,0,0,width),
      this._getPixel(data,width-1,0,width),
      this._getPixel(data,0,height-1,width),
      this._getPixel(data,width-1,height-1,width)
    ];
    var ref = {
      r: Math.round(corners.reduce(function(s,c){return s+c.r;},0)/4),
      g: Math.round(corners.reduce(function(s,c){return s+c.g;},0)/4),
      b: Math.round(corners.reduce(function(s,c){return s+c.b;},0)/4)
    };
    if ((ref.r+ref.g+ref.b)/3 < 160) return;
    var queue = [[0,0],[width-1,0],[0,height-1],[width-1,height-1]];
    while (queue.length) {
      var pt = queue.pop(), x = pt[0], y = pt[1];
      if (x<0||x>=width||y<0||y>=height) continue;
      var idx = y*width+x;
      if (visited[idx]) continue;
      visited[idx] = 1;
      var px = this._getPixel(data,x,y,width);
      if (!this._colorMatch(px,ref,tolerance)) continue;
      var dist  = this._colorDist(px,ref);
      var alpha = Math.min(255, Math.round((dist/tolerance)*255));
      data[idx*4+3] = alpha < 30 ? 0 : alpha;
      queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
  }

  _getPixel(data,x,y,w) { var i=(y*w+x)*4; return {r:data[i],g:data[i+1],b:data[i+2],a:data[i+3]}; }
  _colorDist(a,b) { return Math.sqrt(Math.pow(a.r-b.r,2)+Math.pow(a.g-b.g,2)+Math.pow(a.b-b.b,2)); }
  _colorMatch(px,ref,tol) { return this._colorDist(px,ref)<=tol; }
  _setupCanvas(w,h) { this.canvas.width=w; this.canvas.height=h; this.ctx.clearRect(0,0,w,h); }
  _contain(srcW,srcH,dstW,dstH,pad) {
    pad = pad||1;
    var ratio = Math.min(dstW*pad/srcW, dstH*pad/srcH);
    var dw=srcW*ratio, dh=srcH*ratio;
    return {dx:(dstW-dw)/2, dy:(dstH-dh)/2, dw:dw, dh:dh};
  }
  _fallbackDataURL(size) {
    size = size||300;
    this.bgCanvas.width=size; this.bgCanvas.height=size;
    var g=this.bgCtx.createLinearGradient(0,0,size,size);
    g.addColorStop(0,'#1a1a1a'); g.addColorStop(1,'#d4a843');
    this.bgCtx.fillStyle=g;
    this.bgCtx.fillRect(0,0,size,size);
    return this.bgCanvas.toDataURL('image/png');
  }
  _hasLightCornerBackground(img) {
    var w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
    if(!w||!h) return false;
    var sw=Math.max(4,Math.floor(w*0.08)), sh=Math.max(4,Math.floor(h*0.08));
    this._setupCanvas(w,h);
    this.ctx.drawImage(img,0,0);
    var areas=[[0,0],[w-sw,0],[0,h-sh],[w-sw,h-sh]];
    var total=0, count=0;
    areas.forEach(function(a) {
      var id=this.ctx.getImageData(a[0],a[1],sw,sh).data;
      for(var i=0;i<id.length;i+=4){total+=(id[i]+id[i+1]+id[i+2])/3;count++;}
    }.bind(this));
    return count?(total/count)>=165:false;
  }
  async loadImage(input) {
    return new Promise(function(resolve,reject){
      var img=new Image();
      img.crossOrigin='anonymous';
      img.onload=function(){resolve(img);};
      img.onerror=reject;
      if(input instanceof File){
        var reader=new FileReader();
        reader.onload=function(e){img.src=e.target.result;};
        reader.readAsDataURL(input);
      } else {
        img.src=input;
      }
    });
  }
  validateImageFormat(file) {
    return ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type);
  }
}

window.imageProcessor = new ImageProcessor();
window.ImageProcessor = ImageProcessor;
