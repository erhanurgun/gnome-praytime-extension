// Hibrit gettext wrapper
// tr: kaynak dil (Türkçe), en: JSON tabanlı çeviri

const TRANSLATIONS = {
    en: {
        // Namaz isimleri
        'İmsak': 'Imsak',
        'Güneş': 'Sunrise',
        'Öğle': 'Dhuhr',
        'İkindi': 'Asr',
        'Akşam': 'Maghrib',
        'Yatsı': 'Isha',
        'Teheccüd': 'Tahajjud',
        'Sahur': 'Suhur',

        // Panel konumları
        'Sol': 'Left',
        'Orta': 'Center',
        'Sağ': 'Right',

        // Konum modları
        'Şehir/Ülke': 'City/Country',
        'Enlem/Boylam': 'Latitude/Longitude',

        // PanelButton
        'Yükleniyor...': 'Loading...',
        'Namaz Vakitleri': 'Prayer Times',
        'Konum': 'Location',
        'Yenile': 'Refresh',
        'Ayarlar': 'Settings',
        'Hata': 'Error',
        'Bağlantı hatası': 'Connection error',
        'Yüklenemedi': 'Failed to load',

        // NotificationScheduler - format string'ler
        '%d dakika sonra %s': '%d minutes until %s',
        '%s vakti %s\'de girecek': '%s time will start at %s',
        '%s vakti girdi': '%s time has started',
        'Şimdi %s vakti': 'It is now %s time',

        // Prefs sayfaları
        'Konum Ayarları': 'Location Settings',
        'İl Seçimi': 'City Selection',
        'İl': 'City',
        'Bildirimler': 'Notifications',
        'Bildirim Ayarları': 'Notification Settings',
        'Bildirimleri Etkinleştir': 'Enable Notifications',
        'Namaz vakti girince bildirim göster': 'Show notification when prayer time arrives',
        'Önceden Bildir': 'Notify Before',
        'Vakit girmeden kaç dakika önce bildirim göster': 'Notify this many minutes before prayer time',
        'Vakit Girince Bildir': 'Notify on Time',
        'Vakit tam girdiğinde bildirim göster': 'Show notification exactly at prayer time',
        'Bildirim Sesi': 'Notification Sound',
        'Bildirim geldiğinde ses çal': 'Play sound on notification',
        'Ek Vakitler': 'Extra Prayers',
        'Ramazan Ayarları': 'Ramadan Settings',
        'Sahur vakti ve Ramazan modu ayarları': 'Suhur time and Ramadan mode settings',
        'Ramazan Modu': 'Ramadan Mode',
        'Sahur vaktinin ne zaman gösterileceğini belirler': 'Determines when Suhur time is displayed',
        'Otomatik (Hicri Takvim)': 'Automatic (Hijri Calendar)',
        'Her Zaman Açık': 'Always On',
        'Kapalı': 'Off',
        'Sahur Bildirimi': 'Suhur Notification',
        'Ramazan\'da sahur vaktini göster ve bildirim gönder': 'Show Suhur time during Ramadan and send notification',
        'Sahur Süresi': 'Suhur Duration',
        'İmsak\'tan kaç dakika önce sahur vakti başlasın': 'Minutes before Imsak for Suhur to begin',
        'Teheccüd Ayarları': 'Tahajjud Settings',
        'Gecenin son üçte birinde kılınan nafile namaz': 'Voluntary prayer in the last third of the night',
        'Teheccüd Bildirimi': 'Tahajjud Notification',
        'Teheccüd vaktini göster ve bildirim gönder': 'Show Tahajjud time and send notification',
        'Teheccüd Ofseti': 'Tahajjud Offset',
        'Gecenin son üçte birinden kaç dakika kaydırılsın': 'Minutes offset from the last third of the night',
        'Görünüm': 'Display',
        'Panel Görünümü': 'Panel Display',
        'Paneldeki görünüm ayarları': 'Panel display settings',
        'İkonu Göster': 'Show Icon',
        'Panelde cami ikonu': 'Mosque icon in panel',
        'Vakit Adını Göster': 'Show Prayer Name',
        'Vakit Saatini Göster': 'Show Prayer Time',
        'Geri Sayım': 'Countdown',
        'Vakte kalan süre gösterimi': 'Time remaining display',
        'Geri Sayım Göster': 'Show Countdown',
        'Sonraki vakte kalan süreyi göster': 'Show time remaining until next prayer',
        'Geri Sayım Eşiği': 'Countdown Threshold',
        'Ne kadar süre kala geri sayım başlasın (dakika)': 'Start countdown this many minutes before',
        'Panel Konumu': 'Panel Position',
        'Extension panelde nerede gösterilecek': 'Where the extension appears in the panel',
        'Hakkında': 'About',
        'Geliştirici': 'Developer',
        'Lisans': 'License',
        'Bağlantılar': 'Links',
        'Tüm Bağlantılar': 'All Links',
        'Kaynak kodu görüntüle': 'View source code',
        'Hata Bildir': 'Report Issue',
        'Sorun veya önerileri bildirin': 'Report issues or suggestions',

        // Prefs - Konum sayfası (yeni)
        'Konum Yöntemi': 'Location Method',
        'Konum Modu': 'Location Mode',
        'Namaz vakitlerinin hesaplanacağı konumu belirleyin': 'Set the location for prayer time calculation',
        'Ülke': 'Country',
        'Şehir Adı': 'City Name',
        'Konum Bilgisi': 'Location Info',
        'Enlem': 'Latitude',
        'Boylam': 'Longitude',
        'Hesaplama Metodu': 'Calculation Method',
        'Hesaplama Yöntemi': 'Calculation Method',
        'Namaz vakitlerinin hesaplanacağı yöntemi seçin': 'Select prayer time calculation method',
        'Dil': 'Language',
        'Dil Ayarları': 'Language Settings',
        'Türkçe': 'Turkish',
        'English': 'English',
        'Türkiye\'nin 81 ilinden birini seçin': 'Select from 81 cities of Turkey',
        'Namaz vakitlerinin hesaplanacağı ili seçin': 'Select the city for prayer time calculation',
        'Vakitler Diyanet İşleri Başkanlığı verilerine göre hesaplanır': 'Times calculated using Diyanet (Turkish Religious Authority) data',
        'Koordinatları maps.google.com\'dan alabilirsiniz': 'You can get coordinates from maps.google.com',

        // Prefs - Görünüm
        '"İkindi" gibi vakit ismi': 'Prayer name like "Asr"',
        '"14:52" gibi saat bilgisi': 'Time like "14:52"',

        // Prefs - Sürüm
        'Sürüm': 'Version',

        // Prefs - Geliştirici
        'Geliştirici hakkında': 'About the developer',
    },
};

// Manuel dil seçimi için çeviri wrapper oluştur
export function createGettextWrapper(settings) {
    const language = settings.get_string('language');

    if (language === 'tr') {
        return (s) => s;
    }

    const table = TRANSLATIONS[language];
    if (!table) {
        // Bilinmeyen dil değeri -- kaynak dile (Türkçe) fallback
        return (s) => s;
    }

    return (s) => table[s] || s;
}
