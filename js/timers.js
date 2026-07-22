// ============================================================
// timers.js — Game Loop Tabanlı Timer Sistemi
// ============================================================
window.G = window.G || {};

G.Timers = {
  _timers: [],
  _idCounter: 0,

  // Timer oluştur (setTimeout yerine)
  add(callback, delayMs, repeating) {
    const id = ++this._idCounter;
    this._timers.push({
      id,
      callback,
      delay: delayMs / 1000,
      elapsed: 0,
      repeating: !!repeating,
      active: true
    });
    return id;
  },

  // Timer iptal
  cancel(id) {
    const idx = this._timers.findIndex(t => t.id === id);
    if (idx >= 0) this._timers.splice(idx, 1);
  },

  // Tüm timerları sıfırla
  clear() {
    this._timers = [];
  },

  // Game loop'dan çağrılır
  update(dt) {
    for (let i = this._timers.length - 1; i >= 0; i--) {
      const t = this._timers[i];
      if (!t.active) continue;
      t.elapsed += dt;
      if (t.elapsed >= t.delay) {
        t.elapsed -= t.delay;
        try { t.callback(); } catch(e) { console.warn('Timer callback error:', e); }
        if (!t.repeating) {
          this._timers.splice(i, 1);
        }
      }
    }
  }
};
