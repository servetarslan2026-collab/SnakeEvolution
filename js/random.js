// ============================================================
// random.js — Seed-Based Rastgele Sayı Üreteci (Mulberry32)
// ============================================================
window.G = window.G || {};

G.Random = {
  _seed: Date.now(),
  _state: 0,

  /**
   * Seed ayarla
   */
  seed(s) {
    this._seed = s;
    this._state = s;
  },

  /**
   * 0-1 arası rastgele sayı
   */
  next() {
    // Mulberry32
    let t = this._state += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },

  /**
   * Aralıkta rastgele
   */
  range(min, max) {
    return min + this.next() * (max - min);
  },

  /**
   * Tamsayı aralıkta
   */
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  },

  /**
   * Diziden rastgele seç
   */
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  },

  /**
   * Ağırlıklı seçim
   */
  weighted(items, weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
};
