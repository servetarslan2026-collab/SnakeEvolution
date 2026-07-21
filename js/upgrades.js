// ============================================================
// upgrades.js — Yükseltme Sistemi
// ============================================================
window.G = window.G || {};

G.Upgrades = {
  pick(count) {
    const all = G.Config.ALL_UPGRADES;
    const rw = G.Config.RARITY_W;
    const result = [];
    const used = new Set();

    for (let i = 0; i < count; i++) {
      let best = null;
      let bestW = 0;
      for (const u of all) {
        if (used.has(u.id)) continue;
        const w = rw[u.rarity] || 10;
        if (Math.random() * w > bestW) {
          best = u;
          bestW = w;
        }
      }
      if (best) {
        result.push(best);
        used.add(best.id);
      }
    }
    return result;
  },

  apply(u) {
    const S = G.Snake;
    const E = G.Engine;

    switch (u.id) {
      case 'speed': S.speed *= 1.2; break;
      case 'hp': S.maxHp++; S.hp++; break;
      case 'heal': S.hp = S.maxHp; break;
      case 'longTail': S.grow(3); break;
      case 'shield': S.invTimer = 3; break;
      case 'armor': S.invTimer = 2; break;
      case 'dash': E.notify('💨 Dash: SPACE', '#00ffcc'); break;
      case 'score2x': break; // Handled in collectFood
      case 'xp2x': break; // Handled in collectFood
      case 'magnet': break; // Handled in food.update
      case 'secondLife': S.secondLifeUsed = false; break;
      default: break;
    }

    G.Stats.onUpgrade();
  }
};
