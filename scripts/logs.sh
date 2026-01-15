#!/bin/bash
# Praytime GNOME Extension - Log Scripti
# GNOME Shell loglarini filtreli olarak gosterir

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Degiskenler
EXTENSION_UUID="praytime@erho.dev"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Praytime Extension Loglar${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Ctrl+C ile cikis${NC}"
echo ""

# Log modu secimi
echo -e "Log modu secin:"
echo -e "  ${CYAN}1${NC}) Canli log takibi (varsayilan)"
echo -e "  ${CYAN}2${NC}) Son 50 satir"
echo -e "  ${CYAN}3${NC}) Sadece hatalar"
echo -e "  ${CYAN}4${NC}) Tum GNOME Shell loglari"
echo ""
read -p "$(echo -e ${YELLOW}Seciminiz [1-4]: ${NC})" -n 1 -r choice
echo ""
echo ""

case $choice in
    2)
        echo -e "${BLUE}[*] Son 50 log satiri:${NC}"
        echo ""
        journalctl --user -b -o cat | grep -i "praytime\|$EXTENSION_UUID" | tail -50
        ;;
    3)
        echo -e "${BLUE}[*] Sadece hatalar:${NC}"
        echo ""
        journalctl --user -b -p err -o cat | grep -i "praytime\|$EXTENSION_UUID"
        ;;
    4)
        echo -e "${BLUE}[*] Tum GNOME Shell loglari (canli):${NC}"
        echo ""
        journalctl --user -f -o cat /usr/bin/gnome-shell
        ;;
    *)
        echo -e "${BLUE}[*] Praytime loglari (canli):${NC}"
        echo ""
        journalctl --user -f -o cat | grep -i --line-buffered "praytime\|$EXTENSION_UUID"
        ;;
esac
