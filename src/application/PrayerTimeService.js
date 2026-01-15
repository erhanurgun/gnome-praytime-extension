import GLib from 'gi://GLib';
import { PrayerSchedule } from '../domain/models/PrayerSchedule.js';
import { PrayerTimesApiClient } from '../infrastructure/api/PrayerTimesApiClient.js';
import { LocationProvider } from '../infrastructure/location/LocationProvider.js';

// Namaz vakitleri servis katmanı - ana iş mantığı
export class PrayerTimeService {
    constructor(settings, onUpdate, onNotification) {
        this._settings = settings;
        this._onUpdate = onUpdate;
        this._onNotification = onNotification;

        this._apiClient = new PrayerTimesApiClient();
        this._locationProvider = new LocationProvider(settings);

        this._schedule = null;
        this._location = null;
        this._countdownTimer = null;
        this._notificationTimers = [];
        this._dailyRefreshTimer = null;
        this._isRunning = false;
    }

    // Servisi başlat
    async start() {
        this._isRunning = true;
        try {
            await this._refreshPrayerTimes();
            // Stop çağrıldıysa timer başlatma
            if (!this._isRunning) return;
            this._startCountdown();
            this._scheduleDailyRefresh();
        } catch (error) {
            console.error(`[Praytime] Servis başlatma hatası: ${error.message}`);
        }
    }

    // Servisi durdur
    stop() {
        this._isRunning = false;
        this._clearAllTimers();
        this._apiClient.destroy();
        this._locationProvider.destroy();
        this._schedule = null;
        this._location = null;
    }

    // Mevcut schedule
    get schedule() {
        return this._schedule;
    }

    // Mevcut konum
    get location() {
        return this._location;
    }

    // Sonraki namaz vakti
    getNextPrayer() {
        if (!this._schedule) return null;
        return this._schedule.getNextPrayer();
    }

    // Vakitleri yenile
    async _refreshPrayerTimes() {
        // Konum al - senkron çağrı
        this._location = this._locationProvider.getLocation();

        if (!this._location || !this._location.isValid()) {
            throw new Error('Geçersiz konum');
        }

        // API'den vakitleri çek (location_id ile)
        const apiData = await this._apiClient.fetchPrayerTimes(this._location.id);

        // Schedule oluştur
        this._schedule = PrayerSchedule.fromApiResponse(apiData, new Date());

        // Bildirimleri zamanla
        this._scheduleNotifications();

        // UI güncelle
        this._triggerUpdate();

        console.log(`[Praytime] Vakitler güncellendi: ${this._location.toString()}`);
    }

    // Geri sayım timer'ı
    _startCountdown() {
        this._countdownTimer = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            1,
            () => {
                // Servis durmuş mu kontrol et
                if (!this._isRunning) {
                    return GLib.SOURCE_REMOVE;
                }

                this._triggerUpdate();

                // Sonraki vakit yoksa (gün bitti) yenile
                if (!this.getNextPrayer()) {
                    this._refreshPrayerTimes().catch(console.error);
                }

                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    // Gece yarısı yenileme
    _scheduleDailyRefresh() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setDate(midnight.getDate() + 1);
        midnight.setHours(0, 1, 0, 0);

        const secondsUntilMidnight = Math.floor((midnight - now) / 1000);

        this._dailyRefreshTimer = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            secondsUntilMidnight,
            () => {
                // Servis durmuş mu kontrol et
                if (!this._isRunning) {
                    return GLib.SOURCE_REMOVE;
                }
                this._refreshPrayerTimes().catch(console.error);
                this._scheduleDailyRefresh();
                return GLib.SOURCE_REMOVE;
            }
        );
    }

    // Bildirimleri zamanla
    _scheduleNotifications() {
        this._clearNotificationTimers();

        if (!this._settings.get_boolean('notifications-enabled')) return;
        if (!this._schedule) return;

        const now = new Date();
        const minutesBefore = this._settings.get_int('notify-before-minutes');
        const notifyOnTime = this._settings.get_boolean('notify-on-time');

        for (const prayer of this._schedule.prayers) {
            // Geçmiş vakitleri atla
            if (prayer.isPassed(now)) continue;

            // X dakika önce bildirim
            if (minutesBefore > 0) {
                const beforeTime = new Date(prayer.time);
                beforeTime.setMinutes(beforeTime.getMinutes() - minutesBefore);

                if (beforeTime > now) {
                    const secondsUntil = Math.floor((beforeTime - now) / 1000);
                    const timerId = GLib.timeout_add_seconds(
                        GLib.PRIORITY_DEFAULT,
                        secondsUntil,
                        () => {
                            this._sendNotification(
                                `${minutesBefore} dakika sonra ${prayer.name}`,
                                `${prayer.name} vakti ${prayer.timeString}'de girecek`
                            );
                            return GLib.SOURCE_REMOVE;
                        }
                    );
                    this._notificationTimers.push(timerId);
                }
            }

            // Vakit girince bildirim
            if (notifyOnTime) {
                const secondsUntil = prayer.getSecondsUntil(now);
                if (secondsUntil > 0) {
                    const timerId = GLib.timeout_add_seconds(
                        GLib.PRIORITY_DEFAULT,
                        secondsUntil,
                        () => {
                            this._sendNotification(
                                `${prayer.name} vakti girdi`,
                                `Şimdi ${prayer.name} vakti`
                            );
                            return GLib.SOURCE_REMOVE;
                        }
                    );
                    this._notificationTimers.push(timerId);
                }
            }
        }
    }

    _sendNotification(title, body) {
        if (this._onNotification) {
            this._onNotification(title, body);
        }
    }

    _triggerUpdate() {
        if (this._onUpdate) {
            this._onUpdate();
        }
    }

    _clearNotificationTimers() {
        for (const timerId of this._notificationTimers) {
            GLib.source_remove(timerId);
        }
        this._notificationTimers = [];
    }

    _clearAllTimers() {
        if (this._countdownTimer) {
            GLib.source_remove(this._countdownTimer);
            this._countdownTimer = null;
        }

        if (this._dailyRefreshTimer) {
            GLib.source_remove(this._dailyRefreshTimer);
            this._dailyRefreshTimer = null;
        }

        this._clearNotificationTimers();
    }
}
