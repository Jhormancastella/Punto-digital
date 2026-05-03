/**
 * Catálogo de productos con filtros avanzados
 */
class ProductCatalog {
  constructor() {
    this.allProducts = [];
    this.filteredProducts = [];
    this.currentPage = 1;
    this.productsPerPage = 12;
    this.currentView = 'grid';
    this.currentSort = 'relevance';
    this.filters = {
      search: '',
      categories: [],
      brands: [],
      minPrice: null,
      maxPrice: null,
      ratings: [],
      availability: []
    };
    
    this.init();
  }

  async init() {
    await this.loadProducts();
    this.setupEventListeners();
    this.populateFilters();
    this.applyURLParams();   // ← lee ?search= y ?brand= de la URL
    this.renderProducts();
    this.updateResultsCount();
    
    console.log('✅ Catálogo inicializado correctamente');
  }

  async loadProducts() {
    try {
      // Obtener productos de siteData
      if (window.siteData) {
        const data = window.siteData.getData();
        this.allProducts = data.products || [];
      } else {
        // Fallback con productos por defecto
        this.allProducts = this.getDefaultProducts();
      }
      
      this.filteredProducts = [...this.allProducts];
      
    } catch (error) {
      console.error('Error cargando productos:', error);
      this.allProducts = this.getDefaultProducts();
      this.filteredProducts = [...this.allProducts];
    }
  }

  getDefaultProducts() {
    return [
      {
        id: 'default-1',
        name: 'Producto de Ejemplo',
        price: '999000',
        image: 'https://via.placeholder.com/300x300/d4a843/000000?text=Producto',
        category: 'smartphones',
        brand: 'Ejemplo',
        description: 'Producto de ejemplo para el catálogo.',
        rating: 4.5,
        reviews: 10,
        stock: 5
      }
    ];
  }

