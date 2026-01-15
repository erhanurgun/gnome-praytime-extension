import { Location } from '../../domain/models/Location.js';

// Konum sağlayıcısı - GSettings'ten konum bilgisi okur
export class LocationProvider {
    constructor(settings) {
        this._settings = settings;
    }

    // Mevcut konumu al
    async getLocation() {
        const locationId = this._settings.get_int('location-id');
        const cityName = this._settings.get_string('city-name');
        const regionName = this._settings.get_string('region-name');

        if (!locationId || locationId <= 0) {
            console.warn('[Praytime] Geçersiz konum ID, varsayılan kullanılıyor');
            return Location.getDefault();
        }

        return new Location(locationId, cityName, regionName);
    }

    destroy() {
        this._settings = null;
    }
}
