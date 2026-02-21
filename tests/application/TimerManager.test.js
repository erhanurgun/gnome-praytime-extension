const { MockTimerAdapter } = require('../mocks/MockTimerAdapter.js');

class TimerManager {
    constructor(timerAdapter) {
        this._timerAdapter = timerAdapter;
        this._countdownTimerId = null;
        this._dailyRefreshTimerId = null;
        this._retryTimerId = null;
        this._isRunning = false;
    }

    get isRunning() {
        return this._isRunning;
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

    scheduleOnce(callback, seconds) {
        return this._timerAdapter.setTimeout(callback, seconds);
    }

    scheduleRetry(callback, seconds) {
        this.clearRetry();
        this._retryTimerId = this._timerAdapter.setTimeout(() => {
            this._retryTimerId = null;
            callback();
        }, seconds);
    }

    clearRetry() {
        if (this._retryTimerId) {
            this._timerAdapter.clearTimer(this._retryTimerId);
            this._retryTimerId = null;
        }
    }

    stop() {
        this._isRunning = false;
        this.clearRetry();

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
        console.log(`  [BAŞARILI] ${message}`);
        passedTests++;
    } else {
        console.log(`  [HATALI] ${message}`);
        failedTests++;
    }
}

function assertEqual(actual, expected, message) {
    const passed = actual === expected;
    if (passed) {
        console.log(`  [BAŞARILI] ${message}`);
        passedTests++;
    } else {
        console.log(`  [HATALI] ${message}`);
        console.log(`    Beklenen: ${expected}`);
        console.log(`    Gerçek: ${actual}`);
        failedTests++;
    }
}

console.log('\n=== TimerManager Testleri ===\n');

console.log('1. Constructor Testleri:');
const mockAdapter1 = new MockTimerAdapter();
const manager1 = new TimerManager(mockAdapter1);
assert(manager1._timerAdapter === mockAdapter1, 'timerAdapter doğru atanır');
assertEqual(manager1._countdownTimerId, null, 'countdownTimerId null başlar');
assertEqual(manager1._dailyRefreshTimerId, null, 'dailyRefreshTimerId null başlar');
assertEqual(manager1._retryTimerId, null, 'retryTimerId null başlar');
assertEqual(manager1._isRunning, false, 'isRunning false başlar');
assertEqual(manager1.isRunning, false, 'isRunning getter false döner');

console.log('\n2. startCountdown Testleri:');
const mockAdapter2 = new MockTimerAdapter();
const manager2 = new TimerManager(mockAdapter2);
let tickCount = 0;

manager2.startCountdown(() => {
    tickCount++;
});

assertEqual(manager2._isRunning, true, 'isRunning true olur');
assertEqual(manager2.isRunning, true, 'isRunning getter true döner');
assert(manager2._countdownTimerId !== null, 'countdownTimerId atanır');
assertEqual(mockAdapter2.getActiveTimerCount(), 1, 'Bir timer oluşturulur');

mockAdapter2.triggerTimer(manager2._countdownTimerId);
assertEqual(tickCount, 1, 'onTick callback çağrılır');

mockAdapter2.triggerTimer(manager2._countdownTimerId);
assertEqual(tickCount, 2, 'onTick tekrar çağrılır');

console.log('\n3. stop Testleri:');
const mockAdapter3 = new MockTimerAdapter();
const manager3 = new TimerManager(mockAdapter3);

manager3.startCountdown(() => {});
manager3.scheduleDailyRefresh(() => {});

assertEqual(mockAdapter3.getActiveTimerCount(), 2, 'İki timer aktif');

manager3.stop();

assertEqual(manager3._isRunning, false, 'stop sonrası isRunning false');
assertEqual(manager3._countdownTimerId, null, 'countdownTimerId null olur');
assertEqual(manager3._dailyRefreshTimerId, null, 'dailyRefreshTimerId null olur');
assertEqual(mockAdapter3.getActiveTimerCount(), 0, 'Tüm timerlar temizlenir');

console.log('\n4. destroy Testleri:');
const mockAdapter4 = new MockTimerAdapter();
const manager4 = new TimerManager(mockAdapter4);

manager4.startCountdown(() => {});
manager4.destroy();

assertEqual(manager4._isRunning, false, 'destroy stop çağırır');
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
assert(!timerExists, 'Stop sonrası timer kaldırılır');

console.log('\n6. scheduleOnce Testleri:');
const mockAdapter6 = new MockTimerAdapter();
const manager6 = new TimerManager(mockAdapter6);
let onceCalled = false;

const onceId = manager6.scheduleOnce(() => {
    onceCalled = true;
}, 5);

assert(onceId !== null, 'scheduleOnce timer ID döner');
assertEqual(mockAdapter6.getActiveTimerCount(), 1, 'Bir timer oluşturulur');
assertEqual(onceCalled, false, 'Henüz tetiklenmedi');

mockAdapter6.triggerTimer(onceId);
assertEqual(onceCalled, true, 'Timer tetiklenince callback çağrılır');
assertEqual(mockAdapter6.getActiveTimerCount(), 0, 'Tek seferlik timer otomatik temizlenir');

console.log('\n7. scheduleRetry Testleri:');
const mockAdapter7 = new MockTimerAdapter();
const manager7 = new TimerManager(mockAdapter7);
let retryCount = 0;

manager7.scheduleRetry(() => {
    retryCount++;
}, 15);

assert(manager7._retryTimerId !== null, 'retryTimerId atanır');
assertEqual(mockAdapter7.getActiveTimerCount(), 1, 'Bir retry timer oluşturulur');

mockAdapter7.triggerTimer(manager7._retryTimerId);
assertEqual(retryCount, 1, 'Retry callback çağrılır');
assertEqual(manager7._retryTimerId, null, 'Retry sonrası retryTimerId null olur');

console.log('\n8. Önceki retry iptal edilir:');
const mockAdapter8 = new MockTimerAdapter();
const manager8 = new TimerManager(mockAdapter8);
let retry8Count = 0;

manager8.scheduleRetry(() => { retry8Count++; }, 15);
const firstRetryId = manager8._retryTimerId;
assertEqual(mockAdapter8.getActiveTimerCount(), 1, 'İlk retry timer oluşturulur');

manager8.scheduleRetry(() => { retry8Count += 10; }, 30);
const secondRetryId = manager8._retryTimerId;
assertEqual(mockAdapter8.getActiveTimerCount(), 1, 'Hala tek timer - eski temizlendi');
assert(firstRetryId !== secondRetryId, 'Yeni retry ID farklı');
assert(!mockAdapter8.hasTimer(firstRetryId), 'Eski retry timer kaldırıldı');

mockAdapter8.triggerTimer(secondRetryId);
assertEqual(retry8Count, 10, 'Sadece yeni retry callback çağrılır');

console.log('\n9. clearRetry Testleri:');
const mockAdapter9 = new MockTimerAdapter();
const manager9 = new TimerManager(mockAdapter9);

manager9.scheduleRetry(() => {}, 15);
assert(manager9._retryTimerId !== null, 'retryTimerId mevcut');
assertEqual(mockAdapter9.getActiveTimerCount(), 1, 'Retry timer aktif');

manager9.clearRetry();
assertEqual(manager9._retryTimerId, null, 'clearRetry sonrası retryTimerId null');
assertEqual(mockAdapter9.getActiveTimerCount(), 0, 'Retry timer temizlendi');

// clearRetry boş durumda hata vermez
manager9.clearRetry();
assertEqual(manager9._retryTimerId, null, 'Boş durumda clearRetry hata vermez');

console.log('\n10. stop - Retry timer da temizlenir:');
const mockAdapter10 = new MockTimerAdapter();
const manager10 = new TimerManager(mockAdapter10);

manager10.startCountdown(() => {});
manager10.scheduleRetry(() => {}, 30);
assertEqual(mockAdapter10.getActiveTimerCount(), 2, 'Countdown + retry timer aktif');

manager10.stop();
assertEqual(mockAdapter10.getActiveTimerCount(), 0, 'stop tüm timerları temizler (retry dahil)');
assertEqual(manager10._retryTimerId, null, 'stop sonrası retryTimerId null');

console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
