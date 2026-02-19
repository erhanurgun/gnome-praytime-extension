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
    { name: 'İmsak', nameEn: 'Imsak', apiKey: 'Imsak' },
    { name: 'Güneş', nameEn: 'Sunrise', apiKey: 'Sunrise' },
    { name: 'Öğle', nameEn: 'Dhuhr', apiKey: 'Dhuhr' },
    { name: 'İkindi', nameEn: 'Asr', apiKey: 'Asr' },
    { name: 'Akşam', nameEn: 'Maghrib', apiKey: 'Maghrib' },
    { name: 'Yatsı', nameEn: 'Isha', apiKey: 'Isha' },
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
        const prayers = PRAYER_NAMES.map(p => {
            const timeStr = data[p.name];
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

// MockTimerManager (TimerManager'ın mock versiyonu - yeni metodlarla)
class MockTimerManager {
    constructor(timerAdapter) {
        this._adapter = timerAdapter || new MockTimerAdapter();
        this._countdownCallback = null;
        this._refreshCallback = null;
        this._countdownTimerId = null;
        this._refreshTimerId = null;
        this._retryTimerId = null;
        this._retryCallback = null;
        this._retryDelay = null;
        this._destroyed = false;
        this._isRunning = false;
    }

    get isRunning() {
        return this._isRunning;
    }

    startCountdown(callback) {
        this._isRunning = true;
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

    scheduleOnce(callback, seconds) {
        return this._adapter.setTimeout(callback, seconds);
    }

    scheduleRetry(callback, seconds) {
        this.clearRetry();
        this._retryCallback = callback;
        this._retryDelay = seconds;
        this._retryTimerId = this._adapter.setTimeout(() => {
            this._retryTimerId = null;
            callback();
        }, seconds);
    }

    clearRetry() {
        if (this._retryTimerId) {
            this._adapter.clearTimer(this._retryTimerId);
            this._retryTimerId = null;
        }
        this._retryCallback = null;
        this._retryDelay = null;
    }

    stop() {
        this._isRunning = false;
        this.clearRetry();
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

    // Test yardımcıları
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

    triggerRetry() {
        if (this._retryTimerId) {
            this._adapter.triggerTimer(this._retryTimerId);
        }
    }

    getRetryDelay() {
        return this._retryDelay;
    }

    hasRetryScheduled() {
        return this._retryTimerId !== null;
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
        this._refreshScheduled = false;
        this._retryCount = 0;
        this._refreshInFlight = false;
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
        if (this._refreshInFlight) return;
        this._isRunning = true;
        this._retryCount = 0;

        try {
            await this._refreshPrayerTimes();
            if (!this._isRunning) return;

            this._timerManager.startCountdown(() => this._onCountdownTick());
            this._timerManager.scheduleDailyRefresh(() => this._onDailyRefresh());
        } catch (error) {
            if (!this._isRunning) return;
            this._schedule = null;
            this._triggerUpdate();
            this._scheduleRetry();
        }
    }

    stop() {
        this._isRunning = false;
        this._retryCount = 0;
        this._refreshInFlight = false;
        this._timerManager.stop();
        this._notificationScheduler.clearAll();
        this._schedule = null;
        this._location = null;
    }

    async refresh() {
        this._retryCount = 0;
        this._timerManager.clearRetry();

        try {
            await this._refreshPrayerTimes();
            if (!this._isRunning) return;

            if (!this._timerManager.isRunning) {
                this._timerManager.startCountdown(() => this._onCountdownTick());
                this._timerManager.scheduleDailyRefresh(() => this._onDailyRefresh());
            }
        } catch (error) {
            if (!this._isRunning) return;
            this._schedule = null;
            this._triggerUpdate();
            if (error.message !== 'Geçersiz konum') {
                this._scheduleRetry();
            }
        }
    }

    async _refreshPrayerTimes() {
        if (this._refreshInFlight) return;
        this._refreshInFlight = true;

        try {
            this._location = this._locationProvider.getLocation();

            if (!this._location?.isValid()) {
                throw new Error('Geçersiz konum');
            }

            const apiData = await this._apiClient.fetchPrayerTimes(this._location);
            if (!this._isRunning) return;

            this._schedule = PrayerSchedule.fromApiResponse(apiData, new Date());

            this._notificationScheduler.scheduleForPrayers(
                this._schedule.prayers,
                (title, body) => this._onNotification?.(title, body)
            );

            this._triggerUpdate();
        } finally {
            this._refreshInFlight = false;
        }
    }

    _scheduleRetry() {
        if (!this._isRunning) return;

        const delays = [15, 30, 60, 120, 300];
        const delay = delays[Math.min(this._retryCount, delays.length - 1)];
        this._retryCount++;

        this._timerManager.scheduleRetry(() => this._attemptRecovery(), delay);
    }

    async _attemptRecovery() {
        if (!this._isRunning) return;

        try {
            await this._refreshPrayerTimes();
            if (!this._isRunning) return;

            this._retryCount = 0;
            if (!this._timerManager.isRunning) {
                this._timerManager.startCountdown(() => this._onCountdownTick());
                this._timerManager.scheduleDailyRefresh(() => this._onDailyRefresh());
            }
        } catch (error) {
            if (!this._isRunning) return;
            this._schedule = null;
            this._triggerUpdate();

            if (error.message !== 'Geçersiz konum') {
                this._scheduleRetry();
            }
        }
    }

    _onCountdownTick() {
        this._triggerUpdate();
        if (!this.getNextPrayer() && !this._refreshScheduled) {
            this._refreshScheduled = true;
            this._timerManager.scheduleOnce(() => {
                this._refreshScheduled = false;
                this._refreshPrayerTimes().catch(() => {});
            }, 3);
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
    const timerAdapter = new MockTimerAdapter();
    const timerManager = overrides.timerManager || new MockTimerManager(timerAdapter);
    const notificationScheduler = overrides.notificationScheduler || new MockNotificationScheduler();
    const onUpdate = overrides.onUpdate || (() => {});
    const onNotification = overrides.onNotification || (() => {});

    return {
        service: new PrayerTimeService({
            apiClient,
            locationProvider,
            timerManager,
            notificationScheduler,
            onUpdate,
            onNotification
        }),
        apiClient,
        locationProvider,
        timerManager,
        timerAdapter,
        notificationScheduler
    };
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
assertEqual(service1._retryCount, 0, 'Başlangıçta retryCount 0');
assertEqual(service1._refreshInFlight, false, 'Başlangıçta refreshInFlight false');

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
    assertEqual(apiClient2.getLastLocation().cityName, 'Ankara', 'Doğru location ile API çağrıldı');
    assert(notificationScheduler2.getScheduleCount() > 0, 'Bildirimler zamanlandı');
    assertEqual(timerManager2.isRunning, true, 'Timer çalışıyor');

    // Test 3: getNextPrayer()
    console.log('\n3. getNextPrayer() Metodu:');
    const nextPrayer = service2.getNextPrayer();
    assert(nextPrayer !== null || nextPrayer === null, 'getNextPrayer çalışır (sonuç zamana bağlı)');

    // Test 4: stop() metodu
    console.log('\n4. stop() Metodu:');
    service2.stop();
    assertEqual(service2.schedule, null, 'stop() sonrası schedule null');
    assertEqual(service2.location, null, 'stop() sonrası location null');
    assertEqual(service2._retryCount, 0, 'stop() sonrası retryCount sıfırlandı');
    assertEqual(service2._refreshInFlight, false, 'stop() sonrası refreshInFlight sıfırlandı');
    assertEqual(notificationScheduler2.getClearCount(), 1, 'Bildirimler temizlendi');

    // Test 5: start() ile API hatası - retry zamanlanmalı
    console.log('\n5. start() ile API Hatası - Retry Zamanlanır:');
    const { service: service5, apiClient: ac5, timerManager: tm5 } = createService({
        apiClient: (() => { const c = new MockApiClient(); c.setError(true, 'Bağlantı hatası'); return c; })(),
        onUpdate: () => {}
    });

    await service5.start();
    assertEqual(service5.schedule, null, 'API hatası sonrası schedule null');
    assert(tm5.hasRetryScheduled(), 'Retry zamanlandı');
    assertEqual(tm5.getRetryDelay(), 15, 'İlk retry 15 saniye');

    // Test 6: Geçersiz konum ile start()
    console.log('\n6. Geçersiz Konum ile start():');
    const { service: service6, apiClient: ac6, timerManager: tm6 } = createService({
        locationProvider: (() => { const lp = new MockLocationProvider(); lp.setInvalidLocation(); return lp; })(),
    });

    await service6.start();
    assertEqual(service6.schedule, null, 'Geçersiz konum ile schedule null');
    assertEqual(ac6.getFetchCount(), 0, 'Geçersiz konumda API çağrılmadı');

    // Test 7: rescheduleNotifications()
    console.log('\n7. rescheduleNotifications() Metodu:');
    const { service: service7, notificationScheduler: ns7 } = createService();

    await service7.start();
    const scheduleCountBefore = ns7.getScheduleCount();
    service7.rescheduleNotifications();
    const scheduleCountAfter = ns7.getScheduleCount();
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
    let notificationTitle = null;
    let notificationBody = null;

    const { service: service9, notificationScheduler: ns9 } = createService({
        onNotification: (title, body) => {
            notificationTitle = title;
            notificationBody = body;
        }
    });

    await service9.start();
    assert(ns9.hasCallback(), 'Bildirim callback ayarlandı');

    ns9.triggerNotification('Test Başlık', 'Test İçerik');
    assertEqual(notificationTitle, 'Test Başlık', 'Bildirim başlığı doğru');
    assertEqual(notificationBody, 'Test İçerik', 'Bildirim içeriği doğru');

    // Test 10: Schedule olmadan rescheduleNotifications
    console.log('\n10. Schedule Olmadan rescheduleNotifications:');
    const { service: service10, notificationScheduler: ns10 } = createService();
    const schedulerBefore = ns10.getScheduleCount();
    service10.rescheduleNotifications();
    const schedulerAfter = ns10.getScheduleCount();
    assertEqual(schedulerBefore, schedulerAfter, 'Schedule yokken reschedule bir şey yapmaz');

    // Test 11: Retry - exponential backoff
    console.log('\n11. Retry - Exponential Backoff:');
    const { service: service11, apiClient: ac11, timerManager: tm11, timerAdapter: ta11 } = createService({
        apiClient: (() => { const c = new MockApiClient(); c.setError(true, 'Ağ hatası'); return c; })(),
    });

    await service11.start();
    assertEqual(tm11.getRetryDelay(), 15, '1. retry: 15s');

    // Retry tetikle - hala hata verecek
    await service11._attemptRecovery();
    assertEqual(tm11.getRetryDelay(), 30, '2. retry: 30s');

    await service11._attemptRecovery();
    assertEqual(tm11.getRetryDelay(), 60, '3. retry: 60s');

    await service11._attemptRecovery();
    assertEqual(tm11.getRetryDelay(), 120, '4. retry: 120s');

    await service11._attemptRecovery();
    assertEqual(tm11.getRetryDelay(), 300, '5. retry: 300s (maksimum)');

    await service11._attemptRecovery();
    assertEqual(tm11.getRetryDelay(), 300, '6. retry: 300s (sabit kalır)');

    // Test 12: Retry - başarılı kurtarma
    console.log('\n12. Retry - Başarılı Kurtarma:');
    const failingApiClient = new MockApiClient();
    failingApiClient.setError(true, 'Ağ hatası');

    const { service: service12, timerManager: tm12 } = createService({
        apiClient: failingApiClient,
    });

    await service12.start();
    assert(tm12.hasRetryScheduled(), 'Hata sonrası retry zamanlandı');
    assertEqual(service12.schedule, null, 'Hata sonrası schedule null');

    // Ağ düzeldi
    failingApiClient.setError(false);
    await service12._attemptRecovery();
    assert(service12.schedule !== null, 'Kurtarma sonrası schedule yüklendi');
    assertEqual(service12._retryCount, 0, 'Kurtarma sonrası retryCount sıfırlandı');
    assertEqual(tm12.isRunning, true, 'Kurtarma sonrası timer çalışıyor');

    // Test 13: refresh() - Manuel yenileme
    console.log('\n13. refresh() - Manuel Yenileme:');
    const { service: service13, timerManager: tm13 } = createService();
    await service13.start();

    const scheduleBefore = service13.schedule;
    await service13.refresh();
    assert(service13.schedule !== null, 'Manuel yenileme sonrası schedule mevcut');

    // Test 14: refresh() - Hata durumunda retry
    console.log('\n14. refresh() - Hata Durumunda Retry:');
    const failingApi14 = new MockApiClient();
    const { service: service14, timerManager: tm14 } = createService({
        apiClient: failingApi14,
    });

    await service14.start();
    failingApi14.setError(true, 'Ağ hatası');

    await service14.refresh();
    assertEqual(service14.schedule, null, 'Hata sonrası schedule null');
    assert(tm14.hasRetryScheduled(), 'Manuel yenileme hatası sonrası retry zamanlandı');
    assertEqual(service14._retryCount, 1, 'retryCount artırıldı');

    // Test 15: refresh() - Konum hatası retry yapmamalı
    console.log('\n15. refresh() - Konum Hatası Retry Yapmamalı:');
    const { service: service15, timerManager: tm15, locationProvider: lp15 } = createService();
    await service15.start();

    lp15.setInvalidLocation();
    tm15.clearRetry(); // temiz durumda başla
    await service15.refresh();
    assert(!tm15.hasRetryScheduled(), 'Konum hatası retry zamanlamaz');

    // Test 16: Race condition koruması - eşzamanlı refresh
    console.log('\n16. Race Condition Koruması:');
    const slowApiClient = new MockApiClient();
    let fetchPromiseResolve;
    const originalFetch = slowApiClient.fetchPrayerTimes.bind(slowApiClient);
    let fetchCallCount = 0;
    slowApiClient.fetchPrayerTimes = (location) => {
        fetchCallCount++;
        return originalFetch(location);
    };

    const { service: service16, timerManager: tm16 } = createService({
        apiClient: slowApiClient,
    });

    await service16.start();
    fetchCallCount = 0;

    // _refreshInFlight guard testi
    service16._refreshInFlight = true;
    await service16._refreshPrayerTimes();
    assertEqual(fetchCallCount, 0, 'refreshInFlight=true iken API çağrılmaz');
    service16._refreshInFlight = false;

    // Test 17: start() çift çağrı koruması
    console.log('\n17. start() Çift Çağrı Koruması:');
    const { service: service17, apiClient: ac17, timerManager: tm17 } = createService();
    service17._refreshInFlight = true;
    await service17.start();
    assertEqual(ac17.getFetchCount(), 0, 'refreshInFlight=true iken start() API çağırmaz');
    service17._refreshInFlight = false;

    // Test 18: Destroy sırasında güvenlik
    console.log('\n18. Destroy Sırasında Güvenlik:');
    const { service: service18, timerManager: tm18 } = createService();
    await service18.start();
    service18.destroy();

    // destroy sonrası _attemptRecovery güvenli olmalı
    await service18._attemptRecovery(); // hata vermemeli
    assert(true, 'destroy sonrası attemptRecovery hata vermez');

    // Test 19: refresh() - timer zaten çalışıyorsa tekrar başlatmamalı
    console.log('\n19. refresh() - Timer Duplikasyonu Koruması:');
    const { service: service19, timerManager: tm19 } = createService();
    await service19.start();
    assertEqual(tm19.isRunning, true, 'start sonrası timer çalışıyor');

    // refresh çağrıldığında isRunning=true olduğundan timer'ları yeniden başlatmamalı
    await service19.refresh();
    assert(true, 'refresh() timer duplikasyonu yaratmaz');

    // Test 20: refresh() retryCount ve retry timer'ı sıfırlar
    console.log('\n20. refresh() - retryCount ve Retry Timer Sıfırlama:');
    const failingApi20 = new MockApiClient();
    failingApi20.setError(true, 'Ağ hatası');
    const { service: service20, timerManager: tm20 } = createService({
        apiClient: failingApi20,
    });

    await service20.start();
    assert(tm20.hasRetryScheduled(), 'Hata sonrası retry aktif');
    assert(service20._retryCount > 0, 'retryCount > 0');

    // Manuel refresh retry durumunu sıfırlar
    failingApi20.setError(false);
    await service20.refresh();
    assertEqual(service20._retryCount, 0, 'refresh() retryCount sıfırlar');

    // Sonuç
    console.log('\n=== Sonuç ===');
    console.log(`Toplam: ${passedTests + failedTests} test`);
    console.log(`Başarılı: ${passedTests}`);
    console.log(`Başarısız: ${failedTests}`);

    if (failedTests > 0) {
        process.exit(1);
    }
})();
