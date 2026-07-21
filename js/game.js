// ============================================================
// game.js — Ana Oyun Motoru (State Machine)
// ============================================================
window.G = window.G || {};

G.Game = {
  // State
  state: 'boot',
  _prevState: null,
  _stateTimer: 0,

  // Oyun verisi
  score: 0,
  level: 1,
  xp: 0,
  xpToNext: 30, // 50→30, daha hızlı ilk level
  currentBiome: 'neon_city',
  gameTime: 0,
  bossLevel: false,
  _foodExplosionActive: false,

  // Menu state
  _menuIndex: 0,
  _settingsIndex: 0,
  _howToPlayPage: 0,
  _gameOverBtnIndex: 0,
  _levelUpChoices: [],
  _levelUpIndex: 0,

  // AI demo (menü arka planı)
  _demoSnake: null,
  _demoTimer: 0,

  /**
   * Motoru başlat
   */
  init() {
    const canvas = G.Renderer.init('game-container');
    G.Input.init(canvas);
    G.Particles.init();
    G.Food.init();
    G.Enemy.init();
    G.Boss.init();
    G.Upgrade.init();
    G.Combo.init();
    G.UI.init();
    G.Stats.startSession();

    this.changeState('boot');
    this._startLoop();
  },

  /**
   * State değiştir
   */
  changeState(newState) {
    this._prevState = this.state;
    this.state = newState;
    this._stateTimer = 0;

    switch (newState) {
      case 'boot':
        setTimeout(() => this.changeState('mainMenu'), 1500);
        break;
      case 'mainMenu':
        this._menuIndex = 0;
        this._initDemo();
        G.Audio.startMusic('menu');
        break;
      case 'playing':
        G.Input.enable();
        G.Input.resetDirection();
        break;
      case 'paused':
        G.Input.enable();
        break;
      case 'levelUp':
        this._levelUpChoices = G.Upgrade.getChoices(3);
        this._levelUpIndex = 0;
        G.Input.enable();
        break;
      case 'gameOver':
        this._gameOverBtnIndex = 0;
        G.Audio.stopMusic();
        G.Audio.play('game_over');
        break;
    }
  },

  /**
   * Yeni oyun başlat
   */
  startNewGame() {
    this.score = 0;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 30; // Daha hızlı ilk level
    this.currentBiome = 'neon_city';
    this.gameTime = 0;
    this.bossLevel = false;

    G.Map.generate(this.currentBiome);
    G.Player.init(G.Skin.getEquipped());
    G.Food.init();
    G.Enemy.init();
    G.Boss.init();
    G.Upgrade.init();
    G.Combo.init();
    G.Particles.clear();
    G.Stats.startSession();

    // İlk yemleri spawn et (daha fazla)
    for (let i = 0; i < 5; i++) {
      G.Food.spawn(G.Food.getRandomType());
    }

    G.Renderer.markBgDirty();
    G.Audio.startMusic('playing');
    this.changeState('playing');
  },

  // --- ANA DÖNGÜ ---

  _startLoop() {
    let lastTime = performance.now();
    const loop = (now) => {
      let dt = (now - lastTime) / 1000;
      lastTime = now;
      dt = Math.min(dt, 0.05); // Cap

      // SlowMo
      dt *= G.Effects.getDtMult();

      this._stateTimer += dt;

      this.update(dt);
      this.draw();

      G.Input.clearOnce();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  /**
   * Güncelle
   */
  update(dt) {
    G.Effects.update(dt);
    G.Particles.update(dt);
    G.UI.update(dt);

    switch (this.state) {
      case 'boot':
        break;

      case 'mainMenu':
        this._updateMainMenu(dt);
        break;

      case 'playing':
        this._updatePlaying(dt);
        break;

      case 'paused':
        this._updatePaused(dt);
        break;

      case 'levelUp':
        this._updateLevelUp(dt);
        break;

      case 'gameOver':
        this._updateGameOver(dt);
        break;

      case 'howToPlay':
        if (G.Input.isPressedOnce('ArrowRight')) this._howToPlayPage = Math.min(2, this._howToPlayPage + 1);
        if (G.Input.isPressedOnce('ArrowLeft')) this._howToPlayPage = Math.max(0, this._howToPlayPage - 1);
        if (G.Input.isPressedOnce('Escape')) this.changeState('mainMenu');
        break;

      case 'settings':
        this._handleSettingsInput();
        break;

      case 'statistics':
        if (G.Input.isPressedOnce('Escape')) this.changeState('mainMenu');
        break;

      case 'credits':
        if (G.Input.isPressedOnce('Escape')) this.changeState('mainMenu');
        break;

      case 'upgrades':
        if (G.Input.isPressedOnce('Escape')) this.changeState('mainMenu');
        break;
    }
  },

  _updateMainMenu(dt) {
    this._demoTimer += dt;

    // Demo yılanı
    if (!this._demoSnake) this._initDemo();
    this._updateDemo(dt);

    // Navigasyon
    if (G.Input.isPressedOnce('ArrowUp') || G.Input.isPressedOnce('KeyW')) {
      this._menuIndex = (this._menuIndex - 1 + 6) % 6;
      G.Audio.play('button');
    }
    if (G.Input.isPressedOnce('ArrowDown') || G.Input.isPressedOnce('KeyS')) {
      this._menuIndex = (this._menuIndex + 1) % 6;
      G.Audio.play('button');
    }
    if (G.Input.isPressedOnce('Enter') || G.Input.isPressedOnce('Space')) {
      G.Audio.play('button');
      switch (this._menuIndex) {
        case 0: this.startNewGame(); break;
        case 1: this.changeState('howToPlay'); break;
        case 2: this.changeState('upgrades'); break;
        case 3: this.changeState('statistics'); break;
        case 4: this.changeState('settings'); break;
        case 5: this.changeState('credits'); break;
      }
    }
  },

  _updatePlaying(dt) {
    this.gameTime += dt;
    G.Player.update(dt);

    if (!G.Player.isAlive()) return;

    G.Food.update(dt);
    G.Enemy.update(dt);
    G.Boss.update(dt);
    G.Combo.update(dt);

    // Günlük görev kontrolü (her 5 sn'de bir)
    if (Math.floor(this.gameTime) % 5 === 0 && Math.floor(this.gameTime) !== Math.floor(this.gameTime - dt)) {
      G.Stats.checkDailyQuests();
    }

    // Yem çarpışma kontrolü
    this._checkFoodCollision();

    // Boss çarpışma kontrolü (boss saldırıları boss.js'de)

    // Pause
    if (G.Input.isPressedOnce('Escape')) {
      this.changeState('paused');
      return;
    }

    // Dash
    if (G.Input.isPressedOnce('Space')) {
      G.Player.dash();
      G.Player.teleport();
    }
  },

  _updatePaused(dt) {
    if (G.Input.isPressedOnce('Escape')) {
      this.changeState('playing');
    }
  },

  _updateLevelUp(dt) {
    if (G.Input.isPressedOnce('ArrowLeft') || G.Input.isPressedOnce('KeyA')) {
      this._levelUpIndex = (this._levelUpIndex - 1 + this._levelUpChoices.length) % this._levelUpChoices.length;
      G.Audio.play('button');
    }
    if (G.Input.isPressedOnce('ArrowRight') || G.Input.isPressedOnce('KeyD')) {
      this._levelUpIndex = (this._levelUpIndex + 1) % this._levelUpChoices.length;
      G.Audio.play('button');
    }

    // 1-2-3 tuşları
    for (let i = 0; i < this._levelUpChoices.length; i++) {
      if (G.Input.isPressedOnce(`Digit${i + 1}`)) {
        this._selectUpgrade(i);
        return;
      }
    }

    if (G.Input.isPressedOnce('Enter') || G.Input.isPressedOnce('Space')) {
      this._selectUpgrade(this._levelUpIndex);
    }
  },

  _selectUpgrade(idx) {
    const choice = this._levelUpChoices[idx];
    if (choice) {
      G.Upgrade.apply(choice);
      G.UI.notify(`${choice.icon} ${choice.name}`, '#00ffcc', 2);
    }
    this.changeState('playing');
  },

  _updateGameOver(dt) {
    if (G.Input.isPressedOnce('ArrowLeft') || G.Input.isPressedOnce('KeyA')) {
      this._gameOverBtnIndex = (this._gameOverBtnIndex - 1 + 2) % 2;
      G.Audio.play('button');
    }
    if (G.Input.isPressedOnce('ArrowRight') || G.Input.isPressedOnce('KeyD')) {
      this._gameOverBtnIndex = (this._gameOverBtnIndex + 1) % 2;
      G.Audio.play('button');
    }
    if (G.Input.isPressedOnce('Enter') || G.Input.isPressedOnce('Space')) {
      G.Audio.play('button');
      if (this._gameOverBtnIndex === 0) {
        this.startNewGame();
      } else {
        this.changeState('mainMenu');
      }
    }
  },

  // --- YEM ÇARPIŞMA ---

  _checkFoodCollision() {
    const head = G.Player.getHead();
    const foods = G.Food.items;

    for (let i = foods.length - 1; i >= 0; i--) {
      const f = foods[i];
      if (!f.alive) continue;
      if (f.x === head.x && f.y === head.y) {
        this.collectFood(f);
      }
    }
  },

  /**
   * Yem topla (manyetik, otomatik toplama vs. için de kullanılır)
   */
  collectFood(f) {
    if (!f.alive) return;

    const C = G.Config;
    const player = G.Player;
    const combo = G.Combo;

    // Combo
    combo.hit();
    const comboMult = combo.getMultiplier();

    // Skor
    const scoreGain = (f.score || 0) * player.getScoreMult() * comboMult;
    this.score += scoreGain;

    // XP
    const xpGain = (f.xp || 0) * player.getXpMult();
    this.xp += xpGain;

    // Büyüme
    if (f.length > 0) player.grow(f.length);
    if (f.length < 0) player.shrink(Math.abs(f.length));

    // Can
    if (f.hp > 0) player.heal(f.hp);

    // Coin
    if (f.effect === 'coin') {
      const coinAmount = G.Utils.randomInt(1, 5);
      G.Save.add('progress.coins', coinAmount);
      G.Stats.getSession().coinsEarned += coinAmount;
    }

    // Özel efektler
    if (f.effect === 'slowmo') {
      G.Effects.slowMo(0.3, 3);
    }
    if (f.effect === 'bomb') {
      // Bomba zaten food.js'de timer ile yönetiliyor
    }
    if (f.effect === 'magnet') {
      player.applyModifier({ magnetRange: 5 });
      setTimeout(() => player.applyModifier({ magnetRange: -5 }), 5000);
    }
    if (f.effect === 'lucky') {
      this._applyLuckyEffect();
    }
    if (f.effect === 'invincible') {
      player.activateInvincible(3);
    }

    // Manyetik yem sayacı
    if (f.effect === 'magnet') {
      G.Stats.getSession().magnetFood++;
    }

    // Level atlama kontrolü
    if (this.xp >= this.xpToNext) {
      this._levelUp();
    }

    // Parçacık efekti
    const gs = C.GRID_SIZE;
    G.Particles.burst(f.x * gs + gs / 2, f.y * gs + gs / 2, f.color, 10);
    if (scoreGain > 0) {
      G.Particles.floatText(f.x * gs + gs / 2, f.y * gs - 10, `+${scoreGain}`, '#ffffff');
    }

    // Ses
    const soundMap = {
      normal: 'eat', golden: 'eat_gold', crystal: 'eat_crystal',
      heart: 'eat_heart', clock: 'eat_clock', bomb: 'eat_bomb',
      poison: 'eat_poison', magnet: 'eat_magnet', lucky: 'eat_lucky',
      star: 'eat_star', coin: 'eat_coin'
    };
    G.Audio.play(soundMap[f.type] || 'eat');

    // Food explosion upgrade (recursion guard)
    if (player.getModifiers().foodExplosion && !this._foodExplosionActive) {
      this._foodExplosionActive = true;
      const nearby = G.Food.getNearby(f.x, f.y, 2);
      for (const nf of nearby) {
        if (nf !== f && nf.alive) {
          this.collectFood(nf);
        }
      }
      this._foodExplosionActive = false;
    }

    // Critical food
    if (player.getModifiers().criticalFood > 0) {
      if (Math.random() < player.getModifiers().criticalFood) {
        this.score += scoreGain;
        G.Particles.floatText(f.x * gs + gs / 2, f.y * gs - 25, 'CRITICAL!', '#ffaa00');
      }
    }

    // İstatistik
    G.Stats.onFood(f.type);

    // Kaldır
    G.Food.collect(f);
  },

  /**
   * Şanslı yem efekti
   */
  _applyLuckyEffect() {
    const effects = [
      () => { this.score += 10; G.UI.notify('+10 Score!', '#ffaa00'); },
      () => { G.Player.heal(2); G.UI.notify('+2 HP!', '#ff44aa'); },
      () => { this.xp += 30; G.UI.notify('+30 XP!', '#aa44ff'); },
      () => { G.Player.activateInvincible(3); G.UI.notify('Invincible!', '#ffffff'); },
      () => { G.Effects.slowMo(0.3, 5); G.UI.notify('Slow Motion!', '#4488ff'); },
      () => { G.Save.add('progress.coins', 10); G.UI.notify('+10 Coins!', '#ffcc00'); }
    ];
    G.Utils.randomPick(effects)();
  },

  /**
   * Level atlama
   */
  _levelUp() {
    this.xp -= this.xpToNext;
    this.level++;
    this.xpToNext = Math.floor(this.xpToNext * 1.2); // 1.3→1.2, daha kademeli

    // Hız artışı
    G.Player._speed = Math.min(G.Config.MAX_SPEED, G.Config.BASE_SPEED + (this.level - 1) * G.Config.SPEED_INCREMENT);

    // Biome değişimi (her 10 level)
    if (this.level % 10 === 1 && this.level > 1) {
      const biomeIndex = Math.floor((this.level - 1) / 10) % G.Config.BIOME_ORDER.length;
      this.currentBiome = G.Config.BIOME_ORDER[biomeIndex];
      G.Map.generate(this.currentBiome);
      G.Renderer.markBgDirty();
      G.Stats.onBiomeEnter(this.currentBiome);
      G.UI.notify(`New Zone: ${G.Config.BIOMES[this.currentBiome].name}!`, G.Config.BIOMES[this.currentBiome].accent, 3);
      G.Boss.resetForBiome();
    }

    // Boss kontrolü (her 10 level)
    if (this.level % 10 === 0 && !G.Boss.isActive()) {
      const bossIndex = Math.floor((this.level - 1) / 10) % G.Config.BOSS_TYPES.length;
      const bossDef = G.Config.BOSS_TYPES[bossIndex];
      G.Boss.spawn(bossDef.id);
      this.bossLevel = true;
    } else {
      // Upgrade ekranı
      this.changeState('levelUp');
    }

    G.Stats.onLevelUp(this.level);
    G.Effects.levelUp();
    G.Audio.play('level_up');
  },

  /**
   * Boss yenildiğinde çağrılır
   */
  onBossDefeated(boss) {
    this.bossLevel = false;
    G.Stats.onBossKill();

    // Ödül
    const legendaryUpgrades = G.Config.UPGRADES.filter(u => u.rarity === 'legendary');
    if (legendaryUpgrades.length > 0) {
      const reward = G.Utils.randomPick(legendaryUpgrades);
      G.Upgrade.apply(reward);
      G.UI.notify(`🏆 ${reward.name}!`, '#ffaa00', 4);
    }

    G.Save.add('progress.coins', 50);
    G.Save.add('progress.gems', 1);

    G.Audio.stopMusic();
    G.Audio.startMusic('playing');

    // Upgrade ekranı
    setTimeout(() => this.changeState('levelUp'), 1000);
  },

  /**
   * Oyuncu öldüğünde çağrılır
   */
  onPlayerDeath(source) {
    G.Audio.stopMusic();
    const stats = G.Stats.endSession(this.score, this.level, source);
    this.changeState('gameOver');
  },

  /**
   * Düşman hasarı (alan)
   */
  damageEnemiesInRadius(cx, cy, radius, amount) {
    G.Enemy.damageInRadius(cx, cy, radius, amount);
  },

  /**
   * Belirli konumda düşman
   */
  getEnemyAt(x, y) {
    return G.Enemy.getEnemyAt(x, y);
  },

  // --- DEMO (Menü Arka Planı) ---

  _initDemo() {
    this._demoSnake = {
      segments: [{ x: 20, y: 15 }, { x: 20, y: 16 }, { x: 20, y: 17 }],
      dir: { x: 0, y: -1 },
      timer: 0
    };
  },

  _updateDemo(dt) {
    if (!this._demoSnake) return;
    this._demoSnake.timer += dt;
    if (this._demoSnake.timer < 0.15) return;
    this._demoSnake.timer = 0;

    const s = this._demoSnake;
    // Rastgele yön değiştir
    if (Math.random() < 0.2) {
      const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
      s.dir = G.Utils.randomPick(dirs);
    }

    const head = s.segments[0];
    let nx = head.x + s.dir.x;
    let ny = head.y + s.dir.y;

    // Sınırlarda dön
    if (nx < 2 || nx > G.Config.COLS - 3 || ny < 2 || ny > G.Config.ROWS - 3) {
      s.dir = { x: -s.dir.x, y: -s.dir.y };
      nx = head.x + s.dir.x;
      ny = head.y + s.dir.y;
    }

    s.segments.unshift({ x: nx, y: ny });
    while (s.segments.length > 5) s.segments.pop();
  },

  // --- ÇİZİM ---

  draw() {
    G.Renderer.beginFrame();

    const ctx = G.Renderer.getGameCtx();
    const glowCtx = G.Renderer.getGlowCtx();

    switch (this.state) {
      case 'boot':
        this._drawBoot(ctx);
        break;

      case 'mainMenu':
        this._drawDemoSnake(ctx);
        G.Renderer.drawUI((mainCtx) => {
          G.UI.drawMainMenu(mainCtx, this._menuIndex);
        });
        break;

      case 'playing':
        G.Map.draw(ctx);
        G.Food.draw(ctx);
        G.Enemy.draw(ctx);
        G.Boss.draw(ctx);
        G.Player.draw(ctx);
        G.Particles.draw(ctx);
        G.Renderer.drawUI((mainCtx) => {
          G.Effects.draw(mainCtx);
          G.UI.drawHUD(mainCtx);
        });
        break;

      case 'paused':
        G.Map.draw(ctx);
        G.Food.draw(ctx);
        G.Enemy.draw(ctx);
        G.Boss.draw(ctx);
        G.Player.draw(ctx);
        G.Particles.draw(ctx);
        G.Renderer.drawUI((mainCtx) => {
          G.Effects.draw(mainCtx);
          G.UI.drawHUD(mainCtx);
          G.UI.drawPause(mainCtx);
        });
        break;

      case 'levelUp':
        G.Map.draw(ctx);
        G.Food.draw(ctx);
        G.Player.draw(ctx);
        G.Particles.draw(ctx);
        G.Renderer.drawUI((mainCtx) => {
          G.Effects.draw(mainCtx);
          G.UI.drawHUD(mainCtx);
          G.UI.drawLevelUp(mainCtx, this._levelUpChoices, this._levelUpIndex);
        });
        break;

      case 'gameOver':
        G.Map.draw(ctx);
        G.Particles.draw(ctx);
        G.Renderer.drawUI((mainCtx) => {
          G.Effects.draw(mainCtx);
          G.UI.drawGameOver(mainCtx, {
            score: this.score,
            time: this.gameTime * 1000,
            food: G.Stats.getSession() ? G.Stats.getSession().food : 0,
            combo: G.Combo.getMaxCombo(),
            killedBy: G.Stats.getSession() ? G.Stats.getSession().killedBy : 'Unknown',
            xpEarned: G.Stats.getSession() ? G.Stats.getSession().xpEarned : 0,
            coinsEarned: G.Stats.getSession() ? G.Stats.getSession().coinsEarned : 0,
            gemsEarned: G.Stats.getSession() ? G.Stats.getSession().gemsEarned : 0,
            selectedBtn: this._gameOverBtnIndex
          });
        });
        break;

      case 'howToPlay':
        G.Renderer.drawUI((mainCtx) => {
          G.UI.drawHowToPlay(mainCtx, this._howToPlayPage);
        });
        break;

      case 'settings':
        G.Renderer.drawUI((mainCtx) => {
          G.UI.drawSettings(mainCtx, G.Save._data.settings, this._settingsIndex);
        });
        break;

      case 'statistics':
        G.Renderer.drawUI((mainCtx) => {
          G.UI.drawStatistics(mainCtx);
        });
        break;

      case 'credits':
        G.Renderer.drawUI((mainCtx) => {
          G.UI.drawCredits(mainCtx);
        });
        break;

      case 'upgrades':
        G.Renderer.drawUI((mainCtx) => {
          this._drawUpgradesScreen(mainCtx);
        });
        break;
    }

    G.Renderer.endFrame();
  },

  _drawBoot(ctx) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNAKE EVOLUTION', W / 2, H / 2);
    ctx.fillStyle = '#444';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Loading...', W / 2, H / 2 + 30);
  },

  _drawDemoSnake(ctx) {
    if (!this._demoSnake) return;
    const gs = G.Config.GRID_SIZE;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < this._demoSnake.segments.length; i++) {
      const seg = this._demoSnake.segments[i];
      ctx.fillStyle = i === 0 ? '#00ffcc' : '#00aa88';
      ctx.fillRect(seg.x * gs + 2, seg.y * gs + 2, gs - 4, gs - 4);
    }
    ctx.globalAlpha = 1;
  },

  _handleSettingsInput() {
    const settings = G.Save._data.settings;
    const items = ['soundVolume', 'musicVolume', 'screenShake', 'glow', 'particles', 'showFPS', 'colorBlind', 'fullscreen', null, null, null, null];

    if (G.Input.isPressedOnce('ArrowUp') || G.Input.isPressedOnce('KeyW')) {
      this._settingsIndex = (this._settingsIndex - 1 + items.length) % items.length;
      G.Audio.play('button');
    }
    if (G.Input.isPressedOnce('ArrowDown') || G.Input.isPressedOnce('KeyS')) {
      this._settingsIndex = (this._settingsIndex + 1) % items.length;
      G.Audio.play('button');
    }

    const key = items[this._settingsIndex];

    if (G.Input.isPressedOnce('ArrowRight') || G.Input.isPressedOnce('ArrowLeft')) {
      const dir = G.Input.isPressedOnce('ArrowRight') ? 1 : -1;
      if (key && typeof settings[key] === 'number') {
        settings[key] = G.Utils.clamp(settings[key] + dir * 0.1, 0, 1);
        G.Audio.setVolume(key === 'soundVolume' ? 'sfx' : 'music', settings[key]);
      } else if (key && typeof settings[key] === 'boolean') {
        settings[key] = !settings[key];
      }
      G.Save._save();
    }

    if (G.Input.isPressedOnce('Enter') || G.Input.isPressedOnce('Space')) {
      if (this._settingsIndex === 7) {
        // Fullscreen
        G.Renderer.toggleFullscreen();
      } else if (this._settingsIndex === 8) {
        // Reset save
        G.Save.reset();
        G.UI.notify('Save reset!', '#ff4444');
      } else if (this._settingsIndex === 9) {
        // Export
        const json = G.Save.export();
        navigator.clipboard.writeText(json).then(() => {
          G.UI.notify('Save copied to clipboard!', '#00ffcc');
        });
      } else if (this._settingsIndex === 10) {
        // Import
        const json = prompt('Paste save data:');
        if (json && G.Save.import(json)) {
          G.UI.notify('Save imported!', '#00ffcc');
        }
      } else if (this._settingsIndex === 11) {
        this.changeState('mainMenu');
      }
    }

    if (G.Input.isPressedOnce('Escape')) {
      this.changeState('mainMenu');
    }
  },

  _drawUpgradesScreen(ctx) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UPGRADES', W / 2, 50);

    // Aktif upgrade'ler
    const active = G.Upgrade.getActive();
    if (active.length === 0) {
      ctx.fillStyle = '#666677';
      ctx.font = '16px "Segoe UI", Arial, sans-serif';
      ctx.fillText('No upgrades yet. Play to earn upgrades!', W / 2, H / 2);
    } else {
      const categories = ['movement', 'defense', 'food', 'tail', 'special'];
      const catNames = { movement: '🏃 Movement', defense: '🛡️ Defense', food: '🍎 Food', tail: '🐍 Tail', special: '⭐ Special' };

      let y = 80;
      for (const cat of categories) {
        const upgrades = active.filter(id => {
          const def = G.Config.UPGRADES.find(u => u.id === id);
          return def && def.category === cat;
        });
        if (upgrades.length === 0) continue;

        ctx.fillStyle = '#888899';
        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(catNames[cat] || cat, 50, y);
        y += 20;

        for (const id of upgrades) {
          const def = G.Config.UPGRADES.find(u => u.id === id);
          if (!def) continue;
          ctx.fillStyle = '#ccccee';
          ctx.font = '13px "Segoe UI", Arial, sans-serif';
          ctx.fillText(`${def.icon} ${def.name}`, 70, y);
          y += 18;
        }
        y += 10;
      }
    }

    ctx.fillStyle = '#666677';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESC Back', W / 2, H - 30);
  }
};
