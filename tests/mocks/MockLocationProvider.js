// LocationProvider mock sınıfı
// PrayerTimeService testleri için kullanılır

// Location sınıfının kopyası (test için bağımsız)
class Location {
    constructor(id, cityName, regionName = null) {
        this._id = id;
        this._cityName = cityName;
        this._regionName = regionName;
    }

    get id() { return this._id; }
    get cityName() { return this._cityName; }
    get regionName() { return this._regionName; }

    static getDefault() {
        return new Location(9185, 'Ağrı', 'Ağrı');
    }

    isValid() {
        return typeof this._id === 'number' && this._id > 0;
    }

    toString() {
        if (this._regionName && this._regionName !== this._cityName) {
            return `${this._cityName}/${this._regionName}`;
        }
        return this._cityName || 'Bilinmeyen Konum';
    }
}

class MockLocationProvider {
    constructor(location = null) {
        this._location = location || Location.getDefault();
        this._destroyed = false;
        this._getLocationCount = 0;
    }

    getLocation() {
        this._getLocationCount++;
        return this._location;
    }

    // Test için yardımcı metodlar
    setLocation(location) {
        this._location = location;
    }

    setLocationById(id, cityName, regionName = null) {
        this._location = new Location(id, cityName, regionName);
    }

    setInvalidLocation() {
        this._location = new Location(0, null, null);
    }

    getLocationCallCount() {
        return this._getLocationCount;
    }

    reset() {
        this._location = Location.getDefault();
        this._getLocationCount = 0;
    }

    destroy() {
        this._destroyed = true;
        this._location = null;
    }

    isDestroyed() {
        return this._destroyed;
    }
}

module.exports = { MockLocationProvider, Location };
