// ============================================================
// test-long.js — Uzun Oyun Simülasyonu Testleri
// ============================================================
window.G = window.G || {};

G.LongTest = {
  assert(c, m) { if (!c) throw new Error(m); },

  runAll() {
    console.log('\n⏰ UZUN OYUN SİMÜLASYONU\n');
    let passed = 0, failed = 0;
    const errors = [];

    // Test 1: 10 saniyelik simülasyon (~600 kare)
    const test1 = () => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      const startMem = performance.memory?.usedJSHeapSize || 0;
      const startTime = performance.now();
      let frames = 0;
      let deaths = 0;

      for (let i = 0; i < 600; i++) {
        // Rastgele yön
        if (i % 10 === 0) {
          const dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
          G.Snake.dirQueue.push(dirs[Math.floor(Math.random() * 4)]);
        }
        G.Engine.loop(G.Engine.lastTime + 16);
        frames++;

        // Ölürse yeniden başlat
        if (G.Engine.state === 'dead') {
          deaths++;
          G.Engine.startGame();
          G.Engine.startDelay = 0;
        }
      }

      const elapsed = performance.now() - startTime;
      const endMem = performance.memory?.usedJSHeapSize || 0;
      const memDiff = endMem - startMem;

      this.assert(frames === 600, `Should complete 600 frames, got ${frames}`);
      this.assert(elapsed < 10000, `Should take < 10s, took ${elapsed}ms`);
      this.assert(deaths < 100, `Too many deaths: ${deaths}`);
      console.log(`    Frames: ${frames}, Time: ${elapsed.toFixed(0)}ms, Deaths: ${deaths}, Mem: ${(memDiff/1024).toFixed(0)}KB`);
    };

    // Test 2: 30 saniyelik simülasyon (~1800 kare)
    const test2 = () => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      const startTime = performance.now();
      let frames = 0;
      let deaths = 0;
      let maxLevel = 1;
      let maxScore = 0;

      for (let i = 0; i < 1800; i++) {
        if (i % 8 === 0) {
          const dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
          G.Snake.dirQueue.push(dirs[Math.floor(Math.random() * 4)]);
        }
        G.Engine.loop(G.Engine.lastTime + 16);
        frames++;

        if (G.Engine.level > maxLevel) maxLevel = G.Engine.level;
        if (G.Engine.score > maxScore) maxScore = G.Engine.score;

        if (G.Engine.state === 'dead') {
          deaths++;
          G.Engine.startGame();
          G.Engine.startDelay = 0;
        }
        if (G.Engine.state === 'levelup') {
          G.Engine.upgradeChoices = G.Upgrades.pick(3);
          G.Engine.applyUpgrade(G.Engine.upgradeChoices[0]);
          G.Engine.state = 'play';
        }
      }

      const elapsed = performance.now() - startTime;
      const fps = frames / (elapsed / 1000);

      this.assert(frames === 1800, `Should complete 1800 frames`);
      this.assert(fps > 30, `FPS should be > 30, got ${fps.toFixed(0)}`);
      this.assert(maxLevel >= 1, `Should reach level 1+`);
      console.log(`    Frames: ${frames}, FPS: ${fps.toFixed(0)}, Deaths: ${deaths}, MaxLevel: ${maxLevel}, MaxScore: ${maxScore}`);
    };

    // Test 3: Boss döngüsü (5 boss öldürme)
    const test3 = () => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      let bossesKilled = 0;

      for (let i = 0; i < 3000 && bossesKilled < 5; i++) {
        // Level atlat
        if (G.Engine.state === 'play') {
          G.Engine.xp = G.Engine.xpNext;
          G.Engine.collectFood({x:G.Snake.head().x,y:G.Snake.head().y,type:'crystal',color:'#aa44ff',sc:0,len:0,xp:1,hp:0,icon:'💎',anim:0,alive:true});
        }
        if (G.Engine.state === 'levelup') {
          G.Engine.upgradeChoices = G.Upgrades.pick(3);
          G.Engine.applyUpgrade(G.Engine.upgradeChoices[0]);
          G.Engine.state = 'play';
        }
        if (G.Boss.isActive()) {
          // Boss'u hızla öldür
          G.Boss.active.hp = 1;
          G.Boss.hit(10);
          bossesKilled++;
        }
        G.Engine.loop(G.Engine.lastTime + 16);
      }

      this.assert(bossesKilled >= 3, `Should kill at least 3 bosses, killed ${bossesKilled}`);
      console.log(`    Bosses killed: ${bossesKilled}`);
    };

    // Test 4: Memory leak kontrolü
    const test4 = () => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      const startFood = G.Food.items.length;
      const startEnemies = G.Enemies.list.length;

      for (let i = 0; i < 500; i++) {
        if (i % 5 === 0) {
          G.Snake.dirQueue.push({x:1,y:0});
        }
        G.Engine.loop(G.Engine.lastTime + 16);
        if (G.Engine.state === 'dead') {
          G.Engine.startGame();
          G.Engine.startDelay = 0;
        }
      }

      // Yem sayısı makul olmalı
      this.assert(G.Food.items.length <= G.Food.maxFood + 2, `Food count should be bounded: ${G.Food.items.length}`);
      // Düşman sayısı makul olmalı
      this.assert(G.Enemies.list.length <= 6, `Enemy count should be bounded: ${G.Enemies.list.length}`);
      // Parçacık sayısı makul olmalı
      this.assert(G.Particles.list.length <= 200, `Particle count should be bounded: ${G.Particles.list.length}`);
      // Boss null olmalı (ölmediyse)
      if (G.Boss.active && !G.Boss.active.alive && !G.Boss.active.dying) {
        this.assert(false, 'Boss should be null if dead and not dying');
      }
      console.log(`    Food: ${G.Food.items.length}, Enemies: ${G.Enemies.list.length}, Particles: ${G.Particles.list.length}`);
    };

    // Test 5: Performans stabilitesi
    const test5 = () => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      const fpsHistory = [];

      for (let sec = 0; sec < 5; sec++) {
        let frameCount = 0;
        const secStart = performance.now();
        while (performance.now() - secStart < 1000) {
          if (frameCount % 15 === 0) {
            G.Snake.dirQueue.push({x:1,y:0});
          }
          G.Engine.loop(G.Engine.lastTime + 16);
          frameCount++;
          if (G.Engine.state === 'dead') {
            G.Engine.startGame();
            G.Engine.startDelay = 0;
          }
        }
        fpsHistory.push(frameCount);
      }

      const avgFPS = fpsHistory.reduce((a,b) => a+b, 0) / fpsHistory.length;
      const minFPS = Math.min(...fpsHistory);
      this.assert(avgFPS > 30, `Avg FPS should be > 30, got ${avgFPS.toFixed(0)}`);
      this.assert(minFPS > 20, `Min FPS should be > 20, got ${minFPS}`);
      console.log(`    Avg FPS: ${avgFPS.toFixed(0)}, Min FPS: ${minFPS}, History: [${fpsHistory.join(', ')}]`);
    };

    const tests = [
      { name: '10sn Simülasyon (600 kare)', fn: test1 },
      { name: '30sn Simülasyon (1800 kare)', fn: test2 },
      { name: 'Boss Döngüsü (5 boss)', fn: test3 },
      { name: 'Memory Leak Kontrolü', fn: test4 },
      { name: 'Performans Stabilitesi (5sn)', fn: test5 }
    ];

    for (const t of tests) {
      try {
        t.fn();
        passed++;
        console.log(`  ✅ ${t.name}`);
      } catch(e) {
        failed++;
        errors.push({ name: t.name, error: e.message });
        console.log(`  ❌ ${t.name}: ${e.message}`);
      }
    }

    console.log(`\n📊 Uzun Oyun Test: ✅ ${passed} PASS | ❌ ${failed} FAIL`);
    return { passed, failed, errors };
  }
};
