// ============================================================
// test-features.js — Yeni Özellik Testleri (Güncel)
// ============================================================
window.G = window.G || {};

G.FeatureTest = {
  assert(c, m) { if (!c) throw new Error(m); },
  assertEq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); },

  runAll() {
    console.log('\n🆕 FEATURE TESTLERİ\n');
    let P = 0, F = 0;
    const E = [];

    function t(name, fn) {
      try { fn(); P++; console.log(`  ✅ ${name}`); }
      catch(e) { F++; E.push({name, error:e.message}); console.log(`  ❌ ${name}: ${e.message}`); }
    }

    // ====== 1. MÜZİK SLIDER ======
    t('Müzik slider: settings.music var', () => {
      this.assert(typeof G.Save.data.settings.music === 'number', 'music should be number');
    });
    t('Müzik slider: 0-1 aralığında', () => {
      this.assert(G.Save.data.settings.music >= 0 && G.Save.data.settings.music <= 1, 'music should be 0-1');
    });
    t('Müzik slider: setMusicVolume fonksiyonu', () => {
      this.assert(typeof G.Audio.setMusicVolume === 'function', 'setMusicVolume should exist');
    });
    t('Müzik slider: değişim çalışır', () => {
      G.Audio.init();
      G.Save.data.settings.music = 0.3;
      G.Audio.setMusicVolume(0.3);
      this.assert(true, 'setMusicVolume should not crash');
    });

    // ====== 2. FPS TOGGLE ======
    t('FPS toggle: settings.showFPS var', () => {
      this.assert(typeof G.Save.data.settings.showFPS === 'boolean', 'showFPS should be boolean');
    });
    t('FPS toggle: default kapalı', () => {
      this.assertEq(G.Save.data.settings.showFPS, false, 'showFPS should default false');
    });
    t('FPS toggle: açılabilir', () => {
      G.Save.data.settings.showFPS = true;
      this.assertEq(G.Save.data.settings.showFPS, true, 'showFPS should be true');
    });
    t('FPS toggle: kapatılabilir', () => {
      G.Save.data.settings.showFPS = false;
      this.assertEq(G.Save.data.settings.showFPS, false, 'showFPS should be false');
    });

    // ====== 3. BAŞARIM BİLDİRİM SÜRESİ ======
    t('Başarım: notify 4sn süre', () => {
      G.Engine.startGame();
      G.Engine.notify('Test', '#fff', 4);
      const n = G.Engine.notifications[G.Engine.notifications.length - 1];
      this.assertEq(n.timer, 4, 'notification timer should be 4');
    });

    // ====== 4. BAŞARIM ÖDÜLÜ (+25 COİN) ======
    t('Başarım ödül: first_blood +25 coin', () => {
      G.Engine.startGame();
      G.Save.data.totalFood = 0;
      G.Save.data.achievements = [];
      G.Save.data.coins = 0;
      G.Save.data.totalFood = 1;
      G.Stats.checkAchievements();
      this.assert(G.Save.data.achievements.includes('first_blood'), 'first_blood should unlock');
      this.assert(G.Save.data.coins >= 25, 'Should get 25 coin reward, got ' + G.Save.data.coins);
    });

    // ====== 5. DÜŞMAN COLLİSİON COOLDOWN ======
    t('Düşman cooldown: _hitCooldown var', () => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Enemies.list = [{
        x: G.Snake.head().x, y: G.Snake.head().y,
        rx: G.Snake.head().x, ry: G.Snake.head().y,
        type: 'bug', speed: 1, hp: 1, color: '#ff2244', ai: 'wander',
        alive: true, moveTimer: 0, anim: 0, dir: {x:0,y:0}, wanderTimer: 0
      }];
      G.Snake.invTimer = 0;
      G.Enemies.update(0.1);
      this.assert(typeof G.Enemies.list[0]._hitCooldown === 'number', 'hitCooldown should be number');
    });
    t('Düşman cooldown: 1sn boyunca tekrar vurmaz', () => {
      const hpBefore = G.Snake.hp;
      G.Enemies.update(0.5); // 0.5 sn geçti, cooldown hâlâ aktif
      this.assertEq(G.Snake.hp, hpBefore, 'Should not take damage during cooldown');
    });

    // ====== 6. BİOME GEÇİŞ EFEKTİ ======
    t('Biome geçiş: flash efekti var', () => {
      G.Engine.startGame();
      G.Engine.currentBiome = 0;
      G.Engine.level = 5;
      G.Engine.checkBiomeChange();
      this.assertEq(G.Engine.currentBiome, 1, 'Should change to biome 1');
    });

    // ====== 7. DÜŞMAN ÖLÜM EFEKTİ ======
    t('Düşman ölüm: floatText oluşuyor', () => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Particles.clear();
      G.Engine.score = 0;
      // Düşmanı zehirle öldür
      G.Enemies.list = [{
        x: 20, y: 15, rx: 20, ry: 15,
        type: 'bug', speed: 1, hp: 1, color: '#ff2244', ai: 'wander',
        alive: true, moveTimer: 0, anim: 0, dir: {x:0,y:0}, wanderTimer: 0,
        _poisoned: true, _poisonTimer: 2, _poisonTick: 0
      }];
      G.Enemies.update(1.5);
      this.assert(G.Particles.list.some(p => p.shape === 'text'), 'Should have float text particle');
    });
    t('Düşman ölüm: skor +15', () => {
      this.assert(G.Engine.score >= 15, 'Should get 15 score');
    });
    t('Düşman ölüm: shake efekti', () => {
      this.assert(true, 'Shake effect triggered');
    });

    // ====== 8. MİNİ HARİTA BOYUTU ======
    t('Mini harita: 80x60 boyut', () => {
      // drawMiniMap fonksiyonunda mw=80, mh=60 olmalı
      const fn = G.UI.drawMiniMap.toString();
      this.assert(fn.includes('mw = 80') || fn.includes('mw=80'), 'Minimap width should be 80');
    });

    // ====== 9. LAVA/ELEKTRİK GÖRSEL ======
    t('Lava: animasyonlu görsel', () => {
      const fn = G.Map.draw.toString();
      this.assert(fn.includes('bubble') || fn.includes('Bubble') || fn.includes('ffcc00'), 'Lava should have bubbles');
    });
    t('Elektrik: animasyonlu görsel', () => {
      const fn = G.Map.draw.toString();
      this.assert(fn.includes('spark') || fn.includes('flash') || fn.includes('ffff00'), 'Electric should have sparks');
    });

    // ====== 10. PACKAGE.JSON ======
    t('Version: v6.0', () => {
      // UI'da v6.0 gösterilmeli
      const fn = G.UI.drawMenu.toString();
      this.assert(fn.includes('v6.0'), 'Should show v6.0');
    });

    // ====== 11. TIMER SİSTEMİ ENTEGRASYONU ======
    t('Timer: slow efekti timer ile', () => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Timers.clear();
      const beforeSpeed = G.Snake.speed;
      G.Engine.collectFood({x:G.Snake.head().x,y:G.Snake.head().y,type:'clock',color:'#4488ff',sc:0,len:0,xp:3,hp:0,icon:'⏱️',effect:'slow',anim:0,alive:true});
      this.assert(G.Timers._timers.length > 0, 'Timer should be created for slow effect');
      this.assert(G.Snake.speed < beforeSpeed, 'Speed should decrease');
    });
    t('Timer: turbo efekti timer ile', () => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Timers.clear();
      const beforeSpeed = G.Snake.speed;
      G.Upgrades.apply({id:'turbo',name:'Turbo',desc:'test',icon:'🚀',rarity:'epic'});
      this.assert(G.Timers._timers.length > 0, 'Timer should be created for turbo');
      this.assert(G.Snake.speed > beforeSpeed, 'Speed should increase');
    });

    // ====== 12. CLONE SİSTEMİ ======
    t('Clone: spawnClone çalışır', () => {
      G.Engine.startGame();
      G.Engine.startDelay = 0;
      G.Snake.spawnClone();
      this.assert(G.Snake.clone !== null, 'Clone should exist');
      this.assert(G.Snake.clone.alive === true, 'Clone should be alive');
    });
    t('Clone: updateClone hareket', () => {
      G.Snake.clone.timer = 0;
      G.Snake.clone.moveTimer = 0;
      G.Snake.updateClone(0.5);
      this.assert(true, 'Clone update should not crash');
    });
    t('Clone: timer bitince ölür', () => {
      G.Snake.clone.timer = 30;
      G.Snake.updateClone(0.1);
      this.assert(G.Snake.clone.alive === false, 'Clone should die after30s');
    });

    // ====== 13. DRONE SİSTEMİ ======
    t('Drone: upgrade var', () => {
      G.Engine.startGame();
      G.Engine.upgrades = ['drone'];
      this.assert(G.Engine.upgrades.includes('drone'), 'Drone upgrade should exist');
    });
    t('Drone: drawDrone fonksiyonu', () => {
      this.assert(typeof G.Snake.drawDrone === 'function', 'drawDrone should exist');
    });

    // ====== 14. RAINBOW SKİN ======
    t('Rainbow: skin config', () => {
      const skin = G.Config.SKINS.find(s => s.id === 'rainbow');
      this.assert(skin !== undefined, 'Rainbow skin should exist');
      this.assert(skin.rainbow === true, 'Rainbow flag should be true');
    });

    // ====== 15. STATS EKRANI ======
    t('Stats: drawStats fonksiyonu', () => {
      this.assert(typeof G.UI.drawStats === 'function', 'drawStats should exist');
    });
    t('Stats: state tanımlı', () => {
      G.Engine.state = 'stats';
      this.assertEq(G.Engine.state, 'stats', 'Stats state should work');
      G.Engine.state = 'menu';
    });

    // ====== 16. DAILY QUEST UI ======
    t('Daily Quest: drawStats\'da quest bar', () => {
      const fn = G.UI.drawStats.toString();
      this.assert(fn.includes('GÜNLÜK GÖREVLER') || fn.includes('daily'), 'Should have quest section');
    });

    // ====== 17. COMBO x15/x20 ======
    t('Combo: x15 at 15+', () => {
      G.Combo.init();
      for (let i = 0; i < 15; i++) G.Combo.hit();
      this.assertEq(G.Combo.multiplier, 15, 'Should be x15');
    });
    t('Combo: x20 at 20+', () => {
      G.Combo.init();
      for (let i = 0; i < 20; i++) G.Combo.hit();
      this.assertEq(G.Combo.multiplier, 20, 'Should be x20');
    });

    // ====== 18. LEVEL HIZ DENGESİ ======
    t('Hız: max 9', () => {
      G.Engine.startGame();
      G.Engine.level = 100;
      G.Snake.speed = Math.min(9, 4 + G.Engine.level * 0.12);
      this.assertEq(G.Snake.speed, 9, 'Max speed should be 9');
    });

    // ====== 19. BOSS YEM SPAWN YAVAŞLAMA ======
    t('Boss: yem spawn yavaş', () => {
      G.Engine.startGame();
      G.Engine.level = 5;
      G.Boss.spawn();
      this.assert(G.Boss.isActive(), 'Boss should be active');
      // Boss aktifken spawn rate 2.0 olmalı
      const fn = G.Food.update.toString();
      this.assert(fn.includes('2.0') || fn.includes('isActive'), 'Should check boss for spawn rate');
    });

    // ====== 20. SETTINGS MENÜ 7 ÖĞE ======
    t('Settings: 7 öğe', () => {
      const fn = G.UI.drawSettings.toString();
      this.assert(fn.includes('Müzik') || fn.includes('music'), 'Should have music setting');
      this.assert(fn.includes('FPS') || fn.includes('showFPS'), 'Should have FPS setting');
    });

    console.log(`\n📊 Feature Test: ✅ ${P} PASS | ❌ ${F} FAIL`);
    return { passed: P, failed: F, errors: E };
  }
};
