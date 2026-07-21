// ============================================================
// audio.js — Ses Sistemi
// ============================================================
window.G = window.G || {};

G.Audio = {
  ctx: null,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Audio init failed:', e);
    }
  },

  playTone(freq, duration, type) {
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime((G.Save.data.settings.sound || 0.7) * 0.15, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  },

  // Farklı ses türleri
  playEat() { this.playTone(440 + Math.random() * 220, 0.1, 'sine'); },
  playHit() { this.playTone(200 + Math.random() * 100, 0.15, 'square'); },
  playCoin() { this.playTone(800 + Math.random() * 400, 0.08, 'triangle'); },
  playLevelUp() {
    this.playTone(523, 0.1, 'sine');
    setTimeout(() => this.playTone(659, 0.1, 'sine'), 100);
    setTimeout(() => this.playTone(784, 0.15, 'sine'), 200);
  },
  playDeath() {
    this.playTone(400, 0.3, 'sawtooth');
    setTimeout(() => this.playTone(200, 0.4, 'sawtooth'), 150);
  }
};
