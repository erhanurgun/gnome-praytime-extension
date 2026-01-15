import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

// Bildirim yöneticisi
export class NotificationManager {
    constructor(settings) {
        this._settings = settings;
        this._source = null;
    }

    // Normal bildirim
    show(title, body) {
        this._showNotification(title, body, null);
    }

    // Acil bildirim
    showUrgent(title, body) {
        this._showNotification(title, body, MessageTray.Urgency.CRITICAL);
    }

    // Ortak bildirim metodu - DRY prensibi
    _showNotification(title, body, urgency) {
        this._ensureSource();

        if (this._settings.get_boolean('notification-sound')) {
            this._playSound();
        }

        const notificationOptions = {
            source: this._source,
            title: title,
            body: body,
            isTransient: false,
        };

        if (urgency !== null) {
            notificationOptions.urgency = urgency;
        }

        const notification = new MessageTray.Notification(notificationOptions);
        this._source.addNotification(notification);
    }

    // Bildirim sesi çal
    _playSound() {
        try {
            // Freedesktop standart bildirim sesi
            const soundPaths = [
                '/usr/share/sounds/freedesktop/stereo/message.oga',
                '/usr/share/sounds/gnome/default/alerts/glass.ogg',
                '/usr/share/sounds/ubuntu/stereo/message.ogg',
            ];

            for (const soundPath of soundPaths) {
                const soundFile = Gio.File.new_for_path(soundPath);
                if (soundFile.query_exists(null)) {
                    GLib.spawn_command_line_async(`paplay ${soundPath}`);
                    return;
                }
            }

            console.log('[Praytime] Bildirim sesi dosyası bulunamadı');
        } catch (error) {
            console.log(`[Praytime] Ses çalma hatası: ${error.message}`);
        }
    }

    // Source oluştur
    _ensureSource() {
        if (this._source && !this._source.destroying) return;

        this._source = new MessageTray.Source({
            title: 'Praytime',
            iconName: 'preferences-system-time-symbolic',
        });

        Main.messageTray.add(this._source);
    }

    destroy() {
        if (this._source) {
            this._source.destroy();
            this._source = null;
        }
        this._settings = null;
    }
}
