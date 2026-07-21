// ============================================================
// enemies.js — Düşman Sistemi (düzeltilmiş AI)
// ============================================================
window.G = window.G || {};

G.Enemies = {
  list: [],
  spawnTimer: 0,

  init() {
    this.list = [];
    this.spawnTimer = 0;
  },

  spawn() {
    const E = G.Engine;
    const types = G.Config.ENEMY_TYPES;
    // Biome-based enemy availability
    const available = types.filter((_, i) => {
      if (E.currentBiome === 0) return i < 3;
      if (E.currentBiome === 1) return i < 4;
      if (E.currentBiome === 2) return i < 5;
      return true;
    });
    const def = available[G.Utils.rndInt(0, available.length - 1)];

    const head = G.Snake.head();
    let tries = 0;
    let x, y;
    do {
      x = G.Utils.rndInt(3, (E.W / E.GS) - 4);
      y = G.Utils.rndInt(3, (E.H / E.GS) - 4);
      tries++;
    } while ((G.Map.getTile(x, y) !== 0 || G.Utils.dist(x, y, head.x, head.y) < 10) && tries < 50);
    if (tries >= 50) return;

    this.list.push({
      x, y, rx: x, ry: y,
      type: def.type,
      speed: def.speed,
      hp: def.hp,
      color: def.color,
      ai: def.ai,
      alive: true,
      moveTimer: 0,
      anim: 0,
      dir: { x: 0, y: -1 },
      wanderTimer: 0
    });
  },

  update(dt) {
    const E = G.Engine;
    if (!G.Snake.alive) return;

    // Spawn timer
    this.spawnTimer += dt;
    if (this.spawnTimer >= 12 && this.list.length < 4) {
      this.spawnTimer = 0;
      this.spawn();
    }

    for (const e of this.list) {
      if (!e.alive) continue;
      e.anim += dt;

      // Smooth interpolation
      e.rx = G.Utils.lerp(e.rx, e.x, Math.min(1, dt * 8));
      e.ry = G.Utils.lerp(e.ry, e.y, Math.min(1, dt * 8));

      // Movement
      e.moveTimer += dt;
      const moveInterval = 1 / Math.max(0.5, e.speed);

      if (e.moveTimer >= moveInterval) {
        e.moveTimer = 0;

        // AI behavior
        const head = G.Snake.head();
        const dx = head.x - e.x;
        const dy = head.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (e.ai === 'chase' && dist < 15) {
          if (Math.abs(dx) > Math.abs(dy)) {
            e.dir = { x: dx > 0 ? 1 : -1, y: 0 };
          } else {
            e.dir = { x: 0, y: dy > 0 ? 1 : -1 };
          }
        } else if (e.ai === 'wander') {
          e.wanderTimer -= 1;
          if (e.wanderTimer <= 0) {
            e.dir = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }][G.Utils.rndInt(0, 3)];
            e.wanderTimer = G.Utils.rndInt(3, 8);
          }
        } else if (e.ai === 'ghost') {
          if (Math.random() < 0.5) {
            if (Math.abs(dx) > Math.abs(dy)) {
              e.dir = { x: dx > 0 ? 1 : -1, y: 0 };
            } else {
              e.dir = { x: 0, y: dy > 0 ? 1 : -1 };
            }
          }
        } else if (e.ai === 'turret') {
          // Turret: don't move, but check if player is in line of sight
          if (dist < 15 && (Math.abs(dx) < 2 || Math.abs(dy) < 2)) {
            // Player in line of sight - deal damage periodically
            if (!e.shootTimer) e.shootTimer = 0;
            e.shootTimer += dt;
            if (e.shootTimer >= 2) { // Every 2 seconds
              e.shootTimer = 0;
              if (G.Snake.invTimer <= 0) {
                G.Snake.takeDamage(1, 'turret');
                G.Engine.notify('🎯 Lazer!', '#4488ff');
              }
            }
          }
        }

        // Move
        let nx = e.x + e.dir.x;
        let ny = e.y + e.dir.y;

        if (e.ai === 'ghost') {
          // Wrap around
          const COLS = E.W / E.GS;
          const ROWS = E.H / E.GS;
          nx = ((nx % COLS) + COLS) % COLS;
          ny = ((ny % ROWS) + ROWS) % ROWS;
        } else {
          // Check bounds and tiles
          if (nx < 1 || nx >= E.W / E.GS - 1 || ny < 1 || ny >= E.H / E.GS - 1) continue;
          if (G.Map.getTile(nx, ny) !== 0) continue;
        }

        e.x = nx;
        e.y = ny;
      }

      // Player collision
      if (G.Snake.invTimer <= 0 && G.Utils.dist(G.Snake.head().x, G.Snake.head().y, e.x, e.y) < 1.5) {
        G.Snake.takeDamage(1, 'enemy');
        // Push enemy back
        e.x += e.dir.x * -3;
        e.y += e.dir.y * -3;
        e.rx = e.x;
        e.ry = e.y;
      }
    }
  },

  draw(ctx) {
    const E = G.Engine;
    const gs = E.GS;

    for (const e of this.list) {
      if (!e.alive) continue;
      const cx = e.rx * gs + gs / 2;
      const cy = e.ry * gs + gs / 2;
      const sz = gs / 2 - 2;

      ctx.save();
      if (e.ai === 'ghost') ctx.globalAlpha = 0.4 + Math.sin(e.anim * 3) * 0.2;

      const g = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, sz);
      g.addColorStop(0, e.color);
      g.addColorStop(1, e.color + '88');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, sz * 0.8, 0, E.PI2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#f00';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 3, 2, 0, E.PI2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 3, cy - 3, 2, 0, E.PI2);
      ctx.fill();

      ctx.restore();
    }
  }
};
