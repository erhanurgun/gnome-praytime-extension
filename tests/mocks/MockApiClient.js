// PrayerTimesApiClient mock sınıfı
// PrayerTimeService testleri için kullanılır

class MockApiClient {
    constructor() {
        this._mockData = null;
        this._shouldFail = false;
        this._errorMessage = 'Mock API hatası';
        this._fetchCount = 0;
        this._lastLocation = null;
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
    async fetchPrayerTimes(location) {
        this._fetchCount++;
        this._lastLocation = location;

        if (this._shouldFail) {
            throw new Error(this._errorMessage);
        }

        if (!this._mockData) {
            return this._getDefaultMockData();
        }

        return this._mockData;
    }

    _getDefaultMockData() {
        // API client'ın _transformResponse sonucu: { prayers, meta } formatı
        return {
            prayers: {
                'İmsak': '05:30',
                'Güneş': '07:00',
                'Öğle': '12:30',
                'İkindi': '15:45',
                'Akşam': '18:15',
                'Yatsı': '19:45'
            },
            meta: {
                lastthird: '03:30',
                hijriMonth: 8,
            }
        };
    }

    // Test için yardımcı metodlar
    getFetchCount() {
        return this._fetchCount;
    }

    getLastLocation() {
        return this._lastLocation;
    }

    reset() {
        this._mockData = null;
        this._shouldFail = false;
        this._errorMessage = 'Mock API hatası';
        this._fetchCount = 0;
        this._lastLocation = null;
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
