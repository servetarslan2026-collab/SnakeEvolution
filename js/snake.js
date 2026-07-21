// ============================================================
// snake.js — Yılan Sistemi (düzeltilmiş)
// ============================================================
window.G = window.G || {};

G.Snake = {
  segments: [],
  renderPos: [],
  dir: { x: 0, y: -1 },
  nextDir: { x: 0, y: -1 },
  speed: 4,
  moveTimer: 0,
  targetLength: 3,
  hp: 4,
  maxHp: 4,
  invTimer: 0,
  alive: true,
  secondLifeUsed: false,
  dashCooldown: 0,
  tileEffectTimer: 0,
  iceDir: null,

  init() {
    const E = G.Engine;
    const cx = E.W / E.GS / 2 | 0;
    const cy = E.H / E.GS / 2 | 0;
    this.segments = [{ x: cx, y: cy }, { x: cx, y: cy + 1 }, { x: cx, y: cy + 2 }];
    this.renderPos = this.segments.map(s => ({ x: s.x, y: s.y }));
    this.dir = { x: 0, y: -1 };
    this.nextDir = { x: 0, y: -1 };
    this.speed = 4;
    this.moveTimer = 0;
    this.targetLength = 3;
    this.hp = 4;
    this.maxHp = 4;
    this.invTimer = 2;
    this.alive = true;
    this.secondLifeUsed = false;
    this.dashCooldown = 0;
    this.tileEffectTimer = 0;
    this.iceDir = null;
  },

  head() {
    return this.segments[0] || { x: 20, y: 15 };
  },

  grow(amount) {
    for (let i = 0; i < amount; i++) {
      this.segments.push({ ...this.segments[this.segments.length - 1] });
      this.renderPos.push({ ...this.renderPos[this.renderPos.length - 1] });
    }
    this.targetLength = this.segments.length;
  },

  shrink(amount) {
    for (let i = 0; i < amount; i++) {
      if (this.segments.length > 3) {
        this.segments.pop();
        this.renderPos.pop();
      }
    }
    this.targetLength = this.segments.length;
  },

  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  },

  takeDamage(amount, source) {
    if (this.invTimer > 0 || !this.alive) return;

    this.hp = Math.max(0, this.hp - amount); // HP asla negatif olmasın
    G.Effects.shake(5, 0.3);
    G.Effects.flash('#ff0044', 0.2);
    G.Particles.burst(this.head().x * G.Engine.GS + G.Engine.GS / 2, this.head().y * G.Engine.GS + G.Engine.GS / 2, '#ff4444', 8);
    G.Audio.playTone(200, 0.15);

    if (this.hp <= 0) {
      if (!this.secondLifeUsed && G.Engine.upgrades.includes('secondLife')) {
        this.secondLifeUsed = true;
        this.hp = Math.ceil(this.maxHp / 2);
        this.invTimer = 3;
        G.Engine.notify('💖 İKİNCİ HAYAT!', '#ff44aa');
      } else {
        this.alive = false;
        G.Engine.die(source || 'unknown');
      }
    } else {
      this.invTimer = 1.5;
      G.Engine.notify('⚠️ -' + amount + ' HP (' + this.hp + '/' + this.maxHp + ')', '#ff4444');
    }
  },

  activateInvincible(duration) {
    this.invTimer = duration;
  },

  update(dt) {
    if (!this.alive) return;
    const E = G.Engine;

    // Start delay
    if (E.startDelay > 0) {
      E.startDelay -= dt;
      return;
    }

    // Smooth interpolation (daha akıcı)
    for (let i = 0; i < this.segments.length; i++) {
      if (this.renderPos[i]) {
        const lerpSpeed = i === 0 ? 20 : 15; // Kafa daha hızlı takip
        this.renderPos[i].x = G.Utils.lerp(this.renderPos[i].x, this.segments[i].x, Math.min(1, dt * lerpSpeed));
        this.renderPos[i].y = G.Utils.lerp(this.renderPos[i].y, this.segments[i].y, Math.min(1, dt * lerpSpeed));
      }
    }

    // Movement
    this.moveTimer += dt;
    const interval = 1 / this.speed;

    while (this.moveTimer >= interval) {
      this.moveTimer -= interval;

      // Apply direction (ice blocks direction change)
      if (!this.iceDir) {
        if (this.dir.x !== -this.nextDir.x || this.dir.y !== -this.nextDir.y) {
          this.dir = { ...this.nextDir };
        }
      }

      const head = this.head();
      let nx = head.x + this.dir.x;
      let ny = head.y + this.dir.y;

      // Boundary check — duvarlara çarpınca DUR + hasar
      const COLS = E.W / E.GS;
      const ROWS = E.H / E.GS;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
        if (this.invTimer > 0) {
          // Ghost mode: duvarlardan geç
          if (nx < 0) nx = COLS - 1;
          if (nx >= COLS) nx = 0;
          if (ny < 0) ny = ROWS - 1;
          if (ny >= ROWS) ny = 0;
        } else {
          this.takeDamage(1, 'wall');
          return;
        }
      }

      // Tile check — engeller
      const tile = G.Map.getTile(nx, ny);
      if (tile === 1) { // Duvar = ölüm
        if (this.invTimer > 0) continue;
        this.takeDamage(1, 'wall');
        return;
      }
      if (tile === 2 || tile === 3 || tile === 7) { // Kaya, lava, elektrik = dur
        continue; // Hareket etme, hasar tile efektlerinden gelir
      }

      // Self collision
      if (this.invTimer <= 0) {
        for (let i = 1; i < this.segments.length; i++) {
          if (this.segments[i].x === nx && this.segments[i].y === ny) {
            this.takeDamage(1, 'self');
            return;
          }
        }
      }

      // Move
      this.segments.unshift({ x: nx, y: ny });
      this.renderPos.unshift({ x: this.renderPos[0] ? this.renderPos[0].x : nx, y: this.renderPos[0] ? this.renderPos[0].y : ny });
      while (this.segments.length > this.targetLength) {
        this.segments.pop();
        this.renderPos.pop();
      }

      // Food collision
      G.Food.checkCollision(nx, ny);
    }

    // Tile effects
    this.checkTileEffects(dt);

    // Timers
    if (this.invTimer > 0) this.invTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
  },

  checkTileEffects(dt) {
    const head = this.head();
    const tile = G.Map.getTile(head.x, head.y);
    this.tileEffectTimer += dt;

    // Lava: damage every 1.5s
    if (tile === 3 && this.tileEffectTimer > 1.5) {
      this.tileEffectTimer = 0;
      this.takeDamage(1, 'lava');
      G.Engine.notify('🔥 Lava!', '#ff4400');
    }

    // Ice: sliding
    if (tile === 4) {
      this.iceDir = { ...this.dir };
    } else {
      this.iceDir = null;
    }

    // Electric: damage every 2s
    if (tile === 7 && this.tileEffectTimer > 2) {
      this.tileEffectTimer = 0;
      this.takeDamage(1, 'electric');
      G.Engine.notify('⚡ Elektrik!', '#ffe14d');
    }
  },

  dash() {
    if (this.dashCooldown > 0 || !G.Engine.upgrades.includes('dash')) return;
    this.dashCooldown = 2;
    for (let i = 0; i < 3; i++) {
      const head = this.head();
      const nx = head.x + this.dir.x;
      const ny = head.y + this.dir.y;
      const tile = G.Map.getTile(nx, ny);
      if (!G.Map.isBlocking(tile)) {
        this.segments.unshift({ x: nx, y: ny });
        this.renderPos.unshift({ x: this.renderPos[0].x, y: this.renderPos[0].y });
        while (this.segments.length > this.targetLength) {
          this.segments.pop();
          this.renderPos.pop();
        }
      }
    }
    G.Particles.burst(this.head().x * G.Engine.GS + G.Engine.GS / 2, this.head().y * G.Engine.GS + G.Engine.GS / 2, '#00ffcc', 8);
    G.Audio.playTone(600, 0.1);
  },

  draw(ctx) {
    if (!this.alive || this.segments.length === 0) return;
    const E = G.Engine;
    const gs = E.GS;
    const now = Date.now();
    const skin = G.Config.SKINS.find(s => s.id === G.Save.data.equippedSkin) || G.Config.SKINS[0];

    for (let i = this.segments.length - 1; i >= 0; i--) {
      const s = this.renderPos[i] || this.segments[i];
      const px = s.x * gs + gs / 2;
      const py = s.y * gs + gs / 2;
      const segT = i / Math.max(1, this.segments.length - 1);
      const sz = (gs / 2 - 2) * (1 - segT * 0.25);

      ctx.save();

      // Invincible blink
      if (this.invTimer > 0 && (now / 100 | 0) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      if (i === 0) {
        // HEAD
        const g = ctx.createRadialGradient(px - 3, py - 3, 1, px, py, sz + 2);
        g.addColorStop(0, skin.head);
        g.addColorStop(0.7, skin.body);
        g.addColorStop(1, skin.body + '88');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, sz + 2, 0, E.PI2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(px - 4, py - 4, sz * 0.3, 0, E.PI2);
        ctx.fill();

        // Eyes
        const eo = sz * 0.35;
        const es = sz * 0.22;
        const lx = px + this.dir.x * 3 - this.dir.y * eo;
        const ly = py + this.dir.y * 3 + this.dir.x * eo;
        const rx = px + this.dir.x * 3 + this.dir.y * eo;
        const ry = py + this.dir.y * 3 - this.dir.x * eo;

        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(lx, ly, es + 2, 0, E.PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, ry, es + 2, 0, E.PI2); ctx.fill();

        ctx.fillStyle = skin.glow;
        ctx.beginPath(); ctx.arc(lx + this.dir.x * 1.5, ly + this.dir.y * 1.5, es * 0.7, 0, E.PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx + this.dir.x * 1.5, ry + this.dir.y * 1.5, es * 0.7, 0, E.PI2); ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(lx + this.dir.x * 2.5, ly + this.dir.y * 2.5, es * 0.4, 0, E.PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx + this.dir.x * 2.5, ry + this.dir.y * 2.5, es * 0.4, 0, E.PI2); ctx.fill();

      } else {
        // BODY
        const g = ctx.createRadialGradient(px - 2, py - 2, 0, px, py, sz);
        g.addColorStop(0, skin.head);
        g.addColorStop(1, skin.body);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, E.PI2);
        ctx.fill();

        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.beginPath();
          ctx.arc(px - 1, py - 1, sz * 0.4, 0, E.PI2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }
};
