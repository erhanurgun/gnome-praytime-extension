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
            user_agent: 'praytime@erho.dev/0.1.0',
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
            title: 'Gösterim',
            icon_name: 'preferences-desktop-display-symbolic',
        });
        window.add(displayPage);
        this._buildDisplayPage(displayPage);

        // Pencere kapatıldığında temizle
        window.connect('destroy', () => {
            this._session = null;
        });
    }

    _buildLocationPage(page) {
        // Mevcut konum grubu
        const currentGroup = new Adw.PreferencesGroup({
            title: 'Mevcut Konum',
        });
        page.add(currentGroup);

        // Seçili konum gösterimi
        const cityName = this._settings.get_string('city-name');
        const regionName = this._settings.get_string('region-name');
        const locationId = this._settings.get_int('location-id');

        this._currentLocationRow = new Adw.ActionRow({
            title: cityName,
            subtitle: regionName !== cityName ? `${regionName} (ID: ${locationId})` : `ID: ${locationId}`,
        });
        currentGroup.add(this._currentLocationRow);

        // Şehir arama grubu
        const searchGroup = new Adw.PreferencesGroup({
            title: 'Konum Ara',
            description: 'Şehir veya ilçe adı girerek arayın',
        });
        page.add(searchGroup);

        // Arama kutusu
        const searchEntry = new Adw.EntryRow({
            title: 'Şehir/İlçe Adı',
        });
        searchGroup.add(searchEntry);

        // Arama butonu
        const searchButton = new Gtk.Button({
            label: 'Ara',
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

        // Enter ile arama
        searchEntry.connect('entry-activated', () => {
            const query = searchEntry.text.trim();
            if (query.length >= 2) {
                this._searchCity(query);
            }
        });
    }

    // Şehir ara
    async _searchCity(query) {
        // Önceki sonuçları temizle
        this._clearResults();

        const url = `${API_BASE_URL}/api/diyanet/search?q=${encodeURIComponent(query)}`;

        try {
            const message = Soup.Message.new('GET', url);
            const bytes = await this._session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null);

            if (message.get_status() !== 200) {
                this._showError('Arama başarısız');
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

    // Sonuçları göster
    _showResults(results) {
        this._resultsGroup.visible = true;

        // En fazla 10 sonuç göster
        const displayResults = results.slice(0, 10);

        for (const result of displayResults) {
            const displayName = result.region && result.region !== result.city
                ? `${result.city}/${result.region}`
                : result.city;

            const row = new Adw.ActionRow({
                title: displayName,
                subtitle: `${result.country} (ID: ${result.id})`,
                activatable: true,
            });

            // Seç ikonu
            row.add_suffix(new Gtk.Image({
                icon_name: 'object-select-symbolic',
            }));

            // Seçim işlevi
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

        // Mevcut konum gösterimini güncelle
        this._currentLocationRow.title = location.city;
        this._currentLocationRow.subtitle = location.region && location.region !== location.city
            ? `${location.region} (ID: ${location.id})`
            : `ID: ${location.id}`;

        // Sonuçları gizle
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
    }

    _buildDisplayPage(page) {
        const group = new Adw.PreferencesGroup({
            title: 'Gösterim Ayarları',
            description: 'Panel görünümü',
        });
        page.add(group);

        // Geri sayım göster
        const countdownRow = new Adw.SwitchRow({
            title: 'Geri Sayım Göster',
            subtitle: 'Sonraki vakte kalan süreyi panelde göster',
        });
        group.add(countdownRow);
        this._settings.bind('show-countdown', countdownRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        // Panel konumu
        const positionRow = new Adw.ComboRow({
            title: 'Panel Konumu',
            subtitle: 'Extension panelde nerede gösterilecek',
        });

        const positionModel = new Gtk.StringList();
        positionModel.append('Sol');
        positionModel.append('Orta');
        positionModel.append('Sağ');
        positionRow.model = positionModel;

        const positionMap = { 'left': 0, 'center': 1, 'right': 2 };
        const reverseMap = ['left', 'center', 'right'];

        positionRow.selected = positionMap[this._settings.get_string('panel-position')] || 2;

        // Settings değişikliğini dinle
        const signalId = this._settings.connect('changed::panel-position', () => {
            const pos = this._settings.get_string('panel-position');
            if (positionRow.selected !== positionMap[pos]) {
                positionRow.selected = positionMap[pos] || 2;
            }
        });

        positionRow.connect('notify::selected', () => {
            this._settings.set_string('panel-position', reverseMap[positionRow.selected]);
        });

        // Pencere kapatıldığında signal'i temizle
        page.connect('destroy', () => {
            this._settings.disconnect(signalId);
        });

        group.add(positionRow);
    }
}
