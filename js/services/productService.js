/**
 * Servicio para gestión de productos
 */
class ProductService {
  constructor() {
    this.products = [];
    this.exchangeRate = 3700; // USD a COP aproximado
  }

  /**
   * Carga productos desde JSON
   */
  async loadProducts() {
    try {
      const response = await fetch('js/data/products.json');
      const data = await response.json();
      
      this.products = this.transformProducts(data.celulares);
      return this.products;
    } catch (error) {
      console.error('Error cargando productos:', error);
      return this.getFallbackProducts();
    }
  }

  /**
   * Transforma productos del JSON al formato interno
   */
  transformProducts(jsonProducts) {
    return jsonProducts.map(product => {
      const marca = product.marca;
      const modelo = product.modelo;
      const baseSpecs = {
        pantalla: product.especificaciones.pantalla,
        almacenamiento: product.especificaciones.almacenamiento,
        ram: product.especificaciones.ram,
        bateria: product.especificaciones.bateria,
        procesador: this.getProcessor(marca),
        camara: this.getCamera(marca),
      };
      const techSpecs = this.buildTechSpecs(marca, modelo, product.especificaciones);
      const boxContents = this.getDefaultBoxContents(marca);
      return {
        id: `${marca.toLowerCase()}-${modelo.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${marca} ${modelo}`,
        price: Math.round(product.precio * this.exchangeRate).toString(),
        originalPrice: product.precio > 800 ? Math.round(product.precio * this.exchangeRate * 1.15).toString() : null,
        image: product.imagen_url,
        images: Array.isArray(product.imagenes) && product.imagenes.length
          ? product.imagenes
          : [
              product.imagen_url,
              product.imagen_url.replace('?', '+2?'),
              product.imagen_url.replace('?', '+3?')
            ],
        category: 'smartphones',
        brand: marca,
        featured: false,
        badge: this.getBadge(product),
        description: this.getDescription(product),
        specifications: baseSpecs,
        techSpecs,
        boxContents,
        stock: Math.floor(Math.random() * 20) + 5,
        rating: (Math.random() * 1.5 + 3.5).toFixed(1),
        reviews: Math.floor(Math.random() * 200) + 20
      };
    });
  }

