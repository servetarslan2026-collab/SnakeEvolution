# 🐍 Snake Evolution

Modern, yüksek tekrar oynanabilirliğe sahip **roguelite Snake oyunu**.

Klasik Snake'i alıp tam bir roguelite arcade deneyimine dönüştürdüm. Hiçbir framework yok — saf **Vanilla JavaScript + Canvas + Web Audio**.

## 🎮 Oyun Özellikleri

### Roguelite Mekanikler
- **50+ Upgrade** — Hareket, savunma, yem, kuyruk, özel kategorilerinde
- **6 Boss** — Her 10 levelde, kendine saldırı paternleri ve faz geçişleri
- **6 Biome** — Neon City, Frozen Lab, Lava Core, Cyber Forest, Space Station, Void
- **11 Yem Türü** — Normal elma, altın elma, kristal, kalp, saat, bomba, zehir, manyetik, şanslı, yıldız, coin
- **6 Düşman Türü** — Böcek, zehirli yılan, patlayan top, lazer drone, hayalet, takipçi robot
- **20+ Skin** — Coin ile veya başarım ile açılan özel görünümler
- **Combo Sistemi** — x2, x3, x5, x10, x20 çarpanlar
- **Kalıcı İlerleme** — Coin, XP, Gem biriktirme

### Görsel Tasarım
- **Neon/Cyberpunk** tema
- **Profesyonel font** — Orbitron (başlıklar), Rajdhani (metin), Share Tech Mono (skorlar)
- **Gradient** ve **glow** efektleri
- **Parçacık sistemi** — Patlama, sparkle, trail
- **3 katmanlı canvas** — Background, game, glow (performans optimizasyonlu)

### Ses Tasarımı
- **20+ sentetik ses** — Web Audio API ile üretilmiş
- **Her ses 2-4 katmanlı** — ADSR zarf, reverb, distortion
- **Background müzik** — Drone + arpej + atmosfer katmanları
- **Rastgele varyasyon** — Aynı ses her seferinde biraz farklı

### Tile Efektleri
- 🔥 **Lava** — Yavaşlatır ve periyodik hasar verir
- 🧊 **Buz** — Kayma, yön değişimi zor
- 🌿 **Çalı** — %60 yavaşlatma
- 🌫️ **Sis** — Görüş alanı daralır (vignette efekti)
- ⚡ **Elektrik** — Periyodik hasar
- 📦 **Sandık** — Kırılabilir, rastgele ödül
- 🌀 **Portal** — Işınlanma

## 🚀 Nasıl Oynanır

1. `index.html` dosyasını tarayıcınızda açın
2. Ok tuşları veya WASD ile hareket edin
3. Yemleri yiyin, level atlayın, upgrade seçin
4. Boss'ları yenin, yeni bölgeler keşfedin

**Mobil:** Dokunmatik kontroller otomatik görünür

## 🛠️ Teknik Detaylar

- **Dil:** Vanilla JavaScript (ES6+)
- **Görsel:** Canvas 2D API (3 katmanlı pipeline)
- **Ses:** Web Audio API (sentez, dış dosya yok)
- **Font:** Google Fonts (Orbitron, Rajdhani, Share Tech Mono)
- **Kayıt:** LocalStorage (export/import destekli)
- **Bağımlılık:** Yok
- **Performans:** 60 FPS hedef

### Dosya Yapısı
```
├── index.html          ← Tek giriş noktası
├── style.css           ← Stiller
└── js/
    ├── config.js       ← Sabitler ve denge
    ├── utils.js        ← Yardımcı fonksiyonlar
    ├── save.js         ← Kayıt sistemi
    ├── random.js       ← Seed-based PRNG
    ├── audio.js        ← Ses sistemi
    ├── input.js        ← Giriş yönetimi
    ├── renderer.js     ← Render pipeline
    ├── particles.js    ← Parçacık sistemi
    ├── effects.js      ← Ekran efektleri
    ├── map.js          ← Procedural harita
    ├── food.js         ← Yem sistemi
    ├── player.js       ← Yılan (oyuncu)
    ├── enemy.js        ← Düşman AI
    ├── boss.js         ← Boss sistemi
    ├── upgrade.js      ← Yükseltme sistemi
    ├── skin.js         ← Skin sistemi
    ├── combo.js        ← Combo sistemi
    ├── ui.js           ← Arayüz
    ├── stats.js        ← İstatistik ve başarım
    ├── game.js         ← Ana motor
    └── main.js         ← Başlangıç
```

## 📊 Oyun Dengesi

| Değer | Değer |
|-------|-------|
| Başlangıç Hız | 6 tile/sn |
| Max Hız | 20 tile/sn |
| Başlangıç HP | 4 |
| Max HP | 12 |
| Max Yem | 10 |
| Combo Pencere | 3 sn |
| Max Düşman | 8 |
| Boss HP | 15-80 |

## 📝 Lisans

MIT License

---

**Vanilla JS ile yapılmıştır. Framework yok, bağımlılık yok, sadece kod.** 🎮
