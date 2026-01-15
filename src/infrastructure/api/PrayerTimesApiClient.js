import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import { API_BASE_URL, PRAYER_NAMES, APP_USER_AGENT } from '../../config/constants.js';

// Diyanet namaz vakitleri API istemcisi
export class PrayerTimesApiClient {
    constructor() {
        this._session = new Soup.Session({
            user_agent: APP_USER_AGENT,
            timeout: 30,
        });
        this._cancellable = null;
    }

    async fetchPrayerTimes(locationId) {
        const url = `${API_BASE_URL}/api/diyanet/prayertimes?location_id=${locationId}`;
        const data = await this._fetchJson(url);

        if (!this._isValidResponse(data)) {
            throw new Error('API yanıtı geçersiz format');
        }

        return this._getTodayPrayerTimes(data);
    }

    _isValidResponse(data) {
        return data && Array.isArray(data) && data.length > 0;
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

    _getTodayPrayerTimes(data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const entry of data) {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);

            if (entryDate.getTime() === today.getTime()) {
                return this._transformEntry(entry);
            }
        }

        // Bugün bulunamazsa ilk kaydı kullan (API bazen farklı tarih döner)
        console.warn('[Praytime] Bugünün vakitleri bulunamadı, ilk kayıt kullanılıyor');
        return this._transformEntry(data[0]);
    }

    _transformEntry(entry) {
        const timeRegex = /^\d{2}:\d{2}$/;
        const result = {};

        for (const prayer of PRAYER_NAMES) {
            const value = entry[prayer.apiKey];
            if (!value || !timeRegex.test(value)) {
                throw new Error(`API yanıtı geçersiz: ${prayer.name} değeri hatalı (${value})`);
            }
            result[prayer.name] = value;
        }

        return result;
    }

    destroy() {
        if (this._cancellable) {
            this._cancellable.cancel();
            this._cancellable = null;
        }
        this._session = null;
    }
}
