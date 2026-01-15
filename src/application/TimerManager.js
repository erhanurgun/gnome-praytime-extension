export class TimerManager {
    constructor(timerAdapter) {
        this._timerAdapter = timerAdapter;
        this._countdownTimerId = null;
        this._dailyRefreshTimerId = null;
        this._isRunning = false;
    }

    startCountdown(onTick) {
        this._isRunning = true;
        this._countdownTimerId = this._timerAdapter.setInterval(() => {
            if (!this._isRunning) return false;
            onTick();
            return true;
        }, 1);
    }

    scheduleDailyRefresh(onRefresh) {
        const secondsUntilMidnight = this._calculateSecondsUntilMidnight();

        this._dailyRefreshTimerId = this._timerAdapter.setTimeout(() => {
            if (!this._isRunning) return;
            onRefresh();
            this.scheduleDailyRefresh(onRefresh);
        }, secondsUntilMidnight);
    }

    _calculateSecondsUntilMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setDate(midnight.getDate() + 1);
        midnight.setHours(0, 1, 0, 0);
        return Math.floor((midnight - now) / 1000);
    }

    stop() {
        this._isRunning = false;

        if (this._countdownTimerId) {
            this._timerAdapter.clearTimer(this._countdownTimerId);
            this._countdownTimerId = null;
        }

        if (this._dailyRefreshTimerId) {
            this._timerAdapter.clearTimer(this._dailyRefreshTimerId);
            this._dailyRefreshTimerId = null;
        }
    }

    destroy() {
        this.stop();
    }
}
