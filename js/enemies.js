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
    if (this.list.length >= 4) return; // Max düşman limiti
    const E = G.Engine;
    const types = G.Config.ENEMY_TYPES;
    // Biome-based enemy availability
    const available = types.filter((_, i) => {
      if (E.currentBiome === 0) return i <= 3; // bug, snake, bomber, drone
      if (E.currentBiome === 1) return i <= 4; // + ghost
      return true; // tümü
    });
    const def = available[G.Utils.rndInt(0, available.length - 1)];

    const head = G.Snake.head();
    let tries = 0;
    let x, y;
    do {
      x = G.Utils.rndInt(3, (E.W / E.GS) - 4);
      y = G.Utils.rndInt(3, (E.H / E.GS) - 4);
      tries++;
    } while ((G.Map.getTile(x, y) !== 0 || G.Utils.dist(x, y, head.x, head.y) < 8) && tries < 50);
    if (tries >= 50) return;

    // Level ile düşman hızı ve HP artsın (yılanla rekabet)
    const levelBonus = E.level * 0.08;
    const hpBonus = Math.floor(E.level / 6);
    const enemy = {
      x, y, rx: x, ry: y,
      type: def.type,
      speed: def.speed + levelBonus,
      hp: def.hp + hpBonus,
      color: def.color,
      ai: def.ai,
      alive: true,
      moveTimer: 0,
      anim: 0,
      dir: { x: 0, y: -1 },
      wanderTimer: 0,
      // Özel özellikler
      _growTimer: 0,     // Snake: büyür
      _poisonTrail: 0,   // Bug: zehir izi bırakır
      _chaseBoost: 0     // Chaser: yakınken hızlanır
    };
    this.list.push(enemy);
  },

  update(dt) {
    const E = G.Engine;
    if (!G.Snake.alive) return;

    // Spawn timer (level ile hızlanır) + max düşman sayısı artar
    this.spawnTimer += dt;
    const spawnInterval = Math.max(4, 10 - E.level * 0.2);
    const maxEnemies = Math.min(8, 4 + Math.floor(E.level / 5));
    if (this.spawnTimer >= spawnInterval && this.list.length < maxEnemies) {
      this.spawnTimer = 0;
      this.spawn();
    }

    for (const e of this.list) {
      if (!e.alive) continue;
      e.anim += dt;

      // Smooth interpolation
      e.rx = G.Utils.lerp(e.rx, e.x, Math.min(1, dt * 8));
      e.ry = G.Utils.lerp(e.ry, e.y, Math.min(1, dt * 8));

      // Poison damage over time
      if (e._poisoned && e._poisonTimer > 0) {
        e._poisonTimer -= dt;
        if (!e._poisonTick) e._poisonTick = 0;
        e._poisonTick += dt;
        if (e._poisonTick >= 1) {
          e._poisonTick = 0;
          e.hp -= 1;
          G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#44ff00', 3);
          if (e.hp <= 0) {
            e.alive = false;
            G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, e.color, 15);
            G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, "#ffffff", 6);
            G.Particles.floatText(e.x * E.GS + E.GS / 2, e.y * E.GS - 10, "+15", "#44ff00");
            G.Effects.shake(2, 0.1);
            E.score += 15;
            E.notify("☠️ Zehir ölümü! +15", "#44ff00");
          }

        }
        if (e._poisonTimer <= 0) e._poisoned = false;
      }

      // Stun timer
      if (e._stunTimer > 0) {
        e._stunTimer -= dt;
        if (e._stunTimer <= 0 && e._origSpeed !== undefined) {
          e.speed = e._origSpeed;
          e._origSpeed = undefined;
        }
        e.shootTimer = 0; // Turret shoot timer'ı sıfırla
        continue; // Stunned — skip movement
      }

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

        if (e.ai === 'chase') {
          if (dist < 25) {
            // Geniş menzil: takip et
            if (Math.abs(dx) > Math.abs(dy)) {
              e.dir = { x: dx > 0 ? 1 : -1, y: 0 };
            } else {
              e.dir = { x: 0, y: dy > 0 ? 1 : -1 };
            }
          } else {
            // Menzil dışı: oyuncuya doğru yürü
            e.wanderTimer -= 1;
            if (e.wanderTimer <= 0) {
              // %70 oyuncuya doğru, %30 rastgele
              if (Math.random() < 0.7) {
                if (Math.abs(dx) > Math.abs(dy)) {
                  e.dir = { x: dx > 0 ? 1 : -1, y: 0 };
                } else {
                  e.dir = { x: 0, y: dy > 0 ? 1 : -1 };
                }
              } else {
                e.dir = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }][G.Utils.rndInt(0, 3)];
              }
              e.wanderTimer = G.Utils.rndInt(2, 5);
            }
          }
        } else if (e.ai === 'bomber') {
          // Bomber: agresif takip
          if (Math.abs(dx) > Math.abs(dy)) {
            e.dir = { x: dx > 0 ? 1 : -1, y: 0 };
          } else {
            e.dir = { x: 0, y: dy > 0 ? 1 : -1 };
          }
          // %10 şansla rastgele yön
          if (Math.random() < 0.1) {
            e.dir = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }][G.Utils.rndInt(0, 3)];
          }
        } else if (e.ai === 'wander') {
          // Wander: oyuncuya doğru yönelme eğilimi
          e.wanderTimer -= 1;
          if (e.wanderTimer <= 0) {
            if (dist < 20 && Math.random() < 0.5) {
              // %50 oyuncuya doğru
              if (Math.abs(dx) > Math.abs(dy)) {
                e.dir = { x: dx > 0 ? 1 : -1, y: 0 };
              } else {
                e.dir = { x: 0, y: dy > 0 ? 1 : -1 };
              }
            } else {
              e.dir = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }][G.Utils.rndInt(0, 3)];
            }
            e.wanderTimer = G.Utils.rndInt(2, 5);
          }
        } else if (e.ai === 'ghost') {
          // Ghost: her zaman takip et
          if (Math.abs(dx) > Math.abs(dy)) {
            e.dir = { x: dx > 0 ? 1 : -1, y: 0 };
          } else {
            e.dir = { x: 0, y: dy > 0 ? 1 : -1 };
          }
        } else if (e.ai === 'turret') {
          // Turret: don't move, but check if player is in line of sight (duvar kontrolü)
          if (dist < 15 && (Math.abs(dx) < 2 || Math.abs(dy) < 2)) {
            // Duvar kontrolü: turret ile oyuncu arasında duvar var mı?
            let blocked = false;
            const stepX = Math.sign(dx);
            const stepY = Math.sign(dy);
            let checkX = e.x;
            let checkY = e.y;
            for (let s = 0; s < Math.max(Math.abs(dx), Math.abs(dy)); s++) {
              checkX += stepX;
              checkY += stepY;
              if (G.Map.getTile(checkX, checkY) === 1) { blocked = true; break; }
            }
            if (!blocked) {
              if (!e.shootTimer) e.shootTimer = 0;
              e.shootTimer += dt;
              const shootInterval = Math.max(1.5, 3 - E.level * 0.05);
              if (e.shootTimer >= shootInterval) {
                e.shootTimer = 0;
                if (G.Snake.invTimer <= 0) {
                  G.Snake.takeDamage(1, 'turret');
                  G.Engine.notify('🎯 Lazer!', '#4488ff');
                }
              }
            }
          }
        }

        // Hareket (turret hariç tüm düşmanlar)
        if (e.ai !== 'turret') {
          let nx = e.x + e.dir.x;
          let ny = e.y + e.dir.y;

          if (e.ai === 'ghost') {
            const COLS = E.W / E.GS;
            const ROWS = E.H / E.GS;
            nx = ((nx % COLS) + COLS) % COLS;
            ny = ((ny % ROWS) + ROWS) % ROWS;
            e.x = nx;
            e.y = ny;
          } else {
            if (nx >= 1 && nx < E.W / E.GS - 1 && ny >= 1 && ny < E.H / E.GS - 1 && G.Map.getTile(nx, ny) === 0) {
              e.x = nx;
              e.y = ny;
            }
          }
        }
      }

      // ============ DÜŞMAN ÖZEL ÖZELLİKLERİ ============
      // Snake düşmanı: büyür (uzunluk artar)
      if (e.type === 'snake') {
        e._growTimer += dt;
        if (e._growTimer >= 5) {
          e._growTimer = 0;
          e.hp = Math.min(5, e.hp + 1);
        }
      }

      // Bug: zehir izi bırakır (yılanın geçtiği yer)
      if (e.type === 'bug') {
        e._poisonTrail += dt;
        if (e._poisonTrail >= 1) {
          e._poisonTrail = 0;
          // Yakındaki yılana yavaşlatma uygula
          if (G.Utils.dist(G.Snake.head().x, G.Snake.head().y, e.x, e.y) < 3) {
            G.Snake.speed = Math.max(2, G.Snake.speed * 0.95);
          }
        }
      }

      // Chaser: yakınken hızlanır
      if (e.type === 'chaser') {
        const chaserDist = G.Utils.dist(G.Snake.head().x, G.Snake.head().y, e.x, e.y);
        if (chaserDist < 8) {
          e._chaseBoost = Math.min(2, e._chaseBoost + dt * 0.5);
        } else {
          e._chaseBoost = Math.max(0, e._chaseBoost - dt * 0.5);
        }
      }

      // Player collision (cooldown: 1 sn)
      if (!e._hitCooldown) e._hitCooldown = 0;
      if (e._hitCooldown > 0) e._hitCooldown -= dt;
      if (e._hitCooldown <= 0 && G.Snake.invTimer <= 0 && G.Utils.dist(G.Snake.head().x, G.Snake.head().y, e.x, e.y) < 1.5) {
        e._hitCooldown = 1;
        // Bomber: patlama + kendini imha
        if (e.type === 'bomber') {
          G.Snake.takeDamage(1, 'bomber');
          e.alive = false;
          // Büyük patlama
          G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#ff8800', 20);
          G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#ffcc00', 10);
          G.Particles.smoke(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#888888', 5);
          G.Effects.shake(6, 0.4);
          G.Effects.flash('#ff8800', 0.2);
          E.notify('💥 Bomba patladı!', '#ff6600');
          // Yakındaki düşmanlara da hasar
          for (const other of G.Enemies.list) {
            if (!other.alive || other === e) continue;
            if (G.Utils.dist(e.x, e.y, other.x, other.y) < 3) {
              other.hp -= 2;
              if (other.hp <= 0) {
                other.alive = false;
                E.score += 15;
              }
            }
          }
        } else {
          G.Snake.takeDamage(1, 'enemy');
          // Push enemy back
          e.x += e.dir.x * -3;
          e.y += e.dir.y * -3;
          e.rx = e.x;
          e.ry = e.y;
        }
      }

      // ExplodingTail: yılan kuyruğu yakınında patlama
      if (E.upgrades.includes('explodingTail') && G.Snake.segments.length > 3) {
        const tail = G.Snake.segments[G.Snake.segments.length - 1];
        if (G.Utils.dist(tail.x, tail.y, e.x, e.y) < 2) {
          e.hp -= 3;
          G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#ff6600', 10);
          G.Effects.shake(3, 0.2);
          E.notify('💥 Patlayan Kuyruk!', '#ff6600');
          if (e.hp <= 0) {
            e.alive = false;
            G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, e.color, 15);
            G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#ffffff', 6);
            G.Particles.floatText(e.x * E.GS + E.GS / 2, e.y * E.GS - 10, '+15', '#ff6600');
            E.score += 15;
          }
        }
      }
    }

    // ChainTail: zincir hasar (tüm düşmanlara)
    if (E.upgrades.includes('chainTail') && G.Snake.segments.length > 2) {
      if (!this._chainTimer) this._chainTimer = 0;
      this._chainTimer += dt;
      if (this._chainTimer >= 3) {
        this._chainTimer = 0;
        for (const e of this.list) {
          if (!e.alive) continue;
          if (G.Utils.dist(G.Snake.head().x, G.Snake.head().y, e.x, e.y) < 8) {
            e.hp -= 1;
            G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#ccccff', 4);
            if (e.hp <= 0) {
              e.alive = false;
              G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, e.color, 15);
              G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#ffffff', 6);
              G.Particles.floatText(e.x * E.GS + E.GS / 2, e.y * E.GS - 10, '+15', '#ccccff');
              G.Effects.shake(2, 0.1);
              E.score += 15;
              E.notify('⛓️ Zincir ölümü! +15', '#ccccff');
            }
          }
        }
      }
    }

    // Mini Drone: her 2 sn'de yakındaki düşmana 1 hasar
    if (E.upgrades.includes('drone') && G.Snake.alive) {
      if (!this._droneTimer) this._droneTimer = 0;
      this._droneTimer += dt;
      if (this._droneTimer >= 2) {
        this._droneTimer = 0;
        const head = G.Snake.head();
        for (const e of this.list) {
          if (!e.alive) continue;
          if (G.Utils.dist(head.x, head.y, e.x, e.y) < 6) {
            e.hp -= 1;
            G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#4488ff', 5);
            E.notify('🤖 Drone hasar!', '#4488ff');
            if (e.hp <= 0) {
              e.alive = false;
              G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, e.color, 15);
              G.Particles.burst(e.x * E.GS + E.GS / 2, e.y * E.GS + E.GS / 2, '#ffffff', 6);
              G.Particles.floatText(e.x * E.GS + E.GS / 2, e.y * E.GS - 10, '+15', '#4488ff');
              G.Effects.shake(2, 0.1);
              E.score += 15;
              E.notify('🤖 Drone öldürdü! +15', '#4488ff');
            }
            break; // Bir seferde bir düşmana
          }
        }
      }
    }
  },

  draw(ctx) {
    const E = G.Engine;
    const gs = E.GS;
    const now = Date.now();
    const glowOn = G.Save.data.settings.glow !== false;
    const PI2 = Math.PI * 2;

    for (const e of this.list) {
      if (!e.alive) continue;
      const cx = e.rx * gs + gs / 2;
      const cy = e.ry * gs + gs / 2;
      const sz = gs / 2 + 1; // Daha büyük düşmanlar
      const t = e.anim;

      ctx.save();

      // Stun effect
      if (e._stunTimer > 0) {
        ctx.globalAlpha = 0.4 + Math.sin(t * 15) * 0.3;
      } else if (e.ai === 'ghost') {
        ctx.globalAlpha = 0.3 + Math.sin(t * 2) * 0.15;
      }

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(cx + 1, cy + 3, sz * 0.7, sz * 0.25, 0, 0, PI2);
      ctx.fill();

      // Glow aura
      if (glowOn) {
        const aura = ctx.createRadialGradient(cx, cy, sz * 0.5, cx, cy, sz * 2);
        aura.addColorStop(0, e.color + '33');
        aura.addColorStop(1, e.color + '00');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(cx, cy, sz * 2, 0, PI2);
        ctx.fill();
      }

      // ============ TYPE-SPECIFIC DRAWING ============
      if (e.type === 'bug') {
        // Bug — böcek, bacaklar, anten
        const bg = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, sz);
        bg.addColorStop(0, '#ff5566');
        bg.addColorStop(1, '#cc1133');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.ellipse(cx, cy, sz * 0.7, sz * 0.9, 0, 0, PI2);
        ctx.fill();
        // Kanat ayırma çizgisi
        ctx.strokeStyle = '#aa0022';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - sz * 0.8);
        ctx.lineTo(cx, cy + sz * 0.8);
        ctx.stroke();
        // Bacaklar
        ctx.strokeStyle = '#881122';
        ctx.lineWidth = 1;
        for (let leg = -1; leg <= 1; leg += 2) {
          for (let lp = 0; lp < 3; lp++) {
            const ly = cy + (lp - 1) * sz * 0.5;
            const lw = Math.sin(t * 5 + lp) * 3;
            ctx.beginPath();
            ctx.moveTo(cx + leg * sz * 0.6, ly);
            ctx.lineTo(cx + leg * (sz + 4), ly + lw);
            ctx.stroke();
          }
        }
        // Anten
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy - sz * 0.8);
        ctx.lineTo(cx - 6 + Math.sin(t * 3) * 2, cy - sz - 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 3, cy - sz * 0.8);
        ctx.lineTo(cx + 6 + Math.sin(t * 3 + 1) * 2, cy - sz - 5);
        ctx.stroke();
        // Gözler
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 3, cy - sz * 0.4, 3, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3, cy - sz * 0.4, 3, 0, PI2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - sz * 0.4, 1.5, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 2, cy - sz * 0.4, 1.5, 0, PI2);
        ctx.fill();

      } else if (e.type === 'snake') {
        // Düşman yılan — zincir segmentler
        for (let seg = 3; seg >= 0; seg--) {
          const sx = cx - seg * 5 * (e.dir.x || 0);
          const sy = cy - seg * 5 * (e.dir.y || 0);
          const ssz = sz * (1 - seg * 0.15);
          const sg = ctx.createRadialGradient(sx - 1, sy - 1, 0, sx, sy, ssz);
          sg.addColorStop(0, '#66ff44');
          sg.addColorStop(1, '#228811');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(sx, sy, ssz * 0.6, 0, PI2);
          ctx.fill();
        }
        // Gözler
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 2, 2.5, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3, cy - 2, 2.5, 0, PI2);
        ctx.fill();
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 2, 1.2, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 2, cy - 2, 1.2, 0, PI2);
        ctx.fill();

      } else if (e.type === 'bomber') {
        // Bombacı — turuncu küre, bomba sembolü, parlayan
        const bmG = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, sz);
        bmG.addColorStop(0, '#ffcc44');
        bmG.addColorStop(0.6, '#ff8800');
        bmG.addColorStop(1, '#cc4400');
        ctx.fillStyle = bmG;
        ctx.beginPath();
        ctx.arc(cx, cy, sz, 0, PI2);
        ctx.fill();
        // Bomba ikonu
        ctx.fillStyle = '#44220088';
        ctx.beginPath();
        ctx.arc(cx, cy + 1, sz * 0.4, 0, PI2);
        ctx.fill();
        // Parlama (yaklaştıkça artar)
        const distToPlayer = G.Utils.dist(G.Snake.head().x, G.Snake.head().y, e.x, e.y);
        if (distToPlayer < 5) {
          const dangerPulse = Math.sin(t * 8) * 0.3 + 0.3;
          ctx.fillStyle = `rgba(255,100,0,${dangerPulse})`;
          ctx.beginPath();
          ctx.arc(cx, cy, sz * 1.3, 0, PI2);
          ctx.fill();
        }
        // Gözler (kızgın)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 3, 2.5, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3, cy - 3, 2.5, 0, PI2);
        ctx.fill();
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 3, 1.5, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 2, cy - 3, 1.5, 0, PI2);
        ctx.fill();
        // Kaşlar (kızgın)
        ctx.strokeStyle = '#442200';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 7);
        ctx.lineTo(cx - 1, cy - 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy - 7);
        ctx.lineTo(cx + 1, cy - 5);
        ctx.stroke();

      } else if (e.type === 'drone') {
        // Drone — kare, pervane, lazer hattı
        ctx.fillStyle = '#1a2a44';
        ctx.fillRect(cx - sz * 0.7, cy - sz * 0.7, sz * 1.4, sz * 1.4);
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - sz * 0.7, cy - sz * 0.7, sz * 1.4, sz * 1.4);
        // Pervane
        ctx.strokeStyle = '#88ccff88';
        ctx.lineWidth = 1;
        for (let pr = 0; pr < 4; pr++) {
          const pa = t * 8 + pr * 1.57;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(pa) * sz, cy + Math.sin(pa) * sz);
          ctx.stroke();
        }
        // Göz (kamera)
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, PI2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, PI2);
        ctx.fill();
        // Lazer hattı (oyuncuya doğru)
        if (e.shootTimer > 1.5) {
          const head = G.Snake.head();
          ctx.strokeStyle = '#4488ff66';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(head.x * gs + gs / 2, head.y * gs + gs / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

      } else if (e.type === 'ghost') {
        // Hayalet — dalga kenar, saydam, ürpertici
        ctx.fillStyle = '#aaaaff';
        ctx.beginPath();
        ctx.moveTo(cx - sz, cy + sz * 0.5);
        ctx.lineTo(cx - sz, cy - sz * 0.3);
        ctx.arc(cx, cy - sz * 0.3, sz, Math.PI, 0);
        ctx.lineTo(cx + sz, cy + sz * 0.5);
        // Dalga kenar
        for (let w = 0; w < 4; w++) {
          const wx = cx + sz - w * (sz * 2 / 4) - sz / 4;
          const wy = cy + sz * 0.5 + Math.sin(t * 4 + w) * 3;
          ctx.lineTo(wx, wy);
        }
        ctx.closePath();
        ctx.fill();
        // Gözler (boş)
        ctx.fillStyle = '#222244';
        ctx.beginPath();
        ctx.ellipse(cx - 4, cy - 2, 3, 4, 0, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 4, cy - 2, 3, 4, 0, 0, PI2);
        ctx.fill();
        // İç gözler
        ctx.fillStyle = '#ff44aa';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 1, 1.5, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 4, cy - 1, 1.5, 0, PI2);
        ctx.fill();

      } else if (e.type === 'chaser') {
        // Kovalayan — agresif, kırmızı, sivri
        const chG = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, sz);
        chG.addColorStop(0, '#ff6666');
        chG.addColorStop(1, '#cc0000');
        ctx.fillStyle = chG;
        ctx.beginPath();
        // Sivri şekil
        const angle = Math.atan2(e.dir.y, e.dir.x);
        ctx.moveTo(cx + Math.cos(angle) * sz * 1.2, cy + Math.sin(angle) * sz * 1.2);
        for (let pt = 1; pt <= 5; pt++) {
          const pa = angle + pt * 1.257;
          const pr = pt % 2 === 0 ? sz * 1.2 : sz * 0.5;
          ctx.lineTo(cx + Math.cos(pa) * pr, cy + Math.sin(pa) * pr);
        }
        ctx.closePath();
        ctx.fill();
        // Gözler
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 2, 2.5, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3, cy - 2, 2.5, 0, PI2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx - 2 + e.dir.x, cy - 2 + e.dir.y, 1.2, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 2 + e.dir.x, cy - 2 + e.dir.y, 1.2, 0, PI2);
        ctx.fill();

      } else {
        // Fallback
        const fg = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, sz);
        fg.addColorStop(0, e.color);
        fg.addColorStop(1, e.color + '88');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(cx, cy, sz * 0.8, 0, PI2);
        ctx.fill();
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 3, 2, 0, PI2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3, cy - 3, 2, 0, PI2);
        ctx.fill();
      }

      // Poison overlay
      if (e._poisoned) {
        const pp = Math.sin(t * 4) * 0.1 + 0.15;
        ctx.fillStyle = `rgba(68,255,0,${pp})`;
        ctx.beginPath();
        ctx.arc(cx, cy, sz + 4, 0, PI2);
        ctx.fill();
      }

      // Stun stars
      if (e._stunTimer > 0) {
        for (let st = 0; st < 3; st++) {
          const sa = t * 5 + st * 2.094;
          const sx = cx + Math.cos(sa) * (sz + 5);
          const sy = cy + Math.sin(sa) * (sz + 5);
          ctx.fillStyle = '#ffe14dcc';
          ctx.font = '8px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', sx, sy);
        }
      }

      ctx.restore();
    }
  }
};
