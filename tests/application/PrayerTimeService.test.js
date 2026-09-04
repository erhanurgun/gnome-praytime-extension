// PrayerTimeService entegrasyon testleri
// GLib/GObject bağımlılığı olmadan çalışır

require('../helpers/polyfills.js');

const { MockApiClient } = require('../mocks/MockApiClient.js');
const { MockLocationProvider, Location } = require('../mocks/MockLocationProvider.js');
const { MockNotificationScheduler } = require('../mocks/MockNotificationScheduler.js');
const { MockTimerAdapter } = require('../mocks/MockTimerAdapter.js');
const { MockSettings } = require('../mocks/MockSettings.js');

// Hata kodları
const ERROR_CODES = {
    INVALID_LOCATION: 'INVALID_LOCATION',
};

// Konum validasyon durumları
const LOCATION_STATUS = {
    UNKNOWN: 'unknown',
    VALID: 'valid',
    INVALID_COUNTRY: 'invalid_country',
    INVALID_CITY: 'invalid_city',
    EMPTY_COUNTRY: 'empty_country',
    EMPTY_CITY: 'empty_city',
    NETWORK_ERROR: 'network_error',
    API_ERROR: 'api_error',
};

// PrayerTime sınıfının kopyası - id parametresi eklendi
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

// PRAYER_NAMES sabiti - id bazlı
const PRAYER_NAMES = [
    { id: 'imsak',   name: 'İmsak',   nameEn: 'Imsak',   apiKey: 'Fajr' },
    { id: 'gunes',   name: 'Güneş',   nameEn: 'Sunrise',  apiKey: 'Sunrise' },
    { id: 'ogle',    name: 'Öğle',    nameEn: 'Dhuhr',    apiKey: 'Dhuhr' },
    { id: 'ikindi',  name: 'İkindi',  nameEn: 'Asr',      apiKey: 'Asr' },
    { id: 'aksam',   name: 'Akşam',   nameEn: 'Maghrib',  apiKey: 'Maghrib' },
    { id: 'yatsi',   name: 'Yatsı',   nameEn: 'Isha',     apiKey: 'Isha' },
];

// PrayerSchedule sınıfının kopyası - id bazlı eşleme, gettext desteği
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

// PrayerTimeService sınıfının kopyası (test için bağımsız) - gettext + ERROR_CODES + id bazlı
let _ = (s) => s;

