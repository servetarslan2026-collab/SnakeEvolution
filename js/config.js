// ============================================================
// config.js — Oyun Sabitleri ve Denge Değerleri
// ============================================================
window.G = window.G || {};

G.Config = {
  // Canvas
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 20,
  get COLS() { return this.CANVAS_WIDTH / this.GRID_SIZE; },   // 40
  get ROWS() { return this.CANVAS_HEIGHT / this.GRID_SIZE; },  // 30

  // Hız (daha yavaş başlangıç, kademeli artış)
  BASE_SPEED: 6,          // tile/sn başlangıç (8→6, yeni oyuncu dostu)
  MAX_SPEED: 20,          // tile/sn max (25→20, kontrol edilebilir)
  SPEED_INCREMENT: 0.2,   // her level'de artış (0.3→0.2, daha kademeli)

  // Oyuncu (daha dayanıklı başlangıç)
  PLAYER_START_HP: 4,     // 3→4, yeni oyuncular için daha affedici
  PLAYER_MAX_HP: 12,      // 10→12, late game dayanıklılık
  PLAYER_START_LENGTH: 3,
  DASH_DISTANCE: 3,       // tile
  DASH_COOLDOWN: 1.5,     // sn (2→1.5, daha responsive)
  INVINCIBLE_DURATION: 2.0, // sn (1.5→2.0, hasar sonrası nefes alma)
  GHOST_DURATION: 8,      // sn

  // Yem (daha hızlı spawn, daha fazla yem)
  MAX_FOOD: 10,           // 8→10, daha fazla toplanacak şey
  FOOD_SPAWN_INTERVAL: 1.5, // sn (2→1.5, daha sık spawn)
  FOOD_MAGNET_RANGE: 3,   // tile
  FOOD_MAGNET_SPEED: 5,   // tile/sn çekim hızı

  // Combo (daha geniş pencere, daha erişilebilir çarpanlar)
  COMBO_WINDOW: 3,        // sn (2→3, daha rahat combo)
  COMBO_MULTIPLIERS: [
    { threshold: 2,  mult: 2 },  // 3→2, daha erken başlar
    { threshold: 4,  mult: 3 },  // 5→4
    { threshold: 7,  mult: 5 },  // 8→7
    { threshold: 10, mult: 10 }, // 12→10
    { threshold: 15, mult: 20 }  // 20→15
  ],

  // Düşman (daha az, daha kontrollü)
  MAX_ENEMIES: 8,         // 15→8, ekran kalabalığı azalt
  ENEMY_SPAWN_INTERVAL: 8, // sn (5→8, daha seyrek)
  SAFE_ZONE_RADIUS: 6,    // tile (5→6, daha güvenli başlangıç)

  // Boss
  BOSS_INTERVAL: 10,       // her N level'de

  // Parçacık
  MAX_PARTICLES: 500,

  // Rarity ağırlıkları
  RARITY_WEIGHTS: {
    common: 50,
    uncommon: 30,
    rare: 15,
    epic: 4,
    legendary: 1
  },

  // Biome paletleri (profesyonel neon/cyberpunk)
  BIOMES: {
    neon_city: {
      name: 'Neon City',
      bg: '#06060f',
      grid: '#0c0c1e',
      gridAccent: '#121230',
      wall: '#14142e',
      wallGlow: '#1e1e48',
      accent: '#00ffd5',
      accent2: '#ff2d95',
      accent3: '#ffe14d',
      lava: '#ff3d00',
      ice: '#00d4ff',
      bush: '#003828',
      fog: '#0e0e20',
      electric: '#ffe14d',
      portal: '#b44dff'
    },
    frozen_lab: {
      name: 'Frozen Lab',
      bg: '#040810',
      grid: '#0a1420',
      gridAccent: '#101e30',
      wall: '#0c1e3a',
      wallGlow: '#163058',
      accent: '#00c8ff',
      accent2: '#0066ff',
      accent3: '#e0f0ff',
      lava: '#ff5500',
      ice: '#80e8ff',
      bush: '#002838',
      fog: '#081828',
      electric: '#4dc8ff',
      portal: '#0088ff'
    },
    lava_core: {
      name: 'Lava Core',
      bg: '#100404',
      grid: '#200a0a',
      gridAccent: '#301010',
      wall: '#301212',
      wallGlow: '#4a1a1a',
      accent: '#ff4400',
      accent2: '#ffaa00',
      accent3: '#ff1a44',
      lava: '#ff6600',
      ice: '#4488ff',
      bush: '#381800',
      fog: '#180a0a',
      electric: '#ffaa00',
      portal: '#ff4400'
    },
    cyber_forest: {
      name: 'Cyber Forest',
      bg: '#040a04',
      grid: '#0a180a',
      gridAccent: '#0f280f',
      wall: '#0a280a',
      wallGlow: '#1a481a',
      accent: '#44ff00',
      accent2: '#00ff88',
      accent3: '#88ff00',
      lava: '#ff2200',
      ice: '#00ccff',
      bush: '#004800',
      fog: '#081808',
      electric: '#88ff00',
      portal: '#00ff44'
    },
    space_station: {
      name: 'Space Station',
      bg: '#04040a',
      grid: '#12121e',
      gridAccent: '#18182a',
      wall: '#18182a',
      wallGlow: '#282848',
      accent: '#aa00ff',
      accent2: '#ff00ff',
      accent3: '#4400ff',
      lava: '#ff0066',
      ice: '#0044ff',
      bush: '#140028',
      fog: '#080818',
      electric: '#aa00ff',
      portal: '#6600cc'
    },
    void: {
      name: 'Void',
      bg: '#020204',
      grid: '#06060e',
      gridAccent: '#080814',
      wall: '#080814',
      wallGlow: '#14142a',
      accent: '#ff00aa',
      accent2: '#aa00ff',
      accent3: '#ff4488',
      lava: '#ff0044',
      ice: '#4400ff',
      bush: '#0a0018',
      fog: '#040408',
      electric: '#ff00aa',
      portal: '#ff0066'
    }
  },

  // Biome sırası
  BIOME_ORDER: ['neon_city', 'frozen_lab', 'lava_core', 'cyber_forest', 'space_station', 'void'],

  // Tile türleri
  TILE: {
    EMPTY: 0,
    WALL: 1,
    ROCK: 2,
    LAVA: 3,
    ICE: 4,
    BUSH: 5,
    FOG: 6,
    ELECTRIC: 7,
    PORTAL: 8,
    CRATE: 9
  },

  // Yem türleri (daha fazla faydalı yem, daha az tehlikeli)
  FOOD_TYPES: {
    normal:   { name: 'Elma',       color: '#ff2244', weight: 50, score: 1,  length: 1, xp: 0,  hp: 0, icon: 'apple' },
    golden:   { name: 'Altın Elma', color: '#ffaa00', weight: 12, score: 5,  length: 2, xp: 0,  hp: 0, icon: 'golden' },
    crystal:  { name: 'Kristal',    color: '#aa44ff', weight: 10, score: 0,  length: 0, xp: 25, hp: 0, icon: 'crystal' },
    heart:    { name: 'Kalp',       color: '#ff44aa', weight: 8,  score: 0,  length: 0, xp: 0,  hp: 1, icon: 'heart' },
    clock:    { name: 'Saat',       color: '#4488ff', weight: 5,  score: 0,  length: 0, xp: 0,  hp: 0, icon: 'clock', effect: 'slowmo' },
    bomb:     { name: 'Bomba',      color: '#ff6600', weight: 2,  score: 0,  length: 0, xp: 0,  hp: 0, icon: 'bomb', effect: 'bomb' },
    poison:   { name: 'Zehir',      color: '#44ff00', weight: 2,  score: 0,  length: -2,xp: 0,  hp: 0, icon: 'poison' },
    magnet:   { name: 'Manyetik',   color: '#00ffcc', weight: 4,  score: 0,  length: 0, xp: 0,  hp: 0, icon: 'magnet', effect: 'magnet' },
    lucky:    { name: 'Şanslı',     color: '#ffffff', weight: 3,  score: 0,  length: 0, xp: 0,  hp: 0, icon: 'lucky', effect: 'lucky' },
    star:     { name: 'Yıldız',     color: '#ffffff', weight: 2,  score: 0,  length: 0, xp: 0,  hp: 0, icon: 'star', effect: 'invincible' },
    coin:     { name: 'Coin',       color: '#ffcc00', weight: 5,  score: 0,  length: 0, xp: 0,  hp: 0, icon: 'coin', effect: 'coin' }
  },

  // Düşman türleri (daha yavaş, daha az HP)
  ENEMY_TYPES: {
    bug:       { name: 'Gezen Böcek',    speed: 2,  hp: 1,  color: '#ff2244', ai: 'wander',  damage: 1 },
    snake:     { name: 'Zehirli Yılan',   speed: 3,  hp: 1,  color: '#44ff22', ai: 'chase',   damage: 1 },
    bomber:    { name: 'Patlayan Top',    speed: 4,  hp: 1,  color: '#ff8800', ai: 'bomber',  damage: 1 },
    drone:     { name: 'Lazer Drone',     speed: 0,  hp: 2,  color: '#4488ff', ai: 'turret',  damage: 1 },
    ghost:     { name: 'Hayalet',         speed: 1,  hp: 999,color: '#aaaaff', ai: 'ghost',   damage: 1 },
    chaser:    { name: 'Takipçi Robot',   speed: 3,  hp: 1,  color: '#ff4444', ai: 'aggressive', damage: 1 }
  },

  // Boss tanımları (daha düşük HP, erken boss'lar erişilebilir)
  BOSS_TYPES: [
    { id: 'worm',     name: 'Dev Solucan',       hp: 15,  biome: 'neon_city',      color: '#aa44ff', attacks: ['burrow', 'slam'] },
    { id: 'cube',     name: 'Lazer Küp',          hp: 25,  biome: 'frozen_lab',     color: '#0088ff', attacks: ['laser_spin', 'laser_beam'] },
    { id: 'magnet',   name: 'Manyetik Çekirdek',  hp: 35,  biome: 'lava_core',      color: '#00ffcc', attacks: ['pull', 'pulse'] },
    { id: 'orb',      name: 'Elektrik Küresi',    hp: 50,  biome: 'cyber_forest',   color: '#ffff00', attacks: ['ring', 'chain'] },
    { id: 'ai_snake', name: 'AI Yılan',           hp: 65,  biome: 'space_station',  color: '#ff0044', attacks: ['mirror', 'clone'] },
    { id: 'void',     name: 'Void Lord',          hp: 80,  biome: 'void',           color: '#ff00aa', attacks: ['mixed', 'void_beam'] }
  ],

  // Skin listesi
  SKINS: [
    { id: 'default',  name: 'Default',   headColor: '#00ffcc', bodyColor: '#00aa88', glow: '#00ffcc', unlock: null },
    { id: 'robot',    name: 'Robot',     headColor: '#8888aa', bodyColor: '#555577', glow: '#8888ff', unlock: { type: 'coins', amount: 100 } },
    { id: 'dragon',   name: 'Dragon',    headColor: '#ff3300', bodyColor: '#cc2200', glow: '#ff4400', unlock: { type: 'achievement', id: 'boss_hunter' } },
    { id: 'ghost',    name: 'Ghost',     headColor: '#aaaaff', bodyColor: '#8888cc', glow: '#ccccff', unlock: { type: 'achievement', id: 'ghost_rider' } },
    { id: 'fire',     name: 'Fire',      headColor: '#ff4400', bodyColor: '#ff2200', glow: '#ff6600', unlock: { type: 'coins', amount: 200 } },
    { id: 'ice',      name: 'Ice',       headColor: '#00ccff', bodyColor: '#0088cc', glow: '#44ddff', unlock: { type: 'biome', id: 'frozen_lab' } },
    { id: 'cyber',    name: 'Cyber',     headColor: '#00ff88', bodyColor: '#00cc66', glow: '#44ffaa', unlock: { type: 'biome', id: 'cyber_forest' } },
    { id: 'rainbow',  name: 'Rainbow',   headColor: '#ff0000', bodyColor: '#00ff00', glow: '#0000ff', unlock: { type: 'achievement', id: 'combo_god' }, rainbow: true },
    { id: 'gold',     name: 'Gold',      headColor: '#ffcc00', bodyColor: '#cc9900', glow: '#ffdd44', unlock: { type: 'achievement', id: 'coin_master' } },
    { id: 'galaxy',   name: 'Galaxy',    headColor: '#6600cc', bodyColor: '#4400aa', glow: '#8822ff', unlock: { type: 'coins', amount: 500 } },
    { id: 'neon',     name: 'Neon',      headColor: '#ff00ff', bodyColor: '#cc00cc', glow: '#ff44ff', unlock: { type: 'biome', id: 'neon_city' } },
    { id: 'matrix',   name: 'Matrix',    headColor: '#00ff00', bodyColor: '#008800', glow: '#44ff44', unlock: { type: 'achievement', id: 'speed_demon' } },
    { id: 'pixel',    name: 'Pixel',     headColor: '#ff8844', bodyColor: '#cc6622', glow: '#ffaa66', unlock: { type: 'coins', amount: 150 } },
    { id: 'ocean',    name: 'Ocean',     headColor: '#0066ff', bodyColor: '#0044cc', glow: '#4488ff', unlock: { type: 'achievement', id: 'survivor' } },
    { id: 'sunset',   name: 'Sunset',    headColor: '#ff4466', bodyColor: '#cc2244', glow: '#ff6688', unlock: { type: 'coins', amount: 300 } },
    { id: 'toxic',    name: 'Toxic',     headColor: '#88ff00', bodyColor: '#66cc00', glow: '#aaff44', unlock: { type: 'achievement', id: 'glutton' } },
    { id: 'shadow',   name: 'Shadow',    headColor: '#333344', bodyColor: '#222233', glow: '#4444aa', unlock: { type: 'achievement', id: 'immortal' } },
    { id: 'crystal',  name: 'Crystal',   headColor: '#88ccff', bodyColor: '#66aadd', glow: '#aaddff', unlock: { type: 'achievement', id: 'explorer' } },
    { id: 'diamond',  name: 'Diamond',   headColor: '#ccddff', bodyColor: '#aabbdd', glow: '#ddeeff', unlock: { type: 'gems', amount: 10 } },
    { id: 'void',     name: 'Void',      headColor: '#ff0088', bodyColor: '#cc0066', glow: '#ff44aa', unlock: { type: 'biome', id: 'void' } }
  ],

  // Başarımlar
  ACHIEVEMENTS: [
    { id: 'first_blood',   name: 'First Blood',    desc: 'İlk yemi ye',               icon: '🍎', condition: { type: 'food', count: 1 } },
    { id: 'hungry',        name: 'Hungry',          desc: '100 yem ye',                icon: '🍽️', condition: { type: 'food', count: 100 } },
    { id: 'glutton',       name: 'Glutton',         desc: '500 yem ye',                icon: '🐷', condition: { type: 'food', count: 500 } },
    { id: 'combo_master',  name: 'Combo Master',    desc: 'x10 combo yap',             icon: '🔥', condition: { type: 'combo', count: 10 } },
    { id: 'combo_god',     name: 'Combo God',       desc: 'x20 combo yap',             icon: '⚡', condition: { type: 'combo', count: 20 } },
    { id: 'boss_hunter',   name: 'Boss Hunter',     desc: 'İlk boss\'u kes',           icon: '🏆', condition: { type: 'boss', count: 1 } },
    { id: 'boss_slayer',   name: 'Boss Slayer',     desc: '10 boss kes',               icon: '💀', condition: { type: 'boss', count: 10 } },
    { id: 'survivor',      name: 'Survivor',        desc: '10 dk hayatta kal',          icon: '⏱️', condition: { type: 'survival', seconds: 600 } },
    { id: 'immortal',      name: 'Immortal',        desc: '15 dk hayatta kal',          icon: '♾️', condition: { type: 'survival', seconds: 900 } },
    { id: 'speed_demon',   name: 'Speed Demon',     desc: 'Level 20\'ye ulaş',          icon: '🚀', condition: { type: 'level', count: 20 } },
    { id: 'explorer',      name: 'Explorer',        desc: '3 farklı biome keşfet',      icon: '🗺️', condition: { type: 'biome', count: 3 } },
    { id: 'collector',     name: 'Collector',       desc: '10 skin aç',                 icon: '🎨', condition: { type: 'skin', count: 10 } },
    { id: 'lucky',         name: 'Lucky',           desc: 'Şanslı yem 50 kez topla',    icon: '🍀', condition: { type: 'lucky_food', count: 50 } },
    { id: 'untouchable',   name: 'Untouchable',     desc: 'Hasar almadan boss kes',     icon: '🛡️', condition: { type: 'no_hit_boss' } },
    { id: 'ghost_rider',   name: 'Ghost Rider',     desc: 'Ghost mode\'da 50 yem topla',icon: '👻', condition: { type: 'ghost_food', count: 50 } },
    { id: 'magnet_king',   name: 'Magnet King',     desc: 'Manyetik ile 30 yem çek',    icon: '🧲', condition: { type: 'magnet_food', count: 30 } },
    { id: 'coin_master',   name: 'Coin Master',     desc: '1000 coin biriktir',          icon: '💰', condition: { type: 'coins', count: 1000 } },
    { id: 'perfect_run',   name: 'Perfect Run',     desc: 'Ölmeden level 15\'e ulaş',   icon: '✨', condition: { type: 'no_death_level', count: 15 } }
  ],

  // Günlük görevler
  DAILY_QUESTS: [
    { id: 'daily_food',   desc: '100 yem topla',   target: 100, reward: { xp: 50 },       type: 'food' },
    { id: 'daily_level',  desc: '5 level atla',     target: 5,   reward: { coins: 30 },     type: 'level' },
    { id: 'daily_boss',   desc: '1 boss kes',       target: 1,   reward: { gems: 1 },       type: 'boss' },
    { id: 'daily_games',  desc: '3 oyun oyna',       target: 3,   reward: { xp: 20 },       type: 'games' }
  ],

  // Upgrade havuzu (tam liste)
  UPGRADES: [
    // Hareket
    { id: 'speed_boost',      name: 'Speed Boost',         desc: '+%15 hız',                  category: 'movement', rarity: 'common',   icon: '🏃', apply: { speedMult: 0.15 } },
    { id: 'slow_control',     name: 'Slow Control',        desc: '-%10 hız, daha iyi kontrol', category: 'movement', rarity: 'common',   icon: '🐢', apply: { speedMult: -0.10 } },
    { id: 'dash',             name: 'Dash',                desc: 'Ani ileri atılma',            category: 'movement', rarity: 'uncommon', icon: '💨', apply: { dash: true } },
    { id: 'teleport',         name: 'Teleport',            desc: 'Rastgele güvenli nokta',      category: 'movement', rarity: 'rare',     icon: '🌀', apply: { teleport: true } },
    { id: 'ghost_mode',       name: 'Ghost Mode',          desc: 'Duvarlardan geç (8 sn)',      category: 'movement', rarity: 'rare',     icon: '👻', apply: { ghostDuration: 8 } },
    { id: 'phase_shift',      name: 'Phase Shift',         desc: 'Düşmanlardan geç (5 sn)',     category: 'movement', rarity: 'epic',     icon: '✨', apply: { phaseShift: 5 } },
    { id: 'turbo',            name: 'Turbo',               desc: '3 sn +%50 hız',               category: 'movement', rarity: 'uncommon', icon: '🚀', apply: { turbo: { mult: 0.5, dur: 3 } } },
    { id: 'momentum',         name: 'Momentum',            desc: 'Durmadan hızlan',              category: 'movement', rarity: 'epic',     icon: '⚡', apply: { momentum: true } },

    // Savunma
    { id: 'extra_heart',      name: 'Extra Heart',         desc: '+1 max can',                   category: 'defense',  rarity: 'common',   icon: '❤️', apply: { maxHp: 1 } },
    { id: 'shield',           name: 'Shield',              desc: 'Bir çarpışmayı absorbe et',    category: 'defense',  rarity: 'uncommon', icon: '🛡️', apply: { shield: 1 } },
    { id: 'blast_guard',      name: 'Blast Guard',         desc: 'Patlamalardan hasar almaz',    category: 'defense',  rarity: 'uncommon', icon: '💥', apply: { blastGuard: true } },
    { id: 'collision_forgive',name: 'Collision Forgiveness',desc: '3 sn çarpışma yok',           category: 'defense',  rarity: 'rare',     icon: '🤝', apply: { collisionForgive: 3 } },
    { id: 'second_life',      name: 'Second Life',         desc: 'Ölünce bir kez diril',         category: 'defense',  rarity: 'legendary',icon: '💖', apply: { secondLife: true } },
    { id: 'armor',            name: 'Armor',               desc: 'Tüm hasar -1',                  category: 'defense',  rarity: 'rare',     icon: '🔰', apply: { armor: 1 } },
    { id: 'regen',            name: 'Regen',               desc: '10 sn\'de 1 can yenile',        category: 'defense',  rarity: 'epic',     icon: '💚', apply: { regen: { amount: 1, interval: 10 } } },

    // Yem
    { id: 'magnet',           name: 'Magnet',              desc: 'Yakındaki yemleri çek (3 tile)', category: 'food',    rarity: 'common',   icon: '🧲', apply: { magnetRange: 3 } },
    { id: 'double_xp',        name: 'Double XP',           desc: '2x XP',                         category: 'food',    rarity: 'uncommon', icon: '📈', apply: { xpMult: 2 } },
    { id: 'double_score',     name: 'Double Score',        desc: '2x puan',                       category: 'food',    rarity: 'uncommon', icon: '💯', apply: { scoreMult: 2 } },
    { id: 'golden_touch',     name: 'Golden Touch',        desc: 'Altın elma şansı +%20',         category: 'food',    rarity: 'rare',     icon: '🥇', apply: { goldenChance: 0.20 } },
    { id: 'heart_find',       name: 'Heart Find',          desc: 'Kalp şansı +%15',               category: 'food',    rarity: 'rare',     icon: '💕', apply: { heartChance: 0.15 } },
    { id: 'food_explosion',   name: 'Food Explosion',      desc: 'Yem yedince yakındakiler toplanır', category: 'food', rarity: 'epic',  icon: '💣', apply: { foodExplosion: true } },
    { id: 'lucky_drop',       name: 'Lucky Drop',          desc: 'Coin düşme şansı +%30',         category: 'food',    rarity: 'uncommon', icon: '🍀', apply: { coinChance: 0.30 } },
    { id: 'critical_food',    name: 'Critical Food',       desc: '%15 şansla 2x etki',             category: 'food',    rarity: 'epic',     icon: '🎯', apply: { criticalFood: 0.15 } },

    // Kuyruk
    { id: 'fire_tail',        name: 'Fire Tail',           desc: 'Kuyruk düşmanlara hasar verir',  category: 'tail',    rarity: 'uncommon', icon: '🔥', apply: { tailType: 'fire' } },
    { id: 'ice_tail',         name: 'Ice Tail',            desc: 'Kuyruk düşmanları yavaşlatır',   category: 'tail',    rarity: 'uncommon', icon: '❄️', apply: { tailType: 'ice' } },
    { id: 'poison_tail',      name: 'Poison Tail',         desc: 'Kuyruk düşmanları zehirler',     category: 'tail',    rarity: 'rare',     icon: '☠️', apply: { tailType: 'poison' } },
    { id: 'electric_tail',    name: 'Electric Tail',       desc: 'Kuyruk düşmanları sersemletir',  category: 'tail',    rarity: 'rare',     icon: '⚡', apply: { tailType: 'electric' } },
    { id: 'exploding_tail',   name: 'Exploding Tail',      desc: 'Kuyruk segmentleri patlar',       category: 'tail',    rarity: 'epic',     icon: '💥', apply: { tailType: 'exploding' } },
    { id: 'long_tail',        name: 'Long Tail',           desc: '+5 max uzunluk',                  category: 'tail',    rarity: 'common',   icon: '📏', apply: { maxLength: 5 } },
    { id: 'thick_tail',       name: 'Thick Tail',          desc: 'Kuyruk 2 tile genişliğinde',      category: 'tail',    rarity: 'epic',     icon: '📐', apply: { thickTail: true } },
    { id: 'chain_tail',       name: 'Chain Tail',          desc: 'Kuyruk arası zincir hasar',       category: 'tail',    rarity: 'legendary',icon: '⛓️', apply: { chainTail: true } },

    // Özel
    { id: 'clone_snake',      name: 'Clone Snake',         desc: 'Mini klon (otomatik yem toplar)', category: 'special', rarity: 'legendary',icon: '🐍', apply: { clone: true } },
    { id: 'mini_drone',       name: 'Mini Drone',          desc: 'Dönen drone (düşman hasarı)',     category: 'special', rarity: 'epic',     icon: '🤖', apply: { drone: true } },
    { id: 'auto_collect',     name: 'Auto Collect',        desc: '3 sn\'de bir en yakın yem',       category: 'special', rarity: 'rare',     icon: '🧲', apply: { autoCollect: 3 } },
    { id: 'time_freeze',      name: 'Time Freeze',         desc: '5 sn düşmanlar durur',            category: 'special', rarity: 'legendary',icon: '⏸️', apply: { timeFreeze: 5 } },
    { id: 'chain_combo',      name: 'Chain Combo',         desc: 'Combo penceresi +1 sn',           category: 'special', rarity: 'uncommon', icon: '🔗', apply: { comboWindow: 1 } },
    { id: 'lucky',            name: 'Lucky',               desc: 'Tüm rastgelelik +%20 şans',       category: 'special', rarity: 'rare',     icon: '🍀', apply: { luck: 0.20 } },
    { id: 'radar',            name: 'Radar',               desc: 'Yakındaki yem ve düşman göster',  category: 'special', rarity: 'uncommon', icon: '📡', apply: { radar: true } },
    { id: 'vortex',           name: 'Vortex',              desc: 'Sürekli yem çekme alanı',          category: 'special', rarity: 'legendary',icon: '🌀', apply: { vortex: true } }
  ],

  // Upgrade rarity renkleri (renderer için)
  RARITY_COLORS: {
    common:    { main: '#888888', glow: '#88888844' },
    uncommon:  { main: '#00ff88', glow: '#00ff8844' },
    rare:      { main: '#0088ff', glow: '#0088ff44' },
    epic:      { main: '#aa00ff', glow: '#aa00ff44' },
    legendary: { main: '#ffaa00', glow: '#ffaa0044' }
  }
};
