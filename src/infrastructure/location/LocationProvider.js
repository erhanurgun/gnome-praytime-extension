import { Location } from '../../domain/models/Location.js';

// Konum sağlayıcısı - GSettings'ten konum bilgisi okur
export class LocationProvider {
    constructor(settings) {
        this._settings = settings;
    }

    // Mevcut konumu al - senkron, I/O yok
    getLocation() {
        const mode = this._settings.get_string('location-mode');

        if (mode === 'coordinates') {
            return this._getCoordinateLocation();
        }

        return this._getCityLocation();
    }

    _getCityLocation() {
        const locationId = this._settings.get_int('location-id');
        const cityName = this._settings.get_string('city-name');
        const countryName = this._settings.get_string('country-name');
        const regionName = this._settings.get_string('region-name');

        if (!cityName || !countryName) {
            console.warn('[Praytime] Invalid city/country, using default');
            return Location.getDefault();
        }

        return new Location({
            mode: 'city',
            id: locationId,
            cityName,
            countryName,
            regionName,
        });
    }

    _getCoordinateLocation() {
        const latitude = this._settings.get_double('latitude');
        const longitude = this._settings.get_double('longitude');

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            console.warn('[Praytime] Invalid coordinates, using default');
            return Location.getDefault();
        }

        return new Location({
            mode: 'coordinates',
            latitude,
            longitude,
        });
    }

    destroy() {
        this._settings = null;
    }
}
