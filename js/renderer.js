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

    // Scanline efekti (CRT hissi)
    this._mainCtx.save();
    this._mainCtx.globalAlpha = 0.03;
    for (let sy = 0; sy < H; sy += 3) {
      this._mainCtx.fillStyle = '#000000';
      this._mainCtx.fillRect(0, sy, W, 1);
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
    const now = Date.now();

    // Arka plan rengi (radial gradient)
    const bgGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
    bgGrad.addColorStop(0, biome.bg);
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Floating parçacıklar (animasyonlu)
    ctx.globalAlpha = 0.15;
    const accent = biome.accent || '#00ffcc';
    for (let i = 0; i < 20; i++) {
      const px = (Math.sin(now / 3000 + i * 1.7) * 0.5 + 0.5) * W;
      const py = (Math.cos(now / 4000 + i * 2.3) * 0.5 + 0.5) * H;
      const psize = 1 + Math.sin(now / 2000 + i) * 0.5;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(px, py, psize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Grid çizgileri (subtle glow)
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

    // Her 5 tile'da bir belirgin çizgi (glow efektli)
    ctx.strokeStyle = biome.gridAccent;
    ctx.lineWidth = 1;
    if (G.Save.get('settings.glow') !== false) {
      ctx.shadowColor = accent;
      ctx.shadowBlur = 3;
    }
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
    ctx.shadowBlur = 0;

    // Köşe dekorasyonları (neon çizgiler)
    const cornerLen = 40;
    ctx.strokeStyle = accent + '33';
    ctx.lineWidth = 1;
    // Sol üst
    ctx.beginPath();
    ctx.moveTo(5, 5 + cornerLen);
    ctx.lineTo(5, 5);
    ctx.lineTo(5 + cornerLen, 5);
    ctx.stroke();
    // Sağ üst
    ctx.beginPath();
    ctx.moveTo(W - 5 - cornerLen, 5);
    ctx.lineTo(W - 5, 5);
    ctx.lineTo(W - 5, 5 + cornerLen);
    ctx.stroke();
    // Sol alt
    ctx.beginPath();
    ctx.moveTo(5, H - 5 - cornerLen);
    ctx.lineTo(5, H - 5);
    ctx.lineTo(5 + cornerLen, H - 5);
    ctx.stroke();
    // Sağ alt
    ctx.beginPath();
    ctx.moveTo(W - 5 - cornerLen, H - 5);
    ctx.lineTo(W - 5, H - 5);
    ctx.lineTo(W - 5, H - 5 - cornerLen);
    ctx.stroke();
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
