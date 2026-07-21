// ============================================================
// save.js — LocalStorage Kayıt Sistemi
// ============================================================
window.G = window.G || {};

G.Save = {
  STORAGE_KEY: 'snake_evolution_save',
  _data: null,

  // Varsayılan veri yapısı
  _defaults() {
    return {
      version: 1,
      settings: {
        soundVolume: 0.7,
        musicVolume: 0.5,
        screenShake: true,
        glow: true,
        particles: true,
        showFPS: false,
        fullscreen: false,
        colorBlind: false
      },
      progress: {
        coins: 0,
        xp: 0,
        level: 1,
        gems: 0
      },
      unlocks: {
        skins: ['default'],
        upgrades: [],
        biomes: ['neon_city']
      },
      stats: {
        highScore: 0,
        totalGames: 0,
        totalTime: 0,
        totalFood: 0,
        totalBossKills: 0,
        totalDeaths: 0,
        longestCombo: 0,
        longestSurvival: 0,
        totalCoins: 0,
        totalXp: 0
      },
      achievements: [],
      dailyQuests: {
        date: '',
        progress: { food: 0, levels: 0, bosses: 0, games: 0 },
        completed: []
      },
      equippedSkin: 'default'
    };
  },

  /**
   * İlk çalıştırmada varsayılan veri oluştur, mevcut kaydı yükle
   */
  init() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        this._data = JSON.parse(raw);
        // Eksik alanları tamamla
        const defaults = this._defaults();
        this._merge(defaults, this._data);
        this._data = defaults;
      } else {
        this._data = this._defaults();
        this._save();
      }
    } catch (e) {
      console.warn('Save load failed, using defaults:', e);
      this._data = this._defaults();
      this._save();
    }
  },

  /**
   * Eksik alanları tamamlar (mevcut veriyi silmeden)
   */
  _merge(defaults, data) {
    for (const key in defaults) {
      if (!(key in data)) {
        data[key] = defaults[key];
      } else if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null) {
        this._merge(defaults[key], data[key]);
      }
    }
  },

  /**
   * LocalStorage'a yaz
   */
  _save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._data));
    } catch (e) {
      console.error('Save failed:', e);
    }
  },

  /**
   * Nested path ile oku: G.Save.get("progress.coins")
   */
  get(path) {
    return G.Utils.getNested(this._data, path);
  },

  /**
   * Nested path ile yaz: G.Save.set("progress.coins", 100)
   */
  set(path, value) {
    G.Utils.setNested(this._data, path, value);
    this._save();
  },

  /**
   * Sayısal artış: G.Save.add("progress.coins", 5)
   */
  add(path, amount) {
    G.Utils.addNested(this._data, path, amount);
    this._save();
  },

  /**
   * Diziye ekle (tekrar yoksa): G.Save.push("unlocks.skins", "dragon")
   */
  push(path, item) {
    const arr = G.Utils.getNested(this._data, path);
    if (Array.isArray(arr) && !arr.includes(item)) {
      arr.push(item);
      this._save();
    }
  },

  /**
   * Dizide var mı: G.Save.has("achievements", "first_blood")
   */
  has(path, value) {
    const arr = G.Utils.getNested(this._data, path);
    return Array.isArray(arr) && arr.includes(value);
  },

  /**
   * Tüm kaydı sıfırla
   */
  reset() {
    this._data = this._defaults();
    this._save();
  },

  /**
   * JSON dışa aktar
   */
  export() {
    return JSON.stringify(this._data, null, 2);
  },

  /**
   * JSON içe aktar
   */
  import(json) {
    try {
      const data = JSON.parse(json);
      if (data && data.version) {
        this._data = data;
        const defaults = this._defaults();
        this._merge(defaults, this._data);
        this._save();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   * Her oyun sonunda otomatik kaydet
   */
  autoSave() {
    this._save();
  }
};
