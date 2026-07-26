/**
 * Cargador de productos para integración con siteData
 */
class ProductLoader {
  constructor() {
    this.loaded = false;
  }

  /**
   * Inicializa y carga productos desde JSON
   */
  async init() {
    if (this.loaded) return;

    try {
      // Cargar productos desde el servicio
      await window.productService.loadProducts();
      
      // Integrar con siteData si está disponible
      if (window.siteData) {
        this.integrateWithSiteData();
      }
      
      this.loaded = true;
      console.log('✅ Productos cargados correctamente desde JSON');
      
      // Notificar que los productos están listos
      window.dispatchEvent(new CustomEvent('productsLoaded', {
        detail: { products: window.productService.getAllProducts() }
      }));
      
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
    }
  }

  /**
   * Integra productos del servicio con siteData
   * Actualiza directamente el array sin usar updateSection para evitar re-renders prematuros
   */
  integrateWithSiteData() {
    const products = window.productService.getAllProducts();
    if (!products.length) return;

    // Solo integrar si siteData NO tiene productos propios con imágenes reales
    // (evitar sobreescribir datos del admin o del siteData por defecto)
    const existing = window.siteData.data.products || [];
    const hasRealImages = existing.some(p =>
      p.image && !p.image.includes('placehold.co')
    );

    if (hasRealImages) {
      console.log('📱 siteData ya tiene productos con imágenes reales — productLoader omitido');
      if (window.app) {
        window.app.renderProducts();
        window.app.renderFeaturedProducts();
      }
      return;
    }

    // Solo si no hay datos propios, usar los del JSON
    window.siteData.data.products = products;
    console.log(`📱 Integrados ${products.length} productos desde JSON`);

    if (window.app) {
      window.app.renderProducts();
      window.app.renderFeaturedProducts();
    }
  }

  /**
   * Recarga productos
   */
  async reload() {
    this.loaded = false;
    await this.init();
  }

  /**
   * Obtiene estadísticas de productos
   */
  getStats() {
    const products = window.productService.getAllProducts();
    const brands = [...new Set(products.map(p => p.brand))];
    const avgPrice = products.reduce((sum, p) => sum + parseInt(p.price), 0) / products.length;
    
    return {
      totalProducts: products.length,
      brands: brands.length,
      brandList: brands,
      averagePrice: Math.round(avgPrice),
      priceRange: {
        min: Math.min(...products.map(p => parseInt(p.price))),
        max: Math.max(...products.map(p => parseInt(p.price)))
      }
    };
  }
}

// Crear instancia global
window.productLoader = new ProductLoader();

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.productLoader.init();
});

// Exportar para uso en módulos
window.ProductLoader = ProductLoader;