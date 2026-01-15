import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const API_BASE_URL = 'https://prayertimes.api.abdus.dev';

// Tercihler penceresi
export default class PraytimePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        this._settings = this.getSettings();
        this._session = new Soup.Session({
            user_agent: 'praytime@erho.dev/0.2.0',
            timeout: 30,
        });

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
            this._session = null;
        });
    }

    // Konum Sayfası
    _buildLocationPage(page) {
        // Mevcut konum grubu
        const currentGroup = new Adw.PreferencesGroup({
            title: 'Mevcut Konum',
            description: 'Namaz vakitlerinin hesaplandığı konum',
        });
        page.add(currentGroup);

        const cityName = this._settings.get_string('city-name');
        const regionName = this._settings.get_string('region-name');
        const locationId = this._settings.get_int('location-id');

        this._currentLocationRow = new Adw.ActionRow({
            title: cityName,
            subtitle: regionName !== cityName ? `${regionName} - ID: ${locationId}` : `ID: ${locationId}`,
            icon_name: 'mark-location-symbolic',
        });
        currentGroup.add(this._currentLocationRow);

        // Şehir arama grubu
        const searchGroup = new Adw.PreferencesGroup({
            title: 'Konum Ara',
            description: 'Şehir veya ilçe adı girerek arayın',
        });
        page.add(searchGroup);

        const searchEntry = new Adw.EntryRow({
            title: 'Şehir/İlçe Adı',
        });
        searchGroup.add(searchEntry);

        const searchButton = new Gtk.Button({
            label: 'Ara',
            css_classes: ['suggested-action'],
            margin_start: 12,
            margin_end: 12,
            margin_top: 6,
            margin_bottom: 6,
        });

        const buttonBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            halign: Gtk.Align.END,
        });
        buttonBox.append(searchButton);
        searchGroup.add(buttonBox);

        // Arama sonuçları grubu
        this._resultsGroup = new Adw.PreferencesGroup({
            title: 'Arama Sonuçları',
            visible: false,
        });
        page.add(this._resultsGroup);

        // Arama işlevi
        searchButton.connect('clicked', () => {
            const query = searchEntry.text.trim();
            if (query.length >= 2) {
                this._searchCity(query);
            }
        });

        searchEntry.connect('entry-activated', () => {
            const query = searchEntry.text.trim();
            if (query.length >= 2) {
                this._searchCity(query);
            }
        });
    }

    // Şehir ara
    _searchCity(query) {
        this._clearResults();

        const url = `${API_BASE_URL}/api/diyanet/search?q=${encodeURIComponent(query)}`;
        const message = Soup.Message.new('GET', url);

        this._session.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null,
            (session, result) => {
                try {
                    const bytes = session.send_and_read_finish(result);
                    const status = message.get_status();

                    if (status !== 200) {
                        this._showError(`Arama başarısız (HTTP ${status})`);
                        return;
                    }

                    const text = new TextDecoder().decode(bytes.get_data());
                    const results = JSON.parse(text);

                    if (!results || results.length === 0) {
                        this._showError('Sonuç bulunamadı');
                        return;
                    }

                    this._showResults(results);
                } catch (error) {
                    console.error(`[Praytime] Arama hatası: ${error.message}`);
                    this._showError('Arama sırasında hata oluştu');
                }
            }
        );
    }

    // Sonuçları göster
    _showResults(results) {
        this._resultsGroup.visible = true;

        const displayResults = results.slice(0, 10);

        for (const result of displayResults) {
            const displayName = result.region && result.region !== result.city
                ? `${result.city}/${result.region}`
                : result.city;

            const row = new Adw.ActionRow({
                title: displayName,
                subtitle: `${result.country} - ID: ${result.id}`,
                activatable: true,
            });

            row.add_suffix(new Gtk.Image({
                icon_name: 'object-select-symbolic',
            }));

            row.connect('activated', () => {
                this._selectLocation(result);
            });

            this._resultsGroup.add(row);
        }
    }

    // Konum seç
    _selectLocation(location) {
        this._settings.set_int('location-id', location.id);
        this._settings.set_string('city-name', location.city);
        this._settings.set_string('region-name', location.region || location.city);

        this._currentLocationRow.title = location.city;
        this._currentLocationRow.subtitle = location.region && location.region !== location.city
            ? `${location.region} - ID: ${location.id}`
            : `ID: ${location.id}`;

        this._resultsGroup.visible = false;
        this._clearResults();
    }

    // Sonuçları temizle
    _clearResults() {
        let child = this._resultsGroup.get_first_child();
        while (child) {
            const next = child.get_next_sibling();
            if (child instanceof Adw.ActionRow) {
                this._resultsGroup.remove(child);
            }
            child = next;
        }
    }

    // Hata göster
    _showError(message) {
        this._resultsGroup.visible = true;
        const errorRow = new Adw.ActionRow({
            title: message,
            icon_name: 'dialog-warning-symbolic',
        });
        this._resultsGroup.add(errorRow);
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
        modeModel.append('Tam Metin');
        modeModel.append('Sadece İkon');
        modeModel.append('Kompakt');
        modeRow.model = modeModel;

        const modeMap = { 'text': 0, 'icon': 1, 'compact': 2 };
        const reverseModeMap = ['text', 'icon', 'compact'];

        modeRow.selected = modeMap[this._settings.get_string('display-mode')] || 0;

        modeRow.connect('notify::selected', () => {
            this._settings.set_string('display-mode', reverseModeMap[modeRow.selected]);
        });

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
        positionModel.append('Sol');
        positionModel.append('Orta');
        positionModel.append('Sağ');
        positionRow.model = positionModel;

        const positionMap = { 'left': 0, 'center': 1, 'right': 2 };
        const reversePositionMap = ['left', 'center', 'right'];

        positionRow.selected = positionMap[this._settings.get_string('panel-position')] || 2;

        positionRow.connect('notify::selected', () => {
            this._settings.set_string('panel-position', reversePositionMap[positionRow.selected]);
        });

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
            label: 'Sürüm 0.2.0',
            css_classes: ['dim-label'],
        });
        headerBox.append(versionLabel);

        group.add(headerBox);

        // Bilgi grubu
        const infoGroup = new Adw.PreferencesGroup();
        page.add(infoGroup);

        const developerRow = new Adw.ActionRow({
            title: 'Geliştirici',
            subtitle: 'erho.dev',
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

        const githubRow = new Adw.ActionRow({
            title: 'GitHub',
            subtitle: 'Kaynak kodu görüntüle',
            activatable: true,
        });
        githubRow.add_suffix(new Gtk.Image({
            icon_name: 'external-link-symbolic',
        }));
        githubRow.connect('activated', () => {
            Gio.AppInfo.launch_default_for_uri(
                'https://github.com/erhanurgun/LINUX-ubuntu-gnome-praytime-extension',
                null
            );
        });
        linksGroup.add(githubRow);

        const issueRow = new Adw.ActionRow({
            title: 'Hata Bildir',
            subtitle: 'Sorun veya önerileri bildirin',
            activatable: true,
        });
        issueRow.add_suffix(new Gtk.Image({
            icon_name: 'external-link-symbolic',
        }));
        issueRow.connect('activated', () => {
            Gio.AppInfo.launch_default_for_uri(
                'https://github.com/erhanurgun/LINUX-ubuntu-gnome-praytime-extension/issues',
                null
            );
        });
        linksGroup.add(issueRow);
    }
}
