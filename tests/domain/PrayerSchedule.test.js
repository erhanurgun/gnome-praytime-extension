// PrayerSchedule birim testleri
// GLib/GObject bağımlılığı olmadan çalışır

// PrayerTime sınıfının kopyası
class PrayerTime {
    constructor(id, name, nameEn, time) {
        this._id = id;
        this._name = name;
        this._nameEn = nameEn;
        this._time = time instanceof Date ? time : new Date(time);
    }

    get id() { return this._id; }
    get name() { return this._name; }
    get nameEn() { return this._nameEn; }
    get time() { return this._time; }

    get timeString() {
        const hours = this._time.getHours().toString().padStart(2, '0');
        const minutes = this._time.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    getSecondsUntil(fromDate = new Date()) {
        return Math.floor((this._time.getTime() - fromDate.getTime()) / 1000);
    }

    isPassed(fromDate = new Date()) {
        return fromDate >= this._time;
    }
}

// PRAYER_NAMES sabiti (test için) - id bazlı
const PRAYER_NAMES = [
    { id: 'imsak',   name: 'İmsak',   nameEn: 'Imsak',   apiKey: 'Imsak' },
    { id: 'gunes',   name: 'Güneş',   nameEn: 'Sunrise',  apiKey: 'Sunrise' },
    { id: 'ogle',    name: 'Öğle',    nameEn: 'Dhuhr',    apiKey: 'Dhuhr' },
    { id: 'ikindi',  name: 'İkindi',  nameEn: 'Asr',      apiKey: 'Asr' },
    { id: 'aksam',   name: 'Akşam',   nameEn: 'Maghrib',  apiKey: 'Maghrib' },
    { id: 'yatsi',   name: 'Yatsı',   nameEn: 'Isha',     apiKey: 'Isha' },
];

// PrayerSchedule sınıfının kopyası - id bazlı eşleme
class PrayerSchedule {
    constructor(prayers = []) {
        this._prayers = prayers;
        this._date = new Date();
    }

    get prayers() { return this._prayers; }
    get date() { return this._date; }

    static fromApiResponse(data, date = new Date(), gettext = null) {
        const _ = gettext || ((s) => s);

        const prayers = PRAYER_NAMES.map(p => {
            const timeStr = data[p.id];
            if (!timeStr) return null;

            const [hours, minutes] = timeStr.split(':').map(Number);
            const prayerDate = new Date(date);
            prayerDate.setHours(hours, minutes, 0, 0);

            return new PrayerTime(p.id, _(p.name), p.nameEn, prayerDate);
        }).filter(p => p !== null);

        const schedule = new PrayerSchedule(prayers);
        schedule._date = date;
        return schedule;
    }

    getNextPrayer(fromDate = new Date()) {
        for (const prayer of this._prayers) {
            if (!prayer.isPassed(fromDate)) {
                return prayer;
            }
        }
        return null;
    }

    getCurrentPrayer(fromDate = new Date()) {
        let current = null;
        for (const prayer of this._prayers) {
            if (prayer.isPassed(fromDate)) {
                current = prayer;
            } else {
                break;
            }
        }
        return current;
    }

    insertPrayer(prayer) {
        const index = this._prayers.findIndex(p => p.time > prayer.time);
        if (index === -1) {
            this._prayers.push(prayer);
        } else {
            this._prayers.splice(index, 0, prayer);
        }
    }

    getPrayerById(id) {
        return this._prayers.find(p => p.id === id);
    }

