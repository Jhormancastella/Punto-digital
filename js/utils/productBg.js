/**
 * Genera y cachea el fondo dorado oscuro para tarjetas de productos.
 * Se usa como background-image en .product-image y .catalog-card-img
 */
(function() {
  const size = 400;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');

  // Fondo negro profundo
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, size, size);

  // Gradiente radial dorado — esquina superior derecha (como la referencia)
  const g1 = ctx.createRadialGradient(size * 0.75, size * 0.2, 0, size * 0.75, size * 0.2, size * 0.7);
  g1.addColorStop(0,   'rgba(212,168,67,0.55)');
  g1.addColorStop(0.35,'rgba(180,130,40,0.25)');
  g1.addColorStop(0.7, 'rgba(100,70,10,0.08)');
  g1.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, size, size);

  // Segundo gradiente — esquina inferior izquierda más suave
  const g2 = ctx.createRadialGradient(size * 0.15, size * 0.85, 0, size * 0.15, size * 0.85, size * 0.5);
  g2.addColorStop(0,   'rgba(212,168,67,0.2)');
  g2.addColorStop(0.5, 'rgba(150,100,20,0.06)');
  g2.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, size, size);

  // Partículas doradas pequeñas
  const rng = (a, b) => Math.random() * (b - a) + a;
  for (let i = 0; i < 80; i++) {
    ctx.beginPath();
    ctx.arc(rng(0, size), rng(0, size), rng(0.4, 2), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(212,168,67,${rng(0.15, 0.7).toFixed(2)})`;
    ctx.fill();
  }
  // Partículas blancas
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(rng(0, size), rng(0, size), rng(0.3, 1.2), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${rng(0.1, 0.5).toFixed(2)})`;
    ctx.fill();
  }

  const dataUrl = c.toDataURL('image/jpeg', 0.85);

  // Inyectar como CSS custom property y como clase
  const style = document.createElement('style');
  style.textContent = `
    :root { --product-bg: url("${dataUrl}"); }
    .product-image,
    .catalog-card-img {
      background-image: var(--product-bg);
      background-size: cover;
      background-position: center;
    }
  `;
  document.head.appendChild(style);

  // Exponer para uso en imageProcessor
  window.productBgDataUrl = dataUrl;
})();
