// ============================================================
// input.js — Giriş Yönetimi (Klavye + Dokunmatik)
// ============================================================
window.G = window.G || {};

G.Input = {
  _keys: {},
  _keysOnce: {},
  _direction: { x: 0, y: -1 }, // Başlangıç: yukarı
  _nextDirection: { x: 0, y: -1 },
  _touchStart: null,
  _enabled: true,
  _canvas: null,

  /**
   * Giriş sistemini başlat
   */
  init(canvas) {
    this._canvas = canvas;

    // Klavye
    window.addEventListener('keydown', (e) => {
      if (!this._enabled) return;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','Escape','KeyW','KeyA','KeyS','KeyD','Digit1','Digit2','Digit3'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this._keys[e.code]) {
        this._keysOnce[e.code] = true;
      }
      this._keys[e.code] = true;

      // Yön tuşları → nextDirection
      this._handleDirection(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this._keys[e.code] = false;
    });

    // Dokunmatik
    canvas.addEventListener('touchstart', (e) => {
      if (!this._enabled) return;
      e.preventDefault();
      const touch = e.touches[0];
      this._touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      if (!this._enabled || !this._touchStart) return;
      e.preventDefault();
      const touch = e.changedTouches[0];
      const dx = touch.clientX - this._touchStart.x;
      const dy = touch.clientY - this._touchStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const elapsed = Date.now() - this._touchStart.time;

      if (dist < 10 && elapsed < 300) {
        // Tap → Enter/Select
        this._keysOnce['Enter'] = true;
        this._keys['Enter'] = true;
        setTimeout(() => { this._keys['Enter'] = false; }, 100);
      } else if (dist > 30) {
        // Swipe → yön
        if (Math.abs(dx) > Math.abs(dy)) {
          this._setDirection(dx > 0 ? 1 : -1, 0);
        } else {
          this._setDirection(0, dy > 0 ? 1 : -1);
        }
      }
      this._touchStart = null;
    }, { passive: false });
  },

  _handleDirection(code) {
    switch (code) {
      case 'ArrowUp':    case 'KeyW': this._setDirection(0, -1); break;
      case 'ArrowDown':  case 'KeyS': this._setDirection(0, 1);  break;
      case 'ArrowLeft':  case 'KeyA': this._setDirection(-1, 0); break;
      case 'ArrowRight': case 'KeyD': this._setDirection(1, 0);  break;
    }
  },

  _setDirection(x, y) {
    // 180 derece dönüş engelle
    const cur = this._direction;
    if (cur.x === -x && cur.y === -y) return;
    if (x === 0 && y === 0) return;
    this._nextDirection = { x, y };
  },

  /**
   * Mevcut yön (son hareket yönü)
   */
  getDirection() {
    return this._direction;
  },

  /**
   * Sıradaki yön (input'tan gelen)
   */
  getNextDirection() {
    return this._nextDirection;
  },

  /**
   * Yeni yönü uygula (oyuncu hareket ettiğinde çağrılır)
   */
  applyDirection() {
    this._direction = { ...this._nextDirection };
  },

  /**
   * Tuş basılı mı
   */
  isPressed(code) {
    return !!this._keys[code];
  },

  /**
   * Tek seferlik basış (bir kere okunur, sonra sıfırlanır)
   */
  isPressedOnce(code) {
    if (this._keysOnce[code]) {
      this._keysOnce[code] = false;
      return true;
    }
    return false;
  },

  /**
   * Tüm one-shot'ları temizle (frame sonunda çağrılır)
   */
  clearOnce() {
    this._keysOnce = {};
  },

  /**
   * Yön sıfırla (yeni oyun başlarken)
   */
  resetDirection() {
    this._direction = { x: 0, y: -1 };
    this._nextDirection = { x: 0, y: -1 };
  },

  /**
   * Giriş aç/kapa
   */
  enable() { this._enabled = true; },
  disable() { this._enabled = false; }
};
