// PrayerTimesApiClient mock sınıfı

class MockApiClient {
    constructor() {
        this._mockData = null;
        this._shouldFail = false;
        this._errorMessage = 'Mock API error';
        this._fetchCount = 0;
        this._lastLocation = null;
        this._destroyed = false;
    }

    setMockData(data) {
        this._mockData = data;
    }

    setError(shouldFail, message = 'Mock API error') {
        this._shouldFail = shouldFail;
        this._errorMessage = message;
    }

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
        // id bazlı eşleme - _transformResponse çıktı formatı
        return {
            prayers: {
                'imsak': '05:30',
                'gunes': '07:00',
                'ogle': '12:30',
                'ikindi': '15:45',
                'aksam': '18:15',
                'yatsi': '19:45'
            },
            meta: {
                lastthird: '03:30',
                hijriMonth: 8,
            }
        };
    }

    getFetchCount() {
        return this._fetchCount;
    }

    getLastLocation() {
        return this._lastLocation;
    }

    reset() {
        this._mockData = null;
        this._shouldFail = false;
        this._errorMessage = 'Mock API error';
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
