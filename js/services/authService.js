/**
 * Servicio de autenticación — Firebase Auth
 */
class AuthService {
  constructor() {
    this.currentUser   = null;
    this.loginAttempts = parseInt(localStorage.getItem('loginAttempts') || '0');
    this.lockoutTime   = parseInt(localStorage.getItem('lockoutTime')   || '0');
    this.maxAttempts   = 3;
    this.lockoutDuration = 15 * 60 * 1000; // 15 min

    // Escuchar cambios de sesión de Firebase
    window.addEventListener('firebaseAuthChanged', (e) => {
      const { user } = e.detail;
      this.currentUser = user;
      if (user) {
        this._onSignIn(user);
      } else {
        this._onSignOut();
      }
    });
  }

  // ── Sign In ───────────────────────────────────────────────────

  async signIn(email, password) {
    // Esperar a que Firebase termine de inicializar
    if (window.firebaseClient?._readyPromise) {
      await window.firebaseClient._readyPromise;
    }

    if (this.isLockedOut()) {
      const mins = Math.ceil((this.lockoutTime - Date.now()) / 60000);
      throw new Error(`Demasiados intentos. Espera ${mins} minuto${mins !== 1 ? 's' : ''}.`);
    }

    if (!email || !password) throw new Error('Correo y contraseña son requeridos');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Correo inválido');

    try {
      const user = await window.firebaseClient.signIn(email, password);
      this._resetAttempts();
      return user;
    } catch (err) {
      this._handleLoginError(err);
      throw this._friendlyError(err);
    }
  }

  // ── Sign Out ──────────────────────────────────────────────────

  async signOut() {
    try {
      await window.firebaseClient.signOut();
      sessionStorage.removeItem('adminAuthenticated');
    } catch (err) {
      console.error('Error cerrando sesión:', err);
      throw err;
    }
  }

  // ── Password Reset ────────────────────────────────────────────

  async sendPasswordReset(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Correo inválido');
    await window.firebaseClient.sendPasswordReset(email);
  }

  // ── Helpers internos ──────────────────────────────────────────

  _onSignIn(user) {
    sessionStorage.setItem('adminAuthenticated', 'true');
    window.dispatchEvent(new CustomEvent('userSignedIn', { detail: { user } }));
  }

  _onSignOut() {
    sessionStorage.removeItem('adminAuthenticated');
    window.dispatchEvent(new CustomEvent('userSignedOut'));
  }

  _handleLoginError(err) {
    this.loginAttempts++;
    localStorage.setItem('loginAttempts', this.loginAttempts);
    if (this.loginAttempts >= this.maxAttempts) {
      this.lockoutTime = Date.now() + this.lockoutDuration;
      localStorage.setItem('lockoutTime', this.lockoutTime);
    }
  }

  _resetAttempts() {
    this.loginAttempts = 0;
    this.lockoutTime   = 0;
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lockoutTime');
  }

  _friendlyError(err) {
    const map = {
      'auth/invalid-credential':     'Correo o contraseña incorrectos.',
      'auth/user-not-found':         'No existe una cuenta con ese correo.',
      'auth/wrong-password':         'Contraseña incorrecta.',
      'auth/too-many-requests':      'Demasiados intentos. Intenta más tarde.',
      'auth/network-request-failed': 'Error de red. Verifica tu conexión.',
      'auth/user-disabled':          'Esta cuenta ha sido deshabilitada.',
    };
    return new Error(map[err.code] || err.message);
  }

  // ── Getters públicos ──────────────────────────────────────────

  isAuthenticated() {
    return !!this.currentUser || sessionStorage.getItem('adminAuthenticated') === 'true';
  }

  isAdmin() {
    return this.currentUser?.email === 'puntodigitalti@gmail.com';
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLockedOut() {
    return this.lockoutTime > 0 && Date.now() < this.lockoutTime;
  }
}

window.authService = new AuthService();
