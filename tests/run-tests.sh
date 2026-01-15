#!/bin/bash
# Praytime Birim Test Runner
# Node.js ile çalıştırılır

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  Praytime Birim Testleri v0.5.0"
echo "=========================================="

FAILED=0

# Domain Testleri
echo -e "\n--- Domain Testleri ---"

echo -e "\n[1/7] PrayerTime testleri çalıştırılıyor..."
if node domain/PrayerTime.test.js; then
    echo "PrayerTime testleri başarılı"
else
    echo "PrayerTime testleri başarısız!"
    FAILED=1
fi

echo -e "\n[2/7] Location testleri çalıştırılıyor..."
if node domain/Location.test.js; then
    echo "Location testleri başarılı"
else
    echo "Location testleri başarısız!"
    FAILED=1
fi

echo -e "\n[3/7] PrayerSchedule testleri çalıştırılıyor..."
if node domain/PrayerSchedule.test.js; then
    echo "PrayerSchedule testleri başarılı"
else
    echo "PrayerSchedule testleri başarısız!"
    FAILED=1
fi

echo -e "\n[4/7] NullHandling testleri çalıştırılıyor..."
if node domain/NullHandling.test.js; then
    echo "NullHandling testleri başarılı"
else
    echo "NullHandling testleri başarısız!"
    FAILED=1
fi

echo -e "\n[5/7] Constants testleri çalıştırılıyor..."
if node domain/Constants.test.js; then
    echo "Constants testleri başarılı"
else
    echo "Constants testleri başarısız!"
    FAILED=1
fi

# Application Testleri
echo -e "\n--- Application Testleri ---"

echo -e "\n[6/7] TimerManager testleri çalıştırılıyor..."
if node application/TimerManager.test.js; then
    echo "TimerManager testleri başarılı"
else
    echo "TimerManager testleri başarısız!"
    FAILED=1
fi

echo -e "\n[7/7] NotificationScheduler testleri çalıştırılıyor..."
if node application/NotificationScheduler.test.js; then
    echo "NotificationScheduler testleri başarılı"
else
    echo "NotificationScheduler testleri başarısız!"
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
