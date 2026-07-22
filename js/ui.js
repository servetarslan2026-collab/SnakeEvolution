// ============================================================
// ui.js — Arayüz Sistemi
// ============================================================
window.G = window.G || {};

G.UI = {
  drawMenu(ctx) {
    const E = G.Engine;
    const b = E.getBiome();
    const now = Date.now();
    const PI2 = Math.PI * 2;

    // Animated background particles
    ctx.fillStyle = b.accent + '08';
    for (let i = 0; i < 30; i++) {
      const px = (Math.sin(now / 3000 + i * 0.7) * 0.5 + 0.5) * E.W;
      const py = (Math.cos(now / 4000 + i * 1.1) * 0.5 + 0.5) * E.H;
      ctx.beginPath();
      ctx.arc(px, py, 2 + Math.sin(now / 1000 + i) * 1, 0, PI2);
      ctx.fill();
    }

    // Title with glow
    ctx.save();
    ctx.shadowColor = b.accent;
    ctx.shadowBlur = 20;
    ctx.fillStyle = b.accent;
    ctx.font = '900 52px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('SNAKE', E.W / 2 | 0, 90);
    ctx.fillStyle = b.accent2;
    ctx.shadowColor = b.accent2;
    ctx.shadowBlur = 25;
    ctx.fillText('EVOLUTION', E.W / 2 | 0, 140);
    ctx.restore();

    // Animated line
    const lg = ctx.createLinearGradient(E.W / 2 - 200, 0, E.W / 2 + 200, 0);
    const lineOffset = (now / 1000) % 1;
    lg.addColorStop(0, b.accent + '00');
    lg.addColorStop(0.3 + lineOffset * 0.2, b.accent);
    lg.addColorStop(0.7 - lineOffset * 0.2, b.accent2);
    lg.addColorStop(1, b.accent2 + '00');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(E.W / 2 - 200, 160);
    ctx.lineTo(E.W / 2 + 200, 160);
    ctx.stroke();

    // Subtitle
    ctx.fillStyle = '#556677aa';
    ctx.font = '13px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('A ROGUELIKE SNAKE EXPERIENCE', E.W / 2 | 0, 178);

    // Buttons
    const btns = ['▶  PLAY', '📖  HOW TO PLAY', '🎨  SKINS', '⚙  SETTINGS'];
    const sy = 220, sp = 50, bw = 280, bh = 42;

    for (let i = 0; i < 4; i++) {
      const y = sy + i * sp;
      const sel = i === E.selectedBtn;
      const bx = E.W / 2 - bw / 2;

      ctx.save();

      // Button background
      if (sel) {
        // Selected: gradient fill
        const btnG = ctx.createLinearGradient(bx, y - bh / 2, bx + bw, y - bh / 2);
        btnG.addColorStop(0, b.accent + '22');
        btnG.addColorStop(0.5, b.accent + '11');
        btnG.addColorStop(1, b.accent + '05');
        ctx.fillStyle = btnG;
        ctx.fillRect(bx, y - bh / 2, bw, bh);
        // Left accent bar
        ctx.fillStyle = b.accent;
        ctx.fillRect(bx, y - bh / 2 + 4, 3, bh - 8);
        // Right glow
        ctx.fillStyle = b.accent + '11';
        ctx.fillRect(bx + bw - 3, y - bh / 2 + 4, 3, bh - 8);
      }

      ctx.strokeStyle = sel ? b.accent + '66' : '#ffffff11';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, y - bh / 2, bw, bh);

      ctx.fillStyle = sel ? b.accent : '#667788';
      ctx.font = (sel ? 'bold ' : '') + '16px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btns[i], E.W / 2 | 0, y | 0);
      ctx.restore();
    }

    // Stats bar
    ctx.fillStyle = '#33334488';
    ctx.fillRect(0, E.H - 50, E.W, 50);
    ctx.fillStyle = '#445566';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('High Score: ' + G.Save.data.highScore + '  |  Coins: ' + G.Save.data.coins, 15, E.H - 35);
    ctx.fillText('Games: ' + G.Save.data.totalGames + '  |  Max Level: ' + (G.Save.data.maxLevel || 0), 15, E.H - 22);

    // Günlük görevler
    const today = new Date().toISOString().slice(0, 10);
    if (G.Save.data.dailyQuests.date === today) {
      const dq = G.Save.data.dailyQuests;
      ctx.fillStyle = '#44ff4488';
      ctx.font = '10px monospace';
      ctx.fillText('📋 Görevler: Yem ' + (dq.food || 0) + '/50  |  Oyun ' + (dq.games || 0) + '/3', 15, E.H - 8);
    }

    ctx.fillStyle = '#334';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('v5.0', E.W - 15, E.H - 35);

    ctx.fillStyle = '#55667788';
    ctx.font = '11px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ Navigate  •  ENTER Select', E.W / 2 | 0, E.H - 8);
  },

  drawHUD(ctx) {
    const E = G.Engine;
    const b = E.getBiome();
    const S = G.Snake;

    // HUD background strip
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, E.W, 75);
    ctx.fillStyle = b.accent + '22';
    ctx.fillRect(0, 74, E.W, 1);

    // Score
    ctx.fillStyle = b.accent;
    ctx.font = 'bold 22px Orbitron';
    ctx.textAlign = 'left';
    ctx.fillText(E.score, 15, 28);
    ctx.fillStyle = '#556677';
    ctx.font = '10px Rajdhani';
    ctx.fillText('SKOR', 15, 12);

    // Level
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 14px Orbitron';
    ctx.fillText('LVL ' + E.level, 15, 48);

    // XP bar
    const bw = 100, bh = 5, bx = 70, by = 43;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(bx, by, bw, bh);
    const xpPct = E.xpNext > 0 ? E.xp / E.xpNext : 0;
    const xpG = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    xpG.addColorStop(0, b.accent);
    xpG.addColorStop(1, b.accent2);
    ctx.fillStyle = xpG;
    ctx.fillRect(bx, by, bw * xpPct, bh);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(bx, by, bw * xpPct, bh / 2);

    // Hearts (drawn manually for consistent rendering)
    for (let i = 0; i < S.maxHp; i++) {
      const filled = i < S.hp;
      const hx = 18 + i * 16;
      const hy = 65;
      const hsz = 5;
      ctx.save();
      if (filled) {
        ctx.fillStyle = '#ff2266';
        ctx.shadowColor = '#ff2266';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = '#441122';
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.moveTo(hx, hy + hsz * 0.3);
      ctx.bezierCurveTo(hx, hy - hsz * 0.3, hx - hsz, hy - hsz * 0.3, hx - hsz, hy + hsz * 0.1);
      ctx.bezierCurveTo(hx - hsz, hy + hsz * 0.6, hx, hy + hsz, hx, hy + hsz);
      ctx.bezierCurveTo(hx, hy + hsz, hx + hsz, hy + hsz * 0.6, hx + hsz, hy + hsz * 0.1);
      ctx.bezierCurveTo(hx + hsz, hy - hsz * 0.3, hx, hy - hsz * 0.3, hx, hy + hsz * 0.3);
      ctx.fill();
      if (filled) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(hx - hsz * 0.3, hy - hsz * 0.1, hsz * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Border for empty hearts
      if (!filled) {
        ctx.strokeStyle = '#662233';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx, hy + hsz * 0.3);
        ctx.bezierCurveTo(hx, hy - hsz * 0.3, hx - hsz, hy - hsz * 0.3, hx - hsz, hy + hsz * 0.1);
        ctx.bezierCurveTo(hx - hsz, hy + hsz * 0.6, hx, hy + hsz, hx, hy + hsz);
        ctx.bezierCurveTo(hx, hy + hsz, hx + hsz, hy + hsz * 0.6, hx + hsz, hy + hsz * 0.1);
        ctx.bezierCurveTo(hx + hsz, hy - hsz * 0.3, hx, hy - hsz * 0.3, hx, hy + hsz * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Combo (center)
    if (G.Combo.count >= 3) {
      ctx.save();
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 22px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('x' + G.Combo.count, E.W / 2 | 0, 30);
      ctx.restore();
      ctx.fillStyle = '#ffcc4488';
      ctx.font = '10px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText('COMBO', E.W / 2 | 0, 42);
      if (G.Combo.multiplier > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Orbitron';
        ctx.fillText('×' + G.Combo.multiplier, E.W / 2 | 0, 56);
      }
    }

    // Biome name (right)
    ctx.fillStyle = b.accent + '66';
    ctx.font = '10px Rajdhani';
    ctx.textAlign = 'right';
    ctx.fillText(b.name.toUpperCase(), E.W - 15, 12);

    // FPS
    ctx.fillStyle = '#333';
    ctx.font = '9px monospace';
    ctx.fillText(E.fps + ' FPS', E.W - 15, 24);

    // Time
    const mins = Math.floor(E.gameTime / 60);
    const secs = Math.floor(E.gameTime % 60);
    ctx.fillStyle = '#445566';
    ctx.font = '10px monospace';
    ctx.fillText(mins + ':' + (secs < 10 ? '0' : '') + secs, E.W - 15, 36);

    // Boss HP (bottom center)
    if (G.Boss.isActive()) {
      const bw2 = E.W * 0.5, bh2 = 8, bx2 = (E.W - bw2) / 2, by2 = E.H - 30;
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(bx2 - 1, by2 - 1, bw2 + 2, bh2 + 2);
      ctx.strokeStyle = '#ff004444';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx2 - 1, by2 - 1, bw2 + 2, bh2 + 2);
      const bossG = ctx.createLinearGradient(bx2, 0, bx2 + bw2, 0);
      bossG.addColorStop(0, '#ff0044');
      bossG.addColorStop(1, '#ff4400');
      ctx.fillStyle = bossG;
      ctx.fillRect(bx2, by2, bw2 * (G.Boss.active.hp / G.Boss.active.maxHp), bh2);
    }
  },

  drawMiniMap(ctx) {
    const E = G.Engine;
    const mw = 60, mh = 45, mx = E.W - mw - 10, my = E.H - mh - 10;
    const sx = mw / (E.W / E.GS);
    const sy = mh / (E.H / E.GS);

    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(mx, my, mw, mh);

    ctx.fillStyle = E.getBiome().accent;
    if (G.Snake.segments.length > 0) {
      ctx.fillRect(mx + G.Snake.head().x * sx, my + G.Snake.head().y * sy, 2, 2);
    }

    ctx.fillStyle = '#ff4444';
    for (const e of G.Enemies.list) {
      if (e.alive) ctx.fillRect(mx + e.x * sx, my + e.y * sy, 1.5, 1.5);
    }

    ctx.fillStyle = '#ffaa00';
    for (const f of G.Food.items) {
      if (f.alive) ctx.fillRect(mx + f.x * sx, my + f.y * sy, 1.5, 1.5);
    }

    ctx.globalAlpha = 1;
  },

  drawPaused(ctx) {
    const E = G.Engine;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, E.W, E.H);
    ctx.save();
    ctx.shadowColor = E.getBiome().accent;
    ctx.shadowBlur = 15;
    ctx.fillStyle = E.getBiome().accent;
    ctx.font = 'bold 36px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('DURAKLADI', E.W / 2 | 0, E.H / 2 - 20);
    ctx.restore();
    ctx.fillStyle = '#888899';
    ctx.font = '16px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('ESC veya ENTER ile devam et', E.W / 2 | 0, E.H / 2 + 20);
  },

  drawLevelUp(ctx) {
    const E = G.Engine;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, E.W, E.H);

    ctx.save();
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 30px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL UP!', E.W / 2 | 0, 90);
    ctx.restore();

    const cw = 170, ch = 190, sp = 25;
    const tw = 3 * cw + 2 * sp;
    const sx = (E.W - tw) / 2;

    for (let i = 0; i < 3; i++) {
      const u = E.upgradeChoices[i];
      if (!u) continue;
      const x = sx + i * (cw + sp);
      const y = 130;
      const sel = i === E.selectedUpgrade;
      const rc = { common: '#888', uncommon: '#00ff88', rare: '#0088ff', epic: '#aa00ff', legendary: '#ffaa00' }[u.rarity] || '#888';

      ctx.save();
      const cg = ctx.createLinearGradient(x, y, x, y + ch);
      cg.addColorStop(0, sel ? '#1a1a3a' : '#0e0e1e');
      cg.addColorStop(1, sel ? '#0a0a2a' : '#060612');
      ctx.fillStyle = cg;
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeStyle = sel ? rc + '88' : '#fff1';
      ctx.lineWidth = sel ? 2 : 1;
      ctx.strokeRect(x, y, cw, ch);
      ctx.fillStyle = rc + '22';
      ctx.fillRect(x, y, cw, 22);
      ctx.fillStyle = rc;
      ctx.font = 'bold 9px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(u.rarity.toUpperCase(), x + cw / 2 | 0, y + 14 | 0);
      ctx.font = '32px Arial';
      ctx.textBaseline = 'middle';
      ctx.fillText(u.icon, x + cw / 2 | 0, y + 55 | 0);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Orbitron';
      ctx.fillText(u.name, x + cw / 2 | 0, y + 85 | 0);
      ctx.fillStyle = '#b0b0cc';
      ctx.font = '12px Rajdhani';
      ctx.fillText(u.desc, x + cw / 2 | 0, y + 105 | 0);
      ctx.fillStyle = sel ? '#fff' : '#555566';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('[' + (i + 1) + ']', x + cw / 2 | 0, y + ch - 8 | 0);
      ctx.restore();
    }

    ctx.fillStyle = '#888899';
    ctx.font = '12px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('1-3 ile seç', E.W / 2 | 0, E.H - 40);
  },

  drawDead(ctx) {
    const E = G.Engine;

    const og = ctx.createRadialGradient(E.W / 2, E.H / 3, 0, E.W / 2, E.H / 2, E.H);
    og.addColorStop(0, 'rgba(20,0,0,0.85)');
    og.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = og;
    ctx.fillRect(0, 0, E.W, E.H);

    ctx.save();
    ctx.shadowColor = '#ff0044';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff0044';
    ctx.font = '900 38px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', E.W / 2 | 0, 100);
    ctx.restore();

    const items = [
      { l: 'SKOR', v: E.score, c: E.getBiome().accent },
      { l: 'SÜRE', v: Math.floor(E.gameTime) + 's', c: '#888899' },
      { l: 'LEVEL', v: E.level, c: '#ffaa00' },
      { l: 'COMBO', v: 'x' + G.Combo.count, c: '#ffaa00' }
    ];
    let y = 150;
    for (const it of items) {
      ctx.fillStyle = '#556677';
      ctx.font = '11px Orbitron';
      ctx.textAlign = 'right';
      ctx.fillText(it.l, E.W / 2 - 15, y);
      ctx.fillStyle = it.c;
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('' + it.v, E.W / 2 + 15, y);
      y += 25;
    }

    y += 10;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('ÖDÜLLER', E.W / 2 | 0, y);
    y += 20;
    ctx.fillStyle = E.getBiome().accent;
    ctx.font = 'bold 15px monospace';
    ctx.fillText('+' + E.level * 10 + ' XP  +' + (E.score * 0.05 | 0) + ' Coin', E.W / 2 | 0, y | 0);

    y = E.H - 80;
    ctx.fillStyle = E.getBiome().accent;
    ctx.font = 'bold 16px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('▶ TEKRAR OYNA (ENTER)', E.W / 2 | 0, y | 0);
    ctx.fillStyle = '#666677';
    ctx.fillText('◀ ANA MENÜ (ESC)', E.W / 2 | 0, y + 25 | 0);
  },

  drawHowToPlay(ctx) {
    const E = G.Engine;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, E.W, E.H);

    const pages = [
      { title: 'Kontroller', lines: ['↑↓←→ veya WASD — Hareket', 'SPACE — Dash (varsa)', 'ENTER — Seçim / Başla', 'ESC — Pause / Geri', '1-2-3 — Upgrade seç'] },
      { title: 'Yemler', lines: ['🍎 Elma — +1 puan, +5 XP', '⭐ Altın Elma — +5 puan, +15 XP', '💎 Kristal — +25 XP', '❤️ Kalp — +1 can', '⏱️ Saat — Yavaşlatma', '💣 Bomba — Hasar!', '☠️ Zehir — Kuyruk kısaltır', '🧲 Mıknatıs — Yem çeker', '🍀 Şanslı — Rastgele', '✨ Yıldız — Dokunulmaz', '🪙 Coin — Para'] },
      { title: 'Engeller & İpuçları', lines: ['🧱 Kaya — Hareketi engeller', '🔥 Lava — Üzerinde durursan hasar', '❄️ Buz — Kayma, yön değişimi zor', '⚡ Elektrik — Periyodik hasar', 'Her 5 levelde boss savaşı', 'Combo ile daha fazla puan', 'Farklı biome lar farklı düşmanlar'] }
    ];

    const p = pages[E.howToPlayPage] || pages[0];
    ctx.fillStyle = E.getBiome().accent;
    ctx.font = 'bold 28px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(p.title, E.W / 2 | 0, 80);

    ctx.fillStyle = '#ccccee';
    ctx.font = '16px Rajdhani';
    let y = 130;
    for (const line of p.lines) {
      ctx.fillText(line, E.W / 2 | 0, y);
      y += 28;
    }

    ctx.fillStyle = '#666677';
    ctx.font = '13px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('Sayfa ' + (E.howToPlayPage + 1) + '/3  •  ← →  •  ENTER/ESC', E.W / 2 | 0, E.H - 30);
  },

  drawSettings(ctx) {
    const E = G.Engine;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, E.W, E.H);

    ctx.fillStyle = E.getBiome().accent;
    ctx.font = 'bold 28px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('AYARLAR', E.W / 2 | 0, 80);

    const items = [
      { label: 'Ses', val: Math.round(G.Save.data.settings.sound * 100) + '%', type: 'slider' },
      { label: 'Ekran Sarsıntısı', val: G.Save.data.settings.shake ? 'AÇIK' : 'KAPALI', type: 'toggle' },
      { label: 'Parçacıklar', val: G.Save.data.settings.particles ? 'AÇIK' : 'KAPALI', type: 'toggle' },
      { label: 'Parlama Efekti', val: G.Save.data.settings.glow ? 'AÇIK' : 'KAPALI', type: 'toggle' },
      { label: '⚠️ Kaydı Sıfırla', val: '', type: 'action' }
    ];

    let y = 140;
    for (let i = 0; i < items.length; i++) {
      const sel = i === E.settingsIdx;
      ctx.fillStyle = sel ? E.getBiome().accent : '#888899';
      ctx.font = (sel ? 'bold ' : '') + '16px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText(items[i].label + (items[i].val ? ': ' + items[i].val : ''), E.W / 2 | 0, y);
      if (sel) {
        ctx.fillStyle = E.getBiome().accent + '44';
        ctx.fillRect(E.W / 2 - 120, y - 14, 240, 20);
      }
      y += 30;
    }

    ctx.fillStyle = '#666677';
    ctx.font = '13px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ Seç  •  ← → Değiştir  •  ENTER/ESC', E.W / 2 | 0, E.H - 30);
  },

  drawSkins(ctx) {
    const E = G.Engine;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, E.W, E.H);

    ctx.fillStyle = E.getBiome().accent;
    ctx.font = 'bold 28px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('SKİNLER', E.W / 2 | 0, 50);

    const startY = 80;
    for (let i = 0; i < Math.min(8, G.Config.SKINS.length); i++) {
      const idx = E.skinScroll + i;
      if (idx >= G.Config.SKINS.length) break;
      const skin = G.Config.SKINS[idx];
      const unlocked = G.Save.data.unlockedSkins.includes(skin.id);
      const equipped = G.Save.data.equippedSkin === skin.id;
      const y = startY + i * 55;

      ctx.save();
      ctx.fillStyle = equipped ? E.getBiome().accent + '22' : '#111122';
      ctx.fillRect(100, y, 600, 45);
      ctx.strokeStyle = unlocked ? skin.glow + '66' : '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(100, y, 600, 45);

      const g = ctx.createRadialGradient(130, y + 22, 0, 130, y + 22, 12);
      g.addColorStop(0, skin.head);
      g.addColorStop(1, skin.body);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(130, y + 22, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = unlocked ? '#fff' : '#555';
      ctx.font = 'bold 15px Rajdhani';
      ctx.textAlign = 'left';
      ctx.fillText(skin.name, 160, y + 20);
      ctx.fillStyle = unlocked ? '#888' : '#444';
      ctx.font = '12px Rajdhani';
      let unlockText = 'Kilitli';
      if (unlocked) unlockText = equipped ? '✓ Giyili' : 'Kilidi Açık';
      else if (skin.unlock && skin.unlock.coins) unlockText = '🔒 ' + skin.unlock.coins + ' Coin';
      else if (skin.unlock && skin.unlock.achievement) unlockText = '🔒 Başarım';
      ctx.fillText(unlockText, 160, y + 36);
      ctx.restore();
    }

    ctx.fillStyle = '#666677';
    ctx.font = '13px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ Seç  •  ENTER Giy  •  ESC', E.W / 2 | 0, E.H - 20);
  }
};