  setupEventListeners() {
    // Búsqueda
    const searchInputs = document.querySelectorAll('[data-catalog-search]');
    const searchBtns = document.querySelectorAll('[data-catalog-search-btn]');

    searchInputs.forEach((searchInput) => {
      searchInput.addEventListener('input', Helpers.debounce((e) => {
        const value = e.target.value;
        this.filters.search = value.toLowerCase();
        searchInputs.forEach(input => {
          if (input !== e.target) input.value = value;
        });
        this.applyFilters();
      }, 300));
    });

    searchBtns.forEach((searchBtn) => {
      searchBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    });

    // Filtros de precio
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    
    if (minPrice) {
      minPrice.addEventListener('change', (e) => {
        this.filters.minPrice = e.target.value ? parseInt(e.target.value) : null;
        this.applyFilters();
      });
    }
    
    if (maxPrice) {
      maxPrice.addEventListener('change', (e) => {
        this.filters.maxPrice = e.target.value ? parseInt(e.target.value) : null;
        this.applyFilters();
      });
    }

    // Ordenamiento
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.sortProducts();
        this.renderProducts();
      });
    }

    // Vista
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    
    if (gridViewBtn) {
      gridViewBtn.addEventListener('click', () => {
        this.setView('grid');
      });
    }
    
    if (listViewBtn) {
      listViewBtn.addEventListener('click', () => {
        this.setView('list');
      });
    }

    // Limpiar filtros
    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
      clearFilters.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }
  }

  populateFilters() {
    this.populateCategoryFilters();
    this.populateBrandFilters();
    this.populateRatingFilters();
    this.populateAvailabilityFilters();
  }

  populateCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;

    const categories = [...new Set(this.allProducts.map(p => p.category))];
    const categoryNames = {
      'smartphones': 'Smartphones',
      'auriculares': 'Auriculares',
      'smartwatches': 'Smartwatches',
      'accesorios': 'Accesorios'
    };

    container.innerHTML = '';
    
    categories.forEach(category => {
      const count = this.allProducts.filter(p => p.category === category).length;
      const displayName = categoryNames[category] || category;
      const safeCategory = Helpers.escapeAttr(category);
      const safeDisplayName = Helpers.escapeHtml(displayName);
      
      const filterOption = document.createElement('div');
      filterOption.className = 'filter-option';
      filterOption.innerHTML = `
        <input type="checkbox" id="cat-${safeCategory}" value="${safeCategory}">
        <label for="cat-${safeCategory}">
          <span>${safeDisplayName}</span>
          <span class="filter-count">${count}</span>
        </label>
      `;
      
      const checkbox = filterOption.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filters.categories.push(category);
        } else {
          this.filters.categories = this.filters.categories.filter(c => c !== category);
        }
        this.applyFilters();
      });
      
      container.appendChild(filterOption);
    });
  }

  populateBrandFilters() {
    const container = document.getElementById('brandFilters');
    if (!container) return;

    const brands = [...new Set(this.allProducts.map(p => p.brand))].filter(Boolean);
    
    container.innerHTML = '';
    
    brands.forEach(brand => {
      const count = this.allProducts.filter(p => p.brand === brand).length;
      const safeBrand = Helpers.escapeAttr(brand);
      const safeBrandText = Helpers.escapeHtml(brand);
      
      const filterOption = document.createElement('div');
      filterOption.className = 'filter-option';
      filterOption.innerHTML = `
        <input type="checkbox" id="brand-${safeBrand}" value="${safeBrand}">
        <label for="brand-${safeBrand}">
          <span>${safeBrandText}</span>
          <span class="filter-count">${count}</span>
        </label>
      `;
      
      const checkbox = filterOption.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filters.brands.push(brand);
        } else {
          this.filters.brands = this.filters.brands.filter(b => b !== brand);
        }
        this.applyFilters();
      });
      
      container.appendChild(filterOption);
    });
  }

  populateRatingFilters() {
    const ratingCheckboxes = document.querySelectorAll('#ratingFilters input[type="checkbox"]');
    
    ratingCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const rating = parseInt(e.target.value);
        if (e.target.checked) {
          this.filters.ratings.push(rating);
        } else {
          this.filters.ratings = this.filters.ratings.filter(r => r !== rating);
        }
        this.applyFilters();
      });
    });
    
    this.updateRatingCounts();
  }

  populateAvailabilityFilters() {
    const inStockCheckbox = document.getElementById('inStock');
    const onSaleCheckbox = document.getElementById('onSale');
    
    if (inStockCheckbox) {
      inStockCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filters.availability.push('inStock');
        } else {
          this.filters.availability = this.filters.availability.filter(a => a !== 'inStock');
        }
        this.applyFilters();
      });
    }
    
    if (onSaleCheckbox) {
      onSaleCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.filters.availability.push('onSale');
        } else {
          this.filters.availability = this.filters.availability.filter(a => a !== 'onSale');
        }
        this.applyFilters();
      });
    }
    
    this.updateAvailabilityCounts();
  }

  applyFilters() {
    this.filteredProducts = this.allProducts.filter(product => {
      // Filtro de búsqueda
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.brand?.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Filtro de categorías
      if (this.filters.categories.length > 0) {
        if (!this.filters.categories.includes(product.category)) return false;
      }

      // Filtro de marcas
      if (this.filters.brands.length > 0) {
        if (!this.filters.brands.includes(product.brand)) return false;
      }

      // Filtro de precio
      const price = typeof product.price === 'string' ? parseInt(product.price) : product.price;
      if (this.filters.minPrice !== null && price < this.filters.minPrice) return false;
      if (this.filters.maxPrice !== null && price > this.filters.maxPrice) return false;

      // Filtro de calificación
      if (this.filters.ratings.length > 0) {
        const productRating = Math.floor(product.rating || 0);
        const matchesRating = this.filters.ratings.some(rating => {
          if (rating === 5) return productRating === 5;
          if (rating === 4) return productRating >= 4;
          if (rating === 3) return productRating >= 3;
          return false;
        });
        if (!matchesRating) return false;
      }

      // Filtro de disponibilidad
      if (this.filters.availability.length > 0) {
        const hasStock = (product.stock || 0) > 0;
        const isOnSale = product.originalPrice && product.originalPrice > product.price;
        
        const matchesAvailability = this.filters.availability.some(filter => {
          if (filter === 'inStock') return hasStock;
          if (filter === 'onSale') return isOnSale;
          return false;
        });
        
        if (!matchesAvailability) return false;
      }

      return true;
    });

    this.currentPage = 1;
    this.sortProducts();
    this.renderProducts();
    this.updateResultsCount();
    this.updateFilterCounts();
  }

  sortProducts() {
    this.filteredProducts.sort((a, b) => {
      const priceA = typeof a.price === 'string' ? parseInt(a.price) : a.price;
      const priceB = typeof b.price === 'string' ? parseInt(b.price) : b.price;
      
      switch (this.currentSort) {
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return (b.id || '').localeCompare(a.id || '');
        default: // relevance
          return 0;
      }
    });
  }

  renderProducts() {
    const container = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    
    if (!container) return;

    if (this.filteredProducts.length === 0) {
      container.style.display = 'none';
      if (noResults) noResults.style.display = 'block';
      return;
    }

    container.style.display = 'grid';
    if (noResults) noResults.style.display = 'none';

    // Paginación
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

    container.innerHTML = '';
    
    productsToShow.forEach(product => {
      const productCard = this.createProductCard(product);
      container.appendChild(productCard);
    });

    this.renderPagination();
  }

  createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card catalog-card';
    card.setAttribute('data-product-id', product.id);
    card.setAttribute('role', 'article');
    card.setAttribute('aria-label', product.name);

    const price = typeof product.price === 'string' ? parseInt(product.price) : product.price;
    const discount = product.originalPrice
      ? Math.round(((product.originalPrice - price) / product.originalPrice) * 100)
      : null;
    const safeName = Helpers.escapeHtml(product.name);
    const safeNameAttr = Helpers.escapeAttr(product.name);
    const safeImage = Helpers.sanitizeUrl(product.image, 'https://placehold.co/300x220?text=?');
    const safeBadge = Helpers.escapeHtml(product.badge || '');

    card.innerHTML = `
      <div class="catalog-card-img">
        <img src="${safeImage}" alt="${safeNameAttr}" loading="lazy"
             onerror="this.src='https://placehold.co/300x220?text=?'">
        ${product.badge ? `<span class="product-badge">${safeBadge}</span>` : ''}
        ${discount ? `<span class="product-discount">-${discount}%</span>` : ''}
      </div>
      <div class="catalog-card-body">
        <p class="catalog-card-name">${safeName}</p>
        <p class="catalog-card-price">${this.formatPrice(price)}</p>
        <div class="catalog-card-actions">
          <button class="btn-view-details" data-product-id="${product.id}"
                  aria-label="Ver detalles de ${safeNameAttr}">
            <i class="fas fa-eye"></i> Ver más
          </button>
          <button class="btn-add-cart" data-product-id="${product.id}"
                  aria-label="Agregar ${safeNameAttr} al carrito">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
      </div>
    `;

    card.querySelector('.btn-view-details').addEventListener('click', () => {
      this.openProductModal(product.id);
    });
    card.querySelector('.btn-add-cart').addEventListener('click', (e) => {
      e.stopPropagation();
      this.addToCart(product.id);
    });
    card.addEventListener('click', (e) => {
      if (!e.target.closest('button')) this.openProductModal(product.id);
    });

    const cardImg = card.querySelector('.catalog-card-img img');
    if (cardImg && window.imageProcessor?.processImageForCatalog) {
      const originalSrc = cardImg.getAttribute('src');
      window.imageProcessor.processImageForCatalog(originalSrc, { outputSize: 500 })
        .then((processedSrc) => {
          if (processedSrc && cardImg.getAttribute('src') === originalSrc) {
            cardImg.src = processedSrc;
          }
        })
        .catch(() => {});
    }

    return card;
  }

  generateStars(rating) {
    return Formatters.generateStars(rating);
  }

  getStockStatus(stock) {
    if (!stock || stock === 0) {
      return '<span class="stock-out">Agotado</span>';
    } else if (stock <= 5) {
      return `<span class="stock-low">Quedan ${stock}</span>`;
    } else {
      return '<span class="stock-available">En stock</span>';
    }
  }

  renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
    
    if (totalPages <= 1) {
      container.style.display = 'none';
      return;
    }
    
    container.style.display = 'flex';
    container.innerHTML = '';

    // Botón anterior
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = this.currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderProducts();
      }
    });
    container.appendChild(prevBtn);

    // Números de página
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);

    if (startPage > 1) {
      const firstBtn = document.createElement('button');
      firstBtn.textContent = '1';
      firstBtn.addEventListener('click', () => {
        this.currentPage = 1;
        this.renderProducts();
      });
      container.appendChild(firstBtn);
      
      if (startPage > 2) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.padding = '8px';
        ellipsis.style.color = 'var(--text-gray)';
        container.appendChild(ellipsis);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.classList.toggle('active', i === this.currentPage);
      pageBtn.addEventListener('click', () => {
        this.currentPage = i;
        this.renderProducts();
      });
      container.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.style.padding = '8px';
        ellipsis.style.color = 'var(--text-gray)';
        container.appendChild(ellipsis);
      }
      
      const lastBtn = document.createElement('button');
      lastBtn.textContent = totalPages;
      lastBtn.addEventListener('click', () => {
        this.currentPage = totalPages;
        this.renderProducts();
      });
      container.appendChild(lastBtn);
    }

    // Botón siguiente
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = this.currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderProducts();
      }
    });
    container.appendChild(nextBtn);
  }

  setView(view) {
    this.currentView = view;
    const container = document.getElementById('productsGrid');
    const gridBtn = document.getElementById('gridViewBtn');
    const listBtn = document.getElementById('listViewBtn');
    
    if (view === 'list') {
      container.classList.add('list-view');
      gridBtn.classList.remove('active');
      listBtn.classList.add('active');
    } else {
      container.classList.remove('list-view');
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
    }
  }

  updateResultsCount() {
    const container = document.getElementById('resultsCount');
    if (!container) return;

    const total = this.filteredProducts.length;
    const startIndex = (this.currentPage - 1) * this.productsPerPage + 1;
    const endIndex = Math.min(startIndex + this.productsPerPage - 1, total);

    if (total === 0) {
      container.textContent = 'No se encontraron productos';
    } else {
      container.textContent = `Mostrando ${startIndex}-${endIndex} de ${total} productos`;
    }
  }

  updateFilterCounts() {
    this.updateRatingCounts();
    this.updateAvailabilityCounts();
  }

  updateRatingCounts() {
    const ratings = [5, 4, 3];
    ratings.forEach(rating => {
      const countElement = document.getElementById(`rating${rating}Count`);
      if (countElement) {
        const count = this.allProducts.filter(p => {
          const productRating = Math.floor(p.rating || 0);
          if (rating === 5) return productRating === 5;
          if (rating === 4) return productRating >= 4;
          if (rating === 3) return productRating >= 3;
          return false;
        }).length;
        countElement.textContent = count;
      }
    });
  }

  updateAvailabilityCounts() {
    const inStockCount = this.allProducts.filter(p => (p.stock || 0) > 0).length;
    const onSaleCount = this.allProducts.filter(p => p.originalPrice && p.originalPrice > p.price).length;
    
    const inStockElement = document.getElementById('inStockCount');
    const onSaleElement = document.getElementById('onSaleCount');
    
    if (inStockElement) inStockElement.textContent = inStockCount;
    if (onSaleElement) onSaleElement.textContent = onSaleCount;
  }

  clearAllFilters() {
    // Limpiar filtros
    this.filters = {
      search: '',
      categories: [],
      brands: [],
      minPrice: null,
      maxPrice: null,
      ratings: [],
      availability: []
    };

    // Limpiar inputs
    const searchInputs = document.querySelectorAll('[data-catalog-search]');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    
    searchInputs.forEach(input => { input.value = ''; });
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';

    // Limpiar checkboxes
    const checkboxes = document.querySelectorAll('.filters-sidebar input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    // Aplicar filtros vacíos
    this.applyFilters();
  }

  openProductModal(productId) {
    // Buscar el objeto completo en los datos del catálogo (más frescos que siteData)
    const product = this.allProducts.find(p => p.id === productId);
    if (!product) return;

    if (window.productModal) {
      // Pasar el objeto directamente para garantizar que la imagen sea la correcta
      window.productModal.openProductObject(product);
    }

    this.trackEvent('product_viewed_from_catalog', {
      product_id: productId,
      page: this.currentPage,
      filters_applied: Object.keys(this.filters).some(key =>
        Array.isArray(this.filters[key]) ? this.filters[key].length > 0 : this.filters[key]
      )
    });
  }

  addToCart(productId) {
    const product = this.allProducts.find(p => p.id === productId);
    if (!product) return;

    if (window.cartService) {
      window.cartService.add(product);
    } else {
      notificationService.success(`${product.name} agregado al carrito`);
    }
    
    this.trackEvent('add_to_cart_from_catalog', {
      product_id: productId,
      product_name: product.name,
      product_price: product.price
    });
  }

  updateCartCount() {
    // El cartService maneja el badge automáticamente
  }

  // Utilidades
  formatPrice(price) {
    return Formatters.formatPrice(price);
  }

  showNotification(message, type = 'info') {
    return notificationService.show(message, type);
  }

  trackEvent(eventName, data = {}) {
    if (window.seoManager) {
      window.seoManager.trackEvent(eventName, data);
    }
  }

  // API pública (métodos realmente necesarios)
  search(query) {
    document.querySelectorAll('[data-catalog-search]').forEach(input => { input.value = query; });
    this.filters.search = query.toLowerCase();
    this.applyFilters();
  }

  filterByCategory(category) {
    const checkbox = document.getElementById(`cat-${category}`);
    if (checkbox) {
      checkbox.checked = true;
      this.filters.categories = [category];
      this.applyFilters();
    }
  }

  /**
   * Lee parámetros de la URL y aplica filtros automáticamente.
   * Soporta: ?search=iPhone&brand=Apple
   */
  applyURLParams() {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    const brand  = params.get('brand');

    if (!search && !brand) return;

    // Aplicar búsqueda por nombre
    if (search) {
      this.filters.search = search.toLowerCase();
      document.querySelectorAll('[data-catalog-search]').forEach(input => { input.value = search; });
    }

    // Aplicar filtro de marca si viene y existe en los productos
    if (brand) {
      const brandExists = this.allProducts.some(
        p => p.brand?.toLowerCase() === brand.toLowerCase()
      );
      if (brandExists) {
        this.filters.brands = [brand];
        // Marcar el checkbox correspondiente si ya fue renderizado
        const checkbox = document.getElementById(`brand-${brand}`);
        if (checkbox) checkbox.checked = true;
      }
    }

    // Aplicar filtros
    this.applyFilters();

    // Mostrar chip de filtro activo
    this.renderActiveFilterChip(search, brand);

    // Scroll suave al grid de resultados
    setTimeout(() => {
      document.getElementById('productsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }

  /**
   * Muestra un chip visible indicando el filtro activo desde index.html
   */
  renderActiveFilterChip(search, brand) {
    const header = document.querySelector('.catalog-header');
    if (!header) return;

    // Evitar duplicados
    document.getElementById('active-filter-chip')?.remove();

    const label = Helpers.escapeHtml(search || brand);
    const chip = document.createElement('div');
    chip.id = 'active-filter-chip';
    chip.style.cssText = `
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px;
      background: rgba(212,168,67,0.12);
      border: 1px solid rgba(212,168,67,0.35);
      border-radius: 50px;
      font-size: 13px; font-weight: 600;
      color: var(--gold-primary);
      margin-bottom: 12px;
    `;
    chip.innerHTML = `
      <i class="fas fa-filter" style="font-size:11px"></i>
      Filtrando por: <strong>${label}</strong>
      <button onclick="window.catalog.clearAllFilters();this.parentElement.remove()"
              style="background:none;border:none;color:var(--gold-primary);cursor:pointer;
                     font-size:14px;line-height:1;padding:0;margin-left:4px"
              aria-label="Limpiar filtro">×</button>
    `;

    header.insertAdjacentElement('beforebegin', chip);
  }
}

// Inicializar catálogo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.catalog = new ProductCatalog();
});

// Exportar para uso global
window.ProductCatalog = ProductCatalog;
