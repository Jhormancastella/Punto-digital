/* ── Login Modal ──────────────────────────────────────────── */

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
  if (err) err.classList.remove('visible');
  document.getElementById('loginForm')?.reset();
};

window.loginAdmin = (event) => {
  if (event) event.preventDefault();
  const email     = document.getElementById('adminEmail').value.trim();
  const pass      = document.getElementById('adminPass').value;
  const loginText = document.getElementById('loginText');
  const loginError = document.getElementById('loginError');

  loginText.innerHTML = '<span class="login-spinner"></span> Verificando...';

  setTimeout(() => {
    if (email === 'admin@punto.com' && pass === 'admin123') {
      sessionStorage.setItem('adminAuthenticated', 'true');
      window.closeLoginModal();

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
    } else {
      loginError.classList.add('visible');
      loginText.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> Ingresar al panel';
      const modal = document.querySelector('.login-modal');
      modal?.classList.add('shake');
      setTimeout(() => modal?.classList.remove('shake'), 400);
    }
  }, 900);
};

document.addEventListener('DOMContentLoaded', () => {
  // Toggle mostrar/ocultar contraseña
  document.getElementById('togglePass')?.addEventListener('click', () => {
    const input = document.getElementById('adminPass');
    const icon  = document.querySelector('#togglePass i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
    }
  });

  // Cerrar al hacer clic en el overlay
  document.addEventListener('click', (e) => {
    if (e.target.id === 'loginModal') window.closeLoginModal();
  });
});
