export class NotificationScheduler {
    constructor({ timerAdapter, settings }) {
        this._timerAdapter = timerAdapter;
        this._settings = settings;
        this._scheduledTimers = [];
    }

    scheduleForPrayers(prayers, onNotify) {
        this.clearAll();

        if (!this._isNotificationsEnabled()) {
            console.log('[Praytime] Bildirimler devre dışı');
            return;
        }

        const now = new Date();
        const minutesBefore = this._settings.get_int('notify-before-minutes');
        const notifyOnTime = this._settings.get_boolean('notify-on-time');

        console.log(`[Praytime] Bildirimler zamanlanıyor - minutesBefore: ${minutesBefore}, notifyOnTime: ${notifyOnTime}`);

        for (const prayer of prayers) {
            if (prayer.isPassed(now)) {
                console.log(`[Praytime] ${prayer.name} vakti geçmiş, atlanıyor`);
                continue;
            }

            if (minutesBefore > 0) {
                this._scheduleBeforeNotification(prayer, minutesBefore, now, onNotify);
            }

            if (notifyOnTime) {
                this._scheduleOnTimeNotification(prayer, now, onNotify);
            }
        }

        console.log(`[Praytime] Toplam ${this._scheduledTimers.length} bildirim zamanlandı`);
    }

    _scheduleBeforeNotification(prayer, minutesBefore, now, onNotify) {
        const beforeTime = new Date(prayer.time);
        beforeTime.setMinutes(beforeTime.getMinutes() - minutesBefore);

        if (beforeTime <= now) {
            console.log(`[Praytime] ${prayer.name} için "önceden bildir" zamanı geçmiş`);
            return;
        }

        const secondsUntil = Math.floor((beforeTime - now) / 1000);
        console.log(`[Praytime] ${prayer.name} için "önceden bildir" zamanlandı: ${secondsUntil} saniye sonra`);

        const timerId = this._timerAdapter.setTimeout(() => {
            console.log(`[Praytime] "Önceden bildir" tetiklendi: ${prayer.name}`);
            onNotify(
                `${minutesBefore} dakika sonra ${prayer.name}`,
                `${prayer.name} vakti ${prayer.timeString}'de girecek`
            );
        }, secondsUntil);

        this._scheduledTimers.push(timerId);
    }

    _scheduleOnTimeNotification(prayer, now, onNotify) {
        const secondsUntil = prayer.getSecondsUntil(now);

        if (secondsUntil <= 0) {
            console.log(`[Praytime] ${prayer.name} için "vakit girdi" zamanı geçmiş`);
            return;
        }

        console.log(`[Praytime] ${prayer.name} için "vakit girdi" zamanlandı: ${secondsUntil} saniye sonra`);

        const timerId = this._timerAdapter.setTimeout(() => {
            console.log(`[Praytime] "Vakit girdi" tetiklendi: ${prayer.name}`);
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
        if (this._scheduledTimers.length > 0) {
            console.log(`[Praytime] ${this._scheduledTimers.length} bildirim timer'ı temizleniyor`);
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
