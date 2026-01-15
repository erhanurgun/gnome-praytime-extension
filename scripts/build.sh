#!/bin/bash
# Praytime GNOME Extension - Build Scripti
# extensions.gnome.org için zip paketi oluşturur

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Değişkenler
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EXTENSION_UUID="praytime@erho.dev"

# metadata.json'dan sürüm bilgisi al
VERSION=$(grep -o '"version-name": "[^"]*"' "$PROJECT_DIR/metadata.json" | cut -d'"' -f4)
OUTPUT_FILE="$PROJECT_DIR/${EXTENSION_UUID}_v${VERSION}.zip"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Praytime Extension Build${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Sürüm: ${CYAN}$VERSION${NC}"
echo ""

cd "$PROJECT_DIR"

# Önceki build'i temizle
rm -f "$OUTPUT_FILE" 2>/dev/null || true
rm -f "${EXTENSION_UUID}.zip" 2>/dev/null || true

# Schema derle
echo -e "${BLUE}[*] Schema derleniyor...${NC}"
glib-compile-schemas schemas/
echo -e "${GREEN}[OK] Schema derlendi${NC}"

# Zip paketi oluştur
echo -e "${BLUE}[*] Zip paketi oluşturuluyor...${NC}"

zip -r "$OUTPUT_FILE" \
    extension.js \
    prefs.js \
    metadata.json \
    stylesheet.css \
    schemas/ \
    src/ \
    icons/ \
    --exclude "*.pyc" \
    --exclude "__pycache__/*" \
    --exclude ".git/*" \
    --exclude ".idea/*" \
    --exclude "*.tmp"

echo -e "${GREEN}[OK] Zip paketi oluşturuldu${NC}"

# Dosya boyutu
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Build Tamamlandı!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Çıktı: ${CYAN}$OUTPUT_FILE${NC}"
echo -e "Boyut: ${CYAN}$FILE_SIZE${NC}"
echo ""
echo -e "${YELLOW}extensions.gnome.org'a yüklemek için:${NC}"
echo -e "  1. https://extensions.gnome.org/upload/ adresine gidin"
echo -e "  2. Zip dosyasını seçin ve yükleyin"
echo ""

# Zip içeriğini göster (opsiyonel)
read -p "$(echo -e ${YELLOW}[?] Zip içeriğini göster? [e/H]: ${NC})" -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ee]$ ]]; then
    echo ""
    echo -e "${BLUE}Zip içeriği:${NC}"
    unzip -l "$OUTPUT_FILE"
fi
