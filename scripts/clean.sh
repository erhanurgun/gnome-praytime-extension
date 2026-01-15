#!/bin/bash
# Praytime GNOME Extension - Temizlik Scripti
# Derlenmis dosyalari, cache'i ve kalintilari temizler

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
echo -e "${BLUE}  Praytime Extension Temizlik${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Proje dizinindeki kalintilari temizle
echo -e "${BLUE}[*] Proje kalintilari temizleniyor...${NC}"

cd "$PROJECT_DIR"

# Derlenmis schema dosyalari
if [ -f "schemas/gschemas.compiled" ]; then
    rm -f "schemas/gschemas.compiled"
    echo -e "${GREEN}    [OK] schemas/gschemas.compiled silindi${NC}"
fi

# Python cache (varsa)
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# IDE dosyalari (opsiyonel - .gitignore'da olmali)
# rm -rf .idea .vscode

# Gecici dosyalar
find . -type f -name "*.tmp" -delete 2>/dev/null || true
find . -type f -name "*~" -delete 2>/dev/null || true
find . -type f -name ".DS_Store" -delete 2>/dev/null || true

# Build ciktilari
rm -f praytime@erho.dev.zip 2>/dev/null || true
rm -rf dist/ 2>/dev/null || true

echo -e "${GREEN}[OK] Proje kalintilari temizlendi${NC}"

# Kurulu uzanti temizligi (opsiyonel)
echo ""
read -p "$(echo -e ${YELLOW}[?] Kurulu uzanti da temizlensin mi? [e/H]: ${NC})" -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ee]$ ]]; then
    if [ -d "$TARGET_DIR" ]; then
        echo -e "${BLUE}[*] Kurulu uzanti temizleniyor...${NC}"

        # Uzantiyi devre disi birak
        gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true

        # Sil
        rm -rf "$TARGET_DIR"
        echo -e "${GREEN}[OK] Kurulu uzanti silindi${NC}"

        # Ayarlari sifirla
        read -p "$(echo -e ${YELLOW}[?] Ayarlar da silinsin mi? [e/H]: ${NC})" -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Ee]$ ]]; then
            dconf reset -f /org/gnome/shell/extensions/praytime/ 2>/dev/null || true
            echo -e "${GREEN}[OK] Ayarlar sifirlandi${NC}"
        fi
    else
        echo -e "${YELLOW}[!] Kurulu uzanti bulunamadi${NC}"
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Temizlik Tamamlandi!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
