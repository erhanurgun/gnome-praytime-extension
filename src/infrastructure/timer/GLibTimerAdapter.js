import GLib from 'gi://GLib';

export class GLibTimerAdapter {
    constructor() {
        this._activeTimers = new Set();
    }

    setTimeout(callback, seconds) {
        const timerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            seconds,
            () => {
                this._activeTimers.delete(timerId);
                callback();
                return GLib.SOURCE_REMOVE;
            }
        );
        this._activeTimers.add(timerId);
        return timerId;
    }

    setInterval(callback, seconds = 1) {
        const timerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            seconds,
            () => {
                const shouldContinue = callback();
                if (shouldContinue === false) {
                    this._activeTimers.delete(timerId);
                    return GLib.SOURCE_REMOVE;
                }
                return GLib.SOURCE_CONTINUE;
            }
        );
        this._activeTimers.add(timerId);
        return timerId;
    }

    clearTimer(timerId) {
        if (this._activeTimers.has(timerId)) {
            GLib.source_remove(timerId);
            this._activeTimers.delete(timerId);
        }
    }

    clearAll() {
        for (const timerId of this._activeTimers) {
            GLib.source_remove(timerId);
        }
        this._activeTimers.clear();
    }

    destroy() {
        this.clearAll();
    }
}
