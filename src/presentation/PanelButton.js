import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const PRAYER_NAMES = ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];
const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// Panel üzerindeki namaz vakti butonu
export const PanelButton = GObject.registerClass(
class PanelButton extends PanelMenu.Button {
    _init(extension) {
        super._init(0.5, 'praytime-indicator');

        this._extension = extension;
        this._settings = extension.getSettings();
        this._timelineItems = [];

        this._buildPanel();
        this._buildMenu();
    }

    // Extension dizininden ikon yolu al
    _getIconPath() {
        const extensionPath = this._extension.path;
        return `${extensionPath}/icons/mosque-symbolic.svg`;
    }

    // Panel görünümü
    _buildPanel() {
        const box = new St.BoxLayout({
            style_class: 'panel-status-menu-box praytime-panel-box',
        });

        // Cami ikonu
        const iconPath = this._getIconPath();
        const iconFile = Gio.File.new_for_path(iconPath);

        if (iconFile.query_exists(null)) {
            this._icon = new St.Icon({
                gicon: Gio.FileIcon.new(iconFile),
                style_class: 'system-status-icon praytime-icon',
            });
        } else {
            this._icon = new St.Icon({
                icon_name: 'preferences-system-time-symbolic',
                style_class: 'system-status-icon praytime-icon',
            });
        }
        box.add_child(this._icon);

        // Ana label
        this._label = new St.Label({
            text: 'Yükleniyor...',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'praytime-label',
        });
        box.add_child(this._label);

        this.add_child(box);
    }

    // Popup menü - Timeline tasarımı
    _buildMenu() {
        // Header bölümü
        const headerItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            style_class: 'praytime-menu-header',
        });

        const headerBox = new St.BoxLayout({
            vertical: true,
        });

        this._titleLabel = new St.Label({
            text: 'Namaz Vakitleri',
            style_class: 'praytime-title',
        });
        headerBox.add_child(this._titleLabel);

        this._locationLabel = new St.Label({
            text: 'Konum: --',
            style_class: 'praytime-subtitle',
        });
        headerBox.add_child(this._locationLabel);

        this._dateLabel = new St.Label({
            text: this._formatDate(new Date()),
            style_class: 'praytime-date',
        });
        headerBox.add_child(this._dateLabel);

        headerItem.add_child(headerBox);
        this.menu.addMenuItem(headerItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Timeline bölümü
        for (let i = 0; i < PRAYER_NAMES.length; i++) {
            const name = PRAYER_NAMES[i];
            const isLast = (i === PRAYER_NAMES.length - 1);
            const item = this._createTimelineItem(name, isLast);
            this._timelineItems.push(item);
            this.menu.addMenuItem(item.menuItem);
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Ayarlar butonu
        const settingsItem = new PopupMenu.PopupMenuItem('Ayarlar', {
            style_class: 'praytime-settings-item',
        });
        settingsItem.connect('activate', () => {
            this._extension.openPreferences();
        });
        this.menu.addMenuItem(settingsItem);
    }

    // Timeline item oluştur
    _createTimelineItem(name, isLast) {
        const menuItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            style_class: 'praytime-timeline-item',
        });

        const box = new St.BoxLayout({
            style_class: 'praytime-timeline-item-box',
        });

        // Sol: Dot ve çizgi
        const statusBox = new St.BoxLayout({
            vertical: true,
            style_class: 'praytime-timeline-status',
        });

        const dot = new St.Widget({
            style_class: 'praytime-timeline-dot',
        });
        statusBox.add_child(dot);

        if (!isLast) {
            const line = new St.Widget({
                style_class: 'praytime-timeline-line',
            });
            statusBox.add_child(line);
        }

        box.add_child(statusBox);

        // Orta: Vakit adı
        const nameLabel = new St.Label({
            text: name,
            style_class: 'praytime-timeline-name',
            x_expand: true,
        });
        box.add_child(nameLabel);

        // Sağ: Saat
        const timeLabel = new St.Label({
            text: '--:--',
            style_class: 'praytime-timeline-time',
        });
        box.add_child(timeLabel);

        // Sağ: Badge (durum)
        const badge = new St.Label({
            text: '',
            style_class: 'praytime-timeline-badge',
        });
        box.add_child(badge);

        menuItem.add_child(box);

        return {
            menuItem,
            name,
            dot,
            line: isLast ? null : statusBox.get_child_at_index(1),
            nameLabel,
            timeLabel,
            badge,
            isLast,
        };
    }

    // Tarih formatla
    _formatDate(date) {
        const day = date.getDate();
        const month = MONTHS[date.getMonth()];
        const year = date.getFullYear();
        const weekday = WEEKDAYS[date.getDay()];
        return `${day} ${month} ${year} ${weekday}`;
    }

    // UI güncelle
    update(service) {
        if (!service) {
            this._label.set_text('Hata');
            return;
        }

        const schedule = service.schedule;
        const location = service.location;
        const nextPrayer = service.getNextPrayer();
        const currentPrayer = schedule ? schedule.getCurrentPrayer() : null;

        // Ayarları oku
        const displayMode = this._settings.get_string('display-mode');
        const showName = this._settings.get_boolean('show-prayer-name');
        const showTime = this._settings.get_boolean('show-prayer-time');
        const showCountdown = this._settings.get_boolean('show-countdown');
        const thresholdMinutes = this._settings.get_int('countdown-threshold-minutes');

        // Panel label güncelle
        this._updatePanelLabel(nextPrayer, displayMode, showName, showTime, showCountdown, thresholdMinutes);

        // İkon görünürlüğü
        this._icon.visible = (displayMode !== 'text');
        this._label.visible = (displayMode !== 'icon');

        // Konum güncelle
        if (location) {
            const locationText = location.regionName && location.regionName !== location.cityName
                ? `${location.cityName}/${location.regionName}`
                : location.cityName;
            this._locationLabel.set_text(`Konum: ${locationText}`);
        }

        // Tarih güncelle
        this._dateLabel.set_text(this._formatDate(new Date()));

        // Timeline güncelle
        if (schedule) {
            this._updateTimeline(schedule, currentPrayer, nextPrayer);
        }
    }

    // Panel label güncelle
    _updatePanelLabel(nextPrayer, displayMode, showName, showTime, showCountdown, thresholdMinutes) {
        if (!nextPrayer) {
            this._label.set_text('--:--');
            return;
        }

        if (displayMode === 'icon') {
            this._label.set_text('');
            return;
        }

        let parts = [];

        if (showName) {
            parts.push(nextPrayer.name);
        }

        if (showTime) {
            parts.push(nextPrayer.timeString);
        }

        // Geri sayım kontrolü - eşik değerine göre
        if (showCountdown) {
            const remaining = nextPrayer.getSecondsUntil();
            const remainingMinutes = remaining / 60;

            if (remainingMinutes <= thresholdMinutes && remaining > 0) {
                parts.push(`(${this._formatCountdown(remaining)})`);
            }
        }

        this._label.set_text(parts.join(' ') || '--:--');
    }

    // Timeline güncelle
    _updateTimeline(schedule, currentPrayer, nextPrayer) {
        const now = new Date();

        for (const item of this._timelineItems) {
            const prayer = schedule.getPrayerByName(item.name);

            if (!prayer) continue;

            // Saat güncelle
            item.timeLabel.set_text(prayer.timeString);

            // Durumu belirle
            const isPassed = prayer.isPassed(now);
            const isCurrent = currentPrayer && currentPrayer.name === item.name;
            const isNext = nextPrayer && nextPrayer.name === item.name;

            // Stil sınıflarını temizle
            item.dot.remove_style_class_name('praytime-timeline-dot-passed');
            item.dot.remove_style_class_name('praytime-timeline-dot-current');
            item.dot.remove_style_class_name('praytime-timeline-dot-next');

            item.nameLabel.remove_style_class_name('praytime-timeline-name-passed');
            item.nameLabel.remove_style_class_name('praytime-timeline-name-current');
            item.nameLabel.remove_style_class_name('praytime-timeline-name-next');

            item.timeLabel.remove_style_class_name('praytime-timeline-time-passed');
            item.timeLabel.remove_style_class_name('praytime-timeline-time-current');

            item.badge.remove_style_class_name('praytime-timeline-badge-passed');
            item.badge.remove_style_class_name('praytime-timeline-badge-current');
            item.badge.remove_style_class_name('praytime-timeline-badge-next');

            if (item.line) {
                item.line.remove_style_class_name('praytime-timeline-line-passed');
            }

            // Yeni stiller uygula
            if (isCurrent) {
                item.dot.add_style_class_name('praytime-timeline-dot-current');
                item.nameLabel.add_style_class_name('praytime-timeline-name-current');
                item.timeLabel.add_style_class_name('praytime-timeline-time-current');
                item.badge.add_style_class_name('praytime-timeline-badge-current');
                item.badge.set_text('AKTİF');
            } else if (isNext) {
                item.dot.add_style_class_name('praytime-timeline-dot-next');
                item.nameLabel.add_style_class_name('praytime-timeline-name-next');
                item.badge.add_style_class_name('praytime-timeline-badge-next');

                const remaining = prayer.getSecondsUntil(now);
                item.badge.set_text(this._formatCountdown(remaining));
            } else if (isPassed) {
                item.dot.add_style_class_name('praytime-timeline-dot-passed');
                item.nameLabel.add_style_class_name('praytime-timeline-name-passed');
                item.timeLabel.add_style_class_name('praytime-timeline-time-passed');
                item.badge.add_style_class_name('praytime-timeline-badge-passed');
                item.badge.set_text('geçti');

                if (item.line) {
                    item.line.add_style_class_name('praytime-timeline-line-passed');
                }
            } else {
                item.badge.set_text('');
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
        this._timelineItems = [];
        super.destroy();
    }
});
