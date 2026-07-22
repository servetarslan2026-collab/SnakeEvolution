// ============================================================
// particles.js — AAA+ Parçacık Sistemi
// ============================================================
window.G = window.G || {};

G.Particles = {
  list: [],
  pool: [],
  MAX: 200,

  clear() {
    this.list = [];
  },

  _get() {
    return this.pool.length > 0 ? this.pool.pop() : {};
  },

  _recycle(p) {
    if (this.pool.length < 300) this.pool.push(p);
  },

  // ============ TEMEL EMIT ============
  emit(x, y, vx, vy, life, sz, col, shape) {
    if (this.list.length >= this.MAX) return;
    const p = this._get();
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = life; p.ml = life; p.sz = sz;
    p.col = col || '#fff';
    p.shape = shape || 'circle';
    p.txt = undefined;
    p.rot = Math.random() * Math.PI * 2;
    p.rotV = (Math.random() - 0.5) * 5;
    p.drag = 0.96;
    p.gravity = 30;
    p.fadeIn = 0;
    this.list.push(p);
  },

  // ============ EFEKTLER ============

  // Patlama (dairesel)
  burst(x, y, col, n) {
    for (let i = 0; i < (n || 8); i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 30 + Math.random() * 60;
      this.emit(x, y, Math.cos(a) * s, Math.sin(a) * s,
        0.3 + Math.random() * 0.3, 2 + Math.random() * 2, col, 'circle');
    }
  },

  // Yıldız patlaması
  starBurst(x, y, col, n) {
    for (let i = 0; i < (n || 6); i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 40;
      const p = this._get();
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
      p.life = 0.4 + Math.random() * 0.3; p.ml = p.life;
      p.sz = 3 + Math.random() * 2; p.col = col;
      p.shape = 'star'; p.txt = undefined;
      p.rot = Math.random() * Math.PI * 2;
      p.rotV = (Math.random() - 0.5) * 8;
      p.drag = 0.94; p.gravity = 20; p.fadeIn = 0;
      if (this.list.length < this.MAX) this.list.push(p);
    }
  },

  // Duman efekti
  smoke(x, y, col, n) {
    for (let i = 0; i < (n || 4); i++) {
      const p = this._get();
      p.x = x + (Math.random() - 0.5) * 10;
      p.y = y + (Math.random() - 0.5) * 10;
      p.vx = (Math.random() - 0.5) * 15;
      p.vy = -(10 + Math.random() * 20);
      p.life = 0.5 + Math.random() * 0.5; p.ml = p.life;
      p.sz = 4 + Math.random() * 4; p.col = col || '#888888';
      p.shape = 'smoke'; p.txt = undefined;
      p.rot = Math.random() * Math.PI * 2;
      p.rotV = (Math.random() - 0.5) * 2;
      p.drag = 0.92; p.gravity = -10; p.fadeIn = 0.1;
      if (this.list.length < this.MAX) this.list.push(p);
    }
  },

  // Ateş efekti
  fire(x, y, n) {
    for (let i = 0; i < (n || 5); i++) {
      const p = this._get();
      p.x = x + (Math.random() - 0.5) * 8;
      p.y = y;
      p.vx = (Math.random() - 0.5) * 20;
      p.vy = -(30 + Math.random() * 40);
      p.life = 0.3 + Math.random() * 0.3; p.ml = p.life;
      p.sz = 3 + Math.random() * 3;
      p.col = ['#ff4400', '#ff8800', '#ffcc00', '#ffffff'][Math.floor(Math.random() * 4)];
      p.shape = 'circle'; p.txt = undefined;
      p.rot = 0; p.rotV = 0;
      p.drag = 0.95; p.gravity = -20; p.fadeIn = 0;
      if (this.list.length < this.MAX) this.list.push(p);
    }
  },

  // Buz efekti
  ice(x, y, n) {
    for (let i = 0; i < (n || 4); i++) {
      const p = this._get();
      p.x = x + (Math.random() - 0.5) * 10;
      p.y = y + (Math.random() - 0.5) * 10;
      p.vx = (Math.random() - 0.5) * 30;
      p.vy = (Math.random() - 0.5) * 30;
      p.life = 0.4 + Math.random() * 0.3; p.ml = p.life;
      p.sz = 2 + Math.random() * 2;
      p.col = ['#00ccff', '#88eeff', '#ffffff'][Math.floor(Math.random() * 3)];
      p.shape = 'diamond'; p.txt = undefined;
      p.rot = Math.random() * Math.PI * 2;
      p.rotV = (Math.random() - 0.5) * 10;
      p.drag = 0.9; p.gravity = 0; p.fadeIn = 0;
      if (this.list.length < this.MAX) this.list.push(p);
    }
  },

  // Yıldırım efekti
  lightning(x, y, tx, ty) {
    const steps = 5;
    const dx = (tx - x) / steps;
    const dy = (ty - y) / steps;
    for (let i = 0; i < steps; i++) {
      const p = this._get();
      p.x = x + dx * i + (Math.random() - 0.5) * 10;
      p.y = y + dy * i + (Math.random() - 0.5) * 10;
      p.vx = (Math.random() - 0.5) * 20;
      p.vy = (Math.random() - 0.5) * 20;
      p.life = 0.15 + Math.random() * 0.1; p.ml = p.life;
      p.sz = 2 + Math.random();
      p.col = ['#ffe14d', '#ffff88', '#ffffff'][Math.floor(Math.random() * 3)];
      p.shape = 'circle'; p.txt = undefined;
      p.rot = 0; p.rotV = 0;
      p.drag = 0.9; p.gravity = 0; p.fadeIn = 0;
      if (this.list.length < this.MAX) this.list.push(p);
    }
  },

  // Floating text
  floatText(x, y, txt, col) {
    const p = this._get();
    p.x = x; p.y = y; p.vx = 0; p.vy = -50;
    p.life = 0.8; p.ml = 0.8; p.sz = 14;
    p.col = col; p.shape = 'text'; p.txt = txt;
    p.rot = 0; p.rotV = 0;
    p.drag = 0.98; p.gravity = 0; p.fadeIn = 0;
    if (this.list.length < this.MAX) this.list.push(p);
  },

  // Skor text (daha büyük, daha uzun)
  scoreText(x, y, txt, col) {
    const p = this._get();
    p.x = x; p.y = y; p.vx = 0; p.vy = -60;
    p.life = 1.0; p.ml = 1.0; p.sz = 18;
    p.col = col; p.shape = 'text'; p.txt = txt;
    p.rot = 0; p.rotV = 0;
    p.drag = 0.98; p.gravity = 0; p.fadeIn = 0;
    if (this.list.length < this.MAX) this.list.push(p);
  },

  // ============ GÜNCELLEME ============

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) {
        this._recycle(this.list[i]);
        this.list.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity * dt;
      p.rot += p.rotV * dt;
    }
  },

  // ============ ÇİZİM ============

  draw(ctx) {
    if (G.Save && G.Save.data && !G.Save.data.settings.particles) return;
    const glowOn = G.Save && G.Save.data && G.Save.data.settings.glow !== false;

    for (const p of this.list) {
      let a = p.life / p.ml;
      // Fade in
      if (p.fadeIn > 0 && p.life > p.ml - p.fadeIn) {
        a = (p.ml - p.life) / p.fadeIn;
      }
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = p.col;

      if (p.shape === 'text') {
        ctx.font = 'bold ' + p.sz + 'px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Text shadow
        if (glowOn) {
          ctx.fillStyle = p.col + '44';
          ctx.fillText(p.txt, (p.x | 0) + 1, (p.y | 0) + 1);
          ctx.fillStyle = p.col;
        }
        ctx.fillText(p.txt, p.x | 0, p.y | 0);
      } else if (p.shape === 'smoke') {
        // Duman: genişleyen daire
        const s = p.sz * (1 + (1 - a) * 2);
        ctx.globalAlpha = a * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'star') {
        // Yıldız şekli
        const s = p.sz * a;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        for (let pt = 0; pt < 4; pt++) {
          const angle = pt * Math.PI / 2;
          ctx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
          ctx.lineTo(Math.cos(angle + Math.PI / 4) * s * 0.4, Math.sin(angle + Math.PI / 4) * s * 0.4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.shape === 'diamond') {
        // Elmas şekli
        const s = p.sz * a;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.shape === 'spark') {
        // Kıvılcım: çizgi
        const s = p.sz * a;
        ctx.strokeStyle = p.col;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y);
        ctx.lineTo(p.x + s, p.y);
        ctx.stroke();
      } else {
        // Varsayılan: daire
        const s = p.sz * a;
        if (glowOn && s > 2) {
          // Glow
          ctx.fillStyle = p.col + '33';
          ctx.beginPath();
          ctx.arc(p.x, p.y, s * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = p.col;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
};
