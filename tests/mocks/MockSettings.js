// GSettings mock sınıfı
// LocationProvider testleri için kullanılır

class MockSettings {
    constructor(initialValues = {}) {
        this._values = {
            'location-id': 0,
            'city-name': '',
            'region-name': '',
            ...initialValues
        };
    }

    get_int(key) {
        const value = this._values[key];
        return typeof value === 'number' ? value : 0;
    }

    get_string(key) {
        const value = this._values[key];
        return typeof value === 'string' ? value : '';
    }

    set_int(key, value) {
        this._values[key] = value;
    }

    set_string(key, value) {
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
            'region-name': ''
        };
    }
}

module.exports = { MockSettings };
