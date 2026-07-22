// ============================================================
// test-deep.js — Kapsamlı Oyun Test Suite
// ============================================================
window.G = window.G || {};

G.DeepTest = {
  results: [],
  errors: [],

  assert(condition, msg) {
    if (!condition) throw new Error(msg);
  },

  assertEq(a, b, msg) {
    if (a !== b) throw new Error(`${msg}: expected ${b}, got ${a}`);
  },

  assertRange(val, min, max, msg) {
    if (val < min || val > max) throw new Error(`${msg}: ${val} not in range [${min}, ${max}]`);
  },

  // ====== EDGE CASE TESTS ======

  testSnakeEdgeCases() {
    const tests = [];

    // Test 1: 1 segmentlik yılan
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Snake.segments = [{ x: 20, y: 15 }];
      G.Snake.renderPos = [{ x: 20, y: 15 }];
      G.Snake.targetLength = 1;
      G.Snake.dir = { x: 1, y: 0 };
      G.Snake.dirQueue = [];
      G.Snake.moveTimer = 0.3;
      G.Snake.update(0.1);
      this.assert(G.Snake.segments.length >= 1, 'Snake with 1 segment should survive');
    });

    // Test 2: Uzun yılan performansı
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      for (let i = 0; i < 20; i++) G.Snake.grow(10);
      this.assert(G.Snake.segments.length >= 200, 'Snake should be long');
      const start = performance.now();
      G.Snake.update(0.1);
      const elapsed = performance.now() - start;
      this.assert(elapsed < 100, `Long snake update should be fast, took ${elapsed}ms`);
      this.assert(G.Snake.alive, 'Long snake should not crash');
    });

    // Test 3: Negatif koordinat wrap
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Snake.segments = [{ x: 0, y: 0 }];
      G.Snake.renderPos = [{ x: 0, y: 0 }];
      G.Snake.targetLength = 1;
      G.Snake.dir = { x: -1, y: -1 };
      G.Snake.dirQueue = [];
      G.Snake.moveTimer = 0.3;
      G.Snake.invTimer = 3;
      G.Snake.update(0.1);
      const h = G.Snake.head();
      this.assert(h.x >= 0 && h.x < 40, 'Wrap X should be valid');
      this.assert(h.y >= 0 && h.y < 30, 'Wrap Y should be valid');
    });

    // Test 4: Hız 0 veya negatif
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Snake.speed = 0;
      G.Snake.moveTimer = 100;
      const before = G.Snake.head().x;
      G.Snake.update(0.1);
      // Hız 0 iken hareket etmemeli (interval = Infinity)
      this.assert(true, 'Speed 0 should not crash');
    });

    // Test 5: Çok yüksek hız
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Snake.speed = 1000;
      G.Snake.moveTimer = 1;
      G.Snake.dirQueue = [];
      G.Snake.dir = { x: 1, y: 0 };
      G.Snake.update(0.1);
      this.assert(G.Snake.alive, 'Extreme speed should not crash');
    });

    // Test 6: dirQueue overflow
    tests.push(() => {
      G.Engine.startGame();
      for (let i = 0; i < 100; i++) {
        G.Snake.dirQueue.push({ x: 1, y: 0 });
      }
      this.assert(G.Snake.dirQueue.length <= 100, 'Queue should handle overflow');
      G.Engine.startDelay = 0;
      G.Snake.update(0.1);
      this.assert(true, 'Large dirQueue should not crash');
    });

    return tests;
  },

  // ====== FOOD EDGE CASES ======

  testFoodEdgeCases() {
    const tests = [];

    // Test 1: 0 yem
    tests.push(() => {
      G.Engine.startGame();
      G.Food.items = [];
      G.Food.update(0.1);
      this.assert(G.Food.items.length >= 0, 'Empty food should not crash');
    });

    // Test 2: Maksimum yem
    tests.push(() => {
      G.Engine.startGame();
      G.Food.items = [];
      for (let i = 0; i < 20; i++) G.Food.spawn();
      this.assert(G.Food.items.length <= G.Food.maxFood, 'Should respect maxFood limit');
    });

    // Test 3: Yem spawn pozisyonu
    tests.push(() => {
      G.Engine.startGame();
      for (const f of G.Food.items) {
        this.assert(f.x >= 0 && f.x < 40, 'Food x should be valid');
        this.assert(f.y >= 0 && f.y < 30, 'Food y should be valid');
        this.assert(f.type, 'Food should have type');
        this.assert(f.color, 'Food should have color');
      }
    });

    // Test 4: Bomba hasarı
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Snake.invTimer = 0;
      const beforeHP = G.Snake.hp;
      G.Engine.collectFood({
        x: 20, y: 15, type: 'bomb', color: '#ff6600', sc: 0, len: 0, xp: 0, hp: 0,
        icon: '💣', effect: 'bomb', anim: 0, alive: true
      });
      this.assert(G.Snake.hp < beforeHP, 'Bomb should deal damage');
    });

    // Test 5: Heart iyileştirme
    tests.push(() => {
      G.Engine.startGame();
      G.Snake.hp = 1;
      G.Engine.collectFood({
        x: 20, y: 15, type: 'heart', color: '#ff44aa', sc: 0, len: 0, xp: 0, hp: 1,
        icon: '❤️', anim: 0, alive: true
      });
      this.assert(G.Snake.hp === 2, 'Heart should heal');
    });

    // Test 6: Heart max HP'de
    tests.push(() => {
      G.Engine.startGame();
      G.Snake.hp = G.Snake.maxHp;
      G.Engine.collectFood({
        x: 20, y: 15, type: 'heart', color: '#ff44aa', sc: 0, len: 0, xp: 0, hp: 1,
        icon: '❤️', anim: 0, alive: true
      });
      this.assert(G.Snake.hp === G.Snake.maxHp, 'Heart should not exceed maxHP');
    });

    // Test 7: Poison kuyruk kısaltma
    tests.push(() => {
      G.Engine.startGame();
      G.Snake.grow(10);
      const beforeLen = G.Snake.segments.length;
      G.Engine.collectFood({
        x: 20, y: 15, type: 'poison', color: '#44ff00', sc: 0, len: -2, xp: 0, hp: 0,
        icon: '☠️', anim: 0, alive: true
      });
      this.assert(G.Snake.segments.length < beforeLen, 'Poison should shorten snake');
    });

    // Test 8: Poison minimum uzunluk
    tests.push(() => {
      G.Engine.startGame();
      G.Snake.segments = [{ x: 20, y: 15 }, { x: 20, y: 14 }, { x: 20, y: 13 }];
      G.Snake.renderPos = G.Snake.segments.map(s => ({ ...s }));
      G.Snake.targetLength = 3;
      G.Engine.collectFood({
        x: 20, y: 15, type: 'poison', color: '#44ff00', sc: 0, len: -2, xp: 0, hp: 0,
        icon: '☠️', anim: 0, alive: true
      });
      this.assert(G.Snake.segments.length >= 3, 'Snake should not go below 3 segments');
    });

    return tests;
  },

  // ====== ENEMY EDGE CASES ======

  testEnemyEdgeCases() {
    const tests = [];

    // Test 1: 0 düşman
    tests.push(() => {
      G.Engine.startGame();
      G.Enemies.list = [];
      G.Enemies.update(0.1);
      this.assert(true, 'Empty enemies should not crash');
    });

    // Test 2: Maksimum düşman
    tests.push(() => {
      G.Engine.startGame();
      G.Enemies.list = [];
      for (let i = 0; i < 10; i++) G.Enemies.spawn();
      this.assert(G.Enemies.list.length <= 4, 'Should respect max enemy limit');
    });

    // Test 3: Düşman pozisyonu
    tests.push(() => {
      G.Engine.startGame();
      G.Enemies.spawn();
      for (const e of G.Enemies.list) {
        this.assert(e.x >= 1 && e.x < 39, 'Enemy x should be valid');
        this.assert(e.y >= 1 && e.y < 29, 'Enemy y should be valid');
        this.assert(e.type, 'Enemy should have type');
        this.assert(e.ai, 'Enemy should have AI');
        this.assert(e.speed >= 0, 'Enemy speed should be non-negative');
      }
    });

    // Test 4: Ghost düşman wrap around
    tests.push(() => {
      G.Engine.startGame();
      G.Enemies.list = [{
        x: 0, y: 15, rx: 0, ry: 15,
        type: 'ghost', speed: 1, hp: 5, color: '#aaaaff', ai: 'ghost',
        alive: true, moveTimer: 1, anim: 0, dir: { x: -1, y: 0 }, wanderTimer: 0
      }];
      G.Enemies.update(0.1);
      const e = G.Enemies.list[0];
      this.assert(e.x >= 0 && e.x < 40, 'Ghost wrap X should be valid');
    });

    // Test 5: Turret ateş etme
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Snake.invTimer = 0;
      const beforeHP = G.Snake.hp;
      G.Enemies.list = [{
        x: G.Snake.head().x, y: G.Snake.head().y + 1,
        rx: G.Snake.head().x, ry: G.Snake.head().y + 1,
        type: 'drone', speed: 0, hp: 3, color: '#4488ff', ai: 'turret',
        alive: true, moveTimer: 0, anim: 0, dir: { x: 0, y: 0 }, wanderTimer: 0,
        shootTimer: 3 // Hemen ateş etsin
      }];
      G.Enemies.update(0.1);
      this.assert(G.Snake.hp < beforeHP, 'Turret should deal damage');
    });

    // Test 6: Bomber ölümü
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Snake.invTimer = 0;
      G.Enemies.list = [{
        x: G.Snake.head().x, y: G.Snake.head().y,
        rx: G.Snake.head().x, ry: G.Snake.head().y,
        type: 'bomber', speed: 2.5, hp: 1, color: '#ff8800', ai: 'bomber',
        alive: true, moveTimer: 0, anim: 0, dir: { x: 0, y: 0 }, wanderTimer: 0
      }];
      G.Enemies.update(0.1);
      this.assert(G.Enemies.list[0].alive === false, 'Bomber should die on contact');
    });

    // Test 7: Poison düşman hasarı
    tests.push(() => {
      G.Engine.startGame();
      G.Enemies.list = [{
        x: 20, y: 15, rx: 20, ry: 15,
        type: 'bug', speed: 1, hp: 5, color: '#ff2244', ai: 'wander',
        alive: true, moveTimer: 0, anim: 0, dir: { x: 0, y: 0 }, wanderTimer: 0,
        _poisoned: true, _poisonTimer: 3, _poisonTick: 0
      }];
      G.Enemies.update(1.5); // 1.5 sn → 1 poison tick
      this.assert(G.Enemies.list[0].hp < 5, 'Poison should deal damage over time');
    });

    // Test 8: Stun düşman hareket etmemeli
    tests.push(() => {
      G.Engine.startGame();
      G.Enemies.list = [{
        x: 20, y: 15, rx: 20, ry: 15,
        type: 'bug', speed: 1, hp: 1, color: '#ff2244', ai: 'wander',
        alive: true, moveTimer: 1, anim: 0, dir: { x: 1, y: 0 }, wanderTimer: 0,
        _stunTimer: 2
      }];
      G.Enemies.update(0.1);
      this.assert(G.Enemies.list[0].x === 20, 'Stunned enemy should not move');
    });

    return tests;
  },

  // ====== BOSS EDGE CASES ======

  testBossEdgeCases() {
    const tests = [];

    // Test 1: Boss HP hesaplama
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.level = 5;
      G.Boss.spawn();
      this.assertEq(G.Boss.active.hp, 20 + 5 * 2, 'Boss1 HP should be base + level*2');
    });

    // Test 2: Boss faz geçişi
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.level = 5;
      G.Boss.spawn();
      this.assertEq(G.Boss.active.phase, 0, 'Boss should start at phase 0');
      G.Boss.active.hp = Math.floor(G.Boss.active.maxHp * 0.4);
      G.Boss.hit(0);
      this.assertEq(G.Boss.active.phase, 1, 'Boss should enter phase 1 at 50% HP');
      G.Boss.active.hp = Math.floor(G.Boss.active.maxHp * 0.2);
      G.Boss.hit(0);
      this.assertEq(G.Boss.active.phase, 2, 'Boss should enter phase 2 at 25% HP');
    });

    // Test 3: Boss ölüm animasyonu
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.level = 5;
      G.Boss.spawn();
      G.Boss.active.hp = 1;
      G.Boss.hit(10);
      this.assert(G.Boss.active.dying === true, 'Boss should be dying');
      this.assert(G.Boss.active.deathTimer > 0, 'Death timer should be set');
      G.Boss.update(2); // 2 sn sonra
      this.assert(G.Boss.active === null, 'Boss should be removed after death timer');
    });

    // Test 4: Boss collision mesafesi
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Engine.level = 5;
      G.Boss.spawn();
      G.Snake.invTimer = 0;
      // Boss'u yılanın yakınına koy
      G.Boss.active.x = G.Snake.head().x + 1;
      G.Boss.active.y = G.Snake.head().y;
      G.Boss.active.rx = G.Boss.active.x;
      G.Boss.active.ry = G.Boss.active.y;
      const beforeHP = G.Snake.hp;
      G.Boss.update(0.1);
      this.assert(G.Snake.hp < beforeHP, 'Boss should deal damage when close');
    });

    return tests;
  },

  // ====== COMBO SYSTEM TESTS ======

  testComboEdgeCases() {
    const tests = [];

    // Test 1: Combo timer bitimi
    tests.push(() => {
      G.Combo.init();
      G.Combo.hit();
      G.Combo.hit();
      G.Combo.hit();
      this.assertEq(G.Combo.count, 3, 'Combo should be 3');
      this.assertEq(G.Combo.multiplier, 2, 'Multiplier should be 2');
      G.Combo.update(4); // Timer bitir
      this.assertEq(G.Combo.count, 0, 'Combo should reset');
      this.assertEq(G.Combo.multiplier, 1, 'Multiplier should reset');
    });

    // Test 2: Combo x10
    tests.push(() => {
      G.Combo.init();
      for (let i = 0; i < 12; i++) G.Combo.hit();
      this.assertEq(G.Combo.multiplier, 10, 'Combo 12+ should give x10');
    });

    // Test 3: Combo timer negatif olmamalı
    tests.push(() => {
      G.Combo.init();
      G.Combo.hit();
      G.Combo.update(100); // Çok büyük dt
      this.assert(G.Combo.timer >= 0, 'Combo timer should not go negative');
      this.assertEq(G.Combo.count, 0, 'Combo should reset after large dt');
    });

    // Test 4: Combo timer sıfırda durmalı
    tests.push(() => {
      G.Combo.init();
      G.Combo.update(0.1); // Timer zaten 0
      this.assertEq(G.Combo.timer, 0, 'Timer should stay at 0');
      this.assertEq(G.Combo.count, 0, 'Count should stay at 0');
    });

    return tests;
  },

  // ====== STATE MACHINE TESTS ======

  testStateTransitions() {
    const tests = [];

    // Test 1: Menu → Play
    tests.push(() => {
      G.Engine.state = 'menu';
      G.Engine.startGame();
      this.assertEq(G.Engine.state, 'play', 'Should transition to play');
    });

    // Test 2: Play → Paused
    tests.push(() => {
      G.Engine.state = 'play';
      // ESC simülasyonu
      G.Engine.state = 'paused';
      this.assertEq(G.Engine.state, 'paused', 'Should be paused');
    });

    // Test 3: Paused → Play
    tests.push(() => {
      G.Engine.state = 'paused';
      G.Engine.state = 'play';
      this.assertEq(G.Engine.state, 'play', 'Should resume');
    });

    // Test 4: Play → Dead
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Snake.alive = false;
      G.Engine.die('test');
      this.assertEq(G.Engine.state, 'dead', 'Should be dead');
    });

    // Test 5: Dead → Play (restart)
    tests.push(() => {
      G.Engine.state = 'dead';
      G.Engine.startGame();
      this.assertEq(G.Engine.state, 'play', 'Should restart');
      this.assert(G.Snake.alive, 'Snake should be alive');
      this.assertEq(G.Engine.score, 0, 'Score should reset');
    });

    // Test 6: Play → LevelUp
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.xp = G.Engine.xpNext;
      G.Engine.collectFood({
        x: G.Snake.head().x, y: G.Snake.head().y,
        type: 'crystal', color: '#aa44ff', sc: 0, len: 0, xp: 1, hp: 0,
        icon: '💎', anim: 0, alive: true
      });
      this.assertEq(G.Engine.state, 'levelup', 'Should be levelup');
    });

    // Test 7: LevelUp → Play (upgrade seç)
    tests.push(() => {
      G.Engine.state = 'levelup';
      G.Engine.upgradeChoices = G.Upgrades.pick(3);
      G.Engine.selectedUpgrade = 0;
      G.Engine.applyUpgrade(G.Engine.upgradeChoices[0]);
      G.Engine.state = 'play';
      this.assertEq(G.Engine.state, 'play', 'Should return to play');
      this.assert(G.Engine.upgrades.length > 0, 'Should have upgrade');
    });

    return tests;
  },

  // ====== STRESS TESTS ======

  testStress() {
    const tests = [];

    // Test 1: Çok düşmanla oyun
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      for (let i = 0; i < 20; i++) G.Enemies.spawn();
      for (let i = 0; i < 100; i++) {
        G.Engine.loop(G.Engine.lastTime + 16);
      }
      this.assert(true, 'Should handle many enemies');
    });

    // Test 2: Çok yemle oyun
    tests.push(() => {
      G.Engine.startGame();
      G.Food.items = [];
      for (let i = 0; i < 50; i++) {
        G.Food.items.push({
          x: Math.floor(Math.random() * 40),
          y: Math.floor(Math.random() * 30),
          type: 'normal', color: '#ff2244', sc: 1, len: 1, xp: 5, hp: 0,
          icon: '🍎', anim: 0, alive: true
        });
      }
      G.Food.update(0.1);
      this.assert(true, 'Should handle many food items');
    });

    // Test 3: Hızlı oyun döngüsü
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        G.Engine.loop(G.Engine.lastTime + 16);
      }
      const elapsed = performance.now() - start;
      this.assert(elapsed < 5000, `1000 frames should take < 5s, took ${elapsed}ms`);
    });

    // Test 4: Parçacık sistemi
    tests.push(() => {
      G.Particles.clear();
      for (let i = 0; i < 200; i++) {
        G.Particles.emit(400, 300, 50, 50, 1, 3, '#ff0000');
      }
      this.assert(G.Particles.list.length <= 155, 'Should respect particle limit (got ' + G.Particles.list.length + ')');
      G.Particles.update(0.1);
      this.assert(G.Particles.list.length < 200, 'Particles should decay');
    });

    return tests;
  },

  // ====== UPGRADE INTERACTION TESTS ======

  testUpgradeInteractions() {
    const tests = [];

    // Test 1: SecondLife + Ölüm
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Engine.upgrades = ['secondLife'];
      G.Snake.secondLifeUsed = false;
      G.Snake.hp = 1;
      G.Snake.invTimer = 0;
      G.Snake.takeDamage(1, 'test');
      this.assert(G.Snake.alive, 'SecondLife should prevent death');
      this.assert(G.Snake.hp > 0, 'Should have HP after SecondLife');
      this.assert(G.Snake.secondLifeUsed === true, 'SecondLife should be marked used');
    });

    // Test 2: SecondLife bir kez çalışmalı
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Engine.upgrades = ['secondLife'];
      G.Snake.secondLifeUsed = true; // Zaten kullanılmış
      G.Snake.hp = 1;
      G.Snake.invTimer = 0;
      G.Snake.takeDamage(1, 'test');
      this.assert(!G.Snake.alive, 'SecondLife should not work twice');
    });

    // Test 3: BlastGuard + Bomba
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Engine.upgrades = ['blastGuard'];
      G.Snake.invTimer = 0;
      const beforeHP = G.Snake.hp;
      G.Engine.collectFood({
        x: 20, y: 15, type: 'bomb', color: '#ff6600', sc: 0, len: 0, xp: 0, hp: 0,
        icon: '💣', effect: 'bomb', anim: 0, alive: true
      });
      this.assert(G.Snake.hp === beforeHP, 'BlastGuard should block bomb damage');
    });

    // Test 4: Score2x
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.upgrades = ['score2x'];
      G.Engine.score = 0;
      G.Combo.count = 0;
      G.Combo.multiplier = 1;
      G.Engine.collectFood({
        x: 20, y: 15, type: 'normal', color: '#ff2244', sc: 10, len: 0, xp: 0, hp: 0,
        icon: '🍎', anim: 0, alive: true
      });
      this.assert(G.Engine.score === 20, 'Score2x should double score');
    });

    // Test 5: Armor hasar azaltma
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Engine.upgrades = ['armor'];
      G.Snake._armorTimer = 10;
      G.Snake.invTimer = 0;
      G.Snake.hp = 4;
      G.Snake.takeDamage(1, 'test');
      this.assert(G.Snake.hp === 4, 'Armor should block 1 damage');
    });

    return tests;
  },

  // ====== TIMING TESTS ======

  testTiming() {
    const tests = [];

    // Test 1: Invincibility timer
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Snake.invTimer = 1.0;
      G.Snake.update(0.5);
      this.assert(G.Snake.invTimer > 0, 'InvTimer should still be positive');
      G.Snake.update(0.6);
      this.assert(G.Snake.invTimer <= 0, 'InvTimer should expire');
    });

    // Test 2: Start delay
    tests.push(() => {
      G.Engine.startGame();
      this.assert(G.Engine.startDelay > 0, 'Should have start delay');
      const beforeX = G.Snake.head().x;
      G.Snake.dirQueue = [{ x: 1, y: 0 }];
      G.Snake.update(0.5);
      this.assert(G.Snake.head().x === beforeX, 'Should not move during start delay');
    });

    // Test 3: Boss spawn timing
    tests.push(() => {
      G.Engine.startGame();
      G.Engine.level = 4;
      G.Engine.xp = G.Engine.xpNext;
      G.Engine.collectFood({
        x: G.Snake.head().x, y: G.Snake.head().y,
        type: 'crystal', color: '#aa44ff', sc: 0, len: 0, xp: 1, hp: 0,
        icon: '💎', anim: 0, alive: true
      });
      // Level 5'te boss spawn olmalı
      if (G.Engine.level >= 5) {
        this.assert(G.Boss.isActive(), 'Boss should spawn at level 5');
      }
    });

    return tests;
  },

  // ====== SAVE/LOAD TESTS ======

  testSaveLoad() {
    const tests = [];

    // Test 1: Default values
    tests.push(() => {
      const d = G.Save.defaults();
      this.assert(d.version === 1, 'Version should be 1');
      this.assert(d.coins === 0, 'Coins should be 0');
      this.assert(d.highScore === 0, 'HighScore should be 0');
      this.assert(d.settings.sound === 0.7, 'Sound default');
      this.assert(d.settings.shake === true, 'Shake default');
      this.assert(d.settings.glow === true, 'Glow default');
      this.assert(d.settings.particles === true, 'Particles default');
    });

    // Test 2: Export/Import
    tests.push(() => {
      G.Save.data = G.Save.defaults();
      G.Save.data.coins = 100;
      G.Save.data.highScore = 500;
      const exported = G.Save.export();
      const imported = JSON.parse(exported);
      this.assert(imported.coins === 100, 'Exported coins should match');
      this.assert(imported.highScore === 500, 'Exported highScore should match');
    });

    // Test 3: AddCoins
    tests.push(() => {
      G.Save.data = G.Save.defaults();
      G.Save.addCoins(50);
      this.assert(G.Save.data.coins === 50, 'Coins should be 50');
      this.assert(G.Save.data.totalCoins === 50, 'TotalCoins should be 50');
      G.Save.addCoins(30);
      this.assert(G.Save.data.coins === 80, 'Coins should be 80');
    });

    return tests;
  },

  // ====== RUN ALL ======

  runAll() {
    console.log('\n🔬 DEEP TEST SUITE\n');
    this.results = [];
    this.errors = [];

    const testGroups = [
      { name: 'Snake Edge Cases', tests: this.testSnakeEdgeCases() },
      { name: 'Food Edge Cases', tests: this.testFoodEdgeCases() },
      { name: 'Enemy Edge Cases', tests: this.testEnemyEdgeCases() },
      { name: 'Boss Edge Cases', tests: this.testBossEdgeCases() },
      { name: 'Combo Edge Cases', tests: this.testComboEdgeCases() },
      { name: 'State Transitions', tests: this.testStateTransitions() },
      { name: 'Stress Tests', tests: this.testStress() },
      { name: 'Upgrade Interactions', tests: this.testUpgradeInteractions() },
      { name: 'Timing Tests', tests: this.testTiming() },
      { name: 'Save/Load', tests: this.testSaveLoad() }
    ];

    let totalPassed = 0;
    let totalFailed = 0;

    for (const group of testGroups) {
      console.log(`\n📦 ${group.name}`);
      let groupPassed = 0;
      let groupFailed = 0;

      for (let i = 0; i < group.tests.length; i++) {
        try {
          group.tests[i]();
          groupPassed++;
          totalPassed++;
          console.log(`  ✅ Test ${i + 1}`);
        } catch(e) {
          groupFailed++;
          totalFailed++;
          this.errors.push({ group: group.name, test: i + 1, error: e.message });
          console.log(`  ❌ Test ${i + 1}: ${e.message}`);
        }
      }

      this.results.push({
        name: group.name,
        passed: groupPassed,
        failed: groupFailed,
        total: group.tests.length
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 TOPLAM: ✅ ${totalPassed} PASS | ❌ ${totalFailed} FAIL`);
    console.log('='.repeat(50));

    if (this.errors.length > 0) {
      console.log('\n❌ HATALAR:');
      this.errors.forEach(e => console.log(`  [${e.group}] Test ${e.test}: ${e.error}`));
    }

    return { totalPassed, totalFailed, results: this.results, errors: this.errors };
  }
};
