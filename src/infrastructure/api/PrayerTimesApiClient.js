import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import { API_BASE_URL, PRAYER_NAMES, APP_USER_AGENT } from '../../config/constants.js';

// Aladhan namaz vakitleri API istemcisi (Diyanet hesaplama metodu)
export class PrayerTimesApiClient {
    constructor() {
        this._session = new Soup.Session({
            user_agent: APP_USER_AGENT,
            timeout: 30,
        });
        this._cancellable = null;
    }

    async fetchPrayerTimes(location) {
        const dateStr = this._formatDate(new Date());
        const city = encodeURIComponent(location.cityName);
        const url = `${API_BASE_URL}/v1/timingsByCity/${dateStr}?city=${city}&country=Turkey&method=13`;
        const data = await this._fetchJson(url);

        if (!this._isValidResponse(data)) {
            throw new Error('API yanıtı geçersiz format');
        }

        return this._transformResponse(data);
    }

    _isValidResponse(data) {
        return data && data.code === 200 && data.data && data.data.timings;
    }

    _fetchJson(url) {
        return new Promise((resolve, reject) => {
            const message = Soup.Message.new('GET', url);

            if (this._cancellable) {
                this._cancellable.cancel();
            }
            this._cancellable = new Gio.Cancellable();

            this._session.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                this._cancellable,
                (session, result) => {
                    try {
                        const bytes = session.send_and_read_finish(result);
                        const status = message.get_status();

                        if (status !== 200) {
                            reject(new Error(`HTTP ${status}`));
                            return;
                        }

                        const text = new TextDecoder().decode(bytes.get_data());
                        resolve(JSON.parse(text));
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    }

    _transformResponse(data) {
        const timings = data.data.timings;
        const timeRegex = /^\d{2}:\d{2}$/;
        const prayers = {};

        for (const prayer of PRAYER_NAMES) {
            const value = timings[prayer.apiKey];
            if (!value || !timeRegex.test(value)) {
                throw new Error(`API yanıtı geçersiz: ${prayer.name} değeri hatalı (${value})`);
            }
            prayers[prayer.name] = value;
        }

        // Ek vakit meta verisi (Teheccüd ve Ramazan tespiti için)
        const lastthirdRaw = timings.Lastthird || null;
        const lastthird = lastthirdRaw ? lastthirdRaw.replace(/\s*\(.*\)/, '') : null;
        const hijriMonth = data.data.date?.hijri?.month?.number ?? null;

        return {
            prayers,
            meta: { lastthird, hijriMonth },
        };
    }

    _formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    destroy() {
        if (this._cancellable) {
            this._cancellable.cancel();
            this._cancellable = null;
        }
        this._session = null;
    }
}
