# 🐍 Snake Evolution

Modern roguelite Snake oyunu. Modüler yapı, sıfır bağımlılık.

## 🎮 Özellikler

- **6 Biome** — Neon City, Frozen Lab, Lava Core, Cyber Forest, Space Station, Void
- **37 Upgrade** — 5 kategori (Hareket, Savunma, Yem, Kuyruk, Özel)
- **6 Boss** — Her 5 levelde, faz geçişleri
- **6 Düşman** — Farklı AI davranışları
- **11 Yem Türü** — Özel efektler
- **20 Skin** — Unlock koşulları
- **9 Başarım** — Takip ve bildirim
- **Combo Sistemi** — x2, x3, x5, x10
- **Kayıt Sistemi** — localStorage
- **İstatistik** — Skor, süre, yem, combo
- **Mini Harita** — Sağ alt köşe
- **Pause** — ESC ile durdur/devam
- **Akıcı Hareket** — Interpolasyonlu yılan ve düşmanlar

## 🛠️ Teknik

- **Modüler Yapı** — 17 ayrı JS dosyası
- **Dil:** Vanilla JavaScript (ES6+)
- **Görsel:** Canvas 2D API
- **Ses:** Web Audio API
- **Font:** Google Fonts (Orbitron, Rajdhani)
- **Bağımlılık:** Yok
- **Performans:** 61 FPS

## 📁 Dosya Yapısı

```
SnakeEvolution/
├── index.html
├── style.css
├── README.md
└── js/
    ├── config.js       ← Oyun verileri
    ├── utils.js        ← Yardımcı fonksiyonlar
    ├── save.js         ← Kayıt sistemi
    ├── audio.js        ← Ses sistemi
    ├── particles.js    ← Parçacık sistemi
    ├── effects.js      ← Ekran efektleri
    ├── map.js          ← Harita sistemi
    ├── food.js         ← Yem sistemi
    ├── snake.js        ← Yılan (oyuncu)
    ├── enemies.js      ← Düşman sistemi
    ├── boss.js         ← Boss sistemi
    ├── combo.js        ← Combo sistemi
    ├── upgrades.js     ← Yükseltme sistemi
    ├── stats.js        ← İstatistik ve başarım
    ├── engine.js       ← Ana motor
    ├── ui.js           ← Arayüz
    └── main.js         ← Başlangıç ve input
```

## 🚀 Nasıl Oynanır

1. `index.html` dosyasını tarayıcınızda açın
2. Ok tuşları veya WASD ile hareket edin
3. Yemleri yiyin, level atlayın, upgrade seçin
4. Boss'ları yenin, yüksek skor yapın

## 📝 Lisans

MIT License
