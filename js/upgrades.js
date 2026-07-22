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
      case 'armor': S._armorTimer = 10; E.notify('🔰 Zırh aktif! (10 sn)', '#0088ff'); break;
      case 'dash': E.notify('💨 Dash: SPACE', '#00ffcc'); break;
      case 'score2x': break; // collectFood'da kontrol
      case 'xp2x': break; // collectFood'da kontrol
      case 'magnet': break; // food.update'de kontrol
      case 'secondLife': S.secondLifeUsed = false; break;
      case 'regen': S._regenTimer = 0; E.notify('💚 Yenilenme aktif!', '#44ff88'); break;
      case 'fireTail': E.notify('🔥 Ateş Kuyruk aktif!', '#ff4400'); break;
      case 'iceTail': E.notify('❄️ Buz Kuyruk aktif!', '#00ccff'); break;
      case 'poisonTail': E.notify('☠️ Zehir Kuyruk aktif!', '#44ff00'); break;
      case 'elecTail': E.notify('⚡ Elektrik Kuyruk aktif!', '#ffe14d'); break;
      case 'thickTail': E.notify('📐 Kalın Kuyruk!', '#ffffff'); break;
      case 'chainTail': E.notify('⛓️ Zincir Kuyruk aktif!', '#ccccff'); break;
      case 'explodingTail': E.notify('💥 Patlayan Kuyruk aktif!', '#ff6600'); break;
      case 'golden': break; // collectFood'da kontrol
      case 'heartFind': break; // collectFood'da kontrol
      case 'luckyDrop': break; // collectFood'da kontrol
      case 'critical': break; // collectFood'da kontrol
      case 'ghost': S.activateInvincible(5); E.notify('👻 Ghost Mode! (5 sn)', '#aaaaff'); break;
      case 'teleport': {
        const pos = G.Map.getRandomEmpty();
        S.segments = [{ x: pos.x, y: pos.y }];
        S.renderPos = [{ x: pos.x, y: pos.y }];
        E.notify('🌀 Teleport!', '#aa00ff');
        break;
      }
      case 'autoCollect': E.notify('🧲 Otomatik toplama!', '#00ffcc'); break;
      case 'phase': S.activateInvincible(3); E.notify('✨ Phase Shift! (3 sn)', '#aa44ff'); break;
      case 'momentum': S._momentumTimer = 0; E.notify('⚡ Momentum aktif!', '#ffaa00'); break;
      case 'blastGuard': E.notify('💥 Patlama Kalkanı!', '#ff6600'); break;
      case 'foodBoom': E.notify('💣 Yem Patlaması!', '#ff6600'); break;
      case 'drone': E.notify('🤖 Mini Drone!', '#4488ff'); break;
      case 'turbo': S.speed *= 1.5; setTimeout(() => { if (S.alive && E.state === 'play') S.speed /= 1.5; }, 3000); E.notify('🚀 Turbo! (3 sn)', '#ffaa00'); break;
      case 'clone': S.spawnClone(); break;
      case 'timeFreeze': {
        // Freeze all enemies for 5 seconds
        for (const e of G.Enemies.list) {
          if (!e.alive) continue;
          e._origSpeed = e.speed;
          e.speed = 0;
          e._stunTimer = 5;
        }
        E.notify('⏸️ Time Freeze! (5 sn)', '#ffffff');
        break;
      }
      case 'chainCombo': G.Combo.timer += 1; break;
      case 'lucky': break; // Rastgele fonksiyonlarda kontrol
      case 'vortex': E.notify('🌀 Vortex aktif!', '#aa00ff'); break;
      default: break;
    }

    G.Stats.onUpgrade();
  }
};
