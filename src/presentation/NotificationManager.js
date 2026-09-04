import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

// Desteklenen ses çalarlar - öncelik sırasına göre
const SOUND_PLAYERS = ['pw-play', 'paplay', 'aplay'];

// Sistem ses dosyaları - yedek olarak kullanılır
const SYSTEM_SOUND_PATHS = [
    '/usr/share/sounds/freedesktop/stereo/message.oga',
    '/usr/share/sounds/gnome/default/alerts/glass.ogg',
    '/usr/share/sounds/ubuntu/stereo/message.ogg',
];

export class NotificationManager {
    constructor(settings, extensionPath) {
        this._settings = settings;
        this._extensionPath = extensionPath;
        this._source = null;
        this._sourceDestroyId = null;
        this._soundPlayer = null;
    }

    show(title, body) {
        this._ensureSource();

        // Önce bildirimi göster, ses hatası bildirimi engellemez
        const notification = new MessageTray.Notification({
            source: this._source,
            title,
            body,
            isTransient: false,
        });

        this._source.addNotification(notification);
        console.log(`[Praytime] Notification shown: ${title}`);

        // Ses çalma ayrı işlensin, bildirim gösterimini engellemez
        if (this._settings.get_boolean('notification-sound')) {
            this._playSound();
        }
    }

    _playSound() {
        try {
            // Önce ses çaları bul
            const player = this._findSoundPlayer();
            if (!player) {
                console.log('[Praytime] No sound player found (pw-play, paplay, aplay)');
                return;
            }

            // Önce proje içi ses dosyasını dene
            const soundPath = this._findSoundFile();
            if (!soundPath) {
                console.log('[Praytime] No sound file found');
                return;
            }

            // Argümanlar dizi olarak verilir, shell quoting'e gerek kalmaz
            Gio.Subprocess.new([player, soundPath], Gio.SubprocessFlags.NONE);
            console.log(`[Praytime] Notification sound played: ${player} -> ${soundPath}`);
        } catch (error) {
            console.log(`[Praytime] Sound playback error: ${error.message}`);
        }
    }

    _findSoundPlayer() {
        // Önbelleğe alınmış çalar varsa kullan
        if (this._soundPlayer) {
            return this._soundPlayer;
        }

        // PATH üzerinde ara: alt süreç açmaz, ana döngüyü bloklamaz
        for (const player of SOUND_PLAYERS) {
            if (GLib.find_program_in_path(player)) {
                this._soundPlayer = player;
                console.log(`[Praytime] Sound player found: ${player}`);
                return player;
            }
        }

        return null;
    }

    _findSoundFile() {
        // Önce proje içi ses dosyasını kontrol et
        if (this._extensionPath) {
            const customSoundPath = GLib.build_filenamev([this._extensionPath, 'sounds', 'sound-01.mp3']);
            const customSoundFile = Gio.File.new_for_path(customSoundPath);
            if (customSoundFile.query_exists(null)) {
                return customSoundPath;
            }
            console.log(`[Praytime] Extension sound file not found: ${customSoundPath}`);
        }

        // Sistem ses dosyalarını kontrol et
        for (const soundPath of SYSTEM_SOUND_PATHS) {
            const soundFile = Gio.File.new_for_path(soundPath);
            if (soundFile.query_exists(null)) {
                return soundPath;
            }
        }

        return null;
    }

    _ensureSource() {
        if (this._source) return;

        this._source = new MessageTray.Source({
            title: 'Praytime',
            iconName: 'preferences-system-time-symbolic',
        });

        // Shell kaynağı kendi başına yıkabilir, referans bayat kalmamalı
        this._sourceDestroyId = this._source.connect('destroy', () => {
            this._source = null;
            this._sourceDestroyId = null;
        });

        Main.messageTray.add(this._source);
    }

    destroy() {
        if (this._source) {
            if (this._sourceDestroyId) {
                this._source.disconnect(this._sourceDestroyId);
                this._sourceDestroyId = null;
            }
            this._source.destroy();
            this._source = null;
        }
        this._settings = null;
        this._extensionPath = null;
        this._soundPlayer = null;
    }
}
