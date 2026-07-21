// ============================================================
// food.js — Yem Sistemi
// ============================================================
window.G = window.G || {};

G.Food = {
  _items: [],
  _spawnTimer: 0,
  _maxFood: 8,

  init() {
    this._items = [];
    this._spawnTimer = 0;
  },

  /**
   * Yem spawn et
   */
  spawn(type) {
    if (this._items.length >= this._maxFood) return null;

    const C = G.Config;
    const foodType = C.FOOD_TYPES[type];
    if (!foodType) return null;

    const player = G.Player;
    const safeX = player ? player.getHead().x : C.COLS / 2;
    const safeY = player ? player.getHead().y : C.ROWS / 2;

    const pos = G.Map.getRandomEmpty(safeX, safeY, 5);
    if (!pos) return null;

    const item = {
      x: pos.x,
      y: pos.y,
      _fx: pos.x,  // Float pozisyon (manyetik/vortex için)
      _fy: pos.y,
      type: type,
      ...foodType,
      spawnTime: Date.now(),
      animTimer: 0,
      pulsePhase: Math.random() * Math.PI * 2,
      alive: true,
      // Bomba için
      bombTimer: type === 'bomb' ? 2 : 0,
      bombExploded: false
    };

    this._items.push(item);
    return item;
  },

  /**
   * Rastgele yem tipi seç (ağırlıklı)
   */
  getRandomType() {
    const C = G.Config;
    const types = Object.keys(C.FOOD_TYPES);
    const weights = types.map(t => C.FOOD_TYPES[t].weight);

    // Upgrade etkilerini uygula
    const player = G.Player;
    if (player) {
      const mods = player.getModifiers();
      if (mods.goldenChance) {
        const gi = types.indexOf('golden');
        if (gi >= 0) weights[gi] += mods.goldenChance * 100;
      }
      if (mods.heartChance) {
        const hi = types.indexOf('heart');
        if (hi >= 0) weights[hi] += mods.heartChance * 100;
      }
      if (mods.coinChance) {
        const ci = types.indexOf('coin');
        if (ci >= 0) weights[ci] += mods.coinChance * 100;
      }
    }

    return G.Utils.randomWeighted(types, weights);
  },

  /**
   * Belirli bir yem yakındaki mı?
   */
  getNearby(x, y, range) {
    return this._items.filter(f => f.alive && G.Utils.dist(x, y, f.x, f.y) <= range);
  },

  /**
   * Yemi topla
   */
  collect(item) {
    item.alive = false;
    const idx = this._items.indexOf(item);
    if (idx >= 0) this._items.splice(idx, 1);
  },

  /**
   * Manyetik etkisi: yakındaki yemleri oyuncuya çek
   */
  applyMagnet(px, py, range, dt) {
    for (const f of this._items) {
      if (!f.alive) continue;
      const d = G.Utils.dist(px, py, f.x, f.y);
      if (d <= range && d > 0.5) {
        const angle = G.Utils.angle(f.x, f.y, px, py);
        const speed = 8 * dt; // Hız artırıldı
        f._fx = (f._fx !== undefined ? f._fx : f.x);
        f._fy = (f._fy !== undefined ? f._fy : f.y);
        f._fx += Math.cos(angle) * speed;
        f._fy += Math.sin(angle) * speed;
        // Grid'e snap (sadece yeterli mesafe varsa)
        var newDist = G.Utils.dist(px, py, f._fx, f._fy);
        if (newDist < 1) {
          f.x = Math.round(px);
          f.y = Math.round(py);
          f._fx = f.x;
          f._fy = f.y;
        } else {
          f.x = Math.round(f._fx);
          f.y = Math.round(f._fy);
        }
      }
    }
  },

  /**
   * Bomba patlaması
   */
  explodeBomb(item) {
    if (item.bombExploded) return;
    item.bombExploded = true;

    const C = G.Config;
    const gs = C.GRID_SIZE;
    const cx = item.x * gs + gs / 2;
    const cy = item.y * gs + gs / 2;
    const radius = 3; // tile

    // Parçacık efekti
    G.Particles.burst(cx, cy, '#ff6600', 20);
    G.Particles.ring(cx, cy, '#ff4400', radius * gs);

    // Ekran efekti
    G.Effects.shake(6, 0.3);
    G.Effects.flash('#ff440033', 0.2);

    // Ses
    G.Audio.play('eat_bomb');

    // Düşman hasarı
    if (G.Game) {
      G.Game.damageEnemiesInRadius(item.x, item.y, radius, 2);
    }

    // Kaldır
    this.collect(item);
  },

  /**
   * Güncelle
   */
  update(dt) {
    // Otomatik spawn
    this._spawnTimer += dt;
    if (this._spawnTimer >= G.Config.FOOD_SPAWN_INTERVAL) {
      this._spawnTimer = 0;
      if (this._items.length < this._maxFood) {
        this.spawn(this.getRandomType());
      }
    }

    // Bomba timer
    for (const f of this._items) {
      if (f.type === 'bomb' && f.alive) {
        f.bombTimer -= dt;
        f.animTimer += dt;
        if (f.bombTimer <= 0) {
          this.explodeBomb(f);
        }
      }
    }
  },

  /**
   * Çiz
   */
  draw(ctx) {
    const gs = G.Config.GRID_SIZE;
    const now = Date.now();

    for (const f of this._items) {
      if (!f.alive) continue;

      const cx = f.x * gs + gs / 2;
      const cy = f.y * gs + gs / 2;
      const pulse = Math.sin(now / 300 + f.pulsePhase) * 0.15 + 1;
      const size = (gs / 2 - 2) * pulse;

      ctx.save();

      // Glow
      if (G.Save.get('settings.glow') !== false) {
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 10 + Math.sin(now / 400 + f.pulsePhase) * 5;
      }

      switch (f.type) {
        case 'normal':
          this._drawApple(ctx, cx, cy, size, f.color);
          break;
        case 'golden':
          this._drawGoldenApple(ctx, cx, cy, size, f.color);
          break;
        case 'crystal':
          this._drawCrystal(ctx, cx, cy, size, f.color);
          break;
        case 'heart':
          this._drawHeart(ctx, cx, cy, size, f.color);
          break;
        case 'clock':
          this._drawClock(ctx, cx, cy, size, f.color, now);
          break;
        case 'bomb':
          this._drawBomb(ctx, cx, cy, size, f.color, f.bombTimer);
          break;
        case 'poison':
          this._drawPoison(ctx, cx, cy, size, f.color);
          break;
        case 'magnet':
          this._drawMagnet(ctx, cx, cy, size, f.color, now);
          break;
        case 'lucky':
          this._drawLucky(ctx, cx, cy, size, now);
          break;
        case 'star':
          this._drawStar(ctx, cx, cy, size, f.color, now);
          break;
        case 'coin':
          this._drawCoin(ctx, cx, cy, size, f.color, now);
          break;
      }

      ctx.restore();
    }
  },

  _drawApple(ctx, cx, cy, size, color) {
    // Elma gövdesi (gradient)
    const ag = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, size);
    ag.addColorStop(0, '#ff6666');
    ag.addColorStop(0.6, color);
    ag.addColorStop(1, '#cc1133');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(cx, cy + 1, size, 0, Math.PI * 2);
    ctx.fill();
    // Yaprak
    ctx.fillStyle = '#33dd44';
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy - size, 3, 6, Math.PI / 5, 0, Math.PI * 2);
    ctx.fill();
    // Sap
    ctx.strokeStyle = '#557744';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy - size + 2);
    ctx.lineTo(cx + 1, cy - size - 3);
    ctx.stroke();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawGoldenApple(ctx, cx, cy, size, color) {
    // Altın gradient
    const gg = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, size);
    gg.addColorStop(0, '#fff8cc');
    gg.addColorStop(0.4, '#ffcc00');
    gg.addColorStop(0.8, color);
    gg.addColorStop(1, '#996600');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
    // Parıltı halkası
    ctx.strokeStyle = '#ffee8866';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, size + 2, 0, Math.PI * 2);
    ctx.stroke();
    // Yıldız deseni
    ctx.fillStyle = '#ffffff44';
    this._drawMiniStar(ctx, cx, cy, size * 0.55);
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawCrystal(ctx, cx, cy, size, color) {
    // Kristal (altıgen, gradient)
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
    cg.addColorStop(0, '#dd88ff');
    cg.addColorStop(0.5, color);
    cg.addColorStop(1, '#6600aa');
    ctx.fillStyle = cg;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 6;
      const x = cx + Math.cos(angle) * size;
      const y = cy + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    // İç parıltı
    ctx.fillStyle = '#ffffff66';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // Kenar parlaklığı
    ctx.strokeStyle = '#ffffff33';
    ctx.lineWidth = 1;
    ctx.stroke();
  },

  _drawHeart(ctx, cx, cy, size, color) {
    // Kalp (gradient)
    const hg = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, size);
    hg.addColorStop(0, '#ff88bb');
    hg.addColorStop(0.6, color);
    hg.addColorStop(1, '#cc1166');
    ctx.fillStyle = hg;
    ctx.beginPath();
    const s = size * 0.85;
    ctx.moveTo(cx, cy + s * 0.7);
    ctx.bezierCurveTo(cx - s * 1.2, cy - s * 0.2, cx - s * 0.6, cy - s * 1.1, cx, cy - s * 0.4);
    ctx.bezierCurveTo(cx + s * 0.6, cy - s * 1.1, cx + s * 1.2, cy - s * 0.2, cx, cy + s * 0.7);
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 4, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Nabız efekti halkası
    const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.strokeStyle = color + '44';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, size * pulse + 3, 0, Math.PI * 2);
    ctx.stroke();
  },

  _drawClock(ctx, cx, cy, size, color, now) {
    // Dış halka (gradient)
    const cg = ctx.createRadialGradient(cx, cy, size - 3, cx, cy, size + 1);
    cg.addColorStop(0, color);
    cg.addColorStop(1, '#1a3366');
    ctx.strokeStyle = cg;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.stroke();
    // Kadran
    ctx.fillStyle = '#0a1a33';
    ctx.beginPath();
    ctx.arc(cx, cy, size - 2, 0, Math.PI * 2);
    ctx.fill();
    // Saat işaretleri
    for (let h = 0; h < 12; h++) {
      const ha = (h / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.fillStyle = '#ffffff44';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ha) * (size - 5), cy + Math.sin(ha) * (size - 5), 1, 0, Math.PI * 2);
      ctx.fill();
    }
    // Akrep
    const hourAngle = (now / 5000) % (Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(hourAngle - Math.PI / 2) * size * 0.45, cy + Math.sin(hourAngle - Math.PI / 2) * size * 0.45);
    ctx.stroke();
    // Yelkovan
    const minAngle = (now / 800) % (Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(minAngle - Math.PI / 2) * size * 0.65, cy + Math.sin(minAngle - Math.PI / 2) * size * 0.65);
    ctx.stroke();
    // Merkez noktası
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawBomb(ctx, cx, cy, size, color, timer) {
    // Bomba gövdesi (gradient)
    const bg = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, size);
    bg.addColorStop(0, '#555555');
    bg.addColorStop(0.7, '#2a2a2a');
    bg.addColorStop(1, '#111111');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy + 1, size, 0, Math.PI * 2);
    ctx.fill();
    // Metalik highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Fitil
    ctx.strokeStyle = '#886644';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx + 5, cy - size - 8, cx + 7, cy - size - 5);
    ctx.stroke();
    // Kıvılcım
    if (timer < 1) {
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.arc(cx + 6, cy - size - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      // Titreşim
      if (timer < 0.5) {
        ctx.fillStyle = '#ff0000' + Math.floor((1 - timer * 2) * 128).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(cx, cy, size + 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  _drawPoison(ctx, cx, cy, size, color) {
    // Zehir damlası (gradient)
    const pg = ctx.createRadialGradient(cx, cy - 2, 0, cx, cy, size);
    pg.addColorStop(0, '#88ff44');
    pg.addColorStop(0.5, color);
    pg.addColorStop(1, '#226600');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx + size, cy, cx, cy + size);
    ctx.quadraticCurveTo(cx - size, cy, cx, cy - size);
    ctx.fill();
    // Baloncuklar
    ctx.fillStyle = '#44ff0033';
    ctx.beginPath();
    ctx.arc(cx - 3, cy + 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4, cy - 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 1, cy + 5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawMagnet(ctx, cx, cy, size, color, now) {
    // Mıknatıs halkası
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI);
    ctx.stroke();
    // Kollar
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx - size, cy - size * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + size, cy);
    ctx.lineTo(cx + size, cy - size * 0.6);
    ctx.stroke();
    // Manyetik çizgiler (dönen)
    ctx.strokeStyle = color + '44';
    ctx.lineWidth = 1;
    const t = now / 300;
    for (let i = 0; i < 3; i++) {
      const angle = t + (i * Math.PI * 2) / 3;
      const r = size + 4;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  _drawLucky(ctx, cx, cy, size, now) {
    // Gökkuşağı yıldızı
    const hue = (now / 10) % 360;
    ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
    this._drawMiniStar(ctx, cx, cy, size);
    // İç parıltı
    ctx.fillStyle = '#ffffff88';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawStar(ctx, cx, cy, size, color, now) {
    const rotation = now / 1000;
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    this._drawMiniStar(ctx, 0, 0, size);
    ctx.restore();
    // Glow halkası
    ctx.strokeStyle = color + '66';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, size + 3, 0, Math.PI * 2);
    ctx.stroke();
  },

  _drawCoin(ctx, cx, cy, size, color, now) {
    // 3D flip efekti
    const scaleX = Math.abs(Math.cos(now / 500));
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleX, 1);
    // Coin gövdesi
    const grad = ctx.createRadialGradient(-2, -2, 0, 0, 0, size);
    grad.addColorStop(0, '#ffee88');
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, '#aa8800');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    // "C" harfi
    ctx.fillStyle = '#aa8800';
    ctx.font = `bold ${(size * 1.2) | 0}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', 0, 1);
    ctx.restore();
  },

  _drawMiniStar(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? r : r * 0.4;
      const angle = (Math.PI * i) / 5 - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  },

  clear() {
    this._items = [];
    this._spawnTimer = 0;
  },

  get items() { return this._items; }
};
