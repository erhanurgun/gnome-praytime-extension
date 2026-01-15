import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { getPrayerNamesList, APP_VERSION, APP_DEVELOPER, APP_WEBSITE } from '../config/constants.js';

// Panel üzerindeki namaz vakti butonu
export const PanelButton = GObject.registerClass(
class PanelButton extends PanelMenu.Button {
    _init(extension) {
        super._init(0.5, 'praytime-indicator');

        this._extension = extension;
        this._prayerItems = [];
        this._settingsHandlerId = null;

        this._buildPanel();
        this._buildMenu();
    }

    // Panel görünümü
    _buildPanel() {
        const box = new St.BoxLayout({
            style_class: 'panel-status-menu-box praytime-panel-box',
        });

        // Ana label (sonraki vakit + geri sayım)
        this._label = new St.Label({
            text: 'Yükleniyor...',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'praytime-label',
        });

        box.add_child(this._label);
        this.add_child(box);
    }

    // Popup menü
    _buildMenu() {
        // Başlık
        this._headerItem = new PopupMenu.PopupMenuItem('Namaz Vakitleri', {
            reactive: false,
            style_class: 'praytime-header',
        });
        this.menu.addMenuItem(this._headerItem);

        // Konum bilgisi
        this._locationItem = new PopupMenu.PopupMenuItem('Konum: --', {
            reactive: false,
            style_class: 'praytime-location',
        });
        this.menu.addMenuItem(this._locationItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Vakit satırları - constants'tan al
        const prayerNames = getPrayerNamesList();
        for (const name of prayerNames) {
            const item = new PopupMenu.PopupMenuItem(`--:-- - ${name}`, {
                reactive: false,
            });
            this._prayerItems.push({ name, item });
            this.menu.addMenuItem(item);
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Ayarlar butonu - handler ID'sini kaydet
        const settingsItem = new PopupMenu.PopupMenuItem('Ayarlar');
        this._settingsItem = settingsItem;
        this._settingsHandlerId = settingsItem.connect('activate', () => {
            this._extension.openPreferences();
        });
        this.menu.addMenuItem(settingsItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Sürüm ve geliştirici bilgisi
        const versionItem = new PopupMenu.PopupMenuItem(`v${APP_VERSION} | ${APP_DEVELOPER}`, {
            style_class: 'praytime-version',
        });
        this._versionItem = versionItem;
        this._versionHandlerId = versionItem.connect('activate', () => {
            GLib.spawn_command_line_async(`xdg-open ${APP_WEBSITE}`);
        });
        this.menu.addMenuItem(versionItem);
    }

    // UI güncelle
    update(service) {
        if (!service) {
            this._label.set_text('Hata');
            return;
        }

        const nextPrayer = service.getNextPrayer();
        const schedule = service.schedule;
        const location = service.location;

        // Schedule null ise bağlantı hatası veya yükleme durumu
        if (!schedule) {
            this._label.set_text('Bağlantı hatası');
            this._locationItem.label.set_text('Konum: Yüklenemedi');
            return;
        }
        const settings = this._extension.getSettings();
        const showCountdown = settings.get_boolean('show-countdown');
        const thresholdMinutes = settings.get_int('countdown-threshold-minutes');

        // Panel label
        if (nextPrayer) {
            let labelText = `${nextPrayer.name} ${nextPrayer.timeString}`;

            if (showCountdown) {
                const remainingSeconds = nextPrayer.getSecondsUntil();
                const remainingMinutes = Math.floor(remainingSeconds / 60);

                // Sadece eşik değerinin altındaysa geri sayımı göster
                if (remainingMinutes <= thresholdMinutes) {
                    labelText += ` (${this._formatCountdown(remainingSeconds)})`;
                }
            }

            this._label.set_text(labelText);
        } else {
            this._label.set_text('--:--');
        }

        // Konum
        if (location) {
            this._locationItem.label.set_text(`Konum: ${location.cityName || location.toString()}`);
        }

        // Vakit listesi
        if (schedule) {
            const currentPrayer = schedule.getCurrentPrayer();

            for (const { name, item } of this._prayerItems) {
                const prayer = schedule.getPrayerByName(name);

                if (prayer) {
                    item.label.set_text(`${prayer.timeString} - ${name}`);

                    // Aktif vakti vurgula
                    if (currentPrayer && currentPrayer.name === name) {
                        item.add_style_class_name('praytime-active');
                    } else {
                        item.remove_style_class_name('praytime-active');
                    }

                    // Sonraki vakti vurgula
                    if (nextPrayer && nextPrayer.name === name) {
                        item.add_style_class_name('praytime-next');
                    } else {
                        item.remove_style_class_name('praytime-next');
                    }
                }
            }
        }
    }

    // Geri sayım formatla
    _formatCountdown(seconds) {
        if (seconds <= 0) return '00:00';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    destroy() {
        // Settings handler'ını temizle
        if (this._settingsItem && this._settingsHandlerId) {
            this._settingsItem.disconnect(this._settingsHandlerId);
            this._settingsHandlerId = null;
        }
        // Version handler'ını temizle
        if (this._versionItem && this._versionHandlerId) {
            this._versionItem.disconnect(this._versionHandlerId);
            this._versionHandlerId = null;
        }
        this._prayerItems = [];
        super.destroy();
    }
});
