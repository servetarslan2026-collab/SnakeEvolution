// ============================================================
// test-visual.js — Görsel Doğrulama Testleri
// ============================================================
window.G = window.G || {};

G.VisualTest = {
  assert(c, m) { if (!c) throw new Error(m); },

  // Canvas pixel okuma
  getPixel(x, y) {
    const cv = document.getElementById('c');
    const ctx = cv.getContext('2d');
    const d = ctx.getImageData(x, y, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] };
  },

  // Belirli bölgede siyah olmayan pixel var mı
  hasNonBlackPixels(x, y, w, h) {
    const cv = document.getElementById('c');
    const ctx = cv.getContext('2d');
    const data = ctx.getImageData(x, y, w, h).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 5 || data[i+1] > 5 || data[i+2] > 5) return true;
    }
    return false;
  },

  // Belirli renkte pixel var mı
  hasColorPixels(x, y, w, h, r, g, b, tolerance) {
    const cv = document.getElementById('c');
    const ctx = cv.getContext('2d');
    const data = ctx.getImageData(x, y, w, h).data;
    for (let i = 0; i < data.length; i += 4) {
      if (Math.abs(data[i] - r) < tolerance &&
          Math.abs(data[i+1] - g) < tolerance &&
          Math.abs(data[i+2] - b) < tolerance) return true;
    }
    return false;
  },

  runAll() {
    console.log('\n🎨 VISUAL TEST SUITE\n');
    let passed = 0, failed = 0;
    const errors = [];

    const tests = [
      // ====== MENU EKRANI ======
      { name: 'Menu: Canvas boyutu', fn: () => {
        const cv = document.getElementById('c');
        this.assert(cv.width > 0, 'Canvas width > 0');
        this.assert(cv.height > 0, 'Canvas height > 0');
      }},
      { name: 'Menu: Arkaplan siyah değil', fn: () => {
        G.Engine.state = 'menu';
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(100, 100, 200, 200), 'Menu background should not be pure black');
      }},
      { name: 'Menu: Başlık çiziliyor', fn: () => {
        G.Engine.state = 'menu';
        G.Engine.draw();
        // Başlık orta üstte olmalı
        this.assert(this.hasNonBlackPixels(300, 60, 200, 80), 'Title area should have pixels');
      }},
      { name: 'Menu: Butonlar çiziliyor', fn: () => {
        G.Engine.state = 'menu';
        G.Engine.draw();
        // Butonlar orta kısımda
        this.assert(this.hasNonBlackPixels(270, 200, 260, 200), 'Buttons area should have pixels');
      }},
      { name: 'Menu: Stats bar', fn: () => {
        G.Engine.state = 'menu';
        G.Engine.draw();
        // Alt kısım stats
        this.assert(this.hasNonBlackPixels(0, 550, 800, 50), 'Stats bar should have pixels');
      }},

      // ====== PLAY EKRANI ======
      { name: 'Play: HUD çiziliyor', fn: () => {
        G.Engine.startGame();
        G.Engine.startDelay = 0;
        G.Engine.draw();
        // HUD üst kısım
        this.assert(this.hasNonBlackPixels(0, 0, 800, 75), 'HUD should have pixels');
      }},
      { name: 'Play: Skor gösteriliyor', fn: () => {
        G.Engine.score = 123;
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(10, 10, 100, 30), 'Score area should have pixels');
      }},
      { name: 'Play: Level gösteriliyor', fn: () => {
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(10, 40, 60, 20), 'Level area should have pixels');
      }},
      { name: 'Play: Kalpler çiziliyor', fn: () => {
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(10, 55, 100, 20), 'Hearts area should have pixels');
      }},
      { name: 'Play: Yılan çiziliyor', fn: () => {
        G.Engine.draw();
        const head = G.Snake.head();
        const gs = G.Engine.GS;
        const px = head.x * gs + gs / 2;
        const py = head.y * gs + gs / 2;
        this.assert(this.hasNonBlackPixels(px - 15, py - 15, 30, 30), 'Snake head should have pixels');
      }},
      { name: 'Play: Yemler çiziliyor', fn: () => {
        G.Engine.draw();
        let foodDrawn = false;
        for (const f of G.Food.items) {
          const px = f.x * G.Engine.GS;
          const py = f.y * G.Engine.GS;
          if (this.hasNonBlackPixels(px, py, 20, 20)) { foodDrawn = true; break; }
        }
        this.assert(foodDrawn, 'At least one food should be drawn');
      }},
      { name: 'Play: Grid çiziliyor', fn: () => {
        G.Engine.draw();
        // Grid noktaları karanlık ama siyah değil
        this.assert(this.hasNonBlackPixels(200, 200, 50, 50), 'Grid area should have subtle pixels');
      }},
      { name: 'Play: Border çiziliyor', fn: () => {
        G.Engine.draw();
        // Kenarlık
        this.assert(this.hasNonBlackPixels(0, 0, 5, 600), 'Left border should have pixels');
      }},
      { name: 'Play: Mini harita', fn: () => {
        G.Engine.draw();
        // Sağ alt köşe
        this.assert(this.hasNonBlackPixels(720, 540, 70, 50), 'Minimap should have pixels');
      }},
      { name: 'Play: Biome adı', fn: () => {
        G.Engine.draw();
        // Sağ üst
        this.assert(this.hasNonBlackPixels(680, 5, 120, 15), 'Biome name should have pixels');
      }},

      // ====== DÜŞMANLAR ======
      { name: 'Düşman: Çiziliyor', fn: () => {
        G.Engine.startGame();
        G.Enemies.spawn();
        G.Engine.draw();
        let enemyDrawn = false;
        for (const e of G.Enemies.list) {
          const px = e.x * G.Engine.GS;
          const py = e.y * G.Engine.GS;
          if (this.hasNonBlackPixels(px - 10, py - 10, 30, 30)) { enemyDrawn = true; break; }
        }
        this.assert(enemyDrawn, 'At least one enemy should be drawn');
      }},

      // ====== BOSS ======
      { name: 'Boss: Çiziliyor', fn: () => {
        G.Engine.startGame();
        G.Engine.level = 5;
        G.Boss.spawn();
        G.Engine.draw();
        const b = G.Boss.active;
        const px = b.rx * G.Engine.GS;
        const py = b.ry * G.Engine.GS;
        this.assert(this.hasNonBlackPixels(px - 30, py - 30, 60, 60), 'Boss should be drawn');
      }},
      { name: 'Boss: HP bar', fn: () => {
        G.Engine.draw();
        const b = G.Boss.active;
        const px = b.rx * G.Engine.GS;
        const py = b.ry * G.Engine.GS;
        // HP bar boss üstünde
        this.assert(this.hasNonBlackPixels(px - 60, py - 50, 120, 15), 'Boss HP bar should be drawn');
      }},

      // ====== LEVEL UP EKRANI ======
      { name: 'LevelUp: Ekran çiziliyor', fn: () => {
        G.Engine.state = 'levelup';
        G.Engine.upgradeChoices = G.Upgrades.pick(3);
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(0, 0, 800, 600), 'LevelUp screen should have pixels');
      }},
      { name: 'LevelUp: Kartlar çiziliyor', fn: () => {
        G.Engine.draw();
        // 3 kart ortada
        this.assert(this.hasNonBlackPixels(100, 130, 600, 200), 'Upgrade cards should be drawn');
      }},

      // ====== PAUSE EKRANI ======
      { name: 'Pause: Overlay çiziliyor', fn: () => {
        G.Engine.state = 'paused';
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(300, 250, 200, 100), 'Pause overlay should have pixels');
      }},

      // ====== DEAD EKRANI ======
      { name: 'Dead: Game Over çiziliyor', fn: () => {
        G.Engine.state = 'dead';
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(250, 80, 300, 60), 'Game Over text should be drawn');
      }},
      { name: 'Dead: Skor gösteriliyor', fn: () => {
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(300, 140, 200, 100), 'Death stats should be drawn');
      }},

      // ====== HOW TO PLAY ======
      { name: 'HowToPlay: Ekran çiziliyor', fn: () => {
        G.Engine.state = 'howtoplay';
        G.Engine.howToPlayPage = 0;
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(0, 0, 800, 600), 'HowToPlay should have pixels');
      }},

      // ====== SETTINGS ======
      { name: 'Settings: Ekran çiziliyor', fn: () => {
        G.Engine.state = 'settings';
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(0, 0, 800, 600), 'Settings should have pixels');
      }},

      // ====== SKINS ======
      { name: 'Skins: Ekran çiziliyor', fn: () => {
        G.Engine.state = 'skins';
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(0, 0, 800, 600), 'Skins should have pixels');
      }},

      // ====== POST-PROCESSING ======
      { name: 'PostProcessing: Vignette', fn: () => {
        G.Engine.state = 'play';
        G.Engine.draw();
        // Köşeler karanlık olmalı (vignette)
        const corner = this.getPixel(5, 5);
        this.assert(corner.r < 20, 'Corner should be dark (vignette)');
      }},

      // ====== PARÇACIK EFEKTLERİ ======
      { name: 'Parçacık: Burst çiziliyor', fn: () => {
        G.Particles.clear();
        G.Particles.burst(400, 300, '#ff0000', 10);
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(380, 280, 40, 40), 'Particle burst should be visible');
      }},
      { name: 'Parçacık: FloatText çiziliyor', fn: () => {
        G.Particles.clear();
        G.Particles.floatText(400, 300, '+100', '#ffaa00');
        G.Engine.draw();
        this.assert(this.hasNonBlackPixels(370, 280, 60, 30), 'Float text should be visible');
      }},

      // ====== EKRAN EFEKTLERİ ======
      { name: 'Flash: Kırmızı flaş', fn: () => {
        G.Effects.flash('#ff0000', 0.5);
        G.Engine.draw();
        // Kırmızı flaş overlay
        this.assert(true, 'Flash should not crash');
      }},
      { name: 'Shake: Ekran sarsıntısı', fn: () => {
        G.Effects.shake(5, 0.3);
        G.Engine.draw();
        this.assert(true, 'Shake should not crash');
      }}
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

    console.log(`\n📊 Görsel Test: ✅ ${passed} PASS | ❌ ${failed} FAIL`);
    return { passed, failed, errors };
  }
};
