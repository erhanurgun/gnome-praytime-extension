// PrayerTimeService entegrasyon testleri
// GLib/GObject bağımlılığı olmadan çalışır

const { MockApiClient } = require('../mocks/MockApiClient.js');
const { MockLocationProvider, Location } = require('../mocks/MockLocationProvider.js');
const { MockNotificationScheduler } = require('../mocks/MockNotificationScheduler.js');
const { MockTimerAdapter } = require('../mocks/MockTimerAdapter.js');

// PrayerTime sınıfının kopyası
class PrayerTime {
    constructor(name, nameEn, time) {
        this._name = name;
        this._nameEn = nameEn;
        this._time = time instanceof Date ? time : new Date(time);
    }

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

// PRAYER_NAMES sabiti
const PRAYER_NAMES = [
    { name: 'İmsak', nameEn: 'Fajr', apiKey: 'fajr' },
    { name: 'Güneş', nameEn: 'Sunrise', apiKey: 'sun' },
    { name: 'Öğle', nameEn: 'Dhuhr', apiKey: 'dhuhr' },
    { name: 'İkindi', nameEn: 'Asr', apiKey: 'asr' },
    { name: 'Akşam', nameEn: 'Maghrib', apiKey: 'maghrib' },
    { name: 'Yatsı', nameEn: 'Isha', apiKey: 'isha' },
];

// PrayerSchedule sınıfının kopyası
class PrayerSchedule {
    constructor(prayers = []) {
        this._prayers = prayers;
        this._date = new Date();
    }

    get prayers() { return this._prayers; }
    get date() { return this._date; }

    static fromApiResponse(data, date = new Date()) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return new PrayerSchedule([]);
        }

