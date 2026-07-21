// ============================================================
// ui.js — Arayüz Sistemi (Menü, HUD, Overlay, Bildirim)
// ============================================================
window.G = window.G || {};

G.UI = {
  _notifications: [],
  _tooltips: [],

  init() {
    this._notifications = [];
    this._tooltips = [];
  },

  /**
   * Bildirim ekle
   */
  notify(text, color = '#ffffff', duration = 3) {
    this._notifications.push({
      text,
      color,
      timer: duration,
      y: 0
    });
    // Son 5 bildirimi tut
    if (this._notifications.length > 5) {
      this._notifications.shift();
    }
  },

  /**
   * Başarım toast
   */
  achievementToast(achievement) {
    this.notify(`🏆 ${achievement.name}: ${achievement.desc}`, '#ffaa00', 4);
  },

  /**
   * Güncelle
   */
  update(dt) {
    // Bildirimler
    for (let i = this._notifications.length - 1; i >= 0; i--) {
      this._notifications[i].timer -= dt;
      if (this._notifications[i].timer <= 0) {
        this._notifications.splice(i, 1);
      }
    }
  },

  // --- ÇİZİM FONKSİYONLARI ---

  /**
   * Ana menü çiz
   */
  drawMainMenu(ctx, selectedIdx) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;
    const now = Date.now();

    // Başlık (animasyonlu glow)
    ctx.save();
    const titleGlow = 15 + Math.sin(now / 800) * 8;
    if (G.Save.get('settings.glow') !== false) {
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = titleGlow;
    }
    ctx.fillStyle = '#00ffcc';
    ctx.font = "900 46px 'Orbitron', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SNAKE', W / 2, 90);
    ctx.font = "700 32px 'Orbitron', monospace";
    ctx.fillStyle = '#ff2d95';
    ctx.shadowColor = '#ff2d95';
    ctx.fillText('EVOLUTION', W / 2, 130);
    ctx.restore();

    // Neon çizgi (gradient)
    const lineGrad = ctx.createLinearGradient(W/2 - 180, 0, W/2 + 180, 0);
    lineGrad.addColorStop(0, '#00ffcc00');
    lineGrad.addColorStop(0.3, '#00ffcc88');
    lineGrad.addColorStop(0.5, '#00ffcc');
    lineGrad.addColorStop(0.7, '#00ffcc88');
    lineGrad.addColorStop(1, '#00ffcc00');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 180, 150);
    ctx.lineTo(W / 2 + 180, 150);
    ctx.stroke();

    // Alt başlık
    ctx.fillStyle = '#55667788';
    ctx.font = "12px 'Share Tech Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('A ROGUELIKE SNAKE EXPERIENCE', W / 2, 165);

    // Butonlar (profesyonel)
    const buttons = ['PLAY', 'HOW TO PLAY', 'UPGRADES', 'STATISTICS', 'SETTINGS', 'CREDITS'];
    const btnIcons = ['▶', '?', '↑', '📊', '⚙', 'ℹ'];
    const startY = 200;
    const spacing = 46;
    const btnW = 240;
    const btnH = 36;

    for (let i = 0; i < buttons.length; i++) {
      const y = startY + i * spacing;
      const selected = i === selectedIdx;
      const bx = W / 2 - btnW / 2;

      ctx.save();

      // Buton arka planı (gradient)
      if (selected) {
        const selGrad = ctx.createLinearGradient(bx, y - btnH/2, bx, y + btnH/2);
        selGrad.addColorStop(0, '#00ffcc18');
        selGrad.addColorStop(1, '#00ffcc08');
        ctx.fillStyle = selGrad;
        this._roundRect(ctx, bx, y - btnH/2, btnW, btnH, 6);
        ctx.fill();

        // Sol vurgu çizgisi
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(bx, y - btnH/2 + 4, 2, btnH - 8);

        // Glow
        if (G.Save.get('settings.glow') !== false) {
          ctx.shadowColor = '#00ffcc';
          ctx.shadowBlur = 10;
        }
      }

      // Buton kenarlığı
      ctx.strokeStyle = selected ? '#00ffcc44' : '#ffffff11';
      ctx.lineWidth = 1;
      this._roundRect(ctx, bx, y - btnH/2, btnW, btnH, 6);
      ctx.stroke();

      // Buton yazısı
      ctx.fillStyle = selected ? '#00ffcc' : '#667788';
      ctx.font = (selected ? "bold " : "") + "16px 'Rajdhani', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(buttons[i], W / 2, y);

      ctx.restore();
    }

    // Versiyon
    ctx.fillStyle = '#333344';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('v1.0', 10, H - 10);

    // "Press ENTER or click to select"
    const pulse = Math.sin(now / 500) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(136,136,153,${pulse})`;
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ Navigate  •  ENTER Select', W / 2, H - 30);
  },

  /**
   * HUD çiz (oyun içi)
   */
  drawHUD(ctx) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;
    const game = G.Game;
    const player = G.Player;

    if (!game || !player) return;

    // Skor
    ctx.save();
    if (G.Save.get('settings.glow') !== false) {
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 8;
    }
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${G.Utils.formatNumber(game.score)}`, 15, 30);
    ctx.restore();

    // Level
    ctx.fillStyle = '#888899';
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`LVL ${game.level}`, 15, 52);

    // Level bar
    const barW = 120;
    const barH = 6;
    const barX = 60;
    const barY = 46;
    const xpPercent = game.xp / game.xpToNext;
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(barX, barY, barW * xpPercent, barH);
    ctx.strokeStyle = '#00ffcc44';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // Can
    const heartY = 70;
    for (let i = 0; i < player.getMaxHp(); i++) {
      ctx.fillStyle = i < player.getHp() ? '#ff44aa' : '#333344';
      this._drawHeartIcon(ctx, 20 + i * 22, heartY, 8);
    }

    // Shield göstergesi
    if (player.hasShield()) {
      ctx.fillStyle = '#00aaff';
      ctx.font = '14px Arial';
      ctx.fillText('🛡️', 20 + player.getMaxHp() * 22 + 5, heartY + 5);
    }

    // Combo
    if (G.Combo.isActive()) {
      const combo = G.Combo.getCount();
      const mult = G.Combo.getMultiplier();
      const comboY = 50;
      const scale = 1 + G.Combo.getDisplayTimer() * 0.3;

      ctx.save();
      ctx.translate(W / 2, comboY);
      ctx.scale(scale, scale);

      if (G.Save.get('settings.glow') !== false) {
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 15;
      }
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`COMBO x${combo}`, 0, 0);

      if (mult > 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
        ctx.fillText(`(${mult}x)`, 0, 22);
      }

      ctx.restore();
    }

    // Boss HP bar
    if (G.Boss.isActive()) {
      const bossHp = G.Boss.hp;
      const bossMaxHp = G.Boss.maxHp;
      const bossBarW = W * 0.6;
      const bossBarH = 12;
      const bossBarX = (W - bossBarW) / 2;
      const bossBarY = H - 40;

      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(bossBarX - 1, bossBarY - 1, bossBarW + 2, bossBarH + 2);
      ctx.fillStyle = '#ff0044';
      ctx.fillRect(bossBarX, bossBarY, bossBarW * (bossHp / bossMaxHp), bossBarH);
      ctx.strokeStyle = '#ff4488';
      ctx.lineWidth = 1;
      ctx.strokeRect(bossBarX, bossBarY, bossBarW, bossBarH);

      // Boss ismi
      ctx.fillStyle = '#ff4488';
      ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(G.Boss.active ? G.Boss.active.name : 'BOSS', W / 2, bossBarY - 8);
    }

    // FPS
    if (G.Save.get('settings.showFPS')) {
      ctx.fillStyle = '#666666';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`FPS: ${G.Renderer.getFPS()}`, W - 10, 15);
    }

    // Mini harita
    this._drawMiniMap(ctx);

    // Bildirimler
    this._drawNotifications(ctx);
  },

  _drawHeartIcon(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x - size, y - size * 0.5, x - size * 0.5, y - size, x, y - size * 0.3);
    ctx.bezierCurveTo(x + size * 0.5, y - size, x + size, y - size * 0.5, x, y + size * 0.3);
    ctx.fill();
  },

  _drawMiniMap(ctx) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;
    const mapW = 80;
    const mapH = 60;
    const mapX = W - mapW - 10;
    const mapY = H - mapH - 10;
    const scaleX = mapW / G.Config.COLS;
    const scaleY = mapH / G.Config.ROWS;

    ctx.save();
    ctx.globalAlpha = 0.5;

    // Arka plan
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = '#1a1a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    // Oyuncu
    if (G.Player && G.Player.isAlive()) {
      const head = G.Player.getHead();
      ctx.fillStyle = '#00ffcc';
      ctx.fillRect(mapX + head.x * scaleX, mapY + head.y * scaleY, 3, 3);
    }

    // Düşmanlar
    ctx.fillStyle = '#ff4444';
    for (const e of G.Enemy.enemies) {
      ctx.fillRect(mapX + e.x * scaleX, mapY + e.y * scaleY, 2, 2);
    }

    // Yemler
    ctx.fillStyle = '#ffaa00';
    for (const f of G.Food.items) {
      ctx.fillRect(mapX + f.x * scaleX, mapY + f.y * scaleY, 2, 2);
    }

    ctx.restore();
  },

  _drawNotifications(ctx) {
    const W = G.Config.CANVAS_WIDTH;
    let y = 100;

    for (const n of this._notifications) {
      const alpha = Math.min(1, n.timer);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = n.color;
      ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';

      if (G.Save.get('settings.glow') !== false) {
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 8;
      }

      ctx.fillText(n.text, W / 2, y);
      ctx.restore();
      y += 25;
    }
  },

  /**
   * Level up ekranı çiz
   */
  drawLevelUp(ctx, choices, selectedIndex) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;

    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);

    // Başlık
    ctx.save();
    if (G.Save.get('settings.glow') !== false) {
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 20;
    }
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⬆ LEVEL UP! ⬆', W / 2, 100);
    ctx.restore();

    // Kartlar
    const cardW = 180;
    const cardH = 220;
    const cardSpacing = 30;
    const totalW = choices.length * cardW + (choices.length - 1) * cardSpacing;
    const startX = (W - totalW) / 2;

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      const x = startX + i * (cardW + cardSpacing);
      const y = 150;
      const selected = i === selectedIndex;
      const rarityColor = G.Config.RARITY_COLORS[choice.rarity] || G.Config.RARITY_COLORS.common;

      ctx.save();

      // Kart arka planı (gradient)
      const cardGrad = ctx.createLinearGradient(x, y, x, y + cardH);
      cardGrad.addColorStop(0, selected ? '#1a1a3a' : '#0e0e1e');
      cardGrad.addColorStop(1, selected ? '#0a0a2a' : '#060612');
      ctx.fillStyle = cardGrad;
      this._roundRect(ctx, x, y, cardW, cardH, 10);
      ctx.fill();

      // Border (gradient)
      const borderGrad = ctx.createLinearGradient(x, y, x, y + cardH);
      borderGrad.addColorStop(0, rarityColor.main);
      borderGrad.addColorStop(1, rarityColor.main + '44');
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = selected ? 2.5 : 1;
      this._roundRect(ctx, x, y, cardW, cardH, 10);
      ctx.stroke();

      // Glow
      if (selected && G.Save.get('settings.glow') !== false) {
        ctx.shadowColor = rarityColor.main;
        ctx.shadowBlur = 20;
        ctx.strokeStyle = rarityColor.main + '88';
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, x, y, cardW, cardH, 10);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Rarity band (üst)
      ctx.fillStyle = rarityColor.main + '22';
      this._roundRect(ctx, x, y, cardW, 30, 10);
      ctx.fill();
      ctx.fillStyle = rarityColor.main + '44';
      ctx.fillRect(x, y + 20, cardW, 10);

      // Rarity yazısı
      ctx.fillStyle = rarityColor.main;
      ctx.font = "bold 10px 'Orbitron', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(choice.rarity.toUpperCase(), x + cardW / 2, y + 15);

      // İkon (büyük, ortalanmış)
      ctx.font = '44px Arial';
      ctx.fillText(choice.icon || '⬆', x + cardW / 2, y + 65);

      // İsim (Orbitron)
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 15px 'Orbitron', monospace";
      ctx.fillText(choice.name, x + cardW / 2, y + 105);

      // Ayırıcı çizgi
      ctx.strokeStyle = rarityColor.main + '44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 20, y + 120);
      ctx.lineTo(x + cardW - 20, y + 120);
      ctx.stroke();

      // Açıklama (Rajdhani)
      ctx.fillStyle = '#b0b0cc';
      ctx.font = "13px 'Rajdhani', sans-serif";
      const words = choice.desc.split(' ');
      let line = '';
      let lineY = y + 140;
      for (const word of words) {
        const test = line + (line ? ' ' : '') + word;
        if (ctx.measureText(test).width > cardW - 24) {
          ctx.fillText(line, x + cardW / 2, lineY);
          line = word;
          lineY += 16;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, x + cardW / 2, lineY);

      // Tuş göstergesi
      ctx.fillStyle = selected ? '#ffffff' : '#555566';
      ctx.font = "bold 14px 'Share Tech Mono', monospace";
      ctx.fillText(`[${i + 1}]`, x + cardW / 2, y + cardH - 12);

      ctx.restore();
    }

    // Alt bilgi
    ctx.fillStyle = '#888899';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1-3 ile seç veya tıkla', W / 2, H - 50);
  },

  /**
   * Game Over ekranı çiz
   */
  drawGameOver(ctx, stats) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;
    const now = Date.now();

    // Overlay (gradient)
    const overlay = ctx.createRadialGradient(W/2, H/3, 0, W/2, H/2, H);
    overlay.addColorStop(0, 'rgba(20,0,0,0.85)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, W, H);

    // Game Over başlığı (animasyonlu)
    ctx.save();
    const titlePulse = 18 + Math.sin(now / 600) * 8;
    if (G.Save.get('settings.glow') !== false) {
      ctx.shadowColor = '#ff0044';
      ctx.shadowBlur = titlePulse;
    }
    ctx.fillStyle = '#ff0044';
    ctx.font = "900 44px 'Orbitron', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME', W / 2, 90);
    ctx.fillStyle = '#ff2d66';
    ctx.fillText('OVER', W / 2, 135);
    ctx.restore();

    // Neon çizgi (gradient)
    const lineGrad = ctx.createLinearGradient(W/2 - 150, 0, W/2 + 150, 0);
    lineGrad.addColorStop(0, '#ff004400');
    lineGrad.addColorStop(0.3, '#ff004488');
    lineGrad.addColorStop(0.5, '#ff0044');
    lineGrad.addColorStop(0.7, '#ff004488');
    lineGrad.addColorStop(1, '#ff004400');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 150, 155);
    ctx.lineTo(W / 2 + 150, 155);
    ctx.stroke();

    // İstatistikler (profesyonel)
    if (stats) {
      const items = [
        { label: 'SCORE', value: G.Utils.formatNumber(stats.score), color: '#00ffcc' },
        { label: 'TIME', value: G.Utils.formatTime(stats.time), color: '#888899' },
        { label: 'FOOD', value: stats.food, color: '#ffaa00' },
        { label: 'COMBO', value: `x${stats.combo}`, color: '#ffaa00' },
        { label: 'KILLED BY', value: stats.killedBy || 'Unknown', color: '#ff4444' }
      ];

      let y = 185;
      for (const item of items) {
        // Label
        ctx.fillStyle = '#556677';
        ctx.font = "11px 'Orbitron', monospace";
        ctx.textAlign = 'right';
        ctx.fillText(item.label, W / 2 - 15, y);
        // Value
        ctx.fillStyle = item.color;
        ctx.font = "bold 16px 'Share Tech Mono', monospace";
        ctx.textAlign = 'left';
        ctx.fillText(String(item.value), W / 2 + 15, y);
        y += 28;
      }

      // Ayırıcı çizgi
      ctx.strokeStyle = '#ffffff11';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W/2 - 120, y + 5);
      ctx.lineTo(W/2 + 120, y + 5);
      ctx.stroke();

      // Kazanılanlar (ödüller)
      y += 25;
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 14px 'Orbitron', monospace";
      ctx.textAlign = 'center';
      ctx.fillText('REWARDS', W / 2, y);
      y += 25;

      // XP
      ctx.fillStyle = '#00ffcc';
      ctx.font = "bold 18px 'Share Tech Mono', monospace";
      ctx.fillText(`+${stats.xpEarned} XP`, W / 2 - 60, y);
      // Coin
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(`+${stats.coinsEarned} COIN`, W / 2 + 60, y);
      // Gem
      if (stats.gemsEarned > 0) {
        y += 25;
        ctx.fillStyle = '#aa44ff';
        ctx.fillText(`+${stats.gemsEarned} GEM`, W / 2, y);
      }
    }

    // Butonlar
    const btnY = H - 100;
    const buttons = ['PLAY AGAIN', 'MAIN MENU'];
    const selectedIdx = stats ? (stats.selectedBtn || 0) : 0;

    for (let i = 0; i < buttons.length; i++) {
      const bx = W / 2 - 100 + i * 200;
      const selected = i === selectedIdx;

      ctx.save();
      if (selected && G.Save.get('settings.glow') !== false) {
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = selected ? '#00ffcc' : '#666677';
      ctx.font = `${selected ? 'bold ' : ''}18px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(buttons[i], bx, btnY);
      ctx.restore();
    }
  },

  /**
   * Pause ekranı çiz
   */
  drawPause(ctx) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (G.Save.get('settings.glow') !== false) {
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 15;
    }
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2 - 20);

    ctx.fillStyle = '#888899';
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Press ESC to resume', W / 2, H / 2 + 20);
    ctx.restore();
  },

  /**
   * How to Play çiz
   */
  drawHowToPlay(ctx, page) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;
    const pages = [
      {
        title: 'Controls',
        items: [
          '↑↓←→ or WASD — Move',
          'SPACE — Dash / Special',
          'ESC — Pause',
          '1-2-3 — Select upgrade'
        ]
      },
      {
        title: 'Food Types',
        items: [
          '🍎 Red Apple — Score +1',
          '⭐ Golden Apple — Score +5',
          '💎 Crystal — XP',
          '❤️ Heart — HP +1',
          '🕐 Clock — Slow Motion',
          '💣 Bomb — Explodes!',
          '☠️ Poison — Shrinks you',
          '🧲 Magnet — Pulls food',
          '🍀 Lucky — Random effect',
          '⭐ Star — Invincible',
          '🪙 Coin — Permanent currency'
        ]
      },
      {
        title: 'Tips',
        items: [
          'Collect food to level up',
          'Choose upgrades wisely',
          'Watch out for enemies',
          'Boss every 10 levels',
          'Combo for bonus score',
          'Coins unlock skins!'
        ]
      }
    ];

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, H);

    const p = pages[page] || pages[0];

    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.title, W / 2, 60);

    ctx.fillStyle = '#ccccee';
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    let y = 110;
    for (const item of p.items) {
      ctx.fillText(item, W / 2, y);
      y += 28;
    }

    // Sayfa göstergesi
    ctx.fillStyle = '#666677';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Page ${page + 1}/${pages.length}  •  ← → Navigate  •  ESC Back`, W / 2, H - 30);
  },

  /**
   * Settings çiz
   */
  drawSettings(ctx, settings, selectedIdx) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SETTINGS', W / 2, 60);

    const items = [
      { label: 'Sound', value: `${Math.round((settings.soundVolume || 0.7) * 100)}%`, type: 'slider' },
      { label: 'Music', value: `${Math.round((settings.musicVolume || 0.5) * 100)}%`, type: 'slider' },
      { label: 'Screen Shake', value: settings.screenShake !== false ? 'ON' : 'OFF', type: 'toggle' },
      { label: 'Glow Effects', value: settings.glow !== false ? 'ON' : 'OFF', type: 'toggle' },
      { label: 'Particles', value: settings.particles !== false ? 'ON' : 'OFF', type: 'toggle' },
      { label: 'Show FPS', value: settings.showFPS ? 'ON' : 'OFF', type: 'toggle' },
      { label: 'Color Blind Mode', value: settings.colorBlind ? 'ON' : 'OFF', type: 'toggle' },
      { label: 'Fullscreen', value: document.fullscreenElement ? 'ON' : 'OFF', type: 'toggle' },
      { label: 'Reset Save', value: '', type: 'button' },
      { label: 'Export Save', value: '', type: 'button' },
      { label: 'Import Save', value: '', type: 'button' },
      { label: 'Back', value: '', type: 'button' }
    ];

    let y = 110;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const selected = i === selectedIdx;

      ctx.save();

      if (selected) {
        ctx.fillStyle = '#00ffcc11';
        ctx.fillRect(W / 2 - 200, y - 14, 400, 28);
      }

      ctx.fillStyle = selected ? '#00ffcc' : '#888899';
      ctx.font = `${selected ? 'bold ' : ''}16px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(item.label, W / 2 - 180, y + 5);

      if (item.value) {
        ctx.textAlign = 'right';
        ctx.fillText(item.value, W / 2 + 180, y + 5);
      }

      ctx.restore();
      y += 35;
    }

    ctx.fillStyle = '#666677';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓ Navigate  •  ← → Adjust  •  ESC Back', W / 2, H - 30);
  },

  /**
   * Statistics çiz
   */
  drawStatistics(ctx) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;
    const stats = G.Save.get('stats') || {};

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STATISTICS', W / 2, 60);

    const items = [
      { label: 'High Score', value: G.Utils.formatNumber(stats.highScore || 0) },
      { label: 'Total Games', value: stats.totalGames || 0 },
      { label: 'Total Time', value: G.Utils.formatTime(stats.totalTime || 0) },
      { label: 'Total Food Eaten', value: G.Utils.formatNumber(stats.totalFood || 0) },
      { label: 'Boss Kills', value: stats.totalBossKills || 0 },
      { label: 'Total Deaths', value: stats.totalDeaths || 0 },
      { label: 'Longest Combo', value: `x${stats.longestCombo || 0}` },
      { label: 'Longest Survival', value: G.Utils.formatTime(stats.longestSurvival || 0) },
      { label: 'Total Coins Earned', value: G.Utils.formatNumber(stats.totalCoins || 0) },
      { label: 'Total XP Earned', value: G.Utils.formatNumber(stats.totalXp || 0) }
    ];

    let y = 110;
    for (const item of items) {
      ctx.fillStyle = '#888899';
      ctx.font = '16px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(item.label + ':', W / 2 - 10, y);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(String(item.value), W / 2 + 10, y);
      y += 30;
    }

    ctx.fillStyle = '#666677';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESC Back', W / 2, H - 30);
  },

  /**
   * Credits çiz
   */
  drawCredits(ctx) {
    const W = G.Config.CANVAS_WIDTH;
    const H = G.Config.CANVAS_HEIGHT;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (G.Save.get('settings.glow') !== false) {
      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 15;
    }
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CREDITS', W / 2, 80);
    ctx.restore();

    const lines = [
      { text: 'Snake Evolution', color: '#ffffff', size: 20 },
      { text: 'A Roguelite Snake Game', color: '#888899', size: 14 },
      { text: '', color: '', size: 0 },
      { text: 'Made with ❤️ and Vanilla JS', color: '#ff44aa', size: 16 },
      { text: 'No frameworks. No dependencies.', color: '#888899', size: 14 },
      { text: 'Pure HTML + CSS + Canvas + Web Audio', color: '#888899', size: 14 },
      { text: '', color: '', size: 0 },
      { text: 'v1.0', color: '#666677', size: 12 }
    ];

    let y = 140;
    for (const line of lines) {
      if (!line.text) { y += 20; continue; }
      ctx.fillStyle = line.color;
      ctx.font = `${line.size}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(line.text, W / 2, y);
      y += line.size + 10;
    }

    ctx.fillStyle = '#666677';
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.fillText('ESC Back', W / 2, H - 30);
  },

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
};
