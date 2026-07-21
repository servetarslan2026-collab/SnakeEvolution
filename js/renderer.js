// ============================================================
// renderer.js — Çoklu Canvas Render Pipeline + Glow Yönetimi
// ============================================================
window.G = window.G || {};

G.Renderer = {
  _mainCanvas: null,
  _mainCtx: null,
  _bgCanvas: null,
  _bgCtx: null,
  _gameCanvas: null,
  _gameCtx: null,
  _glowCanvas: null,
  _glowCtx: null,
  _stage: null,
  _dpr: 1,
  _bgDirty: true,
  _fpsCounter: 0,
  _fpsTime: 0,
  _fps: 0,

  /**
   * Render sistemini başlat (3 katmanlı canvas)
   */
  init(containerId) {
    this._dpr = window.devicePixelRatio || 1;
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;

    // Stage container
    this._stage = document.createElement('div');
    this._stage.id = 'game-stage';
    this._stage.style.cssText = `
      position: relative;
      width: ${W}px;
      height: ${H}px;
      margin: 0 auto;
      overflow: hidden;
    `;

    // Background canvas (statik katman)
    this._bgCanvas = this._createLayer('bg-layer', 0);
    this._bgCtx = this._bgCanvas.getContext('2d', { alpha: false });

    // Game canvas (dinamik katman)
    this._gameCanvas = this._createLayer('game-layer', 1);
    this._gameCtx = this._gameCanvas.getContext('2d', { alpha: true });

    // Glow canvas (glow efektleri)
    this._glowCanvas = this._createLayer('glow-layer', 2);
    this._glowCtx = this._glowCanvas.getContext('2d', { alpha: true });

    // Ana canvas (composite + UI)
    this._mainCanvas = document.createElement('canvas');
    this._mainCanvas.id = 'main-canvas';
    this._mainCanvas.width = W * this._dpr;
    this._mainCanvas.height = H * this._dpr;
    this._mainCanvas.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: ${W}px;
      height: ${H}px;
      z-index: 10;
      pointer-events: auto;
    `;
    this._mainCtx = this._mainCanvas.getContext('2d', { alpha: false });
    this._mainCtx.scale(this._dpr, this._dpr);

    this._stage.appendChild(this._mainCanvas);

    const container = document.getElementById(containerId) || document.body;
    container.appendChild(this._stage);

    // Responsive ölçekleme
    this._resize();
    window.addEventListener('resize', () => this._resize());

    return this._mainCanvas;
  },

  _createLayer(id, z) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;
    const c = document.createElement('canvas');
    c.id = id;
    c.width = W * this._dpr;
    c.height = H * this._dpr;
    c.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: ${W}px;
      height: ${H}px;
      z-index: ${z};
    `;
    const ctx = c.getContext('2d', { alpha: z !== 0 });
    ctx.scale(this._dpr, this._dpr);
    this._stage.appendChild(c);
    return c;
  },

  /**
   * Fullscreen toggle
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  },

  _resize() {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;
    const scale = Math.min(
      window.innerWidth / W,
      window.innerHeight / H
    );
    this._stage.style.transformOrigin = '0 0';
    this._stage.style.transform = `scale(${scale})`;
    // Ortala
    const offsetX = (window.innerWidth - W * scale) / 2;
    const offsetY = (window.innerHeight - H * scale) / 2;
    this._stage.style.marginLeft = offsetX + 'px';
    this._stage.style.marginTop = offsetY + 'px';
  },

  /**
   * Background'ı kirli işaretle (yeniden çizim gerekiyor)
   */
  markBgDirty() {
    this._bgDirty = true;
  },

  /**
   * Frame başlangıcı
   */
  beginFrame() {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;

    // Background (sadece gerektiğinde)
    if (this._bgDirty) {
      this._bgCtx.save();
      this._bgCtx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
      this._drawBackground(this._bgCtx, W, H);
      this._bgCtx.restore();
      this._bgDirty = false;
    }

    // Game canvas temizle
    this._gameCtx.save();
    this._gameCtx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    this._gameCtx.clearRect(0, 0, W, H);

    // Glow canvas temizle
    this._glowCtx.save();
    this._glowCtx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    this._glowCtx.clearRect(0, 0, W, H);

    // Ana canvas temizle
    this._mainCtx.save();
    this._mainCtx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    this._mainCtx.fillStyle = '#000';
    this._mainCtx.fillRect(0, 0, W, H);
  },

  /**
   * Frame bitişi — katmanları composite et
   */
  endFrame() {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;

    this._gameCtx.restore();
    this._glowCtx.restore();

    // Background → main
    this._mainCtx.drawImage(this._bgCanvas, 0, 0, W * this._dpr, H * this._dpr, 0, 0, W, H);

    // Game → main
    this._mainCtx.drawImage(this._gameCanvas, 0, 0, W * this._dpr, H * this._dpr, 0, 0, W, H);

    // Glow → main (lighter composite)
    if (G.Save.get('settings.glow') !== false) {
      this._mainCtx.globalCompositeOperation = 'lighter';
      this._mainCtx.drawImage(this._glowCanvas, 0, 0, W * this._dpr, H * this._dpr, 0, 0, W, H);
      this._mainCtx.globalCompositeOperation = 'source-over';
    }

    this._mainCtx.restore();

    // FPS
    this._fpsCounter++;
    const now = performance.now();
    if (now - this._fpsTime >= 1000) {
      this._fps = this._fpsCounter;
      this._fpsCounter = 0;
      this._fpsTime = now;
    }
  },

  _drawBackground(ctx, W, H) {
    const biome = G.Config.BIOMES[G.Game ? G.Game.currentBiome : 'neon_city'] || G.Config.BIOMES.neon_city;
    // Arka plan rengi
    ctx.fillStyle = biome.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid çizgileri
    const gs = G.Config.GRID_SIZE;
    ctx.strokeStyle = biome.grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += gs) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += gs) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Her 5 tile'da bir belirgin çizgi
    ctx.strokeStyle = biome.gridAccent;
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += gs * 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += gs * 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  },

  // --- Katman Erişim ---

  getGameCtx() { return this._gameCtx; },
  getGlowCtx() { return this._glowCtx; },
  getMainCtx() { return this._mainCtx; },
  getMainCanvas() { return this._mainCanvas; },
  getFPS() { return this._fps; },

  /**
   * Glow efekti uygula (sadece glow ctx'de)
   */
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
   * UI doğrudan ana canvas'a çiz (glow'suz)
   */
  drawUI(fn) {
    this._mainCtx.save();
    this._mainCtx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    fn(this._mainCtx);
    this._mainCtx.restore();
  }
};
