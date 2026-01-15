// Konum bilgisini temsil eden model
export class Location {
    constructor(id, cityName, regionName = null) {
        this._id = id;
        this._cityName = cityName;
        this._regionName = regionName;
    }

    get id() {
        return this._id;
    }

    get cityName() {
        return this._cityName;
    }

    get regionName() {
        return this._regionName;
    }

    // Ağrı varsayılan konum
    static getDefault() {
        return new Location(9185, 'Ağrı', 'Ağrı');
    }

    // Geçerli konum mu
    isValid() {
        return (
            typeof this._id === 'number' &&
            this._id > 0 &&
            Number.isFinite(this._id)
        );
    }

    // API yanıtından oluştur
    static fromApiResponse(data) {
        return new Location(data.id, data.city, data.region || data.city);
    }

    toString() {
        if (this._regionName && this._regionName !== this._cityName) {
            return `${this._cityName}/${this._regionName}`;
        }
        return this._cityName || 'Bilinmeyen Konum';
    }
}
