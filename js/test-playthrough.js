// ============================================================
// test-playthrough.js — Uzun Oyun Simülasyon Botu
// ============================================================
window.G = window.G || {};

G.Playthrough = {
  assert(c, m) { if (!c) throw new Error(m); },

  // Yılanı hedef tile'a kadar taşı (grid tabanlı)
  moveSnakeTo(tx, ty, maxSteps) {
    const E = G.Engine;
    for (let step = 0; step < (maxSteps || 50); step++) {
      const head = G.Snake.head();
      if (head.x === tx && head.y === ty) return true;

      const dx = tx - head.x;
      const dy = ty - head.y;

      // Wrap around hesapla
      const COLS = E.W / E.GS;
      const ROWS = E.H / E.GS;
      let adx = dx;
      let ady = dy;
      if (Math.abs(dx) > COLS / 2) adx = dx > 0 ? dx - COLS : dx + COLS;
      if (Math.abs(dy) > ROWS / 2) ady = dy > 0 ? dy - ROWS : dy + ROWS;

      // Yön seç
      if (Math.abs(adx) >= Math.abs(ady)) {
        G.Snake.dirQueue.push({ x: adx > 0 ? 1 : -1, y: 0 });
      } else {
        G.Snake.dirQueue.push({ x: 0, y: ady > 0 ? 1 : -1 });
      }

      // Bir kare güncelle
      G.Engine.loop(E.lastTime + 16);

      // Level up kontrolü
      if (E.state === 'levelup') {
        E.upgradeChoices = G.Upgrades.pick(3);
        E.applyUpgrade(E.upgradeChoices[0]);
        E.state = 'play';
      }

      // Boss kontrolü
      if (G.Boss.isActive()) {
        G.Boss.hit(3);
      }

      // Ölüm kontrolü
      if (E.state === 'dead') return false;
    }
    return false;
  },

  // En yakın yemi bul ve topla
  collectNearestFood() {
    const head = G.Snake.head();
    let closest = null;
    let minDist = Infinity;

    for (const f of G.Food.items) {
      if (!f.alive) continue;
      const d = G.Utils.dist(head.x, head.y, f.x, f.y);
      if (d < minDist) {
        minDist = d;
        closest = f;
      }
    }

    if (!closest) return false;
    return this.moveSnakeTo(closest.x, closest.y, 30);
  },

  // Düşmandan kaç
  avoidEnemies() {
    const head = G.Snake.head();
    for (const e of G.Enemies.list) {
      if (!e.alive) continue;
      const d = G.Utils.dist(head.x, head.y, e.x, e.y);
      if (d < 4) {
        // Ters yöne git
        const dx = head.x - e.x;
        const dy = head.y - e.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          G.Snake.dirQueue.push({ x: dx > 0 ? 1 : -1, y: 0 });
        } else {
          G.Snake.dirQueue.push({ x: 0, y: dy > 0 ? 1 : -1 });
        }
        return true;
      }
    }
    return false;
  },

  // Uzun oyun simülasyonu
  run(durationSec) {
    console.log('\n🎮 UZUN OYUN SİMÜLASYONU (' + durationSec + ' sn)\n');
    const E = G.Engine;
    E.startGame();
    E.startDelay = 0;

    const startTime = Date.now();
    const log = [];
    let totalFood = 0;
    let deaths = 0;
    let bossKills = 0;
    let frames = 0;
    const targetFrames = durationSec * 60;

    while (frames < targetFrames) {
      // Düşmandan kaç
      if (!this.avoidEnemies()) {
        // Yem topla
        this.collectNearestFood();
      }

      // Her 10 karede bir güncelle
      for (let i = 0; i < 10; i++) {
        E.loop(E.lastTime + 16);
        frames++;

        // Level up
        if (E.state === 'levelup') {
          E.upgradeChoices = G.Upgrades.pick(3);
          E.applyUpgrade(E.upgradeChoices[0]);
          E.state = 'play';
          log.push({
            level: E.level,
            score: E.score,
            speed: G.Snake.speed.toFixed(2),
            hp: G.Snake.hp,
            ups: E.upgrades.length,
            enemies: G.Enemies.list.length,
            boss: G.Boss.isActive(),
            food: G.Food.items.length,
            time: Math.round(E.gameTime)
          });
          console.log(`  📈 Level ${E.level} | Score: ${E.score} | Speed: ${G.Snake.speed.toFixed(2)} | HP: ${G.Snake.hp} | Upgrades: ${E.upgrades.length}`);
        }

        // Boss
        if (G.Boss.isActive()) {
          G.Boss.hit(3);
          if (!G.Boss.isActive()) {
            bossKills++;
            console.log(`  🏆 Boss öldürüldü! (#${bossKills})`);
          }
        }

        // Ölüm
        if (E.state === 'dead') {
          deaths++;
          console.log(`  💀 Ölüm #${deaths} | Level: ${E.level} | Score: ${E.score}`);
          E.startGame();
          E.startDelay = 0;
          break;
        }
      }

      // Yem sayısını takip et
      totalFood = Math.max(totalFood, E.score);
    }

    const elapsed = (Date.now() - startTime) / 1000;
    const fps = frames / elapsed;

    const summary = {
      frames,
      elapsed: Math.round(elapsed),
      fps: Math.round(fps),
      deaths,
      maxLevel: E.level,
      maxScore: E.score,
      bossKills,
      upgrades: E.upgrades.length,
      gameTime: Math.round(E.gameTime)
    };

    console.log('\n📊 SONUÇ:');
    console.log(`  Frames: ${frames} | Elapsed: ${elapsed.toFixed(1)}s | FPS: ${fps.toFixed(0)}`);
    console.log(`  Deaths: ${deaths} | Max Level: ${E.level} | Max Score: ${E.score}`);
    console.log(`  Boss Kills: ${bossKills} | Upgrades: ${E.upgrades.length}`);
    console.log(`  Game Time: ${Math.round(E.gameTime)}s`);

    return { summary, log };
  }
};
