// ============================================================
// boss.js — Boss Sistemi
// ============================================================
window.G = window.G || {};

G.Boss = {
  active: null,

  init() {
    this.active = null;
  },

  isActive() {
    return this.active !== null && this.active.alive;
  },

  spawn() {
    const E = G.Engine;
    const bossIdx = Math.min(Math.floor(E.level / 5) - 1, G.Config.BOSS_TYPES.length - 1);
    if (bossIdx < 0) return;
    const def = G.Config.BOSS_TYPES[bossIdx];
    this.active = {
      x: (E.W / E.GS / 2) | 0,
      y: 5,
      rx: (E.W / E.GS / 2) | 0,
      ry: 5,
      hp: def.hp + E.level * 2,
      maxHp: def.hp + E.level * 2,
      color: def.color,
      name: def.name,
      anim: 0,
      phase: 0,
      alive: true
    };
    E.notify('⚠️ ' + def.name + ' GELİYOR!', '#ff0044');
  },

  hit(dmg) {
    if (!this.active || !this.active.alive) return;
    this.active.hp -= dmg;
    G.Particles.burst(this.active.rx * G.Engine.GS + G.Engine.GS / 2, this.active.ry * G.Engine.GS + G.Engine.GS / 2, this.active.color, 6);

    // Faz geçişi kontrolü
    const hpPct = this.active.hp / this.active.maxHp;
    if (hpPct < 0.5 && this.active.phase === 0) {
      this.active.phase = 1;
      G.Engine.notify('💢 FAZ 2! Hız arttı!', '#ff4444');
    }
    if (hpPct < 0.25 && this.active.phase === 1) {
      this.active.phase = 2;
      G.Engine.notify('💀 FAZ 3! Çok tehlikeli!', '#ff0044');
    }

    if (this.active.hp <= 0) {
      G.Particles.burst(this.active.rx * G.Engine.GS + G.Engine.GS / 2, this.active.ry * G.Engine.GS + G.Engine.GS / 2, '#ffaa00', 20);
      G.Engine.notify('🏆 ' + this.active.name + ' YENİLDİ! +50', '#ffaa00');
      this.active = null;
      G.Engine.score += 50;
      G.Stats.onBossKill();
      G.Audio.playTone(800, 0.2);
    }
  },

  update(dt) {
    if (!this.active || !this.active.alive) return;
    const E = G.Engine;
    this.active.anim += dt;

    // Faz bazlı hareket hızı
    const speedMult = 1 + this.active.phase * 0.3;
    const head = G.Snake.head();
    const dx = head.x - this.active.x;
    const dy = head.y - this.active.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Boss AI: yaklaştığında geri çek, uzakken yaklaş
    if (dist < 5) {
      // Geri çekil
      this.active.x -= Math.sign(dx) * dt * 1.5 * speedMult;
      this.active.y -= Math.sign(dy) * dt * 1.5 * speedMult;
    } else if (dist > 10) {
      // Yaklaş
      this.active.x += Math.sign(dx) * dt * 1.2 * speedMult;
      this.active.y += Math.sign(dy) * dt * 1.2 * speedMult;
    } else {
      // Dairesel hareket
      this.active.x += Math.cos(this.active.anim * 2) * dt * 2;
      this.active.y += Math.sin(this.active.anim * 2) * dt * 2;
    }

    // Smooth interpolation
    this.active.rx = G.Utils.lerp(this.active.rx, this.active.x, Math.min(1, dt * 6));
    this.active.ry = G.Utils.lerp(this.active.ry, this.active.y, Math.min(1, dt * 6));

    // Clamp to bounds
    this.active.x = G.Utils.clamp(this.active.x, 2, E.W / E.GS - 3);
    this.active.y = G.Utils.clamp(this.active.y, 2, E.H / E.GS - 3);

    // Player collision
    if (G.Snake.invTimer <= 0 && G.Utils.dist(G.Snake.head().x, G.Snake.head().y, Math.round(this.active.x), Math.round(this.active.y)) < 2) {
      G.Snake.takeDamage(1, 'boss');
    }

    // Phase transitions
    const hpPct = this.active.hp / this.active.maxHp;
    if (hpPct < 0.5 && this.active.phase === 0) {
      this.active.phase = 1;
      E.notify('💢 FAZ 2! Hız arttı!', '#ff4444');
    }
    if (hpPct < 0.25 && this.active.phase === 1) {
      this.active.phase = 2;
      E.notify('💀 FAZ 3! Çok tehlikeli!', '#ff0044');
    }
  },

  draw(ctx) {
    if (!this.active || !this.active.alive) return;
    const E = G.Engine;
    const gs = E.GS;
    const cx = this.active.rx * gs + gs / 2;
    const cy = this.active.ry * gs + gs / 2;
    const sz = gs * 1.3;

    ctx.save();

    // Body
    const g = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, sz);
    g.addColorStop(0, '#ff88aa');
    g.addColorStop(0.5, this.active.color);
    g.addColorStop(1, '#880022');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, sz, 0, E.PI2);
    ctx.fill();

    // Pattern
    ctx.strokeStyle = this.active.color + '44';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, sz * (0.3 + i * 0.2), this.active.anim + i * 2, this.active.anim + i * 2 + 4);
      ctx.stroke();
    }

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - sz * 0.3, cy - sz * 0.2, 6, 0, E.PI2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + sz * 0.3, cy - sz * 0.2, 6, 0, E.PI2);
    ctx.fill();
    ctx.fillStyle = this.active.color;
    ctx.beginPath();
    ctx.arc(cx - sz * 0.3, cy - sz * 0.2, 3, 0, E.PI2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + sz * 0.3, cy - sz * 0.2, 3, 0, E.PI2);
    ctx.fill();

    // HP bar
    const bw = gs * 5;
    const bh = 8;
    const bx = cx - bw / 2;
    const by = cy - sz - 15;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#ff0044';
    ctx.fillRect(bx, by, bw * (this.active.hp / this.active.maxHp), bh);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(this.active.name, cx, by - 4);

    ctx.restore();
  }
};
