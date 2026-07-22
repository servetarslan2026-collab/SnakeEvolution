# 🐍 Snake Evolution — Tam Dokümantasyon

> Modern roguelite Snake oyunu — Vanilla JS, Canvas 2D, Web Audio.  
> Sıfır bağımlılık, 17 modül, tarayıcıda doğrudan çalışır.

---

## 📁 Dosya Yapısı

```
SnakeEvolution/
├── index.html          ← Entry point, script yüklemeleri
├── README.md           ← Proje tanıtımı
├── DOCUMENTATION.md    ← Bu dosya
└── js/
    ├── config.js       ← Tüm oyun verileri (biomeler, yemler, düşmanlar, boss'lar, skinler, upgrade'ler, başarımlar, günlük görevler)
    ├── utils.js        ← Yardımcı fonksiyonlar (rnd, rndInt, dist, lerp, clamp)
    ├── save.js         ← localStorage kayıt sistemi (veri yükleme, kaydetme, dışa/içe aktarma, sıfırlama)
    ├── audio.js        ← Web Audio API ses sistemi (prosedürel ton üretimi)
    ├── particles.js    ← Parçacık sistemi (patlama, floating text, object pool)
    ├── effects.js      ← Ekran efektleri (sarsıntı, flaş)
    ├── map.js          ← Harita sistemi (tile generation, engel türleri, çarpışma kontrolü)
    ├── food.js         ← Yem sistemi (11 tür, ağırlıklı spawn, magnet efekti)
    ├── snake.js        ← Yılan (oyuncu) sistemi (hareket, HP, hasar, interpolasyon, tile efektleri)
    ├── enemies.js      ← Düşman sistemi (6 tür, AI davranışları, spawn mekanizması)
    ├── boss.js         ← Boss sistemi (6 boss, faz geçişleri, AI)
    ├── combo.js        ← Combo sistemi (x2, x3, x5, x10 çarpan)
    ├── upgrades.js     ← Yükseltme sistemi (37 upgrade, nadirlik ağırlıkları, uygulama mantığı)
    ├── stats.js        ← İstatistik ve başarım sistemi (otomatik kontrol, günlük görevler)
    ├── engine.js       ← Ana oyun motoru (game loop, state yönetimi, yem toplama, ölüm, level up)
    ├── ui.js           ← Arayüz sistemi (menü, HUD, mini harita, pause, level up, ölüm ekranı, ayarlar, skinler)
    └── main.js         ← Başlangıç, klavye input, touch input (mobil destek)
```

---

## 🎮 Oyun Mekaniği

### Genel Akış

```
Menü → Oyun Başla → Yem Ye → XP Kazan → Level Atla → Upgrade Seç → Boss Savaş → Ölüm → Tekrar
```

### Oyun Durumları (States)

| Durum | Açıklama |
|-------|----------|
| `menu` | Ana menü — 4 buton: Play, How to Play, Skins, Settings |
| `play` | Aktif oyun |
| `paused` | ESC ile duraklatılmış |
| `levelup` | Level atladı — 3 upgrade seçenek |
| `dead` | Ölüm ekranı — skor, süre, ödül gösterimi |
| `howtoplay` | Nasıl oynanır — 3 sayfa |
| `settings` | Ayarlar — ses, sarsıntı, parçacık, sıfırlama |
| `skins` | Skin seçim ekranı |

### Temel Değerler

| Değer | Başlangıç | Açıklama |
|-------|-----------|----------|
| HP | 4 | Can puanı |
| Max HP | 4 | Maksimum can (upgrade ile artar) |
| Speed | 4 tile/sn | Hareket hızı (level başına +0.3, max 12) |
| Score | 0 | Toplam puan |
| Level | 1 | Deneyim seviyesi |
| XP | 0 | Deneyim puanı |
| XP Next | 30 | Level atlamak için gereken XP (her levelde x1.15) |

### Hız Artışı

