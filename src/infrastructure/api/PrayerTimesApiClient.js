import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

const API_BASE_URL = 'https://prayertimes.api.abdus.dev';

// Diyanet namaz vakitleri API istemcisi
export class PrayerTimesApiClient {
    constructor() {
        this._session = new Soup.Session({
            user_agent: 'praytime@erho.dev/0.2.0',
            timeout: 30,
        });
    }

    // location_id ile namaz vakitlerini al
    async fetchPrayerTimes(locationId) {
        const url = `${API_BASE_URL}/api/diyanet/prayertimes?location_id=${locationId}`;

        try {
            const data = await this._fetchJson(url);

            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error('API yanıtı geçersiz format');
            }

            // Bugünün vakitlerini bul
            return this._getTodayPrayerTimes(data);
        } catch (error) {
            console.error(`[Praytime] API hatası: ${error.message}`);
            throw error;
        }
    }

    // Şehir araması yap
    async searchCity(query) {
        const url = `${API_BASE_URL}/api/diyanet/search?q=${encodeURIComponent(query)}`;

        try {
            const data = await this._fetchJson(url);
            return data || [];
        } catch (error) {
            console.error(`[Praytime] Şehir arama hatası: ${error.message}`);
            return [];
        }
    }

    // JSON veri çek
    _fetchJson(url) {
        return new Promise((resolve, reject) => {
            const message = Soup.Message.new('GET', url);
            const cancellable = new Gio.Cancellable();

            this._session.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                cancellable,
                (session, result) => {
                    try {
                        const bytes = session.send_and_read_finish(result);
                        const status = message.get_status();

                        if (status !== 200) {
                            reject(new Error(`HTTP ${status}`));
                            return;
                        }

                        const text = new TextDecoder().decode(bytes.get_data());
                        const json = JSON.parse(text);
                        resolve(json);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    }

    // Bugünün namaz vakitlerini API yanıtından çıkar
    _getTodayPrayerTimes(data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Bugünün tarihine uyan kaydı bul
        for (const entry of data) {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);

            if (entryDate.getTime() === today.getTime()) {
                return this._transformEntry(entry);
            }
        }

        // Bugün bulunamazsa ilk kaydı kullan
        if (data.length > 0) {
            console.warn('[Praytime] Bugünün vakitleri bulunamadı, ilk kayıt kullanılıyor');
            return this._transformEntry(data[0]);
        }

        throw new Error('API yanıtında namaz vakti bulunamadı');
    }

    // API kaydını domain formatına dönüştür
    _transformEntry(entry) {
        const timeRegex = /^\d{2}:\d{2}$/;

        const result = {
            İmsak: entry.fajr,
            Güneş: entry.sun,
            Öğle: entry.dhuhr,
            İkindi: entry.asr,
            Akşam: entry.maghrib,
            Yatsı: entry.isha,
        };

        // Validasyon
        for (const [key, value] of Object.entries(result)) {
            if (!value || !timeRegex.test(value)) {
                throw new Error(`API yanıtı geçersiz: ${key} değeri hatalı (${value})`);
            }
        }

        return result;
    }

    destroy() {
        this._session = null;
    }
}
