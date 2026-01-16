import { PrayerSchedule } from '../domain/models/PrayerSchedule.js';

export class PrayerTimeService {
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
        this._isRunning = true;
        try {
            await this._refreshPrayerTimes();
            if (!this._isRunning) return;

            this._timerManager.startCountdown(() => this._onCountdownTick());
            this._timerManager.scheduleDailyRefresh(() => this._onDailyRefresh());
        } catch (error) {
            console.error(`[Praytime] Servis başlatma hatası: ${error.message}`);
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
        console.log(`[Praytime] Vakitler güncellendi: ${this._location.toString()}`);
    }

    _onCountdownTick() {
        this._triggerUpdate();

        // Sonraki namaz yoksa (tüm vakitler geçtiyse) vakitleri yenile
        // NOT: 3 saniye gecikme ekleniyor çünkü "vakit girdi" bildirimi
        // tam vakit girdiği anda tetiklenir. Eğer hemen refresh yaparsak,
        // clearAll() ile bildirim timer'ı temizlenir ve bildirim gösterilmez.
        if (!this.getNextPrayer() && !this._refreshScheduled) {
            this._refreshScheduled = true;
            this._timerManager._timerAdapter.setTimeout(() => {
                this._refreshScheduled = false;
                this._refreshPrayerTimes().catch(console.error);
            }, 3);
        }
    }

    _onDailyRefresh() {
        this._refreshPrayerTimes().catch(console.error);
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
