let _ = (s) => s;

export class NotificationScheduler {
    constructor({ timerAdapter, settings, gettext }) {
        this._timerAdapter = timerAdapter;
        this._settings = settings;
        this._scheduledTimers = [];
        if (gettext) _ = gettext;
    }

    scheduleForPrayers(prayers, onNotify) {
        this.clearAll();

        if (!this._isNotificationsEnabled()) {
            console.log('[Praytime] Notifications disabled');
            return;
        }

        const now = new Date();
        const minutesBefore = this._settings.get_int('notify-before-minutes');
        const notifyOnTime = this._settings.get_boolean('notify-on-time');

        console.log(`[Praytime] Scheduling notifications - minutesBefore: ${minutesBefore}, notifyOnTime: ${notifyOnTime}`);

        for (const prayer of prayers) {
            if (prayer.isPassed(now)) {
                console.log(`[Praytime] ${prayer.nameEn} already passed, skipping`);
                continue;
            }

            if (minutesBefore > 0) {
                this._scheduleBeforeNotification(prayer, minutesBefore, now, onNotify);
            }

            if (notifyOnTime) {
                this._scheduleOnTimeNotification(prayer, now, onNotify);
            }
        }

        console.log(`[Praytime] ${this._scheduledTimers.length} notification(s) scheduled`);
    }

    _scheduleBeforeNotification(prayer, minutesBefore, now, onNotify) {
        const beforeTime = new Date(prayer.time);
        beforeTime.setMinutes(beforeTime.getMinutes() - minutesBefore);

        if (beforeTime <= now) {
            console.log(`[Praytime] ${prayer.nameEn} "before" notification time already passed`);
            return;
        }

        const secondsUntil = Math.floor((beforeTime - now) / 1000);
        console.log(`[Praytime] ${prayer.nameEn} "before" notification scheduled: ${secondsUntil}s`);

        const timerId = this._timerAdapter.setTimeout(() => {
            console.log(`[Praytime] "Before" notification triggered: ${prayer.nameEn}`);
            onNotify(
                _('%d dakika sonra %s').format(minutesBefore, prayer.name),
                _('%s vakti %s\'de girecek').format(prayer.name, prayer.timeString)
            );
        }, secondsUntil);

        this._scheduledTimers.push(timerId);
    }

    _scheduleOnTimeNotification(prayer, now, onNotify) {
        const secondsUntil = prayer.getSecondsUntil(now);

        if (secondsUntil <= 0) {
            console.log(`[Praytime] ${prayer.nameEn} "on time" notification time already passed`);
            return;
        }

        console.log(`[Praytime] ${prayer.nameEn} "on time" notification scheduled: ${secondsUntil}s`);

        const timerId = this._timerAdapter.setTimeout(() => {
            console.log(`[Praytime] "On time" notification triggered: ${prayer.nameEn}`);
            onNotify(
                _('%s vakti girdi').format(prayer.name),
                _('Şimdi %s vakti').format(prayer.name)
            );
        }, secondsUntil);

        this._scheduledTimers.push(timerId);
    }

    _isNotificationsEnabled() {
        return this._settings.get_boolean('notifications-enabled');
    }

    clearAll() {
        if (this._scheduledTimers.length > 0) {
            console.log(`[Praytime] Clearing ${this._scheduledTimers.length} notification timer(s)`);
        }
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
