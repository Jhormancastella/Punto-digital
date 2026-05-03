/**
 * Gestor de datos del sitio con productos actualizados desde JSON
 */
class SiteDataManager {
  constructor() {
    this.storageKey = 'puntoDigitalData_v2'; // v2 = esquema unificado con featured en products
    this.fontCatalog = {
      'Poppins': 'family=Poppins:wght@300;400;500;600;700;800',
      'Inter': 'family=Inter:wght@300;400;500;600;700;800',
      'Roboto': 'family=Roboto:wght@300;400;500;700',
      'Montserrat': 'family=Montserrat:wght@300;400;500;600;700;800',
      'Open Sans': 'family=Open+Sans:wght@300;400;500;600;700;800',
      'Lato': 'family=Lato:wght@300;400;700;900',
      'Nunito': 'family=Nunito:wght@300;400;500;600;700;800',
      'Raleway': 'family=Raleway:wght@300;400;500;600;700;800',
      'Merriweather': 'family=Merriweather:wght@300;400;700;900',
      'Playfair Display': 'family=Playfair+Display:wght@400;500;600;700;800'
    };
    this.defaultData = this.getDefaultData();
    this.data = this.loadData();
    this.observers = [];
    this.applyVisualSettings();
  }

  /**
   * Datos por defecto del sitio con productos del JSON
   */
  getDefaultData() {
    return {
      colors: {
        goldPrimary: '#d4a843',
        goldLight: '#f0d68a',
        goldDark: '#b89344'
      },
      hero: {
        title: 'Los Mejores Productos de Tecnología y Telefonía',
        description: 'Encuentra aquí lo último en smartphones, gadgets y accesorios de las mejores marcas.',
        buttonText: 'VER PRODUCTOS',
        images: [
          { 
            url: 'img/i_Phone_15_Pro_Max parte trasera.webp', 
            alt: 'iPhone 15 Pro Max (trasera)' 
          },
          { 
            url: 'img/samsung 24 ultra parte trasera.webp', 
            alt: 'Samsung Galaxy S24 Ultra (trasera)' 
          },
          { 
            url: 'img/pixel 8 trasera.png', 
            alt: 'Google Pixel 8 (trasera)' 
          },
          { 
            url: 'img/xiaomi_14t_negro_04_ad_trasera.jpeg', 
            alt: 'Xiaomi 14 (trasera)' 
          }
        ]
      },
      features: [
        { 
          icon: 'fa-shield-halved', 
          title: 'GARANTÍA DE CALIDAD', 
          desc: 'Productos de primeras marcas con garantía completa' 
        },
        { 
          icon: 'fa-truck-fast', 
          title: 'ENVÍO RÁPIDO', 
          desc: 'Entrega rápida y segura a todo Colombia' 
        },
        { 
          icon: 'fa-headset', 
          title: 'SOPORTE PROFESIONAL', 
          desc: 'Atención al cliente especializada 24/7' 
        }
      ],
      categories: [
        { 
          name: 'Smartphones', 
          image: this.createPlaceholderImage('Smartphones', '#1a1a1a'),
          description: 'Los últimos modelos de las mejores marcas'
        },
        { 
          name: 'Auriculares Bluetooth', 
          image: this.createPlaceholderImage('Auriculares', '#1a1a1a'),
          description: 'Audio de alta calidad sin cables'
        },
        { 
          name: 'Smartwatches', 
          image: this.createPlaceholderImage('Smartwatch', '#1a1a1a'),
          description: 'Tecnología wearable inteligente'
        },
        { 
          name: 'Cargadores y Accesorios', 
          image: this.createPlaceholderImage('Cargadores', '#1a1a1a'),
          description: 'Accesorios esenciales para tus dispositivos'
        }
      ],
      products: [
        // Imágenes hardcodeadas locales para pruebas iniciales.
        // Cuando se integre base de datos/CMS, estas rutas deben reemplazarse por URLs dinámicas.
        { 
          id: 'iphone-15-pro',
          name: 'iPhone 15 Pro', 
          price: '3699000',
          originalPrice: '3999000',
          image: 'img/iphone.webp',
          category: 'smartphones',
          brand: 'Apple',
          featured: false,
          badge: 'Nuevo',
          description: 'El iPhone más avanzado con chip A17 Pro, cámara profesional y pantalla Super Retina XDR de 6.1 pulgadas.',
          specifications: { pantalla: '6.1 pulgadas OLED', almacenamiento: '128 GB', ram: '8 GB', bateria: '3274 mAh', procesador: 'A17 Pro', camara: 'Sistema Pro de 48MP' },
          stock: 15, rating: 4.9, reviews: 127
        },
        { 
          id: 'samsung-s24-ultra',
          name: 'Samsung Galaxy S24 Ultra', 
          price: '4799000',
          originalPrice: '5199000', 
          image: 'img/samsung.webp',
          category: 'smartphones',
          brand: 'Samsung',
          featured: false,
          badge: 'Oferta',
          description: 'Smartphone premium con S Pen integrado, cámara de 200MP y pantalla Dynamic AMOLED de 6.8 pulgadas.',
          specifications: { pantalla: '6.8 pulgadas Dynamic AMOLED', almacenamiento: '256 GB', ram: '12 GB', bateria: '5000 mAh', procesador: 'Snapdragon 8 Gen 3', camara: 'Cuádruple 200MP' },
          stock: 8, rating: 4.8, reviews: 89
        },
        { 
          id: 'google-pixel-8',
          name: 'Google Pixel 8', 
          price: '2599000',
          image: 'img/pixel 8.webp',
          category: 'smartphones',
          brand: 'Google',
          featured: false,
          badge: 'IA Avanzada',
          description: 'Smartphone con inteligencia artificial avanzada, cámara computacional y Android puro.',
          specifications: { pantalla: '6.2 pulgadas OLED', almacenamiento: '128 GB', ram: '8 GB', bateria: '4575 mAh', procesador: 'Google Tensor G3', camara: 'Dual 50MP + IA' },
          stock: 12, rating: 4.7, reviews: 65
        },
        { 
          id: 'xiaomi-14',
          name: 'Xiaomi 14', 
          price: '2999000',
          image: 'img/xiaomi 14.webp',
          category: 'smartphones',
          brand: 'Xiaomi',
          featured: false,
          description: 'Flagship con cámara Leica, pantalla AMOLED de 6.36" y carga rápida de 90W.',
          specifications: { pantalla: '6.36 pulgadas AMOLED', almacenamiento: '256 GB', ram: '12 GB', bateria: '4610 mAh', procesador: 'Snapdragon 8 Gen 3', camara: 'Triple Leica 50MP' },
          stock: 18, rating: 4.6, reviews: 43
        },
        { 
          id: 'oneplus-12',
          name: 'OnePlus 12', 
          price: '2999000',
          originalPrice: '3299000',
          image: 'img/one plus 12 trasera.jpg',
          category: 'smartphones',
          brand: 'OnePlus',
          featured: false,
          badge: 'Rendimiento',
          description: 'Rendimiento flagship con OxygenOS 14, pantalla LTPO AMOLED de 6.82" y carga SuperVOOC de 100W.',
          specifications: { pantalla: '6.82 pulgadas LTPO AMOLED', almacenamiento: '256 GB', ram: '16 GB', bateria: '5400 mAh', procesador: 'Snapdragon 8 Gen 3', camara: 'Triple Hasselblad 50MP' },
          stock: 20, rating: 4.8, reviews: 67
        },
        { 
          id: 'airpods-pro-2',
          name: 'AirPods Pro (2ª gen)', 
          price: '899000',
          originalPrice: '999000',
          image: 'img/airpods.webp',
          category: 'auriculares',
          brand: 'Apple',
          featured: true,
          badge: 'Bestseller',
          description: 'Auriculares inalámbricos con cancelación activa de ruido, audio espacial personalizado y hasta 6 horas de reproducción.',
          specifications: { conectividad: 'Bluetooth 5.3', bateria: 'Hasta 6h + 30h con estuche', resistencia: 'IPX4', chip: 'H2', cancelacion: 'Cancelación Activa de Ruido', color: 'Blanco' },
          stock: 25, rating: 4.8, reviews: 234
        },
        { 
          id: 'sony-wh-1000xm5',
          name: 'Sony WH-1000XM5', 
          price: '1299000',
          image: 'img/audifonos sony.webp',
          category: 'auriculares',
          brand: 'Sony',
          featured: true,
          description: 'Auriculares over-ear premium con la mejor cancelación de ruido del mercado y 30 horas de batería.',
          specifications: { conectividad: 'Bluetooth 5.2, NFC', bateria: 'Hasta 30 horas', cancelacion: 'Cancelación de Ruido Líder', drivers: '30mm', peso: '250g', color: 'Negro' },
          stock: 18, rating: 4.9, reviews: 156
        },
        { 
          id: 'apple-watch-s9',
          name: 'Apple Watch Series 9', 
          price: '1899000',
          image: 'img/smart whatch.png',
          category: 'smartwatches',
          brand: 'Apple',
          featured: true,
          badge: 'Nuevo',
          description: 'Smartwatch más avanzado con chip S9, pantalla Always-On más brillante y nuevos gestos con Double Tap.',
          specifications: { pantalla: '45mm Always-On Retina', chip: 'S9 SiP', bateria: 'Hasta 18 horas', resistencia: 'WR50', sensores: 'ECG, Oxígeno, Temperatura', color: 'Medianoche' },
          stock: 30, rating: 4.7, reviews: 98
        },
        { 
          id: 'samsung-buds-pro-3',
          name: 'Samsung Galaxy Buds3 Pro', 
          price: '699000',
          originalPrice: '799000',
          image: 'img/auriculares samsung.jpg',
          category: 'auriculares',
          brand: 'Samsung',
          featured: true,
          badge: 'Oferta',
          description: 'Auriculares premium con cancelación de ruido adaptativa, audio 360 y hasta 8 horas de reproducción.',
          specifications: { conectividad: 'Bluetooth 5.3', bateria: 'Hasta 8h + 30h con estuche', resistencia: 'IPX7', drivers: '11mm + 6.5mm', cancelacion: 'ANC Adaptativo', color: 'Graphite' },
          stock: 22, rating: 4.6, reviews: 78
        }
      ],
      footer: {
        phone: '+57 301 234 5678',
        email: 'info@puntodigital.co',
        address: 'Colombia',
        whatsapp: '+57 301 234 5678'
      },
      social: {
        facebook:  'https://facebook.com/puntodigital',
        instagram: 'https://instagram.com/puntodigital',
        whatsapp:  'https://wa.me/573012345678',
        twitter:   'https://twitter.com/puntodigital',
        youtube:   'https://youtube.com/puntodigital'
      },
      typography: {
        fontFamily: 'Poppins',
        heroTitleSize: 58,
        sectionTitleSize: 28,
        baseSize: 16
      },
      seo: {
        title: 'Punto Digital | Tecnología y Telefonía',
        description: 'Tienda especializada en tecnología y telefonía. Los mejores smartphones, gadgets y accesorios.',
        keywords: 'smartphones, tecnología, telefonía, gadgets, accesorios'
      }
    };
  }

