import { GLibTimerAdapter } from './infrastructure/timer/GLibTimerAdapter.js';
import { PrayerTimesApiClient } from './infrastructure/api/PrayerTimesApiClient.js';
import { LocationProvider } from './infrastructure/location/LocationProvider.js';
import { TimerManager } from './application/TimerManager.js';
import { NotificationScheduler } from './application/NotificationScheduler.js';
import { PrayerTimeService } from './application/PrayerTimeService.js';
import { NotificationManager } from './presentation/NotificationManager.js';
import { PanelButton } from './presentation/PanelButton.js';

export class ServiceFactory {
    constructor(settings, extension) {
        this._settings = settings;
        this._extension = extension;
        this._instances = new Map();
    }

    _getOrCreate(key, creator) {
        if (!this._instances.has(key)) {
            this._instances.set(key, creator());
        }
        return this._instances.get(key);
    }

    createTimerAdapter() {
        return this._getOrCreate('timerAdapter', () => new GLibTimerAdapter());
    }

    createApiClient() {
        return this._getOrCreate('apiClient', () => new PrayerTimesApiClient());
    }

    createLocationProvider() {
        return this._getOrCreate('locationProvider', () =>
            new LocationProvider(this._settings)
        );
    }

    createTimerManager() {
        return this._getOrCreate('timerManager', () =>
            new TimerManager(this.createTimerAdapter())
        );
    }

    createNotificationScheduler() {
        return this._getOrCreate('notificationScheduler', () =>
            new NotificationScheduler({
                timerAdapter: this.createTimerAdapter(),
                settings: this._settings
            })
        );
    }

    createNotificationManager() {
        return this._getOrCreate('notificationManager', () =>
            new NotificationManager(this._settings)
        );
    }

    createPrayerTimeService(onUpdate, onNotification) {
        return new PrayerTimeService({
            apiClient: this.createApiClient(),
            locationProvider: this.createLocationProvider(),
            timerManager: this.createTimerManager(),
            notificationScheduler: this.createNotificationScheduler(),
            onUpdate,
            onNotification
        });
    }

    createPanelButton() {
        return new PanelButton(this._extension);
    }

    destroyAll() {
        for (const instance of this._instances.values()) {
            if (typeof instance.destroy === 'function') {
                instance.destroy();
            }
        }
        this._instances.clear();
    }
}
