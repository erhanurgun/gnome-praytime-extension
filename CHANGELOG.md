# Changelog

Bu proje [Semantic Versioning](https://semver.org/) kullanmaktadır.

## [0.4.0] - 2026-01-16

### Eklendi
- Dropdown ile il seçimi (81 Türkiye ili)
- Merkezi versiyon yönetimi (constants.js)
- Crash önleme mekanizmaları (null kontrolleri)
- TURKEY_CITIES listesi ve yardımcı fonksiyonlar

### Değişti
- Konum seçimi artık arama yerine dropdown ile yapılıyor
- Bağlantı hatası durumunda UI'da anlamlı mesaj gösteriliyor
- Versiyon bilgisi tek yerden (constants.js) yönetiliyor
- Hata durumunda extension crash olmuyor, UI güncelleniyor

### Kaldırıldı
- Şehir/ilçe arama özelliği (dropdown ile değiştirildi)
- Soup session gerekliliği prefs.js'ten kaldırıldı

### Teknik
- constants.js: APP_VERSION, APP_USER_AGENT, APP_DEVELOPER, APP_WEBSITE sabitleri
- constants.js: TURKEY_CITIES listesi (81 il, ID eşleştirmeli)
- constants.js: getCityIdByName, getCityNameById, getCityIndexById fonksiyonları
- PrayerTimeService.js: start() metoduna hata durumunda UI güncelleme
- PanelButton.js: schedule null kontrolü ve "Bağlantı hatası" mesajı
- prefs.js: Adw.ComboRow ile dropdown il seçimi
- Tüm user_agent ve versiyon referansları merkezi constants'tan alınıyor

## [0.3.0] - 2026-01-16

### Eklendi
- Geri sayım eşiği özelliği aktif hale getirildi (kalan süre > eşik ise geri sayım gizlenir)
- İl merkezleri arama sonuçlarında öncelikli gösteriliyor
- Birim testler eklendi (domain modelleri için)

### Düzeltildi
- Konum arama UI iyileştirildi (buton artık input'un yanında)
- Arama sonrası input otomatik temizleniyor
- countdown-threshold-minutes ayarı artık gerçekten çalışıyor

### Teknik
- PanelButton.js: Geri sayım eşiği kontrolü eklendi (satır 109-116)
- prefs.js: searchEntry.add_suffix() ile buton konumlandırması
- prefs.js: Arama sonuçları sıralaması (il merkezleri önce)
- tests/ klasörü eklendi (PrayerTime, Location, PrayerSchedule testleri)

## [0.2.3] - 2026-01-15

### Düzeltildi
- GNOME 46 prefs.js import path hatası düzeltildi
- Shell script dosyalarındaki Türkçe karakterler UTF-8'e çevrildi

### Değişti
- Panel menüsü sürüm formatı sadeleştirildi ("v0.2.3 | @erhanurgun")
- Hakkında sayfasında geliştirici bilgisi güncellendi ("@erhanurgun - Erhan ÜRGÜN")
- Bağlantılar kısmına "Tüm Bağlantılar" (erho.me) eklendi

### Teknik
- prefs.js import path: `resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js`
- 6 shell script dosyasında Türkçe karakter düzeltmeleri (install, build, dev, uninstall, clean, logs)

## [0.2.2] - 2026-01-15

### Değişti
- Vakit gösterim formatı "05:52 - İmsak" şeklinde düzenlendi (saat önce)
- Popup menüye sürüm ve geliştirici bilgisi eklendi
- Geliştirici satırına tıklandığında https://erho.me adresi açılıyor

### Teknik
- metadata.json'a developer ve developer-url alanları eklendi
- PanelButton.js'e GLib import'u ve version handler eklendi

## [0.2.1] - 2026-01-15

### Düzeltildi
- GNOME 47 Soup3 API uyumluluğu (Gio.Cancellable kullanımı)
- Konum arama HTTP isteklerinde hata yönetimi iyileştirildi
- Boş API yanıtı kontrolleri eklendi
- Version string tutarsızlığı giderildi
- Import path hatası düzeltildi (GNOME 45+ uyumluluğu)
- DRY ihlalleri giderildi (API_BASE_URL, PRAYER_NAMES merkezileştirildi)
- Bellek sızıntısı riskleri giderildi (signal handler cleanup)
- Async race condition koruması eklendi
- Timer callback guard'ları eklendi

### SOLID/DRY/KISS/YAGNI Düzeltmeleri
- Boş utils/ klasörü silindi (YAGNI)
- Kullanılmayan searchCity() metodu kaldırıldı (YAGNI)
- DISPLAY_MODES ve PANEL_POSITIONS sabitleri constants.js'e taşındı (DRY)
- prefs.js'te tekrarlanan modeMap/positionMap kaldırıldı (DRY)
- NotificationManager show/showUrgent metodları birleştirildi (DRY)
- LocationProvider gereksiz async kaldırıldı (KISS)

### Teknik
- src/config/constants.js dosyası eklendi (merkezi sabitler)
- getIndexFromValue/getValueFromIndex yardımcı fonksiyonları eklendi
- Debug loglama mekanizması eklendi
- TextDecoder UTF-8 encoding açıkça belirtildi
- Cancellable yönetimi iyileştirildi

## [0.2.0] - 2026-01-15

### Eklendi
- Geri sayım eşiği ayarı (varsayılan 60 dk, 5-180 dk arası)
- Görünüm modları: Tam Metin, Sadece İkon, Kompakt
- Panel konumu anında değişim desteği
- Timeline popup tasarımı (aktif/sonraki/geçmiş vakit ayrımı)
- Cami ikonu (mosque-symbolic.svg)
- Hakkında sayfası (geliştirici, lisans, GitHub linki)
- Bildirim sesi açma/kapama ayarı
- Vakit adı ve saati ayrı ayrı gösterme seçenekleri

### Değişti
- Ayarlar paneli tamamen yeniden tasarlandı (4 sayfa: Konum, Bildirimler, Görünüm, Hakkında)
- Popup menü timeline görünümüne geçirildi
- Geçmiş vakitler soluk, aktif vakit turuncu, sonraki vakit vurgulu
- UI/UX profesyonelleştirildi

### Teknik
- extension.js'e _repositionPanel metodu eklendi
- PanelButton.js tamamen yeniden yazıldı (Timeline desteği)
- stylesheet.css Timeline stilleri eklendi
- gschema.xml'e 5 yeni ayar eklendi

## [0.1.1] - 2026-01-15

### Düzeltildi
- Konum arama API hatası (async/callback sorunu)
- Bildirim mesajı görünmüyordu (GNOME 46+ API uyumluluğu)
- Bildirim sesi çalmıyordu (paplay entegrasyonu eklendi)
- Aktif vakit rengi Ubuntu turuncu (#E95420) yapıldı

### Değişti
- NotificationManager GNOME 46+ uyumlu hale getirildi
- Soup3 async callback yapısı düzeltildi

## [0.1.0] - 2026-01-15

### Eklendi
- GNOME 46/47/48 desteği ile ilk sürüm
- Panel üzerinde sonraki namaz vakti ve geri sayım gösterimi
- 6 vakit desteği: İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı
- Diyanet API ile şehir arama özelliği
- Vakit girişi ve 5 dakika öncesi bildirimleri
- Türkçe arayüz
- Ayarlar penceresi (Adw.PreferencesWindow)
- Clean Architecture mimari yapısı

### Değişti
- Varsayılan şehir: Ağrı (ID: 9185)
- Konum sistemi: Koordinat tabanlı yerine location_id tabanlı API

### Teknik Detaylar
- prayertimes.api.abdus.dev API entegrasyonu
- GSettings ile ayar yönetimi
- Soup3 ile HTTP istekleri
- MessageTray ile bildirimler
