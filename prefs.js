import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {
    DISPLAY_MODES,
    PANEL_POSITIONS,
    TURKEY_CITIES,
    getCityIndexById,
    getIndexFromValue,
    getValueFromIndex,
    APP_VERSION,
    APP_DEVELOPER,
    APP_WEBSITE,
} from './src/config/constants.js';

export default class PraytimePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        this._settings = this.getSettings();
        this._signalHandlers = [];

        const locationPage = new Adw.PreferencesPage({
            title: 'Konum',
            icon_name: 'find-location-symbolic',
        });
        window.add(locationPage);
        this._buildLocationPage(locationPage);

        const notificationPage = new Adw.PreferencesPage({
            title: 'Bildirimler',
            icon_name: 'preferences-system-notifications-symbolic',
        });
        window.add(notificationPage);
        this._buildNotificationPage(notificationPage);

        const displayPage = new Adw.PreferencesPage({
            title: 'Görünüm',
            icon_name: 'preferences-desktop-display-symbolic',
        });
        window.add(displayPage);
        this._buildDisplayPage(displayPage);

        const aboutPage = new Adw.PreferencesPage({
            title: 'Hakkında',
            icon_name: 'help-about-symbolic',
        });
        window.add(aboutPage);
        this._buildAboutPage(aboutPage);

        window.connect('destroy', () => {
            for (const { widget, handlerId } of this._signalHandlers) {
                if (widget && handlerId) {
                    widget.disconnect(handlerId);
                }
            }
            this._signalHandlers = [];
        });
    }

    _createDropdownModel(items) {
        const model = new Gtk.StringList();
        for (const item of items) {
            model.append(item);
        }
        return model;
    }

    _connectAndTrack(widget, signal, callback) {
        const handlerId = widget.connect(signal, callback);
        this._signalHandlers.push({ widget, handlerId });
        return handlerId;
    }

    _buildLocationPage(page) {
        const locationGroup = new Adw.PreferencesGroup({
            title: 'İl Seçimi',
            description: 'Namaz vakitlerinin hesaplanacağı ili seçin',
        });
        page.add(locationGroup);

        const cityRow = new Adw.ComboRow({
            title: 'İl',
            subtitle: 'Türkiye\'nin 81 ilinden birini seçin',
        });

        cityRow.model = this._createDropdownModel(TURKEY_CITIES.map(c => c.name));

        const currentId = this._settings.get_int('location-id');
        const currentIndex = getCityIndexById(currentId);
        cityRow.selected = currentIndex >= 0 ? currentIndex : 0;

        this._connectAndTrack(cityRow, 'notify::selected', () => {
            const selected = TURKEY_CITIES[cityRow.selected];
            if (selected) {
                this._settings.set_int('location-id', selected.id);
                this._settings.set_string('city-name', selected.name);
                this._settings.set_string('region-name', selected.name);
                console.log(`[Praytime] İl seçildi: ${selected.name} (ID: ${selected.id})`);
            }
        });

        locationGroup.add(cityRow);

        const infoRow = new Adw.ActionRow({
            title: 'Konum Bilgisi',
            subtitle: 'Vakitler Diyanet İşleri Başkanlığı verilerine göre hesaplanır',
            icon_name: 'dialog-information-symbolic',
        });
        locationGroup.add(infoRow);
    }

    _buildNotificationPage(page) {
        const group = new Adw.PreferencesGroup({
            title: 'Bildirim Ayarları',
            description: 'Namaz vakti bildirimleri',
        });
        page.add(group);

        const enableRow = new Adw.SwitchRow({
            title: 'Bildirimleri Etkinleştir',
            subtitle: 'Namaz vakti girince bildirim göster',
        });
        group.add(enableRow);
        this._settings.bind('notifications-enabled', enableRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const beforeRow = new Adw.SpinRow({
            title: 'Önceden Bildir',
            subtitle: 'Vakit girmeden kaç dakika önce bildirim göster',
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 30,
                step_increment: 1,
                page_increment: 5,
            }),
        });
        group.add(beforeRow);
        this._settings.bind('notify-before-minutes', beforeRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        const onTimeRow = new Adw.SwitchRow({
            title: 'Vakit Girince Bildir',
            subtitle: 'Vakit tam girdiğinde bildirim göster',
        });
        group.add(onTimeRow);
        this._settings.bind('notify-on-time', onTimeRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const soundRow = new Adw.SwitchRow({
            title: 'Bildirim Sesi',
            subtitle: 'Bildirim geldiğinde ses çal',
        });
        group.add(soundRow);
        this._settings.bind('notification-sound', soundRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    }

    _buildDisplayPage(page) {
        const appearanceGroup = new Adw.PreferencesGroup({
            title: 'Panel Görünümü',
            description: 'Paneldeki görünüm ayarları',
        });
        page.add(appearanceGroup);

        const modeRow = new Adw.ComboRow({
            title: 'Görünüm Modu',
            subtitle: 'Panelde nasıl görünsün',
        });
        modeRow.model = this._createDropdownModel(DISPLAY_MODES.labels);
        modeRow.selected = getIndexFromValue(DISPLAY_MODES, this._settings.get_string('display-mode'));

        this._connectAndTrack(modeRow, 'notify::selected', () => {
            this._settings.set_string('display-mode', getValueFromIndex(DISPLAY_MODES, modeRow.selected));
        });

        appearanceGroup.add(modeRow);

        const showNameRow = new Adw.SwitchRow({
            title: 'Vakit Adını Göster',
            subtitle: '"İkindi" gibi vakit ismi',
        });
        appearanceGroup.add(showNameRow);
        this._settings.bind('show-prayer-name', showNameRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showTimeRow = new Adw.SwitchRow({
            title: 'Vakit Saatini Göster',
            subtitle: '"14:52" gibi saat bilgisi',
        });
        appearanceGroup.add(showTimeRow);
        this._settings.bind('show-prayer-time', showTimeRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const countdownGroup = new Adw.PreferencesGroup({
            title: 'Geri Sayım',
            description: 'Vakte kalan süre gösterimi',
        });
        page.add(countdownGroup);

        const countdownRow = new Adw.SwitchRow({
            title: 'Geri Sayım Göster',
            subtitle: 'Sonraki vakte kalan süreyi göster',
        });
        countdownGroup.add(countdownRow);
        this._settings.bind('show-countdown', countdownRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const thresholdRow = new Adw.SpinRow({
            title: 'Geri Sayım Eşiği',
            subtitle: 'Ne kadar süre kala geri sayım başlasın (dakika)',
            adjustment: new Gtk.Adjustment({
                lower: 5,
                upper: 180,
                step_increment: 5,
                page_increment: 15,
            }),
        });
        countdownGroup.add(thresholdRow);
        this._settings.bind('countdown-threshold-minutes', thresholdRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        const positionGroup = new Adw.PreferencesGroup({
            title: 'Panel Konumu',
        });
        page.add(positionGroup);

        const positionRow = new Adw.ComboRow({
            title: 'Konum',
            subtitle: 'Extension panelde nerede gösterilecek',
        });
        positionRow.model = this._createDropdownModel(PANEL_POSITIONS.labels);
        positionRow.selected = getIndexFromValue(PANEL_POSITIONS, this._settings.get_string('panel-position'));

        this._connectAndTrack(positionRow, 'notify::selected', () => {
            this._settings.set_string('panel-position', getValueFromIndex(PANEL_POSITIONS, positionRow.selected));
        });

        positionGroup.add(positionRow);
    }

    _buildAboutPage(page) {
        const group = new Adw.PreferencesGroup();
        page.add(group);

        const headerBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_top: 24,
            margin_bottom: 24,
            halign: Gtk.Align.CENTER,
        });

        headerBox.append(new Gtk.Image({
            icon_name: 'preferences-system-time-symbolic',
            pixel_size: 64,
        }));

        headerBox.append(new Gtk.Label({
            label: '<b><big>Praytime</big></b>',
            use_markup: true,
        }));

        headerBox.append(new Gtk.Label({
            label: 'GNOME Shell Extension',
            css_classes: ['dim-label'],
        }));

        headerBox.append(new Gtk.Label({
            label: `Sürüm ${APP_VERSION}`,
            css_classes: ['dim-label'],
        }));

        group.add(headerBox);

        const infoGroup = new Adw.PreferencesGroup();
        page.add(infoGroup);

        infoGroup.add(new Adw.ActionRow({
            title: 'Geliştirici',
            subtitle: `${APP_DEVELOPER} - Erhan ÜRGÜN`,
        }));

        infoGroup.add(new Adw.ActionRow({
            title: 'Lisans',
            subtitle: 'GPL-3.0',
        }));

        const linksGroup = new Adw.PreferencesGroup({
            title: 'Bağlantılar',
        });
        page.add(linksGroup);

        this._addLinkRow(linksGroup, 'Tüm Bağlantılar', `${APP_WEBSITE} - Geliştirici hakkında`, APP_WEBSITE);
        this._addLinkRow(linksGroup, 'GitHub', 'Kaynak kodu görüntüle', 'https://github.com/erhanurgun/LINUX-ubuntu-gnome-praytime-extension');
        this._addLinkRow(linksGroup, 'Hata Bildir', 'Sorun veya önerileri bildirin', 'https://github.com/erhanurgun/LINUX-ubuntu-gnome-praytime-extension/issues');
    }

    _addLinkRow(group, title, subtitle, url) {
        const row = new Adw.ActionRow({
            title,
            subtitle,
            activatable: true,
        });
        row.add_suffix(new Gtk.Image({
            icon_name: 'external-link-symbolic',
        }));
        this._connectAndTrack(row, 'activated', () => {
            Gio.AppInfo.launch_default_for_uri(url, null);
        });
        group.add(row);
    }
}
