const { MockTimerAdapter } = require('../mocks/MockTimerAdapter.js');

class TimerManager {
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

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  [BASARILI] ${message}`);
        passedTests++;
    } else {
        console.log(`  [HATALI] ${message}`);
        failedTests++;
    }
}

function assertEqual(actual, expected, message) {
    const passed = actual === expected;
    if (passed) {
        console.log(`  [BASARILI] ${message}`);
        passedTests++;
    } else {
        console.log(`  [HATALI] ${message}`);
        console.log(`    Beklenen: ${expected}`);
        console.log(`    Gercek: ${actual}`);
        failedTests++;
    }
}

console.log('\n=== TimerManager Testleri ===\n');

console.log('1. Constructor Testleri:');
const mockAdapter1 = new MockTimerAdapter();
const manager1 = new TimerManager(mockAdapter1);
assert(manager1._timerAdapter === mockAdapter1, 'timerAdapter dogru atanir');
assertEqual(manager1._countdownTimerId, null, 'countdownTimerId null baslar');
assertEqual(manager1._dailyRefreshTimerId, null, 'dailyRefreshTimerId null baslar');
assertEqual(manager1._isRunning, false, 'isRunning false baslar');

console.log('\n2. startCountdown Testleri:');
const mockAdapter2 = new MockTimerAdapter();
const manager2 = new TimerManager(mockAdapter2);
let tickCount = 0;

manager2.startCountdown(() => {
    tickCount++;
});

assertEqual(manager2._isRunning, true, 'isRunning true olur');
assert(manager2._countdownTimerId !== null, 'countdownTimerId atanir');
assertEqual(mockAdapter2.getActiveTimerCount(), 1, 'Bir timer olusturulur');

mockAdapter2.triggerTimer(manager2._countdownTimerId);
assertEqual(tickCount, 1, 'onTick callback cagirilir');

mockAdapter2.triggerTimer(manager2._countdownTimerId);
assertEqual(tickCount, 2, 'onTick tekrar cagirilir');

console.log('\n3. stop Testleri:');
const mockAdapter3 = new MockTimerAdapter();
const manager3 = new TimerManager(mockAdapter3);

manager3.startCountdown(() => {});
manager3.scheduleDailyRefresh(() => {});

assertEqual(mockAdapter3.getActiveTimerCount(), 2, 'Iki timer aktif');

manager3.stop();

assertEqual(manager3._isRunning, false, 'stop sonrasi isRunning false');
assertEqual(manager3._countdownTimerId, null, 'countdownTimerId null olur');
assertEqual(manager3._dailyRefreshTimerId, null, 'dailyRefreshTimerId null olur');
assertEqual(mockAdapter3.getActiveTimerCount(), 0, 'Tum timerlar temizlenir');

console.log('\n4. destroy Testleri:');
const mockAdapter4 = new MockTimerAdapter();
const manager4 = new TimerManager(mockAdapter4);

manager4.startCountdown(() => {});
manager4.destroy();

assertEqual(manager4._isRunning, false, 'destroy stop cagirir');
assertEqual(mockAdapter4.getActiveTimerCount(), 0, 'destroy timerları temizler');

console.log('\n5. Interval Durdurma Testi:');
const mockAdapter5 = new MockTimerAdapter();
const manager5 = new TimerManager(mockAdapter5);
let tickCount5 = 0;

manager5.startCountdown(() => {
    tickCount5++;
});

manager5.stop();

const timerId = manager5._countdownTimerId;
const timerExists = timerId !== null ? mockAdapter5.hasTimer(timerId) : false;
assert(!timerExists, 'Stop sonrasi timer kaldirılır');

console.log('\n=== Sonuc ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Basarili: ${passedTests}`);
console.log(`Basarisiz: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
