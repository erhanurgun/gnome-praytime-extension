import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

const SOUND_PATHS = [
    '/usr/share/sounds/freedesktop/stereo/message.oga',
    '/usr/share/sounds/gnome/default/alerts/glass.ogg',
    '/usr/share/sounds/ubuntu/stereo/message.ogg',
];

export class NotificationManager {
    constructor(settings) {
        this._settings = settings;
        this._source = null;
    }

    show(title, body) {
        this._ensureSource();

        if (this._settings.get_boolean('notification-sound')) {
            this._playSound();
        }

        const notification = new MessageTray.Notification({
            source: this._source,
            title,
            body,
            isTransient: false,
        });

        this._source.addNotification(notification);
    }

    _playSound() {
        try {
            for (const soundPath of SOUND_PATHS) {
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
