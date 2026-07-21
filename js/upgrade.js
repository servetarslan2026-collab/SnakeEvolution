// ============================================================
// upgrade.js — Yükseltme Sistemi
// ============================================================
window.G = window.G || {};

G.Upgrade = {
  _activeUpgrades: [],

  init() {
    this._activeUpgrades = [];
  },

  /**
   * Rastgele 3 upgrade seç (rarity ağırlıklı)
   */
  getChoices(count = 3) {
    const C = G.Config;
    const allUpgrades = [...C.UPGRADES];
    const choices = [];
    const usedIds = new Set();

    for (let i = 0; i < count && allUpgrades.length > 0; i++) {
      // Rarity'ye göre filtrele
      const available = allUpgrades.filter(u => !usedIds.has(u.id));
      if (available.length === 0) break;

      // Rarity ağırlığı
      const weights = available.map(u => C.RARITY_WEIGHTS[u.rarity] || 10);
      const choice = G.Utils.randomWeighted(available, weights);
      choices.push(choice);
      usedIds.add(choice.id);
    }

    return choices;
  },

  /**
   * Upgrade uygula
   */
  apply(upgrade) {
    this._activeUpgrades.push(upgrade.id);

    // Oyuncuya uygula
    if (G.Player && upgrade.apply) {
      G.Player.applyModifier(upgrade.apply);
    }

    // Ses
    G.Audio.play('upgrade');

    // Efekt
    G.Effects.levelUp();
  },

  /**
   * Belirli bir upgrade'in kaç kez alındığını say
   */
  getCount(upgradeId) {
    return this._activeUpgrades.filter(id => id === upgradeId).length;
  },

  /**
   * Tüm aktif upgrade'ler
   */
  getActive() {
    return [...this._activeUpgrades];
  },

  clear() {
    this._activeUpgrades = [];
  }
};
