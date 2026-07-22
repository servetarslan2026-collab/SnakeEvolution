// ============================================================
// animation.js — AAA+ Animasyon Sistemi (Easing + Tweening)
// ============================================================
window.G = window.G || {};

G.Animation = {
  tweens: [],

  // ============ EASING FONKSİYONLARI ============
  easing: {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => t * (2 - t),
    easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeOutBounce: t => {
      if (t < 1 / 2.75) return 7.5625 * t * t;
      if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    },
    easeOutElastic: t => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
    },
    easeOutBack: t => {
      const s = 1.70158;
      return (t -= 1) * t * ((s + 1) * t + s) + 1;
    }
  },

  // ============ TWEEN OLUŞTUR ============
  tween(target, prop, from, to, duration, easing, onComplete) {
    const tw = {
      target,
      prop,
      from,
      to,
      duration,
      elapsed: 0,
      easing: easing || this.easing.easeOut,
      onComplete
    };
    this.tweens.push(tw);
    return tw;
  },

  // ============ GÜNCELLEME ============
  update(dt) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.elapsed += dt;
      const t = Math.min(1, tw.elapsed / tw.duration);
      const eased = tw.easing(t);
      tw.target[tw.prop] = tw.from + (tw.to - tw.from) * eased;

      if (t >= 1) {
        tw.target[tw.prop] = tw.to;
        if (tw.onComplete) tw.onComplete();
        this.tweens.splice(i, 1);
      }
    }
  },

  // ============ YARDIMCI FONKSİYONLAR ============

  // Değeri yumuşak şekilde hedefe taşı
  lerpTo(target, prop, to, duration, easing) {
    return this.tween(target, prop, target[prop], to, duration, easing);
  },

  // Titreşim efekti
  shake(target, prop, intensity, duration) {
    const orig = target[prop];
    const tw = {
      target,
      prop,
      from: orig - intensity,
      to: orig + intensity,
      duration,
      elapsed: 0,
      easing: t => Math.sin(t * Math.PI * 6) * (1 - t),
      onComplete: () => { target[prop] = orig; }
    };
    this.tweens.push(tw);
    return tw;
  },

  // Scale bounce efekti
  bounce(target, prop, duration) {
    return this.tween(target, prop, 1.3, 1, duration, this.easing.easeOutBounce);
  },

  // Fade in
  fadeIn(target, duration) {
    return this.tween(target, 'alpha', 0, 1, duration, this.easing.easeOut);
  },

  // Fade out
  fadeOut(target, duration) {
    return this.tween(target, 'alpha', 1, 0, duration, this.easing.easeIn);
  },

  // Tüm tween'leri temizle
  clear() {
    this.tweens = [];
  }
};
