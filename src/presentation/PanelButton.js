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

    _getMenuIcon(name) {
        return Gio.icon_new_for_string(
            `${this._extension.path}/icons/${name}-symbolic.svg`
        );
    }

    _getPrayerIcon(id) {
        const iconMap = {
            tahajjud: 'tahajjud', sahur: 'sahur',
            imsak: 'imsak', gunes: 'sunrise',
            ogle: 'noon', ikindi: 'afternoon',
            aksam: 'sunset', yatsi: 'night',
        };
        return this._getMenuIcon(iconMap[id] || 'mosque');
    }

    _createPrayerItem(name, icon, time) {
        const item = new PopupMenu.PopupImageMenuItem(name, icon, {
            reactive: false,
        });

        const timeLabel = new St.Label({
            text: time,
            style_class: 'praytime-time-label',
            x_expand: true,
            x_align: Clutter.ActorAlign.END,
        });
        item.add_child(timeLabel);

        return { item, timeLabel };
    }

    _buildMenu() {
        this._headerItem = new PopupMenu.PopupMenuItem(
            _('Namaz Vakitleri').toLocaleUpperCase('tr'), {
                reactive: false,
                style_class: 'praytime-header',
            }
        );
        this._headerItem.label.set({
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.menu.addMenuItem(this._headerItem);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._locationItem = new PopupMenu.PopupImageMenuItem(
            `${_('Konum')}: --`, this._getMenuIcon('location'), {
                reactive: false,
                style_class: 'praytime-location',
            }
        );
        this.menu.addMenuItem(this._locationItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._prayerSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._prayerSection);

        for (const p of PRAYER_NAMES) {
            const displayName = _(p.name);
            const { item, timeLabel } = this._createPrayerItem(
                displayName, this._getPrayerIcon(p.id), '--:--'
            );
            this._prayerItems.push({ id: p.id, name: displayName, item, timeLabel });
            this._prayerSection.addMenuItem(item);
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const actionRow = new PopupMenu.PopupBaseMenuItem({
            activate: false,
            can_focus: false,
            style_class: 'praytime-action-row',
        });

        const refreshBox = new St.BoxLayout({ x_align: Clutter.ActorAlign.CENTER, style: 'spacing: 4px;' });
        refreshBox.add_child(new St.Icon({
            gicon: this._getMenuIcon('refresh'),
            icon_size: 16,
            style_class: 'popup-menu-icon',
        }));
        refreshBox.add_child(new St.Label({ text: _('Yenile'), y_align: Clutter.ActorAlign.CENTER }));

        const refreshBtn = new St.Button({
            x_expand: true,
            style_class: 'praytime-action-button',
            reactive: true,
            can_focus: true,
            track_hover: true,
            child: refreshBox,
        });
        this._refreshHandlerId = refreshBtn.connect('clicked', () => {
            this._extension.refreshService();
            this.menu.close();
        });

        const settingsBox = new St.BoxLayout({ x_align: Clutter.ActorAlign.CENTER, style: 'spacing: 4px;' });
        settingsBox.add_child(new St.Icon({
            gicon: this._getMenuIcon('settings'),
            icon_size: 16,
            style_class: 'popup-menu-icon',
        }));
        settingsBox.add_child(new St.Label({ text: _('Ayarlar'), y_align: Clutter.ActorAlign.CENTER }));

        const settingsBtn = new St.Button({
            x_expand: true,
            style_class: 'praytime-action-button',
            reactive: true,
            can_focus: true,
            track_hover: true,
            child: settingsBox,
        });
        this._settingsHandlerId = settingsBtn.connect('clicked', () => {
            this._extension.openPreferences();
            this.menu.close();
        });

        const divider = new St.Widget({
            style_class: 'praytime-action-divider',
            y_expand: true,
        });

        // Buton hover'ı actionRow'a iletilmeli ki menü sistemi
        // diğer öğelerin (sürüm satırı vb.) hover'ını temizleyebilsin
        refreshBtn.connect('notify::hover', () => {
            if (refreshBtn.hover)
                actionRow.setActive(true);
        });
        settingsBtn.connect('notify::hover', () => {
            if (settingsBtn.hover)
                actionRow.setActive(true);
        });

        actionRow.add_child(refreshBtn);
        actionRow.add_child(divider);
        actionRow.add_child(settingsBtn);
        this._refreshBtn = refreshBtn;
        this._settingsBtn = settingsBtn;
        this.menu.addMenuItem(actionRow);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const versionItem = new PopupMenu.PopupMenuItem(`v${APP_VERSION} | ${APP_DEVELOPER}`, {
            style_class: 'praytime-version',
        });
        versionItem.label.set({
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
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

        for (const { id, item, timeLabel } of this._prayerItems) {
            const prayer = schedule.getPrayerById(id);

            if (prayer) {
                item.label.set_text(prayer.name);
                timeLabel.set_text(prayer.timeString);

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
            const { item, timeLabel } = this._createPrayerItem(
                prayer.name, this._getPrayerIcon(prayer.id), prayer.timeString
            );
            this._prayerItems.push({ id: prayer.id, name: prayer.name, item, timeLabel });
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
        if (this._refreshBtn && this._refreshHandlerId) {
            this._refreshBtn.disconnect(this._refreshHandlerId);
            this._refreshHandlerId = null;
        }

        if (this._settingsBtn && this._settingsHandlerId) {
            this._settingsBtn.disconnect(this._settingsHandlerId);
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
