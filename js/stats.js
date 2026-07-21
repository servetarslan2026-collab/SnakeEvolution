// ============================================================
// stats.js — İstatistik, Başarım, Günlük Görev
// ============================================================
window.G = window.G || {};

G.Stats = {
  _session: null,

  /**
   * Yeni oyun oturumu başlat
   */
  startSession() {
    this._session = {
      score: 0,
      food: 0,
      level: 0,
      combo: 0,
      maxCombo: 0,
      bossKills: 0,
      startTime: Date.now(),
      killedBy: null,
      biomes: new Set(),
      ghostFood: 0,
      magnetFood: 0,
      luckyFood: 0,
      noHitBoss: true,
      noDeath: true,
      xpEarned: 0,
      coinsEarned: 0,
      gemsEarned: 0
    };
  },

  /**
   * Yem toplandığında
   */
  onFood(foodType) {
    if (!this._session) return;
    this._session.food++;
    G.Save.add('stats.totalFood', 1);

    // Günlük görev
    G.Save.add('dailyQuests.progress.food', 1);

    // Özel yem sayaçları
    if (foodType === 'lucky') {
      this._session.luckyFood++;
    }

    // Başarım kontrolü
    this._checkAchievement('food', G.Save.get('stats.totalFood'));
  },

  /**
   * Level atladığında
   */
  onLevelUp(level) {
    if (!this._session) return;
    this._session.level = level;
    G.Save.add('dailyQuests.progress.levels', 1);
    this._checkAchievement('level', level);
  },

  /**
   * Combo arttığında
   */
  onCombo(count) {
    if (!this._session) return;
    if (count > this._session.maxCombo) {
      this._session.maxCombo = count;
    }
    if (count > (G.Save.get('stats.longestCombo') || 0)) {
      G.Save.set('stats.longestCombo', count);
    }
    this._checkAchievement('combo', count);
  },

  /**
   * Boss kesildiğinde
   */
  onBossKill() {
    if (!this._session) return;
    this._session.bossKills++;
    G.Save.add('stats.totalBossKills', 1);
    G.Save.add('dailyQuests.progress.bosses', 1);
    this._checkAchievement('boss', G.Save.get('stats.totalBossKills'));
  },

  /**
   * Hasar alındığında
   */
  onDamage() {
    if (!this._session) return;
    this._session.noHitBoss = false;
  },

  /**
   * Biome keşfedildiğinde
   */
  onBiomeEnter(biome) {
    if (!this._session) return;
    this._session.biomes.add(biome);
    if (this._session.biomes.size >= 3) {
      this._unlockAchievement('explorer');
    }
    // Biome unlock
    G.Save.push('unlocks.biomes', biome);
  },

  /**
   * Oyun bittiğinde
   */
  endSession(score, level, killedBy) {
    if (!this._session) return null;

    const elapsed = Date.now() - this._session.startTime;
    this._session.score = score;
    this._session.level = level;
    this._session.killedBy = killedBy;

    // XP ve Coin hesapla (daha cömert)
    const xpEarned = Math.floor(score * 0.15) + level * 15;
    const coinsEarned = Math.floor(score * 0.08) + this._session.bossKills * 30;
    const gemsEarned = this._session.bossKills * 2;

    this._session.xpEarned = xpEarned;
    this._session.coinsEarned = coinsEarned;
    this._session.gemsEarned = gemsEarned;

    // Kalıcı ilerlemeye ekle
    G.Save.add('progress.xp', xpEarned);
    G.Save.add('progress.coins', coinsEarned);
    G.Save.add('progress.gems', gemsEarned);
    G.Save.add('stats.totalXp', xpEarned);
    G.Save.add('stats.totalCoins', coinsEarned);
    G.Save.add('stats.totalGames', 1);
    G.Save.add('stats.totalTime', elapsed);
    G.Save.add('stats.totalDeaths', 1);

    // High score
    if (score > (G.Save.get('stats.highScore') || 0)) {
      G.Save.set('stats.highScore', score);
    }

    // Longest survival
    if (elapsed > (G.Save.get('stats.longestSurvival') || 0)) {
      G.Save.set('stats.longestSurvival', elapsed);
    }

    // Başarımlar
    if (elapsed >= 600000) this._unlockAchievement('survivor'); // 10 dk
    if (elapsed >= 900000) this._unlockAchievement('immortal'); // 15 dk
    if (this._session.noDeath && level >= 15) this._unlockAchievement('perfect_run');

    // Günlük görev
    G.Save.add('dailyQuests.progress.games', 1);

    // Skin kilidi kontrolü
    G.Skin.checkUnlocks();

    // Seviye atlama
    this._checkLevelUp();

    G.Save.autoSave();

    return this._session;
  },

  /**
   * Günlük görev kontrolü ve ödül
   */
  checkDailyQuests() {
    const quests = G.Config.DAILY_QUESTS;
    const progress = G.Save.get('dailyQuests.progress') || {};
    const completed = G.Save.get('dailyQuests.completed') || [];

    for (const quest of quests) {
      if (completed.includes(quest.id)) continue;
      const current = progress[quest.type] || 0;
      if (current >= quest.target) {
        // Tamamlandı!
        completed.push(quest.id);
        G.Save.set('dailyQuests.completed', completed);

        // Ödül ver
        if (quest.reward.xp) G.Save.add('progress.xp', quest.reward.xp);
        if (quest.reward.coins) G.Save.add('progress.coins', quest.reward.coins);
        if (quest.reward.gems) G.Save.add('progress.gems', quest.reward.gems);

        // Bildirim
        G.UI.notify(`✅ ${quest.desc} — Reward: ${JSON.stringify(quest.reward)}`, '#44ff44', 4);
        G.Audio.play('victory');
      }
    }
  },

  /**
   * Seviye atlama kontrolü
   */
  _checkLevelUp() {
    const xp = G.Save.get('progress.xp') || 0;
    const currentLevel = G.Save.get('progress.level') || 1;
    const xpNeeded = currentLevel * 100; // Her seviye için 100 XP artar

    if (xp >= xpNeeded) {
      G.Save.set('progress.level', currentLevel + 1);
      G.Save.add('progress.xp', -xpNeeded);
    }
  },

  /**
   * Başarım kontrolü
   */
  _checkAchievement(type, value) {
    for (const ach of G.Config.ACHIEVEMENTS) {
      if (G.Save.has('achievements', ach.id)) continue;
      if (ach.condition.type === type && value >= ach.condition.count) {
        this._unlockAchievement(ach.id);
      }
    }
  },

  /**
   * Başarım aç
   */
  _unlockAchievement(id) {
    if (G.Save.has('achievements', id)) return;
    G.Save.push('achievements', id);

    const ach = G.Config.ACHIEVEMENTS.find(a => a.id === id);
    if (ach) {
      G.UI.achievementToast(ach);
      G.Audio.play('victory');
    }
  },

  getSession() { return this._session; }
};
