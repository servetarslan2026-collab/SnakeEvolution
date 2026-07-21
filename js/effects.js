// ============================================================
// effects.js — Ekran Efektleri
// ============================================================
window.G = window.G || {};

G.Effects = {
  shakeX: 0, shakeY: 0, shakeTimer: 0,
  flashColor: null, flashTimer: 0,

  reset() {
    this.shakeX = 0; this.shakeY = 0; this.shakeTimer = 0;
    this.flashColor = null; this.flashTimer = 0;
  },

  shake(intensity, duration) {
    this.shakeX = intensity;
    this.shakeY = intensity;
    this.shakeTimer = duration;
  },

  flash(color, duration) {
    this.flashColor = color;
    this.flashTimer = duration;
  },

  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const t = this.shakeTimer;
      this.shakeX = (Math.random() - 0.5) * this.shakeX * 2 * t;
      this.shakeY = (Math.random() - 0.5) * this.shakeY * 2 * t;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
    if (this.flashTimer > 0) this.flashTimer -= dt;
  },

  getShake() {
    return { x: this.shakeX, y: this.shakeY };
  },

  drawFlash(ctx) {
    if (this.flashTimer > 0 && this.flashColor) {
      ctx.globalAlpha = this.flashTimer;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(-20, -20, G.Engine.W + 40, G.Engine.H + 40);
      ctx.globalAlpha = 1;
    }
  }
};
