// ============================================================
// map.js — Harita Sistemi
// ============================================================
window.G = window.G || {};

G.Map = {
  tiles: [],

  generate() {
    const E = G.Engine;
    const COLS = E.W / E.GS;
    const ROWS = E.H / E.GS;
    this.tiles = [];

    for (let y = 0; y < ROWS; y++) {
      this.tiles[y] = new Uint8Array(COLS);
      // Kenarlara duvar YOK — wrap around
      // Sadece iç engeller olacak
    }

    // Obstacles (biome-based count) — engeller arası mesafe kontrolü
    const count = 3 + E.currentBiome; // Daha az engel
    const placed = [];
    for (let i = 0; i < count; i++) {
      let x, y, tries = 0;
      do {
        x = G.Utils.rndInt(4, COLS - 5);
        y = G.Utils.rndInt(4, ROWS - 5);
        tries++;
      } while (tries < 50 && (
        this.tiles[y][x] !== 0 ||
        placed.some(p => Math.abs(p.x - x) < 3 && Math.abs(p.y - y) < 3)
      ));
      if (tries >= 50) continue;

      const type = [2, 3, 4, 7][G.Utils.rndInt(0, 3)];
      this.tiles[y][x] = type;
      placed.push({ x, y });
    }

    // Clear spawn area (center 10x10 — daha büyük güvenli bölge)
    const cx = COLS / 2 | 0;
    const cy = ROWS / 2 | 0;
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx > 0 && nx < COLS - 1 && ny > 0 && ny < ROWS - 1) {
          this.tiles[ny][nx] = 0;
        }
      }
    }
  },

  getTile(x, y) {
    if (!this.tiles[y] || x < 0 || x >= G.Engine.W / G.Engine.GS || y < 0 || y >= G.Engine.H / G.Engine.GS) return 1;
    return this.tiles[y][x];
  },

  isBlocking(tile) {
    return tile === 1 || tile === 2 || tile === 3 || tile === 7;
  },

  getRandomEmpty() {
    const COLS = G.Engine.W / G.Engine.GS;
    const ROWS = G.Engine.H / G.Engine.GS;
    let tries = 0;
    while (tries < 100) {
      const x = G.Utils.rndInt(2, COLS - 3);
      const y = G.Utils.rndInt(2, ROWS - 3);
      if (this.tiles[y] && this.tiles[y][x] === 0) return { x, y };
      tries++;
    }
    return { x: COLS / 2 | 0, y: ROWS / 2 | 0 };
  },

  draw(ctx) {
    const E = G.Engine;
    const gs = E.GS;
    const biome = E.getBiome();
    const ROWS = E.H / gs;
    const COLS = E.W / gs;

    // Görsel kenarlık (engel olmayan)
    ctx.strokeStyle = biome.accent + '44';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, E.W - 2, E.H - 2);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = this.tiles[y] ? this.tiles[y][x] : 0;
        if (t === 0) continue;
        const px = x * gs;
        const py = y * gs;

        if (t === 1) { // Wall
          ctx.fillStyle = biome.wall;
          ctx.fillRect(px, py, gs, gs);
          ctx.strokeStyle = biome.wallG;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px + 0.5, py + 0.5, gs - 1, gs - 1);
        } else if (t === 2) { // Rock
          ctx.fillStyle = '#3a3a4a';
          ctx.fillRect(px + 2, py + 2, gs - 4, gs - 4);
          ctx.fillStyle = '#4a4a5a';
          ctx.fillRect(px + 3, py + 3, gs - 6, gs - 6);
          ctx.strokeStyle = '#5a5a6a';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 2, py + 2, gs - 4, gs - 4);
        } else if (t === 3) { // Lava
          const tt = Date.now() / 500;
          ctx.fillStyle = '#ff3d00';
          ctx.fillRect(px, py, gs, gs);
          ctx.fillStyle = '#ff880066';
          ctx.fillRect(px + 2 + Math.sin(tt) * 2, py + 2 + Math.cos(tt) * 2, gs - 4, gs - 4);
          ctx.fillStyle = '#ffaa0044';
          ctx.fillRect(px + 5, py + 5, gs - 10, gs - 10);
        } else if (t === 4) { // Ice
          ctx.fillStyle = '#00d4ff22';
          ctx.fillRect(px, py, gs, gs);
          ctx.strokeStyle = '#00d4ff66';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + gs / 2, py + 2);
          ctx.lineTo(px + gs - 2, py + gs / 2);
          ctx.lineTo(px + gs / 2, py + gs - 2);
          ctx.lineTo(px + 2, py + gs / 2);
          ctx.closePath();
          ctx.stroke();
        } else if (t === 7) { // Electric
          ctx.fillStyle = '#1a1a00';
          ctx.fillRect(px, py, gs, gs);
          ctx.strokeStyle = '#ffe14d';
          ctx.lineWidth = 1.5;
          const et = Date.now() / 150;
          ctx.beginPath();
          ctx.moveTo(px, py + gs / 2);
          for (let i = 0; i < 4; i++) {
            ctx.lineTo(px + (i + 0.5) * (gs / 4), py + gs / 2 + Math.sin(et + i * 2) * 4);
          }
          ctx.lineTo(px + gs, py + gs / 2);
          ctx.stroke();
          ctx.fillStyle = '#ffe14d22';
          ctx.fillRect(px + 2, py + 2, gs - 4, gs - 4);
        }
      }
    }
  }
};
