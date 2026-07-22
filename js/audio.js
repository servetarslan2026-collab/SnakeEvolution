// ============================================================
// audio.js — Ses ve Müzik Sistemi
// ============================================================
window.G = window.G || {};

G.Audio = {
  ctx: null,
  musicGain: null,
  musicPlaying: false,
  musicOsc: null,
  musicOsc2: null,
  musicInterval: null,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Müzik gain node
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0;
      this.musicGain.connect(this.ctx.destination);
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
  },

  // ============ MÜZİK SİSTEMİ ============
  startMusic() {
    if (!this.ctx || this.musicPlaying) return;
    // Audio context'i resume et (browser politikası)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.musicPlaying = true;

    const vol = (G.Save.data.settings.music || 0.5) * 0.08;
    this.musicGain.gain.setValueAtTime(vol, this.ctx.currentTime);

    // Ambient bass line
    const notes = [65.41, 73.42, 82.41, 98.00, 82.41, 73.42]; // C2, D2, E2, G2, E2, D2
    let noteIdx = 0;

    const playNote = () => {
      if (!this.musicPlaying || !this.ctx) return;
      try {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = notes[noteIdx % notes.length];
        g.gain.setValueAtTime(vol * 0.6, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        o.connect(g);
        g.connect(this.musicGain);
        o.start();
        o.stop(this.ctx.currentTime + 0.8);
        noteIdx++;
      } catch(e) {}
    };

    // Ambient pad
    const playPad = () => {
      if (!this.musicPlaying || !this.ctx) return;
      try {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 130.81; // C3
        g.gain.setValueAtTime(vol * 0.3, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
        o.connect(g);
        g.connect(this.musicGain);
        o.start();
        o.stop(this.ctx.currentTime + 2);
      } catch(e) {}
    };

    this.musicInterval = setInterval(() => {
      playNote();
      if (noteIdx % 3 === 0) playPad();
    }, 500);
  },

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicGain && this.ctx) {
      try {
        this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch(e) {}
    }
  },

  setMusicVolume(vol) {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(vol * 0.08, this.ctx.currentTime);
    }
  },

  // Yem türüne özel ses
  playFoodSound(type) {
    switch(type) {
      case 'golden': this.playTone(880, 0.12, 'sine'); this.playTone(1100, 0.1, 'sine'); break;
      case 'crystal': this.playTone(1200, 0.15, 'sine'); break;
      case 'heart': this.playTone(523, 0.1, 'sine'); this.playTone(659, 0.1, 'sine'); break;
      case 'bomb': this.playTone(100, 0.3, 'sawtooth'); break;
      case 'coin': this.playTone(1000, 0.08, 'triangle'); break;
      case 'star': this.playTone(1500, 0.2, 'sine'); break;
      default: this.playEat(); break;
    }
  }
};
