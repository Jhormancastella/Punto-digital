/**
 * Gestor de SEO avanzado con Schema.org y meta tags dinámicos
 */
class SEOManager {
  constructor() {
    this.defaultMeta = {
      title: 'Punto Digital | Tecnología y Telefonía',
      description: 'Tienda especializada en tecnología y telefonía. Los mejores smartphones, gadgets y accesorios de las mejores marcas con garantía y envío a todo Colombia.',
      keywords: 'smartphones, tecnología, telefonía, gadgets, accesorios, iPhone, Samsung, Colombia',
      author: 'Punto Digital',
      robots: 'index, follow',
      canonical: window.location.origin,
      ogType: 'website',
      ogImage: '/img/logo.png',
      twitterCard: 'summary_large_image'
    };
    
    this.init();
  }

  init() {
    this.setupBasicMeta();
    this.setupStructuredData();
    this.setupAnalytics();
    this.setupSitemap();
  }

  /**
   * Configura meta tags básicos
   */
  setupBasicMeta() {
    this.setTitle(this.defaultMeta.title);
    this.setDescription(this.defaultMeta.description);
    this.setKeywords(this.defaultMeta.keywords);
    this.setCanonical(this.defaultMeta.canonical);
    this.setRobots(this.defaultMeta.robots);
    this.setupOpenGraph();
    this.setupTwitterCard();
  }

  /**
   * Actualiza el título de la página
   */
  setTitle(title) {
    document.title = title;
    this.updateMetaTag('property', 'og:title', title);
    this.updateMetaTag('name', 'twitter:title', title);
  }

  /**
   * Actualiza la descripción
   */
  setDescription(description) {
    this.updateMetaTag('name', 'description', description);
    this.updateMetaTag('property', 'og:description', description);
    this.updateMetaTag('name', 'twitter:description', description);
  }

  /**
   * Actualiza keywords
   */
  setKeywords(keywords) {
    this.updateMetaTag('name', 'keywords', keywords);
  }

  /**
   * Configura URL canónica
   */
  setCanonical(url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  /**
   * Configura robots meta
   */
  setRobots(robots) {
    this.updateMetaTag('name', 'robots', robots);
  }

  /**
   * Configura Open Graph
   */
  setupOpenGraph() {
    const ogTags = {
      'og:type': this.defaultMeta.ogType,
      'og:url': window.location.href,
      'og:title': this.defaultMeta.title,
      'og:description': this.defaultMeta.description,
      'og:image': this.getFullUrl(this.defaultMeta.ogImage),
      'og:site_name': window.env.get('site.name'),
      'og:locale': 'es_CO'
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      this.updateMetaTag('property', property, content);
    });
  }

