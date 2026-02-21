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

        // Konum validasyon mesajları
        'Geçersiz konum bilgisi': 'Invalid location data',
        'Ülke adı girilmedi': 'Country name is empty',
        'Şehir adı girilmedi': 'City name is empty',
        'Girilen şehir veya ülke bulunamadı': 'City or country not found',
        'Ağ bağlantısı hatası': 'Network connection error',
        'Konum doğrulanamadı': 'Location could not be verified',
        'Lütfen konum bilgilerinizi kontrol edin': 'Please check your location settings',
        'İnternet bağlantınızı kontrol edin': 'Please check your internet connection',

        // Tooltip metinleri - Konum sayfası
        'Şehir/Ülke: Şehir ve ülke adıyla konum belirler.\nEnlem/Boylam: GPS koordinatlarıyla. Daha hassas sonuç verir.':
            'City/Country: Set location by city and country name.\nLatitude/Longitude: By GPS coordinates. More precise results.',
        'Ülke adını İngilizce girin.\nÖrnekler: Turkey, Germany, France, United Kingdom, Egypt':
            'Enter country name in English.\nExamples: Turkey, Germany, France, United Kingdom, Egypt',
        'Şehir adını İngilizce girin.\nÖrnekler: Istanbul, Berlin, Paris, London, Cairo':
            'Enter city name in English.\nExamples: Istanbul, Berlin, Paris, London, Cairo',
        'Enlem değeri -90 ile 90 arasında olmalıdır.\nmaps.google.com adresinden koordinatlarınızı öğrenebilirsiniz.':
            'Latitude must be between -90 and 90.\nYou can find your coordinates at maps.google.com.',
        'Boylam değeri -180 ile 180 arasında olmalıdır.\nmaps.google.com adresinden koordinatlarınızı öğrenebilirsiniz.':
            'Longitude must be between -180 and 180.\nYou can find your coordinates at maps.google.com.',
        'Bölgenize uygun hesaplama yöntemini seçin.\nTürkiye: Diyanet İşleri Başkanlığı\nAvrupa: MWL veya ISNA\nKörfez: Umm Al-Qura':
            'Select the calculation method for your region.\nTurkey: Diyanet (Religious Authority)\nEurope: MWL or ISNA\nGulf: Umm Al-Qura',

        // Tooltip metinleri - Bildirimler
        'Vakit girmeden belirtilen dakika kadar önce ön bildirim gönderilir.':
            'A pre-notification will be sent the specified minutes before prayer time.',

        // Tooltip metinleri - Ek Vakitler
        'Otomatik: Hicri takvime göre Ramazan ayını otomatik tespit eder.\nHer Zaman: Yıl boyunca sahur vaktini gösterir.\nKapalı: Sahur vaktini gizler.':
            'Automatic: Detects Ramadan automatically from Hijri calendar.\nAlways: Shows Suhur time all year.\nOff: Hides Suhur time.',
        'İmsak vaktinden belirtilen dakika kadar önce sahur vakti başlar.':
            'Suhur time starts the specified minutes before Imsak.',
        'Gecenin son üçte birinden belirtilen dakika kadar kaydırır.\nNegatif: daha erken, Pozitif: daha geç.':
            'Shifts from the last third of the night by the specified minutes.\nNegative: earlier, Positive: later.',

        // Tooltip metinleri - Görünüm
        'Sonraki vakte bu kadar dakika veya daha az kaldığında panelde geri sayım başlar.':
            'Countdown starts in the panel when this many minutes or less remain until the next prayer.',
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
