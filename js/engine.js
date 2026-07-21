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
    this.changeState('menu');
    requestAnimationFrame((t) => this.loop(t));
  },

  resize() {
    const s = Math.min(innerWidth / this.W, innerHeight / this.H);
    this.canvas.width = this.W * s | 0;
    this.canvas.height = this.H * s | 0;
    this.canvas.style.width = this.W * s + 'px';
    this.canvas.style.height = this.H * s + 'px';
    this.ctx.setTransform(s, 0, 0, s, 0, 0);
  },

  changeState(newState) {
    this.state = newState;
    if (newState === 'play') {
      this.startDelay = 0.5;
    }
  },

  loop(now) {
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
    }

    G.Particles.update(this.dt);
    G.Effects.update(this.dt);
    this.updateNotifications(this.dt);

    // Draw
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
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
    }

    this.drawNotifications(ctx);
    G.Effects.drawFlash(ctx);
  },

  notify(text, color) {
    if (this.notifications.length < 4) {
      this.notifications.push({ text, color: color || '#fff', timer: 2.5 });
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
      this.notify('🌍 ' + G.Config.BIOMES[newBiome].name, G.Config.BIOMES[newBiome].accent);
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
    this.startDelay = 0.5;
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
    G.Stats.startSession();

    this.changeState('play');
    this.notify('🎮 Başla! WASD/Ok ile hareket', this.getBiome().accent);
  },

  collectFood(food) {
    // Combo
    G.Combo.hit();
    const comboMult = G.Combo.getMultiplier();

    // Score
    let sc = (food.sc || 0) * comboMult;
    if (this.upgrades.includes('score2x')) sc *= 2;
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
      G.Snake.heal(food.hp);
    }

    // Boss damage
    if (G.Boss.isActive()) G.Boss.hit(1);

    // Effects
    const gs = this.GS;
    G.Particles.burst(food.x * gs + gs / 2, food.y * gs + gs / 2, food.color, 6);
    if (sc > 0) G.Particles.floatText(food.x * gs + gs / 2, food.y * gs - 10, '+' + sc, food.color);
    if (xpg > 0) G.Particles.floatText(food.x * gs + gs / 2, food.y * gs - 25, '+' + xpg + ' XP', '#aa44ff');
    if (food.hp > 0) G.Particles.floatText(food.x * gs + gs / 2, food.y * gs - 25, '+' + food.hp + ' HP', '#ff44aa');

    // Special effects
    if (food.effect === 'slow') {
      G.Snake.speed *= 0.7;
      setTimeout(() => { G.Snake.speed = Math.min(12, 4 + this.level * 0.3); }, 3000);
    }
    if (food.effect === 'bomb') G.Snake.takeDamage(2, 'bomb');
    if (food.effect === 'invincible') G.Snake.activateInvincible(3);
    if (food.effect === 'coin') G.Save.addCoins(Math.floor(Math.random() * 5) + 1);
    if (food.effect === 'lucky') {
      const r = Math.random();
      if (r < 0.3) { this.score += 10; this.notify('+10 Skor!', '#ffaa00'); }
      else if (r < 0.6) { G.Snake.heal(2); this.notify('+2 HP!', '#ff44aa'); }
      else { this.xp += 30; this.notify('+30 XP!', '#aa44ff'); }
    }

    // Stats
    G.Stats.onFood(food.type);

    // Combo effect
    if (G.Combo.count >= 3) G.Effects.shake(2, 0.1);

    // Sound
    G.Audio.playTone(440 + G.Combo.count * 15, 0.06);

    // Level up check
    if (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Math.floor(this.xpNext * 1.15);
      G.Snake.speed = Math.min(12, 4 + this.level * 0.3);

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
    G.Effects.shake(3, 0.2);
    G.Effects.flash('#ffaa00', 0.15);
    G.Audio.playTone(523, 0.1);
  },

  applyUpgrade(u) {
    this.upgrades.push(u.id);
    G.Upgrades.apply(u);
    this.notify('⬆️ ' + u.name + '!', this.getBiome().accent);
    G.Audio.playTone(660, 0.1);
  }
};
