#!/bin/bash
# Praytime GNOME Extension - Kurulum Scripti
# Uzantiyi ~/.local/share/gnome-shell/extensions/ dizinine kurar

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Degiskenler
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EXTENSION_UUID="praytime@erho.dev"
EXTENSIONS_DIR="$HOME/.local/share/gnome-shell/extensions"
TARGET_DIR="$EXTENSIONS_DIR/$EXTENSION_UUID"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Praytime Extension Kurulum${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Mevcut kurulumu kontrol et
if [ -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}[!] Mevcut kurulum tespit edildi${NC}"
    echo -e "${YELLOW}    Onceki kurulum kaldirilacak...${NC}"

    # Uzantiyi devre disi birak
    gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true

    # Eski dosyalari sil
    rm -rf "$TARGET_DIR"
    echo -e "${GREEN}[OK] Eski kurulum kaldirildi${NC}"
fi

# Hedef dizini olustur
echo -e "${BLUE}[*] Hedef dizin olusturuluyor...${NC}"
mkdir -p "$TARGET_DIR"

# Dosyalari kopyala (scripts ve git haric)
echo -e "${BLUE}[*] Dosyalar kopyalaniyor...${NC}"
cd "$PROJECT_DIR"

# Kopyalanacak dosya ve dizinler
cp -r extension.js "$TARGET_DIR/"
cp -r prefs.js "$TARGET_DIR/"
cp -r metadata.json "$TARGET_DIR/"
cp -r stylesheet.css "$TARGET_DIR/"
cp -r schemas "$TARGET_DIR/"
cp -r src "$TARGET_DIR/"
cp -r icons "$TARGET_DIR/"

echo -e "${GREEN}[OK] Dosyalar kopyalandi${NC}"

# Schema derle
echo -e "${BLUE}[*] Schema derleniyor...${NC}"
glib-compile-schemas "$TARGET_DIR/schemas/"
echo -e "${GREEN}[OK] Schema derlendi${NC}"

# Uzantiyi etkinlestir
echo -e "${BLUE}[*] Uzanti etkinlestiriliyor...${NC}"
gnome-extensions enable "$EXTENSION_UUID" 2>/dev/null || {
    echo -e "${YELLOW}[!] Uzanti etkinlestirilemedi${NC}"
    echo -e "${YELLOW}    GNOME Shell'i yeniden baslatin:${NC}"
    echo -e "${YELLOW}    - X11: Alt+F2 > r > Enter${NC}"
    echo -e "${YELLOW}    - Wayland: Oturumu kapat/ac${NC}"
}

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Kurulum Tamamlandi!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Uzanti konumu: ${BLUE}$TARGET_DIR${NC}"
echo ""
echo -e "Faydali komutlar:"
echo -e "  ${YELLOW}gnome-extensions show $EXTENSION_UUID${NC}  - Durum goster"
echo -e "  ${YELLOW}gnome-extensions prefs $EXTENSION_UUID${NC} - Ayarlar"
echo ""
