// ============================================================
// test-combos.js — Upgrade Kombinasyon Testleri
// ============================================================
window.G = window.G || {};

G.ComboTest = {
  assert(c, m) { if (!c) throw new Error(m); },

  runAll() {
    console.log('\n🔗 UPGRADE KOMBİNASYON TESTLERİ\n');
    let passed = 0, failed = 0;
    const errors = [];

    // Kritik upgrade çiftleri
    const criticalPairs = [
      // SecondLife + diğer upgrade'ler
      ['secondLife', 'hp', 'SecondLife + HP'],
      ['secondLife', 'heal', 'SecondLife + Heal'],
      ['secondLife', 'shield', 'SecondLife + Shield'],
      ['secondLife', 'armor', 'SecondLife + Armor'],

      // Hasar sistemi
      ['blastGuard', 'armor', 'BlastGuard + Armor'],
      ['blastGuard', 'shield', 'BlastGuard + Shield'],
      ['blastGuard', 'ghost', 'BlastGuard + Ghost'],

      // Hız sistemi
      ['speed', 'turbo', 'Speed + Turbo'],
      ['speed', 'momentum', 'Speed + Momentum'],
      ['turbo', 'momentum', 'Turbo + Momentum'],

      // Skor sistemi
      ['score2x', 'xp2x', 'Score2x + XP2x'],
      ['score2x', 'critical', 'Score2x + Critical'],
      ['score2x', 'golden', 'Score2x + Golden'],
      ['xp2x', 'lucky', 'XP2x + Lucky'],

      // Kuyruk sistemi
      ['fireTail', 'iceTail', 'FireTail + IceTail'],
      ['fireTail', 'poisonTail', 'FireTail + PoisonTail'],
      ['fireTail', 'elecTail', 'FireTail + ElecTail'],
      ['iceTail', 'poisonTail', 'IceTail + PoisonTail'],
      ['thickTail', 'fireTail', 'ThickTail + FireTail'],
      ['explodingTail', 'chainTail', 'ExplodingTail + ChainTail'],

      // Manyetik sistemi
      ['magnet', 'vortex', 'Magnet + Vortex'],
      ['magnet', 'foodBoom', 'Magnet + FoodBoom'],
      ['vortex', 'foodBoom', 'Vortex + FoodBoom'],
      ['magnet', 'autoCollect', 'Magnet + AutoCollect'],

      // Combo sistemi
      ['chainCombo', 'score2x', 'ChainCombo + Score2x'],
      ['chainCombo', 'critical', 'ChainCombo + Critical'],

      // Nadir + nadir
      ['timeFreeze', 'clone', 'TimeFreeze + Clone'],
      ['timeFreeze', 'secondLife', 'TimeFreeze + SecondLife'],
      ['clone', 'drone', 'Clone + Drone'],
      ['vortex', 'clone', 'Vortex + Clone'],

      // Sınır durumları
      ['hp', 'hp', 'Double HP upgrade'],
      ['speed', 'speed', 'Double Speed upgrade'],
      ['longTail', 'longTail', 'Double LongTail upgrade'],
    ];

    for (const [u1, u2, desc] of criticalPairs) {
      const test = () => {
        G.Engine.startGame();
        G.Engine.startDelay = 0;
        G.Snake.invTimer = 3;

        const up1 = G.Config.ALL_UPGRADES.find(u => u.id === u1);
        const up2 = G.Config.ALL_UPGRADES.find(u => u.id === u2);
        this.assert(up1, `Upgrade ${u1} should exist`);
        this.assert(up2, `Upgrade ${u2} should exist`);

        // Her iki upgrade'ı uygula
        G.Upgrades.apply(up1);
        G.Engine.upgrades.push(u1);
        G.Upgrades.apply(up2);
        G.Engine.upgrades.push(u2);

        // Temel kontroller
        this.assert(G.Snake.alive, `${desc}: Snake should be alive`);
        this.assert(G.Snake.speed > 0, `${desc}: Speed should be positive`);
        this.assert(G.Snake.hp > 0, `${desc}: HP should be positive`);
        this.assert(G.Snake.maxHp > 0, `${desc}: MaxHP should be positive`);
        this.assert(G.Snake.hp <= G.Snake.maxHp, `${desc}: HP should not exceed maxHP`);

        // 10 kare güncelle
        for (let i = 0; i < 10; i++) {
          G.Engine.loop(G.Engine.lastTime + 16);
        }
        this.assert(G.Snake.alive, `${desc}: Should survive 10 frames`);
      };

      try {
        test();
        passed++;
        console.log(`  ✅ ${desc}`);
      } catch(e) {
        failed++;
        errors.push({ combo: desc, error: e.message });
        console.log(`  ❌ ${desc}: ${e.message}`);
      }
    }

    // Triple kombinasyonlar
    const tripleCombos = [
      ['score2x', 'xp2x', 'critical', 'Score+XP+Critical'],
      ['magnet', 'vortex', 'foodBoom', 'Magnet+Vortex+FoodBoom'],
      ['fireTail', 'iceTail', 'poisonTail', 'Fire+Ice+Poison'],
      ['secondLife', 'armor', 'shield', 'SecondLife+Armor+Shield'],
      ['speed', 'turbo', 'momentum', 'Speed+Turbo+Momentum'],
    ];

    for (const [u1, u2, u3, desc] of tripleCombos) {
      const test = () => {
        G.Engine.startGame();
        G.Engine.startDelay = 0;
        G.Snake.invTimer = 3;

        for (const uid of [u1, u2, u3]) {
          const up = G.Config.ALL_UPGRADES.find(u => u.id === uid);
          this.assert(up, `Upgrade ${uid} should exist`);
          G.Upgrades.apply(up);
          G.Engine.upgrades.push(uid);
        }

        for (let i = 0; i < 10; i++) G.Engine.loop(G.Engine.lastTime + 16);
        this.assert(G.Snake.alive, `${desc}: Should survive with triple combo`);
      };

      try {
        test();
        passed++;
        console.log(`  ✅ ${desc}`);
      } catch(e) {
        failed++;
        errors.push({ combo: desc, error: e.message });
        console.log(`  ❌ ${desc}: ${e.message}`);
      }
    }

    console.log(`\n📊 Kombinasyon Test: ✅ ${passed} PASS | ❌ ${failed} FAIL`);
    return { passed, failed, errors };
  }
};
