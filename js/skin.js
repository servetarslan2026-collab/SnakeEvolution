// ============================================================
// skin.js — Skin Sistemi
// ============================================================
window.G = window.G || {};

G.Skin = {
  /**
   * Skin verisi al
   */
  getSkin(id) {
    return G.Config.SKINS.find(s => s.id === id) || G.Config.SKINS[0];
  },

  /**
   * Skin kilidi açık mı?
   */
  isUnlocked(id) {
    return G.Save.has('unlocks.skins', id);
  },

  /**
   * Skin kilidini aç
   */
  unlock(id) {
    G.Save.push('unlocks.skins', id);
  },

  /**
   * Skin giy
   */
  equip(id) {
    if (this.isUnlocked(id)) {
      G.Save.set('equippedSkin', id);
      return true;
    }
    return false;
  },

  /**
   * Giyili skin
   */
  getEquipped() {
    return G.Save.get('equippedSkin') || 'default';
  },

  /**
   * Tüm skin'lerin durumunu al
   */
  getAll() {
    return G.Config.SKINS.map(skin => ({
      ...skin,
      unlocked: this.isUnlocked(skin.id),
      equipped: this.getEquipped() === skin.id
    }));
  },

  /**
   * Skin kilidi açılabilir mi? Kontrol et
   */
  checkUnlocks() {
    const newlyUnlocked = [];
    for (const skin of G.Config.SKINS) {
      if (this.isUnlocked(skin.id)) continue;
      if (!skin.unlock) continue;

      let unlockable = false;
      switch (skin.unlock.type) {
        case 'coins':
          unlockable = G.Save.get('progress.coins') >= skin.unlock.amount;
          break;
        case 'gems':
          unlockable = G.Save.get('progress.gems') >= skin.unlock.amount;
          break;
        case 'achievement':
          unlockable = G.Save.has('achievements', skin.unlock.id);
          break;
        case 'biome':
          unlockable = G.Save.has('unlocks.biomes', skin.unlock.id);
          break;
      }

      if (unlockable) {
        this.unlock(skin.id);
        newlyUnlocked.push(skin);
      }
    }
    return newlyUnlocked;
  }
};