  /**
   * Configura Twitter Card
   */
  setupTwitterCard() {
    const twitterTags = {
      'twitter:card': this.defaultMeta.twitterCard,
      'twitter:url': window.location.href,
      'twitter:title': this.defaultMeta.title,
      'twitter:description': this.defaultMeta.description,
      'twitter:image': this.getFullUrl(this.defaultMeta.ogImage)
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      this.updateMetaTag('name', name, content);
    });
  }

  /**
   * Configura datos estructurados Schema.org
   */
  setupStructuredData() {
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": window.env.get('site.name'),
      "url": window.env.get('site.url'),
      "logo": this.getFullUrl('/img/logo.png'),
      "description": this.defaultMeta.description,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+57-300-123-4567",
        "contactType": "customer service",
        "availableLanguage": "Spanish"
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "CO",
        "addressLocality": "Bogotá"
      },
      "sameAs": [
        "https://facebook.com/puntodigital",
        "https://instagram.com/puntodigital",
        "https://twitter.com/puntodigital"
      ]
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": window.env.get('site.name'),
      "url": window.env.get('site.url'),
      "description": this.defaultMeta.description,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${window.env.get('site.url')}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };

    const storeSchema = {
      "@context": "https://schema.org",
      "@type": "Store",
      "name": window.env.get('site.name'),
      "description": this.defaultMeta.description,
      "url": window.env.get('site.url'),
      "telephone": "+57-300-123-4567",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "CO",
        "addressLocality": "Bogotá"
      },
      "openingHours": "Mo-Fr 09:00-18:00, Sa 09:00-16:00",
      "paymentAccepted": "Cash, Credit Card, Debit Card, Bank Transfer",
      "currenciesAccepted": "COP"
    };

    this.addStructuredData('organization', organizationSchema);
    this.addStructuredData('website', websiteSchema);
    this.addStructuredData('store', storeSchema);
  }

  /**
   * Añade datos estructurados al head
   */
  addStructuredData(id, schema) {
    let script = document.getElementById(`schema-${id}`);
    if (!script) {
      script = document.createElement('script');
      script.id = `schema-${id}`;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }

  /**
   * Configura Analytics
   */
  setupAnalytics() {
    const gtmId = window.env.get('analytics.googleTagManagerId');
    const gaId = window.env.get('analytics.googleAnalyticsId');
    const fbPixelId = window.env.get('analytics.facebookPixelId');

    if (gtmId) {
      this.setupGoogleTagManager(gtmId);
    }

    if (gaId) {
      this.setupGoogleAnalytics(gaId);
    }

    if (fbPixelId) {
      this.setupFacebookPixel(fbPixelId);
    }
  }

  /**
   * Configura Google Tag Manager
   */
  setupGoogleTagManager(gtmId) {
    // GTM Script
    const gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    document.head.appendChild(gtmScript);

    // GTM Inline Script
    const gtmInline = document.createElement('script');
    gtmInline.textContent = `
      window.dataLayer = window.dataLayer || [];
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(gtmInline);

    // GTM NoScript
    const gtmNoScript = document.createElement('noscript');
    gtmNoScript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(gtmNoScript, document.body.firstChild);
  }

  /**
   * Configura Google Analytics
   */
  setupGoogleAnalytics(gaId) {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(gaScript);

    const gaInline = document.createElement('script');
    gaInline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', {
        page_title: document.title,
        page_location: window.location.href
      });
    `;
    document.head.appendChild(gaInline);
  }

  /**
   * Configura Facebook Pixel
   */
  setupFacebookPixel(fbPixelId) {
    const fbScript = document.createElement('script');
    fbScript.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${fbPixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(fbScript);

    const fbNoScript = document.createElement('noscript');
    fbNoScript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1"/>`;
    document.body.appendChild(fbNoScript);
  }

  /**
   * Genera sitemap dinámico
   */
  setupSitemap() {
    const sitemap = {
      urls: [
        {
          loc: window.env.get('site.url'),
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: '1.0'
        },
        {
          loc: `${window.env.get('site.url')}/catalogo.html`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly',
          priority: '0.8'
        },
        {
          loc: `${window.env.get('site.url')}/#contacto`,
          lastmod: new Date().toISOString(),
          changefreq: 'monthly',
          priority: '0.6'
        }
      ]
    };

    // Guardar sitemap en localStorage para generar XML
    localStorage.setItem('sitemap', JSON.stringify(sitemap));
  }

  /**
   * Actualiza meta tag
   */
  updateMetaTag(attribute, value, content) {
    let meta = document.querySelector(`meta[${attribute}="${value}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, value);
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  /**
   * Obtiene URL completa
   */
  getFullUrl(path) {
    if (path.startsWith('http')) return path;
    return `${window.env.get('site.url')}${path}`;
  }

  /**
   * Tracking de eventos
   */
  trackEvent(eventName, parameters = {}) {
    // Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, parameters);
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', eventName, parameters);
    }

    // GTM DataLayer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...parameters
      });
    }
  }

  /**
   * Actualiza SEO para página específica
   */
  updatePageSEO(pageData) {
    this.setTitle(pageData.title || this.defaultMeta.title);
    this.setDescription(pageData.description || this.defaultMeta.description);
    this.setCanonical(pageData.canonical || window.location.href);
    
    if (pageData.keywords) {
      this.setKeywords(pageData.keywords);
    }

    if (pageData.schema) {
      this.addStructuredData('page', pageData.schema);
    }
  }
}

// Instancia global
window.seoManager = new SEOManager();
