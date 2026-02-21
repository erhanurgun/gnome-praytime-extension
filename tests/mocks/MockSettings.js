// GSettings mock sınıfı

class MockSettings {
    constructor(initialValues = {}) {
        this._values = {
            'location-id': 0,
            'city-name': '',
            'region-name': '',
            'location-mode': 'city',
            'country-name': 'Turkey',
            'latitude': 39.9334,
            'longitude': 32.8597,
            'calculation-method': 13,
            'language': 'tr',
            'ramadan-mode': 'auto',
            'sahur-enabled': false,
            'sahur-minutes-before': 30,
            'tahajjud-enabled': false,
            'tahajjud-offset-minutes': 0,
            'notifications-enabled': true,
            'notify-before-minutes': 5,
            'notify-on-time': true,
            'notification-sound': true,
            ...initialValues
        };
    }

    get_int(key) {
        const value = this._values[key];
        return typeof value === 'number' ? Math.floor(value) : 0;
    }

    get_string(key) {
        const value = this._values[key];
        return typeof value === 'string' ? value : '';
    }

    get_boolean(key) {
        const value = this._values[key];
        return typeof value === 'boolean' ? value : false;
    }

    get_double(key) {
        const value = this._values[key];
        return typeof value === 'number' ? value : 0.0;
    }

    set_int(key, value) {
        this._values[key] = value;
    }

    set_string(key, value) {
        this._values[key] = value;
    }

    set_boolean(key, value) {
        this._values[key] = value;
    }

    set_double(key, value) {
        this._values[key] = value;
    }

    // Test için yardımcı metodlar
    setValues(values) {
        this._values = { ...this._values, ...values };
    }

    getValues() {
        return { ...this._values };
    }

    reset() {
        this._values = {
            'location-id': 0,
            'city-name': '',
            'region-name': '',
            'location-mode': 'city',
            'country-name': 'Turkey',
            'latitude': 39.9334,
            'longitude': 32.8597,
            'calculation-method': 13,
            'language': 'tr',
        };
    }
}

module.exports = { MockSettings };
