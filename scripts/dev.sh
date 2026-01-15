#!/bin/bash
# Praytime GNOME Extension - Gelistirme Scripti
# Kod degisikliklerini hizlica test etmek icin kullanilir
# Kullanim: ./scripts/dev.sh [--watch]

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Degiskenler
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EXTENSION_UUID="praytime@erho.dev"
EXTENSIONS_DIR="$HOME/.local/share/gnome-shell/extensions"
TARGET_DIR="$EXTENSIONS_DIR/$EXTENSION_UUID"

# Fonksiyonlar
sync_files() {
    echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${BLUE}Dosyalar senkronize ediliyor...${NC}"

    # Hedef dizini olustur (yoksa)
    mkdir -p "$TARGET_DIR"

    # Dosyalari kopyala
    cd "$PROJECT_DIR"
    cp -r extension.js "$TARGET_DIR/"
    cp -r prefs.js "$TARGET_DIR/"
    cp -r metadata.json "$TARGET_DIR/"
    cp -r stylesheet.css "$TARGET_DIR/"
    cp -r schemas "$TARGET_DIR/"
    cp -r src "$TARGET_DIR/"
    cp -r icons "$TARGET_DIR/"

    # Schema derle
    glib-compile-schemas "$TARGET_DIR/schemas/" 2>/dev/null

    echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${GREEN}[OK] Senkronizasyon tamamlandi${NC}"
}

reload_extension() {
    echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${BLUE}Uzanti yeniden yukleniyor...${NC}"

    # Devre disi birak
    gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true
    sleep 0.5

    # Etkinlestir
    gnome-extensions enable "$EXTENSION_UUID" 2>/dev/null || {
        echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${YELLOW}[!] Uzanti etkinlestirilemedi - GNOME Shell restart gerekebilir${NC}"
        return 1
    }

    echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${GREEN}[OK] Uzanti yeniden yuklendi${NC}"
}

show_status() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Praytime Gelistirme Modu${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "Proje: ${CYAN}$PROJECT_DIR${NC}"
    echo -e "Hedef: ${CYAN}$TARGET_DIR${NC}"
    echo ""
}

# Ana islem
show_status

# Watch modu kontrolu
if [ "$1" == "--watch" ] || [ "$1" == "-w" ]; then
    echo -e "${YELLOW}[*] Watch modu aktif - Ctrl+C ile cikis${NC}"
    echo -e "${YELLOW}    Degisiklikler otomatik senkronize edilecek${NC}"
    echo ""

    # inotifywait kontrolu
    if ! command -v inotifywait &> /dev/null; then
        echo -e "${RED}[HATA] inotify-tools paketi gerekli${NC}"
        echo -e "${YELLOW}       sudo apt install inotify-tools${NC}"
        exit 1
    fi

    # Ilk senkronizasyon
    sync_files
    reload_extension

    # Degisiklikleri izle
    echo ""
    echo -e "${BLUE}[*] Dosya degisiklikleri izleniyor...${NC}"
    echo ""

    while true; do
        inotifywait -r -e modify,create,delete \
            --exclude '(\.git|scripts|\.idea|__pycache__|\.pyc)' \
            "$PROJECT_DIR" 2>/dev/null | while read -r directory events filename; do

            # Sadece ilgili dosyalar icin
            if [[ "$filename" =~ \.(js|css|json|svg)$ ]]; then
                echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${YELLOW}Degisiklik: $filename${NC}"
                sync_files
                reload_extension
                echo ""
            fi
        done
    done
else
    # Tek seferlik senkronizasyon ve reload
    sync_files
    reload_extension

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Gelistirme Senkronizasyonu Tamamlandi${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Faydali komutlar:"
    echo -e "  ${YELLOW}./scripts/dev.sh --watch${NC}  - Otomatik senkronizasyon"
    echo -e "  ${YELLOW}./scripts/logs.sh${NC}        - Loglari goster"
    echo -e "  ${YELLOW}./scripts/clean.sh${NC}       - Kalintilari temizle"
    echo ""
fi
