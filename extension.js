import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { ServiceFactory } from './src/factory.js';

export default class PraytimeExtension extends Extension {
    enable() {
        console.log('[Praytime] Extension etkinleştiriliyor...');

        this._isEnabled = true;
        this._settings = this.getSettings();

        this._factory = new ServiceFactory(this._settings, this);

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

        console.log('[Praytime] Extension etkinleştirildi');
    }

    disable() {
        console.log('[Praytime] Extension devre dışı bırakılıyor...');

        this._isEnabled = false;
        this._disconnectSettings();

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

        console.log('[Praytime] Extension devre dışı bırakıldı');
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

        const handlers = {
            // Görünüm ayarları
            'panel-position': () => this._repositionPanel(),
            'display-mode': () => this._onUpdate(),
            'show-prayer-name': () => this._onUpdate(),
            'show-prayer-time': () => this._onUpdate(),
            'show-countdown': () => this._onUpdate(),
            'countdown-threshold-minutes': () => this._onUpdate(),
            // Konum ayarları
            'location-id': () => this._restartService(),
            'city-name': () => this._restartService(),
            'region-name': () => this._restartService(),
            // Bildirim ayarları
            'notifications-enabled': () => this._rescheduleNotifications(),
            'notify-before-minutes': () => this._rescheduleNotifications(),
            'notify-on-time': () => this._rescheduleNotifications(),
        };

        handlers[key]?.();
    }

    _rescheduleNotifications() {
        this._service?.rescheduleNotifications();
    }

    async _restartService() {
        if (!this._service) return;

        this._service.stop();
        if (!this._isEnabled) return;

        try {
            await this._service.start();
        } catch (error) {
            console.error(`[Praytime] Servis yeniden başlatılamadı: ${error.message}`);
        }
    }

    _repositionPanel() {
        const newPosition = this._settings.get_string('panel-position');

        if (this._panelButton) {
            Main.panel.statusArea['praytime-indicator'] = null;
            this._panelButton.destroy();
            this._panelButton = null;
        }

        GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            if (!this._isEnabled) return GLib.SOURCE_REMOVE;

            this._panelButton = this._factory.createPanelButton();
            Main.panel.addToStatusArea('praytime-indicator', this._panelButton, 0, newPosition);

            if (this._service) {
                this._panelButton.update(this._service);
            }

            console.log(`[Praytime] Panel konumu değiştirildi: ${newPosition}`);
            return GLib.SOURCE_REMOVE;
        });
    }

    _onUpdate() {
        this._panelButton?.update(this._service);
    }

    _onNotification(title, body) {
        this._notificationManager?.show(title, body);
    }
}
