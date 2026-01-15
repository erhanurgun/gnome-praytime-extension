# Geliştirme Kuralları

## Dil ve İletişim

- İletişim dili: **Türkçe** (UTF-8 uyumlu, özel karakterler korunmalı)
- Kodlama dili: **İngilizce** (değişken, fonksiyon, sınıf isimleri)
- Yorum satırları: **Türkçe**

### KRITIK: Türkçe Karakter Kullanımı

Yorum satırlarında ve Türkçe string'lerde Türkçe özel karakterler MUTLAKA kullanılmalıdır:

| Yanlış | Doğru |
|--------|-------|
| olustur | oluştur |
| guncelle | güncelle |
| duzelt | düzelt |
| islem | işlem |
| baslat | başlat |
| kaldır | kaldır |
| iptal | iptal |
| kontrol | kontrol |
| onceki | önceki |
| sonraki | sonraki |

Türkçe karakterler: ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü

ASLA ASCII karşılıklarını kullanma (c, g, i, o, s, u).

## Kod Standartları

- **SOLID** prensiplerine %100 uyum
- **DRY** (Don't Repeat Yourself)
- **KISS** (Keep It Simple, Stupid)
- **YAGNI** (You Aren't Gonna Need It)
- Gereksiz ve uzun yorum satırlarından kaçın

### KRITIK: Emoji Yasağı

- Kod, yorum, dokümantasyon ve planlarda ASLA emoji kullanma
- Görsel gösterim gerekiyorsa ikon seti kullan (örn: symbolic icons)
- Markdown dosyalarında liste işaretleri için sadece `-` veya `*` kullan
- Durum gösterimi için metin kullan: [TAMAMLANDI], [BEKLEMEDE], [HATA]

## Sürüm Yönetimi

- Semantic Versioning (SemVer) kullan:
  - **MAJOR**: Geriye uyumsuz API değişiklikleri
  - **MINOR**: Geriye uyumlu yeni özellikler
  - **PATCH**: Geriye uyumlu hata düzeltmeleri
- Her değişiklikte CHANGELOG.md güncelle

## Geliştirme Yaklaşımı

- Sr/Master seviyesinde profesyonel yaklaşım
- Yanlış yönlendirmelerde kullanıcıyı uyar
- Değişiklik öncesi analiz ve öneri sun
- Seçenekleri CLI üzerinden seçilebilir şekilde sun
- Tercih edilen seçenek 1. sırada olmalı

## Araçlar

- **AskUserQuestion**: Soru sormak için
- **TodoWrite**: Görevleri takip etmek için
- **ULTRATHINK**: Derin analiz ve planlama için
