// ============================================================
// effects.js — Ekran Efektleri (Shake, Flash, Vignette, SlowMo)
// ============================================================
window.G = window.G || {};

G.Effects = {
  _shake: { intensity: 0, duration: 0, timer: 0, offsetX: 0, offsetY: 0 },
  _flash: { color: '#ffffff', alpha: 0, duration: 0, timer: 0 },
  _vignette: { alpha: 0, targetAlpha: 0, speed: 2 },
  _slowMo: { factor: 1, duration: 0, timer: 0 },
  _zoom: { scale: 1, targetScale: 1, speed: 3, x: 0, y: 0 },
  _chromatic: { offset: 0, duration: 0, timer: 0 },

  /**
   * Ekran sarsıntısı
   */
  shake(intensity, duration) {
    if (!G.Save.get('settings.screenShake')) return;
    this._shake.intensity = intensity;
    this._shake.duration = duration;
    this._shake.timer = duration;
  },

  /**
   * Renk flaşı
   */
  flash(color, duration) {
    this._flash.color = color;
    this._flash.alpha = 1;
    this._flash.duration = duration;
    this._flash.timer = duration;
  },

  /**
   * Vignette (köşe karartma)
   */
  setVignette(alpha, speed = 2) {
    this._vignette.targetAlpha = alpha;
    this._vignette.speed = speed;
  },

  /**
   * Slow motion
   */
  slowMo(factor, duration) {
    this._slowMo.factor = factor;
    this._slowMo.duration = duration;
    this._slowMo.timer = duration;
  },

  /**
   * Zoom
   */
  setZoom(scale, speed = 3) {
    this._zoom.targetScale = scale;
    this._zoom.speed = speed;
  },

  /**
   * Chromatic aberration
   */
  chromatic(offset, duration) {
    this._chromatic.offset = offset;
    this._chromatic.duration = duration;
    this._chromatic.timer = duration;
  },

  /**
   * Boss intro efekti
   */
  bossIntro() {
    this.flash('#ff0000', 0.3);
    this.shake(8, 0.5);
    this.setZoom(1.1, 2);
    this.chromatic(3, 0.5);
    setTimeout(() => this.setZoom(1, 2), 500);
  },

  /**
   * Level up efekti
   */
  levelUp() {
    this.flash('#ffaa00', 0.2);
    this.shake(3, 0.2);
    this.setZoom(1.05, 4);
    setTimeout(() => this.setZoom(1, 4), 200);
  },

  /**
   * Ölüm efekti
   */
  death() {
    this.flash('#ff0000', 0.5);
    this.shake(12, 0.5);
    this.chromatic(5, 0.5);
  },

  /**
   * Combo efekti
   */
  combo(level) {
    const intensity = Math.min(level * 0.5, 5);
    this.shake(intensity, 0.15);
  },

  /**
   * Güncelle
   */
  update(dt) {
    // Shake
    if (this._shake.timer > 0) {
      this._shake.timer -= dt;
      const t = this._shake.timer / this._shake.duration;
      const intensity = this._shake.intensity * t;
      this._shake.offsetX = (Math.random() - 0.5) * intensity * 2;
      this._shake.offsetY = (Math.random() - 0.5) * intensity * 2;
    } else {
      this._shake.offsetX = 0;
      this._shake.offsetY = 0;
    }

    // Flash
    if (this._flash.timer > 0) {
      this._flash.timer -= dt;
      this._flash.alpha = this._flash.timer / this._flash.duration;
    } else {
      this._flash.alpha = 0;
    }

    // Vignette
    const vDiff = this._vignette.targetAlpha - this._vignette.alpha;
    this._vignette.alpha += vDiff * this._vignette.speed * dt;

    // SlowMo
    if (this._slowMo.timer > 0) {
      this._slowMo.timer -= dt;
      if (this._slowMo.timer <= 0) {
        this._slowMo.factor = 1;
      }
    }

    // Zoom
    const zDiff = this._zoom.targetScale - this._zoom.scale;
    this._zoom.scale += zDiff * this._zoom.speed * dt;

    // Chromatic
    if (this._chromatic.timer > 0) {
      this._chromatic.timer -= dt;
      if (this._chromatic.timer <= 0) {
        this._chromatic.offset = 0;
      }
    }
  },

  /**
   * SlowMo dt çarpanını al
   */
  getDtMult() {
    return this._slowMo.factor;
  },

  /**
   * Ekran efektlerini çiz (ana canvas üzerinde)
   */
  draw(ctx) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;

    // Shake transform
    ctx.save();
    ctx.translate(this._shake.offsetX, this._shake.offsetY);

    // Zoom
    if (Math.abs(this._zoom.scale - 1) > 0.001) {
      ctx.translate(W / 2, H / 2);
      ctx.scale(this._zoom.scale, this._zoom.scale);
      ctx.translate(-W / 2, -H / 2);
    }

    // Flash
    if (this._flash.alpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = this._flash.alpha;
      ctx.fillStyle = this._flash.color;
      ctx.fillRect(-20, -20, W + 40, H + 40);
      ctx.restore();
    }

    // Vignette
    if (this._vignette.alpha > 0.01) {
      ctx.save();
      const gradient = ctx.createRadialGradient(
        W / 2, H / 2, W * 0.3,
        W / 2, H / 2, W * 0.7
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${this._vignette.alpha})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // Chromatic aberration (basitleştirilmiş — renk offset)
    if (this._chromatic.offset > 0.5) {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(this._chromatic.offset, 0, W, H);
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(-this._chromatic.offset, 0, W, H);
      ctx.restore();
    }

    ctx.restore();
  },

  /**
   * Shake offset değerlerini al (çizim öncesi transform için)
   */
  getShakeOffset() {
    return { x: this._shake.offsetX, y: this._shake.offsetY };
  }
};
