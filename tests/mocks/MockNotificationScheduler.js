// NotificationScheduler mock sınıfı
// PrayerTimeService testleri için kullanılır

class MockNotificationScheduler {
    constructor() {
        this._scheduledPrayers = [];
        this._notificationCallback = null;
        this._scheduleCount = 0;
        this._clearCount = 0;
        this._destroyed = false;
    }

    scheduleForPrayers(prayers, callback) {
        this._scheduledPrayers = prayers ? [...prayers] : [];
        this._notificationCallback = callback;
        this._scheduleCount++;
    }

    clearAll() {
        this._scheduledPrayers = [];
        this._notificationCallback = null;
        this._clearCount++;
    }

    // Test için yardımcı metodlar
    getScheduledPrayers() {
        return this._scheduledPrayers;
    }

    getScheduleCount() {
        return this._scheduleCount;
    }

    getClearCount() {
        return this._clearCount;
    }

    // Bildirim tetikleme (test için)
    triggerNotification(title, body) {
        if (this._notificationCallback) {
            this._notificationCallback(title, body);
        }
    }

    hasCallback() {
        return this._notificationCallback !== null;
    }

    reset() {
        this._scheduledPrayers = [];
        this._notificationCallback = null;
        this._scheduleCount = 0;
        this._clearCount = 0;
    }

    destroy() {
        this._destroyed = true;
        this.clearAll();
    }

    isDestroyed() {
        return this._destroyed;
    }
}

module.exports = { MockNotificationScheduler };
