// ============================================================
// utils.js — Yardımcı Fonksiyonlar
// ============================================================
window.G = window.G || {};

G.Utils = {
  // --- Matematik ---
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  roundToPixel(x) {
    return Math.floor(x);
  },

  // --- Easing Fonksiyonları ---
  easeLinear(t) {
    return t;
  },

  easeInQuad(t) {
    return t * t;
  },

  easeOutQuad(t) {
    return t * (2 - t);
  },

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },

  easeInBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },

  // --- Rastgele ---
  randomRange(min, max) {
    return min + Math.random() * (max - min);
  },

  randomInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  },

  randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  randomWeighted(items, weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  },

  // --- Renk ---
  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  },

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(c => {
      const hex = Math.round(G.Utils.clamp(c, 0, 255)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  hslToString(h, s, l, a = 1) {
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  },

  colorLerp(c1, c2, t) {
    const rgb1 = G.Utils.hexToRgb(c1);
    const rgb2 = G.Utils.hexToRgb(c2);
    return G.Utils.rgbToHex(
      G.Utils.lerp(rgb1.r, rgb2.r, t),
      G.Utils.lerp(rgb1.g, rgb2.g, t),
      G.Utils.lerp(rgb1.b, rgb2.b, t)
    );
  },

  colorWithAlpha(hex, alpha) {
    const { r, g, b } = G.Utils.hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  },

  // --- Format ---
  formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  },

  formatNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  // --- Genel ---
  throttle(fn, ms) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        return fn.apply(this, args);
      }
    };
  },

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  uuid() {
    return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
      ((Math.random() * 16) | 0).toString(16)
    );
  },

  // Nested obje okuma: get(obj, "progress.coins")
  getNested(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  },

  // Nested obje yazma: set(obj, "progress.coins", 100)
  setNested(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => {
      if (!o[k] || typeof o[k] !== 'object') o[k] = {};
      return o[k];
    }, obj);
    target[last] = value;
  },

  // Nested obje artış: add(obj, "progress.coins", 5)
  addNested(obj, path, amount) {
    const current = G.Utils.getNested(obj, path) || 0;
    G.Utils.setNested(obj, path, current + amount);
  }
};
