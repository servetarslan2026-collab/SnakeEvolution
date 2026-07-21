// ============================================================
// player.js — Yılan (Oyuncu) Sistemi
// ============================================================
window.G = window.G || {};

G.Player = {
  _segments: [],
  _direction: { x: 0, y: -1 },
  _nextDirection: { x: 0, y: -1 },
  _speed: 8,
  _moveTimer: 0,
  _targetLength: 3,
  _hp: 3,
  _maxHp: 3,
  _shield: 0,
  _ghost: false,
  _ghostTimer: 0,
  _invincible: false,
  _invincibleTimer: 0,
  _dashCooldown: 0,
  _alive: true,
  _skinId: 'default',

  // Upgrade etkileri
  _modifiers: {
    speedMult: 0,
    magnetRange: 0,
    xpMult: 1,
    scoreMult: 1,
    goldenChance: 0,
    heartChance: 0,
    coinChance: 0,
    tailType: 'normal',
    maxLength: 0,
    blastGuard: false,
    collisionForgive: 0,
    secondLife: false,
    armor: 0,
    regen: null,
    foodExplosion: false,
    criticalFood: 0,
    dash: false,
    teleport: false,
    ghostDuration: 0,
    phaseShift: 0,
    turbo: null,
    momentum: false,
    clone: false,
    drone: false,
    autoCollect: 0,
    timeFreeze: 0,
    comboWindow: 0,
    luck: 0,
    radar: false,
    vortex: false,
    thickTail: false,
    chainTail: false
  },

  _statusEffects: [],
  _momentumCounter: 0,
  _regenTimer: 0,
  _autoCollectTimer: 0,
  _timeFreezeTimer: 0,
  _turboTimer: 0,
  _phaseShiftTimer: 0,
  _collisionForgiveTimer: 0,
  _slowdownFactor: 1,       // Yavaşlatma çarpanı (1=normal)
  _slowdownTimer: 0,        // Yavaşlatma süresi
  _iceSliding: false,       // Buz üzerinde kayma
  _electricCooldown: 0,     // Elektrik hasar bekleme
  _clone: null,             // Klon yılan verisi
  _droneAngle: 0,           // Drone açısı
  _droneActive: false,      // Drone aktif mi

  /**
   * Oyuncuyu başlat
   */
  init(skinId) {
    const spawn = G.Map.getSpawnPoint();
    this._segments = [];
    for (let i = 0; i < this._targetLength; i++) {
      this._segments.push({ x: spawn.x, y: spawn.y + i });
    }
    this._direction = { x: 0, y: -1 };
    this._nextDirection = { x: 0, y: -1 };
    // Başlangıçta dokunulmazlık (kazara ölüm engeli)
    this._invincible = true;
    this._invincibleTimer = 2.0; // 1→2 sn, daha güvenli başlangıç
    this._speed = G.Config.BASE_SPEED;
    this._moveTimer = 0;
    this._startDelay = 0.8; // Yarım→0.8 sn, oyuncu hazırlansın
    this._targetLength = G.Config.PLAYER_START_LENGTH;
    this._hp = G.Config.PLAYER_START_HP;
    this._maxHp = G.Config.PLAYER_START_HP;
    this._shield = 0;
    this._ghost = false;
    this._ghostTimer = 0;
    this._invincible = false;
    this._invincibleTimer = 0;
    this._dashCooldown = 0;
    this._alive = true;
    this._skinId = skinId || 'default';
    this._modifiers = {
      speedMult: 0, magnetRange: 0, xpMult: 1, scoreMult: 1,
      goldenChance: 0, heartChance: 0, coinChance: 0,
      tailType: 'normal', maxLength: 0, blastGuard: false,
      collisionForgive: 0, secondLife: false, armor: 0,
      regen: null, foodExplosion: false, criticalFood: 0,
      dash: false, teleport: false, ghostDuration: 0,
      phaseShift: 0, turbo: null, momentum: false,
      clone: false, drone: false, autoCollect: 0,
      timeFreeze: 0, comboWindow: 0, luck: 0,
      radar: false, vortex: false, thickTail: false, chainTail: false
    };
    this._statusEffects = [];
    this._momentumCounter = 0;
    this._regenTimer = 0;
    this._autoCollectTimer = 0;
    this._timeFreezeTimer = 0;
    this._turboTimer = 0;
    this._phaseShiftTimer = 0;
    this._collisionForgiveTimer = 0;
    this._slowdownFactor = 1;
    this._slowdownTimer = 0;
    this._iceSliding = false;
    this._electricCooldown = 0;
    this._clone = null;
    this._droneAngle = 0;
    this._droneActive = false;
  },

  /**
   * Güncelle
   */
  update(dt) {
    if (!this._alive) return;

    const C = G.Config;
    const gs = C.GRID_SIZE;

    // Yön güncelle (buz üzerindeyken yön değişimi engellenir)
    if (!this._iceSliding) {
      this._nextDirection = G.Input.getNextDirection();
    }

    // Hız hesapla
    let speed = this._speed * (1 + this._modifiers.speedMult);
    if (this._turboTimer > 0) {
      speed *= 1.5;
      this._turboTimer -= dt;
    }
    if (this._modifiers.momentum) {
      speed *= (1 + this._momentumCounter * 0.01);
    }
    // Tile yavaşlatma
    speed *= this._slowdownFactor;

    // Başlangıç gecikmesi (sadece hareketi engeller, diğer güncellemeler çalışır)
    var isStarting = this._startDelay > 0;
    if (isStarting) {
      this._startDelay -= dt;
    }

    // Hareket zamanlayıcı (başlangıç gecikmesinde çalışmaz)
    if (!isStarting) {
      this._moveTimer += dt;
      const moveInterval = 1 / speed;

      while (this._moveTimer >= moveInterval) {
        this._moveTimer -= moveInterval;
        this._move();
      }
    }

    // Invincibility timer
    if (this._invincible) {
      this._invincibleTimer -= dt;
      if (this._invincibleTimer <= 0) {
        this._invincible = false;
      }
    }

    // Ghost timer
    if (this._ghost) {
      this._ghostTimer -= dt;
      if (this._ghostTimer <= 0) {
        this._ghost = false;
      }
    }

    // Dash cooldown
    if (this._dashCooldown > 0) {
      this._dashCooldown -= dt;
    }

    // Yavaşlatma timer
    if (this._slowdownTimer > 0) {
      this._slowdownTimer -= dt;
      if (this._slowdownTimer <= 0) {
        this._slowdownFactor = 1;
        this._iceSliding = false;
      }
    }

    // Elektrik cooldown
    if (this._electricCooldown > 0) {
      this._electricCooldown -= dt;
    }

    // Mevcut tile efektlerini kontrol et (her frame)
    this._checkCurrentTileEffects(dt);

    // Sis efekti temizle (fog tile'da değilse)
    const currentTile = G.Map.getTile(this.getHead().x, this.getHead().y);
    if (currentTile !== C.TILE.FOG) {
      G.Effects.setVignette(0, 5);
    }

    // Phase shift timer
    if (this._phaseShiftTimer > 0) {
      this._phaseShiftTimer -= dt;
    }

    // Collision forgive timer
    if (this._collisionForgiveTimer > 0) {
      this._collisionForgiveTimer -= dt;
    }

    // Regen
    if (this._modifiers.regen) {
      this._regenTimer += dt;
      if (this._regenTimer >= this._modifiers.regen.interval) {
        this._regenTimer = 0;
        this.heal(this._modifiers.regen.amount);
      }
    }

    // Auto collect
    if (this._modifiers.autoCollect > 0) {
      this._autoCollectTimer += dt;
      if (this._autoCollectTimer >= this._modifiers.autoCollect) {
        this._autoCollectTimer = 0;
        this._autoCollectNearest();
      }
    }

    // Time freeze timer
    if (this._timeFreezeTimer > 0) {
      this._timeFreezeTimer -= dt;
    }

    // Manyetik etkisi
    const magnetRange = this._modifiers.magnetRange;
    if (magnetRange > 0) {
      const head = this.getHead();
      G.Food.applyMagnet(head.x, head.y, magnetRange, dt);
    }

    // Vortex etkisi
    if (this._modifiers.vortex) {
      const head = this.getHead();
      G.Food.applyMagnet(head.x, head.y, 8, dt);
    }

    // Clone Snake
    if (this._modifiers.clone && !this._clone) {
      this._clone = {
        segments: [{ x: this.getHead().x + 2, y: this.getHead().y }],
        timer: 0
      };
    }
    if (this._clone) {
      this._clone.timer += dt;
      if (this._clone.timer >= 0.2) {
        this._clone.timer = 0;
        // En yakın yeme doğru hareket et
        const cloneHead = this._clone.segments[0];
        const foods = G.Food.getNearby(cloneHead.x, cloneHead.y, 8);
        if (foods.length > 0) {
          const nearest = foods.reduce((a, b) =>
            G.Utils.dist(cloneHead.x, cloneHead.y, a.x, a.y) < G.Utils.dist(cloneHead.x, cloneHead.y, b.x, b.y) ? a : b
          );
          const angle = G.Utils.angle(cloneHead.x, cloneHead.y, nearest.x, nearest.y);
          const dx = Math.round(Math.cos(angle));
          const dy = Math.round(Math.sin(angle));
          const nx = cloneHead.x + dx;
          const ny = cloneHead.y + dy;
          if (G.Map.isWalkable(nx, ny)) {
            this._clone.segments.unshift({ x: nx, y: ny });
            if (this._clone.segments.length > 5) this._clone.segments.pop();
          }
          // Yem toplama
          const foodAtClone = G.Food.items.find(f => f.alive && f.x === cloneHead.x && f.y === cloneHead.y);
          if (foodAtClone) {
            G.Game.collectFood(foodAtClone);
          }
        }
      }
    }

    // Mini Drone
    if (this._modifiers.drone) {
      this._droneActive = true;
      this._droneAngle += dt * 3; // Dönme hızı
      const head = this.getHead();
      const gs = G.Config.GRID_SIZE;
      const droneX = head.x + Math.cos(this._droneAngle) * 2;
      const droneY = head.y + Math.sin(this._droneAngle) * 2;
      // Düşman hasarı
      const enemy = G.Game ? G.Game.getEnemyAt(Math.round(droneX), Math.round(droneY)) : null;
      if (enemy) {
        G.Enemy.damageEnemy(enemy, 1);
      }
    }

    // Parçacık izi
    if (G.Save.get('settings.particles') !== false && this._segments.length > 0) {
      const tail = this._segments[this._segments.length - 1];
      const skin = G.Skin.getSkin(this._skinId);
      if (Math.random() < 0.3) {
        G.Particles.trail(tail.x * gs + gs / 2, tail.y * gs + gs / 2, skin.glow || '#00ffcc');
      }
    }
  },

  _move() {
    const C = G.Config;
    const head = this.getHead();

    // Yönü uygula
    this._direction = { ...this._nextDirection };
    G.Input.applyDirection();

    // Yeni kafa pozisyonu
    let nx = head.x + this._direction.x;
    let ny = head.y + this._direction.y;

    // Ghost mode: duvarlardan geç
    if (this._ghost) {
      if (nx < 0) nx = C.COLS - 1;
      if (nx >= C.COLS) nx = 0;
      if (ny < 0) ny = C.ROWS - 1;
      if (ny >= C.ROWS) ny = 0;
    }

    // Tile kontrolü
    const tile = G.Map.getTile(nx, ny);

    // Duvar kontrolü
    if (tile === C.TILE.WALL && !this._ghost) {
      this.takeDamage('wall');
      return;
    }

    // Lava — yavaşlatır ve hafif hasar
    if (tile === C.TILE.LAVA && !this._invincible) {
      this._slowdownFactor = 0.5;
      this._slowdownTimer = 0.5;
      if (!this._modifiers.blastGuard) {
        // Her 1.5 sn'de bir hasar
        if (this._electricCooldown <= 0) {
          this.takeDamage('lava');
          this._electricCooldown = 1.5;
        }
      }
    }

    // Buz — kayma, yön değişimi zor
    if (tile === C.TILE.ICE) {
      this._iceSliding = true;
      this._slowdownFactor = 1.3; // Hızlı kayma
      this._slowdownTimer = 0.3;
      // Bir sonraki yön değişimi engellenecek (input'ta kontrol)
    }

    // Çalı — yavaşlatır
    if (tile === C.TILE.BUSH) {
      this._slowdownFactor = 0.4;
      this._slowdownTimer = 0.3;
    }

    // Sis — görüş alanı daralır (vignette efekti)
    if (tile === C.TILE.FOG) {
      G.Effects.setVignette(0.6, 3);
    }

    // Elektrik — periyodik hasar
    if (tile === C.TILE.ELECTRIC && !this._invincible) {
      if (this._electricCooldown <= 0) {
        this.takeDamage('electric');
        this._electricCooldown = 2;
        const gs = C.GRID_SIZE;
        G.Particles.spark(nx * gs + gs / 2, ny * gs + gs / 2, '#ffff00');
        G.Audio.play('hit');
      }
    }

    // Portal
    if (tile === C.TILE.PORTAL) {
      const target = G.Map.getPortalTarget(nx, ny);
      if (target) {
        nx = target.x;
        ny = target.y;
        // Portal efekti
        const gs = C.GRID_SIZE;
        G.Particles.vortex(nx * gs + gs / 2, ny * gs + gs / 2, '#aa00ff', 8);
        G.Audio.play('dash');
      }
    }

    // Sandık
    if (tile === C.TILE.CRATE) {
      G.Map.setTile(nx, ny, C.TILE.EMPTY);
      // Rastgele ödül
      const reward = G.Utils.randomPick(['coin', 'coin', 'coin', 'golden', 'heart']);
      G.Food.spawn(reward);
      G.Particles.spark(nx * C.GRID_SIZE + C.GRID_SIZE / 2, ny * C.GRID_SIZE + C.GRID_SIZE / 2, '#ffaa00');
    }

    // Kuyruk çarpışma kontrolü
    if (!this._ghost && this._collisionForgiveTimer <= 0) {
      for (let i = 1; i < this._segments.length; i++) {
        if (this._segments[i].x === nx && this._segments[i].y === ny) {
          this.takeDamage('self');
          return;
        }
      }
    }

    // Düşman çarpışma
    if (this._phaseShiftTimer <= 0 && !this._invincible && this._collisionForgiveTimer <= 0) {
      const enemy = G.Game ? G.Game.getEnemyAt(nx, ny) : null;
      if (enemy) {
        this.takeDamage('enemy');
        return;
      }
    }

    // Yeni kafa ekle
    this._segments.unshift({ x: nx, y: ny });

    // Kuyruk uzunluğu kontrolü
    while (this._segments.length > this._targetLength) {
      this._segments.pop();
    }

    // Momentum
    if (this._modifiers.momentum) {
      this._momentumCounter = Math.min(this._momentumCounter + 1, 50);
    }
  },

  /**
   * Hasar al
   */
  takeDamage(source) {
    if (this._invincible) return;

    // Shield kontrolü
    if (this._shield > 0) {
      this._shield--;
      this._invincible = true;
      this._invincibleTimer = 0.5;
      G.Audio.play('shield');
      const head = this.getHead();
      const gs = G.Config.GRID_SIZE;
      G.Particles.burst(head.x * gs + gs / 2, head.y * gs + gs / 2, '#00aaff', 10);
      G.Effects.shake(3, 0.2);
      return;
    }

    // Armor
    if (this._modifiers.armor > 0) {
      this._modifiers.armor--;
      this._invincible = true;
      this._invincibleTimer = 0.5;
      G.Audio.play('hit');
      return;
    }

    this._hp--;
    G.Audio.play('hit');
    G.Effects.shake(5, 0.2);
    G.Effects.flash('#ff000044', 0.15);

    const head = this.getHead();
    const gs = G.Config.GRID_SIZE;
    G.Particles.burst(head.x * gs + gs / 2, head.y * gs + gs / 2, '#ff2244', 15);

    if (this._hp <= 0) {
      // Second Life kontrolü
      if (this._modifiers.secondLife) {
        this._modifiers.secondLife = false;
        this._hp = Math.ceil(this._maxHp / 2);
        this._invincible = true;
        this._invincibleTimer = 2;
        G.Particles.ring(head.x * gs + gs / 2, head.y * gs + gs / 2, '#ff44aa', 60);
        G.Audio.play('eat_heart');
        return;
      }
      this.die(source);
    } else {
      this._invincible = true;
      this._invincibleTimer = G.Config.INVINCIBLE_DURATION;
    }
  },

  /**
   * Öl
   */
  die(source) {
    this._alive = false;
    G.Effects.death();

    const head = this.getHead();
    const gs = G.Config.GRID_SIZE;

    // Parçalanma efekti
    for (const seg of this._segments) {
      G.Particles.burst(seg.x * gs + gs / 2, seg.y * gs + gs / 2, '#00ffcc', 5);
    }

    G.Audio.play('die');

    // Game over
    if (G.Game) {
      G.Game.onPlayerDeath(source);
    }
  },

  /**
   * Can yenile
   */
  heal(amount) {
    this._hp = Math.min(this._hp + amount, this._maxHp);
  },

  /**
   * Büyüt
   */
  grow(amount) {
    this._targetLength += amount;
  },

  /**
   * Can azalt (zehir vs.)
   */
  shrink(amount) {
    this._targetLength = Math.max(3, this._targetLength - amount);
    while (this._segments.length > this._targetLength) {
      this._segments.pop();
    }
  },

  /**
   * Dash
   */
  dash() {
    if (!this._modifiers.dash || this._dashCooldown > 0) return;
    this._dashCooldown = G.Config.DASH_COOLDOWN;

    const gs = G.Config.GRID_SIZE;
    for (let i = 0; i < G.Config.DASH_DISTANCE; i++) {
      const head = this.getHead();
      const nx = head.x + this._direction.x;
      const ny = head.y + this._direction.y;
      if (G.Map.isWalkable(nx, ny)) {
        this._segments.unshift({ x: nx, y: ny });
        while (this._segments.length > this._targetLength) this._segments.pop();
        G.Particles.trail(nx * gs + gs / 2, ny * gs + gs / 2, '#00ffcc');
      }
    }
    G.Audio.play('dash');
    G.Effects.shake(2, 0.1);
  },

  /**
   * Teleport
   */
  teleport() {
    if (!this._modifiers.teleport || this._dashCooldown > 0) return;
    this._dashCooldown = 5;

    const head = this.getHead();
    const pos = G.Map.getRandomEmpty(head.x, head.y, 8);
    const gs = G.Config.GRID_SIZE;

    // Eski pozisyonda efekt
    G.Particles.vortex(head.x * gs + gs / 2, head.y * gs + gs / 2, '#aa00ff', 12);

    // Tüm segmentleri yeni pozisyona taşı
    const dx = pos.x - head.x;
    const dy = pos.y - head.y;
    for (const seg of this._segments) {
      seg.x += dx;
      seg.y += dy;
    }

    // Yeni pozisyonda efekt
    G.Particles.vortex(pos.x * gs + gs / 2, pos.y * gs + gs / 2, '#aa00ff', 12);
    G.Audio.play('dash');
  },

  /**
   * Ghost mode aç
   */
  activateGhost(duration) {
    this._ghost = true;
    this._ghostTimer = duration || G.Config.GHOST_DURATION;
  },

  /**
   * Phase shift (düşmanlardan geç)
   */
  activatePhaseShift(duration) {
    this._phaseShiftTimer = duration || 5;
  },

  /**
   * Turbo
   */
  activateTurbo(duration) {
    this._turboTimer = duration || 3;
  },

  /**
   * Time freeze
   */
  activateTimeFreeze(duration) {
    this._timeFreezeTimer = duration || 5;
  },

  /**
   * Invincible
   */
  activateInvincible(duration) {
    this._invincible = true;
    this._invincibleTimer = duration || 3;
  },

  /**
   * Collision forgive
   */
  activateCollisionForgive(duration) {
    this._collisionForgiveTimer = duration || 3;
  },

  /**
   * Mevcut tile efektlerini her frame kontrol et
   */
  _checkCurrentTileEffects(dt) {
    const C = G.Config;
    const head = this.getHead();
    const tile = G.Map.getTile(head.x, head.y);
    const gs = C.GRID_SIZE;

    // Lava — yavaşlatır ve periyodik hasar
    if (tile === C.TILE.LAVA) {
      this._slowdownFactor = 0.5;
      this._slowdownTimer = 0.5;
      if (!this._invincible && !this._modifiers.blastGuard) {
        if (this._electricCooldown <= 0) {
          this.takeDamage('lava');
          this._electricCooldown = 1.5;
          G.Particles.burst(head.x * gs + gs / 2, head.y * gs + gs / 2, '#ff4400', 8);
        }
      }
    }

    // Buz — kayma
    if (tile === C.TILE.ICE) {
      this._iceSliding = true;
      this._slowdownFactor = 1.3;
      this._slowdownTimer = 0.3;
    }

    // Çalı — yavaşlatma
    if (tile === C.TILE.BUSH) {
      this._slowdownFactor = 0.4;
      this._slowdownTimer = 0.3;
    }

    // Sis — vignette
    if (tile === C.TILE.FOG) {
      G.Effects.setVignette(0.6, 3);
    }

    // Elektrik — periyodik hasar
    if (tile === C.TILE.ELECTRIC && !this._invincible) {
      if (this._electricCooldown <= 0) {
        this.takeDamage('electric');
        this._electricCooldown = 2;
        G.Particles.spark(head.x * gs + gs / 2, head.y * gs + gs / 2, '#ffff00');
        G.Audio.play('hit');
      }
    }
  },

  /**
   * En yakın yemi otomatik topla
   */
  _autoCollectNearest() {
    const head = this.getHead();
    const foods = G.Food.getNearby(head.x, head.y, 10);
    if (foods.length > 0) {
      const nearest = foods.reduce((a, b) =>
        G.Utils.dist(head.x, head.y, a.x, a.y) < G.Utils.dist(head.x, head.y, b.x, b.y) ? a : b
      );
      G.Game.collectFood(nearest);
    }
  },

  /**
   * Modifier uygula (upgrade'den gelen)
   */
  applyModifier(mod) {
    for (const [key, value] of Object.entries(mod)) {
      if (key in this._modifiers) {
        if (typeof value === 'boolean') {
          this._modifiers[key] = value;
        } else if (typeof value === 'number') {
          if (key.endsWith('Mult') || key.endsWith('Chance')) {
            this._modifiers[key] += value;
          } else {
            this._modifiers[key] += value;
          }
        } else if (typeof value === 'object' && value !== null) {
          this._modifiers[key] = value;
        }
      }
    }

    // Max hp artışı
    if (mod.maxHp) {
      this._maxHp = Math.min(this._maxHp + mod.maxHp, G.Config.PLAYER_MAX_HP);
      this._hp = Math.min(this._hp + mod.maxHp, this._maxHp);
    }

    // Shield
    if (mod.shield) {
      this._shield += mod.shield;
    }

    // Max length
    if (mod.maxLength) {
      this._targetLength += mod.maxLength;
    }

    // Ghost mode
    if (mod.ghostDuration) {
      this.activateGhost(mod.ghostDuration);
    }

    // Phase shift
    if (mod.phaseShift) {
      this.activatePhaseShift(mod.phaseShift);
    }
  },

  /**
   * Mevcut kafa pozisyonu
   */
  getHead() {
    return this._segments[0] || { x: 20, y: 15 };
  },

  /**
   * Segment listesi
   */
  getSegments() {
    return this._segments;
  },

  isAlive() { return this._alive; },
  getHp() { return this._hp; },
  getMaxHp() { return this._maxHp; },
  getSpeed() { return this._speed * (1 + this._modifiers.speedMult); },
  getLength() { return this._targetLength; },
  hasShield() { return this._shield > 0; },
  isGhost() { return this._ghost; },
  isInvincible() { return this._invincible; },
  getModifiers() { return this._modifiers; },
  isTimeFrozen() { return this._timeFreezeTimer > 0; },
  getDashCooldown() { return this._dashCooldown; },

  /**
   * Skor çarpanı
   */
  getScoreMult() {
    return this._modifiers.scoreMult;
  },

  /**
   * XP çarpanı
   */
  getXpMult() {
    return this._modifiers.xpMult;
  },

  /**
   * Profesyonel yılan çizimi
   */
  draw(ctx) {
    if (!this._alive) return;

    const gs = G.Config.GRID_SIZE;
    const skin = G.Skin.getSkin(this._skinId);
    const now = Date.now();
    const segments = this._segments;
    const len = segments.length;
    if (len === 0) return;

    // --- Clone Snake (daha iyi) ---
    if (this._clone && this._clone.segments) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (let ci = 0; ci < this._clone.segments.length; ci++) {
        const cs = this._clone.segments[ci];
        const ccx = cs.x * gs + gs / 2;
        const ccy = cs.y * gs + gs / 2;
        const csize = (gs / 2 - 3) * (1 - ci / this._clone.segments.length * 0.3);
        ctx.fillStyle = ci === 0 ? skin.headColor : skin.bodyColor;
        ctx.globalAlpha = 0.4 - ci * 0.05;
        ctx.beginPath();
        ctx.arc(ccx, ccy, csize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // --- Mini Drone (daha iyi) ---
    if (this._droneActive) {
      const head = this.getHead();
      const dcx = head.x * gs + gs / 2 + Math.cos(this._droneAngle) * gs * 1.8;
      const dcy = head.y * gs + gs / 2 + Math.sin(this._droneAngle) * gs * 1.8;
      ctx.save();
      // Drone gövdesi
      const dg = ctx.createRadialGradient(dcx, dcy, 0, dcx, dcy, 6);
      dg.addColorStop(0, '#aaccff');
      dg.addColorStop(1, '#4488ff');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(dcx, dcy, 6, 0, Math.PI * 2);
      ctx.fill();
      // Kanatlar (dönen)
      ctx.strokeStyle = '#88aaff';
      ctx.lineWidth = 1.5;
      const wingAngle = now / 80;
      for (let w = 0; w < 4; w++) {
        const wa = wingAngle + w * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(dcx, dcy);
        ctx.lineTo(dcx + Math.cos(wa) * 10, dcy + Math.sin(wa) * 4);
        ctx.stroke();
      }
      // Glow
      if (G.Save.get('settings.glow') !== false) {
        ctx.shadowColor = '#4488ff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#4488ff44';
        ctx.beginPath();
        ctx.arc(dcx, dcy, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // --- Kuyruk izi (trail) ---
    if (G.Save.get('settings.particles') !== false && len > 2) {
      const tail = segments[len - 1];
      if (Math.random() < 0.4) {
        G.Particles.trail(tail.x * gs + gs / 2, tail.y * gs + gs / 2, skin.glow || '#00ffcc');
      }
    }

    // --- Segment bağlantı çizgisi ---
    ctx.save();
    ctx.strokeStyle = skin.bodyColor || '#00aa88';
    ctx.lineWidth = gs * 0.35;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(segments[0].x * gs + gs / 2, segments[0].y * gs + gs / 2);
    for (let i = 1; i < len; i++) {
      ctx.lineTo(segments[i].x * gs + gs / 2, segments[i].y * gs + gs / 2);
    }
    ctx.stroke();
    ctx.restore();

    // --- Segmentler (kuyruktan kafaya) ---
    for (let i = len - 1; i >= 0; i--) {
      const seg = segments[i];
      const px = seg.x * gs;
      const py = seg.y * gs;
      const segT = i / Math.max(1, len - 1);
      const scale = 1 - segT * 0.25;
      const cx = px + gs / 2;
      const cy = py + gs / 2;
      const size = (gs / 2 - 1) * scale;

      ctx.save();

      // Invincible yanıp sönme
      if (this._invincible && Math.floor(now / 80) % 3 === 0) {
        ctx.globalAlpha = 0.3;
      }

      // Ghost saydamlık
      if (this._ghost) {
        ctx.globalAlpha = 0.35;
      }

      if (i === 0) {
        // ==================== KAFA ====================
        // Glow
        if (G.Save.get('settings.glow') !== false) {
          ctx.shadowColor = skin.glow || '#00ffcc';
          ctx.shadowBlur = 18;
        }

        // Kafa gövdesi (daha iyi gradient)
        const hg = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, size + 1);
        hg.addColorStop(0, this._lightenColor(skin.headColor, 50));
        hg.addColorStop(0.6, skin.headColor);
        hg.addColorStop(1, this._darkenColor(skin.headColor, 30));
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(cx, cy, size + 1, 0, Math.PI * 2);
        ctx.fill();

        // Kafa deseni (üst highlight)
        const hlg = ctx.createRadialGradient(cx - 4, cy - 4, 0, cx, cy, size);
        hlg.addColorStop(0, 'rgba(255,255,255,0.35)');
        hlg.addColorStop(0.4, 'rgba(255,255,255,0.08)');
        hlg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hlg;
        ctx.beginPath();
        ctx.arc(cx, cy, size + 1, 0, Math.PI * 2);
        ctx.fill();

        // Gözler (daha iyi)
        this._drawEyes(ctx, cx, cy, size, skin);

        // Glow canvas
        if (G.Save.get('settings.glow') !== false) {
          const glowCtx = G.Renderer.getGlowCtx();
          glowCtx.save();
          glowCtx.shadowColor = skin.glow || '#00ffcc';
          glowCtx.shadowBlur = 25;
          glowCtx.fillStyle = skin.glow || '#00ffcc';
          glowCtx.globalAlpha = 0.6;
          glowCtx.beginPath();
          glowCtx.arc(cx, cy, size * 0.7, 0, Math.PI * 2);
          glowCtx.fill();
          glowCtx.restore();
        }

      } else {
        // ==================== GÖVDE ====================
        // Gövde gradient
        const bg = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, size);
        bg.addColorStop(0, this._lightenColor(skin.bodyColor, 20));
        bg.addColorStop(1, skin.bodyColor || '#00aa88');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Segment deseni (her 2. segmentte parlak nokta)
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath();
          ctx.arc(cx - 1, cy - 1, size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        // Kuyruk ucu (son segment)
        if (i === len - 1) {
          const prevSeg = segments[Math.max(0, i - 1)];
          const angle = G.Utils.angle(seg.x, seg.y, prevSeg.x, prevSeg.y);
          ctx.fillStyle = this._darkenColor(skin.bodyColor, 20);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * size * 0.8, cy + Math.sin(angle) * size * 0.8);
          ctx.lineTo(cx + Math.cos(angle + 2.3) * size * 0.5, cy + Math.sin(angle + 2.3) * size * 0.5);
          ctx.lineTo(cx + Math.cos(angle - 2.3) * size * 0.5, cy + Math.sin(angle - 2.3) * size * 0.5);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // --- Kuyruk efekti (upgrade göre) ---
    if (len > 1) {
      const tail = segments[len - 1];
      const tcx = tail.x * gs + gs / 2;
      const tcy = tail.y * gs + gs / 2;
      if (this._modifiers.tailType === 'fire') {
        if (Math.random() < 0.5) G.Particles.emit({x: tcx, y: tcy, vx: (Math.random()-0.5)*30, vy: -20-Math.random()*40, life: 0.3, size: 3, endSize: 0, color: '#ff4400', alpha: 0.8, endAlpha: 0, shape: 'dot'});
      } else if (this._modifiers.tailType === 'ice') {
        if (Math.random() < 0.3) G.Particles.emit({x: tcx, y: tcy, vx: (Math.random()-0.5)*20, vy: -10-Math.random()*20, life: 0.4, size: 2, endSize: 0, color: '#00ccff', alpha: 0.7, endAlpha: 0, shape: 'star'});
      } else if (this._modifiers.tailType === 'poison') {
        if (Math.random() < 0.3) G.Particles.emit({x: tcx, y: tcy, vx: (Math.random()-0.5)*15, vy: -5-Math.random()*15, life: 0.5, size: 2, endSize: 4, color: '#44ff00', alpha: 0.5, endAlpha: 0, shape: 'dot'});
      } else if (this._modifiers.tailType === 'electric') {
        if (Math.random() < 0.4) G.Particles.emit({x: tcx, y: tcy, vx: (Math.random()-0.5)*50, vy: (Math.random()-0.5)*50, life: 0.15, size: 1, endSize: 0, color: '#ffff00', alpha: 1, endAlpha: 0, shape: 'line'});
      }
    }
  },

  _drawEyes(ctx, cx, cy, size, skin) {
    const dir = this._direction;
    const eyeOffset = size * 0.38;
    const eyeSize = size * 0.22;

    // Göz pozisyonları (yöne göre offset)
    const lx = cx + dir.x * 3 - dir.y * eyeOffset;
    const ly = cy + dir.y * 3 + dir.x * eyeOffset;
    const rx = cx + dir.x * 3 + dir.y * eyeOffset;
    const ry = cy + dir.y * 3 - dir.x * eyeOffset;

    // Göz beyazı (dış)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lx, ly, eyeSize + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rx, ry, eyeSize + 2, 0, Math.PI * 2);
    ctx.fill();

    // Göz iris (renkli)
    const irisColor = skin.glow || '#00ffcc';
    ctx.fillStyle = irisColor;
    ctx.beginPath();
    ctx.arc(lx + dir.x * 1.5, ly + dir.y * 1.5, eyeSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rx + dir.x * 1.5, ry + dir.y * 1.5, eyeSize * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Göz bebeği (siyah, yön offsetli)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(lx + dir.x * 2.5, ly + dir.y * 2.5, eyeSize * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rx + dir.x * 2.5, ry + dir.y * 2.5, eyeSize * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Göz highlight (parlak nokta)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(lx + dir.x * 1 - 1, ly + dir.y * 1 - 1, eyeSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rx + dir.x * 1 - 1, ry + dir.y * 1 - 1, eyeSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
  },

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  _lightenColor(hex, amount) {
    if (!hex) return '#ffffff';
    const { r, g, b } = G.Utils.hexToRgb(hex);
    return G.Utils.rgbToHex(
      Math.min(255, r + amount),
      Math.min(255, g + amount),
      Math.min(255, b + amount)
    );
  },

  _darkenColor(hex, amount) {
    if (!hex) return '#000000';
    const { r, g, b } = G.Utils.hexToRgb(hex);
    return G.Utils.rgbToHex(
      Math.max(0, r - amount),
      Math.max(0, g - amount),
      Math.max(0, b - amount)
    );
  }
};
