import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { PRAYER_NAMES, APP_VERSION, APP_DEVELOPER, APP_WEBSITE } from '../config/constants.js';
import { StyleHelper } from './helpers/StyleHelper.js';

let _ = (s) => s;

export const PanelButton = GObject.registerClass(
class PanelButton extends PanelMenu.Button {
    _init(extension, gettext) {
        super._init(0.5, 'praytime-indicator');

        this._extension = extension;
        this._prayerItems = [];
        this._settingsHandlerId = null;

        if (gettext) _ = gettext;

        this._buildPanel();
        this._buildMenu();
    }

    _buildPanel() {
        const box = new St.BoxLayout({
            style_class: 'panel-status-menu-box praytime-panel-box',
        });

        const iconPath = `${this._extension.path}/icons/mosque-symbolic.svg`;
        const gicon = Gio.icon_new_for_string(iconPath);
        this._icon = new St.Icon({
            gicon: gicon,
            style_class: 'system-status-icon praytime-icon',
            icon_size: 16,
        });

        this._label = new St.Label({
            text: _('Yükleniyor...'),
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'praytime-label',
        });

        box.add_child(this._icon);
        box.add_child(this._label);
        this.add_child(box);
    }

    _buildMenu() {
        this._headerItem = new PopupMenu.PopupMenuItem(_('Namaz Vakitleri'), {
            reactive: false,
            style_class: 'praytime-header',
        });
        this.menu.addMenuItem(this._headerItem);

        this._locationItem = new PopupMenu.PopupMenuItem(`${_('Konum')}: --`, {
            reactive: false,
            style_class: 'praytime-location',
        });
        this.menu.addMenuItem(this._locationItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._prayerSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._prayerSection);

        for (const p of PRAYER_NAMES) {
            const displayName = _(p.name);
            const item = new PopupMenu.PopupMenuItem(`--:-- - ${displayName}`, {
                reactive: false,
            });
            this._prayerItems.push({ id: p.id, name: displayName, item });
            this._prayerSection.addMenuItem(item);
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const refreshItem = new PopupMenu.PopupMenuItem(_('Yenile'));
        this._refreshItem = refreshItem;
        this._refreshHandlerId = refreshItem.connect('activate', () => {
            this._extension.refreshService();
        });
        this.menu.addMenuItem(refreshItem);

        const settingsItem = new PopupMenu.PopupMenuItem(_('Ayarlar'));
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
            this._label.set_text(_('Hata'));
            return;
        }

        const nextPrayer = service.getNextPrayer();
        const schedule = service.schedule;
        const location = service.location;

        if (!schedule) {
            this._label.set_text(_('Bağlantı hatası'));
            this._locationItem.label.set_text(`${_('Konum')}: ${_('Yüklenemedi')}`);
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

        if (showIcon) {
            this._icon.show();
        } else {
            this._icon.hide();
        }

        if (!showName && !showTime && !showCountdown) {
            if (!showIcon) {
                this._label.set_text(nextPrayer.timeString);
                this._label.show();
            } else {
                this._label.hide();
            }
            return;
        }

        this._label.show();

        const parts = [];
        if (showName) parts.push(nextPrayer.name);
        if (showTime) parts.push(nextPrayer.timeString);

        let labelText = parts.join(' ') || '';

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
            this._locationItem.label.set_text(`${_('Konum')}: ${location.cityName || location.toString()}`);
        }
    }

    // id bazlı prayer tracking
    _updatePrayerList(schedule, nextPrayer) {
        const scheduleIds = schedule.prayers.map(p => p.id);
        const currentIds = this._prayerItems.map(pi => pi.id);

        if (scheduleIds.length !== currentIds.length ||
            !scheduleIds.every((id, i) => id === currentIds[i])) {
            this._rebuildPrayerItems(schedule);
        }

        const currentPrayer = schedule.getCurrentPrayer();

        for (const { id, item } of this._prayerItems) {
            const prayer = schedule.getPrayerById(id);

            if (prayer) {
                item.label.set_text(`${prayer.timeString} - ${prayer.name}`);

                StyleHelper.updateStyles(item, {
                    'praytime-active': currentPrayer?.id === id,
                    'praytime-next': nextPrayer?.id === id
                });
            }
        }
    }

    _rebuildPrayerItems(schedule) {
        this._prayerSection.removeAll();
        this._prayerItems = [];
        for (const prayer of schedule.prayers) {
            const item = new PopupMenu.PopupMenuItem(`${prayer.timeString} - ${prayer.name}`, {
                reactive: false,
            });
            this._prayerItems.push({ id: prayer.id, name: prayer.name, item });
            this._prayerSection.addMenuItem(item);
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
        if (this._refreshItem && this._refreshHandlerId) {
            this._refreshItem.disconnect(this._refreshHandlerId);
            this._refreshHandlerId = null;
        }

        if (this._settingsItem && this._settingsHandlerId) {
            this._settingsItem.disconnect(this._settingsHandlerId);
            this._settingsHandlerId = null;
        }

        if (this._versionItem && this._versionHandlerId) {
            this._versionItem.disconnect(this._versionHandlerId);
            this._versionHandlerId = null;
        }

        if (this._prayerSection) {
            this._prayerSection.removeAll();
        }
        this._prayerItems = [];
        super.destroy();
    }
});
