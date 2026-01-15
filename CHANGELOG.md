# Changelog

Bu proje [Semantic Versioning](https://semver.org/) kullanmaktadır.

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