    getPrayerByName(name) {
        return this._prayers.find(p => p.name === name || p.nameEn === name);
    }
}

// Test yardımcısı
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  [BAŞARILI] ${message}`);
        passedTests++;
    } else {
        console.log(`  [HATALI] ${message}`);
        failedTests++;
    }
}

function assertEqual(actual, expected, message) {
    const passed = actual === expected;
    if (passed) {
        console.log(`  [BAŞARILI] ${message}`);
        passedTests++;
    } else {
        console.log(`  [HATALI] ${message}`);
        console.log(`    Beklenen: ${expected}`);
        console.log(`    Gerçek: ${actual}`);
        failedTests++;
    }
}

// Test verisi - id bazlı anahtarlar
const testApiData = {
    'imsak': '05:30',
    'gunes': '07:00',
    'ogle': '12:30',
    'ikindi': '15:30',
    'aksam': '18:00',
    'yatsi': '19:30'
};

const testDate = new Date(2026, 0, 16, 0, 0, 0);

// Testler
console.log('\n=== PrayerSchedule Testleri ===\n');

// Test 1: fromApiResponse - id bazlı eşleme
console.log('1. fromApiResponse Testleri:');
const schedule = PrayerSchedule.fromApiResponse(testApiData, testDate);
assertEqual(schedule.prayers.length, 6, '6 vakit oluşturulur');
assertEqual(schedule.prayers[0].id, 'imsak', 'İlk vakit id\'si imsak');
assertEqual(schedule.prayers[0].name, 'İmsak', 'İlk vakit adı İmsak');
assertEqual(schedule.prayers[0].timeString, '05:30', 'İmsak vakti 05:30');
assertEqual(schedule.prayers[5].id, 'yatsi', 'Son vakit id\'si yatsi');
assertEqual(schedule.prayers[5].name, 'Yatsı', 'Son vakit adı Yatsı');

// Test 2: getNextPrayer
console.log('\n2. getNextPrayer Testleri:');
const at0600 = new Date(2026, 0, 16, 6, 0, 0);
const nextAt0600 = schedule.getNextPrayer(at0600);
assertEqual(nextAt0600.id, 'gunes', 'Saat 06:00\'da sonraki vakit gunes');

const at1200 = new Date(2026, 0, 16, 12, 0, 0);
const nextAt1200 = schedule.getNextPrayer(at1200);
assertEqual(nextAt1200.id, 'ogle', 'Saat 12:00\'da sonraki vakit ogle');

const at2000 = new Date(2026, 0, 16, 20, 0, 0);
const nextAt2000 = schedule.getNextPrayer(at2000);
assertEqual(nextAt2000, null, 'Tüm vakitler geçtikten sonra null döner');

const at0400 = new Date(2026, 0, 16, 4, 0, 0);
const nextAt0400 = schedule.getNextPrayer(at0400);
assertEqual(nextAt0400.id, 'imsak', 'Günün başında sonraki vakit imsak');

// Test 3: getCurrentPrayer
console.log('\n3. getCurrentPrayer Testleri:');
const current0600 = schedule.getCurrentPrayer(at0600);
assertEqual(current0600.id, 'imsak', 'Saat 06:00\'da aktif vakit imsak');

const current1300 = schedule.getCurrentPrayer(new Date(2026, 0, 16, 13, 0, 0));
assertEqual(current1300.id, 'ogle', 'Saat 13:00\'da aktif vakit ogle');

const current0400 = schedule.getCurrentPrayer(at0400);
assertEqual(current0400, null, 'Gün başında hiç vakit geçmemiş, null döner');

const current2100 = schedule.getCurrentPrayer(new Date(2026, 0, 16, 21, 0, 0));
assertEqual(current2100.id, 'yatsi', 'Gün sonunda aktif vakit yatsi');

// Test 4: getPrayerById
console.log('\n4. getPrayerById Testleri:');
const ogle = schedule.getPrayerById('ogle');
assertEqual(ogle.id, 'ogle', 'id ile vakit bulunur');
assertEqual(ogle.name, 'Öğle', 'Bulunan vaktin adı doğru');
assertEqual(ogle.timeString, '12:30', 'Bulunan vaktin saati doğru');

const imsak = schedule.getPrayerById('imsak');
assertEqual(imsak.name, 'İmsak', 'İmsak id ile bulunur');

const notFound = schedule.getPrayerById('tahajjud');
assertEqual(notFound, undefined, 'Olmayan id undefined döner');

// Test 5: getPrayerByName (geriye dönük uyumluluk)
console.log('\n5. getPrayerByName Testleri:');
const ogleByName = schedule.getPrayerByName('Öğle');
assertEqual(ogleByName.name, 'Öğle', 'Türkçe isimle vakit bulunur');

const dhuhr = schedule.getPrayerByName('Dhuhr');
assertEqual(dhuhr.name, 'Öğle', 'İngilizce isimle vakit bulunur');

const notFoundByName = schedule.getPrayerByName('Teheccüd');
assertEqual(notFoundByName, undefined, 'Olmayan vakit undefined döner');

// Test 6: Eksik veri ile fromApiResponse
console.log('\n6. Eksik Veri Testleri:');
const partialData = {
    'imsak': '05:30',
    'ogle': '12:30',
    'aksam': '18:00'
};
const partialSchedule = PrayerSchedule.fromApiResponse(partialData, testDate);
assertEqual(partialSchedule.prayers.length, 3, 'Sadece mevcut vakitler oluşturulur');

// Test 7: insertPrayer - kronolojik sıra
console.log('\n7. insertPrayer Testleri:');
const insertSchedule = PrayerSchedule.fromApiResponse(testApiData, testDate);
assertEqual(insertSchedule.prayers.length, 6, 'Başlangıçta 6 vakit');

// Teheccüd: 03:30 - İmsak'tan (05:30) önce
const tahajjudTime = new Date(testDate);
tahajjudTime.setHours(3, 30, 0, 0);
insertSchedule.insertPrayer(new PrayerTime('tahajjud', 'Teheccüd', 'Tahajjud', tahajjudTime));
assertEqual(insertSchedule.prayers.length, 7, 'insertPrayer sonrası 7 vakit');
assertEqual(insertSchedule.prayers[0].id, 'tahajjud', 'Teheccüd ilk sıraya eklendi (03:30 < 05:30)');

// Sahur: 05:00 - Teheccüd (03:30) ve İmsak (05:30) arasına
const sahurTime = new Date(testDate);
sahurTime.setHours(5, 0, 0, 0);
insertSchedule.insertPrayer(new PrayerTime('sahur', 'Sahur', 'Suhur', sahurTime));
assertEqual(insertSchedule.prayers.length, 8, 'Sahur eklendi, 8 vakit');
assertEqual(insertSchedule.prayers[0].id, 'tahajjud', 'Teheccüd hala ilk');
assertEqual(insertSchedule.prayers[1].id, 'sahur', 'Sahur ikinci sırada');
assertEqual(insertSchedule.prayers[2].id, 'imsak', 'İmsak üçüncü sırada');

// Test 8: insertPrayer - sona ekleme (tüm vakitlerden sonra)
console.log('\n8. insertPrayer - Sona Ekleme:');
const lateSchedule = PrayerSchedule.fromApiResponse(testApiData, testDate);
const lateTime = new Date(testDate);
lateTime.setHours(23, 0, 0, 0);
lateSchedule.insertPrayer(new PrayerTime('gece', 'Gece', 'Night', lateTime));
assertEqual(lateSchedule.prayers.length, 7, 'Sona ekleme sonrası 7 vakit');
assertEqual(lateSchedule.prayers[6].id, 'gece', 'Son vakit doğru');

// Test 9: insertPrayer sonrası getNextPrayer doğru çalışır
console.log('\n9. insertPrayer Sonrası getNextPrayer:');
const at0300 = new Date(2026, 0, 16, 3, 0, 0);
const nextAfterInsert = insertSchedule.getNextPrayer(at0300);
assertEqual(nextAfterInsert.id, 'tahajjud', '03:00\'da sonraki vakit Teheccüd (03:30)');

const at0330 = new Date(2026, 0, 16, 3, 35, 0);
const nextAfter0335 = insertSchedule.getNextPrayer(at0330);
assertEqual(nextAfter0335.id, 'sahur', '03:35\'te sonraki vakit Sahur (05:00)');

// Test 10: fromApiResponse gettext parametresi
console.log('\n10. fromApiResponse Gettext Parametresi:');
const mockGettext = (s) => s === 'İmsak' ? 'Fajr' : s;
const gettextSchedule = PrayerSchedule.fromApiResponse(testApiData, testDate, mockGettext);
assertEqual(gettextSchedule.prayers[0].name, 'Fajr', 'Gettext ile çevrilmiş isim');
assertEqual(gettextSchedule.prayers[0].id, 'imsak', 'id gettext\'ten etkilenmez');

// Test 11: getPrayerById insert sonrası
console.log('\n11. getPrayerById Insert Sonrası:');
const tahajjudById = insertSchedule.getPrayerById('tahajjud');
assertEqual(tahajjudById.name, 'Teheccüd', 'Insert edilen vakit id ile bulunur');
const sahurById = insertSchedule.getPrayerById('sahur');
assertEqual(sahurById.name, 'Sahur', 'Sahur id ile bulunur');

// Sonuç
console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