- Başlangıç hızı: 4 tile/sn
- Her level: +0.3 tile/sn
- Maksimum: 12 tile/sn
- Turbo upgrade: x1.5 (3 saniye)
- Yavaşlama (saat yemi): x0.7 (3 saniye)

---

## 🌍 Biome Sistemi (6 Biome)

Her 5 levelde bir biome değişir. Biome sırası:

| # | Biome | Level Aralığı | BG Rengi | Accent | Accent2 |
|---|-------|---------------|----------|--------|---------|
| 0 | Neon City | 1-4 | `#06060f` | `#00ffd5` | `#ff2d95` |
| 1 | Frozen Lab | 5-9 | `#040810` | `#00c8ff` | `#0066ff` |
| 2 | Lava Core | 10-14 | `#100404` | `#ff4400` | `#ffaa00` |
| 3 | Cyber Forest | 15-19 | `#040a04` | `#44ff00` | `#00ff88` |
| 4 | Space Station | 20-24 | `#04040a` | `#aa00ff` | `#ff00ff` |
| 5 | Void | 25+ | `#020204` | `#ff00aa` | `#aa00ff` |

Her biome değişiminde:
- Harita yeniden oluşturulur
- Yeni engeller yerleştirilir
- Kullanılabilir düşman türleri artar

---

## 🍎 Yem Sistemi (11 Tür)

### Yem Türleri Tablosu

| Tür | Emoji | Renk | Spawn Ağırlığı | Puan | Uzunluk | XP | HP | Özel Efekt |
|-----|-------|------|----------------|------|---------|-----|-----|------------|
| normal | 🍎 | `#ff2244` | 40 | 1 | +1 | 5 | 0 | — |
| golden | ⭐ | `#ffaa00` | 10 | 5 | +2 | 15 | 0 | — |
| crystal | 💎 | `#aa44ff` | 10 | 0 | 0 | 25 | 0 | — |
| heart | ❤️ | `#ff44aa` | 10 | 0 | 0 | 0 | 1 | — |
| clock | ⏱️ | `#4488ff` | 6 | 0 | 0 | 3 | 0 | Yavaşlatma (3 sn) |
| bomb | 💣 | `#ff6600` | 2 | 0 | 0 | 0 | 0 | 2 hasar verir |
| poison | ☠️ | `#44ff00` | 3 | 0 | -2 | 0 | 0 | Kuyruk kısaltır |
| magnet | 🧲 | `#00ffcc` | 5 | 0 | 0 | 5 | 0 | Yem çeker |
| lucky | 🍀 | `#ffffff` | 3 | 0 | 0 | 10 | 0 | Rastgele: +10 skor veya +2 HP veya +30 XP |
| star | ✨ | `#ffffff` | 3 | 0 | 0 | 0 | 0 | 3 sn dokunulmazlık |
| coin | 🪙 | `#ffcc00` | 7 | 2 | 0 | 3 | 0 | 1-5 coin kazandırır |

### Spawn Mekanizması

- Maksimum yem sayısı: 8
- Spawn aralığı: 1.5 saniye
- Her 3 yemde bir %30 nadir yem garantisi
- Aynı nadir yem üst üste gelmez
- Magnet upgrade aktifse, 5 tile yarıçapındaki yemler yılanın kafasına doğru çekilir

### Yem Toplama Mantığı (collectFood)

1. Combo tetiklenir → çarpan hesaplanır
2. Puan = `food.sc × comboMultiplier × (score2x varsa 2)`
3. XP = `food.xp × (xp2x varsa 2)`
4. Kuyruk uzunluğu ayarlanır (poison: -2, normal/golden: +1/+2)
5. HP iyileştirilir (heart: +1)
6. Boss varsa 1 hasar verilir
7. Parçacık efektleri oluşturulur
8. Özel efektler uygulanır
9. Level atlama kontrolü yapılır

---

## 🐍 Yılan Sistemi

### Temel Özellikler

- Başlangıç uzunluğu: 3 segment
- Başlangıç HP: 4
- Başlangıç hızı: 4 tile/sn
- Spawn pozisyonu: Harita merkezi
- Başlangıç yönü: Aşağı
- Başlangıç dokunulmazlığı: 3 saniye

