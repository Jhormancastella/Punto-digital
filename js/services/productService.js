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
    return jsonProducts.map(product => ({
      id: `${product.marca.toLowerCase()}-${product.modelo.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${product.marca} ${product.modelo}`,
      price: Math.round(product.precio * this.exchangeRate).toString(),
      originalPrice: product.precio > 800 ? Math.round(product.precio * this.exchangeRate * 1.15).toString() : null,
      image: product.imagen_url,
      category: 'smartphones',
      brand: product.marca,
      featured: false,
      badge: this.getBadge(product),
      description: this.getDescription(product),
      specifications: {
        pantalla: product.especificaciones.pantalla,
        almacenamiento: product.especificaciones.almacenamiento,
        ram: product.especificaciones.ram,
        bateria: product.especificaciones.bateria,
        procesador: this.getProcessor(product.marca),
        camara: this.getCamera(product.marca)
      },
      stock: Math.floor(Math.random() * 20) + 5,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      reviews: Math.floor(Math.random() * 200) + 20
    }));
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
    return [
      {
        id: 'fallback-product',
        name: 'Producto de Ejemplo',
        price: '2999000',
        image: 'https://placehold.co/300x400?text=Producto',
        category: 'smartphones',
        brand: 'Ejemplo',
        description: 'Producto de ejemplo para mostrar.',
        specifications: {
          pantalla: '6.1 pulgadas',
          almacenamiento: '128 GB',
          ram: '8 GB',
          bateria: '4000 mAh'
        },
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