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

    // API verisinden schedule oluştur
    static fromApiResponse(data, date = new Date()) {
        // PRAYER_NAMES sabitini kullan - key olarak Türkçe isim kullanılıyor
        // çünkü API client'tan gelen data Türkçe key'ler içeriyor
        const prayers = PRAYER_NAMES.map(p => {
            const timeStr = data[p.name];
            if (!timeStr) return null;

            const [hours, minutes] = timeStr.split(':').map(Number);
            const prayerDate = new Date(date);
            prayerDate.setHours(hours, minutes, 0, 0);

            return new PrayerTime(p.name, p.nameEn, prayerDate);
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
        // Tüm vakitler geçtiyse null dön (yarın için yeni veri gerekli)
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

    // Belirli vakti isimle bul
    getPrayerByName(name) {
        return this._prayers.find(p => p.name === name || p.nameEn === name);
    }
}
