// ============================================================
// test-bot-v2.js — Düzeltilmiş Uzun Oyun Botu
// ============================================================
window.G = window.G || {};

G.BotV2 = {
  // Yılanın bir sonraki hareket anını bekle ve yön ver
  run(frames) {
    console.log('\n🤖 BOT V2 — ' + frames + ' kare\n');
    const E = G.Engine;
    E.startGame();
    E.startDelay = 0;

    const log = [];
    let deaths = 0;
    let bossKills = 0;
    let foodEaten = 0;
    let levelUps = 0;

    for (let i = 0; i < frames; i++) {
      // Her karede yön ver (kuyruğa eklenir)
      this.setDirection();

      // Oyun döngüsü
      E.loop(E.lastTime + 16);

      // Level up
      if (E.state === 'levelup') {
        levelUps++;
        E.upgradeChoices = G.Upgrades.pick(3);
        E.applyUpgrade(E.upgradeChoices[0]);
        E.state = 'play';
        log.push({
          level: E.level,
          score: E.score,
          speed: G.Snake.speed.toFixed(1),
          hp: G.Snake.hp,
          ups: E.upgrades.length,
          enemies: G.Enemies.list.length,
          time: Math.round(E.gameTime)
        });
        if (E.level % 5 === 0) console.log(`  📈 Level ${E.level} | Score: ${E.score}`);
      }

      // Boss
      if (G.Boss.isActive()) {
        G.Boss.hit(3);
        if (!G.Boss.isActive()) {
          bossKills++;
          console.log(`  🏆 Boss #${bossKills} öldürüldü!`);
        }
      }

      // Ölüm
      if (E.state === 'dead') {
        deaths++;
        console.log(`  💀 Ölüm #${deaths} | Lvl: ${E.level} | Score: ${E.score} | Time: ${Math.round(E.gameTime)}s`);
        E.startGame();
        E.startDelay = 0;
      }

      // Skor takibi
      if (E.score > 0 && log.length === 0) {
        foodEaten++;
      }
    }

    const summary = {
      frames,
      deaths,
      maxLevel: E.level,
      maxScore: E.score,
      bossKills,
      levelUps,
      upgrades: E.upgrades.length,
      gameTime: Math.round(E.gameTime),
      fps: E.fps
    };

    console.log('\n📊 SONUÇ:');
    console.log(`  Deaths: ${deaths} | Max Level: ${E.level} | Score: ${E.score}`);
    console.log(`  Boss Kills: ${bossKills} | Level Ups: ${levelUps}`);
    console.log(`  Upgrades: ${E.upgrades.length} | FPS: ${E.fps}`);

    return { summary, log };
  },

  setDirection() {
    const E = G.Engine;
    const head = G.Snake.head();
    const COLS = E.W / E.GS;
    const ROWS = E.H / E.GS;

    // Düşman kontrolü (öncelikli)
    for (const e of G.Enemies.list) {
      if (!e.alive) continue;
      const d = G.Utils.dist(head.x, head.y, e.x, e.y);
      if (d < 3) {
        // Düşmandan kaç
        const dx = head.x - e.x;
        const dy = head.y - e.y;
        this.pushDir(dx, dy);
        return;
      }
    }

    // Boss kontrolü
    if (G.Boss.isActive()) {
      const b = G.Boss.active;
      const d = G.Utils.dist(head.x, head.y, b.x, b.y);
      if (d < 4) {
        const dx = head.x - b.x;
        const dy = head.y - b.y;
        this.pushDir(dx, dy);
        return;
      }
    }

    // En yakın yeme git
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

    if (closest) {
      let dx = closest.x - head.x;
      let dy = closest.y - head.y;

      // Wrap around
      if (Math.abs(dx) > COLS / 2) dx = dx > 0 ? dx - COLS : dx + COLS;
      if (Math.abs(dy) > ROWS / 2) dy = dy > 0 ? dy - ROWS : dy + ROWS;

      this.pushDir(dx, dy);
    }
  },

  pushDir(dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy)) {
      G.Snake.dirQueue.push({ x: dx > 0 ? 1 : -1, y: 0 });
    } else {
      G.Snake.dirQueue.push({ x: 0, y: dy > 0 ? 1 : -1 });
    }
    // Kuyruk sınırı
    if (G.Snake.dirQueue.length > 3) G.Snake.dirQueue.shift();
  }
};
