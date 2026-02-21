// Konum bilgisini temsil eden model
export class Location {
    constructor({ mode = 'city', id = 0, cityName = '', countryName = 'Turkey', regionName = null, latitude = 0, longitude = 0 } = {}) {
        this._mode = mode;
        this._id = id;
        this._cityName = cityName;
        this._countryName = countryName;
        this._regionName = regionName;
        this._latitude = latitude;
        this._longitude = longitude;
    }

    get mode() {
        return this._mode;
    }

    get id() {
        return this._id;
    }

    get cityName() {
        return this._cityName;
    }

    get countryName() {
        return this._countryName;
    }

    get regionName() {
        return this._regionName;
    }

    get latitude() {
        return this._latitude;
    }

    get longitude() {
        return this._longitude;
    }

    get isCityMode() {
        return this._mode === 'city';
    }

    get isCoordinateMode() {
        return this._mode === 'coordinates';
    }

    // Ağrı varsayılan konum
    static getDefault() {
        return new Location({
            mode: 'city',
            id: 9185,
            cityName: 'Ağrı',
            countryName: 'Turkey',
            regionName: 'Ağrı',
        });
    }

    // Mod bazlı doğrulama
    isValid() {
        if (this._mode === 'coordinates') {
            return (
                typeof this._latitude === 'number' &&
                typeof this._longitude === 'number' &&
                Number.isFinite(this._latitude) &&
                Number.isFinite(this._longitude) &&
                this._latitude >= -90 && this._latitude <= 90 &&
                this._longitude >= -180 && this._longitude <= 180
            );
        }

        // city modu
        return (
            typeof this._cityName === 'string' &&
            this._cityName.length > 0 &&
            typeof this._countryName === 'string' &&
            this._countryName.length > 0
        );
    }

    toString() {
        if (this._mode === 'coordinates') {
            return `${this._latitude.toFixed(4)}, ${this._longitude.toFixed(4)}`;
        }

        if (this._regionName && this._regionName !== this._cityName) {
            return `${this._cityName}/${this._regionName}`;
        }
        return this._cityName || 'Unknown Location';
    }
}
