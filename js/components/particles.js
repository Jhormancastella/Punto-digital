/**
 * Sistema de partículas optimizado con control de rendimiento
 */
class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.isRunning = false;
    
    // Configuración adaptativa
    this.config = {
      maxParticles: this.getOptimalParticleCount(),
      speed: 0.5,
      size: { min: 1, max: 3 },
      opacity: { min: 0.1, max: 0.4 },
      goldenRatio: 0.3, // 30% partículas doradas
      connectionDistance: 100,
      showConnections: false
    };
    
    this.init();
  }

  /**
   * Determina el número óptimo de partículas según el dispositivo
   */
  getOptimalParticleCount() {
    const isMobile = window.innerWidth <= 768;
    const isLowEnd = navigator.hardwareConcurrency <= 4;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) return 0;
    if (isMobile && isLowEnd) return 30;
    if (isMobile) return 50;
    if (isLowEnd) return 60;
    return 80;
  }

  /**
   * Inicializa el sistema
   */
  init() {
    this.resize();
    this.createParticles();
    
    // Event listeners
    window.addEventListener('resize', () => this.resize());
    
    // Detectar cambios en preferencias de movimiento
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      if (e.matches) {
        this.stop();
      } else {
        this.start();
      }
    });
    
    // Control de visibilidad de página
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
    
    this.start();
  }

  /**
   * Redimensiona el canvas
   */
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Ajustar número de partículas según el tamaño
    const newCount = this.getOptimalParticleCount();
    if (newCount !== this.config.maxParticles) {
      this.config.maxParticles = newCount;
      this.createParticles();
    }
  }

  /**
   * Crea las partículas
   */
  createParticles() {
    this.particles = [];
    
    for (let i = 0; i < this.config.maxParticles; i++) {
      this.particles.push(new Particle(this.canvas, this.config));
    }
  }

  /**
   * Inicia la animación
   */
  start() {
    if (this.config.maxParticles === 0) return;
    
    this.isRunning = true;
    this.animate();
  }

  /**
   * Detiene la animación
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Pausa la animación
   */
  pause() {
    this.isRunning = false;
  }

  /**
   * Reanuda la animación
   */
  resume() {
    if (!this.isRunning && this.config.maxParticles > 0) {
      this.start();
    }
  }

  /**
   * Loop de animación
   */
  animate() {
    if (!this.isRunning) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Actualizar y dibujar partículas
    this.particles.forEach(particle => {
      particle.update();
      particle.draw(this.ctx);
    });
    
    // Dibujar conexiones si está habilitado
    if (this.config.showConnections) {
      this.drawConnections();
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Dibuja conexiones entre partículas cercanas
   */
  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.config.connectionDistance) {
          const opacity = (1 - distance / this.config.connectionDistance) * 0.1;
          this.ctx.strokeStyle = `rgba(212, 168, 67, ${opacity})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
  }

  /**
   * Actualiza configuración
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.createParticles();
  }
}

/**
 * Clase Particle individual
 */
class Particle {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;
    this.vx = (Math.random() - 0.5) * this.config.speed;
    this.vy = (Math.random() - 0.5) * this.config.speed;
    this.size = Math.random() * (this.config.size.max - this.config.size.min) + this.config.size.min;
    this.opacity = Math.random() * (this.config.opacity.max - this.config.opacity.min) + this.config.opacity.min;
    this.isGolden = Math.random() < this.config.goldenRatio;
    this.pulseSpeed = Math.random() * 0.02 + 0.01;
    this.pulseOffset = Math.random() * Math.PI * 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Efecto de pulsación
    this.opacity += Math.sin(Date.now() * this.pulseSpeed + this.pulseOffset) * 0.05;
    
    // Rebote en bordes con margen
    if (this.x < -10 || this.x > this.canvas.width + 10 || 
        this.y < -10 || this.y > this.canvas.height + 10) {
      this.reset();
    }
  }

  draw(ctx) {
    const color = this.isGolden ? 
      `rgba(212, 168, 67, ${this.opacity})` : 
      `rgba(255, 255, 255, ${this.opacity * 0.5})`;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Efecto de brillo para partículas doradas
    if (this.isGolden && this.opacity > 0.3) {
      ctx.shadowColor = 'rgba(212, 168, 67, 0.5)';
      ctx.shadowBlur = this.size * 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

// Inicializar sistema de partículas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.particleSystem = new ParticleSystem('particles-canvas');
});