  /**
   * Construye especificaciones técnicas categorizadas por marca
   */
  buildTechSpecs(marca, modelo, especificaciones) {
    const techSpecs = {};

    if (marca === 'Apple') {
      techSpecs.pantalla = {
        tamano: '6.7',
        tecnologia: 'Super Retina XDR OLED',
        resolucion: '2796 x 1290 píxeles',
        refresco: '120 Hz ProMotion',
        brillo: '2000 nits (pico exterior)',
        proteccion: 'Ceramic Shield, HDR10+, Dolby Vision'
      };
      techSpecs.rendimiento = {
        procesador: 'A18 Pro Bionic',
        gpu: 'Apple GPU 6 núcleos',
        nucleos: '6 núcleos CPU (2+4)'
      };
      techSpecs.memoria = {
        ram: especificaciones.ram || '8 GB LPDDR5X',
        interno: especificaciones.almacenamiento || '256 GB NVMe',
        expandible: 'No'
      };
      techSpecs.camara = {
        principal: '48 MP f/1.78 OIS sensor grande',
        ultragran: '12 MP f/2.2 120° Ultra Wide',
        telefoto: '12 MP f/2.8 Telefoto 5x OIS Prism',
        frontal: '12 MP TrueDepth f/1.9 Autofocus',
        video: '4K a 24/30/60 fps, ProRes 4K60, Cinematic 4K30, Spatial Video',
        caracteristicas: 'Apple ProRAW, Photonic Engine, Modo Noche, LiDAR, Macro'
      };
      techSpecs.bateria = {
        capacidad: especificaciones.bateria || '4582 mAh',
        cargaRapida: '27 W USB PD',
        cargaInalambrica: '15 W MagSafe / Qi2',
        cargaInversa: 'No',
        autonomia: 'Hasta 29h de reproducción de video, 95h audio'
      };
      techSpecs.conectividad = {
        redes: '5G (mmWave + Sub-6 GHz), 4G LTE',
        wifi: 'Wi-Fi 6E (802.11ax) 2x2 MIMO',
        bluetooth: 'Bluetooth 5.4 LE',
        nfc: 'Si (NFC con modo lector, Apple Pay, Apple Tag)',
        gps: 'GPS de doble banda (L1+L5), Precise Find My',
        usb: 'USB-C USB 3.0 (hasta 10 Gbps)'
      };
      techSpecs.diseno = {
        dimensiones: '162.9 x 77.6 x 8.25 mm',
        peso: '221 g',
        materiales: 'Acero inoxidable titanio grado 5, frente Ceramic Shield, respaldo vidrio mate',
        colores: 'Titanio Natural, Titanio Azul, Titanio Blanco, Titanio Negro',
        resistencia: 'IP68 (6m por 30 min) IEC 60529'
      };
      techSpecs.software = {
        sistema: 'iOS 18',
        interfaz: 'iOS nativo',
        actualizaciones: 'Hasta 7 años de actualizaciones de software y seguridad'
      };
      techSpecs.audio = {
        altavoces: 'Altavoces estéreo (abajo + auricular)',
        microfonos: 'Micrófonos triple con cancelación activa',
        tecnologia: 'Dolby Atmos, Spatial Audio con head-tracking',
        cancelacion: 'Cancelación activa de ruido en llamadas'
      };
      techSpecs.seguridad = {
        huella: 'No (reconocimiento facial)',
        reconocimiento: 'Face ID 3D TrueDepth',
        sensores: 'LiDAR, barómetro, giroscopio, acelerómetro, proximidad, luz ambiental'
      };
      techSpecs.otros = {
        garantia: '1 año contra defectos de fábrica',
        origen: 'Diseñado en California. Ensamblado en India / China / Vietnam',
        sku: modelo || 'iPhone Pro Max',
        destacadas: 'Apple Intelligence, StandBy Mode, Action Button personalizable, USB-C 3.0, Spatial Video'
      };
    } else if (marca === 'Samsung') {
      techSpecs.pantalla = {
        tamano: especificaciones.pantalla || '6.8',
        tecnologia: 'Dynamic AMOLED 2X LTPO',
        resolucion: '3088 x 1440 (Quad HD+)',
        refresco: '1 a 120 Hz adaptativo',
        brillo: '2600 nits pico HDR',
        proteccion: 'Corning Gorilla Armor, HDR10+, Dolby Vision, Vision Booster'
      };
      techSpecs.rendimiento = {
        procesador: 'Snapdragon 8 Elite for Galaxy',
        gpu: 'Adreno 830',
        nucleos: '8 núcleos Oryon',
        anTuTu: '~3.2M AnTuTu V11'
      };
      techSpecs.memoria = {
        ram: especificaciones.ram || '12 GB LPDDR5X',
        interno: especificaciones.almacenamiento || '256 GB UFS 4.1',
        expandible: 'No'
      };
      techSpecs.camara = {
        principal: '200 MP f/1.7 OIS sensor 1/1.33"',
        ultragran: '12 MP f/2.2 Dual Pixel AF, 120°',
        telefoto: '50 MP f/2.6 3x OIS + 50 MP f/2.6 5x OIS Periscope Zoom hasta 100x Space Zoom',
        frontal: '12 MP f/2.2 Dual Pixel AF AF',
        video: '8K@30fps, 4K@60fps HDR10+, Super Steady, Expert RAW, Director\'s Mode',
        caracteristicas: 'Astro Hyperlapse, Modo Pro, AI Eraser, Photo Remaster, S Pen Camera Remote'
      };
      techSpecs.bateria = {
        capacidad: especificaciones.bateria || '5000 mAh',
        cargaRapida: '45 W Super Fast Charging 2.0',
        cargaInalambrica: '15 W Qi Fast Wireless Charging 2.0',
        cargaInversa: '4.5 W Wireless PowerShare',
        autonomia: 'Hasta 2 días uso normal, ~23h reproducción video'
      };
      techSpecs.conectividad = {
        redes: '5G SA/NSA mmWave + Sub-6, 4G LTE',
        wifi: 'Wi-Fi 7 (802.11be) 6GHz MLO 4x4 MIMO',
        bluetooth: 'Bluetooth 5.4 LE Audio',
        nfc: 'Si + Samsung Pay MST+NFC',
        gps: 'GPS L1+L5, Galileo E1+E5a, Glonass, BDS, QZSS',
        usb: 'USB-C 3.2 Gen 1',
        jack: 'No'
      };
      techSpecs.diseno = {
        dimensiones: '164.2 x 79 x 8.6 mm (S Pen integrado)',
        peso: '232 g',
        materiales: 'Marcos de Titanio, Armor Aluminum, Gorilla Armor delante y atrás',
        colores: 'Titanio Gris, Titanio Negro, Titanio Azul, Titanio Crema, Titanio Verde',
        resistencia: 'IP68 (1.5m por 30min) + Armor Frame'
      };
      techSpecs.software = {
        sistema: 'Android 15',
        interfaz: 'One UI 7',
        actualizaciones: '4 actualizaciones de OS + 5 años de parches de seguridad'
      };
      techSpecs.audio = {
        altavoces: 'Altavoces estéreo Dolby Atmos adaptativo, AKG Tuning',
        microfonos: 'Micrófonos duales con noise reduction',
        tecnologia: 'Dolby Atmos, 360 Audio, Hi-Res Audio Wireless 24bit',
        cancelacion: 'De alta calidad con AI'
      };
      techSpecs.seguridad = {
        huella: 'Ultrasonico integrado en pantalla (3D Sonic Max)',
        reconocimiento: 'Desbloqueo facial 3D con iris',
        sensores: 'Barrómetro, giroscopio, magnetómetro, Hall, proximidad, luz, S Pen'
      };
      techSpecs.otros = {
        garantia: '1 año de garantía legal internacional',
        origen: 'Samsung Mobile Division (Fabricado en Vietnam/India/Korea)',
        sku: `SM-${modelo || 'S928'}`,
        destacadas: 'S Pen Bluetooth integrado, Samsung DeX, Bixby, Samsung Knox Vault, Galaxy AI live translate'
      };
    } else if (marca === 'Google') {
      techSpecs.pantalla = {
        tamano: especificaciones.pantalla || '6.4',
        tecnologia: 'OLED Actua LTPO',
        resolucion: '2424 x 1080 (FHD+)',
        refresco: '1 a 120 Hz adaptativo',
        brillo: '2400 nits pico HDR',
        proteccion: 'Corning Gorilla Glass Victus 3, HDR, True Tone, Always-On Display'
      };
      techSpecs.rendimiento = {
        procesador: 'Google Tensor G4',
        gpu: 'Mali G715 MP11',
        nucleos: '8 núcleos (3.0 GHz X1 + 2.4 GHz A715 + 2.1 GHz A510)',
        anTuTu: '~1.9M AnTuTu'
      };
      techSpecs.memoria = {
        ram: especificaciones.ram || '12 GB LPDDR5X',
        interno: especificaciones.almacenamiento || '128 GB UFS 4.0',
        expandible: 'No'
      };
      techSpecs.camara = {
        principal: '50 MP f/1.7 GN2 sensor 1/1.3" 2.4um OIS Dual Pixel Pro',
        ultragran: '48 MP f/2.2 Macro Focus 113° campo amplio',
        telefoto: '48 MP f/1.9 Pro sensor 5x zoom óptico OIS Super Res Zoom 15x',
        frontal: '32 MP Samsung S5K3P9 f/2.2 con AutoFocus',
        video: '4K60fps HDR+, 10-bit Rec2020, Modo Cinemático, Night Sight video, Audio Zoom',
        caracteristicas: 'Computational RAW +, Photo Unblur, Magic Editor, Best Take, Night Sight, Astrophotography, Circle to Search'
      };
      techSpecs.bateria = {
        capacidad: especificaciones.bateria || '4950 mAh',
        cargaRapida: '30 W USB-C PD',
        cargaInalambrica: '18 W Qi + 23 W Magnetic Charging (Pixel Stand)',
        cargaInversa: '5 W Battery Share (carga inversa)',
        autonomia: 'Hasta 24h uso normal, Extreme Battery Saver 72h'
      };
      techSpecs.conectividad = {
        redes: '5G SA/NSA Sub-6, 4G LTE, DSDS',
        wifi: 'Wi-Fi 7 (802.11be) tri-band, MLO, WPA3',
        bluetooth: 'Bluetooth 5.4 LE Audio',
        nfc: 'Si + Google Wallet Secure NFC',
        gps: 'Dual-band L1+L5 GNSS: GPS, GLONASS, Galileo, QZSS, BDS',
        usb: 'USB-C 3.2 Gen 2 (10 Gbps) + Video out DP Alt Mode',
        jack: 'No'
      };
      techSpecs.diseno = {
        dimensiones: '155.5 x 74.3 x 8.6 mm',
        peso: '202 g',
        materiales: 'Frame aluminio, Gorilla Glass Victus 3 frente/atrás, trasera mate',
        colores: 'Obsidiana, Porcelain, Haze (Azul)',
        resistencia: 'IP68 (hasta 1.5 m / 30 min IEC 60529)'
      };
      techSpecs.software = {
        sistema: 'Android 15 stock Pixel',
        interfaz: 'Pixel UI Material You',
        actualizaciones: '7 años de OS + Security updates, Feature Drops cada 3 meses',
        extra: 'Android for Work, Ready API, Circle to Search, Live Translate on-device, Gemini Nano'
      };
      techSpecs.audio = {
        altavoces: 'Altavoces estéreo (abajo + auricular)',
        microfonos: 'Micrófonos duales con noise suppression espectral',
        tecnologia: 'Hi-Res Audio Wireless, Spatial Audio Dolby Atmos, Clear Calling',
        cancelacion: 'Adaptive Sound + Active Noise Cancellation en earbuds compatibles'
      };
      techSpecs.seguridad = {
        huella: 'Sensor óptico bajo pantalla (FIDO2)',
        reconocimiento: 'Face Unlock (fotografía 2D no pago)',
        sensores: 'Titan M2 Security Chip, Barómetro, Giro, Acel, Mag, Luz ambiente, Proximidad',
        otros: 'Titan M2 chip de seguridad, Auto Reset, VPN by Google One incluido'
      };
      techSpecs.otros = {
        garantia: '1 año internacional + 2 años garantía legal',
        origen: 'Google Hardware Made By Google (ensamble Tailandia / Vietnam)',
        sku: `G2XBR ${modelo || 'Pixel Pro'}`,
        destacadas: 'Gemini Nano local, Gemini AI avanzado, Magic Eraser, Best Take, Magic Editor, Circle to Search, Photo/Movie Unblur, Live Translation, Live Captions'
      };
    } else if (marca === 'Xiaomi') {
      techSpecs.pantalla = {
        tamano: especificaciones.pantalla || '6.73',
        tecnologia: 'LTPO AMOLED 2K WQHD+ Leica Co-Engineered',
        resolucion: '3200 x 1440 522 ppi',
        refresco: '1-120 Hz LTPO adaptativo, toque 480 Hz',
        brillo: '4000 nits pico',
        proteccion: 'Corning Gorilla Glass Victus 3, Dolby Vision 14-bit, HDR10+, 10-bit 1600 nits'
      };
      techSpecs.rendimiento = {
        procesador: 'Qualcomm Snapdragon 8 Elite',
        gpu: 'Adreno 830 GPU 1100 MHz',
        nucleos: '8 núcleos Oryon (3 nm Qualcomm)',
        anTuTu: '~3.4M AnTuTu V11, Geekbench 8.4k single / 23k multi'
      };
      techSpecs.memoria = {
        ram: especificaciones.ram || '16 GB LPDDR5X 9600 Mbps',
        interno: especificaciones.almacenamiento || '512 GB UFS 4.1',
        expandible: 'No'
      };
      techSpecs.camara = {
        principal: '50 MP LYT-900 f/1.4-f/2.8 Vario-Apertura OIS Leica MOBILE 28mm',
        ultragran: '50 MP JN1 Ultra-Wide 120° f/2.0 Leica-Summicron',
        telefoto: '50 MP Periscope 5x OIS Leica VARIO-ELMARIT 115mm, hasta 200x Zoom digital',
        frontal: '32 MP Samsung S5K3P9 AF Leica',
        video: '8K@24fps Leica-Log, 4K@120fps Dolby Vision HDR, Master Mode, Slow-motion 1080p 960fps',
        caracteristicas: 'Leica M-Active (fotografía callejera), Leica-Vario Filters, Leica Natural / Vivid Modes, Computational Photography, Xiaomi ProFoto 1.0, Xiaomi AI'
      };
      techSpecs.bateria = {
        capacidad: especificaciones.bateria || '5500 mAh (typ) Silicon-carbon',
        cargaRapida: '120 W HyperCharge (0-100% 19 min)',
        cargaInalambrica: '80 W Wireless HyperCharge',
        cargaInversa: '10 W Reverse Charging',
        autonomia: '2 días de uso normal, 30h reproducción video'
      };
      techSpecs.conectividad = {
        redes: '5G SA/NSA, DSDA Dual 5G Standby, 4G LTE',
        wifi: 'Wi-Fi 7 802.11be 6GHz, FastConnect 7900 MLO Tri-band 4x4 MIMO',
        bluetooth: 'Bluetooth 5.4 LE Audio + LC3plus',
        nfc: 'Si, Mi Tap, MiWallet, Google Wallet',
        gps: 'Tri-band L1+L2+L5: GPS, GLONASS, Galileo, BDS-3, QZSS, NavIC, SBAS',
        usb: 'USB-C USB 3.2 Gen 2 (10 Gbps) DP Alt Mode video'
      };
      techSpecs.diseno = {
        dimensiones: '160.8 x 75.3 x 8.2 mm',
        peso: '221 g',
        materiales: 'Marco de Titanio grado 2, Gorilla Glass Victus 3, Cerámica en cámara',
        colores: 'Titanio Negro, Titanio Blanco, Verde Jade',
        resistencia: 'IP68 (1.5m 30 minutos IEC 60529)'
      };
      techSpecs.software = {
        sistema: 'Android 15',
        interfaz: 'HyperOS 2 Xiaomi-China / Global',
        actualizaciones: '4 actualizaciones de sistema operativo + 5 años security patches',
        extra: 'HyperOS Connect (conexión auto Ecosystem) Xiaomi Smart Home, Mi Cloud'
      };
      techSpecs.audio = {
        altavoces: 'Altavoces estéreo dual Harman Kardon, Dolby Atmos, Hi-Res 24bit/192kHz',
        microfonos: 'Micrófonos 4 con beamforming y noise suppression',
        tecnologia: 'Dolby Atmos, Hi-Res Audio Certified, Bluetooth LHDC 5.0 / LC3+',
        cancelacion: 'ANC de alta calidad con micrófonos duales en audio'
      };
      techSpecs.seguridad = {
        huella: 'Ultrasónico bajo pantalla Qualcomm 3D Sonic Max',
        reconocimiento: 'Desbloqueo por rostro 3D (pago)',
        sensores: 'Chip de seguridad SE, barómetro, giroscopio, magnetómetro, acelerómetro, luz, Proximidad, Sensor de color'
      };
      techSpecs.otros = {
        garantia: '1 año garantía internacional oficial Xiaomi',
        origen: 'Xiaomi Corporation, Made in China/India/Indonesia',
        sku: `Xiaomi ${modelo || '14 Ultra'}`,
        destacadas: 'Leica Professional Full System Camera (Lente a Lente), Xiaomi Surging P1 y G1 custom chips, HyperOS 2, 3nm Snapdragon 8 Elite'
      };
    } else if (marca === 'OnePlus') {
      techSpecs.pantalla = {
        tamano: especificaciones.pantalla || '6.82',
        tecnologia: 'Fluid AMOLED LTPO 2.0 Display 2K',
        resolucion: '3168 x 1440 (Fluid QHD+) 510 PPI',
        refresco: '1-120 Hz LTPO 4.0 Touch sampling: 240 Hz normal, 480 Hz gaming',
        brillo: '3200 nits peak, 1600 nits HBM, Dolby Vision 14-bit',
        proteccion: 'Corning Gorilla Glass Victus 3, 10-bit DCI-P3, True Color 400+ppi JNCD<0.8'
      };
      techSpecs.rendimiento = {
        procesador: 'Qualcomm Snapdragon 8 Elite 3nm + OnePlus Trinity Engine',
        gpu: 'Adreno 830',
        nucleos: '8 núcleos Oryon arquitectura',
        anTuTu: '~3.400.000 AnTuTu, Ray Tracing Hardware'
      };
      techSpecs.memoria = {
        ram: especificaciones.ram || '16 GB LPDDR5X 9600 MHz',
        interno: especificaciones.almacenamiento || '512 GB UFS 4.1',
        expandible: 'No'
      };
      techSpecs.camara = {
        principal: '50MP Sony LYT-808 f/1.6 1/1.4" OIS Hasselblad Main 23mm',
        ultragran: '50MP Samsung JN1 Ultra-wide 114° f/2.2 Hasselblad',
        telefoto: '64MP OV64B 3x telephoto f/2.6 OIS Sensor 1/2" hasta 120x Digital Zoom',
        frontal: '32MP f/2.4 Samsung S5K3P9',
        video: '4K@120fps Dolby Vision, LOG, Ultra HDR 10-bit, Hasselblad Pro video mode, 10-bit color',
        caracteristicas: 'Hasselblad Natural Color Calibration 2.0, Hasselblad Filters, Master Mode, XPan, Long Exposure, Night Mode, AI Eraser'
      };
      techSpecs.bateria = {
        capacidad: especificaciones.bateria || '6000 mAh Ice Cooling battery',
        cargaRapida: '100W SuperVOOC (0-100% en 26 min) via USB-PD PPS',
        cargaInalambrica: '50W AirVOOC Wireless Charger',
        cargaInversa: '10W Reverse',
        autonomia: '2 días, Duración video 32h'
      };
      techSpecs.conectividad = {
        redes: '5G SA/NSA, 4G LTE, Dual SIM dual standby 5G',
        wifi: 'Wi-Fi 7 Tri-band 2.4/5/6 GHz FastConnect 7900, 4x4 MIMO, MLO',
        bluetooth: 'Bluetooth 5.4 LE, LE Audio, LHDC 5.0',
        nfc: 'Si, Google Pay / OnePlus Pay',
        gps: 'Dual-Band L1+L5, GPS, Galileo, GLONASS, BeiDou, SBAS, A-GPS',
        usb: 'USB-C 3.2 Gen 1 + DP Alt Mode + USB PD 100W + OTG',
        jack: 'No'
      };
      techSpecs.diseno = {
        dimensiones: '162.8 x 75.5 x 8.4 mm',
        peso: '220 g',
        materiales: 'Chasis aluminio 6000, Gorilla Glass Victus 3, trasera AG Glass',
        colores: 'Never Settle Green (Verde), Titan Matte, Obsidian',
        resistencia: 'IP68 (1,5m 30 min IEC 60529)'
      };
      techSpecs.software = {
        sistema: 'Android 15',
        interfaz: 'OxygenOS 15 (Never Settle) Lightweight UI',
        actualizaciones: '4 OS updates + 5 Años parches Seguridad',
        extra: 'Relax Mode, Zen Mode, Shelf, Games 2.0, Trinity Boost AI'
      };
      techSpecs.audio = {
        altavoces: 'Estéreo duales Dolby Atmos, Dirac Audio Tuning',
        microfonos: '3 micrófonos, AI Noise reduction para llamadas',
        tecnologia: 'Dolby Atmos, Dirac HD Sound, Hi-Res Audio',
        cancelacion: 'ANC en headset OnePlus Buds Pro'
      };
      techSpecs.seguridad = {
        huella: 'Ultrasonico 3D Sonic Max (bajo display, pago FIDO2)',
        reconocimiento: 'Face Unlock rápido',
        sensores: 'Acelerómetro, Giroscopio, Proximidad, Luz Ambiental, Barómetro, Magnetómetro, Sensor de color',
        otros: 'Hardware Crypto Engine, Secure Payment'
      };
      techSpecs.otros = {
        garantia: '1 año Internacional + Soporte OnePlus Care',
        origen: 'OnePlus (BBK Electronics Corp), Made in China / India',
        sku: `OnePlus ${modelo || '13'}`,
        destacadas: 'Trinity Engine (AI Performance Tuning), Hasselblad Camera System, Snapdragon 8 Elite 3nm, Alert Slider, Ice Cooling 13000 mm² VC'
      };
    } else {
      techSpecs.pantalla = {
        tamano: especificaciones.pantalla || '6.5',
        tecnologia: 'AMOLED FHD+',
        resolucion: '2400 x 1080 FHD+',
        refresco: '90 Hz',
        proteccion: 'Gorilla Glass 5'
      };
      techSpecs.rendimiento = {
        procesador: this.getProcessor(marca),
        nucleos: '8 núcleos'
      };
      techSpecs.memoria = {
        ram: especificaciones.ram || '8 GB',
        interno: especificaciones.almacenamiento || '128 GB',
        expandible: 'Si, microSD'
      };
      techSpecs.camara = {
        principal: this.getCamera(marca) || '48 MP',
        frontal: '16 MP'
      };
      techSpecs.bateria = {
        capacidad: especificaciones.bateria || '4500 mAh',
        cargaRapida: '33 W'
      };
      techSpecs.conectividad = {
        redes: '4G LTE, 5G',
        wifi: 'Wi-Fi 6',
        bluetooth: '5.3',
        usb: 'USB-C'
      };
      techSpecs.diseno = {
        peso: '~190 g',
        materiales: 'Plástico + vidrio'
      };
      techSpecs.software = {
        sistema: 'Android 14',
        actualizaciones: '2 actualizaciones de sistema'
      };
      techSpecs.seguridad = {
        huella: 'Lector de huella lateral / trasero'
      };
      techSpecs.otros = {
        garantia: '1 año',
        sku: modelo
      };
    }

    return techSpecs;
  }

