#!/bin/bash
# Praytime GNOME Extension - Kaldirma Scripti
# Uzantiyi ve ayarlarini tamamen kaldirir

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Degiskenler
EXTENSION_UUID="praytime@erho.dev"
EXTENSIONS_DIR="$HOME/.local/share/gnome-shell/extensions"
TARGET_DIR="$EXTENSIONS_DIR/$EXTENSION_UUID"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Praytime Extension Kaldirma${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Kurulum kontrolu
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}[!] Uzanti kurulu degil${NC}"
    echo -e "${YELLOW}    Konum: $TARGET_DIR${NC}"
    exit 0
fi

# Uzantiyi devre disi birak
echo -e "${BLUE}[*] Uzanti devre disi birakiliyor...${NC}"
gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true
echo -e "${GREEN}[OK] Uzanti devre disi birakildi${NC}"

# Dosyalari sil
echo -e "${BLUE}[*] Dosyalar siliniyor...${NC}"
rm -rf "$TARGET_DIR"
echo -e "${GREEN}[OK] Dosyalar silindi${NC}"

# Ayarlari sifirla (opsiyonel)
read -p "$(echo -e ${YELLOW}[?] Ayarlar da silinsin mi? [e/H]: ${NC})" -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ee]$ ]]; then
    echo -e "${BLUE}[*] Ayarlar sifirlaniyor...${NC}"
    dconf reset -f /org/gnome/shell/extensions/praytime/ 2>/dev/null || true
    echo -e "${GREEN}[OK] Ayarlar sifirlandi${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Kaldirma Tamamlandi!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Not: GNOME Shell'i yeniden baslatmaniz gerekebilir${NC}"
echo -e "  - X11: Alt+F2 > r > Enter"
echo -e "  - Wayland: Oturumu kapat/ac"
echo ""
