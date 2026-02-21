import { PrayerSchedule } from '../domain/models/PrayerSchedule.js';
import { PrayerTime } from '../domain/models/PrayerTime.js';

export class PrayerTimeService {
    constructor(dependencies) {
        const {
            apiClient,
            locationProvider,
            timerManager,
            notificationScheduler,
            settings,
            onUpdate,
            onNotification
        } = dependencies;

        this._apiClient = apiClient;
        this._locationProvider = locationProvider;
        this._timerManager = timerManager;
        this._notificationScheduler = notificationScheduler;
        this._settings = settings;
        this._onUpdate = onUpdate;
        this._onNotification = onNotification;

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
        console.log('[Praytime] Bildirimler yeniden zamanlandı');
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
            console.error(`[Praytime] Servis başlatma hatası: ${error.message}`);
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
            console.error(`[Praytime] Manuel yenileme başarısız: ${error.message}`);
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

            const apiResponse = await this._apiClient.fetchPrayerTimes(this._location);
            if (!this._isRunning) return;

            this._lastApiResponse = apiResponse;
            this._schedule = PrayerSchedule.fromApiResponse(apiResponse.prayers, new Date());
            this._addExtraPrayers(apiResponse.meta);

            this._notificationScheduler.scheduleForPrayers(
                this._schedule.prayers,
                (title, body) => this._onNotification?.(title, body)
            );

            this._triggerUpdate();
            console.log(`[Praytime] Vakitler güncellendi: ${this._location.toString()}`);
        } finally {
            this._refreshInFlight = false;
        }
    }

    _scheduleRetry() {
        if (!this._isRunning) return;

        const delays = [15, 30, 60, 120, 300];
        const delay = delays[Math.min(this._retryCount, delays.length - 1)];
        this._retryCount++;

        console.log(`[Praytime] ${delay}s sonra yeniden denenecek (deneme: ${this._retryCount})`);
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
            console.log('[Praytime] Bağlantı yeniden kuruldu');
        } catch (error) {
            if (!this._isRunning) return;
            console.error(`[Praytime] Yeniden deneme başarısız: ${error.message}`);
            this._schedule = null;
            this._triggerUpdate();

            if (error.message !== 'Geçersiz konum') {
                this._scheduleRetry();
            }
        }
    }

    _onCountdownTick() {
        this._triggerUpdate();

        // Sonraki namaz yoksa (tüm vakitler geçtiyse) vakitleri yenile
        // NOT: 3 saniye gecikme ekleniyor çünkü "vakit girdi" bildirimi
        // tam vakit girdiği anda tetiklenir. Eğer hemen refresh yaparsak,
        // clearAll() ile bildirim timer'ı temizlenir ve bildirim gösterilmez.
        if (!this.getNextPrayer() && !this._refreshScheduled) {
            this._refreshScheduled = true;
            this._timerManager.scheduleOnce(() => {
                this._refreshScheduled = false;
                this._refreshPrayerTimes().catch(console.error);
            }, 3);
        }
    }

    _onDailyRefresh() {
        this._refreshPrayerTimes().catch(console.error);
    }

    recalculateSchedule() {
        if (!this._lastApiResponse || !this._isRunning) return;

        this._schedule = PrayerSchedule.fromApiResponse(
            this._lastApiResponse.prayers, new Date()
        );
        this._addExtraPrayers(this._lastApiResponse.meta);

        this._notificationScheduler.scheduleForPrayers(
            this._schedule.prayers,
            (title, body) => this._onNotification?.(title, body)
        );
        this._triggerUpdate();
    }

    _addExtraPrayers(meta) {
        if (!this._settings || !meta) return;

        const date = this._schedule.date;

        // Teheccüd (yıl boyu, toggle'a bağlı)
        if (this._settings.get_boolean('tahajjud-enabled') && meta.lastthird) {
            const [h, m] = meta.lastthird.split(':').map(Number);
            const time = new Date(date);
            time.setHours(h, m, 0, 0);
            const offset = this._settings.get_int('tahajjud-offset-minutes');
            time.setMinutes(time.getMinutes() + offset);
            this._schedule.insertPrayer(new PrayerTime('Teheccüd', 'Tahajjud', time));
        }

        // Sahur (Ramazan + toggle'a bağlı)
        if (this._isSahurEnabled(meta.hijriMonth)) {
            const imsak = this._schedule.getPrayerByName('İmsak');
            if (imsak) {
                const minutes = this._settings.get_int('sahur-minutes-before');
                const time = new Date(imsak.time);
                time.setMinutes(time.getMinutes() - minutes);
                this._schedule.insertPrayer(new PrayerTime('Sahur', 'Suhur', time));
            }
        }
    }

    _isSahurEnabled(hijriMonth) {
        if (!this._settings.get_boolean('sahur-enabled')) return false;
        const mode = this._settings.get_string('ramadan-mode');
        if (mode === 'on') return true;
        if (mode === 'off') return false;
        // auto: Hicri 9. ay = Ramazan
        return hijriMonth === 9;
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
