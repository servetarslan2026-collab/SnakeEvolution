// ============================================================
// particles.js — Parçacık Sistemi (Object Pooling)
// ============================================================
window.G = window.G || {};

G.Particles = {
  _pool: [],
  _active: [],
  _maxParticles: 500,

  init() {
    // Havuz oluştur
    for (let i = 0; i < this._maxParticles; i++) {
      this._pool.push(this._createParticle());
    }
  },

  _createParticle() {
    return {
      active: false,
      x: 0, y: 0,
      vx: 0, vy: 0,
      life: 0, maxLife: 0,
      size: 2, startSize: 2, endSize: 0,
      color: '#ffffff',
      alpha: 1, startAlpha: 1, endAlpha: 0,
      gravity: 0,
      friction: 1,
      shape: 'dot', // dot, line, star, ring, square, trail
      rotation: 0, rotationSpeed: 0,
      hue: 0, hueSpeed: 0 // gökkuşağı efekti
    };
  },

  _getParticle() {
    for (let i = 0; i < this._pool.length; i++) {
      if (!this._pool[i].active) return this._pool[i];
    }
    // Havuz doluysa en eski olanı yeniden kullan
    const oldest = this._active.shift();
    if (oldest) {
      oldest.active = false;
      return oldest;
    }
    return this._createParticle();
  },

  /**
   * Parçacık emit et
   */
  emit(opts) {
    const p = this._getParticle();
    p.active = true;
    p.x = opts.x || 0;
    p.y = opts.y || 0;
    p.vx = opts.vx || 0;
    p.vy = opts.vy || 0;
    p.life = opts.life || 0.5;
    p.maxLife = p.life;
    p.size = opts.size || 3;
    p.startSize = opts.size || 3;
    p.endSize = opts.endSize !== undefined ? opts.endSize : 0;
    p.color = opts.color || '#ffffff';
    p.alpha = opts.alpha || 1;
    p.startAlpha = opts.alpha || 1;
    p.endAlpha = opts.endAlpha !== undefined ? opts.endAlpha : 0;
    p.gravity = opts.gravity || 0;
    p.friction = opts.friction || 0.98;
    p.shape = opts.shape || 'dot';
    p.rotation = opts.rotation || 0;
    p.rotationSpeed = opts.rotationSpeed || 0;
    p.hue = opts.hue || 0;
    p.hueSpeed = opts.hueSpeed || 0;

    if (!this._active.includes(p)) {
      this._active.push(p);
    }
    return p;
  },

  /**
   * Dairesel patlama
   */
  burst(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 50 + Math.random() * 100;
      this.emit({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        endSize: 0,
        color,
        alpha: 1,
        endAlpha: 0,
        friction: 0.95,
        shape: 'dot'
      });
    }
  },

  /**
   * Yılan izi
   */
  trail(x, y, color) {
    this.emit({
      x: x + Math.random() * 4 - 2,
      y: y + Math.random() * 4 - 2,
      vx: 0, vy: 0,
      life: 0.3 + Math.random() * 0.2,
      size: 3 + Math.random() * 2,
      endSize: 0,
      color,
      alpha: 0.6,
      endAlpha: 0,
      friction: 1,
      shape: 'dot'
    });
  },

  /**
   * Kıvılcım
   */
  spark(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 60;
      this.emit({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.15 + Math.random() * 0.15,
        size: 1 + Math.random() * 2,
        endSize: 0,
        color,
        alpha: 1,
        endAlpha: 0,
        gravity: 100,
        friction: 0.96,
        shape: 'line'
      });
    }
  },

  /**
   * Yükselen yazı
   */
  floatText(x, y, text, color, size = 16) {
    this.emit({
      x, y,
      vx: 0,
      vy: -60,
      life: 0.8,
      size,
      endSize: size * 0.5,
      color,
      alpha: 1,
      endAlpha: 0,
      friction: 0.98,
      shape: 'text',
      _text: text
    });
  },

  /**
   * Genişleyen halka
   */
  ring(x, y, color, maxRadius = 40) {
    this.emit({
      x, y,
      vx: 0, vy: 0,
      life: 0.4,
      size: 5,
      endSize: maxRadius,
      color,
      alpha: 0.8,
      endAlpha: 0,
      friction: 1,
      shape: 'ring'
    });
  },

  /**
   * Spiral
   */
  vortex(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 30 + Math.random() * 20;
      this.emit({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        size: 2 + Math.random() * 2,
        endSize: 0,
        color,
        alpha: 0.8,
        endAlpha: 0,
        friction: 0.92,
        shape: 'dot',
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }
  },

  /**
   * Gökkuşağı patlaması
   */
  rainbowBurst(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.emit({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
        size: 2 + Math.random() * 3,
        endSize: 0,
        color: '#ffffff',
        alpha: 1,
        endAlpha: 0,
        friction: 0.94,
        shape: 'dot',
        hue: Math.random() * 360,
        hueSpeed: 200 + Math.random() * 200
      });
    }
  },

  /**
   * Güncelle
   */
  update(dt) {
    for (let i = this._active.length - 1; i >= 0; i--) {
      const p = this._active[i];
      if (!p.active) {
        this._active.splice(i, 1);
        continue;
      }

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        this._active.splice(i, 1);
        continue;
      }

      const t = 1 - (p.life / p.maxLife);

      // Fizik
      p.vy += p.gravity * dt;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotationSpeed * dt;

      // Boyut interpolasyonu
      p.size = p.startSize + (p.endSize - p.startSize) * t;

      // Alpha interpolasyonu
      p.alpha = p.startAlpha + (p.endAlpha - p.startAlpha) * t;

      // Renk değişimi (gökkuşağı)
      if (p.hueSpeed) {
        p.hue += p.hueSpeed * dt;
      }
    }
  },

  /**
   * Çiz
   */
  draw(ctx) {
    for (const p of this._active) {
      if (!p.active || p.alpha <= 0 || p.size <= 0) continue;

      ctx.save();
      ctx.globalAlpha = p.alpha;

      let color = p.color;
      if (p.hueSpeed) {
        color = `hsl(${p.hue}, 100%, 60%)`;
      }

      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      switch (p.shape) {
        case 'dot':
          ctx.beginPath();
          ctx.arc(p.x | 0, p.y | 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'line':
          ctx.lineWidth = p.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x | 0, p.y | 0);
          ctx.lineTo((p.x - p.vx * 0.03) | 0, (p.y - p.vy * 0.03) | 0);
          ctx.stroke();
          break;

        case 'star':
          this._drawStar(ctx, p.x, p.y, 5, p.size, p.size * 0.4, p.rotation);
          break;

        case 'ring':
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x | 0, p.y | 0, p.size, 0, Math.PI * 2);
          ctx.stroke();
          break;

        case 'square':
          ctx.save();
          ctx.translate(p.x | 0, p.y | 0);
          ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
          break;

        case 'text':
          ctx.font = `bold ${Math.max(1, p.size | 0)}px 'Segoe UI', Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Gölge
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fillText(p._text || '', p.x | 0, p.y | 0);
          break;
      }

      ctx.restore();
    }
  },

  _drawStar(ctx, cx, cy, spikes, outerR, innerR, rotation) {
    ctx.save();
    ctx.translate(cx | 0, cy | 0);
    ctx.rotate(rotation);
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (Math.PI * i) / spikes - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  /**
   * Tüm parçacıkları temizle
   */
  clear() {
    for (const p of this._active) {
      p.active = false;
    }
    this._active = [];
  },

  /**
   * Aktif parçacık sayısı
   */
  count() {
    return this._active.length;
  }
};
