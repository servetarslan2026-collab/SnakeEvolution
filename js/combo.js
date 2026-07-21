// ============================================================
// combo.js — Combo Sistemi
// ============================================================
window.G = window.G || {};

G.Combo = {
  _count: 0,
  _timer: 0,
  _multiplier: 1,
  _maxCombo: 0,
  _displayTimer: 0,

  init() {
    this._count = 0;
    this._timer = 0;
    this._multiplier = 1;
    this._maxCombo = 0;
    this._displayTimer = 0;
  },

  /**
   * Yem yendiğinde çağrılır
   */
  hit() {
    this._count++;
    this._timer = G.Config.COMBO_WINDOW + (G.Player ? G.Player.getModifiers().comboWindow : 0);
    this._displayTimer = 0.5;

    // Çarpan hesapla
    const mults = G.Config.COMBO_MULTIPLIERS;
    this._multiplier = 1;
    for (const m of mults) {
      if (this._count >= m.threshold) {
        this._multiplier = m.mult;
      }
    }

    // Max combo
    if (this._count > this._maxCombo) {
      this._maxCombo = this._count;
    }

    // Görsel feedback
    if (this._multiplier > 1) {
      G.Effects.combo(this._count);
      G.Audio.play('combo', { comboLevel: this._count });

      if (this._count >= 20) {
        G.Particles.rainbowBurst(G.Config.CANVAS_WIDTH / 2, G.Config.CANVAS_HEIGHT / 2, 30);
      } else if (this._count >= 8) {
        G.Particles.ring(G.Config.CANVAS_WIDTH / 2, 50, '#ffaa00', 60);
      }
    }

    // Başarım kontrolü
    if (G.Stats) {
      G.Stats.onCombo(this._count);
    }
  },

  /**
   * Güncelle
   */
  update(dt) {
    if (this._timer > 0) {
      this._timer -= dt;
      if (this._timer <= 0) {
        this.reset();
      }
    }
    if (this._displayTimer > 0) {
      this._displayTimer -= dt;
    }
  },

  /**
   * Sıfırla
   */
  reset() {
    this._count = 0;
    this._timer = 0;
    this._multiplier = 1;
  },

  /**
   * Combo çarpanını al
   */
  getMultiplier() {
    return this._multiplier;
  },

  getCount() { return this._count; },
  getMaxCombo() { return this._maxCombo; },
  isActive() { return this._count > 0; },
  getDisplayTimer() { return this._displayTimer; }
};
