import { PrayerSchedule } from '../domain/models/PrayerSchedule.js';
import { PrayerTime } from '../domain/models/PrayerTime.js';
import { ERROR_CODES, LOCATION_STATUS } from '../config/constants.js';

let _ = (s) => s;

export class PrayerTimeService {
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
        console.log('[Praytime] Notifications rescheduled');
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
            console.error(`[Praytime] Service start error: ${error.message}`);
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
            console.error(`[Praytime] Manual refresh failed: ${error.message}`);
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
            // LocationProvider boş alanları varsayılana düşürür,
            // bu yüzden GSettings'ten doğrudan kontrol gerekli
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
            console.log(`[Praytime] Prayer times updated: ${this._location.toString()}`);
        } finally {
            this._refreshInFlight = false;
        }
    }

    _scheduleRetry() {
        if (!this._isRunning) return;

        const delays = [15, 30, 60, 120, 300];
        const delay = delays[Math.min(this._retryCount, delays.length - 1)];
        this._retryCount++;

        console.log(`[Praytime] Retrying in ${delay}s (attempt: ${this._retryCount})`);
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
            console.log('[Praytime] Connection recovered');
        } catch (error) {
            if (!this._isRunning) return;
            console.error(`[Praytime] Recovery failed: ${error.message}`);
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
            this._lastApiResponse.prayers, new Date(), _
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
            this._schedule.insertPrayer(new PrayerTime('tahajjud', _('Teheccüd'), 'Tahajjud', time));
        }

        // Sahur (Ramazan + toggle'a bağlı)
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
        // auto: Hicri 9. ay = Ramazan
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
            console.error(`[Praytime] Failed to write location status: ${e.message}`);
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
