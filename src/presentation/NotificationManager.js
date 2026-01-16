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
        console.log(`[Praytime] Bildirim gösterildi: ${title}`);

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
                console.log('[Praytime] Ses çalar bulunamadı (pw-play, paplay, aplay)');
                return;
            }

            // Önce proje içi ses dosyasını dene
            const soundPath = this._findSoundFile();
            if (!soundPath) {
                console.log('[Praytime] Ses dosyası bulunamadı');
                return;
            }

            // Dosya yolunu tırnak içine al (boşluk içeren yollar için)
            const command = `${player} "${soundPath}"`;
            GLib.spawn_command_line_async(command);
            console.log(`[Praytime] Bildirim sesi çalındı: ${player} -> ${soundPath}`);
        } catch (error) {
            console.log(`[Praytime] Ses çalma hatası: ${error.message}`);
        }
    }

    _findSoundPlayer() {
        // Önbelleğe alınmış çalar varsa kullan
        if (this._soundPlayer) {
            return this._soundPlayer;
        }

        // Mevcut ses çalarları kontrol et
        for (const player of SOUND_PLAYERS) {
            const [success] = GLib.spawn_command_line_sync(`which ${player}`);
            if (success) {
                this._soundPlayer = player;
                console.log(`[Praytime] Ses çalar bulundu: ${player}`);
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
            console.log(`[Praytime] Proje ses dosyası bulunamadı: ${customSoundPath}`);
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
        this._extensionPath = null;
        this._soundPlayer = null;
    }
}
