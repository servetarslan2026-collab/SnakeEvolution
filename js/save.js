// ============================================================
// save.js — Kayıt Sistemi
// ============================================================
window.G = window.G || {};

G.Save = {
  KEY: 'snake_evo_save',
  data: null,

  defaults() {
    return {
      version: 1,
      coins: 0,
      highScore: 0,
      totalGames: 0,
      totalFood: 0,
      totalTime: 0,
      totalCoins: 0,
      maxCombo: 0,
      bossKills: 0,
      longestTime: 0,
      maxLevel: 0,
      biomesVisited: 1,
      achievements: [],
      unlockedSkins: ['default'],
      equippedSkin: 'default',
      settings: { sound: 0.7, music: 0.5, shake: true, glow: true, particles: true },
      dailyQuests: {
        date: '',
        food: 0,
        games: 0,
        score: 0,
        completed: []
      }
    };
  },

  load() {
    try {
      const d = localStorage.getItem(this.KEY);
      if (d) {
        this.data = JSON.parse(d);
        // Merge missing fields
        const def = this.defaults();
        for (const k in def) {
          if (!(k in this.data)) this.data[k] = def[k];
          else if (typeof def[k] === 'object' && !Array.isArray(def[k])) {
            for (const kk in def[k]) {
              if (!(kk in this.data[k])) this.data[k][kk] = def[k][kk];
            }
          }
        }
      } else {
        this.data = this.defaults();
      }
    } catch (e) {
      this.data = this.defaults();
    }
  },

  write() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (e) {}
  },

  autoSave() {
    this.write();
  },

  addCoins(amount) {
    this.data.coins += amount;
    this.data.totalCoins += amount;
    this.write();
  },

  reset() {
    localStorage.removeItem(this.KEY);
    location.reload();
  }
};
