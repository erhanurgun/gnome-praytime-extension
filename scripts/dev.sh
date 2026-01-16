#!/bin/bash
# Praytime GNOME Extension - Geliştirme Scripti
# Kod değişikliklerini hızlıca test etmek için kullanılır
# Kullanım: ./scripts/dev.sh [--watch]

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Değişkenler
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EXTENSION_UUID="praytime@erho.dev"
EXTENSIONS_DIR="$HOME/.local/share/gnome-shell/extensions"
TARGET_DIR="$EXTENSIONS_DIR/$EXTENSION_UUID"

# Fonksiyonlar
sync_files() {
    echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${BLUE}Dosyalar senkronize ediliyor...${NC}"

    # Hedef dizini oluştur (yoksa)
    mkdir -p "$TARGET_DIR"

    # Dosyaları kopyala
    cd "$PROJECT_DIR"
    cp -r extension.js "$TARGET_DIR/"
    cp -r prefs.js "$TARGET_DIR/"
    cp -r metadata.json "$TARGET_DIR/"
    cp -r stylesheet.css "$TARGET_DIR/"
    cp -r schemas "$TARGET_DIR/"
    cp -r src "$TARGET_DIR/"
    cp -r icons "$TARGET_DIR/"
    cp -r sounds "$TARGET_DIR/"

    # Schema derle
    glib-compile-schemas "$TARGET_DIR/schemas/" 2>/dev/null

    echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${GREEN}[OK] Senkronizasyon tamamlandı${NC}"
}

reload_extension() {
    echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${BLUE}Uzantı yeniden yükleniyor...${NC}"

    # Devre dışı bırak
    gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true
    sleep 0.5

    # Etkinleştir
    gnome-extensions enable "$EXTENSION_UUID" 2>/dev/null || {
        echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${YELLOW}[!] Uzantı etkinleştirilemedi - GNOME Shell restart gerekebilir${NC}"
        return 1
    }

    echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${GREEN}[OK] Uzantı yeniden yüklendi${NC}"
}

show_status() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Praytime Geliştirme Modu${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "Proje: ${CYAN}$PROJECT_DIR${NC}"
    echo -e "Hedef: ${CYAN}$TARGET_DIR${NC}"
    echo ""
}

# Ana işlem
show_status

# Watch modu kontrolü
if [ "$1" == "--watch" ] || [ "$1" == "-w" ]; then
    echo -e "${YELLOW}[*] Watch modu aktif - Ctrl+C ile çıkış${NC}"
    echo -e "${YELLOW}    Değişiklikler otomatik senkronize edilecek${NC}"
    echo ""

    # inotifywait kontrolü
    if ! command -v inotifywait &> /dev/null; then
        echo -e "${RED}[HATA] inotify-tools paketi gerekli${NC}"
        echo -e "${YELLOW}       sudo apt install inotify-tools${NC}"
        exit 1
    fi

    # İlk senkronizasyon
    sync_files
    reload_extension

    # Değişiklikleri izle
    echo ""
    echo -e "${BLUE}[*] Dosya değişiklikleri izleniyor...${NC}"
    echo ""

    while true; do
        inotifywait -r -e modify,create,delete \
            --exclude '(\.git|scripts|\.idea|__pycache__|\.pyc)' \
            "$PROJECT_DIR" 2>/dev/null | while read -r directory events filename; do

            # Sadece ilgili dosyalar için
            if [[ "$filename" =~ \.(js|css|json|svg)$ ]]; then
                echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} ${YELLOW}Değişiklik: $filename${NC}"
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
    echo -e "${GREEN}  Geliştirme Senkronizasyonu Tamamlandı${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Faydalı komutlar:"
    echo -e "  ${YELLOW}./scripts/dev.sh --watch${NC}  - Otomatik senkronizasyon"
    echo -e "  ${YELLOW}./scripts/logs.sh${NC}        - Logları göster"
    echo -e "  ${YELLOW}./scripts/clean.sh${NC}       - Kalıntıları temizle"
    echo ""
fi
