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

// Tercihler penceresi
export default class PraytimePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        this._settings = this.getSettings();
        this._signalHandlers = [];

        // Konum Sayfası
        const locationPage = new Adw.PreferencesPage({
            title: 'Konum',
            icon_name: 'find-location-symbolic',
        });
        window.add(locationPage);
        this._buildLocationPage(locationPage);

        // Bildirim Sayfası
        const notificationPage = new Adw.PreferencesPage({
            title: 'Bildirimler',
            icon_name: 'preferences-system-notifications-symbolic',
        });
        window.add(notificationPage);
        this._buildNotificationPage(notificationPage);

        // Gösterim Sayfası
        const displayPage = new Adw.PreferencesPage({
            title: 'Görünüm',
            icon_name: 'preferences-desktop-display-symbolic',
        });
        window.add(displayPage);
        this._buildDisplayPage(displayPage);

        // Hakkında Sayfası
        const aboutPage = new Adw.PreferencesPage({
            title: 'Hakkında',
            icon_name: 'help-about-symbolic',
        });
        window.add(aboutPage);
        this._buildAboutPage(aboutPage);

        // Pencere kapatıldığında temizle
        window.connect('destroy', () => {
            // Signal handler'larını temizle
            for (const { widget, handlerId } of this._signalHandlers) {
                if (widget && handlerId) {
                    widget.disconnect(handlerId);
                }
            }
            this._signalHandlers = [];
        });
    }

    // Konum Sayfası - Dropdown il seçimi
    _buildLocationPage(page) {
        const locationGroup = new Adw.PreferencesGroup({
            title: 'İl Seçimi',
            description: 'Namaz vakitlerinin hesaplanacağı ili seçin',
        });
        page.add(locationGroup);

        // Dropdown il seçimi
        const cityRow = new Adw.ComboRow({
            title: 'İl',
            subtitle: 'Türkiye\'nin 81 ilinden birini seçin',
        });

        const cityModel = new Gtk.StringList();
        for (const city of TURKEY_CITIES) {
            cityModel.append(city.name);
        }
        cityRow.model = cityModel;

        // Mevcut seçimi bul ve ayarla
        const currentId = this._settings.get_int('location-id');
        const currentIndex = getCityIndexById(currentId);
        cityRow.selected = currentIndex >= 0 ? currentIndex : 0;

        // Değişiklik dinle
        const cityHandlerId = cityRow.connect('notify::selected', () => {
            const selected = TURKEY_CITIES[cityRow.selected];
            if (selected) {
                this._settings.set_int('location-id', selected.id);
                this._settings.set_string('city-name', selected.name);
                this._settings.set_string('region-name', selected.name);
                console.log(`[Praytime] İl seçildi: ${selected.name} (ID: ${selected.id})`);
            }
        });
        this._signalHandlers.push({ widget: cityRow, handlerId: cityHandlerId });

        locationGroup.add(cityRow);

        // Bilgi satırı
        const infoRow = new Adw.ActionRow({
            title: 'Konum Bilgisi',
            subtitle: 'Vakitler Diyanet İşleri Başkanlığı verilerine göre hesaplanır',
            icon_name: 'dialog-information-symbolic',
        });
        locationGroup.add(infoRow);
    }

    // Bildirimler Sayfası
    _buildNotificationPage(page) {
        const group = new Adw.PreferencesGroup({
            title: 'Bildirim Ayarları',
            description: 'Namaz vakti bildirimleri',
        });
        page.add(group);

        // Bildirim aktif
        const enableRow = new Adw.SwitchRow({
            title: 'Bildirimleri Etkinleştir',
            subtitle: 'Namaz vakti girince bildirim göster',
        });
        group.add(enableRow);
        this._settings.bind('notifications-enabled', enableRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        // Kaç dakika önce
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

        // Vakit girince bildir
        const onTimeRow = new Adw.SwitchRow({
            title: 'Vakit Girince Bildir',
            subtitle: 'Vakit tam girdiğinde bildirim göster',
        });
        group.add(onTimeRow);
        this._settings.bind('notify-on-time', onTimeRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        // Bildirim sesi
        const soundRow = new Adw.SwitchRow({
            title: 'Bildirim Sesi',
            subtitle: 'Bildirim geldiğinde ses çal',
        });
        group.add(soundRow);
        this._settings.bind('notification-sound', soundRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    }

    // Görünüm Sayfası
    _buildDisplayPage(page) {
        // Panel Görünümü Grubu
        const appearanceGroup = new Adw.PreferencesGroup({
            title: 'Panel Görünümü',
            description: 'Paneldeki görünüm ayarları',
        });
        page.add(appearanceGroup);

        // Görünüm modu
        const modeRow = new Adw.ComboRow({
            title: 'Görünüm Modu',
            subtitle: 'Panelde nasıl görünsün',
        });

        const modeModel = new Gtk.StringList();
        for (const label of DISPLAY_MODES.labels) {
            modeModel.append(label);
        }
        modeRow.model = modeModel;

        modeRow.selected = getIndexFromValue(DISPLAY_MODES, this._settings.get_string('display-mode'));

        const modeHandlerId = modeRow.connect('notify::selected', () => {
            this._settings.set_string('display-mode', getValueFromIndex(DISPLAY_MODES, modeRow.selected));
        });
        this._signalHandlers.push({ widget: modeRow, handlerId: modeHandlerId });

        appearanceGroup.add(modeRow);

        // Vakit adı göster
        const showNameRow = new Adw.SwitchRow({
            title: 'Vakit Adını Göster',
            subtitle: '"İkindi" gibi vakit ismi',
        });
        appearanceGroup.add(showNameRow);
        this._settings.bind('show-prayer-name', showNameRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        // Vakit saati göster
        const showTimeRow = new Adw.SwitchRow({
            title: 'Vakit Saatini Göster',
            subtitle: '"14:52" gibi saat bilgisi',
        });
        appearanceGroup.add(showTimeRow);
        this._settings.bind('show-prayer-time', showTimeRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        // Geri Sayım Grubu
        const countdownGroup = new Adw.PreferencesGroup({
            title: 'Geri Sayım',
            description: 'Vakte kalan süre gösterimi',
        });
        page.add(countdownGroup);

        // Geri sayım göster
        const countdownRow = new Adw.SwitchRow({
            title: 'Geri Sayım Göster',
            subtitle: 'Sonraki vakte kalan süreyi göster',
        });
        countdownGroup.add(countdownRow);
        this._settings.bind('show-countdown', countdownRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        // Geri sayım eşiği
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

        // Panel Konumu Grubu
        const positionGroup = new Adw.PreferencesGroup({
            title: 'Panel Konumu',
        });
        page.add(positionGroup);

        // Panel konumu
        const positionRow = new Adw.ComboRow({
            title: 'Konum',
            subtitle: 'Extension panelde nerede gösterilecek',
        });

        const positionModel = new Gtk.StringList();
        for (const label of PANEL_POSITIONS.labels) {
            positionModel.append(label);
        }
        positionRow.model = positionModel;

        positionRow.selected = getIndexFromValue(PANEL_POSITIONS, this._settings.get_string('panel-position'));

        const positionHandlerId = positionRow.connect('notify::selected', () => {
            this._settings.set_string('panel-position', getValueFromIndex(PANEL_POSITIONS, positionRow.selected));
        });
        this._signalHandlers.push({ widget: positionRow, handlerId: positionHandlerId });

        positionGroup.add(positionRow);
    }

    // Hakkında Sayfası
    _buildAboutPage(page) {
        const group = new Adw.PreferencesGroup();
        page.add(group);

        // Logo/Başlık
        const headerBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_top: 24,
            margin_bottom: 24,
            halign: Gtk.Align.CENTER,
        });

        const icon = new Gtk.Image({
            icon_name: 'preferences-system-time-symbolic',
            pixel_size: 64,
        });
        headerBox.append(icon);

        const titleLabel = new Gtk.Label({
            label: '<b><big>Praytime</big></b>',
            use_markup: true,
        });
        headerBox.append(titleLabel);

        const subtitleLabel = new Gtk.Label({
            label: 'GNOME Shell Extension',
            css_classes: ['dim-label'],
        });
        headerBox.append(subtitleLabel);

        const versionLabel = new Gtk.Label({
            label: `Sürüm ${APP_VERSION}`,
            css_classes: ['dim-label'],
        });
        headerBox.append(versionLabel);

        group.add(headerBox);

        // Bilgi grubu
        const infoGroup = new Adw.PreferencesGroup();
        page.add(infoGroup);

        const developerRow = new Adw.ActionRow({
            title: 'Geliştirici',
            subtitle: `${APP_DEVELOPER} - Erhan ÜRGÜN`,
        });
        infoGroup.add(developerRow);

        const licenseRow = new Adw.ActionRow({
            title: 'Lisans',
            subtitle: 'GPL-3.0',
        });
        infoGroup.add(licenseRow);

        // Linkler grubu
        const linksGroup = new Adw.PreferencesGroup({
            title: 'Bağlantılar',
        });
        page.add(linksGroup);

        // Tüm Bağlantılar (en üstte)
        const allLinksRow = new Adw.ActionRow({
            title: 'Tüm Bağlantılar',
            subtitle: `${APP_WEBSITE} - Geliştirici hakkında`,
            activatable: true,
        });
        allLinksRow.add_suffix(new Gtk.Image({
            icon_name: 'external-link-symbolic',
        }));
        const allLinksHandlerId = allLinksRow.connect('activated', () => {
            Gio.AppInfo.launch_default_for_uri(APP_WEBSITE, null);
        });
        this._signalHandlers.push({ widget: allLinksRow, handlerId: allLinksHandlerId });
        linksGroup.add(allLinksRow);

        const githubRow = new Adw.ActionRow({
            title: 'GitHub',
            subtitle: 'Kaynak kodu görüntüle',
            activatable: true,
        });
        githubRow.add_suffix(new Gtk.Image({
            icon_name: 'external-link-symbolic',
        }));
        const githubHandlerId = githubRow.connect('activated', () => {
            Gio.AppInfo.launch_default_for_uri(
                'https://github.com/erhanurgun/LINUX-ubuntu-gnome-praytime-extension',
                null
            );
        });
        this._signalHandlers.push({ widget: githubRow, handlerId: githubHandlerId });
        linksGroup.add(githubRow);

        const issueRow = new Adw.ActionRow({
            title: 'Hata Bildir',
            subtitle: 'Sorun veya önerileri bildirin',
            activatable: true,
        });
        issueRow.add_suffix(new Gtk.Image({
            icon_name: 'external-link-symbolic',
        }));
        const issueHandlerId = issueRow.connect('activated', () => {
            Gio.AppInfo.launch_default_for_uri(
                'https://github.com/erhanurgun/LINUX-ubuntu-gnome-praytime-extension/issues',
                null
            );
        });
        this._signalHandlers.push({ widget: issueRow, handlerId: issueHandlerId });
        linksGroup.add(issueRow);
    }
}