  /**
   * Retorna el contenido base de la caja por marca
   */
  getDefaultBoxContents(marca) {
    const common = [
      'Smartphone libre de fábrica',
      'Cable de datos USB-C a USB-C de 1m',
      'Herramienta ejectora de bandeja SIM',
      'Guía de inicio rápido y documentos legales',
      'Stickers / calcomanías de marca'
    ];
    if (marca === 'Samsung') {
      return [
        'Smartphone libre de fábrica',
        'S Pen integrado de fábrica',
        'Cable USB-C a USB-C (3A/5A Super Fast Charging)',
        'Adaptador USB-C a 3.5mm (en algunos mercados)',
        'Herramienta ejectora SIM',
        'Guía rápida y garantía Samsung oficial',
        'Pegatina "Galaxy AI" + stickers Samsung'
      ];
    }
    if (marca === 'Apple') {
      return [
        'iPhone libre de fábrica',
        'Cable USB-C a USB-C Trenzado de 1 metro (3A)',
        'Manual de usuario y Guía de Configuración',
        'Pin extractor de SIM',
        'Calcomanías Apple + Stickers "Hello Apple Intelligence"'
      ];
    }
    if (marca === 'Xiaomi') {
      return [
        'Xiaomi Smartphone libre de fábrica',
        'Cargador GaN 120W HyperCharge + Cable USB-C 6A de 1m',
        'Cable USB-C de datos',
        'Funda de silicona transparente / TPU original Xiaomi',
        'Lámina protectora de pantalla preinstalada',
        'Extracto SIM Tool',
        'Manual usuario + Certificado de Garantía',
        'Stickers Xiaomi Leica'
      ];
    }
    if (marca === 'OnePlus') {
      return [
        'OnePlus Smartphone libre de fábrica',
        'Cargador 100W SUPERVOOC con Cable Warp USB-C de 1m',
        'Cable USB-C adicional de 1.5m',
        'Funda protectora Case oficial TPU transparente',
        'Lámina protectora de pantalla preinstalada',
        'Herramienta extractora de bandeja Nano-SIM',
        'Guía rápida y Welcome Pack OnePlus Never Settle'
      ];
    }
    if (marca === 'Google') {
      return [
        'Google Pixel Smartphone libre de fábrica',
        'Cable USB-C a USB-C de 1 metro',
        'Adaptador USB-C quick-switch (transferir de viejo móvil)',
        'Herramienta extractor SIM',
        'Guía rápida + guía Google One / Gemini',
        'Sticker Pixel "Built by Google"'
      ];
    }
    return common;
  }

