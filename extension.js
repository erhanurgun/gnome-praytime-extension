import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { PanelButton } from './src/presentation/PanelButton.js';
import { NotificationManager } from './src/presentation/NotificationManager.js';
import { PrayerTimeService } from './src/application/PrayerTimeService.js';

// Ana extension sınıfı
export default class PraytimeExtension extends Extension {
    enable() {
        console.log('[Praytime] Extension etkinleştiriliyor...');

        this._isEnabled = true;
        this._settings = this.getSettings();
        this._notificationManager = new NotificationManager(this._settings);

        // Panel butonu oluştur
        this._panelButton = new PanelButton(this);

        // Servis oluştur ve callback'leri bağla
        this._service = new PrayerTimeService(
            this._settings,
            () => this._onUpdate(),
            (title, body) => this._onNotification(title, body)
        );

        // Panele ekle
        const position = this._settings.get_string('panel-position');
        Main.panel.addToStatusArea('praytime-indicator', this._panelButton, 0, position);

        // Servisi başlat
        this._service.start();

        // Ayar değişikliklerini dinle
        this._settingsChangedId = this._settings.connect('changed', (settings, key) => {
            this._onSettingsChanged(key);
        });

        console.log('[Praytime] Extension etkinleştirildi');
    }

    disable() {
        console.log('[Praytime] Extension devre dışı bırakılıyor...');

        this._isEnabled = false;

        // Ayar dinleyicisini kaldır
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        // Servisi durdur
        if (this._service) {
            this._service.stop();
            this._service = null;
        }

        // Bildirim yöneticisini temizle
        if (this._notificationManager) {
            this._notificationManager.destroy();
            this._notificationManager = null;
        }

        // Panel butonunu kaldır
        if (this._panelButton) {
            this._panelButton.destroy();
            this._panelButton = null;
        }

        this._settings = null;

        console.log('[Praytime] Extension devre dışı bırakıldı');
    }

    // UI güncelleme callback'i
    _onUpdate() {
        if (this._panelButton && this._service) {
            this._panelButton.update(this._service);
        }
    }

    // Bildirim callback'i
    _onNotification(title, body) {
        if (this._notificationManager) {
            this._notificationManager.show(title, body);
        }
    }

    // Panel konumunu değiştir
    _repositionPanel() {
        const newPosition = this._settings.get_string('panel-position');

        // Eski paneli kaldır
        if (this._panelButton) {
            this._panelButton.destroy();
            this._panelButton = null;
        }

        // Yeni panel oluştur ve ekle
        this._panelButton = new PanelButton(this);
        Main.panel.addToStatusArea('praytime-indicator', this._panelButton, 0, newPosition);

        // UI güncelle
        if (this._service) {
            this._panelButton.update(this._service);
        }

        console.log(`[Praytime] Panel konumu değiştirildi: ${newPosition}`);
    }

    // Ayar değişikliği - race condition korumalı
    async _onSettingsChanged(key) {
        // Extension disable edilmişse işlem yapma
        if (!this._isEnabled) return;

        // Panel konumu değişikliği - anında uygula
        if (key === 'panel-position') {
            this._repositionPanel();
            return;
        }

        // Görünüm ayarları değişikliği - UI güncelle
        if (['display-mode', 'show-prayer-name', 'show-prayer-time', 'show-countdown', 'countdown-threshold-minutes'].includes(key)) {
            this._onUpdate();
            return;
        }

        // Konum değiştiğinde servisi yeniden başlat
        if (['location-id', 'city-name', 'region-name'].includes(key)) {
            // Servis null kontrolü
            if (!this._service) return;

            this._service.stop();

            // Async işlem öncesi tekrar kontrol
            if (!this._isEnabled || !this._service) return;

            try {
                await this._service.start();
            } catch (error) {
                console.error(`[Praytime] Servis yeniden başlatılamadı: ${error.message}`);
            }
        }
    }
}
