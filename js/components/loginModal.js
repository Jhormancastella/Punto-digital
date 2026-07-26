/* ── Login Modal — Firebase Auth ─────────────────────────── */

window.openLoginModal = () => {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById('adminEmail')?.focus(), 150);
};

window.closeLoginModal = () => {
  const modal = document.getElementById('loginModal');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  const err = document.getElementById('loginError');
  if (err) { err.classList.remove('visible'); err.textContent = ''; }
  document.getElementById('loginForm')?.reset();
};

window.loginAdmin = async (event) => {
  if (event) event.preventDefault();

  const emailInput = document.getElementById('adminEmail');
  const passInput  = document.getElementById('adminPass');
  const loginBtn   = document.getElementById('loginBtn');
  const loginText  = document.getElementById('loginText');
  const loginError = document.getElementById('loginError');

  const email    = emailInput?.value.trim();
  const password = passInput?.value;

  // Estado de carga
  if (loginText) loginText.innerHTML = '<span class="login-spinner"></span> Verificando...';
  if (loginBtn)  loginBtn.disabled = true;
  if (loginError) { loginError.classList.remove('visible'); loginError.textContent = ''; }

  try {
    await window.authService.signIn(email, password);

    // Solo admins pueden entrar al panel
    if (!window.authService.isAdmin()) {
      await window.authService.signOut();
      throw new Error('No tienes permisos de administrador.');
    }

    window.closeLoginModal();

    // Splash de acceso concedido
    const splash = document.createElement('div');
    splash.id = 'admin-splash';
    splash.innerHTML = `
      <div class="admin-splash-box">
        <div class="admin-splash-icon"><i class="fas fa-check"></i></div>
        <p class="admin-splash-title">¡Acceso concedido!</p>
        <p class="admin-splash-sub">Cargando panel de administración...</p>
        <div class="admin-splash-bar"><div class="admin-splash-progress"></div></div>
      </div>
    `;
    document.body.appendChild(splash);
    setTimeout(() => { window.location.href = 'admin.html'; }, 1800);

  } catch (err) {
    if (loginError) {
      loginError.textContent = err.message || 'Error al iniciar sesión.';
      loginError.classList.add('visible');
    }
    if (loginText) loginText.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> Ingresar al panel';
    if (loginBtn)  loginBtn.disabled = false;

    const modal = document.querySelector('.login-modal');
    modal?.classList.add('shake');
    setTimeout(() => modal?.classList.remove('shake'), 400);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Toggle mostrar/ocultar contraseña
  document.getElementById('togglePass')?.addEventListener('click', () => {
    const input = document.getElementById('adminPass');
    const icon  = document.querySelector('#togglePass i');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      if (icon) icon.className = 'fas fa-eye';
    }
  });

  // Cerrar al hacer clic en el overlay
  document.addEventListener('click', (e) => {
    if (e.target.id === 'loginModal') window.closeLoginModal();
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeLoginModal();
  });
});