  /**
   * Obtiene badge según el producto
   */
  getBadge(product) {
    if (product.marca === 'Apple') return 'Nuevo';
    if (product.precio > 1000) return 'Premium';
    if (product.marca === 'Google') return 'IA Avanzada';
    if (product.marca === 'OnePlus') return 'Rendimiento';
    return null;
  }

  /**
   * Genera descripción del producto
   */
  getDescription(product) {
    const descriptions = {
      'Apple': `El ${product.modelo} más avanzado con tecnología de vanguardia y diseño premium.`,
      'Samsung': `Smartphone premium con S Pen integrado y pantalla Dynamic AMOLED de última generación.`,
      'Google': `Smartphone con inteligencia artificial avanzada y cámara computacional.`,
      'Xiaomi': `Flagship con cámara Leica y carga rápida de alta velocidad.`,
      'OnePlus': `Rendimiento flagship con OxygenOS y carga SuperVOOC ultrarrápida.`
    };
    
    return descriptions[product.marca] || `Smartphone ${product.marca} ${product.modelo} de alta gama.`;
  }

  /**
   * Obtiene procesador según la marca
   */
  getProcessor(marca) {
    const processors = {
      'Apple': 'A17 Pro',
      'Samsung': 'Snapdragon 8 Gen 3',
      'Google': 'Google Tensor G3',
      'Xiaomi': 'Snapdragon 8 Gen 3',
      'OnePlus': 'Snapdragon 8 Gen 3'
    };
    
    return processors[marca] || 'Procesador de alta gama';
  }

