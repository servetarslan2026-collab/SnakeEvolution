// ============================================================
// engine.js — Core Game Engine
// ============================================================
window.G = window.G || {};

G.Engine = {
  canvas: null, ctx: null,
  state: 'menu',
  W: 800, H: 600, GS: 20,
  PI2: Math.PI * 2,
  fps: 0, fpsCounter: 0, fpsTime: 0,
  lastTime: 0,
  dt: 0,
  gameTime: 0,

  // State
  score: 0, level: 1, xp: 0, xpNext: 30,
  combo: 0, comboTimer: 0, comboMult: 1,
  upgrades: [],
  currentBiome: 0,
  selectedBtn: 0, selectedUpgrade: 0, upgradeChoices: [],
  howToPlayPage: 0, settingsIdx: 0, skinScroll: 0,
  deadTimer: 0, startDelay: 0,
  notifications: [],

  init() {
    this.canvas = document.getElementById('c');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // Also handle orientation change on mobile
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
    this.changeState('menu');
    requestAnimationFrame((t) => this.loop(t));
  },

  resize() {
    const s = Math.min(innerWidth / this.W, innerHeight / this.H);
    const w = Math.floor(this.W * s);
    const h = Math.floor(this.H * s);
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.setTransform(s, 0, 0, s, 0, 0);
  },

  changeState(newState) {
    this.state = newState;
    if (newState === 'play') {
      this.startDelay = 1;
    }
  },

  loop(now) {
    try {
    this.dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.fpsCounter++;
    if (now - this.fpsTime >= 1000) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsTime = now;
    }

    // Update
    if (this.state === 'play') {
      this.gameTime += this.dt;
      G.Snake.update(this.dt);
      G.Food.update(this.dt);
      G.Enemies.update(this.dt);
      G.Boss.update(this.dt);
      G.Combo.update(this.dt);
      this.checkBiomeChange();
      this.updateBgEffects(this.dt);
    }

    G.Particles.update(this.dt);
    G.Effects.update(this.dt);
    G.Animation.update(this.dt);
    if (this.state === 'play') G.Timers.update(this.dt);
    this.updateNotifications(this.dt);

    // Draw
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
    } catch(e) {
      console.error('Game loop error:', e);
      if (G.Logger) G.Logger.logError('LOOP', e.message, { stack: e.stack });
      requestAnimationFrame((t) => this.loop(t));
    }
  },

  draw() {
    const ctx = this.ctx;
    const s = Math.min(innerWidth / this.W, innerHeight / this.H);
    ctx.setTransform(s, 0, 0, s, 0, 0);

    // Background
    const biome = G.Config.BIOMES[this.currentBiome];
    ctx.fillStyle = biome.bg;
    ctx.fillRect(0, 0, this.W, this.H);

    // Grid
    ctx.strokeStyle = biome.grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= this.W; x += this.GS) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.H); ctx.stroke();
    }
    for (let y = 0; y <= this.H; y += this.GS) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.W, y); ctx.stroke();
    }

    // Shake
    const shake = G.Effects.getShake();
    ctx.translate(shake.x, shake.y);

    switch (this.state) {
      case 'menu': G.UI.drawMenu(ctx); break;
      case 'play':
        G.Map.draw(ctx);
        this.drawBgEffects(ctx);
        G.Food.draw(ctx);
        G.Enemies.draw(ctx);
        G.Boss.draw(ctx);
        G.Snake.draw(ctx);
        G.Particles.draw(ctx);
        G.UI.drawHUD(ctx);
        G.UI.drawMiniMap(ctx);
        break;
      case 'paused':
        G.Map.draw(ctx);
        G.Food.draw(ctx);
        G.Enemies.draw(ctx);
        G.Boss.draw(ctx);
        G.Snake.draw(ctx);
        G.Particles.draw(ctx);
        G.UI.drawHUD(ctx);
        G.UI.drawPaused(ctx);
        break;
      case 'dead':
        G.Map.draw(ctx);
        G.Particles.draw(ctx);
        G.UI.drawDead(ctx);
        break;
      case 'levelup':
        G.Map.draw(ctx);
        G.Food.draw(ctx);
        G.Snake.draw(ctx);
        G.Particles.draw(ctx);
        G.UI.drawHUD(ctx);
        G.UI.drawLevelUp(ctx);
        break;
      case 'howtoplay': G.UI.drawHowToPlay(ctx); break;
      case 'settings': G.UI.drawSettings(ctx); break;
      case 'skins': G.UI.drawSkins(ctx); break;
      case 'stats': G.UI.drawStats(ctx); break;
    }

    this.drawNotifications(ctx);
    G.Effects.drawFlash(ctx);

    // ============ POST-PROCESSING (AAA+) ============
    G.Effects.drawPostProcessing(ctx);
  },

  // ============ BIOME BACKGROUND EFFECTS ============
  _bgParticles: [],
  _bgTimer: 0,

  updateBgEffects(dt) {
    this._bgTimer += dt;
    // Spawn background particles
    if (this._bgTimer > 0.3 && this._bgParticles.length < 40) {
      this._bgTimer = 0;
      const b = this.currentBiome;
      const particle = {
        x: Math.random() * this.W,
        y: b === 2 ? this.H + 5 : -5, // Lava: bottom-up, others: top-down
        vx: (Math.random() - 0.5) * 20,
        vy: b === 2 ? -(20 + Math.random() * 30) : (10 + Math.random() * 20),
        sz: 1 + Math.random() * 2,
        life: 3 + Math.random() * 4,
        maxLife: 3 + Math.random() * 4,
        color: G.Config.BIOMES[b].accent,
        type: b
      };
      this._bgParticles.push(particle);
    }
    // Update
    for (let i = this._bgParticles.length - 1; i >= 0; i--) {
      const p = this._bgParticles[i];
      p.life -= dt;
      if (p.life <= 0) { this._bgParticles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 3) p.vx += Math.sin(this.gameTime * 2 + i) * dt * 10; // Cyber Forest: firefly drift
    }
  },

  drawBgEffects(ctx) {
    const glowOn = G.Save.data.settings.glow !== false;
    if (!glowOn) return;
    for (const p of this._bgParticles) {
      const a = (p.life / p.maxLife) * 0.4;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },



  notify(text, color, duration) {
    if (this.notifications.length < 4) {
      this.notifications.push({ text, color: color || '#fff', timer: duration || 2.5 });
    }
  },

  updateNotifications(dt) {
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      this.notifications[i].timer -= dt;
      if (this.notifications[i].timer <= 0) this.notifications.splice(i, 1);
    }
  },

  drawNotifications(ctx) {
    let y = 95;
    for (const n of this.notifications) {
      ctx.globalAlpha = Math.min(1, n.timer);
      ctx.fillStyle = n.color;
      ctx.font = 'bold 15px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, this.W / 2 | 0, y);
      y += 22;
    }
    ctx.globalAlpha = 1;
  },

  checkBiomeChange() {
    const newBiome = Math.min(Math.floor(this.level / 5), G.Config.BIOMES.length - 1);
    if (newBiome !== this.currentBiome) {
      this.currentBiome = newBiome;
      G.Map.generate();
      // biomesVisited tracking
      if (!this._visitedBiomes) this._visitedBiomes = new Set([0]);
      this._visitedBiomes.add(newBiome);
      G.Save.data.biomesVisited = this._visitedBiomes.size;
      this.notify('🌍 ' + G.Config.BIOMES[newBiome].name, G.Config.BIOMES[newBiome].accent, 3);
      G.Effects.flash(G.Config.BIOMES[newBiome].accent + '44', 0.5);
    }
  },

  getBiome() {
    return G.Config.BIOMES[this.currentBiome];
  },

  startGame() {
    this.state = 'play';
    this.score = 0;
    this.level = 1;
    this.xp = 0;
    this.xpNext = 30;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboMult = 1;
    this.gameTime = 0;
    this.upgrades = [];
    this.currentBiome = 0;
    this.startDelay = 1;
    this.deadTimer = 0;
    this.notifications = [];

    G.Map.generate();
    G.Snake.init();
    G.Food.init();
    G.Enemies.init();
    G.Boss.init();
    G.Combo.init();
    G.Particles.clear();
    G.Effects.reset();
    G.Timers.clear();
    G.Stats.startSession();
    this._visitedBiomes = new Set([0]);
    this._bgParticles = [];
    this._bgTimer = 0;
    this._foodBoomActive = false;

    this.changeState('play');
    G.Audio.init();
    G.Audio.startMusic();
    this.notify('🎮 Başla! WASD/Ok ile hareket', this.getBiome().accent);
  },

  collectFood(food) {
    // Combo
    G.Combo.hit();
    const comboMult = G.Combo.getMultiplier();
    const luckyBonus = this.upgrades.includes('lucky') ? 1.2 : 1;

    // Score
    let sc = (food.sc || 0) * comboMult;
    if (this.upgrades.includes('score2x')) sc *= 2;
    // Critical: %15 şansla 2x
    if (this.upgrades.includes('critical') && Math.random() < 0.15) {
      sc *= 2;
      this.notify('🎯 KRİTİK! x2', '#ff4400');
    }
    // Golden upgrade: altın yem +%20
    if (this.upgrades.includes('golden') && food.type === 'golden') {
      sc = Math.floor(sc * 1.2);
    }
    this.score += sc;

    // XP
    let xpg = food.xp || 0;
    if (this.upgrades.includes('xp2x')) xpg *= 2;
    this.xp += xpg;

    // Growth
    if (food.len > 0) G.Snake.grow(food.len);
    if (food.len < 0) G.Snake.shrink(Math.abs(food.len));

    // HP
    if (food.hp > 0) {
      let hpGain = food.hp;
      // HeartFind: kalp yemlerinden +%15
      if (this.upgrades.includes('heartFind') && food.type === 'heart') {
        hpGain = Math.ceil(hpGain * 1.15);
      }
      G.Snake.heal(hpGain);
    }

    // Boss damage (her yem 3 hasar)
    if (G.Boss.isActive()) G.Boss.hit(3);

    // Effects
    const gs = this.GS;
    const fpx = food.x * gs + gs / 2;
    const fpy = food.y * gs + gs / 2;
    G.Particles.burst(fpx, fpy, food.color, 8);
    G.Particles.burst(fpx, fpy, '#ffffff', 4);
    if (sc > 0) G.Particles.floatText(fpx, fpy - 10, '+' + sc, food.color);
    if (xpg > 0) G.Particles.floatText(fpx, fpy - 25, '+' + xpg + ' XP', '#aa44ff');
    if (food.hp > 0) G.Particles.floatText(fpx, fpy - 25, '+' + food.hp + ' HP', '#ff44aa');
    // Combo efekti
    if (G.Combo.count >= 5) {
      G.Particles.floatText(fpx, fpy - 40, 'x' + G.Combo.multiplier, '#ffaa00');
    }

    // Special effects
    if (food.effect === 'slow') {
      G.Snake.speed *= 0.7;
      const slowLevel = this.level;
      G.Timers.add(() => { if (G.Snake.alive && this.state === 'play') G.Snake.speed = Math.min(10, 4 + slowLevel * 0.15); }, 3000);
    }
    if (food.effect === 'bomb') {
      // BlastGuard: patlamadan hasar almaz
      if (this.upgrades.includes('blastGuard')) {
        this.notify('🛡️ Patlama engellendi!', '#00ffcc');
      } else {
        G.Snake.takeDamage(1, 'bomb');
      }
    }
    if (food.effect === 'invincible') G.Snake.activateInvincible(3);
    if (food.effect === 'coin') {
      let coinAmount = Math.floor(Math.random() * 5) + 1;
      // LuckyDrop: coin +%30
      if (this.upgrades.includes('luckyDrop')) {
        coinAmount = Math.ceil(coinAmount * 1.3);
      }
      G.Save.addCoins(coinAmount);
    }
    if (food.effect === 'lucky') {
      const r = Math.random() * luckyBonus;
      if (r < 0.3) { this.score += 10; this.notify('+10 Skor!', '#ffaa00'); }
      else if (r < 0.6) { G.Snake.heal(2); this.notify('+2 HP!', '#ff44aa'); }
      else { this.xp += 30; this.notify('+30 XP!', '#aa44ff'); }
    }

    // FoodBoom: yakındaki yemleri topla
    if (this.upgrades.includes('foodBoom') && !this._foodBoomActive) {
      this._foodBoomActive = true;
      const head = G.Snake.head();
      const boomRange = 5;
      const boomItems = G.Food.items.filter(f => f !== food && f.alive && G.Utils.dist(head.x, head.y, f.x, f.y) < boomRange);
      for (const f of boomItems) {
        G.Food.collectAndRemove(f);
      }
      this._foodBoomActive = false;
      if (boomItems.length > 0) this.notify('💣 Yem Patlaması! (+' + boomItems.length + ')', '#ff6600');
    }

    // Stats
    G.Stats.onFood(food.type);

    // Stats combo tracking
    G.Stats.onCombo(G.Combo.count);

    // Combo effect
    if (G.Combo.count >= 3) G.Effects.shake(2, 0.1);

    // Sound (yem türüne özel)
    G.Audio.playFoodSound(food.type);

    // Level up check
    if (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Math.floor(this.xpNext * 1.10);
      G.Snake.speed = Math.min(9, 4 + this.level * 0.12);

      // Boss spawn every 5 levels
      if (this.level % 5 === 0 && this.level > 0) {
        G.Boss.spawn();
      }

      this.showUpgradeScreen();
    }
  },

  die(reason) {
    this.state = 'dead';
    this.deadTimer = 0;
    G.Snake.hp = 0;
    G.Snake.alive = false;
    G.Combo.count = 0;
    G.Combo.timer = 0;
    G.Combo.multiplier = 1;
    G.Audio.stopMusic();
    // Ölüm efekti: büyük patlama
    const head = G.Snake.head();
    const px = head.x * this.GS + this.GS / 2;
    const py = head.y * this.GS + this.GS / 2;
    G.Particles.burst(px, py, '#ff0044', 20);
    G.Particles.burst(px, py, '#ffaa00', 15);
    G.Particles.burst(px, py, '#ffffff', 10);
    G.Effects.shake(10, 0.5);
    G.Effects.flash('#ff0044', 0.3);
    G.Effects.shake(8, 0.4);
    G.Effects.flash('#ff0044', 0.3);
    G.Particles.burst(G.Snake.head().x * this.GS + this.GS / 2, G.Snake.head().y * this.GS + this.GS / 2, this.getBiome().accent, 10);
    G.Audio.playTone(200, 0.25);
    G.Stats.onDeath(this.score, this.level, this.gameTime, reason);
    G.Save.autoSave();
  },

  showUpgradeScreen() {
    this.state = 'levelup';
    this.selectedUpgrade = 0;
    this.upgradeChoices = G.Upgrades.pick(3);
    G.Effects.shake(4, 0.25);
    G.Effects.flash('#ffaa00', 0.2);
    G.Audio.playTone(523, 0.1);
    // Level up parçacıkları
    const head = G.Snake.head();
    const px = head.x * this.GS + this.GS / 2;
    const py = head.y * this.GS + this.GS / 2;
    G.Particles.burst(px, py, '#ffaa00', 15);
    G.Particles.burst(px, py, '#ffffff', 10);
    G.Particles.floatText(px, py - 20, 'LEVEL ' + this.level + '!', '#ffaa00');
  },

  applyUpgrade(u) {
    this.upgrades.push(u.id);
    G.Upgrades.apply(u);
    this.notify('⬆️ ' + u.name + '!', this.getBiome().accent);
    G.Audio.playTone(660, 0.1);
  }
};
