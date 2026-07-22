// ============================================================
// config.js — Oyun Verileri
// ============================================================
window.G = window.G || {};

G.Config = {
  // Sabitler
  W: 800, H: 600, GS: 20,
  MAX_ENEMIES: 4,
  MAX_FOOD: 12,
  MAX_PARTICLES: 150,
  COMBO_TIMER: 3.5,
  SPAWN_INTERVAL: 1.0,
  BOSS_SPAWN_INTERVAL: 12,
  START_HP: 4,
  START_SPEED: 4,
  MAX_SPEED: 9,
  SPEED_PER_LEVEL: 0.12,
  XP_MULTIPLIER: 1.10,
  INITIAL_XP: 30,
  get COLS() { return this.W / this.GS; },
  get ROWS() { return this.H / this.GS; },
  PI2: Math.PI * 2,

  BIOMES: [
    { name: 'Neon City', bg: '#06060f', grid: '#0c0c1e', wall: '#14142e', wallG: '#1e1e48', accent: '#00ffd5', accent2: '#ff2d95' },
    { name: 'Frozen Lab', bg: '#040810', grid: '#0a1420', wall: '#0c1e3a', wallG: '#163058', accent: '#00c8ff', accent2: '#0066ff' },
    { name: 'Lava Core', bg: '#100404', grid: '#200a0a', wall: '#301212', wallG: '#4a1a1a', accent: '#ff4400', accent2: '#ffaa00' },
    { name: 'Cyber Forest', bg: '#040a04', grid: '#0a180a', wall: '#0a280a', wallG: '#1a481a', accent: '#44ff00', accent2: '#00ff88' },
    { name: 'Space Station', bg: '#04040a', grid: '#12121e', wall: '#18182a', wallG: '#282848', accent: '#aa00ff', accent2: '#ff00ff' },
    { name: 'Void', bg: '#020204', grid: '#06060e', wall: '#080814', wallG: '#14142a', accent: '#ff00aa', accent2: '#aa00ff' }
  ],

  FOOD_TYPES: [
    { type: 'normal', color: '#ff2244', w: 30, sc: 1, len: 1, xp: 5, hp: 0, icon: '🍎' },
    { type: 'golden', color: '#ffaa00', w: 12, sc: 5, len: 2, xp: 15, hp: 0, icon: '⭐' },
    { type: 'crystal', color: '#aa44ff', w: 10, sc: 0, len: 0, xp: 25, hp: 0, icon: '💎' },
    { type: 'heart', color: '#ff44aa', w: 12, sc: 0, len: 0, xp: 0, hp: 1, icon: '❤️' },
    { type: 'clock', color: '#4488ff', w: 8, sc: 0, len: 0, xp: 3, hp: 0, icon: '⏱️', effect: 'slow' },
    { type: 'bomb', color: '#ff6600', w: 4, sc: 0, len: 0, xp: 0, hp: 0, icon: '💣', effect: 'bomb' },
    { type: 'poison', color: '#44ff00', w: 5, sc: 0, len: -2, xp: 0, hp: 0, icon: '☠️' },
    { type: 'magnet', color: '#00ffcc', w: 8, sc: 0, len: 0, xp: 5, hp: 0, icon: '🧲', effect: 'magnet' },
    { type: 'lucky', color: '#ffffff', w: 5, sc: 0, len: 0, xp: 10, hp: 0, icon: '🍀', effect: 'lucky' },
    { type: 'star', color: '#ffffff', w: 5, sc: 0, len: 0, xp: 0, hp: 0, icon: '✨', effect: 'invincible' },
    { type: 'coin', color: '#ffcc00', w: 10, sc: 2, len: 0, xp: 3, hp: 0, icon: '🪙', effect: 'coin' }
  ],

  ENEMY_TYPES: [
    { type: 'bug', speed: 1.5, hp: 1, color: '#ff2244', ai: 'wander' },
    { type: 'snake', speed: 2, hp: 1, color: '#44ff22', ai: 'chase' },
    { type: 'bomber', speed: 2.5, hp: 1, color: '#ff8800', ai: 'bomber' },
    { type: 'drone', speed: 0, hp: 3, color: '#4488ff', ai: 'turret' },
    { type: 'ghost', speed: 1, hp: 5, color: '#aaaaff', ai: 'ghost' },
    { type: 'chaser', speed: 2, hp: 2, color: '#ff4444', ai: 'chase' }
  ],

  BOSS_TYPES: [
    { name: 'Dev Solucan', color: '#aa44ff', hp: 20 },
    { name: 'Lazer Küp', color: '#0088ff', hp: 30 },
    { name: 'Manyetik Çekirdek', color: '#00ffcc', hp: 40 },
    { name: 'Elektrik Küresi', color: '#ffff00', hp: 50 },
    { name: 'AI Yılan', color: '#ff0044', hp: 65 },
    { name: 'Void Lord', color: '#ff00aa', hp: 80 }
  ],

  SKINS: [
    { id: 'default', name: 'Default', head: '#00ffd5', body: '#00aa88', glow: '#00ffd5' },
    { id: 'robot', name: 'Robot', head: '#8888aa', body: '#555577', glow: '#8888ff', unlock: { coins: 100 } },
    { id: 'dragon', name: 'Dragon', head: '#ff3300', body: '#cc2200', glow: '#ff4400', unlock: { achievement: 'boss_hunter' } },
    { id: 'ghost', name: 'Ghost', head: '#aaaaff', body: '#8888cc', glow: '#ccccff', unlock: { coins: 150 } },
    { id: 'fire', name: 'Fire', head: '#ff4400', body: '#ff2200', glow: '#ff6600', unlock: { coins: 200 } },
    { id: 'ice', name: 'Ice', head: '#00ccff', body: '#0088cc', glow: '#44ddff', unlock: { coins: 150 } },
    { id: 'cyber', name: 'Cyber', head: '#00ff88', body: '#00cc66', glow: '#44ffaa', unlock: { coins: 200 } },
    { id: 'gold', name: 'Gold', head: '#ffcc00', body: '#cc9900', glow: '#ffdd44', unlock: { coins: 300 } },
    { id: 'galaxy', name: 'Galaxy', head: '#6600cc', body: '#4400aa', glow: '#8822ff', unlock: { coins: 400 } },
    { id: 'neon', name: 'Neon', head: '#ff00ff', body: '#cc00cc', glow: '#ff44ff', unlock: { coins: 250 } },
    { id: 'matrix', name: 'Matrix', head: '#00ff00', body: '#008800', glow: '#44ff44', unlock: { achievement: 'speed_demon' } },
    { id: 'ocean', name: 'Ocean', head: '#0066ff', body: '#0044cc', glow: '#4488ff', unlock: { coins: 200 } },
    { id: 'sunset', name: 'Sunset', head: '#ff4466', body: '#cc2244', glow: '#ff6688', unlock: { coins: 300 } },
    { id: 'toxic', name: 'Toxic', head: '#88ff00', body: '#66cc00', glow: '#aaff44', unlock: { coins: 250 } },
    { id: 'shadow', name: 'Shadow', head: '#333344', body: '#222233', glow: '#4444aa', unlock: { achievement: 'survivor' } },
    { id: 'crystal', name: 'Crystal', head: '#88ccff', body: '#66aadd', glow: '#aaddff', unlock: { achievement: 'explorer' } },
    { id: 'diamond', name: 'Diamond', head: '#ccddff', body: '#aabbdd', glow: '#ddeeff', unlock: { coins: 500 } },
    { id: 'void', name: 'Void', head: '#ff0088', body: '#cc0066', glow: '#ff44aa', unlock: { achievement: 'coin_master' } },
    { id: 'rainbow', name: 'Rainbow', head: '#ff0000', body: '#00ff00', glow: '#0000ff', rainbow: true, unlock: { achievement: 'combo_master' } },
    { id: 'pixel', name: 'Pixel', head: '#ff8844', body: '#cc6622', glow: '#ffaa66', unlock: { coins: 100 } }
  ],

  ALL_UPGRADES: [
    { id: 'speed', name: 'Hız Artışı', desc: '+%20 hız', icon: '🏃', rarity: 'common' },
    { id: 'hp', name: 'Extra Can', desc: '+1 max can', icon: '❤️', rarity: 'common' },
    { id: 'heal', name: 'İyileşme', desc: 'Canı doldur', icon: '💚', rarity: 'common' },
    { id: 'longTail', name: 'Uzun Kuyruk', desc: '+3 uzunluk', icon: '📏', rarity: 'common' },
    { id: 'magnet', name: 'Mıknatıs', desc: 'Yemleri çeker', icon: '🧲', rarity: 'common' },
    { id: 'score2x', name: '2x Puan', desc: 'Çift puan', icon: '💯', rarity: 'uncommon' },
    { id: 'xp2x', name: '2x XP', desc: 'Çift XP', icon: '📈', rarity: 'uncommon' },
    { id: 'shield', name: 'Kalkan', desc: '3 sn dokunulmaz', icon: '🛡️', rarity: 'uncommon' },
    { id: 'dash', name: 'Dash', desc: 'SPACE ile atıl', icon: '💨', rarity: 'uncommon' },
    { id: 'fireTail', name: 'Ateş Kuyruk', desc: 'Düşman hasar', icon: '🔥', rarity: 'uncommon' },
    { id: 'iceTail', name: 'Buz Kuyruk', desc: 'Düşman yavaşlar', icon: '❄️', rarity: 'uncommon' },
    { id: 'chainCombo', name: 'Zincir Combo', desc: 'Combo +1 sn', icon: '🔗', rarity: 'uncommon' },
    { id: 'radar', name: 'Radar', desc: 'Yakındaki yem/düşman', icon: '📡', rarity: 'uncommon' },
    { id: 'armor', name: 'Zırh', desc: '2 sn hasar azalt', icon: '🔰', rarity: 'rare' },
    { id: 'golden', name: 'Altın Dokunuş', desc: 'Altın elma +%20', icon: '🥇', rarity: 'rare' },
    { id: 'heartFind', name: 'Kalp Avcısı', desc: 'Kalp +%15', icon: '💕', rarity: 'rare' },
    { id: 'luckyDrop', name: 'Şanslı Düşme', desc: 'Coin +%30', icon: '🍀', rarity: 'rare' },
    { id: 'critical', name: 'Kritik Yem', desc: '%15 şansla 2x', icon: '🎯', rarity: 'rare' },
    { id: 'ghost', name: 'Ghost Mode', desc: '5 sn duvar geç', icon: '👻', rarity: 'rare' },
    { id: 'teleport', name: 'Teleport', desc: 'Rastgele ışınlan', icon: '🌀', rarity: 'rare' },
    { id: 'autoCollect', name: 'Otomatik', desc: '3 sn de 1 yem', icon: '🧲', rarity: 'rare' },
    { id: 'poisonTail', name: 'Zehir Kuyruk', desc: 'Düşman zehirler', icon: '☠️', rarity: 'rare' },
    { id: 'elecTail', name: 'Elektrik Kuyruk', desc: 'Sersemletir', icon: '⚡', rarity: 'rare' },
    { id: 'phase', name: 'Phase Shift', desc: '3 sn düşman geç', icon: '✨', rarity: 'epic' },
    { id: 'momentum', name: 'Momentum', desc: 'Durmadan hızlan', icon: '⚡', rarity: 'epic' },
    { id: 'regen', name: 'Yenilenme', desc: '10 sn de 1 can', icon: '💚', rarity: 'epic' },
    { id: 'blastGuard', name: 'Patlama Kalkanı', desc: 'Patlamadan hasar almaz', icon: '💥', rarity: 'epic' },
    { id: 'foodBoom', name: 'Yem Patlaması', desc: 'Yakındakiler toplanır', icon: '💣', rarity: 'epic' },
    { id: 'thickTail', name: 'Kalın Kuyruk', desc: '2 tile genişlik', icon: '📐', rarity: 'epic' },
    { id: 'explodingTail', name: 'Patlayan Kuyruk', desc: 'Kuyruk patlar', icon: '💥', rarity: 'epic' },
    { id: 'drone', name: 'Mini Drone', desc: 'Düşman hasar', icon: '🤖', rarity: 'epic' },
    { id: 'turbo', name: 'Turbo', desc: '3 sn +%50 hız', icon: '🚀', rarity: 'epic' },
    { id: 'secondLife', name: 'İkinci Hayat', desc: 'Ölünce 1 kez diril', icon: '💖', rarity: 'legendary' },
    { id: 'clone', name: 'Klon Yılan', desc: 'Otomatik yem toplar', icon: '🐍', rarity: 'legendary' },
    { id: 'timeFreeze', name: 'Zaman Dondurma', desc: '5 sn her şey durur', icon: '⏸️', rarity: 'legendary' },
    { id: 'chainTail', name: 'Zincir Kuyruk', desc: 'Zincir hasar', icon: '⛓️', rarity: 'legendary' },
    { id: 'vortex', name: 'Vortex', desc: 'Sürekli yem çekme', icon: '🌀', rarity: 'legendary' },
    { id: 'lucky', name: 'Şanslı', desc: 'Tüm rastgele +%20', icon: '🍀', rarity: 'legendary' }
  ],

  RARITY_W: { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 },

  DAILY_QUESTS: [
    { id: 'food50', desc: '50 yem topla', target: 50, type: 'food', reward: { coins: 20 } },
    { id: 'food100', desc: '100 yem topla', target: 100, type: 'food', reward: { coins: 50 } },
    { id: 'score500', desc: '500 skor yap', target: 500, type: 'score', reward: { coins: 30 } },
    { id: 'score2000', desc: '2000 skor yap', target: 2000, type: 'score', reward: { coins: 100 } },
    { id: 'games3', desc: '3 oyun oyna', target: 3, type: 'games', reward: { coins: 15 } },
    { id: 'level5', desc: 'Level 5 e ulaş', target: 5, type: 'level', reward: { coins: 40 } }
  ],

  ACHIEVEMENTS: [
    { id: 'first_blood', name: 'İlk Kan', desc: 'İlk yemi ye', icon: '🍎', check: (s) => s.totalFood >= 1 },
    { id: 'hungry', name: 'Aç', desc: '100 yem ye', icon: '🍽️', check: (s) => s.totalFood >= 100 },
    { id: 'glutton', name: 'Obur', desc: '500 yem ye', icon: '🐷', check: (s) => s.totalFood >= 500 },
    { id: 'combo_master', name: 'Combo Ustası', desc: 'x10 combo', icon: '🔥', check: (s) => s.maxCombo >= 10 },
    { id: 'boss_hunter', name: 'Boss Avcısı', desc: 'Boss kes', icon: '🏆', check: (s) => s.bossKills >= 1 },
    { id: 'survivor', name: 'Hayatta Kalan', desc: '10 dk', icon: '⏱️', check: (s) => s.longestTime >= 600 },
    { id: 'speed_demon', name: 'Hız Canavarı', desc: 'Level 20', icon: '🚀', check: (s) => s.maxLevel >= 20 },
    { id: 'explorer', name: 'Kaşif', desc: '3 biome', icon: '🗺️', check: (s) => s.biomesVisited >= 3 },
    { id: 'coin_master', name: 'Coin Ustası', desc: '1000 coin', icon: '💰', check: (s) => s.totalCoins >= 1000 }
  ]
};
