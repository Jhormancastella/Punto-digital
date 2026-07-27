/**
 * Cargador de productos para integración con siteData
 */
class ProductLoader {
  constructor() {
    this.loaded = false;
  }

  /**
   * Inicializa productos.
   * Firestore es la fuente de verdad. El JSON local solo se usa
   * como fallback si Firestore no devuelve ningún producto.
   */
  async init() {
    if (this.loaded) return;

    try {
      // Esperar a que siteData termine de cargar desde Firestore
      await this._waitForSiteData();

      const firestoreProducts = window.siteData.getSection('products') || [];

      if (firestoreProducts.length > 0) {
        // Hay productos en Firestore → usarlos directamente
        console.log(`✅ ${firestoreProducts.length} productos cargados desde Firestore`);
      } else {
        // Sin productos en Firestore → cargar desde JSON como fallback
        console.log('ℹ️ Sin productos en Firestore, cargando desde JSON (fallback)');
        await window.productService.loadProducts();
        const jsonProducts = window.productService.getAllProducts();
        if (jsonProducts.length) {
          // Guardar en Firestore para que queden persistidos
          await window.siteData.updateSection('products', jsonProducts);
          console.log(`📦 ${jsonProducts.length} productos del JSON migrados a Firestore`);
        }
      }

      this.loaded = true;

      window.dispatchEvent(new CustomEvent('productsLoaded', {
        detail: { products: window.siteData.getSection('products') }
      }));

      if (window.app) {
        window.app.renderProducts();
        window.app.renderFeaturedProducts();
      }

    } catch (error) {
      console.error('❌ Error cargando productos:', error);
    }
  }

  /**
   * Espera a que siteData haya terminado de cargar desde Firestore.
   */
  _waitForSiteData() {
    return new Promise(resolve => {
      // Si ya cargó, resolver inmediatamente
      if (window.siteData?.data?.products !== undefined &&
          !window.siteData._loadingFromFirestore) {
        // Dar un tick extra por si siteDataReady aún no disparó
        setTimeout(resolve, 50);
        return;
      }
      window.addEventListener('siteDataReady', () => resolve(), { once: true });
      // Timeout de seguridad: 5 segundos
      setTimeout(resolve, 5000);
    });
  }

  /**
   * Recarga productos desde Firestore
   */
  async reload() {
    this.loaded = false;
    await this.init();
  }

  /**
   * Obtiene estadísticas de productos desde Firestore
   */
  getStats() {
    const products = window.siteData.getSection('products') || [];
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const prices = products.map(p => parseInt(p.price)).filter(n => !isNaN(n));
    const avgPrice = prices.length ? prices.reduce((s, n) => s + n, 0) / prices.length : 0;

    return {
      totalProducts: products.length,
      brands: brands.length,
      brandList: brands,
      averagePrice: Math.round(avgPrice),
      priceRange: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0
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