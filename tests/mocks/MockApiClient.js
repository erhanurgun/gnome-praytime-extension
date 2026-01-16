// PrayerTimesApiClient mock sınıfı
// PrayerTimeService testleri için kullanılır

class MockApiClient {
    constructor() {
        this._mockData = null;
        this._shouldFail = false;
        this._errorMessage = 'Mock API hatası';
        this._fetchCount = 0;
        this._lastLocationId = null;
        this._destroyed = false;
    }

    // Mock veri ayarlama
    setMockData(data) {
        this._mockData = data;
    }

    // Hata simülasyonu
    setError(shouldFail, message = 'Mock API hatası') {
        this._shouldFail = shouldFail;
        this._errorMessage = message;
    }

    // API çağrısını simüle et
    async fetchPrayerTimes(locationId) {
        this._fetchCount++;
        this._lastLocationId = locationId;

        if (this._shouldFail) {
            throw new Error(this._errorMessage);
        }

        if (!this._mockData) {
            // Varsayılan mock veri
            return this._getDefaultMockData();
        }

        return this._mockData;
    }

    _getDefaultMockData() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        return [
            {
                date: dateStr,
                fajr: '05:30',
                sun: '07:00',
                dhuhr: '12:30',
                asr: '15:45',
                maghrib: '18:15',
                isha: '19:45'
            }
        ];
    }

    // Test için yardımcı metodlar
    getFetchCount() {
        return this._fetchCount;
    }

    getLastLocationId() {
        return this._lastLocationId;
    }

    reset() {
        this._mockData = null;
        this._shouldFail = false;
        this._errorMessage = 'Mock API hatası';
        this._fetchCount = 0;
        this._lastLocationId = null;
    }

    destroy() {
        this._destroyed = true;
        this.reset();
    }

    isDestroyed() {
        return this._destroyed;
    }
}

module.exports = { MockApiClient };
