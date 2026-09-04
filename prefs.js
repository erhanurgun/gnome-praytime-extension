import Adw from 'gi://Adw?version=1';
import Gtk from 'gi://Gtk?version=4.0';
import Gio from 'gi://Gio';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {
    PANEL_POSITIONS,
    LOCATION_MODES,
    CALCULATION_METHODS,
    TURKEY_CITIES,
    getCityIndexById,
    getIndexFromValue,
    getValueFromIndex,
    getCalculationMethodIndex,
    getCalculationMethodById,
    APP_VERSION,
    APP_DEVELOPER,
    APP_WEBSITE,
} from './src/config/constants.js';
import { createGettextWrapper } from './src/i18n/gettext.js';

let _ = (s) => s;

export default class PraytimePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        this._settings = this.getSettings();
        this._signalHandlers = [];
        this._window = window;
        this._window.set_size_request(660, 770);
        this._pages = [];

        _ = createGettextWrapper(this._settings);

        this._buildAllPages(window);

        this._langChangedId = this._settings.connect('changed::language', () => {
            this._rebuildForLanguageChange();
        });

        this._locationStatusId = this._settings.connect('changed::location-status', () => {
            this._updateLocationValidationUI();
        });

        window.connect('destroy', () => {
            if (this._langChangedId) {
                this._settings.disconnect(this._langChangedId);
                this._langChangedId = null;
            }
            if (this._locationStatusId) {
                this._settings.disconnect(this._locationStatusId);
                this._locationStatusId = null;
            }
            this._disconnectAllHandlers();
        });
    }

    _buildAllPages(window) {
        const locationPage = new Adw.PreferencesPage({
            title: _('Konum'),
            icon_name: 'find-location-symbolic',
        });
        window.add(locationPage);
        this._pages.push(locationPage);
        this._buildLocationPage(locationPage);

        const notificationPage = new Adw.PreferencesPage({
            title: _('Bildirimler'),
            icon_name: 'preferences-system-notifications-symbolic',
        });
        window.add(notificationPage);
        this._pages.push(notificationPage);
        this._buildNotificationPage(notificationPage);

        const extraPage = new Adw.PreferencesPage({
            title: _('Ek Vakitler'),
            icon_name: 'weather-clear-night-symbolic',
        });
        window.add(extraPage);
        this._pages.push(extraPage);
        this._buildExtraPage(extraPage);

        const displayPage = new Adw.PreferencesPage({
            title: _('Görünüm'),
            icon_name: 'preferences-desktop-display-symbolic',
        });
        window.add(displayPage);
        this._pages.push(displayPage);
        this._buildDisplayPage(displayPage);

        const aboutPage = new Adw.PreferencesPage({
            title: _('Hakkında'),
            icon_name: 'help-about-symbolic',
        });
        window.add(aboutPage);
        this._pages.push(aboutPage);
        this._buildAboutPage(aboutPage);
    }

    _rebuildForLanguageChange() {
        _ = createGettextWrapper(this._settings);

        this._disconnectAllHandlers();

        for (const page of this._pages) {
            this._window.remove(page);
        }
        this._pages = [];

        this._buildAllPages(this._window);
    }

    _disconnectAllHandlers() {
        for (const { widget, handlerId } of this._signalHandlers) {
            if (widget && handlerId) {
                try { widget.disconnect(handlerId); } catch (e) { /* widget zaten yıkılmış */ }
            }
        }
        this._signalHandlers = [];
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
        // Validasyon uyarı grubu
        this._validationGroup = new Adw.PreferencesGroup();
        page.add(this._validationGroup);

        this._validationRow = new Adw.ActionRow({
            icon_name: 'dialog-warning-symbolic',
            visible: false,
        });
        this._validationRow.add_css_class('error');
        this._validationGroup.add(this._validationRow);
        this._validationGroup.visible = false;

        // Konum modu grubu
        const modeGroup = new Adw.PreferencesGroup({
            title: _('Konum Yöntemi'),
            description: _('Namaz vakitlerinin hesaplanacağı konumu belirleyin'),
        });
        page.add(modeGroup);

        const modeRow = new Adw.ComboRow({
            title: _('Konum Modu'),
        });
        modeRow.model = this._createDropdownModel(LOCATION_MODES.labels.map(l => _(l)));
        modeRow.selected = getIndexFromValue(LOCATION_MODES, this._settings.get_string('location-mode'));

        this._connectAndTrack(modeRow, 'notify::selected', () => {
            const mode = getValueFromIndex(LOCATION_MODES, modeRow.selected);
            this._settings.set_string('location-mode', mode);
            this._updateLocationVisibility(mode);
        });
        modeRow.add_suffix(this._createHelpButton(
            _('Şehir/Ülke: Şehir ve ülke adıyla konum belirler.\nEnlem/Boylam: GPS koordinatlarıyla. Daha hassas sonuç verir.')
        ));
        modeGroup.add(modeRow);

        // Şehir/Ülke grubu
        this._cityGroup = new Adw.PreferencesGroup({
            title: _('Şehir/Ülke'),
        });
        page.add(this._cityGroup);

        // Ülke
        const countryRow = new Adw.EntryRow({
            title: _('Ülke'),
        });
        countryRow.text = this._settings.get_string('country-name');
        this._connectAndTrack(countryRow, 'changed', () => {
            this._settings.set_string('country-name', countryRow.text);
            this._updateCityInputVisibility(countryRow.text);
        });
        countryRow.add_suffix(this._createHelpButton(
            _('Ülke adını İngilizce girin.\nÖrnekler: Turkey, Germany, France, United Kingdom, Egypt')
        ));
        this._cityGroup.add(countryRow);
        this._countryRow = countryRow;

        // İl dropdown (yalnızca Turkey ise görünür)
        const cityDropdownRow = new Adw.ComboRow({
            title: _('İl'),
            subtitle: _('Türkiye\'nin 81 ilinden birini seçin'),
        });
        cityDropdownRow.model = this._createDropdownModel(TURKEY_CITIES.map(c => c.name));

        const currentId = this._settings.get_int('location-id');
        const currentIndex = getCityIndexById(currentId);
        cityDropdownRow.selected = currentIndex >= 0 ? currentIndex : 0;

        this._connectAndTrack(cityDropdownRow, 'notify::selected', () => {
            const selected = TURKEY_CITIES[cityDropdownRow.selected];
            if (selected) {
                this._settings.set_int('location-id', selected.id);
                this._settings.set_string('city-name', selected.name);
                this._settings.set_string('region-name', selected.name);
            }
        });
        this._cityGroup.add(cityDropdownRow);
        this._cityDropdownRow = cityDropdownRow;

        // Şehir adı serbest metin (Turkey dışı ülkeler için)
        const cityEntryRow = new Adw.EntryRow({
            title: _('Şehir Adı'),
        });
        cityEntryRow.text = this._settings.get_string('city-name');
        this._connectAndTrack(cityEntryRow, 'changed', () => {
            this._settings.set_string('city-name', cityEntryRow.text);
        });
        cityEntryRow.add_suffix(this._createHelpButton(
            _('Şehir adını İngilizce girin.\nÖrnekler: Istanbul, Berlin, Paris, London, Cairo')
        ));
        this._cityGroup.add(cityEntryRow);
        this._cityEntryRow = cityEntryRow;

        const infoRow = new Adw.ActionRow({
            title: _('Konum Bilgisi'),
            subtitle: _('Vakitler Diyanet İşleri Başkanlığı verilerine göre hesaplanır'),
            icon_name: 'dialog-information-symbolic',
        });
        this._cityGroup.add(infoRow);
        this._cityInfoRow = infoRow;

        // Koordinat grubu
        this._coordGroup = new Adw.PreferencesGroup({
            title: _('Enlem/Boylam'),
        });
        page.add(this._coordGroup);

        const latRow = new Adw.SpinRow({
            title: _('Enlem'),
            adjustment: new Gtk.Adjustment({
                lower: -90.0,
                upper: 90.0,
                step_increment: 0.0001,
                page_increment: 1.0,
            }),
            digits: 4,
        });
        latRow.add_suffix(this._createHelpButton(
            _('Enlem değeri -90 ile 90 arasında olmalıdır.\nmaps.google.com adresinden koordinatlarınızı öğrenebilirsiniz.')
        ));
        this._coordGroup.add(latRow);
        this._settings.bind('latitude', latRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        const lngRow = new Adw.SpinRow({
            title: _('Boylam'),
            adjustment: new Gtk.Adjustment({
                lower: -180.0,
                upper: 180.0,
                step_increment: 0.0001,
                page_increment: 1.0,
            }),
            digits: 4,
        });
        lngRow.add_suffix(this._createHelpButton(
            _('Boylam değeri -180 ile 180 arasında olmalıdır.\nmaps.google.com adresinden koordinatlarınızı öğrenebilirsiniz.')
        ));
        this._coordGroup.add(lngRow);
        this._settings.bind('longitude', lngRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        const coordInfoRow = new Adw.ActionRow({
            title: _('Konum Bilgisi'),
            subtitle: _('Koordinatları maps.google.com\'dan alabilirsiniz'),
            icon_name: 'dialog-information-symbolic',
        });
        this._coordGroup.add(coordInfoRow);

        // Hesaplama metodu grubu
        const methodGroup = new Adw.PreferencesGroup({
            title: _('Hesaplama Yöntemi'),
            description: _('Namaz vakitlerinin hesaplanacağı yöntemi seçin'),
        });
        page.add(methodGroup);

        const methodRow = new Adw.ComboRow({
            title: _('Hesaplama Metodu'),
        });
        methodRow.model = this._createDropdownModel(CALCULATION_METHODS.map(m => m.name));

        const currentMethod = this._settings.get_int('calculation-method');
        const methodIndex = getCalculationMethodIndex(currentMethod);
        methodRow.selected = methodIndex >= 0 ? methodIndex : getCalculationMethodIndex(13);

        this._connectAndTrack(methodRow, 'notify::selected', () => {
            const selected = getCalculationMethodById(methodRow.selected);
            if (selected) {
                this._settings.set_int('calculation-method', selected.id);
            }
        });
        methodRow.add_suffix(this._createHelpButton(
            _('Bölgenize uygun hesaplama yöntemini seçin.\nTürkiye: Diyanet İşleri Başkanlığı\nAvrupa: MWL veya ISNA\nKörfez: Umm Al-Qura')
        ));
        methodGroup.add(methodRow);

        // Dil ayarı grubu
        const langGroup = new Adw.PreferencesGroup({
            title: _('Dil Ayarları'),
        });
        page.add(langGroup);

        const LANGUAGES = {
            values: ['tr', 'en'],
            labels: [_('Türkçe'), 'English'],
        };

        const langRow = new Adw.ComboRow({
            title: _('Dil'),
        });
        langRow.model = this._createDropdownModel(LANGUAGES.labels);
        langRow.selected = getIndexFromValue(LANGUAGES, this._settings.get_string('language'));

        this._connectAndTrack(langRow, 'notify::selected', () => {
            this._settings.set_string('language', getValueFromIndex(LANGUAGES, langRow.selected));
        });
        langGroup.add(langRow);

        // Başlangıç görünürlüğünü ayarla
        const currentMode = this._settings.get_string('location-mode');
        this._updateLocationVisibility(currentMode);
        this._updateCityInputVisibility(countryRow.text);
        this._updateLocationValidationUI();
    }

    _updateLocationVisibility(mode) {
        const isCityMode = mode === 'city';
        this._cityGroup.visible = isCityMode;
        this._coordGroup.visible = !isCityMode;
    }

    _updateCityInputVisibility(country) {
        const isTurkey = country.toLowerCase() === 'turkey' || country.toLowerCase() === 'türkiye';
        this._cityDropdownRow.visible = isTurkey;
        this._cityEntryRow.visible = !isTurkey;
    }

    _createHelpButton(helpText) {
        const button = new Gtk.Button({
            icon_name: 'dialog-question-symbolic',
            valign: Gtk.Align.CENTER,
            has_frame: false,
            css_classes: ['flat', 'circular'],
        });

        const popover = new Gtk.Popover();
        const label = new Gtk.Label({
            label: helpText,
            wrap: true,
            max_width_chars: 40,
            margin_top: 8, margin_bottom: 8,
            margin_start: 8, margin_end: 8,
        });
        popover.set_child(label);
        popover.set_parent(button);

        this._connectAndTrack(button, 'clicked', () => popover.popup());
        return button;
    }

    _updateLocationValidationUI() {
        const status = this._settings.get_string('location-status');
        const message = this._settings.get_string('location-status-message');

        if (!this._validationRow || !this._validationGroup) return;

        const ERROR_STATUSES = ['invalid_country', 'invalid_city', 'empty_country',
                                'empty_city', 'api_error'];
        const isError = ERROR_STATUSES.includes(status);
        const isWarning = status === 'network_error';

        if (isError) {
            this._validationGroup.visible = true;
            this._validationRow.visible = true;
            this._validationRow.icon_name = 'dialog-error-symbolic';
            this._validationRow.title = _('Konum doğrulanamadı');
            this._validationRow.subtitle = message || _('Lütfen konum bilgilerinizi kontrol edin');
            this._validationRow.remove_css_class('warning');
            this._validationRow.add_css_class('error');
        } else if (isWarning) {
            this._validationGroup.visible = true;
            this._validationRow.visible = true;
            this._validationRow.icon_name = 'network-offline-symbolic';
            this._validationRow.title = _('Bağlantı hatası');
            this._validationRow.subtitle = message || _('İnternet bağlantınızı kontrol edin');
            this._validationRow.remove_css_class('error');
            this._validationRow.add_css_class('warning');
        } else {
            this._validationGroup.visible = false;
            this._validationRow.visible = false;
        }

        this._applyFieldValidationStyles(status);
    }

    _applyFieldValidationStyles(status) {
        if (this._countryRow) {
            if (['empty_country', 'invalid_country', 'invalid_city'].includes(status)) {
                this._countryRow.add_css_class('error');
            } else {
                this._countryRow.remove_css_class('error');
            }
        }
        if (this._cityEntryRow) {
            if (['empty_city', 'invalid_city'].includes(status)) {
                this._cityEntryRow.add_css_class('error');
            } else {
                this._cityEntryRow.remove_css_class('error');
            }
        }
    }

    _buildNotificationPage(page) {
        const group = new Adw.PreferencesGroup({
            title: _('Bildirim Ayarları'),
            description: _('Namaz vakti bildirimleri'),
        });
        page.add(group);

        const enableRow = new Adw.SwitchRow({
            title: _('Bildirimleri Etkinleştir'),
            subtitle: _('Namaz vakti girince bildirim göster'),
        });
        group.add(enableRow);
        this._settings.bind('notifications-enabled', enableRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const beforeRow = new Adw.SpinRow({
            title: _('Önceden Bildir'),
            subtitle: _('Vakit girmeden kaç dakika önce bildirim göster'),
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 30,
                step_increment: 1,
                page_increment: 5,
            }),
        });
        beforeRow.add_suffix(this._createHelpButton(
            _('Vakit girmeden belirtilen dakika kadar önce ön bildirim gönderilir.')
        ));
        group.add(beforeRow);
        this._settings.bind('notify-before-minutes', beforeRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        const onTimeRow = new Adw.SwitchRow({
            title: _('Vakit Girince Bildir'),
            subtitle: _('Vakit tam girdiğinde bildirim göster'),
        });
        group.add(onTimeRow);
        this._settings.bind('notify-on-time', onTimeRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const soundRow = new Adw.SwitchRow({
            title: _('Bildirim Sesi'),
            subtitle: _('Bildirim geldiğinde ses çal'),
        });
        group.add(soundRow);
        this._settings.bind('notification-sound', soundRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    }

    _buildExtraPage(page) {
        const ramadanGroup = new Adw.PreferencesGroup({
            title: _('Ramazan Ayarları'),
            description: _('Sahur vakti ve Ramazan modu ayarları'),
        });
        page.add(ramadanGroup);

        const RAMADAN_MODES = {
            values: ['auto', 'on', 'off'],
            labels: [_('Otomatik (Hicri Takvim)'), _('Her Zaman Açık'), _('Kapalı')],
        };

        const ramadanModeRow = new Adw.ComboRow({
            title: _('Ramazan Modu'),
            subtitle: _('Sahur vaktinin ne zaman gösterileceğini belirler'),
        });
        ramadanModeRow.model = this._createDropdownModel(RAMADAN_MODES.labels);
        ramadanModeRow.selected = getIndexFromValue(RAMADAN_MODES, this._settings.get_string('ramadan-mode'));

        this._connectAndTrack(ramadanModeRow, 'notify::selected', () => {
            this._settings.set_string('ramadan-mode', getValueFromIndex(RAMADAN_MODES, ramadanModeRow.selected));
        });
        ramadanModeRow.add_suffix(this._createHelpButton(
            _('Otomatik: Hicri takvime göre Ramazan ayını otomatik tespit eder.\nHer Zaman: Yıl boyunca sahur vaktini gösterir.\nKapalı: Sahur vaktini gizler.')
        ));
        ramadanGroup.add(ramadanModeRow);

        const sahurEnabledRow = new Adw.SwitchRow({
            title: _('Sahur Bildirimi'),
            subtitle: _('Ramazan\'da sahur vaktini göster ve bildirim gönder'),
        });
        ramadanGroup.add(sahurEnabledRow);
        this._settings.bind('sahur-enabled', sahurEnabledRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const sahurMinutesRow = new Adw.SpinRow({
            title: _('Sahur Süresi'),
            subtitle: _('İmsak\'tan kaç dakika önce sahur vakti başlasın'),
            adjustment: new Gtk.Adjustment({
                lower: 15,
                upper: 90,
                step_increment: 5,
                page_increment: 15,
            }),
        });
        sahurMinutesRow.add_suffix(this._createHelpButton(
            _('İmsak vaktinden belirtilen dakika kadar önce sahur vakti başlar.')
        ));
        ramadanGroup.add(sahurMinutesRow);
        this._settings.bind('sahur-minutes-before', sahurMinutesRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        const tahajjudGroup = new Adw.PreferencesGroup({
            title: _('Teheccüd Ayarları'),
            description: _('Gecenin son üçte birinde kılınan nafile namaz'),
        });
        page.add(tahajjudGroup);

        const tahajjudEnabledRow = new Adw.SwitchRow({
            title: _('Teheccüd Bildirimi'),
            subtitle: _('Teheccüd vaktini göster ve bildirim gönder'),
        });
        tahajjudGroup.add(tahajjudEnabledRow);
        this._settings.bind('tahajjud-enabled', tahajjudEnabledRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const tahajjudOffsetRow = new Adw.SpinRow({
            title: _('Teheccüd Ofseti'),
            subtitle: _('Gecenin son üçte birinden kaç dakika kaydırılsın'),
            adjustment: new Gtk.Adjustment({
                lower: -60,
                upper: 60,
                step_increment: 5,
                page_increment: 15,
            }),
        });
        tahajjudOffsetRow.add_suffix(this._createHelpButton(
            _('Gecenin son üçte birinden belirtilen dakika kadar kaydırır.\nNegatif: daha erken, Pozitif: daha geç.')
        ));
        tahajjudGroup.add(tahajjudOffsetRow);
        this._settings.bind('tahajjud-offset-minutes', tahajjudOffsetRow, 'value', Gio.SettingsBindFlags.DEFAULT);
    }

    _buildDisplayPage(page) {
        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('Panel Görünümü'),
            description: _('Paneldeki görünüm ayarları'),
        });
        page.add(appearanceGroup);

        const showIconRow = new Adw.SwitchRow({
            title: _('İkonu Göster'),
            subtitle: _('Panelde cami ikonu'),
        });
        appearanceGroup.add(showIconRow);
        this._settings.bind('show-icon', showIconRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showNameRow = new Adw.SwitchRow({
            title: _('Vakit Adını Göster'),
            subtitle: _('"İkindi" gibi vakit ismi'),
        });
        appearanceGroup.add(showNameRow);
        this._settings.bind('show-prayer-name', showNameRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showTimeRow = new Adw.SwitchRow({
            title: _('Vakit Saatini Göster'),
            subtitle: _('"14:52" gibi saat bilgisi'),
        });
        appearanceGroup.add(showTimeRow);
        this._settings.bind('show-prayer-time', showTimeRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        this._showIconRow = showIconRow;
        this._showNameRow = showNameRow;
        this._showTimeRow = showTimeRow;

        const updateSensitivity = () => {
            const iconActive = this._settings.get_boolean('show-icon');
            const nameActive = this._settings.get_boolean('show-prayer-name');
            const timeActive = this._settings.get_boolean('show-prayer-time');

            const activeCount = [iconActive, nameActive, timeActive].filter(Boolean).length;

            this._showIconRow.sensitive = !(activeCount === 1 && iconActive);
            this._showNameRow.sensitive = !(activeCount === 1 && nameActive);
            this._showTimeRow.sensitive = !(activeCount === 1 && timeActive);
        };

        this._connectAndTrack(showIconRow, 'notify::active', updateSensitivity);
        this._connectAndTrack(showNameRow, 'notify::active', updateSensitivity);
        this._connectAndTrack(showTimeRow, 'notify::active', updateSensitivity);
        updateSensitivity();

        const countdownGroup = new Adw.PreferencesGroup({
            title: _('Geri Sayım'),
            description: _('Vakte kalan süre gösterimi'),
        });
        page.add(countdownGroup);

        const countdownRow = new Adw.SwitchRow({
            title: _('Geri Sayım Göster'),
            subtitle: _('Sonraki vakte kalan süreyi göster'),
        });
        countdownGroup.add(countdownRow);
        this._settings.bind('show-countdown', countdownRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const thresholdRow = new Adw.SpinRow({
            title: _('Geri Sayım Eşiği'),
            subtitle: _('Ne kadar süre kala geri sayım başlasın (dakika)'),
            adjustment: new Gtk.Adjustment({
                lower: 5,
                upper: 180,
                step_increment: 5,
                page_increment: 15,
            }),
        });
        thresholdRow.add_suffix(this._createHelpButton(
            _('Sonraki vakte bu kadar dakika veya daha az kaldığında panelde geri sayım başlar.')
        ));
        countdownGroup.add(thresholdRow);
        this._settings.bind('countdown-threshold-minutes', thresholdRow, 'value', Gio.SettingsBindFlags.DEFAULT);

        const positionGroup = new Adw.PreferencesGroup({
            title: _('Panel Konumu'),
        });
        page.add(positionGroup);

        const positionRow = new Adw.ComboRow({
            title: _('Konum'),
            subtitle: _('Extension panelde nerede gösterilecek'),
        });
        positionRow.model = this._createDropdownModel(PANEL_POSITIONS.labels.map(l => _(l)));
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
            label: `${_('Sürüm')} ${APP_VERSION}`,
            css_classes: ['dim-label'],
        }));

        group.add(headerBox);

        const infoGroup = new Adw.PreferencesGroup();
        page.add(infoGroup);

        infoGroup.add(new Adw.ActionRow({
            title: _('Geliştirici'),
            subtitle: `${APP_DEVELOPER} - Erhan ÜRGÜN`,
        }));

        infoGroup.add(new Adw.ActionRow({
            title: _('Lisans'),
            subtitle: 'GPL-3.0',
        }));

        const linksGroup = new Adw.PreferencesGroup({
            title: _('Bağlantılar'),
        });
        page.add(linksGroup);

        this._addLinkRow(linksGroup, _('Tüm Bağlantılar'), `${APP_WEBSITE} - ${_('Geliştirici hakkında')}`, APP_WEBSITE);
        this._addLinkRow(linksGroup, 'GitHub', _('Kaynak kodu görüntüle'), 'https://github.com/erhanurgun/LINUX-ubuntu-gnome-praytime-extension');
        this._addLinkRow(linksGroup, _('Hata Bildir'), _('Sorun veya önerileri bildirin'), 'https://github.com/erhanurgun/LINUX-ubuntu-gnome-praytime-extension/issues');
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