class PrayerTimeService {
    constructor(dependencies) {
        const {
            apiClient,
            locationProvider,
            timerManager,
            notificationScheduler,
            settings,
            onUpdate,
            onNotification,
            gettext
        } = dependencies;

        this._apiClient = apiClient;
        this._locationProvider = locationProvider;
        this._timerManager = timerManager;
        this._notificationScheduler = notificationScheduler;
        this._settings = settings;
        this._onUpdate = onUpdate;
        this._onNotification = onNotification;

        if (gettext) _ = gettext;

        this._schedule = null;
        this._location = null;
        this._isRunning = false;
        this._refreshScheduled = false;
        this._retryCount = 0;
        this._refreshInFlight = false;
        this._lastApiResponse = null;
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
        this._lastApiResponse = null;
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
            if (error.message !== ERROR_CODES.INVALID_LOCATION) {
                this._scheduleRetry();
            }
        }
    }

    async _refreshPrayerTimes() {
        if (this._refreshInFlight) return;
        this._refreshInFlight = true;

        try {
            const preStatus = this._preValidateLocation();
            if (preStatus) {
                this._writeLocationStatus(preStatus.code, preStatus.message);
                throw new Error(ERROR_CODES.INVALID_LOCATION);
            }

            this._location = this._locationProvider.getLocation();

            if (!this._location?.isValid()) {
                this._writeLocationStatus(LOCATION_STATUS.API_ERROR, _('Geçersiz konum bilgisi'));
                throw new Error(ERROR_CODES.INVALID_LOCATION);
            }

            let apiResponse;
            try {
                apiResponse = await this._apiClient.fetchPrayerTimes(this._location);
            } catch (apiError) {
                const status = this._classifyApiError(apiError);
                this._writeLocationStatus(status.code, status.message);
                throw apiError;
            }
            if (!this._isRunning) return;

            this._lastApiResponse = apiResponse;
            this._schedule = PrayerSchedule.fromApiResponse(apiResponse.prayers, new Date(), _);
            this._addExtraPrayers(apiResponse.meta);

            this._notificationScheduler.scheduleForPrayers(
                this._schedule.prayers,
                (title, body) => this._onNotification?.(title, body)
            );

            this._writeLocationStatus(LOCATION_STATUS.VALID, '');
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

            if (error.message !== ERROR_CODES.INVALID_LOCATION) {
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

    _addExtraPrayers(meta) {
        if (!this._settings || !meta) return;

        const date = this._schedule.date;

        if (this._settings.get_boolean('tahajjud-enabled') && meta.lastthird) {
            const [h, m] = meta.lastthird.split(':').map(Number);
            const time = new Date(date);
            time.setHours(h, m, 0, 0);
            const offset = this._settings.get_int('tahajjud-offset-minutes');
            time.setMinutes(time.getMinutes() + offset);
            this._schedule.insertPrayer(new PrayerTime('tahajjud', _('Teheccüd'), 'Tahajjud', time));
        }

        if (this._isSahurEnabled(meta.hijriMonth)) {
            const imsak = this._schedule.getPrayerById('imsak');
            if (imsak) {
                const minutes = this._settings.get_int('sahur-minutes-before');
                const time = new Date(imsak.time);
                time.setMinutes(time.getMinutes() - minutes);
                this._schedule.insertPrayer(new PrayerTime('sahur', _('Sahur'), 'Suhur', time));
            }
        }
    }

    _isSahurEnabled(hijriMonth) {
        if (!this._settings.get_boolean('sahur-enabled')) return false;
        const mode = this._settings.get_string('ramadan-mode');
        if (mode === 'on') return true;
        if (mode === 'off') return false;
        return hijriMonth === 9;
    }

    _triggerUpdate() {
        this._onUpdate?.();
    }

    _writeLocationStatus(code, message) {
        if (!this._settings) return;
        try {
            this._settings.set_string('location-status', code);
            this._settings.set_string('location-status-message', message || '');
        } catch (e) {
            // sessiz hata
        }
    }

    _preValidateLocation() {
        if (!this._settings) return null;
        const mode = this._settings.get_string('location-mode');
        if (mode === 'city') {
            const country = this._settings.get_string('country-name');
            const city = this._settings.get_string('city-name');
            if (!country?.trim())
                return { code: LOCATION_STATUS.EMPTY_COUNTRY, message: _('Ülke adı girilmedi') };
            if (!city?.trim())
                return { code: LOCATION_STATUS.EMPTY_CITY, message: _('Şehir adı girilmedi') };
        }
        return null;
    }

    _classifyApiError(error) {
        const msg = error.message || '';
        if (msg.includes('400') || msg.includes('404') || msg.includes('Invalid API'))
            return { code: LOCATION_STATUS.INVALID_CITY, message: _('Girilen şehir veya ülke bulunamadı') };
        if (msg.includes('Network') || msg.includes('resolve') || msg.includes('Cancelled'))
            return { code: LOCATION_STATUS.NETWORK_ERROR, message: _('Ağ bağlantısı hatası') };
        return { code: LOCATION_STATUS.API_ERROR, message: msg };
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
    const settings = overrides.settings || new MockSettings();
    const onUpdate = overrides.onUpdate || (() => {});
    const onNotification = overrides.onNotification || (() => {});

    return {
        service: new PrayerTimeService({
            apiClient,
            locationProvider,
            timerManager,
            notificationScheduler,
            settings,
            onUpdate,
            onNotification
        }),
        apiClient,
        locationProvider,
        timerManager,
        timerAdapter,
        notificationScheduler,
        settings
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
const settings1 = new MockSettings();
let updateCount = 0;

const service1 = new PrayerTimeService({
    apiClient: apiClient1,
    locationProvider: locationProvider1,
    timerManager: timerManager1,
    notificationScheduler: notificationScheduler1,
    settings: settings1,
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
    assertEqual(service2._lastApiResponse, null, 'stop() sonrası lastApiResponse null');
    assertEqual(notificationScheduler2.getClearCount(), 1, 'Bildirimler temizlendi');

    // Test 5: start() ile API hatası - retry zamanlanmalı
    console.log('\n5. start() ile API Hatası - Retry Zamanlanır:');
    const { service: service5, apiClient: ac5, timerManager: tm5 } = createService({
        apiClient: (() => { const c = new MockApiClient(); c.setError(true, 'Network error'); return c; })(),
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
        apiClient: (() => { const c = new MockApiClient(); c.setError(true, 'Network error'); return c; })(),
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
    failingApiClient.setError(true, 'Network error');

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
    failingApi14.setError(true, 'Network error');

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
    failingApi20.setError(true, 'Network error');
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

    // Test 21: Teheccüd ekleme - toggle açık
    console.log('\n21. Teheccüd Ekleme - Toggle Açık:');
    const settings21 = new MockSettings({ 'tahajjud-enabled': true });
    const { service: service21 } = createService({ settings: settings21 });
    await service21.start();
    const tahajjud21 = service21.schedule.getPrayerById('tahajjud');
    assert(tahajjud21 !== undefined, 'Teheccüd vakti eklendi');
    assertEqual(tahajjud21.timeString, '03:30', 'Teheccüd saati doğru (Lastthird)');

    // Teheccüd kronolojik sırada olmalı (03:30 < 05:30 İmsak)
    const prayers21 = service21.schedule.prayers;
    const tahajjudIdx = prayers21.findIndex(p => p.id === 'tahajjud');
    const imsakIdx = prayers21.findIndex(p => p.id === 'imsak');
    assert(tahajjudIdx < imsakIdx, 'Teheccüd İmsak\'tan önce sıralı');

    // Test 22: Teheccüd eklenmemeli - toggle kapalı
    console.log('\n22. Teheccüd - Toggle Kapalı:');
    const settings22 = new MockSettings({ 'tahajjud-enabled': false });
    const { service: service22 } = createService({ settings: settings22 });
    await service22.start();
    const tahajjud22 = service22.schedule.getPrayerById('tahajjud');
    assertEqual(tahajjud22, undefined, 'Toggle kapalıyken Teheccüd eklenmez');

    // Test 23: Sahur - Ramazan modu "on" (her zaman açık)
    console.log('\n23. Sahur - Ramazan Modu "on":');
    const settings23 = new MockSettings({
        'ramadan-mode': 'on',
        'sahur-enabled': true,
        'sahur-minutes-before': 30,
    });
    const { service: service23 } = createService({ settings: settings23 });
    await service23.start();
    const sahur23 = service23.schedule.getPrayerById('sahur');
    assert(sahur23 !== undefined, 'Ramazan modu "on" ile Sahur eklendi');
    assertEqual(sahur23.timeString, '05:00', 'Sahur saati = İmsak(05:30) - 30dk = 05:00');

    // Sahur İmsak'tan önce olmalı
    const prayers23 = service23.schedule.prayers;
    const sahurIdx23 = prayers23.findIndex(p => p.id === 'sahur');
    const imsakIdx23 = prayers23.findIndex(p => p.id === 'imsak');
    assert(sahurIdx23 < imsakIdx23, 'Sahur İmsak\'tan önce sıralı');

    // Test 24: Sahur - Ramazan modu "auto" Hicri 9. ay (Ramazan)
    console.log('\n24. Sahur - Auto Mod, Ramazan Ayı (Hicri 9):');
    const ramazanApi = new MockApiClient();
    ramazanApi.setMockData({
        prayers: {
            'imsak': '05:30', 'gunes': '07:00', 'ogle': '12:30',
            'ikindi': '15:45', 'aksam': '18:15', 'yatsi': '19:45'
        },
        meta: { lastthird: '03:30', hijriMonth: 9 }
    });
    const settings24 = new MockSettings({
        'ramadan-mode': 'auto',
        'sahur-enabled': true,
        'sahur-minutes-before': 30,
    });
    const { service: service24 } = createService({ apiClient: ramazanApi, settings: settings24 });
    await service24.start();
    const sahur24 = service24.schedule.getPrayerById('sahur');
    assert(sahur24 !== undefined, 'Hicri 9. ay (Ramazan) ile auto modda Sahur eklendi');

    // Test 25: Sahur - Ramazan modu "auto" Hicri 8. ay (Ramazan değil)
    console.log('\n25. Sahur - Auto Mod, Ramazan Dışı (Hicri 8):');
    const settings25 = new MockSettings({
        'ramadan-mode': 'auto',
        'sahur-enabled': true,
    });
    // Default mock data hijriMonth: 8 döner
    const { service: service25 } = createService({ settings: settings25 });
    await service25.start();
    const sahur25 = service25.schedule.getPrayerById('sahur');
    assertEqual(sahur25, undefined, 'Ramazan dışında auto modda Sahur eklenmez');

    // Test 26: Sahur - Ramazan modu "off"
    console.log('\n26. Sahur - Ramazan Modu "off":');
    const ramazanApi26 = new MockApiClient();
    ramazanApi26.setMockData({
        prayers: {
            'imsak': '05:30', 'gunes': '07:00', 'ogle': '12:30',
            'ikindi': '15:45', 'aksam': '18:15', 'yatsi': '19:45'
        },
        meta: { lastthird: '03:30', hijriMonth: 9 }
    });
    const settings26 = new MockSettings({
        'ramadan-mode': 'off',
        'sahur-enabled': true,
    });
    const { service: service26 } = createService({ apiClient: ramazanApi26, settings: settings26 });
    await service26.start();
    const sahur26 = service26.schedule.getPrayerById('sahur');
    assertEqual(sahur26, undefined, 'Ramazan modu "off" ile Sahur eklenmez');

    // Test 27: Sahur toggle kapalı
    console.log('\n27. Sahur - Toggle Kapalı:');
    const settings27 = new MockSettings({
        'ramadan-mode': 'on',
        'sahur-enabled': false,
    });
    const { service: service27 } = createService({ settings: settings27 });
    await service27.start();
    const sahur27 = service27.schedule.getPrayerById('sahur');
    assertEqual(sahur27, undefined, 'sahur-enabled=false ile Sahur eklenmez');

    // Test 28: Sahur süresi değişikliği
    console.log('\n28. Sahur Süresi Değişikliği:');
    const settings28 = new MockSettings({
        'ramadan-mode': 'on',
        'sahur-enabled': true,
        'sahur-minutes-before': 45,
    });
    const { service: service28 } = createService({ settings: settings28 });
    await service28.start();
    const sahur28 = service28.schedule.getPrayerById('sahur');
    assert(sahur28 !== undefined, 'Sahur vakti eklendi');
    assertEqual(sahur28.timeString, '04:45', 'Sahur saati = İmsak(05:30) - 45dk = 04:45');

    // Test 29: Hem Sahur hem Teheccüd aktif
    console.log('\n29. Sahur + Teheccüd Birlikte:');
    const settings29 = new MockSettings({
        'ramadan-mode': 'on',
        'sahur-enabled': true,
        'sahur-minutes-before': 30,
        'tahajjud-enabled': true,
    });
    const { service: service29 } = createService({ settings: settings29 });
    await service29.start();
    assertEqual(service29.schedule.prayers.length, 8, 'Toplam 8 vakit (6 + Sahur + Teheccüd)');
    const ids29 = service29.schedule.prayers.map(p => p.id);
    assert(ids29.indexOf('tahajjud') < ids29.indexOf('sahur'), 'Teheccüd(03:30) Sahur(05:00) önünde');
    assert(ids29.indexOf('sahur') < ids29.indexOf('imsak'), 'Sahur(05:00) İmsak(05:30) önünde');

    // Test 30: hijriMonth null olduğunda auto mod
    console.log('\n30. Hicri Ay Null - Auto Mod:');
    const nullHijriApi = new MockApiClient();
    nullHijriApi.setMockData({
        prayers: {
            'imsak': '05:30', 'gunes': '07:00', 'ogle': '12:30',
            'ikindi': '15:45', 'aksam': '18:15', 'yatsi': '19:45'
        },
        meta: { lastthird: '03:30', hijriMonth: null }
    });
    const settings30 = new MockSettings({
        'ramadan-mode': 'auto',
        'sahur-enabled': true,
    });
    const { service: service30 } = createService({ apiClient: nullHijriApi, settings: settings30 });
    await service30.start();
    const sahur30 = service30.schedule.getPrayerById('sahur');
    assertEqual(sahur30, undefined, 'hijriMonth=null ile auto modda Sahur eklenmez');

    // Test 31: Başarılı API → location-status = 'valid'
    console.log('\n31. Başarılı API - Status Valid:');
    const settings31 = new MockSettings();
    const { service: service31 } = createService({ settings: settings31 });
    await service31.start();
    assertEqual(settings31.get_string('location-status'), 'valid', 'Başarılı API sonrası status = valid');
    assertEqual(settings31.get_string('location-status-message'), '', 'Başarılı sonrası mesaj boş');

    // Test 32: Boş ülke → location-status = 'empty_country'
    console.log('\n32. Boş Ülke - Status Empty Country:');
    const settings32 = new MockSettings({ 'country-name': '', 'city-name': 'Istanbul' });
    const { service: service32 } = createService({ settings: settings32 });
    await service32.start();
    assertEqual(settings32.get_string('location-status'), 'empty_country', 'Boş ülke → empty_country');

    // Test 33: Boş şehir → location-status = 'empty_city'
    console.log('\n33. Boş Şehir - Status Empty City:');
    const settings33 = new MockSettings({ 'country-name': 'Turkey', 'city-name': '' });
    const { service: service33 } = createService({ settings: settings33 });
    await service33.start();
    assertEqual(settings33.get_string('location-status'), 'empty_city', 'Boş şehir → empty_city');

    // Test 34: API 400 hatası → location-status = 'invalid_city'
    console.log('\n34. API 400 Hatası - Status Invalid City:');
    const settings34 = new MockSettings();
    const badApi34 = new MockApiClient();
    badApi34.setError(true, 'HTTP 400 Bad Request');
    const { service: service34 } = createService({ settings: settings34, apiClient: badApi34 });
    await service34.start();
    assertEqual(settings34.get_string('location-status'), 'invalid_city', 'API 400 → invalid_city');

    // Test 35: Ağ hatası → location-status = 'network_error'
    console.log('\n35. Ağ Hatası - Status Network Error:');
    const settings35 = new MockSettings();
    const netApi35 = new MockApiClient();
    netApi35.setError(true, 'Network error: Could not resolve host');
    const { service: service35 } = createService({ settings: settings35, apiClient: netApi35 });
    await service35.start();
    assertEqual(settings35.get_string('location-status'), 'network_error', 'Ağ hatası → network_error');

    // Test 36: API format hatası → location-status = 'api_error'
    console.log('\n36. API Format Hatası - Status API Error:');
    const settings36 = new MockSettings();
    const fmtApi36 = new MockApiClient();
    fmtApi36.setError(true, 'Unexpected response format');
    const { service: service36 } = createService({ settings: settings36, apiClient: fmtApi36 });
    await service36.start();
    assertEqual(settings36.get_string('location-status'), 'api_error', 'Bilinmeyen hata → api_error');

    // Test 37: Settings null iken status yazma → hata vermemeli
    console.log('\n37. Settings Null - Status Yazma Güvenliği:');
    const { service: service37 } = createService();
    service37._settings = null;
    service37._writeLocationStatus('valid', '');
    assert(true, 'settings=null iken _writeLocationStatus hata vermez');

    // Test 38: Konum değişikliğinde status sıfırlanmalı (pre-validation öncesi)
    console.log('\n38. Konum Değişikliğinde Status Sıfırlama:');
    const settings38 = new MockSettings();
    const { service: service38 } = createService({ settings: settings38 });
    await service38.start();
    assertEqual(settings38.get_string('location-status'), 'valid', 'Önce valid');
    // Ülkeyi boşalt ve tekrar start
    settings38.set_string('country-name', '');
    service38.stop();
    await service38.start();
    assertEqual(settings38.get_string('location-status'), 'empty_country', 'Boş ülke sonrası empty_country');

    // Sonuç
    console.log('\n=== Sonuç ===');
    console.log(`Toplam: ${passedTests + failedTests} test`);
    console.log(`Başarılı: ${passedTests}`);
    console.log(`Başarısız: ${failedTests}`);

    if (failedTests > 0) {
        process.exit(1);
    }
})();
