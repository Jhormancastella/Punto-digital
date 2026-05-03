/**
 * Servicio de autenticación seguro con Supabase
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.loginAttempts = 0;
    this.lockoutTime = null;
    this.maxAttempts = 3;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutos
    this.sessionTimeout = 60 * 60 * 1000; // 1 hora
    
    this.init();
  }

  async init() {
    // Escuchar cambios de autenticación de Supabase
    window.addEventListener('authStateChanged', (e) => {
      this.handleAuthStateChange(e.detail);
    });

    // Verificar sesión existente
    await this.checkExistingSession();
    
    // Configurar timeout de sesión
    this.setupSessionTimeout();
  }

  async handleAuthStateChange({ event, session, user }) {
    this.currentUser = user;
    
    switch (event) {
      case 'SIGNED_IN':
        this.onSignIn(user);
        break;
      case 'SIGNED_OUT':
        this.onSignOut();
        break;
      case 'TOKEN_REFRESHED':
        this.onTokenRefresh(session);
        break;
    }
  }

  async checkExistingSession() {
    try {
      if (window.supabase && window.supabase.isAuthenticated()) {
        this.currentUser = window.supabase.getCurrentUser();
        this.onSignIn(this.currentUser);
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
    }
  }

  async signIn(email, password) {
    try {
      // Verificar lockout
      if (this.isLockedOut()) {
        const remainingTime = Math.ceil((this.lockoutTime - Date.now()) / 1000 / 60);
        throw new Error(`Cuenta bloqueada. Intenta en ${remainingTime} minutos.`);
      }

      // Validar entrada
      this.validateCredentials(email, password);

      // Intentar autenticación con Supabase
      const { user, session } = await window.supabase.signIn(email, password);
      
      // Reset intentos en login exitoso
      this.resetLoginAttempts();
      
      return { user, session };

    } catch (error) {
      this.handleLoginError(error);
      throw error;
    }
  }

  async signUp(email, password, userData = {}) {
    try {
      this.validateCredentials(email, password);
      
      const { user, session } = await window.supabase.signUp(email, password, {
        role: 'user',
        ...userData
      });
      
      return { user, session };
      
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await window.supabase.signOut();
      this.currentUser = null;
      this.clearSessionData();
      
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Email inválido');
      }
      
      await window.supabase.resetPassword(email);
      
    } catch (error) {
      console.error('Error reseteando contraseña:', error);
      throw error;
    }
  }

  validateCredentials(email, password) {
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }
    
    if (!this.isValidEmail(email)) {
      throw new Error('Email inválido');
    }
    
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  handleLoginError(error) {
    this.loginAttempts++;
    
    if (this.loginAttempts >= this.maxAttempts) {
      this.lockoutTime = Date.now() + this.lockoutDuration;
      localStorage.setItem('lockoutTime', this.lockoutTime.toString());
    }
    
    localStorage.setItem('loginAttempts', this.loginAttempts.toString());
  }

  resetLoginAttempts() {
    this.loginAttempts = 0;
    this.lockoutTime = null;
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lockoutTime');
  }

  isLockedOut() {
    const savedLockoutTime = localStorage.getItem('lockoutTime');
    if (savedLockoutTime) {
      this.lockoutTime = parseInt(savedLockoutTime);
      return Date.now() < this.lockoutTime;
    }
    return false;
  }

  onSignIn(user) {
    this.currentUser = user;
    this.resetLoginAttempts();
    
    // Configurar timeout de sesión
    this.setupSessionTimeout();
    
    // Emitir evento
    window.dispatchEvent(new CustomEvent('userSignedIn', { 
      detail: { user } 
    }));
    
    // Tracking
    if (window.seoManager) {
      window.seoManager.trackEvent('login', {
        method: 'email',
        user_id: user.id
      });
    }
  }

  onSignOut() {
    this.currentUser = null;
    this.clearSessionData();
    
    // Emitir evento
    window.dispatchEvent(new CustomEvent('userSignedOut'));
    
    // Tracking
    if (window.seoManager) {
      window.seoManager.trackEvent('logout');
    }
  }

  onTokenRefresh(session) {
    // Extender timeout de sesión
    this.setupSessionTimeout();
  }

  setupSessionTimeout() {
    // Limpiar timeout anterior
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
    }
    
    // Configurar nuevo timeout
    this.sessionTimeoutId = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout);
  }

  async handleSessionTimeout() {
    try {
      await this.signOut();
      this.showSessionExpiredMessage();
    } catch (error) {
      console.error('Error en timeout de sesión:', error);
    }
  }

  showSessionExpiredMessage() {
    // Mostrar notificación de sesión expirada
    if (window.notificationManager) {
      window.notificationManager.show({
        type: 'warning',
        title: 'Sesión Expirada',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        duration: 5000
      });
    }
  }

  clearSessionData() {
    // Limpiar datos de sesión
    sessionStorage.clear();
    
    // Limpiar timeout
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }

  // Getters
  isAuthenticated() {
    return !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAdmin() {
    return this.currentUser?.user_metadata?.role === 'admin' || 
           this.currentUser?.app_metadata?.role === 'admin';
  }

  getUserRole() {
    return this.currentUser?.user_metadata?.role || 
           this.currentUser?.app_metadata?.role || 'user';
  }

  hasPermission(permission) {
    const userRole = this.getUserRole();
    const permissions = {
      admin: ['read', 'write', 'delete', 'manage'],
      editor: ['read', 'write'],
      user: ['read']
    };
    
    return permissions[userRole]?.includes(permission) || false;
  }
}

// Instancia global
window.authService = new AuthService();