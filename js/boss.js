// ============================================================
// boss.js — Boss Sistemi
// ============================================================
window.G = window.G || {};

G.Boss = {
  _active: null,
  _phase: 0,
  _attackTimer: 0,
  _currentAttack: null,
  _attackDuration: 0,
  _attackCooldown: 0, // Saldırılar arası bekleme
  _introTimer: 0,
  _defeatedTimer: 0,
  _projectiles: [],
  _spawnedThisBiome: false,

  init() {
    this._active = null;
    this._phase = 0;
    this._attackTimer = 0;
    this._currentAttack = null;
    this._attackDuration = 0;
    this._introTimer = 0;
    this._defeatedTimer = 0;
    this._projectiles = [];
    this._spawnedThisBiome = false;
  },

  resetForBiome() {
    this._spawnedThisBiome = false;
  },

  /**
   * Boss spawn et
   */
  spawn(bossId) {
    const def = G.Config.BOSS_TYPES.find(b => b.id === bossId);
    if (!def) return;

    const gs = G.Config.GRID_SIZE;
    this._active = {
      ...def,
      x: Math.floor(G.Config.COLS / 2),
      y: Math.floor(G.Config.ROWS / 4),
      currentHp: def.hp,
      maxHp: def.hp,
      alive: true,
      animTimer: 0,
      flashTimer: 0,
      hitThisPhase: false // Hasar almadan boss kesme başarımı için
    };
    this._phase = 0;
    this._attackTimer = 0;
    this._currentAttack = null;
    this._introTimer = 2; // 2 sn intro
    this._projectiles = [];

    // Düşmanları temizle
    G.Enemy.killAll();

    // Efekt
    G.Effects.bossIntro();
    G.Audio.play('boss_intro');
    G.Audio.stopMusic();
    setTimeout(() => G.Audio.startMusic('boss'), 2000);
  },

  /**
   * Boss aktif mi?
   */
  isActive() {
    return this._active && this._active.alive;
  },

  /**
   * Boss hasar al
   */
  hit(amount) {
    if (!this._active || !this._active.alive || this._introTimer > 0) return;

    this._active.currentHp -= amount;
    this._active.flashTimer = 0.15;
    this._active.hitThisPhase = false;
    G.Audio.play('boss_hit');
    G.Effects.shake(4, 0.15);

    const gs = G.Config.GRID_SIZE;
    G.Particles.spark(this._active.x * gs + gs / 2, this._active.y * gs + gs / 2, this._active.color);

    // Faz geçişi
    const hpPercent = this._active.currentHp / this._active.maxHp;
    if (hpPercent <= 0.5 && this._phase === 0) {
      this._phase = 1;
      this._attackTimer = 0;
      G.Effects.flash('#ff4400', 0.3);
    }
    if (hpPercent <= 0.25 && this._phase === 1) {
      this._phase = 2;
      this._attackTimer = 0;
      G.Effects.flash('#ff0000', 0.3);
    }

    if (this._active.currentHp <= 0) {
      this.defeat();
    }
  },

  /**
   * Boss öldür
   */
  defeat() {
    this._active.alive = false;
    this._defeatedTimer = 2;
    G.Audio.stopMusic();

    const gs = G.Config.GRID_SIZE;
    const cx = this._active.x * gs + gs / 2;
    const cy = this._active.y * gs + gs / 2;

    // Epik ölüm efekti
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        G.Particles.burst(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 40, this._active.color, 20);
        G.Effects.shake(8, 0.2);
      }, i * 200);
    }

    setTimeout(() => {
      G.Particles.rainbowBurst(cx, cy, 50);
      G.Particles.ring(cx, cy, '#ffffff', 100);
      G.Audio.play('boss_die');
    }, 1000);

    // Boss öldüğünde çağrılacak (game.js'de)
    setTimeout(() => {
      if (G.Game) G.Game.onBossDefeated(this._active);
    }, 2000);
  },

  /**
   * Güncelle
   */
  update(dt) {
    if (!this._active || !this._active.alive) {
      if (this._defeatedTimer > 0) {
        this._defeatedTimer -= dt;
      }
      return;
    }

    const gs = G.Config.GRID_SIZE;
    this._active.animTimer += dt;

    // Intro
    if (this._introTimer > 0) {
      this._introTimer -= dt;
      return;
    }

    // Hasar flaşı
    if (this._active.flashTimer > 0) {
      this._active.flashTimer -= dt;
    }

    // Saldırı zamanlayıcı
    this._attackTimer += dt;

    // Saldırı bekleme süresi
    if (this._attackCooldown > 0) {
      this._attackCooldown -= dt;
      return;
    }

    // Saldırı seç
    if (!this._currentAttack || this._attackTimer >= this._attackDuration) {
      this._chooseAttack();
      this._attackCooldown = 1.5; // Saldırılar arası 1.5 sn bekleme
    }

    // Mevcut saldırıyı uygula
    this._executeAttack(dt);

    // Projektil güncelle
    this._updateProjectiles(dt);

    // Oyuncu çarpışma kontrolü
    this._checkPlayerCollision();
  },

  _chooseAttack() {
    if (!this._active) return;

    const attacks = this._active.attacks;
    const attack = attacks[this._phase % attacks.length];
    this._currentAttack = attack;
    this._attackTimer = 0;

    switch (attack) {
      case 'burrow':
        this._attackDuration = 3;
        break;
      case 'slam':
        this._attackDuration = 2;
        break;
      case 'laser_spin':
        this._attackDuration = 4;
        break;
      case 'laser_beam':
        this._attackDuration = 3;
        break;
      case 'pull':
        this._attackDuration = 3;
        break;
      case 'pulse':
        this._attackDuration = 2;
        break;
      case 'ring':
        this._attackDuration = 3;
        break;
      case 'chain':
        this._attackDuration = 2;
        break;
      case 'mirror':
        this._attackDuration = 4;
        break;
      case 'clone':
        this._attackDuration = 3;
        break;
      case 'mixed':
        this._attackDuration = 3;
        break;
      case 'void_beam':
        this._attackDuration = 3;
        break;
      default:
        this._attackDuration = 2;
    }
  },

  _executeAttack(dt) {
    if (!this._active || !this._currentAttack) return;
    const gs = G.Config.GRID_SIZE;
    const player = G.Player.getHead();

    switch (this._currentAttack) {
      case 'burrow':
        // Ekranın altından çıkıp yukarı dalma
        this._active.y = G.Config.ROWS - 3 + Math.sin(this._attackTimer * 2) * 3;
        if (Math.sin(this._attackTimer * 2) > 0.9) {
          G.Effects.shake(5, 0.2);
        }
        break;

      case 'slam':
        // Yere vurma
        if (this._attackTimer > 1.5 && this._attackTimer < 1.7) {
          G.Effects.shake(8, 0.3);
          this._spawnShockwave();
        }
        break;

      case 'laser_spin':
        // Dönen lazer
        this._active.laserAngle = (this._active.laserAngle || 0) + dt * 3;
        break;

      case 'laser_beam':
        // Oyuncuya doğru lazer
        break;

      case 'pull':
        // Yemleri kendine çek
        G.Food.applyMagnet(this._active.x, this._active.y, 10, dt);
        break;

      case 'pulse':
        // Elektrik halkası
        if (Math.floor(this._attackTimer * 2) !== Math.floor((this._attackTimer - dt) * 2)) {
          this._spawnRing();
        }
        break;

      case 'ring':
        // Periyodik halka
        if (Math.floor(this._attackTimer) !== Math.floor(this._attackTimer - dt)) {
          this._spawnRing();
        }
        break;

      case 'chain':
        // Zincirleme elektrik
        break;

      case 'mirror':
        // Oyuncuyu taklit et
        this._active.x = G.Config.COLS - 1 - player.x;
        this._active.y = G.Config.ROWS - 1 - player.y;
        break;

      case 'clone':
        // Mini klonlar
        if (Math.floor(this._attackTimer * 0.5) !== Math.floor((this._attackTimer - dt) * 0.5)) {
          if (this._projectiles.length < 5) {
            this._projectiles.push({
              x: this._active.x,
              y: this._active.y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              life: 3,
              color: this._active.color,
              size: 3
            });
          }
        }
        break;

      case 'mixed':
        // Karışık saldırı
        if (Math.floor(this._attackTimer) % 3 === 0) this._spawnRing();
        if (Math.floor(this._attackTimer) % 5 === 0) this._spawnShockwave();
        break;

      case 'void_beam':
        // Void ışını
        break;
    }
  },

  _spawnShockwave() {
    const gs = G.Config.GRID_SIZE;
    G.Particles.ring(this._active.x * gs + gs / 2, this._active.y * gs + gs / 2, this._active.color, 60);
    // Yakındaki oyuncuya hasar (bekleme süresi kontrolü)
    if (this._attackCooldown > 0) return;
    const player = G.Player.getHead();
    if (G.Utils.dist(this._active.x, this._active.y, player.x, player.y) < 3) {
      G.Player.takeDamage('boss');
      this._attackCooldown = 2;
    }
  },

  _spawnRing() {
    const gs = G.Config.GRID_SIZE;
    G.Particles.ring(this._active.x * gs + gs / 2, this._active.y * gs + gs / 2, '#ffff00', 40);
    // Yakındaki oyuncuya hasar (bekleme süresi kontrolü)
    if (this._attackCooldown > 0) return;
    const player = G.Player.getHead();
    if (G.Utils.dist(this._active.x, this._active.y, player.x, player.y) < 2) {
      G.Player.takeDamage('boss');
      this._attackCooldown = 2;
    }
  },

  _updateProjectiles(dt) {
    for (let i = this._projectiles.length - 1; i >= 0; i--) {
      const p = this._projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this._projectiles.splice(i, 1);
      }
    }
  },

  _checkPlayerCollision() {
    if (!this._active) return;
    if (this._introTimer > 0) return; // Intro'da hasar yok
    if (this._attackCooldown > 0) return; // Bekleme süresinde hasar yok
    const player = G.Player.getHead();
    if (G.Utils.dist(this._active.x, this._active.y, player.x, player.y) < 1.5) {
      G.Player.takeDamage('boss');
      this._attackCooldown = 2; // Çarpışma sonrası 2 sn bekleme
    }
  },

  /**
   * Profesyonel boss çizimi (her boss'a özel)
   */
  draw(ctx) {
    if (!this._active || !this._active.alive) return;

    const gs = G.Config.GRID_SIZE;
    const cx = this._active.x * gs + gs / 2;
    const cy = this._active.y * gs + gs / 2;
    const size = gs * 1.5;
    const boss = this._active;
    const flash = boss.flashTimer > 0;
    const now = Date.now();

    ctx.save();

    // Glow
    if (G.Save.get('settings.glow') !== false) {
      ctx.shadowColor = boss.color;
      ctx.shadowBlur = 25;
    }

    // Boss gövdesi (her boss'a özel gradient)
    const bg = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, size);
    bg.addColorStop(0, flash ? '#ffffff' : this._lighten(boss.color, 60));
    bg.addColorStop(0.4, flash ? '#dddddd' : boss.color);
    bg.addColorStop(0.8, flash ? '#aaaaaa' : this._darken(boss.color, 40));
    bg.addColorStop(1, flash ? '#666666' : this._darken(boss.color, 80));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();

    // Zırh deseni (boss tipine göre)
    if (boss.id === 'worm') {
      // Solucan segment deseni
      ctx.strokeStyle = this._darken(boss.color, 30) + '66';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const sa = (now / 1000) + i * 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, size * (0.3 + i * 0.12), sa, sa + Math.PI * 0.8);
        ctx.stroke();
      }
    } else if (boss.id === 'cube') {
      // Kare deseni (lazer küp)
      ctx.strokeStyle = '#0088ff44';
      ctx.lineWidth = 1;
      const rot = now / 2000;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.strokeRect(-size * 0.6, -size * 0.6, size * 1.2, size * 1.2);
      ctx.restore();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot + Math.PI / 4);
      ctx.strokeRect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9);
      ctx.restore();
    } else if (boss.id === 'magnet') {
      // Manyetik halka
      ctx.strokeStyle = '#00ffcc66';
      ctx.lineWidth = 2;
      const mrot = now / 1500;
      ctx.beginPath();
      ctx.arc(cx, cy, size + 5, mrot, mrot + Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, size + 10, mrot + Math.PI, mrot + Math.PI * 2.5);
      ctx.stroke();
    } else if (boss.id === 'orb') {
      // Elektrik ark'ları
      ctx.strokeStyle = '#ffff0066';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const ea = (now / 200) + i * 1.6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ea) * size * 0.3, cy + Math.sin(ea) * size * 0.3);
        ctx.lineTo(cx + Math.cos(ea + 0.5) * size * 0.9, cy + Math.sin(ea + 0.5) * size * 0.9);
        ctx.stroke();
      }
    } else if (boss.id === 'ai_snake') {
      // Devre deseni
      ctx.strokeStyle = '#ff004433';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const da = i * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(da) * size * 0.8, cy + Math.sin(da) * size * 0.8);
        ctx.stroke();
      }
    } else if (boss.id === 'void') {
      // Void dalgalanma
      ctx.strokeStyle = '#ff00aa44';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const va = (now / 800) + i * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, size * (0.5 + i * 0.15), va, va + Math.PI);
        ctx.stroke();
      }
    }

    // İç desen (parlak çekirdek)
    const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
    ig.addColorStop(0, '#ffffff44');
    ig.addColorStop(1, 'transparent');
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Gözler (daha iyi)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - size * 0.3, cy - size * 0.2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + size * 0.3, cy - size * 0.2, 7, 0, Math.PI * 2);
    ctx.fill();
    // Iris
    ctx.fillStyle = boss.color;
    ctx.beginPath();
    ctx.arc(cx - size * 0.3, cy - size * 0.2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + size * 0.3, cy - size * 0.2, 4, 0, Math.PI * 2);
    ctx.fill();
    // Göz bebeği
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - size * 0.3, cy - size * 0.2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + size * 0.3, cy - size * 0.2, 2, 0, Math.PI * 2);
    ctx.fill();
    // Göz highlight
    ctx.fillStyle = '#ffffff88';
    ctx.beginPath();
    ctx.arc(cx - size * 0.3 - 2, cy - size * 0.2 - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + size * 0.3 - 2, cy - size * 0.2 - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // HP bar (profesyonel)
    const barW = gs * 6;
    const barH = 10;
    const barX = cx - barW / 2;
    const barY = cy - size - 20;
    const hpPercent = boss.currentHp / boss.maxHp;

    // Bar arka plan
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    // Bar kenarlık
    ctx.strokeStyle = '#ff448844';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);
    // Bar dolgu (gradient)
    const hpg = ctx.createLinearGradient(barX, barY, barX + barW * hpPercent, barY);
    hpg.addColorStop(0, '#ff0044');
    hpg.addColorStop(0.5, '#ff4488');
    hpg.addColorStop(1, '#ff0044');
    ctx.fillStyle = hpg;
    ctx.fillRect(barX, barY, barW * hpPercent, barH);
    // Bar parlaklık
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barW * hpPercent, barH / 2);

    // Boss ismi (Orbitron font)
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 14px 'Orbitron', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, cx, barY - 6);

    // Projektiler
    for (const p of this._projectiles) {
      ctx.fillStyle = p.color;
      if (G.Save.get('settings.glow') !== false) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.arc(p.x * gs + gs / 2, p.y * gs + gs / 2, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  _lighten(hex, amount) {
    if (!hex) return '#ffffff';
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return '#' + [r,g,b].map(c => Math.min(255, c + amount).toString(16).padStart(2,'0')).join('');
  },

  _darken(hex, amount) {
    if (!hex) return '#000000';
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return '#' + [r,g,b].map(c => Math.max(0, c - amount).toString(16).padStart(2,'0')).join('');
  },

  get active() { return this._active; },
  get hp() { return this._active ? this._active.currentHp : 0; },
  get maxHp() { return this._active ? this._active.maxHp : 1; },
  isIntro() { return this._introTimer > 0; }
};
