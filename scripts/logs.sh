#!/bin/bash
# Praytime GNOME Extension - Log Scripti
# GNOME Shell loglarını filtreli olarak gösterir

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Değişkenler
EXTENSION_UUID="praytime@erho.dev"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Praytime Extension Loglar${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Ctrl+C ile çıkış${NC}"
echo ""

# Log modu seçimi
echo -e "Log modu seçin:"
echo -e "  ${CYAN}1${NC}) Canlı log takibi (varsayılan)"
echo -e "  ${CYAN}2${NC}) Son 50 satır"
echo -e "  ${CYAN}3${NC}) Sadece hatalar"
echo -e "  ${CYAN}4${NC}) Tüm GNOME Shell logları"
echo ""
read -p "$(echo -e ${YELLOW}Seçiminiz [1-4]: ${NC})" -n 1 -r choice
echo ""
echo ""

case $choice in
    2)
        echo -e "${BLUE}[*] Son 50 log satırı:${NC}"
        echo ""
        journalctl --user -b -o cat | grep -i "praytime\|$EXTENSION_UUID" | tail -50
        ;;
    3)
        echo -e "${BLUE}[*] Sadece hatalar:${NC}"
        echo ""
        journalctl --user -b -p err -o cat | grep -i "praytime\|$EXTENSION_UUID"
        ;;
    4)
        echo -e "${BLUE}[*] Tüm GNOME Shell logları (canlı):${NC}"
        echo ""
        journalctl --user -f -o cat /usr/bin/gnome-shell
        ;;
    *)
        echo -e "${BLUE}[*] Praytime logları (canlı):${NC}"
        echo ""
        journalctl --user -f -o cat | grep -i --line-buffered "praytime\|$EXTENSION_UUID"
        ;;
esac
