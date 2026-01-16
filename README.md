# Praytime - GNOME Shell Extension

GNOME Shell için namaz vakitleri bildirimi ve panel gösterimi extension'ı.

## Özellikler

- Panel üzerinde sonraki namaz vakti ve geri sayım
- 6 vakit desteği: İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı
- Şehir arama ile konum seçimi (Diyanet API)
- Vakit girişi ve öncesi bildirimleri
- Türkçe arayüz
- Clean Architecture mimari yapısı

## Gereksinimler

- GNOME Shell 46, 47 veya 48
- İnternet bağlantısı (API erişimi için)

## Hızlı Başlangıç

```bash
# Projeyi klonla
git clone https://github.com/erhanurgun/LINUX-ubuntu-gnome-praytime-extension.git
cd LINUX-ubuntu-gnome-praytime-extension

# Kur ve çalıştır
./scripts/install.sh
```

## Geliştirme

### Scriptler

Proje, geliştirme sürecini kolaylaştıran scriptler içerir:

| Script                     | Açıklama                                       |
|----------------------------|------------------------------------------------|
| `./scripts/install.sh`     | Uzantıyı kurar ve etkinleştirir                |
| `./scripts/uninstall.sh`   | Uzantıyı kaldırır                              |
| `./scripts/dev.sh`         | Değişiklikleri senkronize eder ve reload yapar |
| `./scripts/dev.sh --watch` | Otomatik senkronizasyon (dosya izleme)         |
| `./scripts/clean.sh`       | Kalıntıları ve cache'i temizler                |
| `./scripts/build.sh`       | extensions.gnome.org için zip oluşturur        |
| `./scripts/logs.sh`        | GNOME Shell loglarını gösterir                 |

### Geliştirme İş Akışı

```bash
# 1. Projeyi klonla
git clone https://github.com/erhanurgun/LINUX-ubuntu-gnome-praytime-extension.git
cd LINUX-ubuntu-gnome-praytime-extension

# 2. İlk kurulum
./scripts/install.sh

# 3. Kod değişikliği yap, sonra:
./scripts/dev.sh

# 4. Veya otomatik senkronizasyon için:
./scripts/dev.sh --watch

# 5. Logları takip et (başka terminalde):
./scripts/logs.sh
```

### Watch Modu İçin

`--watch` modu için `inotify-tools` gereklidir:

```bash
sudo apt install inotify-tools
```

## Kurulum Yöntemleri

### Yöntem 1: Script ile (Önerilen)

```bash
./scripts/install.sh
```

### Yöntem 2: Manuel Kurulum

```bash
# Extension klasörüne kopyala
mkdir -p ~/.local/share/gnome-shell/extensions/praytime@erho.dev
cp -r extension.js prefs.js metadata.json stylesheet.css schemas src icons \
    ~/.local/share/gnome-shell/extensions/praytime@erho.dev/

# Schema derle
glib-compile-schemas ~/.local/share/gnome-shell/extensions/praytime@erho.dev/schemas/

# Etkinleştir
gnome-extensions enable praytime@erho.dev
```

### Yöntem 3: GNOME Extensions Sitesi (Yakın Zamanda)