  /**
   * Crea imagen placeholder mejorada
   */
  createPlaceholderImage(text, bgColor = '#1a1a1a') {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, 300, 300);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, '#d4a843');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 300);
    
    // Texto
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Poppins, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Dividir texto en líneas si es muy largo
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 250) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    
    // Dibujar líneas centradas
    const lineHeight = 25;
    const startY = 150 - (lines.length - 1) * lineHeight / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, 150, startY + index * lineHeight);
    });
    
    return canvas.toDataURL('image/png');
  }

  /**
   * Carga datos desde localStorage
   * Si los datos están corruptos (arrays convertidos a objetos), los descarta
   */
  loadData() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsedData = JSON.parse(saved);
        
        // Validar que las secciones que deben ser arrays lo sean
        const arraySections = ['features', 'categories', 'products'];
        const isCorrupt = arraySections.some(key => 
          parsedData[key] !== undefined && !Array.isArray(parsedData[key])
        );
        
        if (isCorrupt) {
          console.warn('Datos guardados corruptos detectados, usando valores por defecto');
          localStorage.removeItem(this.storageKey);
          return { ...this.defaultData };
        }
        
        return this.mergeWithDefaults(parsedData);
      }
    } catch (error) {
      console.warn('Error cargando datos guardados:', error);
      localStorage.removeItem(this.storageKey);
    }
    
    return { ...this.defaultData };
  }

  /**
   * Combina datos guardados con valores por defecto
   * Preserva arrays correctamente
   */
  mergeWithDefaults(savedData) {
    const merged = { ...this.defaultData };
    
    Object.keys(savedData).forEach(key => {
      const saved = savedData[key];
      const def = this.defaultData[key];
      
      if (Array.isArray(def)) {
        // Si el default es array, el guardado también debe serlo
        merged[key] = Array.isArray(saved) ? saved : def;
      } else if (typeof def === 'object' && def !== null) {
        merged[key] = { ...def, ...saved };
      } else {
        merged[key] = saved;
      }
    });
    
    return merged;
  }

  /**
   * Guarda datos en localStorage.
   * Comprime dataURLs de imágenes antes de guardar para evitar QuotaExceededError.
   */
  saveData() {
    try {
      const dataToSave = this._compressForStorage(this.data);
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
      this.notifyObservers('dataSaved', this.data);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage lleno — guardando solo datos esenciales (sin imágenes procesadas)');
        try {
          const minimal = this._minimalData(this.data);
          localStorage.setItem(this.storageKey, JSON.stringify(minimal));
          return true;
        } catch (e2) {
          console.error('No se pudo guardar ni la versión mínima:', e2);
        }
      } else {
        console.error('Error guardando datos:', error);
      }
      return false;
    }
  }

  /**
   * Reemplaza dataURLs largas por un marcador para no saturar localStorage.
   * Las imágenes procesadas (base64) se mantienen en memoria pero no se persisten.
   */
  _compressForStorage(data) {
    const MAX_IMG = 50000; // 50KB por imagen máximo en storage
    const compress = (val) => {
      if (typeof val === 'string' && val.startsWith('data:') && val.length > MAX_IMG) {
        // Intentar recomprimir a JPEG de menor calidad
        try {
          const img = new Image();
          img.src = val;
          const c = document.createElement('canvas');
          c.width = 300; c.height = 300;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, 300, 300);
          const compressed = c.toDataURL('image/jpeg', 0.5);
          return compressed.length < val.length ? compressed : val.substring(0, MAX_IMG) + '…';
        } catch {
          return val.substring(0, MAX_IMG) + '…';
        }
      }
      return val;
    };

    const walk = (obj) => {
      if (Array.isArray(obj)) return obj.map(walk);
      if (obj && typeof obj === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
          result[k] = (k === 'image' || k === 'url') ? compress(v) : walk(v);
        }
        return result;
      }
      return obj;
    };

    return walk(data);
  }

  /**
   * Versión mínima sin imágenes procesadas — fallback de último recurso
   */
  _minimalData(data) {
    const strip = (val) => {
      if (typeof val === 'string' && val.startsWith('data:')) return '';
      return val;
    };
    const walk = (obj) => {
      if (Array.isArray(obj)) return obj.map(walk);
      if (obj && typeof obj === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
          result[k] = (k === 'image' || k === 'url') ? strip(v) : walk(v);
        }
        return result;
      }
      return obj;
    };
    return walk(data);
  }

  /**
   * Obtiene todos los datos
   */
  getData() {
    return { ...this.data };
  }

  /**
   * Obtiene una sección específica de datos
   * Preserva arrays correctamente
   */
  getSection(section) {
    const value = this.data[section];
    if (value === undefined || value === null) return null;
    if (Array.isArray(value)) return [...value];
    if (typeof value === 'object') return { ...value };
    return value;
  }

  /**
   * Actualiza una sección de datos
   * Si newData es array, reemplaza directamente; si es objeto, hace merge
   */
  updateSection(section, newData) {
    if (Array.isArray(newData)) {
      this.data[section] = [...newData];
    } else if (typeof newData === 'object' && newData !== null) {
      this.data[section] = Array.isArray(this.data[section])
        ? [...newData]
        : { ...(this.data[section] || {}), ...newData };
    } else {
      this.data[section] = newData;
    }
    if (section === 'colors' || section === 'typography') {
      this.applyVisualSettings();
    }
    this.saveData();
    this.notifyObservers('sectionUpdated', { section, data: this.data[section] });
  }

  /**
   * Actualiza un elemento específico
   */
  updateItem(section, index, newData) {
    if (Array.isArray(this.data[section]) && this.data[section][index]) {
      this.data[section][index] = { ...this.data[section][index], ...newData };
      this.saveData();
      this.notifyObservers('itemUpdated', { section, index, data: this.data[section][index] });
    }
  }

  /**
   * Añade un nuevo elemento a una sección
   */
  addItem(section, newItem) {
    if (Array.isArray(this.data[section])) {
      this.data[section].push(newItem);
      this.saveData();
      this.notifyObservers('itemAdded', { section, item: newItem });
    }
  }

  /**
   * Elimina un elemento de una sección
   */
  removeItem(section, index) {
    if (Array.isArray(this.data[section]) && this.data[section][index]) {
      const removedItem = this.data[section].splice(index, 1)[0];
      this.saveData();
      this.notifyObservers('itemRemoved', { section, index, item: removedItem });
    }
  }

  /**
   * Resetea a datos por defecto
   */
  resetToDefaults() {
    this.data = { ...this.defaultData };
    this.applyVisualSettings();
    this.saveData();
    this.notifyObservers('dataReset', this.data);
  }

  /**
   * Exporta datos como JSON
   */
  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Importa datos desde JSON
   */
  importData(jsonData) {
    try {
      const importedData = JSON.parse(jsonData);
      this.data = this.mergeWithDefaults(importedData);
      this.applyVisualSettings();
      this.saveData();
      this.notifyObservers('dataImported', this.data);
      return true;
    } catch (error) {
      console.error('Error importando datos:', error);
      return false;
    }
  }

  /**
   * Añade observer para cambios de datos
   */
  addObserver(callback) {
    this.observers.push(callback);
  }

  /**
   * Remueve observer
   */
  removeObserver(callback) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  /**
   * Notifica a todos los observers
   */
  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error en observer:', error);
      }
    });
  }

  /**
   * Valida estructura de datos
   */
  validateData(data) {
    const requiredSections = ['colors', 'hero', 'features', 'categories', 'products', 'footer', 'social', 'typography', 'seo'];
    
    return requiredSections.every(section => {
      return data.hasOwnProperty(section);
    });
  }

  applyVisualSettings() {
    const root = document.documentElement;
    const colors = this.data.colors || {};
    const typography = this.data.typography || {};

    const goldPrimary = colors.goldPrimary || '#d4a843';
    const goldLight = colors.goldLight || '#f0d68a';
    const goldDark = colors.goldDark || '#b89344';

    root.style.setProperty('--gold-primary', goldPrimary);
    root.style.setProperty('--gold-light', goldLight);
    root.style.setProperty('--gold-dark', goldDark);

    const fontFamily = typography.fontFamily || 'Poppins';
    this.ensureFontLoaded(fontFamily);
    root.style.setProperty('--font-family', this.buildFontStack(fontFamily));

    const heroSize = parseInt(typography.heroTitleSize, 10);
    const sectionSize = parseInt(typography.sectionTitleSize, 10);
    const baseSize = parseInt(typography.baseSize, 10);

    if (!Number.isNaN(heroSize)) {
      root.style.setProperty('--font-size-hero', `clamp(28px, 5vw, ${heroSize}px)`);
    }
    if (!Number.isNaN(sectionSize)) {
      root.style.setProperty('--font-size-section', `clamp(20px, 4vw, ${sectionSize}px)`);
    }
    if (!Number.isNaN(baseSize)) {
      root.style.setProperty('--font-size-base', `clamp(14px, 2vw, ${baseSize}px)`);
    }
  }

  buildFontStack(fontFamily) {
    return `'${fontFamily}', 'Segoe UI', 'Roboto', 'Arial', sans-serif`;
  }

  ensureFontLoaded(fontFamily) {
    const familyQuery = this.fontCatalog[fontFamily];
    if (!familyQuery) return;

    const linkId = `dynamic-font-${fontFamily.toLowerCase().replace(/\s+/g, '-')}`;
    if (document.getElementById(linkId)) return;

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${familyQuery}&display=swap`;
    document.head.appendChild(link);
  }
}

// Crear instancia global
window.siteData = new SiteDataManager();
