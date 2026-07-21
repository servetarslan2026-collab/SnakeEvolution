// ============================================================
// map.js — Procedural Harita Sistemi
// ============================================================
window.G = window.G || {};

G.Map = {
  _grid: [],
  _portals: [],
  _spawnPoint: { x: 20, y: 15 },
  _cols: 0,
  _rows: 0,
  _currentBiome: 'neon_city',

  /**
   * Yeni harita oluştur
   */
  generate(biome) {
    const C = G.Config;
    this._cols = C.COLS;
    this._rows = C.ROWS;
    this._currentBiome = biome || 'neon_city';
    const TILE = C.TILE;

    // Boş grid
    this._grid = [];
    for (let y = 0; y < this._rows; y++) {
      this._grid[y] = [];
      for (let x = 0; x < this._cols; x++) {
        this._grid[y][x] = TILE.EMPTY;
      }
    }

    // Kenarlara duvar
    for (let x = 0; x < this._cols; x++) {
      this._grid[0][x] = TILE.WALL;
      this._grid[this._rows - 1][x] = TILE.WALL;
    }
    for (let y = 0; y < this._rows; y++) {
      this._grid[y][0] = TILE.WALL;
      this._grid[y][this._cols - 1] = TILE.WALL;
    }

    // Random walk ile iç yapılar (daha az engel)
    this._randomWalk(3, 6);

    // Biome'a göre özel tile'lar
    this._addBiomeTiles(biome);

    // Portal çiftleri
    this._portals = [];
    this._addPortals(2);

    // Spawn noktası (güvenli bölge)
    this._spawnPoint = this._findSafeSpawn();

    // Background'ı yeniden çiz
    if (G.Renderer) G.Renderer.markBgDirty();
  },

  _randomWalk(walkers, steps) {
    const TILE = G.Config.TILE;
    for (let w = 0; w < walkers; w++) {
      let x = G.Utils.randomInt(4, this._cols - 5);
      let y = G.Utils.randomInt(4, this._rows - 5);
      for (let s = 0; s < steps; s++) {
        // Nadiren kaya yerleştir
        if (Math.random() < 0.12) {
          this._grid[y][x] = TILE.ROCK;
        }
        // Rastgele yön
        const dir = G.Utils.randomInt(0, 3);
        const nx = x + [0, 0, -1, 1][dir];
        const ny = y + [-1, 1, 0, 0][dir];
        if (nx > 1 && nx < this._cols - 2 && ny > 1 && ny < this._rows - 2) {
          x = nx;
          y = ny;
        }
      }
    }
  },

  _addBiomeTiles(biome) {
    const TILE = G.Config.TILE;
    // Biome'a göre ağırlıklı tile dağılımı (daha az tehlikeli)
    const tileWeights = {
      neon_city:     { [TILE.ROCK]: 3, [TILE.ELECTRIC]: 1, [TILE.FOG]: 1 },
      frozen_lab:    { [TILE.ICE]: 4, [TILE.ROCK]: 2, [TILE.FOG]: 1 },
      lava_core:     { [TILE.LAVA]: 3, [TILE.ROCK]: 2, [TILE.ELECTRIC]: 1 },
      cyber_forest:  { [TILE.BUSH]: 3, [TILE.ROCK]: 2, [TILE.FOG]: 1 },
      space_station: { [TILE.ELECTRIC]: 2, [TILE.ROCK]: 2, [TILE.FOG]: 1, [TILE.CRATE]: 2 },
      void:          { [TILE.LAVA]: 2, [TILE.ELECTRIC]: 2, [TILE.FOG]: 2, [TILE.ROCK]: 1 }
    };

    const weights = tileWeights[biome] || tileWeights.neon_city;
    const tileTypes = Object.keys(weights).map(Number);
    const tileWeightsArr = Object.values(weights);

    // Rastgele tile yerleştir (kenarlara değil)
    const count = G.Utils.randomInt(5, 10);
    for (let i = 0; i < count; i++) {
      const x = G.Utils.randomInt(3, this._cols - 4);
      const y = G.Utils.randomInt(3, this._rows - 4);
      if (this._grid[y][x] === TILE.EMPTY) {
        const tile = G.Utils.randomWeighted(tileTypes, tileWeightsArr);
        this._grid[y][x] = tile;

        // Lava ve elektrik çevresine boşluk bırak
        if (tile === TILE.LAVA || tile === TILE.ELECTRIC) {
          this._clearAround(x, y, 1);
        }
      }
    }
  },

  _clearAround(cx, cy, radius) {
    const TILE = G.Config.TILE;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x > 0 && x < this._cols - 1 && y > 0 && y < this._rows - 1) {
          if (dx !== 0 || dy !== 0) {
            if (this._grid[y][x] !== TILE.WALL) {
              this._grid[y][x] = TILE.EMPTY;
            }
          }
        }
      }
    }
  },

  _addPortals(count) {
    const TILE = G.Config.TILE;
    for (let i = 0; i < count; i++) {
      let x1, y1, x2, y2;
      let attempts = 0;
      do {
        x1 = G.Utils.randomInt(3, this._cols - 4);
        y1 = G.Utils.randomInt(3, this._rows - 4);
        x2 = G.Utils.randomInt(3, this._cols - 4);
        y2 = G.Utils.randomInt(3, this._rows - 4);
        attempts++;
      } while ((this._grid[y1][x1] !== TILE.EMPTY || this._grid[y2][x2] !== TILE.EMPTY ||
                G.Utils.dist(x1, y1, x2, y2) < 10) && attempts < 50);

      if (attempts < 50) {
        this._grid[y1][x1] = TILE.PORTAL;
        this._grid[y2][x2] = TILE.PORTAL;
        this._portals.push({ x1, y1, x2, y2 });
      }
    }
  },

  _findSafeSpawn() {
    const TILE = G.Config.TILE;
    const cx = Math.floor(this._cols / 2);
    const cy = Math.floor(this._rows / 2);

    // Önce merkezi temizle (5x5 alan)
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x > 0 && x < this._cols - 1 && y > 0 && y < this._rows - 1) {
          this._grid[y][x] = TILE.EMPTY;
        }
      }
    }

    // Merkezden başla, güvenli nokta ara
    for (let r = 0; r < 10; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x > 0 && x < this._cols - 1 && y > 0 && y < this._rows - 1) {
            if (this._grid[y][x] === TILE.EMPTY) {
              // Etrafında da boşluk var mı?
              let safe = true;
              for (let sy = -2; sy <= 2; sy++) {
                for (let sx = -2; sx <= 2; sx++) {
                  const nx = x + sx;
                  const ny = y + sy;
                  if (nx >= 0 && nx < this._cols && ny >= 0 && ny < this._rows) {
                    if (this._grid[ny][nx] === TILE.WALL || this._grid[ny][nx] === TILE.LAVA) {
                      safe = false;
                    }
                  }
                }
              }
              if (safe) return { x, y };
            }
          }
        }
      }
    }
    return { x: cx, y: cy };
  },

  /**
   * Tile oku
   */
  getTile(x, y) {
    if (x < 0 || x >= this._cols || y < 0 || y >= this._rows) return G.Config.TILE.WALL;
    return this._grid[y][x];
  },

  /**
   * Tile yaz
   */
  setTile(x, y, tile) {
    if (x >= 0 && x < this._cols && y >= 0 && y < this._rows) {
      this._grid[y][x] = tile;
    }
  },

  /**
   * Boş mu?
   */
  isEmpty(x, y) {
    return this.getTile(x, y) === G.Config.TILE.EMPTY;
  },

  /**
   * Yürünebilir mi?
   */
  isWalkable(x, y) {
    const tile = this.getTile(x, y);
    return tile === G.Config.TILE.EMPTY || tile === G.Config.TILE.PORTAL;
  },

  /**
   * Portal hedefi
   */
  getPortalTarget(x, y) {
    for (const p of this._portals) {
      if (p.x1 === x && p.y1 === y) return { x: p.x2, y: p.y2 };
      if (p.x2 === x && p.y2 === y) return { x: p.x1, y: p.y1 };
    }
    return null;
  },

  /**
   * Spawn noktası
   */
  getSpawnPoint() {
    return { ...this._spawnPoint };
  },

  /**
   * Rastgele boş nokta
   */
  getRandomEmpty(safeX, safeY, safeRadius) {
    const TILE = G.Config.TILE;
    let attempts = 0;
    while (attempts < 100) {
      const x = G.Utils.randomInt(2, this._cols - 3);
      const y = G.Utils.randomInt(2, this._rows - 3);
      if (this._grid[y][x] === TILE.EMPTY) {
        if (safeX !== undefined) {
          if (G.Utils.dist(x, y, safeX, safeY) < safeRadius) {
            attempts++;
            continue;
          }
        }
        return { x, y };
      }
      attempts++;
    }
    return { x: Math.floor(this._cols / 2), y: Math.floor(this._rows / 2) };
  },

  /**
   * Tüm boş noktaları listele
   */
  getEmptyTiles() {
    const tiles = [];
    const TILE = G.Config.TILE;
    for (let y = 1; y < this._rows - 1; y++) {
      for (let x = 1; x < this._cols - 1; x++) {
        if (this._grid[y][x] === TILE.EMPTY) {
          tiles.push({ x, y });
        }
      }
    }
    return tiles;
  },

  /**
   * Haritayı çiz (game canvas'a)
   */
  draw(ctx) {
    const C = G.Config;
    const TILE = C.TILE;
    const gs = C.GRID_SIZE;
    const biome = C.BIOMES[this._currentBiome] || C.BIOMES.neon_city;

    for (let y = 0; y < this._rows; y++) {
      for (let x = 0; x < this._cols; x++) {
        const tile = this._grid[y][x];
        if (tile === TILE.EMPTY) continue;

        const px = x * gs;
        const py = y * gs;

        switch (tile) {
          case TILE.WALL:
            ctx.fillStyle = biome.wall;
            ctx.fillRect(px, py, gs, gs);
            // Neon kenarlık
            ctx.strokeStyle = biome.wallGlow;
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, gs - 1, gs - 1);
            break;

          case TILE.ROCK:
            ctx.fillStyle = '#2a2a3a';
            ctx.fillRect(px + 2, py + 2, gs - 4, gs - 4);
            ctx.fillStyle = '#3a3a4a';
            ctx.fillRect(px + 3, py + 3, gs - 6, gs - 6);
            break;

          case TILE.LAVA:
            ctx.fillStyle = biome.lava;
            ctx.fillRect(px, py, gs, gs);
            // Parıltı
            ctx.fillStyle = '#ff880044';
            ctx.fillRect(px + 4, py + 4, gs - 8, gs - 8);
            break;

          case TILE.ICE:
            ctx.fillStyle = biome.ice + '44';
            ctx.fillRect(px, py, gs, gs);
            ctx.strokeStyle = biome.ice + '88';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 1, py + 1, gs - 2, gs - 2);
            // Kristal deseni
            ctx.beginPath();
            ctx.moveTo(px + gs / 2, py + 2);
            ctx.lineTo(px + gs - 2, py + gs / 2);
            ctx.lineTo(px + gs / 2, py + gs - 2);
            ctx.lineTo(px + 2, py + gs / 2);
            ctx.closePath();
            ctx.strokeStyle = biome.ice + '66';
            ctx.stroke();
            break;

          case TILE.BUSH:
            ctx.fillStyle = biome.bush;
            ctx.fillRect(px + 2, py + 2, gs - 4, gs - 4);
            ctx.fillStyle = '#00550088';
            ctx.beginPath();
            ctx.arc(px + gs / 2, py + gs / 2, gs / 3, 0, Math.PI * 2);
            ctx.fill();
            break;

          case TILE.FOG:
            ctx.fillStyle = biome.fog + 'aa';
            ctx.fillRect(px, py, gs, gs);
            break;

          case TILE.ELECTRIC:
            ctx.fillStyle = '#1a1a00';
            ctx.fillRect(px, py, gs, gs);
            // Elektrik çizgisi
            ctx.strokeStyle = biome.electric;
            ctx.lineWidth = 1;
            ctx.beginPath();
            const t = Date.now() / 200;
            ctx.moveTo(px, py + gs / 2);
            for (let i = 0; i < 4; i++) {
              const sx = px + (i + 0.5) * (gs / 4);
              const sy = py + gs / 2 + Math.sin(t + i) * 4;
              ctx.lineTo(sx, sy);
            }
            ctx.lineTo(px + gs, py + gs / 2);
            ctx.stroke();
            break;

          case TILE.PORTAL:
            ctx.fillStyle = biome.portal + '44';
            ctx.fillRect(px, py, gs, gs);
            // Dönen halka
            ctx.strokeStyle = biome.portal;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const pt = Date.now() / 500;
            ctx.arc(px + gs / 2, py + gs / 2, gs / 3, pt, pt + Math.PI * 1.5);
            ctx.stroke();
            break;

          case TILE.CRATE:
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(px + 2, py + 2, gs - 4, gs - 4);
            ctx.strokeStyle = '#6a5a4a';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 2, py + 2, gs - 4, gs - 4);
            // X deseni
            ctx.beginPath();
            ctx.moveTo(px + 4, py + 4);
            ctx.lineTo(px + gs - 4, py + gs - 4);
            ctx.moveTo(px + gs - 4, py + 4);
            ctx.lineTo(px + 4, py + gs - 4);
            ctx.stroke();
            break;
        }
      }
    }
  },

  get cols() { return this._cols; },
  get rows() { return this._rows; }
};
