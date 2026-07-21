// ============================================================
// renderer.js — Basit ve Güvenilir Render Pipeline
// ============================================================
window.G = window.G || {};

G.Renderer = {
  canvas: null,
  ctx: null,
  _dpr: 1,
  _bgDirty: true,
  _fpsCounter: 0,
  _fpsTime: 0,
  _fps: 0,

  /**
   * Tek canvas oluştur (basit ve güvenilir)
   */
  init(containerId) {
    this._dpr = window.devicePixelRatio || 1;
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;

    // Tek canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    this.canvas.width = W * this._dpr;
    this.canvas.height = H * this._dpr;
    this.canvas.style.width = W + 'px';
    this.canvas.style.height = H + 'px';
    this.canvas.style.display = 'block';

    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(this._dpr, this._dpr);

    const container = document.getElementById(containerId) || document.body;
    container.appendChild(this.canvas);

    // Responsive
    this._resize();
    window.addEventListener('resize', () => this._resize());

    return this.canvas;
  },

  _resize() {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;
    const scale = Math.min(
      window.innerWidth / W,
      window.innerHeight / H
    );
    this.canvas.style.transformOrigin = '0 0';
    this.canvas.style.transform = `scale(${scale})`;
    const offsetX = (window.innerWidth - W * scale) / 2;
    const offsetY = (window.innerHeight - H * scale) / 2;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = offsetX + 'px';
    this.canvas.style.top = offsetY + 'px';
  },

  markBgDirty() {
    this._bgDirty = true;
  },

  /**
   * Frame başlangıcı — canvas'ı temizle
   */
  beginFrame() {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;
    this.ctx.save();
    this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, W, H);
  },

  /**
   * Frame bitişi
   */
  endFrame() {
    this.ctx.restore();

    // FPS
    this._fpsCounter++;
    const now = performance.now();
    if (now - this._fpsTime >= 1000) {
      this._fps = this._fpsCounter;
      this._fpsCounter = 0;
      this._fpsTime = now;
    }
  },

  getGameCtx() { return this.ctx; },
  getGlowCtx() { return this.ctx; }, // Artık aynı ctx
  getMainCtx() { return this.ctx; },
  getMainCanvas() { return this.canvas; },
  getFPS() { return this._fps; },

  setGlow(ctx, color, blur) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  },

  clearGlow(ctx) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  },

  /**
   * UI çizimi için context döndür
   */
  drawUI(fn) {
    this.ctx.save();
    this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    fn(this.ctx);
    this.ctx.restore();
  },

  /**
   * Fullscreen toggle
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }
};
