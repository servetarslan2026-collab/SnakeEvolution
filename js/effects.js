// ============================================================
// effects.js — AAA+ Ekran Efektleri
// ============================================================
window.G = window.G || {};

G.Effects = {
  shakeX: 0, shakeY: 0, shakeTimer: 0, shakeIntensity: 0,
  flashColor: null, flashTimer: 0, flashDuration: 0,
  vignetteIntensity: 0,
  hitStopTimer: 0,
  chromaOffset: 0,

  reset() {
    this.shakeX = 0; this.shakeY = 0; this.shakeTimer = 0; this.shakeIntensity = 0;
    this.flashColor = null; this.flashTimer = 0; this.flashDuration = 0;
    this.vignetteIntensity = 0;
    this.hitStopTimer = 0;
    this.chromaOffset = 0;
  },

  // ============ SHAKE ============
  shake(intensity, duration) {
    if (!G.Save.data.settings.shake) return;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  },

  // ============ FLASH ============
  flash(color, duration) {
    this.flashColor = color;
    this.flashTimer = duration;
    this.flashDuration = duration;
  },

  // ============ HIT STOP (duraksama efekti) ============
  hitStop(duration) {
    this.hitStopTimer = duration;
  },

  // ============ VIGNETTE PULSE ============
  vignettePulse(intensity) {
    this.vignetteIntensity = intensity;
  },

  // ============ UPDATE ============
  update(dt) {
    // Hit stop
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return; // Hit stop sırasında diğer efektler güncellenmez
    }

    // Shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const t = this.shakeTimer;
      const decay = t * this.shakeIntensity;
      this.shakeX = (Math.random() - 0.5) * decay * 2;
      this.shakeY = (Math.random() - 0.5) * decay * 2;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeIntensity = 0;
    }

    // Flash
    if (this.flashTimer > 0) this.flashTimer -= dt;

    // Vignette decay
    if (this.vignetteIntensity > 0) this.vignetteIntensity *= 0.95;
    if (this.vignetteIntensity < 0.01) this.vignetteIntensity = 0;

    // Chromatic aberration decay
    if (this.chromaOffset > 0) this.chromaOffset *= 0.9;
    if (this.chromaOffset < 0.1) this.chromaOffset = 0;
  },

  getShake() {
    return { x: this.shakeX, y: this.shakeY };
  },

  // ============ ÇİZİM ============

  // Flash overlay
  drawFlash(ctx) {
    if (!G.Save.data.settings.shake) {
      this.shakeX = 0;
      this.shakeY = 0;
    }
    if (this.flashTimer > 0 && this.flashColor) {
      const a = Math.min(1, this.flashTimer / this.flashDuration * 0.5);
      ctx.globalAlpha = a;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(-20, -20, G.Engine.W + 40, G.Engine.H + 40);
      ctx.globalAlpha = 1;
    }
  },

  // Vignette efekti
  drawVignette(ctx) {
    const w = G.Engine.W;
    const h = G.Engine.H;
    const baseIntensity = 0.4;
    const intensity = baseIntensity + this.vignetteIntensity;

    const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${intensity})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  },

  // Scanline efekti
  drawScanlines(ctx) {
    const w = G.Engine.W;
    const h = G.Engine.H;
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }
  },

  // Sinematik barlar
  drawCinematicBars(ctx) {
    const w = G.Engine.W;
    const h = G.Engine.H;

    const tg = ctx.createLinearGradient(0, 0, 0, 25);
    tg.addColorStop(0, 'rgba(0,0,0,0.35)');
    tg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tg;
    ctx.fillRect(0, 0, w, 25);

    const bg = ctx.createLinearGradient(0, h - 25, 0, h);
    bg.addColorStop(0, 'rgba(0,0,0,0)');
    bg.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, h - 25, w, 25);
  },

  // Chromatic aberration (hafif renk kayması)
  drawChromaticAberration(ctx) {
    if (this.chromaOffset < 0.5) return;
    // Bu efekt canvas'ta doğrudan uygulanamaz, ama renk overlay ile simüle edilebilir
    const offset = this.chromaOffset;
    ctx.globalAlpha = offset * 0.1;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(offset, 0, G.Engine.W, G.Engine.H);
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(-offset, 0, G.Engine.W, G.Engine.H);
    ctx.globalAlpha = 1;
  },

  // Tüm post-processing
  drawPostProcessing(ctx) {
    this.drawVignette(ctx);
    this.drawScanlines(ctx);
    this.drawCinematicBars(ctx);
    this.drawChromaticAberration(ctx);
  }
};
