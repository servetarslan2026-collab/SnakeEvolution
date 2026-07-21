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
    const recentUpgrades = G.Engine.upgrades.slice(-5); // Son 5 upgrade

    for (let i = 0; i < count; i++) {
      let best = null;
      let bestW = 0;
      let attempts = 0;
      
      for (const u of all) {
        if (used.has(u.id)) continue;
        let w = rw[u.rarity] || 10;
        
        // Son alınan upgrade'lerin ağırlığını azalt
        if (recentUpgrades.includes(u.id)) {
          w = Math.max(1, w * 0.3); // %70 azalt
        }
        
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
      case 'score2x': break;
      case 'xp2x': break;
      case 'magnet': break;
      case 'secondLife': S.secondLifeUsed = false; break;
      case 'regen': break; // Handled in snake update
      case 'fireTail': break; // Visual effect
      case 'iceTail': break; // Visual effect
      case 'poisonTail': break; // Visual effect
      case 'elecTail': break; // Visual effect
      case 'thickTail': break; // Visual effect
      case 'chainTail': break; // Visual effect
      case 'explodingTail': break; // Visual effect
      case 'golden': break; // Handled in collectFood
      case 'heartFind': break; // Handled in collectFood
      case 'luckyDrop': break; // Handled in collectFood
      case 'critical': break; // Handled in collectFood
      case 'ghost': S.activateInvincible(5); E.notify('👻 Ghost Mode!', '#aaaaff'); break;
      case 'teleport': {
        const pos = G.Map.getRandomEmpty();
        S.segments = [{ x: pos.x, y: pos.y }];
        S.renderPos = [{ x: pos.x, y: pos.y }];
        E.notify('🌀 Teleport!', '#aa00ff');
        break;
      }
      case 'autoCollect': break; // Handled in food update
      case 'phase': S.activateInvincible(3); E.notify('✨ Phase Shift!', '#aa44ff'); break;
      case 'momentum': break; // Handled in snake update
      case 'blastGuard': break; // Handled in takeDamage
      case 'foodBoom': break; // Handled in collectFood
      case 'drone': break; // Visual effect
      case 'turbo': S.speed *= 1.5; setTimeout(() => { S.speed /= 1.5; }, 3000); E.notify('🚀 Turbo!', '#ffaa00'); break;
      case 'clone': break; // Visual effect
      case 'timeFreeze': {
        // Freeze all enemies for 5 seconds
        for (const e of G.Enemies.list) {
          e.speed = 0;
          setTimeout(() => { e.speed = G.Config.ENEMY_TYPES.find(t => t.type === e.type)?.speed || 1; }, 5000);
        }
        E.notify('⏸️ Time Freeze!', '#ffffff');
        break;
      }
      case 'chainCombo': G.Combo.timer += 1; break;
      case 'lucky': break; // Handled in random functions
      case 'vortex': break; // Handled in food update
      default: break;
    }

    G.Stats.onUpgrade();
  }
};
