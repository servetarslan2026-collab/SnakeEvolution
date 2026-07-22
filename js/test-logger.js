// ============================================================
// test-logger.js — Otomatik Hata Yakalama ve Raporlama
// ============================================================
window.G = window.G || {};

G.Logger = {
  errors: [],
  warnings: [],
  stats: {
    frames: 0,
    startTime: 0,
    crashes: 0,
    lastError: null
  },

  init() {
    this.errors = [];
    this.warnings = [];
    this.stats = { frames: 0, startTime: Date.now(), crashes: 0, lastError: null };

    // Global error yakalama
    window.onerror = (msg, src, line, col, err) => {
      this.logError('RUNTIME', msg, { src, line, col, stack: err?.stack });
      return false;
    };

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (e) => {
      this.logError('PROMISE', e.reason?.message || e.reason, { stack: e.reason?.stack });
    });

    // Canvas error yakalama
    const origDraw = G.Engine?.draw;
    if (G.Engine && origDraw) {
      const self = this;
      G.Engine.draw = function() {
        try {
          origDraw.call(this);
        } catch(e) {
          self.logError('DRAW', e.message, { stack: e.stack });
        }
      };
    }

    // Game loop error yakalama
    const origLoop = G.Engine?.loop;
    if (G.Engine && origLoop) {
      const self = this;
      G.Engine.loop = function(now) {
        try {
          self.stats.frames++;
          origLoop.call(this, now);
        } catch(e) {
          self.logError('LOOP', e.message, { stack: e.stack });
        }
      };
    }

    console.log('[Logger] Initialized — monitoring all game systems');
  },

  logError(type, message, details) {
    const error = {
      type,
      message,
      details,
      time: Date.now(),
      gameState: G.Engine?.state,
      level: G.Engine?.level,
      frame: this.stats.frames
    };
    this.errors.push(error);
    this.stats.lastError = error;
    this.stats.crashes++;
    console.error(`[Logger] ${type}: ${message}`, details);
  },

  logWarning(type, message) {
    const warning = { type, message, time: Date.now() };
    this.warnings.push(warning);
    console.warn(`[Logger] WARN ${type}: ${message}`);
  },

  // Periyodik sağlık kontrolü
  healthCheck() {
    const issues = [];

    // Snake kontrolü
    if (G.Snake) {
      if (G.Snake.alive && G.Snake.hp <= 0) issues.push('Snake alive but HP <= 0');
      if (G.Snake.alive && G.Snake.segments.length === 0) issues.push('Snake alive but no segments');
      if (G.Snake.speed <= 0) issues.push('Snake speed <= 0');
      if (G.Snake.speed > 20) issues.push('Snake speed > 20: ' + G.Snake.speed);
      if (G.Snake.maxHp <= 0) issues.push('Snake maxHp <= 0');
      if (G.Snake.hp > G.Snake.maxHp) issues.push('Snake HP > maxHp');
      if (!Array.isArray(G.Snake.segments)) issues.push('Snake segments not array');
      if (!Array.isArray(G.Snake.renderPos)) issues.push('Snake renderPos not array');
      if (G.Snake.segments.length !== G.Snake.renderPos.length) issues.push('segments/renderPos length mismatch');
      if (G.Snake.dirQueue && !Array.isArray(G.Snake.dirQueue)) issues.push('dirQueue not array');
    }

    // Food kontrolü
    if (G.Food) {
      if (!Array.isArray(G.Food.items)) issues.push('Food items not array');
      if (G.Food.items.length > G.Food.maxFood + 2) issues.push('Food count exceeds max: ' + G.Food.items.length);
      for (let i = 0; i < G.Food.items.length; i++) {
        const f = G.Food.items[i];
        if (typeof f.x !== 'number' || typeof f.y !== 'number') issues.push(`Food[${i}] invalid position`);
        if (f.x < 0 || f.y < 0) issues.push(`Food[${i}] negative position: ${f.x},${f.y}`);
        if (!f.type) issues.push(`Food[${i}] missing type`);
        if (!f.color) issues.push(`Food[${i}] missing color`);
      }
    }

    // Enemies kontrolü
    if (G.Enemies) {
      if (!Array.isArray(G.Enemies.list)) issues.push('Enemies list not array');
      for (let i = 0; i < G.Enemies.list.length; i++) {
        const e = G.Enemies.list[i];
        if (typeof e.x !== 'number' || typeof e.y !== 'number') issues.push(`Enemy[${i}] invalid position`);
        if (e.speed < 0) issues.push(`Enemy[${i}] negative speed`);
        if (!e.type) issues.push(`Enemy[${i}] missing type`);
        if (!e.ai) issues.push(`Enemy[${i}] missing AI`);
        if (e.alive && e.hp <= 0) issues.push(`Enemy[${i}] alive but HP <= 0`);
      }
    }

    // Boss kontrolü
    if (G.Boss && G.Boss.active) {
      const b = G.Boss.active;
      if (typeof b.x !== 'number' || typeof b.y !== 'number') issues.push('Boss invalid position');
      if (b.alive && b.hp <= 0) issues.push('Boss alive but HP <= 0');
      if (b.phase < 0 || b.phase > 2) issues.push('Boss invalid phase: ' + b.phase);
    }

    // Combo kontrolü
    if (G.Combo) {
      if (G.Combo.count < 0) issues.push('Combo count < 0');
      if (G.Combo.multiplier < 1) issues.push('Combo multiplier < 1');
      if (G.Combo.timer < 0) issues.push('Combo timer < 0');
    }

    // Engine kontrolü
    if (G.Engine) {
      if (G.Engine.level < 1) issues.push('Level < 1');
      if (G.Engine.xp < 0) issues.push('XP < 0');
      if (G.Engine.score < 0) issues.push('Score < 0');
      if (G.Engine.fps < 10 && G.Engine.state === 'play') issues.push('FPS critically low: ' + G.Engine.fps);
    }

    return issues;
  },

  // Rapor oluştur
  getReport() {
    const issues = this.healthCheck();
    const runtime = (Date.now() - this.stats.startTime) / 1000;
    return {
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        totalFrames: this.stats.frames,
        runtimeSeconds: Math.round(runtime),
        fps: Math.round(this.stats.frames / runtime),
        healthIssues: issues.length
      },
      errors: this.errors.slice(-10),
      warnings: this.warnings.slice(-10),
      healthIssues: issues,
      gameState: {
        state: G.Engine?.state,
        level: G.Engine?.level,
        score: G.Engine?.score,
        snakeAlive: G.Snake?.alive,
        snakeHP: G.Snake?.hp,
        snakeSpeed: G.Snake?.speed,
        foodCount: G.Food?.items?.length,
        enemyCount: G.Enemies?.list?.length,
        bossActive: G.Boss?.isActive?.()
      }
    };
  },

  // Konsola rapor yazdır
  printReport() {
    const r = this.getReport();
    console.log('\n========== GAME HEALTH REPORT ==========');
    console.log(`Frames: ${r.summary.totalFrames} | Runtime: ${r.summary.runtimeSeconds}s | FPS: ${r.summary.fps}`);
    console.log(`Errors: ${r.summary.totalErrors} | Warnings: ${r.summary.totalWarnings}`);
    console.log(`Health Issues: ${r.summary.healthIssues}`);
    if (r.healthIssues.length > 0) {
      console.log('\n⚠️ ISSUES:');
      r.healthIssues.forEach(i => console.log('  - ' + i));
    }
    if (r.errors.length > 0) {
      console.log('\n❌ RECENT ERRORS:');
      r.errors.forEach(e => console.log(`  [${e.type}] ${e.message}`));
    }
    console.log('\nGame State:', JSON.stringify(r.gameState, null, 2));
    console.log('==========================================\n');
    return r;
  }
};