### Hareket Sistemi

- Grid tabanlı hareket (20px grid)
- Wrap around: Kenarlardan geçer (duvar yok)
- Yön değişimi: Bir sonraki adımda uygulanır
- Ters yöne geçiş engeli (180° dönüş yasak)
- Smooth interpolasyon: Kafa 20x, gövde 15x lerp hızı

### Tile Etkileşimleri

| Tile | Tür | Etki |
|------|-----|------|
| 0 | Boş | Geçilebilir |
| 1 | Duvar | Hasar verir (invincible iken bloklar) |
| 2 | Kaya | Hareketi engeller (hasar yok) |
| 3 | Lava | 1.5 sn'de 1 hasar |
| 4 | Buz | Kayma (yön değişimi zor) |
| 7 | Elektrik | 2 sn'de 1 hasar |

### Hasar Sistemi

- Kaynaklar: duvar, kendine çarpma, düşman, boss, bomba, turret, lava, elektrik
- Invincible iken hasar alınmaz
- HP 0'a düşerse:
  - `secondLife` upgrade varsa: maxHP/2 ile diril, 3 sn invincible
  - Yoksa: Ölüm

### Dash Sistemi

- Koşul: `dash` upgrade'ı alınmış olmalı
- Tetikleyici: SPACE tuşu
- Etki: 3 tile ileri atılma
- Cooldown: 2 saniye
- Parçacık efekti: `#00ffcc`

---

## 👾 Düşman Sistemi (6 Tür)

### Düşman Türleri

