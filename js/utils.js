// ============================================================
// utils.js — Yardımcı Fonksiyonlar
// ============================================================
window.G = window.G || {};

G.Utils = {
  rnd(a, b) { return a + Math.random() * (b - a); },
  rndInt(a, b) { return this.rnd(a, b + 1) | 0; },
  dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); },
  lerp(a, b, t) { return a + (b - a) * t; },
  clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
};
