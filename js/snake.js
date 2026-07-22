// ============================================================
// snake.js — Yılan Sistemi (düzeltilmiş)
// ============================================================
window.G = window.G || {};

G.Snake = {
  segments: [],
  renderPos: [],
  dir: { x: 0, y: -1 },
  nextDir: { x: 0, y: -1 },
  dirQueue: [],
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
    this.segments = [{ x: cx, y: cy }, { x: cx, y: cy - 1 }, { x: cx, y: cy - 2 }];
    this.renderPos = this.segments.map(s => ({ x: s.x, y: s.y }));
    this.dir = { x: 0, y: 1 };
    this.nextDir = { x: 0, y: 1 };
    this.dirQueue = [];
    this.speed = G.Config.START_SPEED || 4;
    this.moveTimer = 0;
    this.targetLength = 3;
    this.hp = 4;
    this.maxHp = 4;
    this.invTimer = 3; // 3 sn dokunulmazlık
    this.alive = true;
    this.secondLifeUsed = false;
    this.dashCooldown = 0;
    this.tileEffectTimer = 0;
    this.iceDir = null;
    this._armorTimer = 0;
    this._regenTimer = 0;
    this._momentumTimer = 0;
    this.clone = null;
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

    // Armor: hasar azaltma (2 sn boyunca)
    if (this._armorTimer > 0) {
      amount = Math.max(0, amount - 1);
      if (amount <= 0) {
        G.Engine.notify('🛡️ Zırh engelledi!', '#0088ff');
        return;
      }
    }

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

    // Regen: her 10 sn'de 1 can
    if (E.upgrades.includes('regen')) {
      if (!this._regenTimer) this._regenTimer = 0;
      this._regenTimer += dt;
      if (this._regenTimer >= 10 && this.hp < this.maxHp) {
        this._regenTimer = 0;
        this.heal(1);
        E.notify('💚 +1 Can (Regen)', '#44ff88');
      }
    }

    // Momentum: durmadan hızlan
    if (E.upgrades.includes('momentum')) {
      if (!this._momentumTimer) this._momentumTimer = 0;
      this._momentumTimer += dt;
      if (this._momentumTimer >= 3) {
        this._momentumTimer = 0;
        this.speed = Math.min((G.Config.MAX_SPEED || 9) + 2, this.speed * 1.05);
      }
    }

    // Armor timer
    if (this._armorTimer > 0) this._armorTimer -= dt;

    // Smooth interpolation — kayarak hareket
    for (let i = 0; i < this.segments.length; i++) {
      if (this.renderPos[i]) {
        const lerpSpeed = i === 0 ? 10 : 8; // Daha yavaş = daha kaygan
        this.renderPos[i].x = G.Utils.lerp(this.renderPos[i].x, this.segments[i].x, Math.min(1, dt * lerpSpeed));
        this.renderPos[i].y = G.Utils.lerp(this.renderPos[i].y, this.segments[i].y, Math.min(1, dt * lerpSpeed));
      }
    }

    // Movement
    this.moveTimer += dt;
    const interval = 1 / this.speed;

    while (this.moveTimer >= interval) {
      this.moveTimer -= interval;

      // Apply direction from queue (ice blocks direction change)
      if (!this.iceDir && this.dirQueue.length > 0) {
        const next = this.dirQueue.shift();
        if (this.dir.x !== -next.x || this.dir.y !== -next.y) {
          this.dir = next;
          this.nextDir = next;
        }
      } else if (!this.iceDir) {
        if (this.dir.x !== -this.nextDir.x || this.dir.y !== -this.nextDir.y) {
          this.dir = { ...this.nextDir };
        }
      }

      const head = this.head();
      let nx = head.x + this.dir.x;
      let ny = head.y + this.dir.y;

      // Boundary check — kenarlardan geç (wrap around)
      const COLS = E.W / E.GS;
      const ROWS = E.H / E.GS;
      if (nx < 0) nx = COLS - 1;
      if (nx >= COLS) nx = 0;
      if (ny < 0) ny = ROWS - 1;
      if (ny >= ROWS) ny = 0;

      // Tile check
      const tile = G.Map.getTile(nx, ny);

      // Ghost mode: duvarlardan geç
      if (this.invTimer > 0 && E.upgrades.includes('ghost')) {
        // Tüm tile'ları geç
      } else if (this.invTimer > 0) {
        // Invincible iken sadece duvarı atla, lava/elektriğe gir
        if (tile === 1) continue;
        if (tile === 2) continue;
      } else {
        // Normal tile kontrolü
        if (tile === 1) { // Duvar = ölüm
          this.takeDamage(1, 'wall');
          return;
        }
        if (tile === 2) { // Kaya = dur
          continue;
        }
        // Lava (3) ve Elektrik (7): geçilebilir, hasar checkTileEffects'ta
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

      // Fire/Ice/Poison/Elec Tail: düşman etkileşimi
      if (this.segments.length > 2) {
        const tailX = this.segments[this.segments.length - 1].x;
        const tailY = this.segments[this.segments.length - 1].y;
        for (const e of G.Enemies.list) {
          if (!e.alive) continue;
          if (e.x === tailX && e.y === tailY) {
            if (E.upgrades.includes('fireTail')) {
              e.hp -= 2;
              G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#ff4400', 5);
              E.notify('🔥 Ateş hasar!', '#ff4400');
            }
            if (E.upgrades.includes('iceTail')) {
              e.speed = Math.max(0.3, e.speed * 0.5);
              G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#00ccff', 5);
              E.notify('❄️ Buzladı!', '#00ccff');
            }
            if (E.upgrades.includes('poisonTail')) {
              e._poisoned = true;
              e._poisonTimer = 5;
              G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#44ff00', 5);
              E.notify('☠️ Zehirledi!', '#44ff00');
            }
            if (E.upgrades.includes('elecTail')) {
              e.speed = 0;
              e._stunTimer = 2;
              G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#ffe14d', 5);
              E.notify('⚡ Sersemletti!', '#ffe14d');
            }
            if (e.hp <= 0) {
              e.alive = false;
              G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, e.color, 10);
              E.score += 15;
              E.notify('💀 Düşman öldü! +15', '#ff4444');
            }
          }
        }
      }
    }

    // Clone update
    this.updateClone(dt);

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
    const glowOn = G.Save.data.settings.glow !== false;
    const len = this.segments.length;
    const isRainbow = skin.rainbow === true;
    const rainbowHue = (now / 10) % 360;
    const thick = E.upgrades.includes('thickTail');

    // ============ NEON TRAIL ============
    if (glowOn && len > 2) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let layer = 3; layer >= 0; layer--) {
        const widths = [gs * 1.4, gs * 1.0, gs * 0.6, gs * 0.3];
        const alphas = [0.04, 0.1, 0.2, 0.35];
        ctx.lineWidth = widths[layer];
        ctx.strokeStyle = skin.glow;
        ctx.globalAlpha = alphas[layer];
        ctx.beginPath();
        const s0 = this.renderPos[0] || this.segments[0];
        ctx.moveTo(s0.x * gs + gs / 2, s0.y * gs + gs / 2);
        for (let i = 1; i < len; i++) {
          const s = this.renderPos[i] || this.segments[i];
          ctx.lineTo(s.x * gs + gs / 2, s.y * gs + gs / 2);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // ============ CONNECTED BODY (bağlı segmentler) ============
    // Önce gölge katmanı
    if (glowOn) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = len - 1; i >= 1; i--) {
        const s = this.renderPos[i] || this.segments[i];
        const px = s.x * gs + gs / 2;
        const py = s.y * gs + gs / 2;
        const segT = i / Math.max(1, len - 1);
        const baseSz = thick ? (gs / 2 - 1) : (gs / 2 - 2);
        const sz = baseSz * (1 - segT * 0.35);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(px + 2, py + 3, sz + 1, 0, E.PI2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Bağlı gövde çizimi (kuyruktan kafaya)
    for (let i = len - 1; i >= 1; i--) {
      const s = this.renderPos[i] || this.segments[i];
      const px = s.x * gs + gs / 2;
      const py = s.y * gs + gs / 2;
      const segT = i / Math.max(1, len - 1);
      const baseSz = thick ? (gs / 2 - 1) : (gs / 2 - 2);
      const sz = baseSz * (1 - segT * 0.35);

      ctx.save();

      // Invincible shimmer
      if (this.invTimer > 0) {
        const shimmer = Math.sin(now / 80 + i * 0.8) * 0.3 + 0.5;
        ctx.globalAlpha = shimmer;
      }

      // Segment rengi
      const segHue = isRainbow ? (rainbowHue + i * 15) % 360 : 0;
      const headColor = isRainbow ? `hsl(${segHue},100%,50%)` : skin.head;
      const bodyColor = isRainbow ? `hsl(${segHue},80%,35%)` : skin.body;

      // Bağlantı çizgisi (önceki segmentle)
      if (i < len - 1) {
        const prev = this.renderPos[i + 1] || this.segments[i + 1];
        const ppx = prev.x * gs + gs / 2;
        const ppy = prev.y * gs + gs / 2;
        const prevSegT = (i + 1) / Math.max(1, len - 1);
        const prevSz = baseSz * (1 - prevSegT * 0.35);
        const connW = Math.min(sz, prevSz) * 1.8;
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = connW;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ppx, ppy);
        ctx.lineTo(px, py);
        ctx.stroke();
        // Bağlantı highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = connW * 0.6;
        ctx.beginPath();
        ctx.moveTo(ppx, ppy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }

      // Gövde segmenti (3D gradient)
      const bg = ctx.createRadialGradient(px - sz * 0.3, py - sz * 0.35, 0, px, py, sz);
      const lightColor = isRainbow ? `hsl(${segHue},100%,65%)` : this._lighten(skin.head, 40);
      bg.addColorStop(0, lightColor);
      bg.addColorStop(0.4, headColor);
      bg.addColorStop(0.8, bodyColor);
      bg.addColorStop(1, this._darken(skin.body, 20));
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(px, py, sz, 0, E.PI2);
      ctx.fill();

      // Pul deseni (diamond pattern)
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.moveTo(px, py - sz * 0.4);
        ctx.lineTo(px + sz * 0.3, py);
        ctx.lineTo(px, py + sz * 0.4);
        ctx.lineTo(px - sz * 0.3, py);
        ctx.closePath();
        ctx.fill();
      }
      if (i % 3 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.arc(px + sz * 0.2, py + sz * 0.2, sz * 0.25, 0, E.PI2);
        ctx.fill();
      }

      // 3D highlight (üst)
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.ellipse(px - sz * 0.15, py - sz * 0.25, sz * 0.35, sz * 0.2, -0.3, 0, E.PI2);
      ctx.fill();

      // Alt gölge
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.ellipse(px + sz * 0.1, py + sz * 0.3, sz * 0.3, sz * 0.15, 0.2, 0, E.PI2);
      ctx.fill();

      // Border (ince)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(px, py, sz, 0, E.PI2);
      ctx.stroke();

      // Tail effects
      if (E.upgrades.includes('fireTail') && i > len * 0.6) {
        const ft = (now / 100 + i) % (Math.PI * 2);
        ctx.fillStyle = `rgba(255,100,0,${0.15 + Math.sin(ft) * 0.1})`;
        ctx.beginPath();
        ctx.arc(px + Math.sin(ft) * 2, py + Math.cos(ft) * 2, sz + 3, 0, E.PI2);
        ctx.fill();
      }
      if (E.upgrades.includes('iceTail') && i > len * 0.6) {
        ctx.fillStyle = 'rgba(0,200,255,0.15)';
        ctx.beginPath();
        ctx.arc(px, py, sz + 2, 0, E.PI2);
        ctx.fill();
        // Buz kristalleri
        if (i % 2 === 0) {
          ctx.strokeStyle = 'rgba(0,200,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px - sz, py);
          ctx.lineTo(px + sz, py);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px, py - sz);
          ctx.lineTo(px, py + sz);
          ctx.stroke();
        }
      }
      if (E.upgrades.includes('poisonTail') && i > len * 0.6) {
        const pt = Math.sin(now / 200 + i) * 0.1 + 0.15;
        ctx.fillStyle = `rgba(68,255,0,${pt})`;
        ctx.beginPath();
        ctx.arc(px, py, sz + 2, 0, E.PI2);
        ctx.fill();
      }
      if (E.upgrades.includes('elecTail') && i > len * 0.5 && Math.random() < 0.3) {
        ctx.strokeStyle = '#ffe14d88';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const ex = px + (Math.random() - 0.5) * 15;
        const ey = py + (Math.random() - 0.5) * 15;
        ctx.moveTo(px, py);
        ctx.lineTo(ex, ey);
        ctx.lineTo(ex + (Math.random() - 0.5) * 8, ey + (Math.random() - 0.5) * 8);
        ctx.stroke();
      }

      ctx.restore();
    }

    // ============ HEAD ============
    {
      const s = this.renderPos[0] || this.segments[0];
      const px = s.x * gs + gs / 2;
      const py = s.y * gs + gs / 2;
      const hsz = gs / 2 - 1;

      ctx.save();

      // Invincible shimmer
      if (this.invTimer > 0) {
        const shimmer = Math.sin(now / 80) * 0.3 + 0.5;
        ctx.globalAlpha = shimmer;
      }

      // Head shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(px + 2, py + 3, hsz + 2, hsz * 0.6, 0, 0, E.PI2);
      ctx.fill();

      // Head glow aura
      if (glowOn) {
        const auraG = ctx.createRadialGradient(px, py, hsz, px, py, hsz * 2.2);
        auraG.addColorStop(0, skin.glow + '33');
        auraG.addColorStop(1, skin.glow + '00');
        ctx.fillStyle = auraG;
        ctx.beginPath();
        ctx.arc(px, py, hsz * 2.2, 0, E.PI2);
        ctx.fill();
      }

      // Head body
      const hg = ctx.createRadialGradient(px - hsz * 0.3, py - hsz * 0.3, hsz * 0.1, px, py, hsz + 2);
      hg.addColorStop(0, this._lighten(skin.head, 50));
      hg.addColorStop(0.4, skin.head);
      hg.addColorStop(0.8, skin.body);
      hg.addColorStop(1, this._darken(skin.body, 30));
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(px, py, hsz + 2, 0, E.PI2);
      ctx.fill();

      // Head highlight
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(px - hsz * 0.25, py - hsz * 0.35, hsz * 0.4, hsz * 0.25, -0.5, 0, E.PI2);
      ctx.fill();

      // Head border
      ctx.strokeStyle = skin.glow + '44';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, hsz + 2, 0, E.PI2);
      ctx.stroke();

      // ============ EYES ============
      const eo = hsz * 0.38;
      const es = hsz * 0.26;
      const lx = px + this.dir.x * 4 - this.dir.y * eo;
      const ly = py + this.dir.y * 4 + this.dir.x * eo;
      const rx = px + this.dir.x * 4 + this.dir.y * eo;
      const ry = py + this.dir.y * 4 - this.dir.x * eo;

      // Eye whites
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(lx, ly, es + 2.5, 0, E.PI2); ctx.fill();
      ctx.beginPath(); ctx.arc(rx, ry, es + 2.5, 0, E.PI2); ctx.fill();

      // Eye iris
      const irisG1 = ctx.createRadialGradient(lx, ly, 0, lx, ly, es + 1);
      irisG1.addColorStop(0, '#fff');
      irisG1.addColorStop(0.3, skin.glow);
      irisG1.addColorStop(1, this._darken(skin.glow, 40));
      ctx.fillStyle = irisG1;
      ctx.beginPath();
      ctx.arc(lx + this.dir.x * 1.5, ly + this.dir.y * 1.5, es + 1, 0, E.PI2);
      ctx.fill();

      const irisG2 = ctx.createRadialGradient(rx, ry, 0, rx, ry, es + 1);
      irisG2.addColorStop(0, '#fff');
      irisG2.addColorStop(0.3, skin.glow);
      irisG2.addColorStop(1, this._darken(skin.glow, 40));
      ctx.fillStyle = irisG2;
      ctx.beginPath();
      ctx.arc(rx + this.dir.x * 1.5, ry + this.dir.y * 1.5, es + 1, 0, E.PI2);
      ctx.fill();

      // Pupil (slit)
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(lx + this.dir.x * 2.5, ly + this.dir.y * 2.5, es * 0.3, es * 0.6, Math.atan2(this.dir.y, this.dir.x), 0, E.PI2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rx + this.dir.x * 2.5, ry + this.dir.y * 2.5, es * 0.3, es * 0.6, Math.atan2(this.dir.y, this.dir.x), 0, E.PI2);
      ctx.fill();

      // Eye highlight (reflection)
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(lx + this.dir.x * 0.5 - 1.5, ly + this.dir.y * 0.5 - 1.5, es * 0.25, 0, E.PI2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx + this.dir.x * 0.5 - 1.5, ry + this.dir.y * 0.5 - 1.5, es * 0.25, 0, E.PI2);
      ctx.fill();

      // ============ TONGUE ============
      const tongueOut = Math.sin(now / 150) > 0.3;
      if (tongueOut) {
        const tx = px + this.dir.x * (hsz + 5);
        const ty = py + this.dir.y * (hsz + 5);
        const tlen = 8 + Math.sin(now / 100) * 3;
        ctx.strokeStyle = '#ff2244';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + this.dir.x * tlen, ty + this.dir.y * tlen);
        ctx.stroke();
        // Fork
        const fx = tx + this.dir.x * tlen;
        const fy = ty + this.dir.y * tlen;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + this.dir.x * 4 - this.dir.y * 3, fy + this.dir.y * 4 + this.dir.x * 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + this.dir.x * 4 + this.dir.y * 3, fy + this.dir.y * 4 - this.dir.x * 3);
        ctx.stroke();
      }

      ctx.restore();
    }

    // ============ INVINCIBLE SHIELD ============
    if (this.invTimer > 0) {
      const s = this.renderPos[0] || this.segments[0];
      const px = s.x * gs + gs / 2;
      const py = s.y * gs + gs / 2;
      ctx.save();
      const shieldPulse = Math.sin(now / 120) * 0.15 + 0.2;
      ctx.globalAlpha = shieldPulse;
      ctx.strokeStyle = skin.glow;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -now / 30;
      ctx.beginPath();
      ctx.arc(px, py, gs * 0.8, 0, E.PI2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Draw clone
    if (this.clone && this.clone.alive) {
      this.drawClone(ctx);
    }

    // Draw drone (Mini Drone upgrade)
    if (E.upgrades.includes('drone')) {
      this.drawDrone(ctx);
    }
  },

  drawDrone(ctx) {
    const E = G.Engine;
    const gs = E.GS;
    const head = this.renderPos[0] || this.segments[0];
    const hx = head.x * gs + gs / 2;
    const hy = head.y * gs + gs / 2;
    const t = Date.now() / 400;
    const orbitR = 18;
    const dx = hx + Math.cos(t) * orbitR;
    const dy = hy + Math.sin(t) * orbitR;

    ctx.save();
    ctx.globalAlpha = 0.85;

    // Drone body
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, E.PI2);
    ctx.fill();

    // Drone glow
    if (G.Save.data.settings.glow !== false) {
      ctx.fillStyle = '#4488ff33';
      ctx.beginPath();
      ctx.arc(dx, dy, 8, 0, E.PI2);
      ctx.fill();
    }

    // Drone eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(dx, dy, 1.5, 0, E.PI2);
    ctx.fill();

    // Range indicator (hafif)
    ctx.strokeStyle = '#4488ff11';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(hx, hy, 6 * gs, 0, E.PI2);
    ctx.stroke();

    ctx.restore();
  },

  // ============ CLONE SNAKE ============
  spawnClone() {
    const head = this.head();
    this.clone = {
      segments: [
        { x: head.x - 2, y: head.y },
        { x: head.x - 3, y: head.y },
        { x: head.x - 4, y: head.y }
      ],
      renderPos: [
        { x: head.x - 2, y: head.y },
        { x: head.x - 3, y: head.y },
        { x: head.x - 4, y: head.y }
      ],
      dir: { x: 1, y: 0 },
      speed: 5,
      moveTimer: 0,
      alive: true,
      targetLength: 3,
      lifetime: 30,
      timer: 0
    };
    G.Engine.notify('🐍 Klon doğdu!', '#44ff22');
  },

  updateClone(dt) {
    if (!this.clone || !this.clone.alive) return;
    const E = G.Engine;
    const c = this.clone;

    c.timer += dt;
    if (c.timer >= c.lifetime) {
      c.alive = false;
      E.notify('🐍 Klon kayboldu!', '#888888');
      return;
    }

    // Smooth interpolation
    for (let i = 0; i < c.segments.length; i++) {
      if (c.renderPos[i]) {
        c.renderPos[i].x = G.Utils.lerp(c.renderPos[i].x, c.segments[i].x, Math.min(1, dt * 15));
        c.renderPos[i].y = G.Utils.lerp(c.renderPos[i].y, c.segments[i].y, Math.min(1, dt * 15));
      }
    }

    // AI: en yakın yeme doğru hareket
    c.moveTimer += dt;
    const interval = 1 / c.speed;
    if (c.moveTimer >= interval) {
      c.moveTimer = 0;

      // En yakın yemi bul
      let target = null;
      let minDist = Infinity;
      for (const f of G.Food.items) {
        if (!f.alive) continue;
        const d = G.Utils.dist(c.segments[0].x, c.segments[0].y, f.x, f.y);
        if (d < minDist) {
          minDist = d;
          target = f;
        }
      }

      if (target) {
        const dx = target.x - c.segments[0].x;
        const dy = target.y - c.segments[0].y;
        if (Math.abs(dx) > Math.abs(dy)) {
          c.dir = { x: dx > 0 ? 1 : -1, y: 0 };
        } else {
          c.dir = { x: 0, y: dy > 0 ? 1 : -1 };
        }
      }

      // Move
      let nx = c.segments[0].x + c.dir.x;
      let ny = c.segments[0].y + c.dir.y;

      // Wrap around
      const COLS = E.W / E.GS;
      const ROWS = E.H / E.GS;
      if (nx < 0) nx = COLS - 1;
      if (nx >= COLS) nx = 0;
      if (ny < 0) ny = ROWS - 1;
      if (ny >= ROWS) ny = 0;

      // Duvar kontrolü — duvar varsa yön değiştir
      const tile = G.Map.getTile(nx, ny);
      if (G.Map.isBlocking(tile)) {
        // Rastgele yön dene
        const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        for (const d of dirs) {
          const tnx = c.segments[0].x + d.x;
          const tny = c.segments[0].y + d.y;
          if (!G.Map.isBlocking(G.Map.getTile(tnx, tny))) {
            c.dir = d;
            nx = tnx;
            ny = tny;
            break;
          }
        }
        if (G.Map.isBlocking(G.Map.getTile(nx, ny))) return;
      }

      c.segments.unshift({ x: nx, y: ny });
      c.renderPos.unshift({ x: c.renderPos[0].x, y: c.renderPos[0].y });
      while (c.segments.length > c.targetLength) {
        c.segments.pop();
        c.renderPos.pop();
      }

      // Yem topla (sadece XP, skor yok)
      for (let i = G.Food.items.length - 1; i >= 0; i--) {
        const f = G.Food.items[i];
        if (f.alive && f.x === nx && f.y === ny) {
          // Sadece XP ve kuyruk, skor/combo yok
          if (f.xp) E.xp += f.xp;
          if (f.len > 0) c.targetLength += f.len;
          if (f.hp > 0) this.heal(f.hp);
          G.Particles.burst(f.x * E.GS + E.GS / 2, f.y * E.GS + E.GS / 2, '#44ff22', 4);
          G.Food.items.splice(i, 1);
          break;
        }
      }
    }
  },

  drawClone(ctx) {
    if (!this.clone || !this.clone.alive) return;
    const E = G.Engine;
    const gs = E.GS;
    const c = this.clone;

    for (let i = c.segments.length - 1; i >= 0; i--) {
      const s = c.renderPos[i] || c.segments[i];
      const px = s.x * gs + gs / 2;
      const py = s.y * gs + gs / 2;
      const segT = i / Math.max(1, c.segments.length - 1);
      const sz = (gs / 2 - 2) * (1 - segT * 0.25);

      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.15;

      if (i === 0) {
        // Clone HEAD
        const g = ctx.createRadialGradient(px - 2, py - 2, 1, px, py, sz + 2);
        g.addColorStop(0, '#66ff44');
        g.addColorStop(0.7, '#338822');
        g.addColorStop(1, '#33882288');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, sz + 2, 0, E.PI2);
        ctx.fill();

        // Eyes
        const eo = sz * 0.35;
        const es = sz * 0.22;
        const lx = px + c.dir.x * 3 - c.dir.y * eo;
        const ly = py + c.dir.y * 3 + c.dir.x * eo;
        const rx = px + c.dir.x * 3 + c.dir.y * eo;
        const ry = py + c.dir.y * 3 - c.dir.x * eo;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(lx, ly, es + 1, 0, E.PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, ry, es + 1, 0, E.PI2); ctx.fill();
        ctx.fillStyle = '#88ff66';
        ctx.beginPath(); ctx.arc(lx + c.dir.x, ly + c.dir.y, es * 0.6, 0, E.PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx + c.dir.x, ry + c.dir.y, es * 0.6, 0, E.PI2); ctx.fill();
      } else {
        // Clone BODY
        const g = ctx.createRadialGradient(px - 1, py - 1, 0, px, py, sz);
        g.addColorStop(0, '#66ff44');
        g.addColorStop(1, '#338822');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, sz, 0, E.PI2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Lifetime indicator
    const pct = 1 - (c.timer / c.lifetime);
    const barW = 30;
    const bx = c.renderPos[0].x * gs + gs / 2 - barW / 2;
    const by = c.renderPos[0].y * gs - 8;
    ctx.fillStyle = '#00000066';
    ctx.fillRect(bx - 1, by - 1, barW + 2, 4);
    ctx.fillStyle = pct > 0.3 ? '#44ff22' : '#ff4444';
    ctx.fillRect(bx, by, barW * pct, 2);
  },

  // ============ COLOR HELPERS ============
  _lighten(hex, amt) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return '#' + [r, g, b].map(c => Math.min(255, c + amt).toString(16).padStart(2, '0')).join('');
  },
  _darken(hex, amt) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return '#' + [r, g, b].map(c => Math.max(0, c - amt).toString(16).padStart(2, '0')).join('');
  }
};