| Tür | Hız | HP | Renk | AI Davranışı |
|-----|-----|----|------|--------------|
| bug | 1.5 | 1 | `#ff2244` | Wander (rastgele dolaşma) |
| snake | 2 | 1 | `#44ff22` | Chase (takip, 15 tile menzil) |
| bomber | 2.5 | 1 | `#ff8800` | Wander |
| drone | 0 | 3 | `#4488ff` | Turret (hareketsiz, 15 tile menzil, 2 sn'de 1 hasar) |
| ghost | 1 | 999 | `#aaaaff` | Ghost (duvarlardan geçer, %50 chase) |
| chaser | 2 | 2 | `#ff4444` | Chase |

### AI Davranış Detayları

- **Wander**: Rastgele yön seçer, 3-8 adımda bir yön değiştirir
- **Chase**: Oyuncu 15 tile içindeyse oyuncuya doğru hareket eder
- **Turret**: Hareket etmez, oyuncu aynı satır/sütundaysa 2 sn'de 1 hasar verir
- **Ghost**: %50 şansla chase, duvarlardan geçebilir, wrap around kullanır

### Spawn Mekanizması

- Spawn aralığı: 12 saniye
- Maksimum düşman sayısı: 4
- Biome bazlı kullanılabilirlik:
  - Neon City (0-4): bug, snake, bomber
  - Frozen Lab (5-9): +drone
  - Lava Core (10-14): +ghost
  - Cyber Forest+ (15+): tümü (chaser dahil)
- Spawn mesafesi: Oyuncuya minimum 10 tile uzaklık

### Çarpışma

- Oyuncu invincible değilken düşmana temas → 1 hasar
- Düşman 3 tile geri itilir

---

## 🏆 Boss Sistemi (6 Boss)

### Boss Tablosu

| # | İsim | Renk | HP | Level |
|---|------|------|----|-------|
| 1 | Dev Solucan | `#aa44ff` | 20 | 5 |
| 2 | Lazer Küp | `#0088ff` | 30 | 10 |
| 3 | Manyetik Çekirdek | `#00ffcc` | 40 | 15 |
| 4 | Elektrik Küresi | `#ffff00` | 50 | 20 |
| 5 | AI Yılan | `#ff0044` | 65 | 25 |
| 6 | Void Lord | `#ff00aa` | 80 | 30 |

### Boss HP Hesaplama

```
Boss HP = Taban HP + (Level × 2)
```

### Boss AI

- 3 faz sistemi:
  - **Faz 1** (HP > %50): Normal hız, dairesel hareket
  - **Faz 2** (HP < %50): Hız x1.3, "FAZ 2! Hız arttı!" uyarısı
  - **Faz 3** (HP < %25): Hız x1.6, "FAZ 3! Çok tehlikeli!" uyarısı
- Mesafe bazlı hareket:
  - Yakın (< 5 tile): Geri çekil
  - Uzak (> 10 tile): Yaklaş
  - Orta: Dairesel hareket
- Sınırlar içinde kalır (clamp)
- Çarpışma: 2 tile mesafede 1 hasar

### Boss Öldürme

- +50 puan
- Parçacık patlaması (20 parçacık, `#ffaa00`)
- Ses efekti (800 Hz)
- Boss avcısı başarımı tetiklenir

---

## 🔥 Combo Sistemi

### Combo Çarpanları

| Combo Sayısı | Çarpan |
|--------------|--------|
| 0-2 | x1 |
| 3-4 | x2 |
| 5-7 | x3 |
| 8-11 | x5 |
| 12+ | x10 |

### Combo Mekanizması

- Her yem yeme → combo +1, timer 2.5 saniyeye sıfırlanır
- Timer 0'a düşerse → combo sıfırlanır, çarpan 1 olur
- `chainCombo` upgrade: timer +1 saniye
- 3+ combo'da ekran sarsıntısı (2 şiddet, 0.1 saniye)

---

## ⬆️ Yükseltme Sistemi (37 Upgrade)

### Nadirlik Dağılımı

| Nadirlik | Ağırlık | Olasılık |
|----------|---------|----------|
| Common | 50 | ~%50 |
| Uncommon | 30 | ~%30 |
| Rare | 15 | ~%15 |
| Epic | 4 | ~%4 |
| Legendary | 1 | ~%1 |

### Upgrade Seçim Mekanizması

- Level atlayınca 3 seçenek gösterilir
- Ağırlıklı rastgele seçim
- Son 5 upgrade'ın ağırlığı %70 azaltılır (tekrar azaltma)
- Aynı upgrade tekrar seçilebilir (havuzdan kaldırılmaz)

### Tüm Upgrade'ler

#### Common (5)

| ID | İsim | Açıklama | Etki |
|----|------|----------|------|
| speed | Hız Artışı | +20% hız | `speed *= 1.2` |
| hp | Extra Can | +1 max can | `maxHp++, hp++` |
| heal | İyileşme | Canı doldur | `hp = maxHp` |
| longTail | Uzun Kuyruk | +3 uzunluk | `grow(3)` |
| magnet | Mıknatıs | Yemleri çeker | 5 tile yarıçapında yem çeker |

#### Uncommon (8)

| ID | İsim | Açıklama | Etki |
|----|------|----------|------|
| score2x | 2x Puan | Çift puan | collectFood'da sc × 2 |
| xp2x | 2x XP | Çift XP | collectFood'da xp × 2 |
| shield | Kalkan | 3 sn dokunulmaz | `invTimer = 3` |
| dash | Dash | SPACE ile atıl | 3 tile ileri, 2 sn cooldown |
| fireTail | Ateş Kuyruk | Düşman hasar | Görsel efekt |
| iceTail | Buz Kuyruk | Düşman yavaşlar | Görsel efekt |
| chainCombo | Zincir Combo | Combo +1 sn | `combo.timer += 1` |
| radar | Radar | Yakındaki yem/düşman | Görsel efekt |

#### Rare (9)

| ID | İsim | Açıklama | Etki |
|----|------|----------|------|
| armor | Zırh | 2 sn hasar azalt | `invTimer = 2` |
| golden | Altın Dokunuş | Altın elma +%20 | collectFood'da kontrol |
| heartFind | Kalp Avcısı | Kalp +%15 | collectFood'da kontrol |
| luckyDrop | Şanslı Düşme | Coin +%30 | collectFood'da kontrol |
| critical | Kritik Yem | %15 şansla 2x | collectFood'da kontrol |
| ghost | Ghost Mode | 5 sn duvar geç | `invTimer = 5` |
| teleport | Teleport | Rastgele ışınlan | Rastgele boş tile'a |
| autoCollect | Otomatik | 3 sn'de 1 yem | food update'de kontrol |
| poisonTail | Zehir Kuyruk | Düşman zehirler | Görsel efekt |
| elecTail | Elektrik Kuyruk | Sersemletir | Görsel efekt |

#### Epic (8)

| ID | İsim | Açıklama | Etki |
|----|------|----------|------|
| phase | Phase Shift | 3 sn düşman geç | `invTimer = 3` |
| momentum | Momentum | Durmadan hızlan | snake update'de kontrol |
| regen | Yenilenme | 10 sn'de 1 can | snake update'de kontrol |
| blastGuard | Patlama Kalkanı | Patlamadan hasar almaz | takeDamage'da kontrol |
| foodBoom | Yem Patlaması | Yakındakiler toplanır | collectFood'da kontrol |
| thickTail | Kalın Kuyruk | 2 tile genişlik | Görsel efekt |
| explodingTail | Patlayan Kuyruk | Kuyruk patlar | Görsel efekt |
| drone | Mini Drone | Düşman hasar | Görsel efekt |
| turbo | Turbo | 3 sn +50% hız | `speed *= 1.5`, 3 sn sonra `/= 1.5` |

#### Legendary (5)

| ID | İsim | Açıklama | Etki |
|----|------|----------|------|
| secondLife | İkinci Hayat | Ölünce 1 kez diril | maxHP/2 ile dirilme, 3 sn invincible |
| clone | Klon Yılan | Otomatik yem toplar | Görsel efekt |
| timeFreeze | Zaman Dondurma | 5 sn her şey durur | Tüm düşmanların hızı 0 (5 sn) |
| chainTail | Zincir Kuyruk | Zincir hasar | Görsel efekt |
| vortex | Vortex | Sürekli yem çekme | food update'de kontrol |
| lucky | Şanslı | Tüm rastgele +%20 | Rastgele fonksiyonlarda kontrol |

---

## 🎨 Skin Sistemi (20 Skin)

### Skin Listesi

| ID | İsim | Head | Body | Glow | Unlock Koşulu |
|----|------|------|------|------|---------------|
| default | Default | `#00ffd5` | `#00aa88` | `#00ffd5` | — (varsayılan) |
| robot | Robot | `#8888aa` | `#555577` | `#8888ff` | 100 Coin |
| dragon | Dragon | `#ff3300` | `#cc2200` | `#ff4400` | Başarım: boss_hunter |
| ghost | Ghost | `#aaaaff` | `#8888cc` | `#ccccff` | 150 Coin |
| fire | Fire | `#ff4400` | `#ff2200` | `#ff6600` | 200 Coin |
| ice | Ice | `#00ccff` | `#0088cc` | `#44ddff` | 150 Coin |
| cyber | Cyber | `#00ff88` | `#00cc66` | `#44ffaa` | 200 Coin |
| gold | Gold | `#ffcc00` | `#cc9900` | `#ffdd44` | 300 Coin |
| galaxy | Galaxy | `#6600cc` | `#4400aa` | `#8822ff` | 400 Coin |
| neon | Neon | `#ff00ff` | `#cc00cc` | `#ff44ff` | 250 Coin |
| matrix | Matrix | `#00ff00` | `#008800` | `#44ff44` | Başarım: speed_demon |
| ocean | Ocean | `#0066ff` | `#0044cc` | `#4488ff` | 200 Coin |
| sunset | Sunset | `#ff4466` | `#cc2244` | `#ff6688` | 300 Coin |
| toxic | Toxic | `#88ff00` | `#66cc00` | `#aaff44` | 250 Coin |
| shadow | Shadow | `#333344` | `#222233` | `#4444aa` | Başarım: survivor |
| crystal | Crystal | `#88ccff` | `#66aadd` | `#aaddff` | Başarım: explorer |
| diamond | Diamond | `#ccddff` | `#aabbdd` | `#ddeeff` | 500 Coin |
| void | Void | `#ff0088` | `#cc0066` | `#ff44aa` | Başarım: coin_master |
| rainbow | Rainbow | `#ff0000` | `#00ff00` | `#0000ff` | Başarım: combo_master (rainbow efektli) |
| pixel | Pixel | `#ff8844` | `#cc6622` | `#ffaa66` | 100 Coin |

### Skin Görünümü

- Kafa: Radial gradient (head → body), highlight, 2 göz (beyaz + renkli iris + siyah pupil)
- Gövde: Radial gradient, her 2 segmentte bir highlight
- Invincible iken: Yanıp sönme (0.4 alpha)
- Rainbow skin: Gökkuşağı efekti

---

## 🏆 Başarım Sistemi (9 Başarım)

| ID | İsim | Açıklama | Koşul | Skin Açar |
|----|------|----------|-------|-----------|
| first_blood | İlk Kan | İlk yemi ye | `totalFood >= 1` | — |
| hungry | Aç | 100 yem ye | `totalFood >= 100` | — |
| glutton | Obur | 500 yem ye | `totalFood >= 500` | — |
| combo_master | Combo Ustası | x10 combo | `maxCombo >= 10` | rainbow |
| boss_hunter | Boss Avcısı | Boss kes | `bossKills >= 1` | dragon |
| survivor | Hayatta Kalan | 10 dk | `longestTime >= 600` | shadow |
| speed_demon | Hız Canavarı | Level 20 | `maxLevel >= 20` | matrix |
| explorer | Kaşif | 3 biome | `biomesVisited >= 3` | crystal |
| coin_master | Coin Ustası | 1000 coin | `totalCoins >= 1000` | void |

---

## 📋 Günlük Görev Sistemi (6 Görev)

| ID | Açıklama | Hedef | Tür | Ödül |
|----|----------|-------|-----|------|
| food50 | 50 yem topla | 50 | food | 20 Coin |
| food100 | 100 yem topla | 100 | food | 50 Coin |
| score500 | 500 skor yap | 500 | score | 30 Coin |
| score2000 | 2000 skor yap | 2000 | score | 100 Coin |
| games3 | 3 oyun oyna | 3 | games | 15 Coin |
| level5 | Level 5'e ulaş | 5 | level | 40 Coin |

### Görev Mekanizması

- Her gün sıfırlanır (tarih bazlı)
- Oyun sonunda ilerleme kontrol edilir
- Tamamlanan görevler `completed` dizisinde saklanır
- Ödül otomatik olarak coin'e eklenir

---

## 💾 Kayıt Sistemi

### Saklanan Veriler

```json
{
  "version": 1,
  "coins": 0,
  "highScore": 0,
  "totalGames": 0,
  "totalFood": 0,
  "totalTime": 0,
  "totalCoins": 0,
  "maxCombo": 0,
  "bossKills": 0,
  "longestTime": 0,
  "maxLevel": 0,
  "biomesVisited": 1,
  "achievements": [],
  "unlockedSkins": ["default"],
  "equippedSkin": "default",
  "settings": {
    "sound": 0.7,
    "music": 0.5,
    "shake": true,
    "glow": true,
    "particles": true
  },
  "dailyQuests": {
    "date": "2026-07-23",
    "food": 0,
    "games": 0,
    "score": 0,
    "level": 0,
    "completed": []
  }
}
```

### Kayıt Özellikleri

- **Depolama**: localStorage (`snake_evo_save` key)
- **Otomatik kayıt**: Ölüm anında
- **Versiyon birleştirme**: Eksik alanlar otomatik tamamlanır
- **Dışa aktarma**: JSON formatında
- **İçe aktarma**: JSON doğrulama ile
- **Sıfırlama**: localStorage silinir, sayfa yenilenir

---

## 🎵 Ses Sistemi

### Web Audio API

- Prosedürel ton üretimi (oscillator + gain)
- Tarayıcı etkileşimiyle初始化 (click, keydown, touchstart)
- Ses seviyesi: `settings.sound × 0.15`

### Ses Efektleri

| Efekt | Frekans | Süre | Dalga | Tetikleyici |
|-------|---------|------|-------|-------------|
| Eat | 440-660 Hz | 0.1 sn | sine | Yem yeme |
| Hit | 200-300 Hz | 0.15 sn | square | Hasar alma |
| Coin | 800-1200 Hz | 0.08 sn | triangle | Coin toplama |
| LevelUp | 523→659→784 Hz | 0.3 sn | sine | Level atlama |
| Death | 400→200 Hz | 0.7 sn | sawtooth | Ölüm |
| Boss Hit | 800 Hz | 0.2 sn | — | Boss öldürme |
| Dash | 600 Hz | 0.1 sn | — | Dash kullanımı |

---

## 🎨 Görsel Efektler

### Parçacık Sistemi

- **Object Pool**: 200 parçacık havuzu (performans)
- **Maksimum**: 150 aktif parçacık
- **Patlama**: Rastgele yön ve hız, 0.2-0.4 sn yaşam
- **Floating Text**: Yukarı doğru hareket, 0.6 sn yaşam
- **Fizik**: Sürtünme (vx/vy × 0.95), yerçekimi (vy + 30 × dt)

### Ekran Efektleri

- **Sarsıntı (Shake)**: Rastgele offset, zamanla azalır
- **Flaş (Flash)**: Tam ekran renk overlay, zamanla azalır
- Tetikleyiciler: Hasar, combo, boss, ölüm

### Yem Görselliği

- Dış glow (şeffaf halka)
- Ana daire (beyaz → renk gradient)
- Border (1.5px)
- Emoji ortada
- Altın/star/coin yemlerde sparkle efekti (3 dönen nokta)
- Pulse animasyonu (sin dalgası)

---

## 🗺️ Harita Sistemi

### Tile Türleri

| ID | Tür | Renk | Etki |
|----|-----|------|------|
| 0 | Boş | — | Geçilebilir |
| 1 | Duvar | `#14142e` | Hasar verir |
| 2 | Kaya | `#3a3a4a` | Hareketi engeller |
| 3 | Lava | `#ff3d00` | Periyodik hasar (animasyonlu) |
| 4 | Buz | `#00d4ff22` | Kayma (elmas şekli) |
| 7 | Elektrik | `#1a1a00` | Periyodik hasar (yıldırım animasyonu) |

### Harita Üretimi

- Grid boyutu: 800×600 / 20px = 40×30 tile
- Engel sayısı: `3 + biome_index` (biome arttıkça daha fazla engel)
- Engeller arası minimum mesafe: 3 tile
- Merkez 10×10 alan temiz (güvenli spawn bölgesi)
- Wrap around: Kenarlarda duvar yok

### Mini Harita

- Konum: Sağ alt köşe
- Boyut: 60×45 px
- Yılan: Yeşil nokta (2px)
- Düşmanlar: Kırmızı nokta (1.5px)
- Yemler: Sarı nokta (1.5px)
- Alpha: 0.4

---

## 🎮 Kontroller

### Klavye

| Tuş | Menü | Oyun | Level Up | Pause | Ölüm |
|-----|------|------|----------|-------|------|
| ↑ / W | Yukarı seç | Yukarı git | — | — | — |
| ↓ / S | Aşağı seç | Aşağı git | — | — | — |
| ← / A | — | Sol git | Sol seçenek | — | — |
| → / D | — | Sağ git | Sağ seçenek | — | — |
| ENTER | Seç/Başlat | — | Onayla | Devam | Tekrar oyna |
| ESC | — | Pause | Onayla + devam | Devam | Ana menü |
| SPACE | — | Dash | — | — | — |
| 1-3 | — | — | Upgrade seç | — | — |

### Touch (Mobil)

- **Swipe**: Yön değiştirme (30px minimum mesafe)
- **Tap**: Seçim/Başlatma (15px tolerans)
- **touchstart**: Audio初始化

---

## 📊 Performans

### FPS

- Hedef: 60 FPS
- Ölçüm: Her saniye sayaç sıfırlanır
- DT clamp: max 0.05 sn (düşük FPS'de fizik patlamasını önler)

### Optimizasyonlar

- **Parçacık havuzu**: Object reuse (max 200)
- **Parçacık limiti**: 150 aktif
- **Düşman limiti**: 4 aktif
- **Yem limiti**: 8 aktif
- **Notification limiti**: 4 aktif
- **Canvas transform**: Scale-based resize (piksel hesaplama yok)
- **Alpha: false**: Canvas'ta şeffaflık yok (performans)
- **Interpolasyon**: Smooth hareket (60 FPS'de grid atlaması yok)

---

## 🔧 Teknik Detaylar

### Global Namespace

- `window.G` → Tüm modüller bu obje altında
- Modüller: `G.Config`, `G.Utils`, `G.Save`, `G.Audio`, `G.Particles`, `G.Effects`, `G.Map`, `G.Food`, `G.Snake`, `G.Enemies`, `G.Boss`, `G.Combo`, `G.Upgrades`, `G.Stats`, `G.Engine`, `G.UI`

### Script Yükleme Sırası

1. config.js (veri tanımları)
2. utils.js (yardımcı fonksiyonlar)
3. save.js (kayıt sistemi)
4. audio.js (ses)
5. particles.js (parçacık)
6. effects.js (ekran efektleri)
7. map.js (harita)
8. food.js (yem)
9. snake.js (yılan)
10. enemies.js (düşman)
11. boss.js (boss)
12. combo.js (combo)
13. upgrades.js (yükseltme)
14. stats.js (istatistik)
15. engine.js (ana motor)
16. ui.js (arayüz)
17. main.js (başlangıç + input)

### Bağımlılıklar

- **Yok** — Vanilla JS, Canvas 2D API, Web Audio API
- **Font**: Google Fonts (Orbitron, Rajdhani) — CDN'den yüklenir

### Tarayıcı Desteği

- Modern tarayıcılar (ES6+)
- Canvas 2D API
- Web Audio API
- localStorage
- requestAnimationFrame

---

## 🐛 Bilinen Sorunlar / Notlar

1. **Göstergeler**: Bazı upgrade'ler sadece görsel efekt (fireTail, iceTail, poisonTail, elecTail, thickTail, chainTail, explodingTail, drone, clone) — gerçek mekanik implementasyonu eksik
2. **Music**: `settings.music` değeri tanımlı ama müzik çalma implementasyonu yok
3. **Glow**: `settings.glow` değeri tanımlı ama glow efekti toggle implementasyonu yok
4. **Regen**: `regen` upgrade'ı snake update'de kontrol edilmeli ama implementasyon eksik
5. **Momentum**: `momentum` upgrade'ı snake update'de kontrol edilmeli ama implementasyon eksik
6. **BlastGuard**: `blastGuard` takeDamage'da kontrol edilmeli ama implementasyon eksik
7. **FoodBoom**: `foodBoom` collectFood'da kontrol edilmeli ama implementasyon eksik
8. **AutoCollect**: `autoCollect` food update'de kontrol edilmeli ama implementasyon eksik
9. **Vortex**: `vortex` food update'de kontrol edilmeli ama implementasyon eksik
10. **Lucky**: `lucky` rastgele fonksiyonlarda kontrol edilmeli ama implementasyon eksik

---

## 📈 Versiyon

- **v5.0** (README'de belirtilen)
- **Dil**: Türkçe arayüz
- **Lisans**: MIT

---

## 🚀 Çalıştırma

1. `index.html` dosyasını tarayıcıda aç
2. Klavye: Ok tuşları / WASD + ENTER + ESC + SPACE
3. Mobil: Swipe + Tap

Sunucu gerekmez. Doğrudan dosya sisteminden açılabilir.
