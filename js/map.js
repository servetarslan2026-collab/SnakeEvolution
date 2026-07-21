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
            // Duvar (gradient + doku)
            const wg = ctx.createLinearGradient(px, py, px + gs, py + gs);
            wg.addColorStop(0, biome.wall);
            wg.addColorStop(1, biome.wallGlow);
            ctx.fillStyle = wg;
            ctx.fillRect(px, py, gs, gs);
            // Tuğla deseni
            ctx.strokeStyle = biome.wallGlow + '44';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(px + 1, py + 1, gs/2 - 1, gs/2 - 1);
            ctx.strokeRect(px + gs/2, py + 1, gs/2 - 1, gs/2 - 1);
            ctx.strokeRect(px + 1, py + gs/2, gs - 2, gs/2 - 1);
            // Neon kenarlık
            ctx.strokeStyle = biome.wallGlow + '88';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, gs - 1, gs - 1);
            break;

          case TILE.ROCK:
            // Kaya (gradient + gölge)
            const rg = ctx.createRadialGradient(px + gs/2 - 2, py + gs/2 - 2, 1, px + gs/2, py + gs/2, gs/2);
            rg.addColorStop(0, '#4a4a5a');
            rg.addColorStop(1, '#2a2a3a');
            ctx.fillStyle = rg;
            ctx.fillRect(px + 2, py + 2, gs - 4, gs - 4);
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(px + 3, py + 3, gs/2 - 2, gs/2 - 2);
            // Kenarlık
            ctx.strokeStyle = '#5a5a6a44';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 2, py + 2, gs - 4, gs - 4);
            break;

          case TILE.LAVA:
            // Lava (animasyonlu gradient)
            const t = Date.now() / 500;
            const lg = ctx.createRadialGradient(px + gs/2 + Math.sin(t) * 3, py + gs/2 + Math.cos(t) * 3, 0, px + gs/2, py + gs/2, gs/2);
            lg.addColorStop(0, '#ffaa00');
            lg.addColorStop(0.4, biome.lava);
            lg.addColorStop(1, '#881100');
            ctx.fillStyle = lg;
            ctx.fillRect(px, py, gs, gs);
            // Kabarcıklar
            ctx.fillStyle = '#ffcc4444';
            ctx.beginPath();
            ctx.arc(px + gs*0.3 + Math.sin(t*1.3)*2, py + gs*0.4 + Math.cos(t)*2, 2, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px + gs*0.7 + Math.cos(t*0.9)*2, py + gs*0.6 + Math.sin(t*1.1)*2, 1.5, 0, Math.PI*2);
            ctx.fill();
            break;

          case TILE.ICE:
            // Buz (gradient + kristal deseni)
            const ig = ctx.createLinearGradient(px, py, px + gs, py + gs);
            ig.addColorStop(0, biome.ice + '22');
            ig.addColorStop(0.5, biome.ice + '44');
            ig.addColorStop(1, biome.ice + '22');
            ctx.fillStyle = ig;
            ctx.fillRect(px, py, gs, gs);
            // Kristal deseni (elmas)
            ctx.strokeStyle = biome.ice + '66';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px + gs/2, py + 2);
            ctx.lineTo(px + gs - 2, py + gs/2);
            ctx.lineTo(px + gs/2, py + gs - 2);
            ctx.lineTo(px + 2, py + gs/2);
            ctx.closePath();
            ctx.stroke();
            // İç parıltı
            ctx.fillStyle = biome.ice + '22';
            ctx.beginPath();
            ctx.arc(px + gs/2, py + gs/2, gs/4, 0, Math.PI*2);
            ctx.fill();
            // Kenarlık
            ctx.strokeStyle = biome.ice + '44';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, gs - 1, gs - 1);
            break;

          case TILE.BUSH:
            // Çalı (yaprak deseni)
            ctx.fillStyle = biome.bush;
            ctx.fillRect(px + 1, py + 1, gs - 2, gs - 2);
            // Yapraklar
            ctx.fillStyle = '#00660044';
            for (let li = 0; li < 4; li++) {
              const lx = px + 4 + (li % 2) * (gs/2);
              const ly = py + 4 + Math.floor(li/2) * (gs/2);
              ctx.beginPath();
              ctx.arc(lx, ly, gs/4, 0, Math.PI*2);
              ctx.fill();
            }
            // Kenarlık
            ctx.strokeStyle = biome.bush + '88';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 1, py + 1, gs - 2, gs - 2);
            break;

          case TILE.FOG:
            // Sis (animasyonlu bulut)
            const ft = Date.now() / 1000;
            ctx.fillStyle = biome.fog;
            ctx.fillRect(px, py, gs, gs);
            ctx.globalAlpha = 0.3 + Math.sin(ft + px * 0.1) * 0.1;
            ctx.fillStyle = biome.fog;
            ctx.beginPath();
            ctx.arc(px + gs/2 + Math.sin(ft)*3, py + gs/2, gs/2, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1;
            break;

          case TILE.ELECTRIC:
            // Elektrik (animasyonlu yıldırım)
            ctx.fillStyle = '#1a1a00';
            ctx.fillRect(px, py, gs, gs);
            ctx.strokeStyle = biome.electric;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const et = Date.now() / 150;
            ctx.moveTo(px, py + gs/2);
            for (let i = 0; i < 5; i++) {
              const sx = px + (i + 0.5) * (gs/5);
              const sy = py + gs/2 + Math.sin(et + i * 2) * 5;
              ctx.lineTo(sx, sy);
            }
            ctx.lineTo(px + gs, py + gs/2);
            ctx.stroke();
            // Glow
            ctx.strokeStyle = biome.electric + '44';
            ctx.lineWidth = 4;
            ctx.stroke();
            break;

          case TILE.PORTAL:
            // Portal (dönen halka + glow)
            ctx.fillStyle = biome.portal + '22';
            ctx.fillRect(px, py, gs, gs);
            const pt = Date.now() / 400;
            // Dış halka
            ctx.strokeStyle = biome.portal + '88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px + gs/2, py + gs/2, gs/3, pt, pt + Math.PI * 1.5);
            ctx.stroke();
            // İç halka
            ctx.strokeStyle = biome.portal + '44';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(px + gs/2, py + gs/2, gs/5, -pt, -pt + Math.PI);
            ctx.stroke();
            // Merkez glow
            ctx.fillStyle = biome.portal + '33';
            ctx.beginPath();
            ctx.arc(px + gs/2, py + gs/2, gs/6, 0, Math.PI*2);
            ctx.fill();
            break;

          case TILE.CRATE:
            // Sandık (ahşap deseni)
            const cg = ctx.createLinearGradient(px, py, px, py + gs);
            cg.addColorStop(0, '#5a4a3a');
            cg.addColorStop(0.5, '#4a3a2a');
            cg.addColorStop(1, '#3a2a1a');
            ctx.fillStyle = cg;
            ctx.fillRect(px + 2, py + 2, gs - 4, gs - 4);
            // Ahşap çizgiler
            ctx.strokeStyle = '#6a5a4a33';
            ctx.lineWidth = 0.5;
            for (let wi = 0; wi < 3; wi++) {
              ctx.beginPath();
              ctx.moveTo(px + 3, py + 4 + wi * (gs/3));
              ctx.lineTo(px + gs - 3, py + 4 + wi * (gs/3));
              ctx.stroke();
            }
            // Metal köşe
            ctx.fillStyle = '#88888844';
            ctx.fillRect(px + 2, py + 2, 4, 4);
            ctx.fillRect(px + gs - 6, py + 2, 4, 4);
            ctx.fillRect(px + 2, py + gs - 6, 4, 4);
            ctx.fillRect(px + gs - 6, py + gs - 6, 4, 4);
            // Kenarlık
            ctx.strokeStyle = '#6a5a4a';
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 2, py + 2, gs - 4, gs - 4);
            break;
        }
      }
    }
  },

  get cols() { return this._cols; },
  get rows() { return this._rows; }
};
