// ============================================================
// enemy.js — Düşman Sistemi
// ============================================================
window.G = window.G || {};

G.Enemy = {
  _enemies: [],
  _spawnTimer: 0,

  init() {
    this._enemies = [];
    this._spawnTimer = -30; // İlk30 sn düşman yok (oyuncu öğrenme süresi)
  },

  /**
   * Düşman spawn et
   */
  spawn(type, x, y) {
    const C = G.Config;
    const def = C.ENEMY_TYPES[type];
    if (!def) return null;

    const gs = C.GRID_SIZE;
    const enemy = {
      type: type,
      x: x !== undefined ? x : 0,
      y: y !== undefined ? y : 0,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      color: def.color,
      ai: def.ai,
      damage: def.damage,
      alive: true,
      moveTimer: 0,
      // AI state
      wanderDir: { x: 0, y: 0 },
      wanderTimer: 0,
      patrolPoints: [],
      patrolIndex: 0,
      attackTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      poisonTimer: 0,
      // Görsel
      animTimer: 0,
      flashTimer: 0,
      // Lazer drone
      laserAngle: 0,
      laserActive: false,
      laserTimer: 0
    };

    // Pozisyon belirlenmemişse rastgele
    if (x === undefined || y === undefined) {
      const pos = G.Map.getRandomEmpty(
        G.Player.getHead().x, G.Player.getHead().y, G.Config.SAFE_ZONE_RADIUS
      );
      enemy.x = pos.x;
      enemy.y = pos.y;
    }

    // Patrol noktaları (patrol AI için)
    if (def.ai === 'patrol') {
      for (let i = 0; i < 3; i++) {
        const p = G.Map.getRandomEmpty(enemy.x, enemy.y, 5);
        enemy.patrolPoints.push(p);
      }
    }

    this._enemies.push(enemy);
    return enemy;
  },

  /**
   * Güncelle
   */
  update(dt) {
    if (!G.Player.isAlive()) return;
    if (G.Player.isTimeFrozen()) return; // Time freeze

    const C = G.Config;
    const gs = C.GRID_SIZE;
    const player = G.Player.getHead();

    // Otomatik spawn
    this._spawnTimer += dt;
    if (this._spawnTimer >= C.ENEMY_SPAWN_INTERVAL) {
      this._spawnTimer = 0;
      if (this._enemies.length < C.MAX_ENEMIES) {
        this.spawnRandom();
      }
    }

    for (const e of this._enemies) {
      if (!e.alive) continue;

      // Stun
      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        continue;
      }

      // Yavaşlatma
      let speedMult = 1;
      if (e.slowTimer > 0) {
        speedMult = 0.5;
        e.slowTimer -= dt;
      }

      // Zehir
      if (e.poisonTimer > 0) {
        e.poisonTimer -= dt;
        e.hp -= dt * 0.5;
        if (e.hp <= 0) {
          this.killEnemy(e);
          continue;
        }
      }

      // Hareket
      e.moveTimer += dt;
      e.animTimer += dt;
      const moveInterval = 1 / (e.speed * speedMult);

      if (e.moveTimer >= moveInterval) {
        e.moveTimer = 0;
        this._updateAI(e, player, dt);
      }

      // Lazer drone
      if (e.ai === 'turret') {
        e.laserTimer += dt;
        e.laserAngle += dt * 2;
        if (e.laserTimer >= 2) {
          e.laserActive = !e.laserActive;
          e.laserTimer = 0;
        }
        // Lazer çarpışma
        if (e.laserActive) {
          this._checkLaserHit(e, player);
        }
      }

      // Hasar flaşı
      if (e.flashTimer > 0) {
        e.flashTimer -= dt;
      }
    }

    // Ölüleri temizle
    this._enemies = this._enemies.filter(e => e.alive);
  },

  _updateAI(e, player, dt) {
    const C = G.Config;

    switch (e.ai) {
      case 'wander':
        // Rastgele dolaşma
        e.wanderTimer -= 1;
        if (e.wanderTimer <= 0) {
          e.wanderDir = G.Utils.randomPick([
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
          ]);
          e.wanderTimer = G.Utils.randomInt(3, 8);
        }
        this._moveEnemy(e, e.wanderDir.x, e.wanderDir.y);
        break;

      case 'chase':
        // Oyuncuya doğru
        this._moveToward(e, player.x, player.y);
        break;

      case 'patrol':
        // Noktalar arası devriye
        if (e.patrolPoints.length > 0) {
          const target = e.patrolPoints[e.patrolIndex];
          if (G.Utils.dist(e.x, e.y, target.x, target.y) < 2) {
            e.patrolIndex = (e.patrolIndex + 1) % e.patrolPoints.length;
          }
          this._moveToward(e, target.x, target.y);
        }
        break;

      case 'bomber':
        // Düz gider, duvara çarpınca yön değiştir
        if (!this._moveEnemy(e, e.wanderDir.x || 1, e.wanderDir.y || 0)) {
          // Duvara çarptı → yön değiştir
          e.wanderDir = G.Utils.randomPick([
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
          ]);
          // Patlama efekti
          G.Particles.burst(e.x * C.GRID_SIZE + C.GRID_SIZE / 2, e.y * C.GRID_SIZE + C.GRID_SIZE / 2, '#ff6600', 10);
          G.Effects.shake(2, 0.1);
        }
        break;

      case 'ghost':
        // Yavaş takip, duvarlardan geçer
        this._moveToward(e, player.x, player.y, true);
        break;

      case 'aggressive':
        // Agresif takip
        this._moveToward(e, player.x, player.y);
        // Bazen dash
        if (Math.random() < 0.1) {
          this._moveToward(e, player.x, player.y);
        }
        break;
    }
  },

  _moveEnemy(e, dx, dy) {
    if (dx === 0 && dy === 0) return false;
    const nx = e.x + dx;
    const ny = e.y + dy;

    if (e.ai === 'ghost') {
      // Hayalet duvarlardan geçer
      e.x = ((nx % G.Config.COLS) + G.Config.COLS) % G.Config.COLS;
      e.y = ((ny % G.Config.ROWS) + G.Config.ROWS) % G.Config.ROWS;
      return true;
    }

    if (G.Map.isWalkable(nx, ny)) {
      e.x = nx;
      e.y = ny;
      return true;
    }
    return false;
  },

  _moveToward(e, tx, ty, ghost) {
    const dx = tx - e.x;
    const dy = ty - e.y;
    let mx = 0, my = 0;
    if (Math.abs(dx) > Math.abs(dy)) {
      mx = dx > 0 ? 1 : -1;
    } else if (dy !== 0) {
      my = dy > 0 ? 1 : -1;
    }
    this._moveEnemy(e, mx, my);
  },

  _checkLaserHit(e, player) {
    const gs = G.Config.GRID_SIZE;
    const ecx = e.x * gs + gs / 2;
    const ecy = e.y * gs + gs / 2;
    const pcx = player.x * gs + gs / 2;
    const pcy = player.y * gs + gs / 2;

    // Lazer çizgisi boyunca kontrol
    const laserLen = 15 * gs;
    const lx = ecx + Math.cos(e.laserAngle) * laserLen;
    const ly = ecy + Math.sin(e.laserAngle) * laserLen;

    // Basit çizgi-nokta mesafesi
    const dist = this._pointLineDist(pcx, pcy, ecx, ecy, lx, ly);
    if (dist < gs) {
      G.Player.takeDamage('laser');
    }
  },

  _pointLineDist(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let t = lenSq !== 0 ? dot / lenSq : -1;
    t = G.Utils.clamp(t, 0, 1);
    const xx = x1 + t * C;
    const yy = y1 + t * D;
    return G.Utils.dist(px, py, xx, yy);
  },

  /**
   * Düşman hasar al
   */
  damageEnemy(enemy, amount) {
    enemy.hp -= amount;
    enemy.flashTimer = 0.15;
    G.Particles.spark(enemy.x * G.Config.GRID_SIZE + G.Config.GRID_SIZE / 2,
                      enemy.y * G.Config.GRID_SIZE + G.Config.GRID_SIZE / 2, enemy.color);
    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  },

  /**
   * Düşman öldür
   */
  killEnemy(enemy) {
    enemy.alive = false;
    const gs = G.Config.GRID_SIZE;
    G.Particles.burst(enemy.x * gs + gs / 2, enemy.y * gs + gs / 2, enemy.color, 15);
    G.Audio.play('eat_coin');

    // Rastgele düşürme
    if (Math.random() < 0.2) {
      G.Food.spawn(G.Food.getRandomType());
    }
  },

  /**
   * Belirli bir düşmanı öldür (alan hasarı)
   */
  damageInRadius(cx, cy, radius, amount) {
    for (const e of this._enemies) {
      if (!e.alive) continue;
      if (G.Utils.dist(e.x, e.y, cx, cy) <= radius) {
        this.damageEnemy(e, amount);
      }
    }
  },

  /**
   * Belirli konumda düşman var mı?
   */
  getEnemyAt(x, y) {
    for (const e of this._enemies) {
      if (e.alive && e.x === x && e.y === y) return e;
    }
    return null;
  },

  /**
   * Rastgele düşman spawn et
   */
  spawnRandom() {
    const biome = G.Game ? G.Game.currentBiome : 'neon_city';
    const biomeEnemies = {
      neon_city:     ['bug', 'chaser'],
      frozen_lab:    ['bug', 'drone', 'ghost'],
      lava_core:     ['bomber', 'chaser', 'bug'],
      cyber_forest:  ['snake', 'bug', 'ghost'],
      space_station: ['drone', 'chaser', 'bomber'],
      void:          ['ghost', 'chaser', 'bomber', 'drone']
    };
    const types = biomeEnemies[biome] || ['bug'];
    this.spawn(G.Utils.randomPick(types));
  },

  /**
   * Tüm düşmanları öldür
   */
  killAll() {
    for (const e of this._enemies) {
      this.killEnemy(e);
    }
  },

  /**
   * Çiz
   */
  draw(ctx) {
    const gs = G.Config.GRID_SIZE;

    for (const e of this._enemies) {
      if (!e.alive) continue;

      const cx = e.x * gs + gs / 2;
      const cy = e.y * gs + gs / 2;

      ctx.save();

      // Hasar flaşı
      if (e.flashTimer > 0) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = e.color;
      }

      // Glow
      if (G.Save.get('settings.glow') !== false) {
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 8;
      }

      switch (e.type) {
        case 'bug':
          this._drawBug(ctx, cx, cy, gs, e);
          break;
        case 'snake':
          this._drawEnemySnake(ctx, cx, cy, gs, e);
          break;
        case 'bomber':
          this._drawBomber(ctx, cx, cy, gs, e);
          break;
        case 'drone':
          this._drawDrone(ctx, cx, cy, gs, e);
          break;
        case 'ghost':
          this._drawGhost(ctx, cx, cy, gs, e);
          break;
        case 'chaser':
          this._drawChaser(ctx, cx, cy, gs, e);
          break;
      }

      ctx.restore();
    }
  },

  _drawBug(ctx, cx, cy, gs, e) {
    const size = gs / 2 - 2;
    const flash = e.flashTimer > 0;
    // Gövde gradient
    const bg = ctx.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, size * 0.8);
    bg.addColorStop(0, flash ? '#ffffff' : '#ff4466');
    bg.addColorStop(1, flash ? '#dddddd' : '#881122');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    // Kabuk deseni
    ctx.strokeStyle = '#66112244';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.6);
    ctx.lineTo(cx, cy + size * 0.6);
    ctx.stroke();
    // Bacaklar (animasyonlu)
    ctx.strokeStyle = flash ? '#cccccc' : '#cc2244';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    const t = e.animTimer * 6;
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1;
      const idx = i % 3;
      const baseAngle = (idx * 0.4 + 0.3) * side;
      const legAngle = baseAngle + Math.sin(t + idx * 1.5) * 0.3;
      const sx = cx + side * size * 0.5;
      const sy = cy + (idx - 1) * size * 0.3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(legAngle) * size * 0.8, sy + Math.sin(legAngle) * size * 0.6);
      ctx.stroke();
    }
    // Gözler (daha iyi)
    ctx.fillStyle = '#ff0000';
    if (!flash) { ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 6; }
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 3, cy - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  },

  _drawEnemySnake(ctx, cx, cy, gs, e) {
    const size = gs / 2 - 2;
    const flash = e.flashTimer > 0;
    // Gövde gradient
    const sg = ctx.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, size);
    sg.addColorStop(0, flash ? '#ffffff' : '#44ff22');
    sg.addColorStop(0.6, flash ? '#dddddd' : '#226611');
    sg.addColorStop(1, flash ? '#aaaaaa' : '#113300');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    // Zehir deseni (pullar)
    ctx.fillStyle = '#88ff4422';
    for (let i = 0; i < 5; i++) {
      const px = cx + Math.cos(i * 1.3) * size * 0.4;
      const py = cy + Math.sin(i * 1.3) * size * 0.4;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Dil (animasyonlu)
    const tongueLen = 4 + Math.sin(e.animTimer * 8) * 2;
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.7);
    ctx.lineTo(cx, cy - size * 0.7 - tongueLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.7 - tongueLen);
    ctx.lineTo(cx - 2, cy - size * 0.7 - tongueLen - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.7 - tongueLen);
    ctx.lineTo(cx + 2, cy - size * 0.7 - tongueLen - 2);
    ctx.stroke();
    // Gözler (sarı, slit)
    ctx.fillStyle = flash ? '#ffffff' : '#ffff00';
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy - 2, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy - 2, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Göz bebeği (slit)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy - 2, 0.8, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy - 2, 0.8, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawBomber(ctx, cx, cy, gs, e) {
    const size = gs / 2 - 2;
    const flash = e.flashTimer > 0;
    // Dış kabuk gradient
    const bg = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, size);
    bg.addColorStop(0, flash ? '#ffffff' : '#ffaa44');
    bg.addColorStop(0.5, flash ? '#dddddd' : '#ff6600');
    bg.addColorStop(1, flash ? '#888888' : '#882200');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.85, 0, Math.PI * 2);
    ctx.fill();
    // İç parıltı (sıcak çekirdek)
    const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.4);
    ig.addColorStop(0, '#ffff8888');
    ig.addColorStop(1, '#ff440000');
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Çatlak deseni
    ctx.strokeStyle = '#ff440088';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 3);
    ctx.lineTo(cx + 1, cy + 2);
    ctx.lineTo(cx + 3, cy + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 3, cy - 4);
    ctx.lineTo(cx - 1, cy + 1);
    ctx.stroke();
    // Fitil (kısa)
    ctx.strokeStyle = '#886644';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.8);
    ctx.lineTo(cx + 3, cy - size * 1.1);
    ctx.stroke();
    // Kıvılcım
    if (Math.random() < 0.3) {
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(cx + 3, cy - size * 1.1, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  _drawDrone(ctx, cx, cy, gs, e) {
    const size = gs / 2 - 2;
    const flash = e.flashTimer > 0;
    // Gövde (kare, gradient)
    const dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
    dg.addColorStop(0, flash ? '#ffffff' : '#5577aa');
    dg.addColorStop(1, flash ? '#aaaaaa' : '#223344');
    ctx.fillStyle = dg;
    ctx.fillRect(cx - size * 0.7, cy - size * 0.7, size * 1.4, size * 1.4);
    // Kenarlık
    ctx.strokeStyle = '#88aacc44';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - size * 0.7, cy - size * 0.7, size * 1.4, size * 1.4);
    // Merkez lens
    ctx.fillStyle = '#880000';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    // Motorlar (köşeler, dönen)
    ctx.fillStyle = '#6688aa';
    const offsets = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (const [ox, oy] of offsets) {
      const mx = cx + ox * size * 0.6;
      const my = cy + oy * size * 0.6;
      ctx.fillStyle = '#8899bb';
      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, Math.PI * 2);
      ctx.fill();
      // Pervane (dönen)
      ctx.strokeStyle = '#aabbcc66';
      ctx.lineWidth = 1;
      const pa = e.animTimer * 10 + ox * 2 + oy * 3;
      ctx.beginPath();
      ctx.moveTo(mx + Math.cos(pa) * 5, my + Math.sin(pa) * 2);
      ctx.lineTo(mx - Math.cos(pa) * 5, my - Math.sin(pa) * 2);
      ctx.stroke();
    }
    // Lazer (aktifse)
    if (e.laserActive) {
      // Lazer çizgisi
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      const laserLen = 15 * gs;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(e.laserAngle) * laserLen, cy + Math.sin(e.laserAngle) * laserLen);
      ctx.stroke();
      // Lazer glow
      ctx.strokeStyle = '#ff000044';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(e.laserAngle) * laserLen, cy + Math.sin(e.laserAngle) * laserLen);
      ctx.stroke();
      // Lazer kaynağı glow
      ctx.fillStyle = '#ff000088';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  _drawGhost(ctx, cx, cy, gs, e) {
    const size = gs / 2 - 2;
    const flash = e.flashTimer > 0;
    const pulse = Math.sin(e.animTimer * 3) * 0.2;
    ctx.globalAlpha = 0.4 + pulse;
    // Hayalet gövdesi (gradient)
    const gg = ctx.createRadialGradient(cx, cy - 3, 0, cx, cy, size);
    gg.addColorStop(0, flash ? '#ffffff' : '#ccccff');
    gg.addColorStop(0.5, flash ? '#dddddd' : '#8888cc');
    gg.addColorStop(1, flash ? '#aaaaaa' : '#444488');
    ctx.fillStyle = gg;
    ctx.beginPath();
    // Üst yuvarlak
    ctx.arc(cx, cy - size * 0.2, size * 0.7, Math.PI, 0);
    // Sağ kenar
    ctx.lineTo(cx + size * 0.7, cy + size * 0.5);
    // Dalgalı alt (daha iyi)
    for (let i = 0; i < 5; i++) {
      const wx = cx + size * 0.7 - (i + 1) * (size * 1.4 / 5);
      const wy = cy + size * 0.5 + Math.sin(e.animTimer * 4 + i * 1.5) * 3;
      ctx.lineTo(wx, wy);
    }
    ctx.closePath();
    ctx.fill();
    // İç parıltı
    ctx.globalAlpha = 0.2 + pulse * 0.5;
    const ig = ctx.createRadialGradient(cx, cy - 2, 0, cx, cy, size * 0.5);
    ig.addColorStop(0, '#ffffff');
    ig.addColorStop(1, 'transparent');
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Gözler (daha iyi)
    ctx.globalAlpha = 1;
    ctx.fillStyle = flash ? '#ffffff' : '#000066';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - size * 0.25, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4, cy - size * 0.25, 3, 0, Math.PI * 2);
    ctx.fill();
    // Göz parıltısı
    ctx.fillStyle = '#ffffff88';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - size * 0.25 - 1, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 3, cy - size * 0.25 - 1, 1, 0, Math.PI * 2);
    ctx.fill();
  },

  _drawChaser(ctx, cx, cy, gs, e) {
    const size = gs / 2 - 2;
    const flash = e.flashTimer > 0;
    // Gövde gradient
    const cg = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, size);
    cg.addColorStop(0, flash ? '#ffffff' : '#ff4444');
    cg.addColorStop(0.7, flash ? '#dddddd' : '#aa2222');
    cg.addColorStop(1, flash ? '#888888' : '#661111');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.85, 0, Math.PI * 2);
    ctx.fill();
    // Zırh deseni (çizgiler)
    ctx.strokeStyle = '#88111144';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 3, cy - size * 0.6);
      ctx.lineTo(cx + i * 3, cy + size * 0.6);
      ctx.stroke();
    }
    // LED göz (parlak)
    ctx.fillStyle = flash ? '#ffffff' : '#ff0000';
    if (!flash) { ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 12; }
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Göz parıltısı
    ctx.fillStyle = '#ffffff88';
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 4, 1.2, 0, Math.PI * 2);
    ctx.fill();
    // Tekerlekler
    ctx.fillStyle = '#444444';
    ctx.beginPath();
    ctx.arc(cx - size * 0.5, cy + size * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + size * 0.5, cy + size * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();
    // Tekerlek parıltısı
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx - size * 0.5, cy + size * 0.6, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + size * 0.5, cy + size * 0.6, 3, 0, Math.PI * 2);
    ctx.stroke();
  },

  clear() {
    this._enemies = [];
    this._spawnTimer = 0;
  },

  get enemies() { return this._enemies; }
};
