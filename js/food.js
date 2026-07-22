// ============================================================
// food.js — Yem Sistemi (düzeltilmiş)
// ============================================================
window.G = window.G || {};

G.Food = {
  items: [],
  spawnTimer: 0,
  maxFood: 12,
  _spawnCount: 0,
  _collecting: false, // Double-collection guard

  init() {
    this.items = [];
    this.spawnTimer = 0;
    this._spawnCount = 0;
    this._collecting = false;
    for (let i = 0; i < 12; i++) {
      this.spawn();
    }
  },

  spawn() {
    if (this.items.length >= this.maxFood) return;
    const types = G.Config.FOOD_TYPES;

    // Ağırlıklı seçim
    const totalWeight = types.reduce((sum, t) => sum + t.w, 0);
    let r = Math.random() * totalWeight;
    let type = types[0];
    for (const t of types) {
      r -= t.w;
      if (r <= 0) { type = t; break; }
    }

    // Aynı nadir yem tekrar çıkmasın
    if (this.items.length > 0) {
      const lastType = this.items[this.items.length - 1].type;
      if (lastType === type.type && type.w < 10) {
        const differentTypes = types.filter(t => t.type !== lastType);
        if (differentTypes.length > 0) {
          type = differentTypes[G.Utils.rndInt(0, differentTypes.length - 1)];
        }
      }
    }

    // Her 3 spawn'da bir nadir yem garantisi
    this._spawnCount++;
    if (this._spawnCount % 3 === 0) {
      const rareTypes = types.filter(t => t.w <= 5);
      if (rareTypes.length > 0 && Math.random() < 0.3) {
        type = rareTypes[G.Utils.rndInt(0, rareTypes.length - 1)];
      }
    }

    // Pozisyon çakışma kontrolü
    let pos;
    let tries = 0;
    do {
      pos = G.Map.getRandomEmpty();
      tries++;
    } while (tries < 20 && this.items.some(f => Math.round(f.x) === pos.x && Math.round(f.y) === pos.y));

    this.items.push({
      x: pos.x,
      y: pos.y,
      type: type.type,
      color: type.color,
      sc: type.sc,
      len: type.len,
      xp: type.xp,
      hp: type.hp,
      icon: type.icon,
      effect: type.effect,
      anim: Math.random() * 6.28,
      alive: true
    });
  },

  update(dt) {
    if (this._collecting) return; // Toplama sırasında güncelleme yapma

    // Spawn timer
    this.spawnTimer += dt;
    const spawnRate = G.Boss.isActive() ? 2.0 : 1.0;
    if (this.spawnTimer >= spawnRate) {
      this.spawnTimer = 0;
      this.spawn();
    }

    // AutoCollect: her 3 sn'de 1 yem
    if (G.Engine.upgrades.includes('autoCollect') && G.Snake.alive) {
      if (!this._autoTimer) this._autoTimer = 0;
      this._autoTimer += dt;
      if (this._autoTimer >= 3 && this.items.length > 0) {
        this._autoTimer = 0;
        const head = G.Snake.head();
        let closest = null;
        let closestDist = Infinity;
        for (const f of this.items) {
          if (!f.alive) continue;
          const d = G.Utils.dist(head.x, head.y, f.x, f.y);
          if (d < closestDist) {
            closestDist = d;
            closest = f;
          }
        }
        if (closest && closestDist < 8) {
          this.collectAndRemove(closest);
        }
      }
    }

    // Vortex + Magnet effect (sadece hareket ettir, toplama checkCollision'a bırak)
    const hasMagnet = G.Engine.upgrades.includes('magnet');
    const hasVortex = G.Engine.upgrades.includes('vortex');
    if ((hasMagnet || hasVortex) && G.Snake.alive) {
      const head = G.Snake.head();
      const range = hasVortex ? 10 : 5;
      const strength = hasVortex ? 0.5 : 0.35;
      for (const f of this.items) {
        if (!f.alive) continue;
        const d = G.Utils.dist(head.x, head.y, f.x, f.y);
        if (d < range && d > 0.5) {
          const angle = Math.atan2(head.y - f.y, head.x - f.x);
          f.x += Math.cos(angle) * strength;
          f.y += Math.sin(angle) * strength;
          // Sınır kontrolü
          const COLS = G.Engine.W / G.Engine.GS;
          const ROWS = G.Engine.H / G.Engine.GS;
          f.x = G.Utils.clamp(f.x, 0, COLS - 1);
          f.y = G.Utils.clamp(f.y, 0, ROWS - 1);
        }
      }
    }
  },

  // Güvenli toplama fonksiyonu (double-collection guard ile)
  collectAndRemove(food) {
    if (this._collecting) return;
    this._collecting = true;
    G.Engine.collectFood(food);
    const idx = this.items.indexOf(food);
    if (idx >= 0) this.items.splice(idx, 1);
    this._collecting = false;
  },

  checkCollision(nx, ny) {
    if (this._collecting) return;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const f = this.items[i];
      if (!f.alive) continue;
      // Float pozisyon için mesafe tabanlı kontrol
      const d = G.Utils.dist(f.x, f.y, nx, ny);
      if (d < 0.8) {
        this.collectAndRemove(f);
        return; // Bir karede bir yem topla
      }
    }
  },

  draw(ctx) {
    const E = G.Engine;
    const gs = E.GS;
    const now = Date.now();
    const glowOn = G.Save.data.settings.glow !== false;
    const PI2 = Math.PI * 2;

    for (const f of this.items) {
      if (!f.alive) continue;
      const cx = f.x * gs + gs / 2;
      const cy = f.y * gs + gs / 2;
      const t = now / 1000 + f.anim;
      const pulse = Math.sin(t * 3) * 0.08 + 1;
      const float = Math.sin(t * 2 + f.anim) * 2;
      const sz = (gs / 2 - 2) * pulse;
      const fy = cy + float;

      ctx.save();

      // Gölge
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(cx + 1, cy + gs / 2 - 2, sz * 0.7, sz * 0.25, 0, 0, PI2);
      ctx.fill();

      // Glow aura
      if (glowOn) {
        const auraG = ctx.createRadialGradient(cx, fy, sz * 0.5, cx, fy, sz * 2.5);
        auraG.addColorStop(0, f.color + '44');
        auraG.addColorStop(1, f.color + '00');
        ctx.fillStyle = auraG;
        ctx.beginPath();
        ctx.arc(cx, fy, sz * 2.5, 0, PI2);
        ctx.fill();
      }

      // Tür bazlı çizim
      if (f.type === 'normal') {
        const ag = ctx.createRadialGradient(cx - sz * 0.2, fy - sz * 0.3, 0, cx, fy, sz);
        ag.addColorStop(0, '#ff6666');
        ag.addColorStop(0.6, '#ff2244');
        ag.addColorStop(1, '#cc0022');
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.arc(cx, fy, sz, 0, PI2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx - sz * 0.25, fy - sz * 0.3, sz * 0.3, sz * 0.2, -0.5, 0, PI2);
        ctx.fill();
        ctx.fillStyle = '#44bb22';
        ctx.beginPath();
        ctx.ellipse(cx + 2, fy - sz - 1, 4, 2, 0.3, 0, PI2);
        ctx.fill();
        ctx.strokeStyle = '#885522';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, fy - sz + 1);
        ctx.lineTo(cx + 1, fy - sz - 3);
        ctx.stroke();

      } else if (f.type === 'golden') {
        const gg = ctx.createRadialGradient(cx - sz * 0.2, fy - sz * 0.2, 0, cx, fy, sz);
        gg.addColorStop(0, '#ffee88');
        gg.addColorStop(0.5, '#ffcc00');
        gg.addColorStop(1, '#cc8800');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(cx, fy, sz, 0, PI2);
        ctx.fill();
        ctx.strokeStyle = '#ffdd4466';
        ctx.lineWidth = 1;
        for (let r = 0; r < 6; r++) {
          const ra = t * 1.5 + r * 1.047;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ra) * (sz + 2), fy + Math.sin(ra) * (sz + 2));
          ctx.lineTo(cx + Math.cos(ra) * (sz + 8), fy + Math.sin(ra) * (sz + 8));
          ctx.stroke();
        }
        for (let sp = 0; sp < 4; sp++) {
          const sa = t * 2 + sp * 1.57;
          const sr = sz + 5 + Math.sin(t * 3 + sp) * 3;
          ctx.fillStyle = '#ffffffcc';
          ctx.beginPath();
          ctx.arc(cx + Math.cos(sa) * sr, fy + Math.sin(sa) * sr, 1.5, 0, PI2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx - sz * 0.2, fy - sz * 0.25, sz * 0.25, sz * 0.15, -0.5, 0, PI2);
        ctx.fill();

      } else if (f.type === 'crystal') {
        ctx.fillStyle = '#8833ff';
        ctx.beginPath();
        ctx.moveTo(cx, fy - sz);
        ctx.lineTo(cx + sz * 0.7, fy - sz * 0.2);
        ctx.lineTo(cx + sz * 0.5, fy + sz * 0.8);
        ctx.lineTo(cx - sz * 0.5, fy + sz * 0.8);
        ctx.lineTo(cx - sz * 0.7, fy - sz * 0.2);
        ctx.closePath();
        ctx.fill();
        const cg = ctx.createLinearGradient(cx - sz, fy, cx + sz, fy);
        cg.addColorStop(0, '#ff000033');
        cg.addColorStop(0.3, '#ffff0033');
        cg.addColorStop(0.6, '#00ff0033');
        cg.addColorStop(1, '#0000ff33');
        ctx.fillStyle = cg;
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(cx - sz * 0.2, fy - sz * 0.8);
        ctx.lineTo(cx + sz * 0.3, fy - sz * 0.2);
        ctx.lineTo(cx, fy - sz * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#aa66ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, fy - sz);
        ctx.lineTo(cx + sz * 0.7, fy - sz * 0.2);
        ctx.lineTo(cx + sz * 0.5, fy + sz * 0.8);
        ctx.lineTo(cx - sz * 0.5, fy + sz * 0.8);
        ctx.lineTo(cx - sz * 0.7, fy - sz * 0.2);
        ctx.closePath();
        ctx.stroke();

      } else if (f.type === 'heart') {
        const hp = 1 + Math.sin(t * 5) * 0.12;
        ctx.fillStyle = '#ff2266';
        ctx.save();
        ctx.translate(cx, fy);
        ctx.scale(hp, hp);
        ctx.beginPath();
        ctx.moveTo(0, sz * 0.3);
        ctx.bezierCurveTo(-sz, -sz * 0.3, -sz, -sz, 0, -sz * 0.5);
        ctx.bezierCurveTo(sz, -sz, sz, -sz * 0.3, 0, sz * 0.3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(-sz * 0.25, -sz * 0.35, sz * 0.15, 0, PI2);
        ctx.fill();
        ctx.restore();

      } else if (f.type === 'bomb') {
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(cx, fy, sz, 0, PI2);
        ctx.fill();
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(cx - sz * 0.2, fy - sz * 0.2, sz * 0.3, 0, PI2);
        ctx.fill();
        ctx.strokeStyle = '#885522';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, fy - sz);
        ctx.quadraticCurveTo(cx + 5, fy - sz - 6, cx + 3, fy - sz - 10);
        ctx.stroke();
        if (Math.sin(t * 15) > 0) {
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(cx + 3, fy - sz - 11, 2.5, 0, PI2);
          ctx.fill();
          ctx.fillStyle = '#ff660088';
          ctx.beginPath();
          ctx.arc(cx + 3, fy - sz - 11, 5, 0, PI2);
          ctx.fill();
        }

      } else if (f.type === 'clock') {
        ctx.fillStyle = '#1a2a44';
        ctx.beginPath();
        ctx.arc(cx, fy, sz, 0, PI2);
        ctx.fill();
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, fy, sz, 0, PI2);
        ctx.stroke();
        for (let h = 0; h < 12; h++) {
          const ha = h * 0.524;
          ctx.strokeStyle = '#4488ff44';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ha) * (sz - 3), fy + Math.sin(ha) * (sz - 3));
          ctx.lineTo(cx + Math.cos(ha) * (sz - 1), fy + Math.sin(ha) * (sz - 1));
          ctx.stroke();
        }
        ctx.strokeStyle = '#88ccff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, fy);
        ctx.lineTo(cx + Math.cos(t) * sz * 0.5, fy + Math.sin(t) * sz * 0.5);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, fy);
        ctx.lineTo(cx + Math.cos(t * 3) * sz * 0.7, fy + Math.sin(t * 3) * sz * 0.7);
        ctx.stroke();

      } else if (f.type === 'poison') {
        ctx.fillStyle = '#22cc00';
        ctx.beginPath();
        ctx.moveTo(cx, fy - sz);
        ctx.quadraticCurveTo(cx + sz, fy, cx, fy + sz * 0.7);
        ctx.quadraticCurveTo(cx - sz, fy, cx, fy - sz);
        ctx.fill();
        for (let b = 0; b < 3; b++) {
          const bx = cx + Math.sin(t * 2 + b * 2) * sz * 0.3;
          const by = fy + Math.cos(t * 2 + b * 2) * sz * 0.2 - sz * 0.2;
          ctx.fillStyle = '#44ff0066';
          ctx.beginPath();
          ctx.arc(bx, by, 2, 0, PI2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx - sz * 0.2, fy - sz * 0.3, sz * 0.2, sz * 0.15, -0.3, 0, PI2);
        ctx.fill();

      } else if (f.type === 'magnet') {
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, fy, sz * 0.6, 0, Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(cx - sz * 0.6, fy - 2, 4, sz * 0.5);
        ctx.fillRect(cx + sz * 0.6 - 4, fy - 2, 4, sz * 0.5);
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(cx - sz * 0.6, fy + sz * 0.3, 4, 4);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(cx + sz * 0.6 - 4, fy + sz * 0.3, 4, 4);
        ctx.strokeStyle = '#00ffcc22';
        ctx.lineWidth = 0.5;
        for (let m = 0; m < 3; m++) {
          const mr = sz + 3 + m * 4;
          ctx.beginPath();
          ctx.arc(cx, fy, mr, 0.3, Math.PI - 0.3);
          ctx.stroke();
        }

      } else if (f.type === 'lucky') {
        ctx.fillStyle = '#44dd22';
        for (let lf = 0; lf < 4; lf++) {
          const la = lf * 1.57 + 0.785;
          const lx = cx + Math.cos(la) * sz * 0.3;
          const ly = fy + Math.sin(la) * sz * 0.3;
          ctx.beginPath();
          ctx.arc(lx, ly, sz * 0.35, 0, PI2);
          ctx.fill();
        }
        ctx.fillStyle = '#88ff4444';
        ctx.beginPath();
        ctx.arc(cx, fy, sz * 0.2, 0, PI2);
        ctx.fill();
        ctx.strokeStyle = '#44aa22';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, fy + sz * 0.3);
        ctx.lineTo(cx, fy + sz);
        ctx.stroke();

      } else if (f.type === 'star' || f.type === 'invincible') {
        ctx.fillStyle = '#ffffff';
        ctx.save();
        ctx.translate(cx, fy);
        ctx.rotate(t * 0.5);
        ctx.beginPath();
        for (let pt = 0; pt < 5; pt++) {
          const outer = pt * 1.257 - Math.PI / 2;
          const inner = outer + 0.628;
          ctx.lineTo(Math.cos(outer) * sz, Math.sin(outer) * sz);
          ctx.lineTo(Math.cos(inner) * sz * 0.4, Math.sin(inner) * sz * 0.4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#ffffff88';
        for (let sp = 0; sp < 6; sp++) {
          const sa = t * 3 + sp * 1.047;
          const sr = sz + 4 + Math.sin(t * 4 + sp) * 2;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(sa) * sr, fy + Math.sin(sa) * sr, 1, 0, PI2);
          ctx.fill();
        }

      } else if (f.type === 'coin') {
        const coinW = Math.abs(Math.cos(t * 2));
        ctx.save();
        ctx.translate(cx, fy);
        ctx.scale(coinW, 1);
        const cg = ctx.createRadialGradient(-2, -2, 0, 0, 0, sz);
        cg.addColorStop(0, '#ffee66');
        cg.addColorStop(0.6, '#ffcc00');
        cg.addColorStop(1, '#aa8800');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(0, 0, sz, 0, PI2);
        ctx.fill();
        ctx.strokeStyle = '#ddaa00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, sz, 0, PI2);
        ctx.stroke();
        ctx.fillStyle = '#aa880088';
        ctx.font = 'bold ' + (sz * 0.8 | 0) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);
        ctx.restore();

      } else {
        // Fallback
        const fg = ctx.createRadialGradient(cx - 2, fy - 2, 0, cx, fy, sz);
        fg.addColorStop(0, '#ffffff');
        fg.addColorStop(0.3, f.color);
        fg.addColorStop(1, f.color + '88');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(cx, fy, sz, 0, PI2);
        ctx.fill();
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, fy, sz, 0, PI2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
};
