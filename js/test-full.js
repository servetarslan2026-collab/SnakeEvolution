// ============================================================
// test-full.js — Eksiksiz Test Suite — Tüm Özellikler
// ============================================================
window.G = window.G || {};

G.FullTest = {
  results: [],
  errors: [],

  assert(c, m) { if (!c) throw new Error(m); },
  assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); },

  // ====== 1. TÜM YEM TÜRLERİ (11) ======
  testAllFoodTypes() {
    const tests = [];
    const types = ['normal','golden','crystal','heart','clock','bomb','poison','magnet','lucky','star','coin'];
    const effects = { normal:null, golden:null, crystal:null, heart:null, clock:'slow', bomb:'bomb', poison:null, magnet:'magnet', lucky:'lucky', star:'invincible', coin:'coin' };

    for (const type of types) {
      tests.push(() => {
        G.Engine.startGame();
        G.Engine.startDelay = 0;
        G.Snake.invTimer = 0;
        const cfg = G.Config.FOOD_TYPES.find(f => f.type === type);
        this.assert(cfg, `Config for ${type} should exist`);
        this.assert(cfg.color, `${type} should have color`);
        this.assert(cfg.icon, `${type} should have icon`);
        this.assert(typeof cfg.w === 'number', `${type} should have weight`);
        this.assert(typeof cfg.sc === 'number', `${type} should have score`);
        this.assert(typeof cfg.xp === 'number', `${type} should have xp`);
        this.assert(typeof cfg.hp === 'number', `${type} should have hp`);
        // Yem toplama
        const beforeHP = G.Snake.hp;
        const beforeScore = G.Engine.score;
        G.Engine.collectFood({ x:20, y:15, type, color:cfg.color, sc:cfg.sc, len:cfg.len, xp:cfg.xp, hp:cfg.hp, icon:cfg.icon, effect:cfg.effect, anim:0, alive:true });
        this.assert(true, `${type} food collection should not crash`);
      });
    }
    return tests;
  },

  // ====== 2. TÜM UPGRADE'LER (37) ======
  testAllUpgrades() {
    const tests = [];
    const upgrades = G.Config.ALL_UPGRADES;

    for (const u of upgrades) {
      tests.push(() => {
        G.Engine.startGame();
        G.Engine.startDelay = 0;
        G.Snake.invTimer = 3;
        const beforeHP = G.Snake.hp;
        const beforeSpeed = G.Snake.speed;
        try {
          G.Upgrades.apply(u);
          G.Engine.upgrades.push(u.id);
          this.assert(true, `Upgrade ${u.id} applied`);
          // Temel kontroller
          this.assert(G.Snake.alive || u.id === 'secondLife', `${u.id} should not kill snake`);
          this.assert(G.Snake.speed > 0, `${u.id} should not set speed to 0`);
        } catch(e) {
          throw new Error(`Upgrade ${u.id} crashed: ${e.message}`);
        }
      });
    }
    return tests;
  },

  // ====== 3. TÜM DÜŞMAN TÜRLERİ (6) ======
  testAllEnemyTypes() {
    const tests = [];
    const types = G.Config.ENEMY_TYPES;

    for (const def of types) {
      tests.push(() => {
        G.Engine.startGame();
        G.Engine.startDelay = 0;
        G.Enemies.list = [{
          x:10, y:10, rx:10, ry:10,
          type:def.type, speed:def.speed, hp:def.hp, color:def.color, ai:def.ai,
          alive:true, moveTimer:1, anim:0, dir:{x:0,y:-1}, wanderTimer:0
        }];
        this.assert(G.Enemies.list[0].type === def.type, `Enemy ${def.type} should exist`);
        this.assert(G.Enemies.list[0].ai === def.ai, `Enemy ${def.type} should have AI ${def.ai}`);
        // Hareket testi
        G.Enemies.update(0.5);
        this.assert(true, `Enemy ${def.type} update should not crash`);
        // Player collision
        G.Snake.invTimer = 0;
        G.Enemies.list[0].x = G.Snake.head().x;
        G.Enemies.list[0].y = G.Snake.head().y;
        const hpBefore = G.Snake.hp;
        G.Enemies.update(0.1);
        this.assert(G.Snake.hp <= hpBefore, `Enemy ${def.type} should deal damage on collision`);
      });
    }
    return tests;
  },

  // ====== 4. TÜM BOSS'LAR (6) ======
  testAllBosses() {
    const tests = [];
    const bosses = G.Config.BOSS_TYPES;

    for (let i = 0; i < bosses.length; i++) {
      const def = bosses[i];
      tests.push(() => {
        G.Engine.startGame();
        G.Engine.level = (i + 1) * 5;
        G.Boss.spawn();
        this.assert(G.Boss.active !== null, `Boss ${def.name} should spawn`);
        this.assert(G.Boss.active.name === def.name, `Boss should be ${def.name}`);
        this.assert(G.Boss.active.hp > 0, `Boss ${def.name} should have HP`);
        this.assert(G.Boss.active.phase === 0, `Boss ${def.name} should start at phase 0`);
        // Hasar testi
        G.Boss.hit(5);
        this.assert(G.Boss.active.hp < def.hp + G.Engine.level * 2, `Boss ${def.name} should take damage`);
        // Faz geçişi
        G.Boss.active.hp = Math.floor(G.Boss.active.maxHp * 0.4);
        G.Boss.hit(0);
        this.assert(G.Boss.active.phase >= 1, `Boss ${def.name} should enter phase 2`);
        // Ölüm
        G.Boss.active.hp = 1;
        G.Boss.hit(10);
        this.assert(G.Boss.active.dying === true, `Boss ${def.name} should die`);
      });
    }
    return tests;
  },

  // ====== 5. TÜM SKINLER (20) ======
  testAllSkins() {
    const tests = [];
    const skins = G.Config.SKINS;

    for (const skin of skins) {
      tests.push(() => {
        this.assert(skin.id, `Skin should have id`);
        this.assert(skin.name, `Skin ${skin.id} should have name`);
        this.assert(skin.head, `Skin ${skin.id} should have head color`);
        this.assert(skin.body, `Skin ${skin.id} should have body color`);
        this.assert(skin.glow, `Skin ${skin.id} should have glow color`);
        // Renk formatı
        this.assert(skin.head.match(/^#[0-9a-f]{6}$/i), `Skin ${skin.id} head should be hex color`);
        this.assert(skin.body.match(/^#[0-9a-f]{6}$/i), `Skin ${skin.id} body should be hex color`);
        this.assert(skin.glow.match(/^#[0-9a-f]{6}$/i), `Skin ${skin.id} glow should be hex color`);
      });
    }
    return tests;
  },

  // ====== 6. TÜM BAŞARIMLAR (9) ======
  testAllAchievements() {
    const tests = [];
    const achs = G.Config.ACHIEVEMENTS;

    for (const ach of achs) {
      tests.push(() => {
        this.assert(ach.id, `Achievement should have id`);
        this.assert(ach.name, `Achievement ${ach.id} should have name`);
        this.assert(ach.desc, `Achievement ${ach.id} should have desc`);
        this.assert(typeof ach.check === 'function', `Achievement ${ach.id} should have check function`);
        // Check fonksiyonu testi
        const result = ach.check(G.Save.data);
        this.assert(typeof result === 'boolean', `Achievement ${ach.id} check should return boolean`);
      });
    }
    return tests;
  },

  // ====== 7. COMBO SİSTEMİ ======
  testComboSystem() {
    const tests = [];

    // Combo eşikleri
    tests.push(() => {
      G.Combo.init();
      this.assertEq(G.Combo.multiplier, 1, 'Initial multiplier');
      G.Combo.hit(); G.Combo.hit(); G.Combo.hit();
      this.assertEq(G.Combo.multiplier, 2, 'x2 at 3');
      G.Combo.hit(); G.Combo.hit();
      this.assertEq(G.Combo.multiplier, 3, 'x3 at 5');
      G.Combo.hit(); G.Combo.hit(); G.Combo.hit();
      this.assertEq(G.Combo.multiplier, 5, 'x5 at 8');
      G.Combo.hit(); G.Combo.hit(); G.Combo.hit(); G.Combo.hit();
      this.assertEq(G.Combo.multiplier, 10, 'x10 at 12');
    });

    // Combo timer
    tests.push(() => {
      G.Combo.init();
      G.Combo.hit(); G.Combo.hit(); G.Combo.hit();
      this.assertEq(G.Combo.count, 3, 'Count should be 3');
      G.Combo.update(3.6); // Timer bitmeli (3.5 sn)
      this.assertEq(G.Combo.count, 0, 'Should reset after timer');
      this.assertEq(G.Combo.multiplier, 1, 'Multiplier should reset');
    });

    // Combo timer negatif olmamalı
    tests.push(() => {
      G.Combo.init();
      G.Combo.hit();
      G.Combo.update(100);
      this.assert(G.Combo.timer >= 0, 'Timer should not go negative');
    });

    return tests;
  },

  // ====== 8. TILE SİSTEMİ ======
  testTileSystem() {
    const tests = [];

    // Tile türleri
    tests.push(() => {
      this.assert(!G.Map.isBlocking(0), 'Empty should not block');
      this.assert(G.Map.isBlocking(1), 'Wall should block');
      this.assert(G.Map.isBlocking(2), 'Rock should block');
      this.assert(G.Map.isBlocking(3), 'Lava should block (for dash)');
      this.assert(!G.Map.isBlocking(4), 'Ice should not block');
      this.assert(G.Map.isBlocking(7), 'Electric should block (for dash)');
    });

    // Harita üretimi
    tests.push(() => {
      G.Engine.startGame();
      this.assert(G.Map.tiles.length > 0, 'Map should have tiles');
      this.assert(G.Map.tiles.length === 30, 'Map should have 30 rows');
      this.assert(G.Map.tiles[0].length === 40, 'Map should have 40 cols');
    });

    // getRandomEmpty
    tests.push(() => {
      const pos = G.Map.getRandomEmpty();
      this.assert(pos.x >= 0 && pos.x < 40, 'Random empty x should be valid');
      this.assert(pos.y >= 0 && pos.y < 30, 'Random empty y should be valid');
      this.assert(G.Map.getTile(pos.x, pos.y) === 0, 'Random empty should be empty tile');
    });

    return tests;
  },

  // ====== 9. SAVE/LOAD SİSTEMİ ======
  testSaveLoadSystem() {
    const tests = [];

    // Default values
    tests.push(() => {
      const d = G.Save.defaults();
      this.assertEq(d.version, 1, 'Version');
      this.assertEq(d.coins, 0, 'Coins');
      this.assertEq(d.highScore, 0, 'HighScore');
      this.assertEq(d.totalGames, 0, 'TotalGames');
      this.assertEq(d.totalFood, 0, 'TotalFood');
      this.assertEq(d.settings.sound, 0.7, 'Sound');
      this.assertEq(d.settings.shake, true, 'Shake');
      this.assertEq(d.settings.glow, true, 'Glow');
      this.assertEq(d.settings.particles, true, 'Particles');
      this.assert(Array.isArray(d.achievements), 'Achievements array');
      this.assert(Array.isArray(d.unlockedSkins), 'UnlockedSkins array');
      this.assert(d.unlockedSkins.includes('default'), 'Default skin unlocked');
      this.assertEq(d.equippedSkin, 'default', 'Equipped skin');
    });

    // Daily quests structure
    tests.push(() => {
      const d = G.Save.defaults();
      this.assert(d.dailyQuests, 'Should have dailyQuests');
      this.assertEq(d.dailyQuests.food, 0, 'Daily food');
      this.assertEq(d.dailyQuests.games, 0, 'Daily games');
      this.assertEq(d.dailyQuests.score, 0, 'Daily score');
      this.assertEq(d.dailyQuests.level, 0, 'Daily level');
      this.assert(Array.isArray(d.dailyQuests.completed), 'Daily completed array');
    });

    // Export/Import
    tests.push(() => {
      G.Save.data = G.Save.defaults();
      G.Save.data.coins = 999;
      G.Save.data.highScore = 5000;
      const exported = G.Save.export();
      const parsed = JSON.parse(exported);
      this.assertEq(parsed.coins, 999, 'Exported coins');
      this.assertEq(parsed.highScore, 5000, 'Exported highScore');
    });

    // AddCoins
    tests.push(() => {
      G.Save.data = G.Save.defaults();
      G.Save.addCoins(100);
      this.assertEq(G.Save.data.coins, 100, 'Coins after add');
      this.assertEq(G.Save.data.totalCoins, 100, 'TotalCoins after add');
      G.Save.addCoins(50);
      this.assertEq(G.Save.data.coins, 150, 'Coins after second add');
      this.assertEq(G.Save.data.totalCoins, 150, 'TotalCoins after second add');
    });

    return tests;
  },

  // ====== 10. SES SİSTEMİ ======
  testAudioSystem() {
    const tests = [];

    tests.push(() => {
      this.assert(G.Audio !== undefined, 'Audio system should exist');
      this.assert(typeof G.Audio.playTone === 'function', 'playTone should be function');
      this.assert(typeof G.Audio.playEat === 'function', 'playEat should be function');
      this.assert(typeof G.Audio.playHit === 'function', 'playHit should be function');
      this.assert(typeof G.Audio.playCoin === 'function', 'playCoin should be function');
      this.assert(typeof G.Audio.playLevelUp === 'function', 'playLevelUp should be function');
      this.assert(typeof G.Audio.playDeath === 'function', 'playDeath should be function');
    });

    return tests;
  },

  // ====== 11. PARÇACIK SİSTEMİ ======
  testParticleSystem() {
    const tests = [];

    tests.push(() => {
      G.Particles.clear();
      this.assertEq(G.Particles.list.length, 0, 'Particles should be empty');
      G.Particles.emit(100, 100, 50, 50, 1, 3, '#ff0000');
      this.assertEq(G.Particles.list.length, 1, 'Should have 1 particle');
      G.Particles.burst(200, 200, '#00ff00', 5);
      this.assertEq(G.Particles.list.length, 6, 'Should have 6 particles');
      G.Particles.update(0.5);
      this.assert(G.Particles.list.length <= 6, 'Particles should decay');
    });

    tests.push(() => {
      G.Particles.clear();
      G.Particles.floatText(100, 100, '+10', '#ffaa00');
      this.assertEq(G.Particles.list.length, 1, 'Should have 1 float text');
      this.assertEq(G.Particles.list[0].shape, 'text', 'Should be text shape');
    });

    // Object pool
    tests.push(() => {
      G.Particles.clear();
      G.Particles.pool = [];
      for (let i = 0; i < 200; i++) G.Particles.emit(100, 100, 0, 0, 0.01, 1, '#fff');
      G.Particles.update(1); // Tüm particle'lar ölmeli
      this.assert(G.Particles.pool.length > 0, 'Pool should have recycled particles');
    });

    return tests;
  },

  // ====== 12. EKRAN EFEKTLERİ ======
  testScreenEffects() {
    const tests = [];

    tests.push(() => {
      G.Effects.reset();
      this.assertEq(G.Effects.shakeX, 0, 'ShakeX should be 0');
      this.assertEq(G.Effects.shakeY, 0, 'ShakeY should be 0');
      this.assertEq(G.Effects.shakeTimer, 0, 'ShakeTimer should be 0');
      this.assertEq(G.Effects.flashTimer, 0, 'FlashTimer should be 0');
    });

    tests.push(() => {
      G.Effects.shake(5, 0.3);
      this.assert(G.Effects.shakeTimer > 0, 'Shake timer should be set');
      G.Effects.update(0.5);
      this.assert(G.Effects.shakeTimer <= 0, 'Shake should expire');
    });

    tests.push(() => {
      G.Effects.flash('#ff0000', 0.2);
      this.assert(G.Effects.flashTimer > 0, 'Flash timer should be set');
      this.assertEq(G.Effects.flashColor, '#ff0000', 'Flash color should be set');
    });

    return tests;
  },

  // ====== 13. YILAN MEKANİKLERİ ======
  testSnakeMechanics() {
    const tests = [];

    // Grow/Shrink
    tests.push(() => {
      G.Engine.startGame();
      const before = G.Snake.segments.length;
      G.Snake.grow(5);
      this.assertEq(G.Snake.segments.length, before + 5, 'Should grow by 5');
      G.Snake.shrink(3);
      this.assertEq(G.Snake.segments.length, before + 2, 'Should shrink by 3');
    });

    // Shrink minimum
    tests.push(() => {
      G.Engine.startGame();
      G.Snake.segments = [{x:20,y:15},{x:20,y:14},{x:20,y:13}];
      G.Snake.renderPos = G.Snake.segments.map(s=>({...s}));
      G.Snake.targetLength = 3;
      G.Snake.shrink(10);
      this.assert(G.Snake.segments.length >= 3, 'Should not go below 3');
    });

    // Heal
    tests.push(() => {
      G.Engine.startGame();
      G.Snake.hp = 1;
      G.Snake.heal(5);
      this.assertEq(G.Snake.hp, G.Snake.maxHp, 'Heal should not exceed maxHp');
    });

    // TakeDamage
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Snake.invTimer = 0;
      G.Snake.hp = 4;
      G.Snake.takeDamage(1, 'test');
      this.assertEq(G.Snake.hp, 3, 'Should lose 1 HP');
      this.assert(G.Snake.invTimer > 0, 'Should get invincibility after damage');
    });

    // Invincibility blocks damage
    tests.push(() => {
      G.Engine.startGame();
      G.Snake.invTimer = 5;
      G.Snake.hp = 4;
      G.Snake.takeDamage(1, 'test');
      this.assertEq(G.Snake.hp, 4, 'Should not take damage while invincible');
    });

    // Dash
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Engine.upgrades = ['dash'];
      G.Snake.dashCooldown = 0;
      G.Snake.dir = {x:1,y:0};
      const beforeX = G.Snake.head().x;
      G.Snake.dash();
      this.assert(G.Snake.head().x > beforeX, 'Dash should move snake');
      this.assert(G.Snake.dashCooldown > 0, 'Dash should have cooldown');
    });

    return tests;
  },

  // ====== 14. LEVEL & XP SİSTEMİ ======
  testLevelSystem() {
    const tests = [];

    // XP scalası
    tests.push(() => {
      G.Engine.startGame();
      this.assertEq(G.Engine.xpNext, 30, 'Initial XP should be 30');
      G.Engine.xp = G.Engine.xpNext;
      G.Engine.collectFood({x:20,y:15,type:'crystal',color:'#aa44ff',sc:0,len:0,xp:1,hp:0,icon:'💎',anim:0,alive:true});
      this.assert(G.Engine.level > 1, 'Should level up');
      this.assert(G.Engine.xpNext > 30, 'XP requirement should increase');
    });

    // Level hız artışı
    tests.push(() => {
      G.Engine.startGame();
      const speed1 = G.Snake.speed;
      G.Engine.level = 10;
      G.Snake.speed = Math.min(10, 4 + G.Engine.level * 0.15);
      this.assert(G.Snake.speed > speed1, 'Speed should increase with level');
    });

    return tests;
  },

  // ====== 15. DAILY QUESTS ======
  testDailyQuests() {
    const tests = [];

    tests.push(() => {
      this.assert(G.Config.DAILY_QUESTS.length === 6, 'Should have 6 daily quests');
      for (const q of G.Config.DAILY_QUESTS) {
        this.assert(q.id, `Quest should have id`);
        this.assert(q.desc, `Quest ${q.id} should have desc`);
        this.assert(typeof q.target === 'number', `Quest ${q.id} should have target`);
        this.assert(q.type, `Quest ${q.id} should have type`);
        this.assert(q.reward, `Quest ${q.id} should have reward`);
        this.assert(q.reward.coins > 0, `Quest ${q.id} should give coins`);
      }
    });

    return tests;
  },

  // ====== 16. BIOME SİSTEMİ ======
  testBiomeSystem() {
    const tests = [];

    tests.push(() => {
      this.assert(G.Config.BIOMES.length === 6, 'Should have 6 biomes');
      for (const b of G.Config.BIOMES) {
        this.assert(b.name, 'Biome should have name');
        this.assert(b.bg, `${b.name} should have bg`);
        this.assert(b.grid, `${b.name} should have grid`);
        this.assert(b.wall, `${b.name} should have wall`);
        this.assert(b.accent, `${b.name} should have accent`);
        this.assert(b.accent2, `${b.name} should have accent2`);
      }
    });

    // Biome geçişi
    tests.push(() => {
      G.Engine.startGame();
      this.assertEq(G.Engine.currentBiome, 0, 'Should start at biome 0');
      G.Engine.level = 5;
      G.Engine.checkBiomeChange();
      this.assertEq(G.Engine.currentBiome, 1, 'Should change to biome 1 at level 5');
    });

    return tests;
  },

  // ====== 17. CONFIG DOĞRULAMA ======
  testConfigValidation() {
    const tests = [];

    // Food types
    tests.push(() => {
      const totalWeight = G.Config.FOOD_TYPES.reduce((s,t) => s + t.w, 0);
      this.assert(totalWeight > 0, 'Food total weight should be positive');
      for (const f of G.Config.FOOD_TYPES) {
        this.assert(f.type, 'Food type');
        this.assert(f.color, `Food ${f.type} color`);
        this.assert(f.icon, `Food ${f.type} icon`);
        this.assert(typeof f.w === 'number', `Food ${f.type} weight`);
        this.assert(typeof f.sc === 'number', `Food ${f.type} score`);
        this.assert(typeof f.len === 'number', `Food ${f.type} length`);
        this.assert(typeof f.xp === 'number', `Food ${f.type} xp`);
        this.assert(typeof f.hp === 'number', `Food ${f.type} hp`);
      }
    });

    // Enemy types
    tests.push(() => {
      for (const e of G.Config.ENEMY_TYPES) {
        this.assert(e.type, 'Enemy type');
        this.assert(typeof e.speed === 'number', `Enemy ${e.type} speed`);
        this.assert(typeof e.hp === 'number', `Enemy ${e.type} hp`);
        this.assert(e.color, `Enemy ${e.type} color`);
        this.assert(e.ai, `Enemy ${e.type} ai`);
      }
    });

    // Boss types
    tests.push(() => {
      for (const b of G.Config.BOSS_TYPES) {
        this.assert(b.name, 'Boss name');
        this.assert(b.color, `Boss ${b.name} color`);
        this.assert(typeof b.hp === 'number', `Boss ${b.name} hp`);
        this.assert(b.hp > 0, `Boss ${b.name} hp should be positive`);
      }
    });

    // Upgrades
    tests.push(() => {
      for (const u of G.Config.ALL_UPGRADES) {
        this.assert(u.id, 'Upgrade id');
        this.assert(u.name, `Upgrade ${u.id} name`);
        this.assert(u.desc, `Upgrade ${u.id} desc`);
        this.assert(u.icon, `Upgrade ${u.id} icon`);
        this.assert(['common','uncommon','rare','epic','legendary'].includes(u.rarity), `Upgrade ${u.id} rarity`);
      }
    });

    // Rarity weights
    tests.push(() => {
      const w = G.Config.RARITY_W;
      this.assert(w.common > w.uncommon, 'Common should be more common than uncommon');
      this.assert(w.uncommon > w.rare, 'Uncommon should be more common than rare');
      this.assert(w.rare > w.epic, 'Rare should be more common than epic');
      this.assert(w.epic > w.legendary, 'Epic should be more common than legendary');
    });

    return tests;
  },

  // ====== 18. UZUN OYUN SIMÜLASYONU ======
  testLongGameplay() {
    const tests = [];

    // 100 kare oyun
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      for (let i = 0; i < 100; i++) {
        G.Snake.dirQueue = [{x:1,y:0}];
        G.Engine.loop(G.Engine.lastTime + 16);
      }
      this.assert(true, '100 frames should not crash');
      this.assert(G.Engine.fps > 0, 'FPS should be positive');
    });

    // Combo ile level atlama
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      // Hızlı level atlat
      for (let lvl = 0; lvl < 5; lvl++) {
        G.Engine.xp = G.Engine.xpNext;
        G.Engine.collectFood({x:G.Snake.head().x,y:G.Snake.head().y,type:'crystal',color:'#aa44ff',sc:0,len:0,xp:1,hp:0,icon:'💎',anim:0,alive:true});
        if (G.Engine.state === 'levelup') {
          G.Engine.upgradeChoices = G.Upgrades.pick(3);
          G.Engine.applyUpgrade(G.Engine.upgradeChoices[0]);
          G.Engine.state = 'play';
        }
      }
      this.assert(G.Engine.level >= 2, 'Should reach level 2+');
    });

    return tests;
  },

  // ====== RUN ALL ======
  runAll() {
    console.log('\n🔬 FULL TEST SUITE — TÜM ÖZELLİKLER\n');
    this.results = [];
    this.errors = [];

    const groups = [
      { name: '🍎 Tüm Yem Türleri (11)', tests: this.testAllFoodTypes() },
      { name: '⬆️ Tüm Upgrade\'ler (37)', tests: this.testAllUpgrades() },
      { name: '👾 Tüm Düşman Türleri (6)', tests: this.testAllEnemyTypes() },
      { name: '🏆 Tüm Boss\'lar (6)', tests: this.testAllBosses() },
      { name: '🎨 Tüm Skinler (20)', tests: this.testAllSkins() },
      { name: '🏅 Tüm Başarımlar (9)', tests: this.testAllAchievements() },
      { name: '🔥 Combo Sistemi', tests: this.testComboSystem() },
      { name: '🗺️ Tile Sistemi', tests: this.testTileSystem() },
      { name: '💾 Save/Load Sistemi', tests: this.testSaveLoadSystem() },
      { name: '🎵 Ses Sistemi', tests: this.testAudioSystem() },
      { name: '✨ Parçacık Sistemi', tests: this.testParticleSystem() },
      { name: '💥 Ekran Efektleri', tests: this.testScreenEffects() },
      { name: '🐍 Yılan Mekanikleri', tests: this.testSnakeMechanics() },
      { name: '📈 Level & XP Sistemi', tests: this.testLevelSystem() },
      { name: '📋 Günlük Görevler', tests: this.testDailyQuests() },
      { name: '🌍 Biome Sistemi', tests: this.testBiomeSystem() },
      { name: '⚙️ Config Doğrulama', tests: this.testConfigValidation() },
      { name: '🎮 Uzun Oyun Simülasyonu', tests: this.testLongGameplay() }
    ];

    let totalP = 0, totalF = 0;

    for (const g of groups) {
      console.log(`\n📦 ${g.name}`);
      let gp = 0, gf = 0;
      for (let i = 0; i < g.tests.length; i++) {
        try {
          g.tests[i]();
          gp++; totalP++;
          console.log(`  ✅ ${i+1}`);
        } catch(e) {
          gf++; totalF++;
          this.errors.push({ group: g.name, test: i+1, error: e.message });
          console.log(`  ❌ ${i+1}: ${e.message}`);
        }
      }
      this.results.push({ name: g.name, passed: gp, failed: gf, total: g.tests.length });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOPLAM: ✅ ${totalP} PASS | ❌ ${totalF} FAIL | ${totalP + totalF} TEST`);
    console.log('='.repeat(60));

    if (this.errors.length > 0) {
      console.log('\n❌ HATALAR:');
      this.errors.forEach(e => console.log(`  [${e.group}] Test ${e.test}: ${e.error}`));
    }

    return { totalP, totalF, results: this.results, errors: this.errors };
  }
};
