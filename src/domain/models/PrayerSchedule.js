import { PrayerTime } from './PrayerTime.js';
import { PRAYER_NAMES } from '../../config/constants.js';

// Günlük namaz vakitlerini yöneten model
export class PrayerSchedule {
    constructor(prayers = []) {
        this._prayers = prayers;
        this._date = new Date();
    }

    get prayers() {
        return this._prayers;
    }

    get date() {
        return this._date;
    }

    // API verisinden schedule oluştur - id bazlı eşleme
    static fromApiResponse(data, date = new Date(), gettext = null) {
        const _ = gettext || ((s) => s);

        const prayers = PRAYER_NAMES.map(p => {
            const timeStr = data[p.id];
            if (!timeStr) return null;

            const [hours, minutes] = timeStr.split(':').map(Number);
            const prayerDate = new Date(date);
            prayerDate.setHours(hours, minutes, 0, 0);

            return new PrayerTime(p.id, _(p.name), p.nameEn, prayerDate);
        }).filter(p => p !== null);

        const schedule = new PrayerSchedule(prayers);
        schedule._date = date;
        return schedule;
    }

    // Sıradaki namaz vaktini bul
    getNextPrayer(fromDate = new Date()) {
        for (const prayer of this._prayers) {
            if (!prayer.isPassed(fromDate)) {
                return prayer;
            }
        }
        return null;
    }

    // Mevcut aktif vakti bul (en son geçen vakit)
    getCurrentPrayer(fromDate = new Date()) {
        let current = null;
        for (const prayer of this._prayers) {
            if (prayer.isPassed(fromDate)) {
                current = prayer;
            } else {
                break;
            }
        }
        return current;
    }

    // Kronolojik sırayı koruyarak yeni vakit ekle
    insertPrayer(prayer) {
        const index = this._prayers.findIndex(p => p.time > prayer.time);
        if (index === -1) {
            this._prayers.push(prayer);
        } else {
            this._prayers.splice(index, 0, prayer);
        }
    }

    // Belirli vakti id ile bul
    getPrayerById(id) {
        return this._prayers.find(p => p.id === id);
    }

    // Belirli vakti isimle bul (geriye dönük uyumluluk)
    getPrayerByName(name) {
        return this._prayers.find(p => p.name === name || p.nameEn === name);
    }
}
