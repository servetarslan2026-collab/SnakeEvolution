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
    G.Save.data.totalCoins += Math.floor(score * 0.05);
    if (this.session.maxCombo > (G.Save.data.maxCombo || 0)) G.Save.data.maxCombo = this.session.maxCombo;
    if (this.session.bossKills > (G.Save.data.bossKills || 0)) G.Save.data.bossKills = this.session.bossKills;
    if (gameTime > (G.Save.data.longestTime || 0)) G.Save.data.longestTime = gameTime;
    if (level > (G.Save.data.maxLevel || 0)) G.Save.data.maxLevel = level;

    // Günlük görev güncelle
    this.updateDailyQuests(score, level);

    G.Save.autoSave();
    this.checkAchievements();
  },

  updateDailyQuests(score, level) {
    const today = new Date().toISOString().slice(0, 10);
    if (G.Save.data.dailyQuests.date !== today) {
      G.Save.data.dailyQuests = { date: today, food: 0, games: 0, score: 0, level: 0, completed: [] };
    }
    G.Save.data.dailyQuests.food += this.session.food;
    G.Save.data.dailyQuests.games++;
    G.Save.data.dailyQuests.score += score;
    G.Save.data.dailyQuests.level = Math.max(G.Save.data.dailyQuests.level || 0, level);

    // Tamamlanan görevleri kontrol et
    for (const q of G.Config.DAILY_QUESTS) {
      if (G.Save.data.dailyQuests.completed.includes(q.id)) continue;
      const progress = G.Save.data.dailyQuests[q.type] || 0;
      if (progress >= q.target) {
        G.Save.data.dailyQuests.completed.push(q.id);
        G.Save.data.coins += q.reward.coins;
        G.Engine.notify('📋 Görev Tamamlandı: ' + q.desc + ' +' + q.reward.coins + ' Coin', '#44ff44');
      }
    }
  },

  checkAchievements() {
    const s = G.Save.data;
    for (const ach of G.Config.ACHIEVEMENTS) {
      if (s.achievements.includes(ach.id)) continue;
      if (ach.check(s)) {
        s.achievements.push(ach.id);
        G.Engine.notify('🏆 ' + ach.name + ': ' + ach.desc, '#ffaa00');
        G.Audio.playTone(800, 0.15);

        // Skin unlock check
        for (const skin of G.Config.SKINS) {
          if (skin.unlock && skin.unlock.achievement === ach.id && !s.unlockedSkins.includes(skin.id)) {
            s.unlockedSkins.push(skin.id);
            G.Engine.notify('🎨 Yeni Skin: ' + skin.name, '#aa44ff');
          }
        }

        G.Save.write();
      }
    }
  }
};
