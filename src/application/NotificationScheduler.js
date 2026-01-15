// Bildirim zamanlama servisi
export class NotificationScheduler {
    constructor({ timerAdapter, settings }) {
        this._timerAdapter = timerAdapter;
        this._settings = settings;
        this._scheduledTimers = [];
    }

    scheduleForPrayers(prayers, onNotify) {
        this.clearAll();

        if (!this._isNotificationsEnabled()) return;

        const now = new Date();
        const minutesBefore = this._settings.get_int('notify-before-minutes');
        const notifyOnTime = this._settings.get_boolean('notify-on-time');

        for (const prayer of prayers) {
            if (prayer.isPassed(now)) continue;

            if (minutesBefore > 0) {
                this._scheduleBeforeNotification(prayer, minutesBefore, now, onNotify);
            }

            if (notifyOnTime) {
                this._scheduleOnTimeNotification(prayer, now, onNotify);
            }
        }
    }

    _scheduleBeforeNotification(prayer, minutesBefore, now, onNotify) {
        const beforeTime = new Date(prayer.time);
        beforeTime.setMinutes(beforeTime.getMinutes() - minutesBefore);

        if (beforeTime <= now) return;

        const secondsUntil = Math.floor((beforeTime - now) / 1000);
        const timerId = this._timerAdapter.setTimeout(() => {
            onNotify(
                `${minutesBefore} dakika sonra ${prayer.name}`,
                `${prayer.name} vakti ${prayer.timeString}'de girecek`
            );
        }, secondsUntil);

        this._scheduledTimers.push(timerId);
    }

    _scheduleOnTimeNotification(prayer, now, onNotify) {
        const secondsUntil = prayer.getSecondsUntil(now);
        if (secondsUntil <= 0) return;

        const timerId = this._timerAdapter.setTimeout(() => {
            onNotify(
                `${prayer.name} vakti girdi`,
                `Şimdi ${prayer.name} vakti`
            );
        }, secondsUntil);

        this._scheduledTimers.push(timerId);
    }

    _isNotificationsEnabled() {
        return this._settings.get_boolean('notifications-enabled');
    }

    clearAll() {
        for (const timerId of this._scheduledTimers) {
            this._timerAdapter.clearTimer(timerId);
        }
        this._scheduledTimers = [];
    }

    destroy() {
        this.clearAll();
        this._settings = null;
    }
}
