// ============================================================
// main.js — Başlangıç, Init, Boot
// ============================================================
window.G = window.G || {};

(function () {
  'use strict';

  /**
   * Oyunu başlat
   */
  function boot() {
    // Save yükle
    G.Save.init();

    // Ses (user interaction sonrası)
    const initAudio = () => {
      G.Audio.init();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    document.addEventListener('touchstart', initAudio);

    // Günlük görev sıfırlama kontrolü
    checkDailyReset();

    // Motoru başlat
    G.Game.init();
  }

  /**
   * Günlük görev sıfırlama
   */
  function checkDailyReset() {
    const today = new Date().toISOString().slice(0, 10);
    const savedDate = G.Save.get('dailyQuests.date');
    if (savedDate !== today) {
      G.Save.set('dailyQuests.date', today);
      G.Save.set('dailyQuests.progress', { food: 0, levels: 0, bosses: 0, games: 0 });
      G.Save.set('dailyQuests.completed', []);
    }
  }

  // Sayfa yüklendiğinde başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
