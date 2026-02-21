// Tek bir namaz vaktini temsil eden model
export class PrayerTime {
    constructor(id, name, nameEn, time) {
        this._id = id;
        this._name = name;
        this._nameEn = nameEn;
        this._time = time instanceof Date ? time : new Date(time);
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get nameEn() {
        return this._nameEn;
    }

    get time() {
        return this._time;
    }

    get timeString() {
        return this._formatTime(this._time);
    }

    // Vakte kalan saniye
    getSecondsUntil(fromDate = new Date()) {
        return Math.floor((this._time.getTime() - fromDate.getTime()) / 1000);
    }

    // Vakit geçti mi
    isPassed(fromDate = new Date()) {
        return fromDate >= this._time;
    }

    _formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}
