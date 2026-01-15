#!/bin/bash
# Praytime Birim Test Runner
# Node.js ile çalıştırılır

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  Praytime Birim Testleri v0.4.0"
echo "=========================================="

FAILED=0

# PrayerTime testleri
echo -e "\n[1/5] PrayerTime testleri çalıştırılıyor..."
if node domain/PrayerTime.test.js; then
    echo "PrayerTime testleri başarılı"
else
    echo "PrayerTime testleri başarısız!"
    FAILED=1
fi

# Location testleri
echo -e "\n[2/5] Location testleri çalıştırılıyor..."
if node domain/Location.test.js; then
    echo "Location testleri başarılı"
else
    echo "Location testleri başarısız!"
    FAILED=1
fi

# PrayerSchedule testleri
echo -e "\n[3/5] PrayerSchedule testleri çalıştırılıyor..."
if node domain/PrayerSchedule.test.js; then
    echo "PrayerSchedule testleri başarılı"
else
    echo "PrayerSchedule testleri başarısız!"
    FAILED=1
fi

# NullHandling testleri
echo -e "\n[4/5] NullHandling testleri çalıştırılıyor..."
if node domain/NullHandling.test.js; then
    echo "NullHandling testleri başarılı"
else
    echo "NullHandling testleri başarısız!"
    FAILED=1
fi

# Constants testleri
echo -e "\n[5/5] Constants testleri çalıştırılıyor..."
if node domain/Constants.test.js; then
    echo "Constants testleri başarılı"
else
    echo "Constants testleri başarısız!"
    FAILED=1
fi

echo -e "\n=========================================="
if [ $FAILED -eq 0 ]; then
    echo "  Tüm testler başarılı!"
    echo "=========================================="
    exit 0
else
    echo "  Bazı testler başarısız!"
    echo "=========================================="
    exit 1
fi
