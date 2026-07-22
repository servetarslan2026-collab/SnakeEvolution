// ============================================================
// main.js — Başlangıç ve Input
// ============================================================
window.G = window.G || {};

(function () {
  'use strict';

  // Boot sequence
  function boot() {
    G.Save.load();
    G.Engine.init();

    // Audio init on user interaction
    const initAudio = () => {
      G.Audio.init();
      // Audio context'i resume et
      if (G.Audio.ctx && G.Audio.ctx.state === 'suspended') {
        G.Audio.ctx.resume().catch(() => {});
      }
      // Eğer oyun devam ediyorsa müziği başlat
      if (G.Engine.state === 'play' && !G.Audio.musicPlaying) {
        G.Audio.startMusic();
      }
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    document.addEventListener('touchstart', initAudio);

    // Input handlers
    setupInput();
    setupTouch();
  }

  function setupInput() {
    addEventListener('keydown', e => {
      const c = e.code;
      const E = G.Engine;

      // Direction keys — kuyruğa ekle (hızlı tuş basmalarını yakalar)
      if (c === 'ArrowUp' || c === 'KeyW') {
        e.preventDefault();
        if (E.state === 'play') { const d = { x: 0, y: -1 }; G.Snake.dirQueue.push(d); if (G.Snake.dirQueue.length > 3) G.Snake.dirQueue.shift(); }
        if (E.state === 'menu') E.selectedBtn = (E.selectedBtn - 1 + 5) % 5;
        if (E.state === 'howtoplay') E.howToPlayPage = Math.max(0, E.howToPlayPage - 1);
        if (E.state === 'settings') E.settingsIdx = Math.max(0, E.settingsIdx - 1);
        if (E.state === 'skins') E.skinScroll = Math.max(0, E.skinScroll - 1);
      }
      if (c === 'ArrowDown' || c === 'KeyS') {
        e.preventDefault();
        if (E.state === 'play') { const d = { x: 0, y: 1 }; G.Snake.dirQueue.push(d); if (G.Snake.dirQueue.length > 3) G.Snake.dirQueue.shift(); }
        if (E.state === 'menu') E.selectedBtn = (E.selectedBtn + 1) % 5;
        if (E.state === 'howtoplay') E.howToPlayPage = Math.min(2, E.howToPlayPage + 1);
        if (E.state === 'settings') E.settingsIdx = Math.min(6, E.settingsIdx + 1);
        if (E.state === 'skins') E.skinScroll = Math.min(G.Config.SKINS.length - 1, E.skinScroll + 1);
      }
      if (c === 'ArrowLeft' || c === 'KeyA') {
        e.preventDefault();
        if (E.state === 'play') { const d = { x: -1, y: 0 }; G.Snake.dirQueue.push(d); if (G.Snake.dirQueue.length > 3) G.Snake.dirQueue.shift(); }
        if (E.state === 'levelup') E.selectedUpgrade = (E.selectedUpgrade - 1 + 3) % 3;
        if (E.state === 'settings') {
          if (E.settingsIdx === 0) { G.Save.data.settings.sound = Math.max(0, G.Save.data.settings.sound - 0.1); G.Save.write(); }
          if (E.settingsIdx === 1) { G.Save.data.settings.music = Math.max(0, G.Save.data.settings.music - 0.1); G.Save.write(); G.Audio.setMusicVolume(G.Save.data.settings.music); }
          if (E.settingsIdx === 2) { G.Save.data.settings.shake = !G.Save.data.settings.shake; G.Save.write(); }
          if (E.settingsIdx === 3) { G.Save.data.settings.particles = !G.Save.data.settings.particles; G.Save.write(); }
          if (E.settingsIdx === 4) { G.Save.data.settings.glow = !G.Save.data.settings.glow; G.Save.write(); }
          if (E.settingsIdx === 5) { G.Save.data.settings.showFPS = !G.Save.data.settings.showFPS; G.Save.write(); }
        }
      }
      if (c === 'ArrowRight' || c === 'KeyD') {
        e.preventDefault();
        if (E.state === 'play') { const d = { x: 1, y: 0 }; G.Snake.dirQueue.push(d); if (G.Snake.dirQueue.length > 3) G.Snake.dirQueue.shift(); }
        if (E.state === 'levelup') E.selectedUpgrade = (E.selectedUpgrade + 1) % 3;
        if (E.state === 'settings') {
          if (E.settingsIdx === 0) { G.Save.data.settings.sound = Math.min(1, G.Save.data.settings.sound + 0.1); G.Save.write(); }
          if (E.settingsIdx === 1) { G.Save.data.settings.music = Math.min(1, G.Save.data.settings.music + 0.1); G.Save.write(); G.Audio.setMusicVolume(G.Save.data.settings.music); }
          if (E.settingsIdx === 2) { G.Save.data.settings.shake = !G.Save.data.settings.shake; G.Save.write(); }
          if (E.settingsIdx === 3) { G.Save.data.settings.particles = !G.Save.data.settings.particles; G.Save.write(); }
          if (E.settingsIdx === 4) { G.Save.data.settings.glow = !G.Save.data.settings.glow; G.Save.write(); }
          if (E.settingsIdx === 5) { G.Save.data.settings.showFPS = !G.Save.data.settings.showFPS; G.Save.write(); }
        }
      }

      // SPACE: only dash during gameplay
      if (c === 'Space' && E.state === 'play') {
        e.preventDefault();
        G.Snake.dash();
      }

      // ENTER: menu selections
      if (c === 'Enter') {
        e.preventDefault();
        G.Audio.init();
        if (E.state === 'menu') {
          if (E.selectedBtn === 0) E.startGame();
          else if (E.selectedBtn === 1) { E.state = 'howtoplay'; E.howToPlayPage = 0; }
          else if (E.selectedBtn === 2) { E.state = 'skins'; E.skinScroll = 0; }
          else if (E.selectedBtn === 3) { E.state = 'stats'; }
          else if (E.selectedBtn === 4) { E.state = 'settings'; E.settingsIdx = 0; }
        } else if (E.state === 'dead') {
          E.startGame();
        } else if (E.state === 'levelup') {
          E.applyUpgrade(E.upgradeChoices[E.selectedUpgrade]);
          E.state = 'play';
        } else if (E.state === 'howtoplay') {
          E.state = 'menu';
        } else if (E.state === 'settings') {
          if (E.settingsIdx === 6) {
            // Kaydı sıfırla
            G.Save.reset();
          } else {
            E.state = 'menu';
          }
        } else if (E.state === 'skins') {
          const skin = G.Config.SKINS[E.skinScroll];
          if (G.Save.data.unlockedSkins.includes(skin.id)) {
            G.Save.data.equippedSkin = skin.id;
            G.Save.write();
            E.notify('🎨 ' + skin.name + ' giyildi!', '#aa44ff');
          } else if (skin.unlock && skin.unlock.coins && G.Save.data.coins >= skin.unlock.coins) {
            G.Save.data.coins -= skin.unlock.coins;
            G.Save.data.unlockedSkins.push(skin.id);
            G.Save.data.equippedSkin = skin.id;
            G.Save.write();
            E.notify('🎨 ' + skin.name + ' açıldı ve giyildi!', '#aa44ff');
          } else {
            E.notify('🔒 Kilitli!', '#ff4444');
          }
        } else if (E.state === 'paused') {
          E.state = 'play';
        }
      }

      // ESCAPE: pause/back
      if (c === 'Escape') {
        if (E.state === 'play') { E.state = 'paused'; G.Audio.stopMusic(); }
        else if (E.state === 'paused') { E.state = 'play'; G.Audio.startMusic(); }
        else if (E.state === 'dead') E.state = 'menu';
        else if (E.state === 'levelup') { E.applyUpgrade(E.upgradeChoices[E.selectedUpgrade]); E.state = 'play'; }
        else if (E.state === 'stats') E.state = 'menu';
        else E.state = 'menu';
      }

      // Level up数字 keys
      if (E.state === 'levelup') {
        if (c === 'Digit1') { E.applyUpgrade(E.upgradeChoices[0]); E.state = 'play'; }
        if (c === 'Digit2') { E.applyUpgrade(E.upgradeChoices[1]); E.state = 'play'; }
        if (c === 'Digit3') { E.applyUpgrade(E.upgradeChoices[2]); E.state = 'play'; }
      }
    });
  }

  function setupTouch() {
    const canvas = document.getElementById('c');
    let touchStart = null;

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      G.Audio.init();
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      if (!touchStart) return;
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      const d = Math.hypot(dx, dy);
      const E = G.Engine;

      if (d < 15) {
        // Tap
        if (E.state === 'menu') {
          if (E.selectedBtn === 0) E.startGame();
          else if (E.selectedBtn === 1) E.state = 'howtoplay';
          else if (E.selectedBtn === 2) E.state = 'skins';
          else if (E.selectedBtn === 3) E.state = 'settings';
        }
        if (E.state === 'dead') E.startGame();
        if (E.state === 'levelup') { E.applyUpgrade(E.upgradeChoices[E.selectedUpgrade]); E.state = 'play'; }
        if (E.state === 'howtoplay' || E.state === 'settings' || E.state === 'skins') E.state = 'menu';
        if (E.state === 'paused') E.state = 'play';
      } else if (d > 30 && E.state === 'play') {
        // Swipe — kuyruğa ekle
        const dir = Math.abs(dx) > Math.abs(dy)
          ? { x: dx > 0 ? 1 : -1, y: 0 }
          : { x: 0, y: dy > 0 ? 1 : -1 };
        G.Snake.dirQueue.push(dir);
        if (G.Snake.dirQueue.length > 3) G.Snake.dirQueue.shift();
      }
      touchStart = null;
    }, { passive: false });
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
