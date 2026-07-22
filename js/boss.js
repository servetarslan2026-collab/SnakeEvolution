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

    if (this.active.hp <= 0 && !this.active.dying) {
      this.active.dying = true;
      this.active.deathTimer = 2.0;
      this.active.alive = false;
      G.Engine.notify('🏆 ' + this.active.name + ' YENİLDİ! +50', '#ffaa00', 4);
      G.Engine.score += 50;
      G.Stats.onBossKill();
      G.Audio.playTone(800, 0.2);
      // Boss ölüm efekti: devasa patlama
      const bx = this.active.rx * G.Engine.GS + G.Engine.GS / 2;
      const by = this.active.ry * G.Engine.GS + G.Engine.GS / 2;
      G.Particles.burst(bx, by, this.active.color, 25);
      G.Particles.burst(bx, by, '#ffaa00', 20);
      G.Particles.burst(bx, by, '#ffffff', 15);
      G.Particles.floatText(bx, by - 30, '+50', '#ffaa00');
      G.Effects.shake(8, 0.5);
      G.Effects.flash('#ffaa00', 0.3);
    }
  },

  update(dt) {
    if (!this.active) return;
    const E = G.Engine;

    // Ölüm animasyonu
    if (this.active.dying) {
      this.active.deathTimer -= dt;
      this.active.anim += dt;
      // Patlama parçacıkları
      if (Math.random() < 0.3) {
        const gs = E.GS;
        const bx = this.active.rx * gs + gs / 2 + (Math.random() - 0.5) * 40;
        const by = this.active.ry * gs + gs / 2 + (Math.random() - 0.5) * 40;
        G.Particles.burst(bx, by, this.active.color, 4);
      }
      if (this.active.deathTimer <= 0) {
        this.active = null;
      }
      return;
    }
    if (!this.active.alive) return;
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

    // ============ BOSS ÖZEL SALDIRILARI ============
    if (!this.active.projectiles) this.active.projectiles = [];
    if (!this.active.attackTimer) this.active.attackTimer = 0;
    this.active.attackTimer += dt;

    // Faz 1: Her 3 sn'de tek mermi
    // Faz 2: Her 2 sn'de 3 mermi (yaylı)
    // Faz 3: Her 1.5 sn'de 5 mermi (daire)
    const attackInterval = this.active.phase >= 2 ? 1.5 : this.active.phase >= 1 ? 2 : 3;
    if (this.active.attackTimer >= attackInterval) {
      this.active.attackTimer = 0;
      const b = this.active;
      const bulletSpeed = 3 + this.active.phase;

      if (this.active.phase >= 2) {
        // Faz 3: 5 mermi daire şeklinde
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 / 5) * i + this.active.anim;
          this.active.projectiles.push({
            x: b.x, y: b.y,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed,
            life: 3, color: b.color
          });
        }
      } else if (this.active.phase >= 1) {
        // Faz 2: 3 mermi yaylı
        const baseAngle = Math.atan2(dy, dx);
        for (let i = -1; i <= 1; i++) {
          const angle = baseAngle + i * 0.3;
          this.active.projectiles.push({
            x: b.x, y: b.y,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed,
            life: 3, color: b.color
          });
        }
      } else {
        // Faz 1: tek mermi oyuncuya doğru
        const angle = Math.atan2(dy, dx);
        this.active.projectiles.push({
          x: b.x, y: b.y,
          vx: Math.cos(angle) * bulletSpeed,
          vy: Math.sin(angle) * bulletSpeed,
          life: 3, color: b.color
        });
      }
      G.Audio.playTone(300, 0.1, 'square');
    }

    // Mermileri güncelle
    for (let i = this.active.projectiles.length - 1; i >= 0; i--) {
      const p = this.active.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) { this.active.projectiles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Sınır kontrolü
      if (p.x < 0 || p.x >= E.W / E.GS || p.y < 0 || p.y >= E.H / E.GS) {
        this.active.projectiles.splice(i, 1);
        continue;
      }
      // Oyuncuya çarpma
      if (G.Snake.invTimer <= 0 && G.Utils.dist(G.Snake.head().x, G.Snake.head().y, p.x, p.y) < 1.5) {
        G.Snake.takeDamage(1, 'boss_bullet');
        this.active.projectiles.splice(i, 1);
      }
    }

    // Player collision (büyük hitbox)
    const bossDist = G.Utils.dist(G.Snake.head().x, G.Snake.head().y, this.active.x, this.active.y);
    if (G.Snake.invTimer <= 0 && bossDist < 2.5) {
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
    if (!this.active) return;
    if (!this.active.alive && !this.active.dying) return;
    const E = G.Engine;
    const gs = E.GS;
    const b = this.active;
    let cx = b.rx * gs + gs / 2;
    let cy = b.ry * gs + gs / 2;
    const sz = gs * 1.5;
    const t = b.anim;
    const PI2 = Math.PI * 2;
    const glowOn = G.Save.data.settings.glow !== false;
    const hpPct = b.hp / b.maxHp;

    ctx.save();

    // ============ DEATH ANIMATION ============
    if (b.dying) {
      const deathPct = b.deathTimer / 1.5;
      ctx.globalAlpha = deathPct;
      // Titreşim
      const shake = (1 - deathPct) * 8;
      cx += (Math.random() - 0.5) * shake;
      cy += (Math.random() - 0.5) * shake;
      // Genişleme
      const expand = 1 + (1 - deathPct) * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(expand, expand);
      ctx.translate(-cx, -cy);
    }

    // ============ SHADOW ============
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + sz + 5, sz * 0.8, sz * 0.2, 0, 0, PI2);
    ctx.fill();

    // ============ DANGER AURA ============
    if (glowOn) {
      const auraSz = sz * 2.5 + Math.sin(t * 2) * 10;
      const aura = ctx.createRadialGradient(cx, cy, sz * 0.5, cx, cy, auraSz);
      aura.addColorStop(0, b.color + '44');
      aura.addColorStop(0.5, b.color + '11');
      aura.addColorStop(1, b.color + '00');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, auraSz, 0, PI2);
      ctx.fill();
    }

    // ============ ORBITING RINGS ============
    ctx.strokeStyle = b.color + '33';
    ctx.lineWidth = 1.5;
    for (let r = 0; r < 3; r++) {
      const rSz = sz * (0.6 + r * 0.3);
      const rSpeed = (r + 1) * 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rSz, t * rSpeed + r, t * rSpeed + r + 3.5);
      ctx.stroke();
    }

    // ============ PHASE PARTICLES ============
    if (b.phase >= 1) {
      for (let p = 0; p < 6; p++) {
        const pa = t * 2 + p * 1.047;
        const pr = sz * 1.3 + Math.sin(t * 3 + p) * 5;
        const px = cx + Math.cos(pa) * pr;
        const py = cy + Math.sin(pa) * pr;
        ctx.fillStyle = b.phase >= 2 ? '#ff004488' : '#ff444444';
        ctx.beginPath();
        ctx.arc(px, py, 2 + b.phase, 0, PI2);
        ctx.fill();
      }
    }

    // ============ MAIN BODY ============
    const bodyG = ctx.createRadialGradient(cx - sz * 0.2, cy - sz * 0.2, sz * 0.1, cx, cy, sz);
    bodyG.addColorStop(0, '#ffffff');
    bodyG.addColorStop(0.2, b.color);
    bodyG.addColorStop(0.7, b.color);
    bodyG.addColorStop(1, '#220011');
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.arc(cx, cy, sz, 0, PI2);
    ctx.fill();

    // Body border
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, sz, 0, PI2);
    ctx.stroke();

    // ============ FACE ============
    // Eyes
    const eyeOx = sz * 0.35;
    const eyeOy = sz * 0.2;
    const eyeSz = sz * 0.18;

    // Eye sockets
    ctx.fillStyle = '#110011';
    ctx.beginPath();
    ctx.arc(cx - eyeOx, cy - eyeOy, eyeSz + 3, 0, PI2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeOx, cy - eyeOy, eyeSz + 3, 0, PI2);
    ctx.fill();

    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - eyeOx, cy - eyeOy, eyeSz, 0, PI2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeOx, cy - eyeOy, eyeSz, 0, PI2);
    ctx.fill();

    // Iris (phase-based color)
    const irisColor = b.phase >= 2 ? '#ff0044' : b.phase >= 1 ? '#ff4400' : b.color;
    const irisG1 = ctx.createRadialGradient(cx - eyeOx, cy - eyeOy, 0, cx - eyeOx, cy - eyeOy, eyeSz * 0.7);
    irisG1.addColorStop(0, '#fff');
    irisG1.addColorStop(0.4, irisColor);
    irisG1.addColorStop(1, '#220000');
    ctx.fillStyle = irisG1;
    ctx.beginPath();
    ctx.arc(cx - eyeOx, cy - eyeOy, eyeSz * 0.7, 0, PI2);
    ctx.fill();

    const irisG2 = ctx.createRadialGradient(cx + eyeOx, cy - eyeOy, 0, cx + eyeOx, cy - eyeOy, eyeSz * 0.7);
    irisG2.addColorStop(0, '#fff');
    irisG2.addColorStop(0.4, irisColor);
    irisG2.addColorStop(1, '#220000');
    ctx.fillStyle = irisG2;
    ctx.beginPath();
    ctx.arc(cx + eyeOx, cy - eyeOy, eyeSz * 0.7, 0, PI2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - eyeOx, cy - eyeOy, eyeSz * 0.3, 0, PI2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeOx, cy - eyeOy, eyeSz * 0.3, 0, PI2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(cx - eyeOx - 2, cy - eyeOy - 2, eyeSz * 0.2, 0, PI2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeOx - 2, cy - eyeOy - 2, eyeSz * 0.2, 0, PI2);
    ctx.fill();

    // Mouth (phase-based)
    if (b.phase >= 1) {
      ctx.strokeStyle = '#220011';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + sz * 0.15, sz * 0.3, 0.2, Math.PI - 0.2);
      ctx.stroke();
      if (b.phase >= 2) {
        // Dişler
        ctx.fillStyle = '#fff';
        for (let tooth = 0; tooth < 4; tooth++) {
          const tx = cx - sz * 0.2 + tooth * sz * 0.13;
          ctx.fillRect(tx, cy + sz * 0.25, 3, 5);
        }
      }
    }

    // ============ HP BAR (ölüm anında gizle) ============
    if (b.dying) { ctx.restore(); return; }
    const bw = gs * 6;
    const bh = 10;
    const bx = cx - bw / 2;
    const by = cy - sz - 20;

    // Bar background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.strokeStyle = b.color + '88';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);

    // Bar fill (gradient)
    const barG = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    barG.addColorStop(0, '#ff0044');
    barG.addColorStop(0.5, hpPct > 0.5 ? '#ff4400' : '#ff0044');
    barG.addColorStop(1, hpPct > 0.25 ? '#ffaa00' : '#ff0022');
    ctx.fillStyle = barG;
    ctx.fillRect(bx, by, bw * hpPct, bh);

    // Bar shine
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(bx, by, bw * hpPct, bh / 2);

    // Boss name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(b.name, cx, by - 5);

    // HP percentage
    ctx.fillStyle = '#ffaaaa';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(Math.ceil(hpPct * 100) + '%', cx, by + bh - 1);

    // Phase indicator
    if (b.phase > 0) {
      const phaseColors = ['', '#ff4400', '#ff0044'];
      ctx.fillStyle = phaseColors[b.phase];
      ctx.font = 'bold 10px Orbitron';
      ctx.fillText('FAZ ' + (b.phase + 1), cx, by - 15);
    }

    ctx.restore();

    // ============ BOSS MERMİLERİ ============
    if (b.projectiles) {
      for (const p of b.projectiles) {
        const px = p.x * gs + gs / 2;
        const py = p.y * gs + gs / 2;
        const pLife = p.life / 3;

        ctx.save();
        ctx.globalAlpha = pLife;

        // Glow
        if (glowOn) {
          const pg = ctx.createRadialGradient(px, py, 0, px, py, 12);
          pg.addColorStop(0, p.color + '66');
          pg.addColorStop(1, p.color + '00');
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(px, py, 12, 0, PI2);
          ctx.fill();
        }

        // Mermi
        const mg = ctx.createRadialGradient(px - 1, py - 1, 0, px, py, 5);
        mg.addColorStop(0, '#fff');
        mg.addColorStop(0.5, p.color);
        mg.addColorStop(1, p.color + '88');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, PI2);
        ctx.fill();

        // Border
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, PI2);
        ctx.stroke();

        ctx.restore();
      }
    }
  }
};
