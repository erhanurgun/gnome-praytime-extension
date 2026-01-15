#!/bin/bash
# Praytime GNOME Extension - Kaldırma Scripti
# Uzantıyı ve ayarlarını tamamen kaldırır

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Değişkenler
EXTENSION_UUID="praytime@erho.dev"
EXTENSIONS_DIR="$HOME/.local/share/gnome-shell/extensions"
TARGET_DIR="$EXTENSIONS_DIR/$EXTENSION_UUID"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Praytime Extension Kaldırma${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Kurulum kontrolü
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}[!] Uzantı kurulu değil${NC}"
    echo -e "${YELLOW}    Konum: $TARGET_DIR${NC}"
    exit 0
fi

# Uzantıyı devre dışı bırak
echo -e "${BLUE}[*] Uzantı devre dışı bırakılıyor...${NC}"
gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true
echo -e "${GREEN}[OK] Uzantı devre dışı bırakıldı${NC}"

# Dosyaları sil
echo -e "${BLUE}[*] Dosyalar siliniyor...${NC}"
rm -rf "$TARGET_DIR"
echo -e "${GREEN}[OK] Dosyalar silindi${NC}"

# Ayarları sıfırla (opsiyonel)
read -p "$(echo -e ${YELLOW}[?] Ayarlar da silinsin mi? [e/H]: ${NC})" -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ee]$ ]]; then
    echo -e "${BLUE}[*] Ayarlar sıfırlanıyor...${NC}"
    dconf reset -f /org/gnome/shell/extensions/praytime/ 2>/dev/null || true
    echo -e "${GREEN}[OK] Ayarlar sıfırlandı${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Kaldırma Tamamlandı!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Not: GNOME Shell'i yeniden başlatmanız gerekebilir${NC}"
echo -e "  - X11: Alt+F2 > r > Enter"
echo -e "  - Wayland: Oturumu kapat/aç"
echo ""