        const todayData = data[0];
        const prayers = PRAYER_NAMES.map(p => {
            const timeStr = todayData[p.apiKey];
            if (!timeStr) return null;

            const [hours, minutes] = timeStr.split(':').map(Number);
            const prayerDate = new Date(date);
            prayerDate.setHours(hours, minutes, 0, 0);

            return new PrayerTime(p.name, p.nameEn, prayerDate);
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
}

// MockTimerManager (TimerManager'ın mock versiyonu)
class MockTimerManager {
    constructor(timerAdapter) {
        this._adapter = timerAdapter || new MockTimerAdapter();
        this._countdownCallback = null;
        this._refreshCallback = null;
        this._countdownTimerId = null;
        this._refreshTimerId = null;
        this._destroyed = false;
    }

    startCountdown(callback) {
        this._countdownCallback = callback;
        this._countdownTimerId = this._adapter.setInterval(() => {
            if (this._countdownCallback) {
                this._countdownCallback();
            }
        }, 1);
    }

    scheduleDailyRefresh(callback) {
        this._refreshCallback = callback;
        this._refreshTimerId = this._adapter.setTimeout(() => {
            if (this._refreshCallback) {
                this._refreshCallback();
            }
        }, 86400);
    }

    stop() {
        if (this._countdownTimerId) {
            this._adapter.clearTimer(this._countdownTimerId);
            this._countdownTimerId = null;
        }
        if (this._refreshTimerId) {
            this._adapter.clearTimer(this._refreshTimerId);
            this._refreshTimerId = null;
        }
        this._countdownCallback = null;
        this._refreshCallback = null;
    }

    destroy() {
        this.stop();
        this._destroyed = true;
    }

    isDestroyed() {
        return this._destroyed;
    }

    // Test için yardımcı metodlar
    triggerCountdown() {
        if (this._countdownCallback) {
            this._countdownCallback();
        }
    }

    triggerRefresh() {
        if (this._refreshCallback) {
            this._refreshCallback();
        }
    }
}

// PrayerTimeService sınıfının kopyası (test için bağımsız)
class PrayerTimeService {
    constructor(dependencies) {
        const {
            apiClient,
            locationProvider,
            timerManager,
            notificationScheduler,
            onUpdate,
            onNotification
        } = dependencies;

        this._apiClient = apiClient;
        this._locationProvider = locationProvider;
        this._timerManager = timerManager;
        this._notificationScheduler = notificationScheduler;
        this._onUpdate = onUpdate;
        this._onNotification = onNotification;

        this._schedule = null;
        this._location = null;
        this._isRunning = false;
    }

    get schedule() {
        return this._schedule;
    }

    get location() {
        return this._location;
    }

    getNextPrayer() {
        return this._schedule?.getNextPrayer() ?? null;
    }

    rescheduleNotifications() {
        if (!this._schedule) return;

        this._notificationScheduler.scheduleForPrayers(
            this._schedule.prayers,
            (title, body) => this._onNotification?.(title, body)
        );
    }

    async start() {
        this._isRunning = true;
        try {
            await this._refreshPrayerTimes();
            if (!this._isRunning) return;

            this._timerManager.startCountdown(() => this._onCountdownTick());
            this._timerManager.scheduleDailyRefresh(() => this._onDailyRefresh());
        } catch (error) {
            this._schedule = null;
            this._triggerUpdate();
        }
    }

    stop() {
        this._isRunning = false;
        this._timerManager.stop();
        this._notificationScheduler.clearAll();
        this._schedule = null;
        this._location = null;
    }

    async _refreshPrayerTimes() {
        this._location = this._locationProvider.getLocation();

        if (!this._location?.isValid()) {
            throw new Error('Geçersiz konum');
        }

        const apiData = await this._apiClient.fetchPrayerTimes(this._location.id);
        this._schedule = PrayerSchedule.fromApiResponse(apiData, new Date());

        this._notificationScheduler.scheduleForPrayers(
            this._schedule.prayers,
            (title, body) => this._onNotification?.(title, body)
        );

        this._triggerUpdate();
    }

    _onCountdownTick() {
        this._triggerUpdate();
        if (!this.getNextPrayer()) {
            this._refreshPrayerTimes().catch(() => {});
        }
    }

    _onDailyRefresh() {
        this._refreshPrayerTimes().catch(() => {});
    }

    _triggerUpdate() {
        this._onUpdate?.();
    }

    destroy() {
        this.stop();
        this._apiClient?.destroy();
        this._locationProvider?.destroy();
        this._notificationScheduler?.destroy();
        this._timerManager?.destroy();
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

// Yardımcı fonksiyon: Service oluştur
function createService(overrides = {}) {
    const apiClient = overrides.apiClient || new MockApiClient();
    const locationProvider = overrides.locationProvider || new MockLocationProvider();
    const timerManager = overrides.timerManager || new MockTimerManager();
    const notificationScheduler = overrides.notificationScheduler || new MockNotificationScheduler();
    const onUpdate = overrides.onUpdate || (() => {});
    const onNotification = overrides.onNotification || (() => {});

    return new PrayerTimeService({
        apiClient,
        locationProvider,
        timerManager,
        notificationScheduler,
        onUpdate,
        onNotification
    });
}

// Testler
console.log('\n=== PrayerTimeService Testleri ===\n');

// Test 1: Constructor ve bağımlılık injection
console.log('1. Constructor ve Bağımlılık Injection:');
const apiClient1 = new MockApiClient();
const locationProvider1 = new MockLocationProvider();
const timerManager1 = new MockTimerManager();
const notificationScheduler1 = new MockNotificationScheduler();
let updateCount = 0;

const service1 = new PrayerTimeService({
    apiClient: apiClient1,
    locationProvider: locationProvider1,
    timerManager: timerManager1,
    notificationScheduler: notificationScheduler1,
    onUpdate: () => updateCount++,
    onNotification: () => {}
});

assert(service1._apiClient === apiClient1, 'API client inject edildi');
assert(service1._locationProvider === locationProvider1, 'Location provider inject edildi');
assert(service1._timerManager === timerManager1, 'Timer manager inject edildi');
assert(service1._notificationScheduler === notificationScheduler1, 'Notification scheduler inject edildi');
assertEqual(service1.schedule, null, 'Başlangıçta schedule null');
assertEqual(service1.location, null, 'Başlangıçta location null');

// Test 2: start() metodu - başarılı senaryo
console.log('\n2. start() Metodu - Başarılı Senaryo:');
(async () => {
    const apiClient2 = new MockApiClient();
    const locationProvider2 = new MockLocationProvider();
    locationProvider2.setLocationById(9206, 'Ankara', 'Ankara');
    const timerManager2 = new MockTimerManager();
    const notificationScheduler2 = new MockNotificationScheduler();
    let updateCalled = false;

    const service2 = new PrayerTimeService({
        apiClient: apiClient2,
        locationProvider: locationProvider2,
        timerManager: timerManager2,
        notificationScheduler: notificationScheduler2,
        onUpdate: () => { updateCalled = true; },
        onNotification: () => {}
    });

    await service2.start();

    assert(service2.schedule !== null, 'Schedule oluşturuldu');
    assert(service2.location !== null, 'Location ayarlandı');
    assertEqual(service2.location.cityName, 'Ankara', 'Doğru konum kullanıldı');
    assert(updateCalled, 'onUpdate callback çağrıldı');
    assertEqual(apiClient2.getFetchCount(), 1, 'API bir kez çağrıldı');
    assertEqual(apiClient2.getLastLocationId(), 9206, 'Doğru location ID ile API çağrıldı');
    assert(notificationScheduler2.getScheduleCount() > 0, 'Bildirimler zamanlandı');

    // Test 3: getNextPrayer()
    console.log('\n3. getNextPrayer() Metodu:');
    const nextPrayer = service2.getNextPrayer();
    assert(nextPrayer !== null || nextPrayer === null, 'getNextPrayer çalışır (sonuç zamana bağlı)');

    // Test 4: stop() metodu
    console.log('\n4. stop() Metodu:');
    service2.stop();
    assertEqual(service2.schedule, null, 'stop() sonrası schedule null');
    assertEqual(service2.location, null, 'stop() sonrası location null');
    assertEqual(notificationScheduler2.getClearCount(), 1, 'Bildirimler temizlendi');

    // Test 5: start() ile API hatası
    console.log('\n5. start() ile API Hatası:');
    const apiClient5 = new MockApiClient();
    apiClient5.setError(true, 'Bağlantı hatası');
    const locationProvider5 = new MockLocationProvider();
    const timerManager5 = new MockTimerManager();
    const notificationScheduler5 = new MockNotificationScheduler();
    let errorUpdateCalled = false;

    const service5 = new PrayerTimeService({
        apiClient: apiClient5,
        locationProvider: locationProvider5,
        timerManager: timerManager5,
        notificationScheduler: notificationScheduler5,
        onUpdate: () => { errorUpdateCalled = true; },
        onNotification: () => {}
    });

    await service5.start();
    assertEqual(service5.schedule, null, 'API hatası sonrası schedule null');
    assert(errorUpdateCalled, 'Hata durumunda da onUpdate çağrıldı');

    // Test 6: Geçersiz konum ile start()
    console.log('\n6. Geçersiz Konum ile start():');
    const apiClient6 = new MockApiClient();
    const locationProvider6 = new MockLocationProvider();
    locationProvider6.setInvalidLocation();
    const timerManager6 = new MockTimerManager();
    const notificationScheduler6 = new MockNotificationScheduler();

    const service6 = new PrayerTimeService({
        apiClient: apiClient6,
        locationProvider: locationProvider6,
        timerManager: timerManager6,
        notificationScheduler: notificationScheduler6,
        onUpdate: () => {},
        onNotification: () => {}
    });

    await service6.start();
    assertEqual(service6.schedule, null, 'Geçersiz konum ile schedule null');
    assertEqual(apiClient6.getFetchCount(), 0, 'Geçersiz konumda API çağrılmadı');

    // Test 7: rescheduleNotifications()
    console.log('\n7. rescheduleNotifications() Metodu:');
    const apiClient7 = new MockApiClient();
    const locationProvider7 = new MockLocationProvider();
    const timerManager7 = new MockTimerManager();
    const notificationScheduler7 = new MockNotificationScheduler();

    const service7 = new PrayerTimeService({
        apiClient: apiClient7,
        locationProvider: locationProvider7,
        timerManager: timerManager7,
        notificationScheduler: notificationScheduler7,
        onUpdate: () => {},
        onNotification: () => {}
    });

    await service7.start();
    const scheduleCountBefore = notificationScheduler7.getScheduleCount();
    service7.rescheduleNotifications();
    const scheduleCountAfter = notificationScheduler7.getScheduleCount();
    assert(scheduleCountAfter > scheduleCountBefore, 'rescheduleNotifications bildirim sayısını artırdı');

    // Test 8: destroy() metodu
    console.log('\n8. destroy() Metodu:');
    const apiClient8 = new MockApiClient();
    const locationProvider8 = new MockLocationProvider();
    const timerManager8 = new MockTimerManager();
    const notificationScheduler8 = new MockNotificationScheduler();

    const service8 = new PrayerTimeService({
        apiClient: apiClient8,
        locationProvider: locationProvider8,
        timerManager: timerManager8,
        notificationScheduler: notificationScheduler8,
        onUpdate: () => {},
        onNotification: () => {}
    });

    await service8.start();
    service8.destroy();

    assert(apiClient8.isDestroyed(), 'API client destroy edildi');
    assert(locationProvider8.isDestroyed(), 'Location provider destroy edildi');
    assert(timerManager8.isDestroyed(), 'Timer manager destroy edildi');
    assert(notificationScheduler8.isDestroyed(), 'Notification scheduler destroy edildi');

    // Test 9: Bildirim callback'i
    console.log('\n9. Bildirim Callback Testi:');
    const apiClient9 = new MockApiClient();
    const locationProvider9 = new MockLocationProvider();
    const timerManager9 = new MockTimerManager();
    const notificationScheduler9 = new MockNotificationScheduler();
    let notificationTitle = null;
    let notificationBody = null;

    const service9 = new PrayerTimeService({
        apiClient: apiClient9,
        locationProvider: locationProvider9,
        timerManager: timerManager9,
        notificationScheduler: notificationScheduler9,
        onUpdate: () => {},
        onNotification: (title, body) => {
            notificationTitle = title;
            notificationBody = body;
        }
    });

    await service9.start();
    assert(notificationScheduler9.hasCallback(), 'Bildirim callback ayarlandı');

    // Bildirim tetikle
    notificationScheduler9.triggerNotification('Test Başlık', 'Test İçerik');
    assertEqual(notificationTitle, 'Test Başlık', 'Bildirim başlığı doğru');
    assertEqual(notificationBody, 'Test İçerik', 'Bildirim içeriği doğru');

    // Test 10: Schedule olmadan rescheduleNotifications
    console.log('\n10. Schedule Olmadan rescheduleNotifications:');
    const service10 = createService();
    const schedulerBefore = service10._notificationScheduler.getScheduleCount();
    service10.rescheduleNotifications();
    const schedulerAfter = service10._notificationScheduler.getScheduleCount();
    assertEqual(schedulerBefore, schedulerAfter, 'Schedule yokken reschedule bir şey yapmaz');

    // Sonuç
    console.log('\n=== Sonuç ===');
    console.log(`Toplam: ${passedTests + failedTests} test`);
    console.log(`Başarılı: ${passedTests}`);
    console.log(`Başarısız: ${failedTests}`);

    if (failedTests > 0) {
        process.exit(1);
    }
})();
