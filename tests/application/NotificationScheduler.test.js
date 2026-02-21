// NotificationScheduler birim testleri
// GLib/GObject bağımlılığı olmadan çalışır

require('../helpers/polyfills.js');

const { MockTimerAdapter } = require('../mocks/MockTimerAdapter.js');

class MockSettings {
    constructor(values = {}) {
        this._values = {
            'notifications-enabled': true,
            'notify-before-minutes': 10,
            'notify-on-time': true,
            ...values
        };
    }

    get_boolean(key) {
        return this._values[key] ?? false;
    }

    get_int(key) {
        return this._values[key] ?? 0;
    }
}

class MockPrayer {
    constructor(id, name, time) {
        this._id = id;
        this._name = name;
        this._time = time instanceof Date ? time : new Date(time);
    }

    get id() { return this._id; }
    get name() { return this._name; }
    get nameEn() { return this._name; }
    get time() { return this._time; }

    get timeString() {
        const hours = this._time.getHours().toString().padStart(2, '0');
        const minutes = this._time.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    getSecondsUntil(fromDate = new Date()) {
        return Math.floor((this._time.getTime() - fromDate.getTime()) / 1000);
    }

    isPassed(fromDate = new Date()) {
        return fromDate >= this._time;
    }
}

// gettext identity fonksiyonu
let _ = (s) => s;

class NotificationScheduler {
    constructor({ timerAdapter, settings, gettext }) {
        this._timerAdapter = timerAdapter;
        this._settings = settings;
        this._scheduledTimers = [];
        if (gettext) _ = gettext;
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
                _('%d dakika sonra %s').format(minutesBefore, prayer.name),
                _('%s vakti %s\'de girecek').format(prayer.name, prayer.timeString)
            );
        }, secondsUntil);

        this._scheduledTimers.push(timerId);
    }

    _scheduleOnTimeNotification(prayer, now, onNotify) {
        const secondsUntil = prayer.getSecondsUntil(now);
        if (secondsUntil <= 0) return;

        const timerId = this._timerAdapter.setTimeout(() => {
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

console.log('\n=== NotificationScheduler Testleri ===\n');

console.log('1. Constructor Testleri:');
const mockAdapter1 = new MockTimerAdapter();
const mockSettings1 = new MockSettings();
const scheduler1 = new NotificationScheduler({
    timerAdapter: mockAdapter1,
    settings: mockSettings1
});

assert(scheduler1._timerAdapter === mockAdapter1, 'timerAdapter doğru atanır');
assert(scheduler1._settings === mockSettings1, 'settings doğru atanır');
assert(Array.isArray(scheduler1._scheduledTimers), 'scheduledTimers array olarak başlar');
assertEqual(scheduler1._scheduledTimers.length, 0, 'scheduledTimers boş başlar');

console.log('\n2. scheduleForPrayers Testleri:');
const mockAdapter2 = new MockTimerAdapter();
const mockSettings2 = new MockSettings({
    'notifications-enabled': true,
    'notify-before-minutes': 10,
    'notify-on-time': true
});
const scheduler2 = new NotificationScheduler({
    timerAdapter: mockAdapter2,
    settings: mockSettings2
});

const now = new Date();
const futureTime = new Date(now.getTime() + 30 * 60 * 1000);
const prayers = [
    new MockPrayer('ogle', 'Öğle', futureTime)
];

let notifications = [];
scheduler2.scheduleForPrayers(prayers, (title, body) => {
    notifications.push({ title, body });
});

assertEqual(mockAdapter2.getActiveTimerCount(), 2, 'İki timer oluşturulur (öncesi ve vakti)');
assertEqual(scheduler2._scheduledTimers.length, 2, 'scheduledTimers iki kayıt içerir');

console.log('\n3. Bildirimler Devre Dışı Testi:');
const mockAdapter3 = new MockTimerAdapter();
const mockSettings3 = new MockSettings({
    'notifications-enabled': false
});
const scheduler3 = new NotificationScheduler({
    timerAdapter: mockAdapter3,
    settings: mockSettings3
});

scheduler3.scheduleForPrayers(prayers, () => {});
assertEqual(mockAdapter3.getActiveTimerCount(), 0, 'Bildirimler kapalıyken timer oluşturulmaz');

console.log('\n4. Geçmiş Vakit Testi:');
const mockAdapter4 = new MockTimerAdapter();
const mockSettings4 = new MockSettings();
const scheduler4 = new NotificationScheduler({
    timerAdapter: mockAdapter4,
    settings: mockSettings4
});

const pastTime = new Date(now.getTime() - 60 * 60 * 1000);
const pastPrayers = [
    new MockPrayer('imsak', 'İmsak', pastTime)
];

scheduler4.scheduleForPrayers(pastPrayers, () => {});
assertEqual(mockAdapter4.getActiveTimerCount(), 0, 'Geçmiş vakit için timer oluşturulmaz');

console.log('\n5. clearAll Testi:');
const mockAdapter5 = new MockTimerAdapter();
const mockSettings5 = new MockSettings();
const scheduler5 = new NotificationScheduler({
    timerAdapter: mockAdapter5,
    settings: mockSettings5
});

scheduler5.scheduleForPrayers(prayers, () => {});
assert(mockAdapter5.getActiveTimerCount() > 0, 'Timer oluşturuldu');

scheduler5.clearAll();
assertEqual(mockAdapter5.getActiveTimerCount(), 0, 'clearAll tüm timerları temizler');
assertEqual(scheduler5._scheduledTimers.length, 0, 'scheduledTimers temizlenir');

console.log('\n6. destroy Testi:');
const mockAdapter6 = new MockTimerAdapter();
const mockSettings6 = new MockSettings();
const scheduler6 = new NotificationScheduler({
    timerAdapter: mockAdapter6,
    settings: mockSettings6
});

scheduler6.scheduleForPrayers(prayers, () => {});
scheduler6.destroy();

assertEqual(mockAdapter6.getActiveTimerCount(), 0, 'destroy timerları temizler');
assertEqual(scheduler6._settings, null, 'destroy settings referansını siler');

console.log('\n7. Sadece On-Time Bildirim Testi:');
const mockAdapter7 = new MockTimerAdapter();
const mockSettings7 = new MockSettings({
    'notifications-enabled': true,
    'notify-before-minutes': 0,
    'notify-on-time': true
});
const scheduler7 = new NotificationScheduler({
    timerAdapter: mockAdapter7,
    settings: mockSettings7
});

scheduler7.scheduleForPrayers(prayers, () => {});
assertEqual(mockAdapter7.getActiveTimerCount(), 1, 'Sadece on-time bildirim için bir timer');

console.log('\n8. Sadece Before Bildirim Testi:');
const mockAdapter8 = new MockTimerAdapter();
const mockSettings8 = new MockSettings({
    'notifications-enabled': true,
    'notify-before-minutes': 10,
    'notify-on-time': false
});
const scheduler8 = new NotificationScheduler({
    timerAdapter: mockAdapter8,
    settings: mockSettings8
});

scheduler8.scheduleForPrayers(prayers, () => {});
assertEqual(mockAdapter8.getActiveTimerCount(), 1, 'Sadece before bildirim için bir timer');

console.log('\n9. Format String Bildirim İçeriği Testi:');
const mockAdapter9 = new MockTimerAdapter();
const mockSettings9 = new MockSettings({
    'notifications-enabled': true,
    'notify-before-minutes': 10,
    'notify-on-time': true,
});
const scheduler9 = new NotificationScheduler({
    timerAdapter: mockAdapter9,
    settings: mockSettings9
});

const farFuture = new Date(now.getTime() + 60 * 60 * 1000);
const formatPrayers = [
    new MockPrayer('ogle', 'Öğle', farFuture)
];

let formatNotifications = [];
scheduler9.scheduleForPrayers(formatPrayers, (title, body) => {
    formatNotifications.push({ title, body });
});

// Timer'ları tetikle (büyük zaman ilerlemesi ile)
mockAdapter9.advanceTime(999999);

assertEqual(formatNotifications.length, 2, 'İki bildirim tetiklendi');
// before bildirim
assert(formatNotifications[0].title.includes('10'), 'Before bildirimi dakika içerir');
assert(formatNotifications[0].title.includes('Öğle'), 'Before bildirimi vakit adı içerir');
// on-time bildirim
assert(formatNotifications[1].title.includes('Öğle'), 'On-time bildirimi vakit adı içerir');

console.log('\n10. Gettext Parametresi Testi:');
const mockAdapter10 = new MockTimerAdapter();
const mockSettings10 = new MockSettings();
const mockGettext = (s) => s.replace('Öğle', 'Dhuhr');
const scheduler10 = new NotificationScheduler({
    timerAdapter: mockAdapter10,
    settings: mockSettings10,
    gettext: mockGettext
});

assert(scheduler10._timerAdapter === mockAdapter10, 'Gettext ile scheduler oluşturuldu');

console.log('\n=== Sonuç ===');
console.log(`Toplam: ${passedTests + failedTests} test`);
console.log(`Başarılı: ${passedTests}`);
console.log(`Başarısız: ${failedTests}`);

if (failedTests > 0) {
    process.exit(1);
}
