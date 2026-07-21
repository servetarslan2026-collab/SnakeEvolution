// ============================================================
// particles.js — Parçacık Sistemi
// ============================================================
window.G = window.G || {};

G.Particles = {
  list: [],
  pool: [], // Object pool for reuse

  clear() { 
    this.list = []; 
    // Don't clear pool - keep for reuse
  },

  _getParticle() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return {};
  },

  _recycleParticle(p) {
    if (this.pool.length < 200) {
      this.pool.push(p);
    }
  },

  emit(x, y, vx, vy, life, sz, col) {
    if (this.list.length > 150) return;
    const p = this._getParticle();
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = life; p.ml = life; p.sz = sz; p.col = col || '#fff';
    p.shape = undefined; p.txt = undefined;
    this.list.push(p);
  },

  burst(x, y, col, n) {
    for (let i = 0; i < (n || 6); i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 30 + Math.random() * 50;
      this.emit(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.2 + Math.random() * 0.2, 2 + Math.random(), col);
    }
  },

  floatText(x, y, txt, col) {
    this.list.push({ x, y, vx: 0, vy: -40, life: 0.6, ml: 0.6, sz: 14, col, txt, shape: 'text' });
  },

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { 
        this._recycleParticle(this.list[i]);
        this.list.splice(i, 1); 
        continue; 
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.vy += 30 * dt;
    }
  },

  draw(ctx) {
    for (const p of this.list) {
      const a = p.life / p.ml;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.col;
      if (p.shape === 'text') {
        ctx.font = 'bold ' + p.sz + 'px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(p.txt, p.x | 0, p.y | 0);
      } else {
        const s = p.sz * a;
        ctx.fillRect((p.x - s / 2) | 0, (p.y - s / 2) | 0, s | 0, s | 0);
      }
    }
    ctx.globalAlpha = 1;
  }
};
