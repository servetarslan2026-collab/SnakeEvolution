// ============================================================
// stats.js — İstatistik ve Başarım
// ============================================================
window.G = window.G || {};

G.Stats = {
  session: null,

  startSession() {
    this.session = {
      food: 0,
      maxCombo: 0,
      bossKills: 0,
      upgradesUsed: 0,
      startTime: Date.now()
    };
  },

  onFood(type) {
    if (!this.session) return;
    this.session.food++;
    G.Save.data.totalFood++;
    this.checkAchievements();
  },

  onCombo(count) {
    if (!this.session) return;
    if (count > this.session.maxCombo) this.session.maxCombo = count;
  },

  onBossKill() {
    if (!this.session) return;
    this.session.bossKills++;
    this.checkAchievements();
  },

  onUpgrade() {
    if (!this.session) return;
    this.session.upgradesUsed++;
  },

  onDeath(score, level, gameTime, reason) {
    if (!this.session) return;
    G.Save.data.totalGames++;
    G.Save.data.totalTime += gameTime;
    if (score > G.Save.data.highScore) G.Save.data.highScore = score;
    G.Save.data.coins += Math.floor(score * 0.05);
    G.Save.autoSave();
    this.checkAchievements();
  },

  checkAchievements() {
    const s = G.Save.data;
    for (const ach of G.Config.ACHIEVEMENTS) {
      if (s.achievements.includes(ach.id)) continue;
      if (ach.check(s)) {
        s.achievements.push(ach.id);
        G.Engine.notify('🏆 ' + ach.name + ': ' + ach.desc, '#ffaa00');
        G.Audio.playTone(800, 0.15);
        G.Save.write();
      }
    }
  }
};
