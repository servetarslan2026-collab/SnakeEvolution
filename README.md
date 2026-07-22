# 🐍 Snake Evolution

Modern roguelite Snake oyunu. Vanilla JS, Canvas 2D, Web Audio. Sıfır bağımlılık.

![Version](https://img.shields.io/badge/version-6.0.0-blue)
![Tests](https://img.shields.io/badge/tests-217%20passed-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎮 Özellikler

### Oyun Mekaniği
- **6 Biome** — Neon City, Frozen Lab, Lava Core, Cyber Forest, Space Station, Void
- **38 Upgrade** — 5 nadirlik seviyesi (Common, Uncommon, Rare, Epic, Legendary)
- **6 Boss** — Her 5 levelde, 3 faz sistemi, ölüm animasyonu
- **6 Düşman** — Farklı AI davranışları (Chase, Wander, Bomber, Ghost, Turret, Chaser)
- **11 Yem Türü** — Elma, Altın, Kristal, Kalp, Bomba, Saat, Zehir, Mıknatıs, Şanslı, Yıldız, Coin
- **20 Skin** — Unlock koşulları, Rainbow efekti
- **9 Başarım** — Otomatik tetikleme, coin ödülü
- **Combo Sistemi** — x1→x20 çarpan
- **Günlük Görevler** — 6 görev, otomatik takip

### Teknik
- **Modüler Yapı** — 20+ JS dosyası
- **Sıfır Bağımlılık** — Vanilla JS, Canvas 2D, Web Audio
- **217 Otomatik Test** — Full, Feature, Visual, Combo, Long, Deep
- **Otomatik Hata Yakalama** — Runtime error logging, sağlık kontrolü
- **Performans** — 60+ FPS, object pool, efficient rendering

## 🚀 Nasıl Oynanır

1. `index.html` dosyasını tarayıcınızda açın
2. Ok tuşları veya WASD ile hareket edin
3. Yemleri yiyin, level atlayın, upgrade seçin
4. Boss'ları yenin, yüksek skor yapın

### Kontroller

| Tuş | Aksiyon |
|-----|---------|
| ↑↓←→ / WASD | Hareket |
| SPACE | Dash (varsa) |
| ENTER | Seçim / Başlat |
| ESC | Pause / Geri |
| 1-2-3 | Upgrade seç |

## 📁 Dosya Yapısı

```
SnakeEvolution/
├── index.html
├── package.json
├── README.md
├── DOCUMENTATION.md
└── js/
    ├── config.js       ← Oyun verileri (biomeler, yemler, düşmanlar, boss'lar, skinler, upgrade'ler)
    ├── utils.js        ← Yardımcı fonksiyonlar
    ├── save.js         ← localStorage kayıt sistemi
    ├── audio.js        ← Web Audio API ses ve müzik sistemi
    ├── timers.js       ← Game loop tabanlı timer sistemi
    ├── particles.js    ← Parçacık sistemi (object pool)
    ├── effects.js      ← Ekran efektleri (shake, flash)
    ├── map.js          ← Harita sistemi (tile generation, engeller)
    ├── food.js         ← Yem sistemi (11 tür, ağırlıklı spawn)
    ├── snake.js        ← Yılan sistemi (hareket, HP, upgrade efektleri)
    ├── enemies.js      ← Düşman sistemi (6 AI, level skalası)
    ├── boss.js         ← Boss sistemi (3 faz, ölüm animasyonu)
    ├── combo.js        ← Combo sistemi (x1→x20)
    ├── upgrades.js     ← Yükseltme sistemi (38 upgrade)
    ├── stats.js        ← İstatistik ve başarım sistemi
    ├── engine.js       ← Ana oyun motoru (game loop, state yönetimi)
    ├── ui.js           ← Arayüz sistemi (menü, HUD, ekranlar)
    └── main.js         ← Başlangıç, input handling
```

## 🧪 Test Suite

```bash
# Tarayıcı konsolunda:
G.FullTest.runAll()      # 125 test — tüm sistemler
G.NewTest.runAll()       # 56 test — yeni özellikler
G.FeatureTest.runAll()   # 36 test — feature testleri
G.DeepTest.runAll()      # 52 test — edge case'ler
G.BotV2.run(1800)        # 30 sn oyun simülasyonu
G.Logger.printReport()   # Sağlık raporu
```

### Test Kapsamı
- ✅ Tüm yem türleri (11)
- ✅ Tüm upgrade'ler (38)
- ✅ Tüm düşman türleri (6)
- ✅ Tüm boss'lar (6)
- ✅ Tüm skinler (20)
- ✅ Tüm başarımlar (9)
- ✅ Combo sistemi (x1→x20)
- ✅ Save/Load sistemi
- ✅ Timer sistemi
- ✅ Müzik sistemi
- ✅ Clone sistemi
- ✅ Drone sistemi
- ✅ Edge case'ler
- ✅ Stress testleri

## 🎨 Biome Sistemi

| # | Biome | Level | Renk Paleti |
|---|-------|-------|-------------|
| 0 | Neon City | 1-4 | Cyan + Pink |
| 1 | Frozen Lab | 5-9 | Mavi + Beyaz |
| 2 | Lava Core | 10-14 | Turuncu + Kırmızı |
| 3 | Cyber Forest | 15-19 | Yeşil + Turkuaz |
| 4 | Space Station | 20-24 | Mor + Pembe |
| 5 | Void | 25+ | Pembe + Mor |

## ⚔️ Düşman AI

| Tür | Hız | HP | AI |
|-----|-----|----|----|
| Bug | 2 | 1 | Wander (rastgele dolaşma) |
| Snake | 2.5 | 1 | Chase (takip, 15 tile menzil) |
| Bomber | 3 | 1 | Agresif takip + %20 rastgele |
| Drone | 0 | 3 | Turret (hareketsiz, 3 sn'de ateş) |
| Ghost | 1.5 | 5 | Ghost (duvarlardan geçer) |
| Chaser | 2.5 | 2 | Chase (takip) |

## 🏆 Boss Sistemi

| # | İsim | HP | Level |
|---|------|----|-------|
| 1 | Dev Solucan | 20 + level×2 | 5 |
| 2 | Lazer Küp | 30 + level×2 | 10 |
| 3 | Manyetik Çekirdek | 40 + level×2 | 15 |
| 4 | Elektrik Küresi | 50 + level×2 | 20 |
| 5 | AI Yılan | 65 + level×2 | 25 |
| 6 | Void Lord | 80 + level×2 | 30 |

### Boss Fazları
- **Faz 1** (HP > 50%): Normal hız
- **Faz 2** (HP < 50%): Hız ×1.3
- **Faz 3** (HP < 25%): Hız ×1.6

## 📊 Denge Değerleri

| Değer | Değer |
|-------|-------|
| Başlangıç hızı | 4 tile/sn |
| Hız artış | +0.12/level |
| Max hız | 9 tile/sn |
| Başlangıç HP | 4 |
| XP başlangıç | 25 |
| XP artış | ×1.08/level |
| Combo timer | 3.5 sn |
| Düşman spawn | 12 sn (level ile azalır) |
| Boss yem hasarı | 3 |

## 📝 Lisans

MIT License

---

**v6.0.0** | 217 test | 0 bağımlılık | Vanilla JS
