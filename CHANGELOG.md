# Changelog

Bu proje [Semantic Versioning](https://semver.org/) kullanmaktadır.

## [0.6.1] - 2026-01-16

### Değişti
- "Görünüm Modu" dropdown'ı kaldırıldı, yerine bağımsız toggle'lar eklendi
- "İkonu Göster" ayarı eklendi (panelde cami ikonu göster/gizle)
- Artık İkon, Vakit Adı ve Vakit Saati bağımsız olarak açılıp kapatılabilir
- Kullanıcı deneyimi iyileştirildi (daha esnek görünüm kontrolü)

### Kaldırıldı
- display-mode GSettings ayarı kaldırıldı
- DISPLAY_MODES sabiti constants.js'ten kaldırıldı
- ComboRow görünüm seçici prefs.js'ten kaldırıldı

### Teknik
- gschema.xml: display-mode yerine show-icon boolean eklendi
- PanelButton._updatePanelLabel(): mode kontrolü yerine showIcon kullanılıyor
- prefs.js: ComboRow yerine SwitchRow (İkonu Göster)
- extension.js: display-mode handler -> show-icon handler
- Edge case: Tüm görünüm seçenekleri kapalıysa en azından saat gösteriliyor

## [0.5.5] - 2026-01-16

### Düzeltildi
- Bildirim sesi çalma hatası düzeltildi (paplay bulunamıyordu)
- PipeWire kullanan sistemlerde ses desteği eklendi (pw-play öncelikli)
- Proje içi ses dosyası (sounds/sound-01.mp3) artık doğru kullanılıyor
- sounds klasörü kuruluma dahil edildi

### Eklendi
- Cascading ses çalar desteği: pw-play > paplay > aplay
- Extension path NotificationManager'a iletiliyor

### Teknik
- NotificationManager: extensionPath parametresi eklendi
- NotificationManager._findSoundPlayer(): Mevcut ses çaları tespit eder ve önbelleğe alır
- NotificationManager._findSoundFile(): Önce proje içi, sonra sistem seslerini kontrol eder
- factory.js: createNotificationManager artık extension.path iletir
- install.sh: sounds klasörü kopyalama eklendi
- Bildirim gösterimi ses hatasından bağımsız hale getirildi

## [0.5.4] - 2026-01-16

### Düzeltildi
- CHANGELOG.md'deki tüm Türkçe karakter sorunları düzeltildi
- Türkçe özel karakterler (ç, ğ, ı, ö, ş, ü, İ) artık doğru görünüyor

## [0.5.3] - 2026-01-16

### Düzeltildi
- Panel konumu değişikliği artık anında uygulanıyor (Top Bar Organizer yaklaşımı)
- Sol konumda panel Activities'ten sonra görünüyor

### Teknik
- extension._repositionPanel(): Panel destroy/recreate yerine container taşıma yaklaşımı
- container.get_parent().remove_child() ile mevcut box'tan çıkarma
- panelBox.insert_child_at_index(container, -1) ile yeni box'a ekleme

## [0.5.2] - 2026-01-16

### Düzeltildi
- "Sadece İkon" görünüm modunda ikon artık görünüyor
- Panel ikonu tüm görünüm modlarında doğru çalışıyor

### Eklendi
- St.Icon desteği ile cami ikonu panele eklendi
- Gio import'u ile dosya sisteminden ikon yükleme

### Teknik
- PanelButton._buildPanel(): St.Icon oluşturma ve Gio.icon_new_for_string() ile SVG yükleme
- PanelButton._updatePanelLabel(): Görünüm moduna göre ikon/label görünürlük yönetimi
  - icon modu: sadece ikon göster
  - compact modu: ikon + metin göster
  - text modu: sadece metin göster

## [0.5.1] - 2026-01-16

### Düzeltildi
- Ayarlar panelinden yapılan değişiklikler artık anında etkili oluyor
- display-mode, show-prayer-name, show-prayer-time ayarları artık PanelButton'da kullanılıyor
- Bildirim ayarları (notifications-enabled, notify-before-minutes, notify-on-time) değiştiğinde bildirimler yeniden zamanlanıyor

### Eklendi
- extension.js: Bildirim ayar handler'ları (_rescheduleNotifications metodu)
- PrayerTimeService.js: rescheduleNotifications() metodu

### Teknik
- PanelButton._updatePanelLabel artık display-mode'a göre davranır (icon/text/compact)
- PanelButton.update artık tüm görünüm ayarlarını (showName, showTime, showCountdown) okuyor
- extension.js _handleSettingChange handler'larına notifications-enabled, notify-before-minutes, notify-on-time eklendi
- Ayar değişiklik propagasyonu düzeltildi - settings change signal'ları doğru handler'lara yönlendiriliyor

## [0.5.0] - 2026-01-16

### Eklendi
- Dependency Injection mimarisi (ServiceFactory)
- GLibTimerAdapter: timer soyutlama katmanı
- TimerManager: geri sayım ve günlük yenileme yönetimi
- NotificationScheduler: bildirim zamanlama servisi
- StyleHelper: DRY stil yönetimi
- MockTimerAdapter: test için timer simülasyonu
- TimerManager.test.js ve NotificationScheduler.test.js testleri

### Değişti
- PrayerTimeService artık sadece orchestrator (SRP)
- Factory pattern ile merkezi bağımlılık yönetimi
- prefs.js DRY yardımcı metodları eklendi
- extension.js handler map yapısı (KISS)
- Gereksiz yorumlar temizlendi (YAGNI)

### Teknik
- src/factory.js: ServiceFactory - lazy singleton DI container
- src/infrastructure/timer/GLibTimerAdapter.js: GLib timer wrapper
- src/application/TimerManager.js: countdown ve daily refresh
- src/application/NotificationScheduler.js: bildirim zamanlama
- src/presentation/helpers/StyleHelper.js: koşullu stil yönetimi
- tests/mocks/MockTimerAdapter.js: test timer simülasyonu
- SOLID/DRY/KISS/YAGNI prensiplerine %100 uyum

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