Extension onaylandıktan sonra [extensions.gnome.org](https://extensions.gnome.org) üzerinden kurulabilecek.

## GNOME Shell'i Yeniden Başlatma

### X11

```bash
# Alt+F2 tuşuna basıp "r" yazın ve Enter'a basın
```

### Wayland

```bash
# Oturumu kapatıp yeniden açın
```

## Extension Yönetimi

```bash
# Etkinleştir
gnome-extensions enable praytime@erho.dev

# Devre dışı bırak
gnome-extensions disable praytime@erho.dev

# Durumu göster
gnome-extensions show praytime@erho.dev

# Ayarları aç
gnome-extensions prefs praytime@erho.dev
```

## Kullanım

Extension etkinleştirildikten sonra GNOME Shell panelinde sonraki namaz vakti ve geri sayım görünür.

### Panel Görünümü

```
Öğle 12:30 (2:15:30)
```

- **Öğle**: Sonraki vakit adı
- **12:30**: Vakit saati
- **(2:15:30)**: Kalan süre (saat:dakika:saniye)

### Menü

Panel butonuna tıklayarak:

- Tüm vakitleri görebilirsiniz (05:52 - İmsak formatı)
- Konum bilgisini görebilirsiniz
- Ayarlara erişebilirsiniz
- Sürüm ve geliştirici bilgisini görebilirsiniz

## Ayarlar

### Konum Ayarları

- **Şehir Arama**: Diyanet API ile şehir arama
- **Konum ID**: Seçilen şehrin ID'si

### Bildirim Ayarları

- **Bildirimleri Etkinleştir**: Bildirim gösterimini aç/kapat
- **Önceden Bildir**: Vakit girmeden kaç dakika önce bildirim göster
- **Vakit Girince Bildir**: Vakit tam girdiğinde bildirim göster

### Görünüm Ayarları

- **Geri Sayım Göster**: Panelde kalan süreyi göster
- **Panel Konumu**: Extension'ın paneldeki konumu (Sol/Orta/Sağ)

## Hata Ayıklama

### Logları Görüntüleme

```bash
# Script ile (önerilen)
./scripts/logs.sh

# Manuel
journalctl --user -f -o cat | grep -i praytime
```

### Extension'ı Sıfırlama

```bash
# Ayarları sıfırla
dconf reset -f /org/gnome/shell/extensions/praytime/

# Extension'ı yeniden yükle
gnome-extensions disable praytime@erho.dev
gnome-extensions enable praytime@erho.dev
```

### Temizlik

```bash
./scripts/clean.sh
```

## Test

Proje kapsamlı birim testleri içerir (189 test, 9 dosya).

### Test Çalıştırma

```bash
cd tests

# Tüm testleri çalıştır
./run-tests.sh

# Paralel çalıştır (en hızlı)
./run-tests.sh -p

# Hızlı mod (sadece özet)
./run-tests.sh -q

# Tek test çalıştır
./run-tests.sh PrayerTime

# Kategori testleri
./run-tests.sh domain

# Watch modu (dosya değişikliklerini izler)
./run-tests.sh -w
```

### Test Yapısı

| Kategori | Testler | Açıklama |
|----------|---------|----------|
| Domain | PrayerTime, Location, PrayerSchedule, NullHandling, Constants | İş mantığı modelleri |
| Infrastructure | LocationProvider | Dış sistem entegrasyonları |
| Application | TimerManager, NotificationScheduler, PrayerTimeService | Servis katmanı |

### Test Script Seçenekleri

| Seçenek | Açıklama |
|---------|----------|
| `-p, --parallel` | Paralel çalıştır (en hızlı) |
| `-q, --quick` | Hızlı mod (sadece özet) |
| `-w, --watch` | Watch modu |
| `-v, --verbose` | Detaylı çıktı |
| `-l, --list` | Test listesi |
| `-h, --help` | Yardım |

## Proje Yapısı

```
praytime@erho.dev/
├── metadata.json           # Extension meta bilgileri
├── extension.js            # Ana extension sınıfı
├── prefs.js               # Ayarlar penceresi
├── stylesheet.css         # UI stilleri
├── schemas/               # GSettings şemaları
├── icons/                 # Uzantı ikonları
├── scripts/               # Geliştirme scriptleri
│   ├── install.sh         # Kurulum
│   ├── uninstall.sh       # Kaldırma
│   ├── dev.sh             # Geliştirme
│   ├── clean.sh           # Temizlik
│   ├── build.sh           # Build
│   └── logs.sh            # Log görüntüleme
├── tests/                 # Birim testleri
│   ├── run-tests.sh       # Test runner
│   ├── domain/            # Domain testleri
│   ├── infrastructure/    # Infrastructure testleri
│   ├── application/       # Application testleri
│   └── mocks/             # Test mock'ları
└── src/
    ├── config/            # Sabitler ve yapılandırma
    ├── domain/            # İş mantığı modelleri
    │   └── models/
    ├── infrastructure/    # Dış sistemler (API)
    │   └── api/
    ├── application/       # Servis katmanı
    └── presentation/      # UI bileşenleri
```

## API

Bu extension [prayertimes.api.abdus.dev](https://prayertimes.api.abdus.dev) API'sini kullanmaktadır.

## Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit'leyin (`git commit -m 'Yeni özellik eklendi'`)
4. Branch'e push'layın (`git push origin feature/yeni-ozellik`)
5. Pull Request açın

## Lisans

MIT License

## Geliştirici

[@erhanurgun](https://github.com/erhanurgun) - [erho.me](https://erho.me)

## Sürüm Geçmişi

Detaylı değişiklik geçmişi için [CHANGELOG.md](CHANGELOG.md) dosyasına bakın.
