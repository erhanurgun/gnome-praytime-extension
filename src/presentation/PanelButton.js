import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { getPrayerNamesList, APP_VERSION, APP_DEVELOPER, APP_WEBSITE } from '../config/constants.js';
import { StyleHelper } from './helpers/StyleHelper.js';

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

    _buildPanel() {
        const box = new St.BoxLayout({
            style_class: 'panel-status-menu-box praytime-panel-box',
        });

        // İkon oluştur
        const iconPath = `${this._extension.path}/icons/mosque-symbolic.svg`;
        const gicon = Gio.icon_new_for_string(iconPath);
        this._icon = new St.Icon({
            gicon: gicon,
            style_class: 'system-status-icon praytime-icon',
            icon_size: 16,
        });

        this._label = new St.Label({
            text: 'Yükleniyor...',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'praytime-label',
        });

        box.add_child(this._icon);
        box.add_child(this._label);
        this.add_child(box);
    }

    _buildMenu() {
        this._headerItem = new PopupMenu.PopupMenuItem('Namaz Vakitleri', {
            reactive: false,
            style_class: 'praytime-header',
        });
        this.menu.addMenuItem(this._headerItem);

        this._locationItem = new PopupMenu.PopupMenuItem('Konum: --', {
            reactive: false,
            style_class: 'praytime-location',
        });
        this.menu.addMenuItem(this._locationItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const prayerNames = getPrayerNamesList();
        for (const name of prayerNames) {
            const item = new PopupMenu.PopupMenuItem(`--:-- - ${name}`, {
                reactive: false,
            });
            this._prayerItems.push({ name, item });
            this.menu.addMenuItem(item);
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const settingsItem = new PopupMenu.PopupMenuItem('Ayarlar');
        this._settingsItem = settingsItem;
        this._settingsHandlerId = settingsItem.connect('activate', () => {
            this._extension.openPreferences();
        });
        this.menu.addMenuItem(settingsItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const versionItem = new PopupMenu.PopupMenuItem(`v${APP_VERSION} | ${APP_DEVELOPER}`, {
            style_class: 'praytime-version',
        });
        this._versionItem = versionItem;
        this._versionHandlerId = versionItem.connect('activate', () => {
            GLib.spawn_command_line_async(`xdg-open ${APP_WEBSITE}`);
        });
        this.menu.addMenuItem(versionItem);
    }

    update(service) {
        if (!service) {
            this._label.set_text('Hata');
            return;
        }

        const nextPrayer = service.getNextPrayer();
        const schedule = service.schedule;
        const location = service.location;

        if (!schedule) {
            this._label.set_text('Bağlantı hatası');
            this._locationItem.label.set_text('Konum: Yüklenemedi');
            return;
        }

        const settings = this._extension.getSettings();
        const displayOptions = {
            showIcon: settings.get_boolean('show-icon'),
            showName: settings.get_boolean('show-prayer-name'),
            showTime: settings.get_boolean('show-prayer-time'),
            showCountdown: settings.get_boolean('show-countdown'),
            thresholdMinutes: settings.get_int('countdown-threshold-minutes'),
        };

        this._updatePanelLabel(nextPrayer, displayOptions);
        this._updateLocation(location);
        this._updatePrayerList(schedule, nextPrayer);
    }

    _updatePanelLabel(nextPrayer, options) {
        if (!nextPrayer) {
            this._label.set_text('--:--');
            this._icon.hide();
            this._label.show();
            return;
        }

        const { showIcon, showName, showTime, showCountdown, thresholdMinutes } = options;

        // İkon görünürlüğü
        if (showIcon) {
            this._icon.show();
        } else {
            this._icon.hide();
        }

        // Metin görünürlüğü - en az biri açıksa label göster
        if (!showName && !showTime && !showCountdown) {
            // Hiçbiri açık değilse ve ikon da kapalıysa en azından saati göster
            if (!showIcon) {
                this._label.set_text(nextPrayer.timeString);
                this._label.show();
            } else {
                this._label.hide();
            }
            return;
        }

        this._label.show();

        // Metin oluştur
        const parts = [];
        if (showName) parts.push(nextPrayer.name);
        if (showTime) parts.push(nextPrayer.timeString);

        let labelText = parts.join(' ') || '';

        // Geri sayım ekle
        if (showCountdown) {
            const remainingSeconds = nextPrayer.getSecondsUntil();
            const remainingMinutes = Math.floor(remainingSeconds / 60);

            if (remainingMinutes <= thresholdMinutes) {
                const countdown = this._formatCountdown(remainingSeconds);
                labelText = labelText ? `${labelText} (${countdown})` : countdown;
            }
        }

        this._label.set_text(labelText || nextPrayer.timeString);
    }

    _updateLocation(location) {
        if (location) {
            this._locationItem.label.set_text(`Konum: ${location.cityName || location.toString()}`);
        }
    }

    _updatePrayerList(schedule, nextPrayer) {
        const currentPrayer = schedule.getCurrentPrayer();

        for (const { name, item } of this._prayerItems) {
            const prayer = schedule.getPrayerByName(name);

            if (prayer) {
                item.label.set_text(`${prayer.timeString} - ${name}`);

                StyleHelper.updateStyles(item, {
                    'praytime-active': currentPrayer?.name === name,
                    'praytime-next': nextPrayer?.name === name
                });
            }
        }
    }

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
        if (this._settingsItem && this._settingsHandlerId) {
            this._settingsItem.disconnect(this._settingsHandlerId);
            this._settingsHandlerId = null;
        }

        if (this._versionItem && this._versionHandlerId) {
            this._versionItem.disconnect(this._versionHandlerId);
            this._versionHandlerId = null;
        }

        this._prayerItems = [];
        super.destroy();
    }
});
