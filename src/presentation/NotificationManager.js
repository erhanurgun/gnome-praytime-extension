import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

// Bildirim yöneticisi
export class NotificationManager {
    constructor() {
        this._source = null;
    }

    // Bildirim goster
    show(title, body) {
        this._ensureSource();
        this._playSound();

        const notification = new MessageTray.Notification({
            source: this._source,
            title: title,
            body: body,
            isTransient: false,
        });

        this._source.addNotification(notification);
    }

    // Acil bildirim
    showUrgent(title, body) {
        this._ensureSource();
        this._playSound();

        const notification = new MessageTray.Notification({
            source: this._source,
            title: title,
            body: body,
            isTransient: false,
            urgency: MessageTray.Urgency.CRITICAL,
        });

        this._source.addNotification(notification);
    }

    // Bildirim sesi çal
    _playSound() {
        try {
            const soundFile = Gio.File.new_for_uri(
                'resource:///org/gnome/shell/theme/sounds/message.oga'
            );

            if (soundFile.query_exists(null)) {
                GLib.spawn_command_line_async(
                    `paplay ${soundFile.get_path()}`
                );
            } else {
                // Alternatif sistem sesi
                GLib.spawn_command_line_async(
                    'paplay /usr/share/sounds/freedesktop/stereo/message.oga'
                );
            }
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
    }
}
