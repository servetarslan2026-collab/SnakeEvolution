// ============================================================
// test-bot.js — Otomatik Oyun Test Botu
// ============================================================
window.G = window.G || {};

G.TestBot = {
  active: false,
  testResults: [],
  currentTest: null,
  moveInterval: null,
  testTimeout: null,

  // Tüm testleri çalıştır
  runAllTests() {
    console.log('\n🤖 TEST BOT BAŞLADI\n');
    this.testResults = [];
    this.active = true;

    const tests = [
      { name: 'Oyun Başlatma', fn: () => this.testGameStart() },
      { name: 'Yılan Hareket', fn: () => this.testSnakeMovement() },
      { name: 'Yem Toplama', fn: () => this.testFoodCollection() },
      { name: 'Combo Sistemi', fn: () => this.testCombo() },
      { name: 'Level Atlama', fn: () => this.testLevelUp() },
      { name: 'Düşman Spawn', fn: () => this.testEnemySpawn() },
      { name: 'Düşman Çarpışma', fn: () => this.testEnemyCollision() },
      { name: 'Boss Spawn', fn: () => this.testBossSpawn() },
      { name: 'Boss Savaşı', fn: () => this.testBossFight() },
      { name: 'Yem Türleri', fn: () => this.testFoodTypes() },
      { name: 'Ölüm & Restart', fn: () => this.testDeathRestart() },
      { name: 'Kayıt Sistemi', fn: () => this.testSaveSystem() },
      { name: 'Upgrade Sistemi', fn: () => this.testUpgradeSystem() },
      { name: 'Tile Etkileri', fn: () => this.testTileEffects() },
      { name: 'Sağlık Kontrolü', fn: () => this.testHealthCheck() }
    ];

    let idx = 0;
    const runNext = () => {
      if (idx >= tests.length) {
        this.printResults();
        this.active = false;
        return;
      }
      const test = tests[idx++];
      this.currentTest = test.name;
      console.log(`\n▶ Test ${idx}/${tests.length}: ${test.name}`);
      try {
        const result = test.fn();
        if (result && typeof result.then === 'function') {
          result.then(() => {
            this.testResults.push({ name: test.name, status: 'PASS' });
            console.log(`  ✅ PASS`);
            setTimeout(runNext, 100);
          }).catch(e => {
            this.testResults.push({ name: test.name, status: 'FAIL', error: e.message });
            console.log(`  ❌ FAIL: ${e.message}`);
            setTimeout(runNext, 100);
          });
        } else {
          this.testResults.push({ name: test.name, status: 'PASS' });
          console.log(`  ✅ PASS`);
          setTimeout(runNext, 100);
        }
      } catch(e) {
        this.testResults.push({ name: test.name, status: 'FAIL', error: e.message });
        console.log(`  ❌ FAIL: ${e.message}`);
        setTimeout(runNext, 100);
      }
    };
    runNext();
  },

  assert(condition, message) {
    if (!condition) throw new Error(message);
  },

  // ====== TEST FONKSİYONLARI ======

  testGameStart() {
    G.Engine.startGame();
    this.assert(G.Engine.state === 'play', 'State should be play');
    this.assert(G.Snake.alive === true, 'Snake should be alive');
    this.assert(G.Snake.hp === 4, 'Snake HP should be 4');
    this.assert(G.Engine.level === 1, 'Level should be 1');
    this.assert(G.Food.items.length >= 8, 'Food should be spawned');
    this.assert(G.Engine.upgrades.length === 0, 'Upgrades should be empty');
  },

  testSnakeMovement() {
    G.Engine.startGame();
    G.Engine.startDelay = 0;
    const startX = G.Snake.head().x;
    const startY = G.Snake.head().y;

    // Sağa hareket
    G.Snake.dirQueue.push({ x: 1, y: 0 });
    G.Snake.update(0.5); // 0.5 saniye güncelle
    this.assert(G.Snake.head().x !== startX || G.Snake.head().y !== startY, 'Snake should have moved');

    // Sınır kontrolü (wrap around)
    G.Snake.segments = [{ x: 0, y: 15 }];
    G.Snake.renderPos = [{ x: 0, y: 15 }];
    G.Snake.dir = { x: -1, y: 0 };
    G.Snake.dirQueue = [];
    G.Snake.moveTimer = 0.3; // Force 1 move
    G.Snake.targetLength = 1;
    G.Snake.update(0.1);
    // Wrap around: x=0, yön sol → x=39 olmalı
    this.assert(G.Snake.head().x >= 0 && G.Snake.head().x < 40, 'Wrap around: head x should be valid (0-39), got ' + G.Snake.head().x);
  },

  testFoodCollection() {
    G.Engine.startGame();
    G.Engine.startDelay = 0;
    const startScore = G.Engine.score;
    const startXP = G.Engine.xp;

    // Yem oluştur ve topla
    G.Food.items = [{
      x: G.Snake.head().x + 1,
      y: G.Snake.head().y,
      type: 'normal', color: '#ff2244', sc: 1, len: 1, xp: 5, hp: 0,
      icon: '🍎', anim: 0, alive: true
    }];

    G.Snake.dirQueue.push({ x: 1, y: 0 });
    G.Snake.update(0.5);

    this.assert(G.Engine.score > startScore || G.Engine.xp > startXP, 'Score or XP should increase after eating');
  },

  testCombo() {
    G.Combo.init();
    this.assert(G.Combo.count === 0, 'Combo should start at 0');
    this.assert(G.Combo.multiplier === 1, 'Multiplier should start at 1');

    G.Combo.hit();
    G.Combo.hit();
    G.Combo.hit();
    this.assert(G.Combo.count === 3, 'Combo should be 3');
    this.assert(G.Combo.multiplier === 2, 'Multiplier should be 2 at combo 3');

    for (let i = 0; i < 5; i++) G.Combo.hit();
    this.assert(G.Combo.count === 8, 'Combo should be 8');
    this.assert(G.Combo.multiplier === 5, 'Multiplier should be 5 at combo 8');

    G.Combo.update(4); // Timer bitir
    this.assert(G.Combo.count === 0, 'Combo should reset after timer');
    this.assert(G.Combo.multiplier === 1, 'Multiplier should reset');
  },

  testLevelUp() {
    G.Engine.startGame();
    G.Engine.startDelay = 0;
    const startLevel = G.Engine.level;

    // Direkt level atlat
    G.Engine.xp = G.Engine.xpNext;
    G.Engine.collectFood({
      x: G.Snake.head().x, y: G.Snake.head().y,
      type: 'crystal', color: '#aa44ff', sc: 0, len: 0, xp: 1, hp: 0,
      icon: '💎', anim: 0, alive: true
    });

    this.assert(G.Engine.level > startLevel, 'Level should increase');
    this.assert(G.Engine.state === 'levelup', 'Should be in levelup state');
  },

  testEnemySpawn() {
    G.Engine.startGame();
    G.Enemies.init();
    this.assert(G.Enemies.list.length === 0, 'Enemies should start empty');

    G.Enemies.spawn();
    this.assert(G.Enemies.list.length === 1, 'Should have 1 enemy');
    this.assert(G.Enemies.list[0].alive === true, 'Enemy should be alive');
    this.assert(G.Enemies.list[0].type !== undefined, 'Enemy should have type');
    this.assert(G.Enemies.list[0].ai !== undefined, 'Enemy should have AI');
  },

  testEnemyCollision() {
    G.Engine.startGame();
    G.Engine.startDelay = 0;
    G.Snake.invTimer = 0;
    const startHP = G.Snake.hp;

    // Düşmanı yılanın üstüne koy
    G.Enemies.list = [{
      x: G.Snake.head().x, y: G.Snake.head().y,
      rx: G.Snake.head().x, ry: G.Snake.head().y,
      type: 'bug', speed: 1, hp: 1, color: '#ff2244', ai: 'wander',
      alive: true, moveTimer: 0, anim: 0, dir: { x: 0, y: -1 }, wanderTimer: 0
    }];

    G.Enemies.update(0.1);
    this.assert(G.Snake.hp < startHP, 'Snake should take damage from enemy');
  },

  testBossSpawn() {
    G.Engine.startGame();
    G.Engine.level = 5;
    G.Boss.spawn();
    this.assert(G.Boss.active !== null, 'Boss should be active');
    this.assert(G.Boss.active.alive === true, 'Boss should be alive');
    this.assert(G.Boss.active.hp > 0, 'Boss should have HP');
    this.assert(G.Boss.active.name === 'Dev Solucan', 'Boss should be Dev Solucan');
  },

  testBossFight() {
    G.Engine.startGame();
    G.Engine.level = 5;
    G.Boss.spawn();
    const bossHP = G.Boss.active.hp;

    G.Boss.hit(3);
    this.assert(G.Boss.active.hp === bossHP - 3, 'Boss should take damage');

    // Boss öldür
    G.Boss.active.hp = 1;
    G.Boss.hit(3);
    this.assert(G.Boss.active.dying === true, 'Boss should be dying');
    this.assert(G.Engine.score >= 50, 'Should get score for boss kill');
  },

  testFoodTypes() {
    const types = G.Config.FOOD_TYPES;
    this.assert(types.length === 11, 'Should have 11 food types');

    const totalWeight = types.reduce((sum, t) => sum + t.w, 0);
    this.assert(totalWeight > 0, 'Total weight should be positive');

    // Her türün gerekli alanları var mı
    for (const t of types) {
      this.assert(t.type, `Food type missing 'type': ${JSON.stringify(t)}`);
      this.assert(t.color, `Food type ${t.type} missing 'color'`);
      this.assert(typeof t.w === 'number', `Food type ${t.type} missing weight`);
      this.assert(t.icon, `Food type ${t.type} missing icon`);
    }
  },

  testDeathRestart() {
    G.Engine.startGame();
    G.Engine.startDelay = 0;

    // Öl
    G.Snake.alive = false;
    G.Engine.die('test');
    this.assert(G.Engine.state === 'dead', 'Should be dead state');

    // Restart
    G.Engine.startGame();
    this.assert(G.Engine.state === 'play', 'Should be play state');
    this.assert(G.Snake.alive === true, 'Snake should be alive');
    this.assert(G.Engine.score === 0, 'Score should reset');
    this.assert(G.Engine.level === 1, 'Level should reset');
  },

  testSaveSystem() {
    const saveData = G.Save.defaults();
    this.assert(saveData.version === 1, 'Save version should be 1');
    this.assert(saveData.coins === 0, 'Coins should start at 0');
    this.assert(saveData.highScore === 0, 'High score should start at 0');
    this.assert(saveData.settings.sound === 0.7, 'Sound setting default');
    this.assert(saveData.settings.shake === true, 'Shake setting default');
    this.assert(saveData.settings.glow === true, 'Glow setting default');
    this.assert(saveData.settings.particles === true, 'Particles setting default');
    this.assert(Array.isArray(saveData.achievements), 'Achievements should be array');
    this.assert(Array.isArray(saveData.unlockedSkins), 'Unlocked skins should be array');
  },

  testUpgradeSystem() {
    G.Engine.startGame();
    G.Engine.upgrades = [];

    // 3 upgrade seç
    const choices = G.Upgrades.pick(3);
    this.assert(choices.length === 3, 'Should pick 3 upgrades');
    this.assert(choices[0].id !== undefined, 'Upgrade should have id');
    this.assert(choices[0].name !== undefined, 'Upgrade should have name');

    // Uygula
    G.Engine.applyUpgrade(choices[0]);
    this.assert(G.Engine.upgrades.length === 1, 'Should have 1 upgrade applied');
    this.assert(G.Engine.upgrades[0] === choices[0].id, 'Upgrade id should match');
  },

  testTileEffects() {
    // Lava tile test
    this.assert(G.Map.isBlocking(1) === true, 'Wall should block');
    this.assert(G.Map.isBlocking(2) === true, 'Rock should block');
    this.assert(G.Map.isBlocking(3) === true, 'Lava should block (for dash)');
    this.assert(G.Map.isBlocking(0) === false, 'Empty should not block');
    this.assert(G.Map.isBlocking(4) === false, 'Ice should not block');
  },

  testHealthCheck() {
    G.Engine.startGame();
    G.Logger.init();
    const issues = G.Logger.healthCheck();
    // Sağlık kontrolü çalışıyor mu
    this.assert(Array.isArray(issues), 'Health check should return array');
    console.log(`  📊 Health issues found: ${issues.length}`);
    if (issues.length > 0) {
      issues.forEach(i => console.log(`    ⚠️ ${i}`));
    }
  },

  // ====== SONUÇLAR ======

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST SONUÇLARI');
    console.log('='.repeat(50));

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;

    this.testResults.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${icon} ${r.name}${r.error ? ' — ' + r.error : ''}`);
    });

    console.log('='.repeat(50));
    console.log(`✅ PASS: ${passed} | ❌ FAIL: ${failed} | TOPLAM: ${this.testResults.length}`);
    console.log('='.repeat(50) + '\n');

    return { passed, failed, total: this.testResults.length, results: this.testResults };
  }
};