  /**
   * Obtiene información de cámara según la marca
   */
  getCamera(marca) {
    const cameras = {
      'Apple': 'Sistema Pro de 48MP',
      'Samsung': 'Cuádruple 200MP',
      'Google': 'Dual 50MP + IA',
      'Xiaomi': 'Triple Leica 50MP',
      'OnePlus': 'Triple Hasselblad 50MP'
    };
    
    return cameras[marca] || 'Cámara profesional';
  }

  /**
   * Productos de respaldo si falla la carga
   */
  getFallbackProducts() {
    const fbTechSpecs = {
      pantalla: {
        tamano: '6.1',
        tecnologia: 'Super Retina XDR OLED',
        resolucion: '2532 x 1170 píxeles',
        refresco: '120 Hz ProMotion',
        brillo: '1200 nits pico',
        proteccion: 'Ceramic Shield'
      },
      rendimiento: {
        procesador: 'A17 Pro 6-core',
        gpu: 'GPU 5-core',
        nucleos: '6 núcleos (2+4)'
      },
      memoria: {
        ram: '8 GB',
        interno: '128 GB',
        expandible: 'No'
      },
      camara: {
        principal: '48 MP f/1.78 OIS',
        ultragran: '12 MP Ultra Wide 120°',
        telefoto: '12 MP Telefoto 3x OIS',
        frontal: '12 MP TrueDepth',
        video: '4K60 Dolby Vision HDR',
        caracteristicas: 'Computational Photography, Night Mode, LiDAR'
      },
      bateria: {
        capacidad: '3279 mAh',
        cargaRapida: '27 W USB-PD',
        cargaInalambrica: '15 W MagSafe',
        autonomia: '23 horas reproducción video'
      },
      conectividad: {
        redes: '5G, 4G LTE',
        wifi: 'Wi-Fi 6E 802.11ax',
        bluetooth: '5.4',
        nfc: 'Si con Apple Pay',
        gps: 'Dual-band GPS L1+L5',
        usb: 'USB-C'
      },
      diseno: {
        dimensiones: '146.7 x 70.6 x 7.8 mm',
        peso: '178 g',
        materiales: 'Aluminio aeroespacial, vidrio mate',
        colores: 'Azul, Negro, Natural',
        resistencia: 'IP68'
      },
      software: {
        sistema: 'iOS 17',
        interfaz: 'iOS stock',
        actualizaciones: 'Hasta 7 años'
      },
      audio: {
        altavoces: 'Altavoces estéreo, Dolby Atmos'
      },
      seguridad: {
        huella: 'No',
        reconocimiento: 'Face ID 3D TrueDepth',
        sensores: 'LiDAR, barómetro, giroscopio'
      },
      otros: {
        garantia: '1 año',
        sku: 'FALLBACK-001',
        destacadas: 'Producto de ejemplo con características destacadas'
      }
    };
    const fbBox = [
      'Smartphone libre de fábrica',
      'Cable USB-C',
      'Herramienta extractora SIM',
      'Manual de usuario'
    ];
    return [
      {
        id: 'fallback-product',
        name: 'Producto de Ejemplo',
        price: '2999000',
        image: 'https://placehold.co/300x400?text=Producto',
        images: [
          'https://placehold.co/300x400?text=Producto',
          'https://placehold.co/300x400?text=Producto+2',
          'https://placehold.co/300x400?text=Producto+3'
        ],
        category: 'smartphones',
        brand: 'Ejemplo',
        description: 'Producto de ejemplo para mostrar la navegación completa con especificaciones técnicas organizadas.',
        specifications: {
          pantalla: '6.1 pulgadas',
          almacenamiento: '128 GB',
          ram: '8 GB',
          bateria: '4000 mAh',
          procesador: 'A17 Pro',
          camara: 'Triple 48 MP'
        },
        techSpecs: fbTechSpecs,
        boxContents: fbBox,
        stock: 10,
        rating: 4.5,
        reviews: 50
      }
    ];
  }

  /**
   * Obtiene productos por categoría
   */
  getProductsByCategory(category) {
    return this.products.filter(product => product.category === category);
  }

  /**
   * Obtiene productos por marca
   */
  getProductsByBrand(brand) {
    return this.products.filter(product => product.brand === brand);
  }

  /**
   * Busca productos por nombre
   */
  searchProducts(query) {
    const searchTerm = query.toLowerCase();
    return this.products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.brand.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Obtiene producto por ID
   */
  getProductById(id) {
    return this.products.find(product => product.id === id);
  }

  /**
   * Obtiene todos los productos
   */
  getAllProducts() {
    return this.products;
  }

  /**
   * Actualiza tasa de cambio
   */
  updateExchangeRate(rate) {
    this.exchangeRate = rate;
    // Recalcular precios si es necesario
    this.products.forEach(product => {
      const usdPrice = parseInt(product.price) / this.exchangeRate;
      product.price = Math.round(usdPrice * rate).toString();
      if (product.originalPrice) {
        product.originalPrice = Math.round(usdPrice * rate * 1.15).toString();
      }
    });
  }
}

// Crear instancia global
window.productService = new ProductService();

// Exportar para uso en módulos
window.ProductService = ProductService;