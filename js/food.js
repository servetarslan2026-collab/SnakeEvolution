// ============================================================
// food.js — Yem Sistemi (düzeltilmiş)
// ============================================================
window.G = window.G || {};

G.Food = {
  items: [],
  spawnTimer: 0,
  maxFood: 8,

  init() {
    this.items = [];
    this.spawnTimer = 0;
    // Spawn initial food
    for (let i = 0; i < 6; i++) {
      this.spawn();
    }
  },

  spawn() {
    if (this.items.length >= this.maxFood) return;
    const types = G.Config.FOOD_TYPES;
    let r = Math.random() * 100;
    let type = types[0];
    for (const t of types) {
      r -= t.w;
      if (r <= 0) { type = t; break; }
    }

    const pos = G.Map.getRandomEmpty();
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
    // Spawn timer
    this.spawnTimer += dt;
    if (this.spawnTimer >= 2) {
      this.spawnTimer = 0;
      this.spawn();
    }

    // Magnet effect
    if (G.Engine.upgrades.includes('magnet') && G.Snake.alive) {
      const head = G.Snake.head();
      for (const f of this.items) {
        if (!f.alive) continue;
        const d = G.Utils.dist(head.x, head.y, f.x, f.y);
        if (d < 5 && d > 0.5) {
          const angle = Math.atan2(head.y - f.y, head.x - f.x);
          f.x += Math.cos(angle) * 0.15;
          f.y += Math.sin(angle) * 0.15;
        }
      }
    }
  },

  checkCollision(nx, ny) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const f = this.items[i];
      if (f.alive && f.x === nx && f.y === ny) {
        G.Engine.collectFood(f);
        this.items.splice(i, 1);
      }
    }
  },

  draw(ctx) {
    const E = G.Engine;
    const gs = E.GS;
    const now = Date.now();

    for (const f of this.items) {
      if (!f.alive) continue;
      const cx = f.x * gs + gs / 2;
      const cy = f.y * gs + gs / 2;
      const pulse = Math.sin(now / 300 + f.anim) * 0.1 + 1;
      const sz = (gs / 2 - 1) * pulse;

      // Outer glow
      ctx.fillStyle = f.color + '33';
      ctx.beginPath();
      ctx.arc(cx, cy, sz + 3, 0, E.PI2);
      ctx.fill();

      // Main circle
      const g = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, sz);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.4, f.color);
      g.addColorStop(1, f.color + '88');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, sz, 0, E.PI2);
      ctx.fill();

      // Emoji
      ctx.font = (sz * 0.65 | 0) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.icon, cx, cy);
    }
  }
};
