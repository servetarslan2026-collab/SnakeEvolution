// ============================================================
// combo.js — Combo Sistemi
// ============================================================
window.G = window.G || {};

G.Combo = {
  count: 0,
  timer: 0,
  multiplier: 1,

  init() {
    this.count = 0;
    this.timer = 0;
    this.multiplier = 1;
  },

  hit() {
    this.count++;
    this.timer = 2.5;
    if (this.count >= 12) this.multiplier = 10;
    else if (this.count >= 8) this.multiplier = 5;
    else if (this.count >= 5) this.multiplier = 3;
    else if (this.count >= 3) this.multiplier = 2;
    else this.multiplier = 1;
  },

  getMultiplier() {
    return this.multiplier;
  },

  update(dt) {
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.count = 0;
        this.multiplier = 1;
      }
    }
  }
};
