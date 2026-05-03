/**
 * Configuración de entorno y variables
 */
class Environment {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    // En producción, estas variables vendrían del servidor
    // Por ahora usamos valores por defecto seguros
    return {
      supabase: {
        url: window.ENV?.SUPABASE_URL || '',
        anonKey: window.ENV?.SUPABASE_ANON_KEY || '',
        serviceRoleKey: window.ENV?.SUPABASE_SERVICE_ROLE_KEY || ''
      },
      site: {
        url: window.ENV?.SITE_URL || window.location.origin,
        name: window.ENV?.SITE_NAME || 'Punto Digital',
        adminEmail: window.ENV?.ADMIN_EMAIL || 'admin@puntodigital.co'
      },
      analytics: {
        googleAnalyticsId: window.ENV?.GOOGLE_ANALYTICS_ID || '',
        googleTagManagerId: window.ENV?.GOOGLE_TAG_MANAGER_ID || '',
        facebookPixelId: window.ENV?.FACEBOOK_PIXEL_ID || ''
      },
      development: {
        nodeEnv: window.ENV?.NODE_ENV || 'development',
        debug: window.ENV?.DEBUG === 'true' || false
      }
    };
  }

  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  isDevelopment() {
    return this.get('development.nodeEnv') === 'development';
  }

  isProduction() {
    return this.get('development.nodeEnv') === 'production';
  }

  isDebug() {
    return this.get('development.debug');
  }
}

// Instancia global
window.env = new Environment();