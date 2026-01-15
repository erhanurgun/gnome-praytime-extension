class MockTimerAdapter {
    constructor() {
        this._activeTimers = new Map();
        this._nextTimerId = 1;
        this._currentTime = 0;
    }

    setTimeout(callback, seconds) {
        const timerId = this._nextTimerId++;
        this._activeTimers.set(timerId, {
            callback,
            targetTime: this._currentTime + seconds,
            type: 'timeout'
        });
        return timerId;
    }

    setInterval(callback, seconds = 1) {
        const timerId = this._nextTimerId++;
        this._activeTimers.set(timerId, {
            callback,
            interval: seconds,
            nextTrigger: this._currentTime + seconds,
            type: 'interval'
        });
        return timerId;
    }

    clearTimer(timerId) {
        this._activeTimers.delete(timerId);
    }

    clearAll() {
        this._activeTimers.clear();
    }

    destroy() {
        this.clearAll();
    }

    triggerTimer(timerId) {
        const timer = this._activeTimers.get(timerId);
        if (!timer) return false;

        const result = timer.callback();

        if (timer.type === 'timeout') {
            this._activeTimers.delete(timerId);
        } else if (timer.type === 'interval' && result === false) {
            this._activeTimers.delete(timerId);
        }

        return true;
    }

    advanceTime(seconds) {
        this._currentTime += seconds;
        const triggeredTimers = [];

        for (const [timerId, timer] of this._activeTimers) {
            if (timer.type === 'timeout' && timer.targetTime <= this._currentTime) {
                triggeredTimers.push({ timerId, timer });
            } else if (timer.type === 'interval' && timer.nextTrigger <= this._currentTime) {
                triggeredTimers.push({ timerId, timer });
            }
        }

        for (const { timerId, timer } of triggeredTimers) {
            const result = timer.callback();

            if (timer.type === 'timeout') {
                this._activeTimers.delete(timerId);
            } else if (timer.type === 'interval') {
                if (result === false) {
                    this._activeTimers.delete(timerId);
                } else {
                    timer.nextTrigger = this._currentTime + timer.interval;
                }
            }
        }

        return triggeredTimers.length;
    }

    getActiveTimerCount() {
        return this._activeTimers.size;
    }

    hasTimer(timerId) {
        return this._activeTimers.has(timerId);
    }
}

module.exports = { MockTimerAdapter };
