// ============================================================
// audio.js — Profesyonel Ses Sistemi (Web Audio API)
// ============================================================
window.G = window.G || {};

G.Audio = {
  _ctx: null,
  _masterGain: null,
  _sfxGain: null,
  _musicGain: null,
  _reverbNode: null,
  _initialized: false,
  _musicLayers: {},
  _currentMusic: null,

  /**
   * AudioContext başlat (user interaction sonrası çağrılmalı)
   */
  init() {
    if (this._initialized) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.connect(this._ctx.destination);

      this._sfxGain = this._ctx.createGain();
      this._sfxGain.connect(this._masterGain);
      this._sfxGain.gain.value = G.Save.get('settings.soundVolume') || 0.7;

      this._musicGain = this._ctx.createGain();
      this._musicGain.connect(this._masterGain);
      this._musicGain.gain.value = G.Save.get('settings.musicVolume') || 0.5;

      // Master reverb
      this._reverbNode = this._createReverb(0.2, 0.5);

      this._initialized = true;
    } catch (e) {
      console.warn('Audio init failed:', e);
    }
  },

  /**
   * AudioContext'i resume et (autoplay policy)
   */
  resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  },

  /**
   * Volume ayarla
   */
  setVolume(type, value) {
    if (!this._initialized) return;
    if (type === 'sfx') {
      this._sfxGain.gain.value = value;
      G.Save.set('settings.soundVolume', value);
    } else if (type === 'music') {
      this._musicGain.gain.value = value;
      G.Save.set('settings.musicVolume', value);
    }
  },

  // --- Yardımcı Fonksiyonlar ---

  _createOsc(type, freq, duration) {
    const osc = this._ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.start(this._ctx.currentTime);
    osc.stop(this._ctx.currentTime + duration + 0.5);
    return osc;
  },

  _createGain(volume, envelope = {}) {
    const gain = this._ctx.createGain();
    const now = this._ctx.currentTime;
    const attack = envelope.attack || 0.005;
    const decay = envelope.decay || 0.1;
    const sustain = envelope.sustain !== undefined ? envelope.sustain : 0;
    const release = envelope.release || 0.05;
    const duration = envelope.duration || (attack + decay + release);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    return gain;
  },

  _createNoise(duration) {
    const bufferSize = this._ctx.sampleRate * duration;
    const buffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this._ctx.createBufferSource();
    source.buffer = buffer;
    source.start(this._ctx.currentTime);
    source.stop(this._ctx.currentTime + duration);
    return source;
  },

  _createReverb(decay, mix) {
    // Basit convolution reverb yerine feedback delay
    const delay = this._ctx.createDelay();
    delay.delayTime.value = decay;
    const feedback = this._ctx.createGain();
    feedback.gain.value = mix * 0.5;
    const filter = this._ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    delay.connect(filter);
    filter.connect(feedback);
    feedback.connect(delay);
    return delay;
  },

  _createFilter(type, freq, Q) {
    const filter = this._ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = Q || 1;
    return filter;
  },

  _connectChain(nodes) {
    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].connect(nodes[i + 1]);
    }
  },

  _addVariation(pitch, volume, pan) {
    return {
      pitch: (pitch || 1) + (Math.random() - 0.5) * 0.1,
      volume: (volume || 1) + (Math.random() - 0.5) * 0.1,
      pan: (pan || 0) + (Math.random() - 0.5) * 0.2
    };
  },

  // --- SESLER ---

  /**
   * Genel ses çalma
   */
  play(name, opts = {}) {
    if (!this._initialized) return;
    this.resume();
    const v = this._addVariation(opts.pitch, opts.volume, opts.pan);
    try {
      switch (name) {
        case 'eat':          this._playEat(v); break;
        case 'eat_gold':     this._playEatGold(v); break;
        case 'eat_crystal':  this._playEatCrystal(v); break;
        case 'eat_heart':    this._playEatHeart(v); break;
        case 'eat_bomb':     this._playEatBomb(v); break;
        case 'eat_poison':   this._playEatPoison(v); break;
        case 'eat_coin':     this._playEatCoin(v); break;
        case 'eat_star':     this._playEatStar(v); break;
        case 'eat_lucky':    this._playEatLucky(v); break;
        case 'eat_magnet':   this._playEatMagnet(v); break;
        case 'eat_clock':    this._playEatClock(v); break;
        case 'level_up':     this._playLevelUp(v); break;
        case 'combo':        this._playCombo(v, opts.comboLevel || 1); break;
        case 'dash':         this._playDash(v); break;
        case 'hit':          this._playHit(v); break;
        case 'die':          this._playDie(v); break;
        case 'boss_intro':   this._playBossIntro(v); break;
        case 'boss_hit':     this._playBossHit(v); break;
        case 'boss_die':     this._playBossDie(v); break;
        case 'button':       this._playButton(v); break;
        case 'shield':       this._playShield(v); break;
        case 'game_over':    this._playGameOver(v); break;
        case 'victory':      this._playVictory(v); break;
        case 'upgrade':      this._playUpgrade(v); break;
      }
    } catch (e) {
      // Sessizce geç
    }
  },

  _playEat(v) {
    const now = this._ctx.currentTime;
    // Katman 1: Ana ton
    const osc1 = this._createOsc('sine', 440 * v.pitch, 0.15);
    osc1.frequency.exponentialRampToValueAtTime(880 * v.pitch, now + 0.08);
    const g1 = this._createGain(0.3 * v.volume, { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05, duration: 0.15 });
    // Katman 2: Harmonik
    const osc2 = this._createOsc('triangle', 660 * v.pitch, 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1320 * v.pitch, now + 0.06);
    const g2 = this._createGain(0.15 * v.volume, { attack: 0.005, decay: 0.06, sustain: 0, release: 0.04, duration: 0.12 });
    // Katman 3: Noise click
    const noise = this._createNoise(0.02);
    const g3 = this._createGain(0.1 * v.volume, { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01, duration: 0.02 });

    this._connectChain([osc1, g1, this._sfxGain]);
    this._connectChain([osc2, g2, this._sfxGain]);
    this._connectChain([noise, g3, this._sfxGain]);
  },

  _playEatGold(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('sine', 523 * v.pitch, 0.2);
    osc1.frequency.exponentialRampToValueAtTime(1046 * v.pitch, now + 0.12);
    const g1 = this._createGain(0.35 * v.volume, { attack: 0.005, decay: 0.15, sustain: 0, release: 0.08, duration: 0.2 });
    const osc2 = this._createOsc('triangle', 784 * v.pitch, 0.18);
    osc2.frequency.exponentialRampToValueAtTime(1568 * v.pitch, now + 0.10);
    const g2 = this._createGain(0.2 * v.volume, { attack: 0.005, decay: 0.12, sustain: 0, release: 0.06, duration: 0.18 });
    // Zil efekti
    const osc3 = this._createOsc('sine', 1046 * v.pitch, 0.25);
    const g3 = this._createGain(0.1 * v.volume, { attack: 0.01, decay: 0.20, sustain: 0, release: 0.10, duration: 0.25 });
    const noise = this._createNoise(0.03);
    const g4 = this._createGain(0.1 * v.volume, { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01, duration: 0.03 });

    this._connectChain([osc1, g1, this._sfxGain]);
    this._connectChain([osc2, g2, this._sfxGain]);
    this._connectChain([osc3, g3, this._reverbNode, this._sfxGain]);
    this._connectChain([noise, g4, this._sfxGain]);
  },

  _playEatCrystal(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('sine', 800 * v.pitch, 0.25);
    osc1.frequency.exponentialRampToValueAtTime(1600 * v.pitch, now + 0.15);
    const g1 = this._createGain(0.3 * v.volume, { attack: 0.01, decay: 0.18, sustain: 0, release: 0.10, duration: 0.25 });
    const osc2 = this._createOsc('sine', 1200 * v.pitch, 0.30);
    const g2 = this._createGain(0.15 * v.volume, { attack: 0.02, decay: 0.22, sustain: 0, release: 0.12, duration: 0.30 });
    const osc3 = this._createOsc('triangle', 600 * v.pitch, 0.20);
    const g3 = this._createGain(0.1 * v.volume, { attack: 0.01, decay: 0.15, sustain: 0, release: 0.08, duration: 0.20 });

    this._connectChain([osc1, g1, this._reverbNode, this._sfxGain]);
    this._connectChain([osc2, g2, this._sfxGain]);
    this._connectChain([osc3, g3, this._sfxGain]);
  },

  _playEatHeart(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('sine', 330 * v.pitch, 0.20);
    osc1.frequency.exponentialRampToValueAtTime(660 * v.pitch, now + 0.15);
    const g1 = this._createGain(0.3 * v.volume, { attack: 0.02, decay: 0.15, sustain: 0.1, release: 0.15, duration: 0.25 });
    const osc2 = this._createOsc('sine', 440 * v.pitch, 0.25);
    const g2 = this._createGain(0.15 * v.volume, { attack: 0.02, decay: 0.18, sustain: 0.1, release: 0.15, duration: 0.25 });
    const filter = this._createFilter('lowpass', 2000, 1);

    this._connectChain([osc1, g1, filter, this._sfxGain]);
    this._connectChain([osc2, g2, this._sfxGain]);
  },

  _playEatBomb(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('sawtooth', 200 * v.pitch, 0.30);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.20);
    const g1 = this._createGain(0.4 * v.volume, { attack: 0.001, decay: 0.20, sustain: 0, release: 0.15, duration: 0.30 });
    const noise = this._createNoise(0.20);
    const g2 = this._createGain(0.3 * v.volume, { attack: 0.001, decay: 0.15, sustain: 0, release: 0.10, duration: 0.20 });
    const osc2 = this._createOsc('sine', 60, 0.35);
    const g3 = this._createGain(0.25 * v.volume, { attack: 0.005, decay: 0.25, sustain: 0, release: 0.15, duration: 0.35 });
    const distortion = this._ctx.createWaveShaper();

    this._connectChain([osc1, g1, distortion, this._sfxGain]);
    this._connectChain([noise, g2, this._sfxGain]);
    this._connectChain([osc2, g3, this._sfxGain]);
  },

  _playEatPoison(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('square', 150 * v.pitch, 0.18);
    osc1.frequency.exponentialRampToValueAtTime(80 * v.pitch, now + 0.12);
    const g1 = this._createGain(0.2 * v.volume, { attack: 0.005, decay: 0.12, sustain: 0, release: 0.08, duration: 0.18 });
    const osc2 = this._createOsc('sawtooth', 200 * v.pitch, 0.15);
    osc2.frequency.exponentialRampToValueAtTime(100 * v.pitch, now + 0.10);
    const g2 = this._createGain(0.15 * v.volume, { attack: 0.005, decay: 0.10, sustain: 0, release: 0.06, duration: 0.15 });
    const filter = this._createFilter('bandpass', 300, 2);

    this._connectChain([osc1, g1, filter, this._sfxGain]);
    this._connectChain([osc2, g2, this._sfxGain]);
  },

  _playEatCoin(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('sine', 1200 * v.pitch, 0.12);
    osc1.frequency.exponentialRampToValueAtTime(1800 * v.pitch, now + 0.08);
    const g1 = this._createGain(0.25 * v.volume, { attack: 0.001, decay: 0.08, sustain: 0, release: 0.04, duration: 0.12 });
    const osc2 = this._createOsc('triangle', 1600 * v.pitch, 0.10);
    const g2 = this._createGain(0.15 * v.volume, { attack: 0.001, decay: 0.06, sustain: 0, release: 0.03, duration: 0.10 });

    this._connectChain([osc1, g1, this._sfxGain]);
    this._connectChain([osc2, g2, this._sfxGain]);
  },

  _playEatStar(v) {
    const now = this._ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const freq = 600 + i * 200;
      const osc = this._createOsc('sine', freq * v.pitch, 0.30 - i * 0.05);
      const g = this._createGain(0.15 * v.volume, { attack: 0.01, decay: 0.20, sustain: 0, release: 0.10, duration: 0.30 });
      this._connectChain([osc, g, this._sfxGain]);
    }
  },

  _playEatLucky(v) {
    const now = this._ctx.currentTime;
    // Gökkuşağı arpej
    const freqs = [523, 659, 784, 1046, 1319];
    freqs.forEach((f, i) => {
      const osc = this._createOsc('sine', f * v.pitch, 0.40);
      const g = this._createGain(0.12 * v.volume, { attack: i * 0.04, decay: 0.20, sustain: 0, release: 0.15, duration: 0.40 });
      this._connectChain([osc, g, this._reverbNode, this._sfxGain]);
    });
  },

  _playEatMagnet(v) {
    const now = this._ctx.currentTime;
    const osc = this._createOsc('sine', 300 * v.pitch, 0.30);
    osc.frequency.exponentialRampToValueAtTime(600 * v.pitch, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(200 * v.pitch, now + 0.30);
    const g = this._createGain(0.25 * v.volume, { attack: 0.01, decay: 0.20, sustain: 0.2, release: 0.10, duration: 0.30 });
    this._connectChain([osc, g, this._sfxGain]);
  },

  _playEatClock(v) {
    const now = this._ctx.currentTime;
    // Tik-tak efekti
    for (let i = 0; i < 3; i++) {
      const osc = this._createOsc('sine', 800 * v.pitch, 0.05);
      const g = this._createGain(0.2 * v.volume, { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02, duration: 0.05 });
      g.gain.setValueAtTime(0, now + i * 0.1);
      g.gain.linearRampToValueAtTime(0.2 * v.volume, now + i * 0.1 + 0.005);
      g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.05);
      this._connectChain([osc, g, this._sfxGain]);
    }
  },

  _playLevelUp(v) {
    const now = this._ctx.currentTime;
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      const osc = this._createOsc('sine', f * v.pitch, 0.50);
      const g = this._createGain(0.25 * v.volume, { attack: 0.01 + i * 0.08, decay: 0.30, sustain: 0.2, release: 0.20, duration: 0.50 });
      g.gain.setValueAtTime(0, now + i * 0.08);
      g.gain.linearRampToValueAtTime(0.25 * v.volume, now + i * 0.08 + 0.01);
      this._connectChain([osc, g, this._reverbNode, this._sfxGain]);
    });
    // Zil
    const bell = this._createOsc('sine', 2092 * v.pitch, 0.60);
    const bg = this._createGain(0.08 * v.volume, { attack: 0.02, decay: 0.40, sustain: 0.1, release: 0.30, duration: 0.60 });
    this._connectChain([bell, bg, this._reverbNode, this._sfxGain]);
  },

  _playCombo(v, level) {
    const now = this._ctx.currentTime;
    const freq = 440 + level * 80;
    const osc1 = this._createOsc('triangle', freq * v.pitch, 0.12);
    const g1 = this._createGain(0.3 * v.volume, { attack: 0.001, decay: 0.08, sustain: 0, release: 0.04, duration: 0.12 });
    const osc2 = this._createOsc('sine', freq * 2 * v.pitch, 0.10);
    const g2 = this._createGain(0.12 * v.volume, { attack: 0.001, decay: 0.06, sustain: 0, release: 0.03, duration: 0.10 });

    this._connectChain([osc1, g1, this._sfxGain]);
    this._connectChain([osc2, g2, this._sfxGain]);
  },

  _playDash(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('sawtooth', 200 * v.pitch, 0.15);
    osc1.frequency.exponentialRampToValueAtTime(600 * v.pitch, now + 0.10);
    const g1 = this._createGain(0.25 * v.volume, { attack: 0.001, decay: 0.10, sustain: 0, release: 0.05, duration: 0.15 });
    const noise = this._createNoise(0.08);
    const g2 = this._createGain(0.15 * v.volume, { attack: 0.001, decay: 0.06, sustain: 0, release: 0.03, duration: 0.08 });

    this._connectChain([osc1, g1, this._sfxGain]);
    this._connectChain([noise, g2, this._sfxGain]);
  },

  _playHit(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('square', 200 * v.pitch, 0.18);
    osc1.frequency.exponentialRampToValueAtTime(80 * v.pitch, now + 0.12);
    const g1 = this._createGain(0.35 * v.volume, { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08, duration: 0.18 });
    const noise = this._createNoise(0.08);
    const g2 = this._createGain(0.2 * v.volume, { attack: 0.001, decay: 0.06, sustain: 0, release: 0.03, duration: 0.08 });
    const osc2 = this._createOsc('sine', 100, 0.20);
    const g3 = this._createGain(0.2 * v.volume, { attack: 0.001, decay: 0.15, sustain: 0, release: 0.10, duration: 0.20 });

    this._connectChain([osc1, g1, this._sfxGain]);
    this._connectChain([noise, g2, this._sfxGain]);
    this._connectChain([osc2, g3, this._sfxGain]);
  },

  _playDie(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('sawtooth', 400 * v.pitch, 0.60);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.50);
    const g1 = this._createGain(0.4 * v.volume, { attack: 0.001, decay: 0.50, sustain: 0, release: 0.30, duration: 0.60 });
    const osc2 = this._createOsc('square', 300 * v.pitch, 0.50);
    osc2.frequency.exponentialRampToValueAtTime(30, now + 0.45);
    const g2 = this._createGain(0.25 * v.volume, { attack: 0.001, decay: 0.45, sustain: 0, release: 0.25, duration: 0.50 });
    const noise = this._createNoise(0.35);
    const g3 = this._createGain(0.2 * v.volume, { attack: 0.001, decay: 0.30, sustain: 0, release: 0.15, duration: 0.35 });
    const osc3 = this._createOsc('sine', 80, 0.70);
    const g4 = this._createGain(0.3 * v.volume, { attack: 0.01, decay: 0.50, sustain: 0, release: 0.30, duration: 0.70 });

    this._connectChain([osc1, g1, this._sfxGain]);
    this._connectChain([osc2, g2, this._sfxGain]);
    this._connectChain([noise, g3, this._sfxGain]);
    this._connectChain([osc3, g4, this._sfxGain]);
  },

  _playBossIntro(v) {
    const now = this._ctx.currentTime;
    // Rumble
    const noise = this._createNoise(1.0);
    const filter = this._createFilter('lowpass', 200, 1);
    const g1 = this._createGain(0.3 * v.volume, { attack: 0.10, decay: 0.80, sustain: 0.3, release: 0.50, duration: 1.0 });
    // Yükseliş
    const osc1 = this._createOsc('sawtooth', 60, 0.80);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 0.60);
    const g2 = this._createGain(0.25 * v.volume, { attack: 0.05, decay: 0.60, sustain: 0.2, release: 0.30, duration: 0.80 });
    // Sub drone
    const osc2 = this._createOsc('sine', 80, 1.20);
    const g3 = this._createGain(0.2 * v.volume, { attack: 0.10, decay: 0.80, sustain: 0.3, release: 0.50, duration: 1.20 });
    // Ritmik vuruş
    const osc3 = this._createOsc('square', 150, 0.60);
    const g4 = this._createGain(0.15 * v.volume, { attack: 0.001, decay: 0.10, sustain: 0, release: 0.05, duration: 0.60 });

    this._connectChain([noise, filter, g1, this._sfxGain]);
    this._connectChain([osc1, g2, this._sfxGain]);
    this._connectChain([osc2, g3, this._sfxGain]);
    this._connectChain([osc3, g4, this._sfxGain]);
  },

  _playBossHit(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('square', 150 * v.pitch, 0.20);
    osc1.frequency.exponentialRampToValueAtTime(80 * v.pitch, now + 0.15);
    const g1 = this._createGain(0.35 * v.volume, { attack: 0.001, decay: 0.15, sustain: 0, release: 0.10, duration: 0.20 });
    const noise = this._createNoise(0.12);
    const g2 = this._createGain(0.2 * v.volume, { attack: 0.001, decay: 0.10, sustain: 0, release: 0.05, duration: 0.12 });
    const osc2 = this._createOsc('sine', 60, 0.25);
    const g3 = this._createGain(0.25 * v.volume, { attack: 0.005, decay: 0.18, sustain: 0, release: 0.10, duration: 0.25 });

    this._connectChain([osc1, g1, this._sfxGain]);
    this._connectChain([noise, g2, this._sfxGain]);
    this._connectChain([osc2, g3, this._sfxGain]);
  },

  _playBossDie(v) {
    const now = this._ctx.currentTime;
    // Yükseliş
    const osc1 = this._createOsc('sawtooth', 120, 0.50);
    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.40);
    const g1 = this._createGain(0.3 * v.volume, { attack: 0.01, decay: 0.40, sustain: 0, release: 0.20, duration: 0.50 });
    // Patlama
    const noise = this._createNoise(0.70);
    const g2 = this._createGain(0.35 * v.volume, { attack: 0.01, decay: 0.60, sustain: 0, release: 0.30, duration: 0.70 });
    // Sub sweep
    const osc2 = this._createOsc('sine', 60, 0.60);
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.50);
    const g3 = this._createGain(0.3 * v.volume, { attack: 0.01, decay: 0.50, sustain: 0, release: 0.25, duration: 0.60 });
    // Arpej
    [200, 300, 400, 500].forEach((f, i) => {
      const osc = this._createOsc('sine', f * v.pitch, 0.90);
      const g = this._createGain(0.1 * v.volume, { attack: 0.01 + i * 0.1, decay: 0.50, sustain: 0, release: 0.30, duration: 0.90 });
      this._connectChain([osc, g, this._reverbNode, this._sfxGain]);
    });

    this._connectChain([osc1, g1, this._sfxGain]);
    this._connectChain([noise, g2, this._sfxGain]);
    this._connectChain([osc2, g3, this._sfxGain]);
  },

  _playButton(v) {
    const now = this._ctx.currentTime;
    const osc = this._createOsc('sine', 1000 * v.pitch, 0.05);
    const g = this._createGain(0.15 * v.volume, { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02, duration: 0.05 });
    this._connectChain([osc, g, this._sfxGain]);
  },

  _playShield(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('triangle', 800 * v.pitch, 0.20);
    osc1.frequency.exponentialRampToValueAtTime(400 * v.pitch, now + 0.15);
    const g1 = this._createGain(0.3 * v.volume, { attack: 0.001, decay: 0.15, sustain: 0.1, release: 0.15, duration: 0.20 });
    const osc2 = this._createOsc('sine', 600 * v.pitch, 0.25);
    const g2 = this._createGain(0.15 * v.volume, { attack: 0.01, decay: 0.18, sustain: 0.1, release: 0.15, duration: 0.25 });
    const noise = this._createNoise(0.05);
    const g3 = this._createGain(0.1 * v.volume, { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02, duration: 0.05 });

    this._connectChain([osc1, g1, this._reverbNode, this._sfxGain]);
    this._connectChain([osc2, g2, this._sfxGain]);
    this._connectChain([noise, g3, this._sfxGain]);
  },

  _playGameOver(v) {
    const now = this._ctx.currentTime;
    const notes = [440, 349, 294, 220, 165, 110];
    notes.forEach((f, i) => {
      const osc = this._createOsc('sine', f * v.pitch, 1.20 - i * 0.1);
      const g = this._createGain(0.2 * v.volume, { attack: 0.02, decay: 0.80, sustain: 0.2, release: 0.50, duration: 1.20 });
      g.gain.setValueAtTime(0, now + i * 0.15);
      g.gain.linearRampToValueAtTime(0.2 * v.volume, now + i * 0.15 + 0.02);
      this._connectChain([osc, g, this._reverbNode, this._sfxGain]);
    });
  },

  _playVictory(v) {
    const now = this._ctx.currentTime;
    const notes = [523, 659, 784, 1046, 1319];
    notes.forEach((f, i) => {
      const osc = this._createOsc('sine', f * v.pitch, 0.90);
      const g = this._createGain(0.25 * v.volume, { attack: 0.01, decay: 0.60, sustain: 0.3, release: 0.40, duration: 0.90 });
      g.gain.setValueAtTime(0, now + i * 0.10);
      g.gain.linearRampToValueAtTime(0.25 * v.volume, now + i * 0.10 + 0.01);
      this._connectChain([osc, g, this._reverbNode, this._sfxGain]);
    });
  },

  _playUpgrade(v) {
    const now = this._ctx.currentTime;
    const osc1 = this._createOsc('sine', 600 * v.pitch, 0.25);
    osc1.frequency.exponentialRampToValueAtTime(900 * v.pitch, now + 0.20);
    const g1 = this._createGain(0.25 * v.volume, { attack: 0.01, decay: 0.18, sustain: 0.1, release: 0.15, duration: 0.25 });
    const osc2 = this._createOsc('triangle', 800 * v.pitch, 0.22);
    osc2.frequency.exponentialRampToValueAtTime(1200 * v.pitch, now + 0.18);
    const g2 = this._createGain(0.18 * v.volume, { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.12, duration: 0.22 });
    const osc3 = this._createOsc('sine', 1200 * v.pitch, 0.30);
    const g3 = this._createGain(0.1 * v.volume, { attack: 0.02, decay: 0.22, sustain: 0.1, release: 0.15, duration: 0.30 });

    this._connectChain([osc1, g1, this._reverbNode, this._sfxGain]);
    this._connectChain([osc2, g2, this._sfxGain]);
    this._connectChain([osc3, g3, this._sfxGain]);
  },

  // --- Background Music ---

  /**
   * Müzik başlat
   */
  startMusic(type) {
    if (!this._initialized) return;
    this.stopMusic();

    const now = this._ctx.currentTime;
    this._currentMusic = { type, layers: [], active: true };

    // Drone katmanı
    const drone = this._ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = type === 'boss' ? 60 : 40;
    const droneGain = this._ctx.createGain();
    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.08, now + 2);
    drone.connect(droneGain);
    droneGain.connect(this._musicGain);
    drone.start(now);
    this._currentMusic.layers.push({ osc: drone, gain: droneGain });

    // Arpej katmanı (sadece playing ve boss)
    if (type === 'playing' || type === 'boss') {
      const bpm = type === 'boss' ? 140 : 110;
      const interval = 60 / bpm;
      const notes = type === 'boss' ? [130, 165, 196, 165, 130, 110, 130, 165] : [130, 165, 196, 262, 196, 165, 130, 110];
      let noteIndex = 0;

      const arpejOsc = this._ctx.createOscillator();
      arpejOsc.type = 'triangle';
      arpejOsc.frequency.value = notes[0];
      const arpejGain = this._ctx.createGain();
      arpejGain.gain.setValueAtTime(0, now);
      arpejGain.gain.linearRampToValueAtTime(0.06, now + 1);

      const scheduleNote = () => {
        if (!this._currentMusic || !this._currentMusic.active) return;
        const t = this._ctx.currentTime;
        arpejOsc.frequency.setValueAtTime(notes[noteIndex % notes.length], t);
        arpejGain.gain.setValueAtTime(0.06, t);
        arpejGain.gain.linearRampToValueAtTime(0.02, t + interval * 0.8);
        noteIndex++;
        setTimeout(scheduleNote, interval * 1000);
      };

      arpejOsc.connect(arpejGain);
      arpejGain.connect(this._musicGain);
      arpejOsc.start(now);
      this._currentMusic.layers.push({ osc: arpejOsc, gain: arpejGain });
      setTimeout(scheduleNote, 1000);
    }

    // Atmosfer (noise + filter)
    const noiseLen = 4;
    const noiseBuffer = this._ctx.createBuffer(1, this._ctx.sampleRate * noiseLen, this._ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    const noiseSource = this._ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const noiseFilter = this._ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 400;
    noiseFilter.Q.value = 0.5;
    const noiseGain = this._ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.03, now + 3);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this._musicGain);
    noiseSource.start(now);
    this._currentMusic.layers.push({ osc: noiseSource, gain: noiseGain });
  },

  /**
   * Müzik durdur
   */
  stopMusic() {
    if (this._currentMusic) {
      const now = this._ctx.currentTime;
      this._currentMusic.active = false;
      this._currentMusic.layers.forEach(l => {
        try {
          l.gain.gain.linearRampToValueAtTime(0, now + 0.5);
          l.osc.stop(now + 0.6);
        } catch (e) {}
      });
      this._currentMusic = null;
    }
  }
};
