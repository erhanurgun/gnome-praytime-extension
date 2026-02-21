import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { ServiceFactory } from './src/factory.js';
import { createGettextWrapper } from './src/i18n/gettext.js';
import { LOCATION_STATUS } from './src/config/constants.js';

export default class PraytimeExtension extends Extension {
    enable() {
        console.log('[Praytime] Enabling extension...');

        this._isEnabled = true;
        this._debounceTimer = null;
        this._settings = this.getSettings();

        const _ = createGettextWrapper(this._settings);

        this._factory = new ServiceFactory(this._settings, this, _);

        this._notificationManager = this._factory.createNotificationManager();
        this._panelButton = this._factory.createPanelButton();
        this._service = this._factory.createPrayerTimeService(
            () => this._onUpdate(),
            (title, body) => this._onNotification(title, body)
        );

        const position = this._settings.get_string('panel-position');
        Main.panel.addToStatusArea('praytime-indicator', this._panelButton, 0, position);

        this._service.start();
        this._connectSettings();

        console.log('[Praytime] Extension enabled');
    }

    disable() {
        console.log('[Praytime] Disabling extension...');

        this._isEnabled = false;
        this._disconnectSettings();

        if (this._debounceTimer) {
            GLib.source_remove(this._debounceTimer);
            this._debounceTimer = null;
        }

        if (this._service) {
            this._service.destroy();
            this._service = null;
        }

        if (this._factory) {
            this._factory.destroyAll();
            this._factory = null;
        }

        if (this._panelButton) {
            this._panelButton.destroy();
            this._panelButton = null;
        }

        this._notificationManager = null;
        this._settings = null;

        console.log('[Praytime] Extension disabled');
    }

    _connectSettings() {
        this._settingsChangedId = this._settings.connect('changed', (_, key) => {
            this._handleSettingChange(key);
        });
    }

    _disconnectSettings() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
    }

    _handleSettingChange(key) {
        if (!this._isEnabled) return;

        // Validasyon status key'leri sonsuz döngü oluşturmamalı
        const IGNORED_KEYS = ['location-status', 'location-status-message'];
        if (IGNORED_KEYS.includes(key)) return;

        // Metin girişi olan ayarlar için debounce
        const DEBOUNCED_KEYS = ['city-name', 'country-name'];
        if (DEBOUNCED_KEYS.includes(key)) {
            if (this._debounceTimer) {
                GLib.source_remove(this._debounceTimer);
                this._debounceTimer = null;
            }
            this._settings.set_string('location-status', LOCATION_STATUS.UNKNOWN);
            this._settings.set_string('location-status-message', '');
            this._debounceTimer = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT, 2, () => {
                    this._debounceTimer = null;
                    this._restartService();
                    return GLib.SOURCE_REMOVE;
                }
            );
            return;
        }

        const handlers = {
            // Görünüm ayarları
            'panel-position': () => this._repositionPanel(),
            'show-icon': () => this._onUpdate(),
            'show-prayer-name': () => this._onUpdate(),
            'show-prayer-time': () => this._onUpdate(),
            'show-countdown': () => this._onUpdate(),
            'countdown-threshold-minutes': () => this._onUpdate(),
            // Konum ayarları
            'location-id': () => this._restartService(),
            'location-mode': () => this._restartService(),
            'region-name': () => this._restartService(),
            'latitude': () => this._restartService(),
            'longitude': () => this._restartService(),
            'calculation-method': () => this._restartService(),
            // Bildirim ayarları
            'notifications-enabled': () => this._rescheduleNotifications(),
            'notify-before-minutes': () => this._rescheduleNotifications(),
            'notify-on-time': () => this._rescheduleNotifications(),
            // Ek vakit ayarları
            'sahur-enabled': () => this._refreshSchedule(),
            'sahur-minutes-before': () => this._refreshSchedule(),
            'ramadan-mode': () => this._refreshSchedule(),
            'tahajjud-enabled': () => this._refreshSchedule(),
            'tahajjud-offset-minutes': () => this._refreshSchedule(),
            // Dil değişikliğinde panel ve service yeniden oluşturulur
            'language': () => this._handleLanguageChange(),
        };

        handlers[key]?.();
    }

    _rescheduleNotifications() {
        this._service?.rescheduleNotifications();
    }

    _refreshSchedule() {
        this._service?.recalculateSchedule();
    }

    async _restartService() {
        if (!this._service) return;

        this._settings.set_string('location-status', LOCATION_STATUS.UNKNOWN);
        this._settings.set_string('location-status-message', '');

        this._service.stop();
        if (!this._isEnabled) return;

        try {
            await this._service.start();
        } catch (error) {
            console.error(`[Praytime] Service restart failed: ${error.message}`);
        }
    }

    async _handleLanguageChange() {
        const newGettext = createGettextWrapper(this._settings);

        this._factory.updateGettext(newGettext);

        if (this._panelButton) {
            this._panelButton.destroy();
            this._panelButton = null;
        }

        this._panelButton = this._factory.createPanelButton();
        const position = this._settings.get_string('panel-position');
        Main.panel.addToStatusArea('praytime-indicator', this._panelButton, 0, position);

        await this._restartService();
    }

    _repositionPanel() {
        const newPosition = this._settings.get_string('panel-position');

        if (!this._panelButton) return;

        const container = this._panelButton.container;
        if (!container) return;

        const parent = container.get_parent();
        if (parent) {
            parent.remove_child(container);
        }

        const panelBox = Main.panel[`_${newPosition}Box`];
        panelBox.insert_child_at_index(container, -1);

        console.log(`[Praytime] Panel position changed: ${newPosition}`);
    }

    async refreshService() {
        if (!this._service || !this._isEnabled) return;
        try {
            await this._service.refresh();
        } catch (error) {
            console.error(`[Praytime] Manual refresh error: ${error.message}`);
        }
    }

    _onUpdate() {
        this._panelButton?.update(this._service);
    }

    _onNotification(title, body) {
        this._notificationManager?.show(title, body);
    }
}
