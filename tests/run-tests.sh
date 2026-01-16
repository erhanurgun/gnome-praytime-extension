#!/bin/bash
#══════════════════════════════════════════════════════════════════════════════
#  Praytime Test Runner v0.6.2
#  Gelişmiş test çalıştırıcı - renkli çıktı, paralel mod, watch desteği
#══════════════════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

#──────────────────────────────────────────────────────────────────────────────
# Renkler ve Stiller
#──────────────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Semboller
CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
ARROW="${CYAN}➜${NC}"
DOT="${GRAY}●${NC}"
STAR="${YELLOW}★${NC}"

#──────────────────────────────────────────────────────────────────────────────
# Test Tanımları
#──────────────────────────────────────────────────────────────────────────────
declare -A TESTS=(
    ["PrayerTime"]="domain/PrayerTime.test.js"
    ["Location"]="domain/Location.test.js"
    ["PrayerSchedule"]="domain/PrayerSchedule.test.js"
    ["NullHandling"]="domain/NullHandling.test.js"
    ["Constants"]="domain/Constants.test.js"
    ["LocationProvider"]="infrastructure/LocationProvider.test.js"
    ["TimerManager"]="application/TimerManager.test.js"
    ["NotificationScheduler"]="application/NotificationScheduler.test.js"
    ["PrayerTimeService"]="application/PrayerTimeService.test.js"
)

# Kategori sıralaması
DOMAIN_TESTS=("PrayerTime" "Location" "PrayerSchedule" "NullHandling" "Constants")
INFRA_TESTS=("LocationProvider")
APP_TESTS=("TimerManager" "NotificationScheduler" "PrayerTimeService")

#──────────────────────────────────────────────────────────────────────────────
# Yardımcı Fonksiyonlar
#──────────────────────────────────────────────────────────────────────────────
print_header() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${WHITE}${BOLD}Praytime Test Runner${NC}  ${DIM}v0.6.2${NC}                              ${BLUE}║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
}

print_section() {
    local title="$1"
    local color="${2:-$YELLOW}"
    echo ""
    echo -e "${color}┌─────────────────────────────────────┐${NC}"
    echo -e "${color}│${NC} ${BOLD}$title${NC}"
    echo -e "${color}└─────────────────────────────────────┘${NC}"
}

print_result_line() {
    local status="$1"
    local name="$2"
    local details="$3"

    if [ "$status" = "pass" ]; then
        echo -e "  ${CHECK} ${GREEN}${name}${NC} ${DIM}${details}${NC}"
    else
        echo -e "  ${CROSS} ${RED}${name}${NC} ${DIM}${details}${NC}"
    fi
}

print_summary() {
    local passed="$1"
    local failed="$2"
    local total="$3"
    local duration="$4"

    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"

    if [ "$failed" -eq 0 ]; then
        echo -e "  ${CHECK} ${GREEN}${BOLD}Tüm testler başarılı!${NC}"
        echo -e "     ${WHITE}$passed${NC}/${WHITE}$total${NC} test ${DIM}(${duration}s)${NC}"
    else
        echo -e "  ${CROSS} ${RED}${BOLD}$failed test başarısız${NC}"
        echo -e "     ${GREEN}$passed başarılı${NC} / ${RED}$failed başarısız${NC} / ${WHITE}$total toplam${NC} ${DIM}(${duration}s)${NC}"
    fi

    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

show_help() {
    print_header
    echo ""
    echo -e "${WHITE}Kullanım:${NC}"
    echo -e "  ${CYAN}./run-tests.sh${NC}                    Tüm testleri çalıştır"
    echo -e "  ${CYAN}./run-tests.sh${NC} ${YELLOW}<test-adı>${NC}         Tek test çalıştır"
    echo -e "  ${CYAN}./run-tests.sh${NC} ${YELLOW}<kategori>${NC}         Kategori testleri"
    echo ""
    echo -e "${WHITE}Seçenekler:${NC}"
    echo -e "  ${GREEN}-p, --parallel${NC}     Paralel çalıştır (en hızlı)"
    echo -e "  ${GREEN}-q, --quick${NC}        Hızlı mod (sadece özet)"
    echo -e "  ${GREEN}-w, --watch${NC}        Watch modu (otomatik çalıştır)"
    echo -e "  ${GREEN}-v, --verbose${NC}      Detaylı çıktı"
    echo -e "  ${GREEN}-l, --list${NC}         Test listesini göster"
    echo -e "  ${GREEN}-h, --help${NC}         Bu yardımı göster"
    echo ""
    echo -e "${WHITE}Örnekler:${NC}"
    echo -e "  ${DIM}# Tek test çalıştır${NC}"
    echo -e "  ${CYAN}./run-tests.sh PrayerTime${NC}"
    echo ""
    echo -e "  ${DIM}# Domain testlerini çalıştır${NC}"
    echo -e "  ${CYAN}./run-tests.sh domain${NC}"
    echo ""
    echo -e "  ${DIM}# Paralel + hızlı mod${NC}"
    echo -e "  ${CYAN}./run-tests.sh -p -q${NC}"
    echo ""
    echo -e "  ${DIM}# Watch modunda tek test${NC}"
    echo -e "  ${CYAN}./run-tests.sh -w PrayerTime${NC}"
    echo ""
    echo -e "${WHITE}Kategoriler:${NC} ${YELLOW}domain${NC}, ${YELLOW}infrastructure${NC}, ${YELLOW}application${NC}"
    echo ""
}

show_list() {
    print_header
    echo ""
    echo -e "${WHITE}Mevcut Testler:${NC}"
    echo ""

    echo -e "  ${YELLOW}Domain${NC} ${DIM}(5 test)${NC}"
    for name in "${DOMAIN_TESTS[@]}"; do
        echo -e "    ${DOT} $name"
    done
    echo ""

    echo -e "  ${MAGENTA}Infrastructure${NC} ${DIM}(1 test)${NC}"
    for name in "${INFRA_TESTS[@]}"; do
        echo -e "    ${DOT} $name"
    done
    echo ""

    echo -e "  ${CYAN}Application${NC} ${DIM}(3 test)${NC}"
    for name in "${APP_TESTS[@]}"; do
        echo -e "    ${DOT} $name"
    done
    echo ""

    echo -e "${DIM}Toplam: 9 test dosyası${NC}"
    echo ""
}

#──────────────────────────────────────────────────────────────────────────────
# Test Çalıştırma Fonksiyonları
#──────────────────────────────────────────────────────────────────────────────
run_single_test() {
    local name="$1"
    local quiet="$2"
    local verbose="$3"
    local file="${TESTS[$name]}"

    if [ -z "$file" ]; then
        case "$name" in
            domain|Domain)
                run_category "domain" "$quiet" "$verbose"
                return $?
                ;;
            infrastructure|Infrastructure|infra)
                run_category "infrastructure" "$quiet" "$verbose"
                return $?
                ;;
            application|Application|app)
                run_category "application" "$quiet" "$verbose"
                return $?
                ;;
            *)
                echo -e "${CROSS} ${RED}Hata:${NC} '$name' bulunamadı"
                echo -e "  ${DIM}Mevcut testler için: ./run-tests.sh --list${NC}"
                return 1
                ;;
        esac
    fi

    if [ "$quiet" = "true" ]; then
        if node "$file" > /dev/null 2>&1; then
            print_result_line "pass" "$name" ""
            return 0
        else
            print_result_line "fail" "$name" ""
            return 1
        fi
    else
        echo -e "\n${ARROW} ${WHITE}$name${NC} testleri çalıştırılıyor..."
        echo -e "${DIM}─────────────────────────────────────${NC}"

        local output
        local exit_code

        set +e
        output=$(node "$file" 2>&1)
        exit_code=$?
        set -e

        if [ "$verbose" = "true" ]; then
            echo "$output"
        else
            # Sadece sonuç satırlarını göster
            echo "$output" | grep -E "^\s*\[(BAŞARILI|HATALI|BASARILI|BASARISIZ)\]" | head -20
            local total_line=$(echo "$output" | grep "^Toplam:" || true)
            if [ -n "$total_line" ]; then
                echo -e "${DIM}$total_line${NC}"
            fi
        fi

        echo -e "${DIM}─────────────────────────────────────${NC}"

        if [ $exit_code -eq 0 ]; then
            echo -e "${CHECK} ${GREEN}$name başarılı${NC}"
            return 0
        else
            echo -e "${CROSS} ${RED}$name başarısız!${NC}"
            return 1
        fi
    fi
}

run_category() {
    local category="$1"
    local quiet="$2"
    local verbose="$3"
    local failed=0
    local passed=0
    local tests_array

    case "$category" in
        domain)
            tests_array=("${DOMAIN_TESTS[@]}")
            print_section "Domain Testleri" "$YELLOW"
            ;;
        infrastructure)
            tests_array=("${INFRA_TESTS[@]}")
            print_section "Infrastructure Testleri" "$MAGENTA"
            ;;
        application)
            tests_array=("${APP_TESTS[@]}")
            print_section "Application Testleri" "$CYAN"
            ;;
    esac

    for name in "${tests_array[@]}"; do
        set +e
        run_single_test "$name" "$quiet" "$verbose"
        local result=$?
        set -e

        if [ $result -eq 0 ]; then
            ((passed++)) || true
        else
            ((failed++)) || true
        fi
    done

    [ $failed -eq 0 ]
}

run_all_tests() {
    local quiet="$1"
    local verbose="$2"
    local failed=0
    local passed=0
    local total=0
    local start_time=$(date +%s)

    print_header

    # Domain
    print_section "Domain Testleri" "$YELLOW"
    for name in "${DOMAIN_TESTS[@]}"; do
        ((total++)) || true
        set +e
        run_single_test "$name" "$quiet" "$verbose"
        local result=$?
        set -e
        if [ $result -eq 0 ]; then
            ((passed++)) || true
        else
            ((failed++)) || true
        fi
    done

    # Infrastructure
    print_section "Infrastructure Testleri" "$MAGENTA"
    for name in "${INFRA_TESTS[@]}"; do
        ((total++)) || true
        set +e
        run_single_test "$name" "$quiet" "$verbose"
        local result=$?
        set -e
        if [ $result -eq 0 ]; then
            ((passed++)) || true
        else
            ((failed++)) || true
        fi
    done

    # Application
    print_section "Application Testleri" "$CYAN"
    for name in "${APP_TESTS[@]}"; do
        ((total++)) || true
        set +e
        run_single_test "$name" "$quiet" "$verbose"
        local result=$?
        set -e
        if [ $result -eq 0 ]; then
            ((passed++)) || true
        else
            ((failed++)) || true
        fi
    done

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    print_summary "$passed" "$failed" "$total" "$duration"

    [ $failed -eq 0 ]
}

#──────────────────────────────────────────────────────────────────────────────
# Paralel Çalıştırma
#──────────────────────────────────────────────────────────────────────────────
run_parallel() {
    local quiet="$1"
    local start_time=$(date +%s)

    print_header
    print_section "Paralel Test Modu" "$BLUE"

    echo -e "  ${DIM}9 test eşzamanlı başlatılıyor...${NC}"
    echo ""

    local pids=()
    local names=()
    local all_tests=("${DOMAIN_TESTS[@]}" "${INFRA_TESTS[@]}" "${APP_TESTS[@]}")

    # Tüm testleri arka planda başlat
    for name in "${all_tests[@]}"; do
        local file="${TESTS[$name]}"
        node "$file" > "/tmp/praytime_test_${name}.log" 2>&1 &
        pids+=($!)
        names+=("$name")
    done

    # Sonuçları bekle
    local failed=0
    local passed=0

    for i in "${!pids[@]}"; do
        local pid="${pids[$i]}"
        local name="${names[$i]}"

        set +e
        wait "$pid"
        local exit_code=$?
        set -e

        # Test sayısını logdan al
        local test_count=""
        if [ -f "/tmp/praytime_test_${name}.log" ]; then
            test_count=$(grep "^Toplam:" "/tmp/praytime_test_${name}.log" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "")
        fi

        local details=""
        [ -n "$test_count" ] && details="($test_count test)"

        if [ $exit_code -eq 0 ]; then
            ((passed++)) || true
            print_result_line "pass" "$name" "$details"
        else
            ((failed++)) || true
            print_result_line "fail" "$name" "$details"

            if [ "$quiet" != "true" ]; then
                echo -e "    ${DIM}Log: /tmp/praytime_test_${name}.log${NC}"
            fi
        fi
        rm -f "/tmp/praytime_test_${name}.log"
    done

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    print_summary "$passed" "$failed" "${#pids[@]}" "$duration"

    [ $failed -eq 0 ]
}

#──────────────────────────────────────────────────────────────────────────────
# Watch Modu
#──────────────────────────────────────────────────────────────────────────────
run_watch() {
    local target="$1"
    local quiet="$2"

    # inotify-tools kontrolü
    if ! command -v inotifywait &> /dev/null; then
        echo -e "${CROSS} ${RED}Hata:${NC} inotify-tools gerekli"
        echo -e "  ${DIM}Kurulum: sudo apt install inotify-tools${NC}"
        exit 1
    fi

    print_header
    print_section "Watch Modu Aktif" "$GREEN"

    echo -e "  ${STAR} Dosya değişikliklerini izliyor..."
    echo -e "  ${DIM}Çıkmak için: Ctrl+C${NC}"

    # İzlenecek dizinler
    local watch_dirs="../src $SCRIPT_DIR"

    # İlk çalıştırma
    echo ""
    if [ -n "$target" ]; then
        run_single_test "$target" "$quiet" "false" || true
    else
        run_all_tests "true" "false" || true
    fi

    # Değişiklikleri izle
    while true; do
        inotifywait -q -r -e modify,create,delete $watch_dirs --include '.*\.js$' 2>/dev/null

        clear
        print_header
        print_section "Watch Modu - Değişiklik Algılandı" "$GREEN"
        echo -e "  ${DIM}$(date '+%H:%M:%S')${NC}"

        if [ -n "$target" ]; then
            run_single_test "$target" "$quiet" "false" || true
        else
            run_all_tests "true" "false" || true
        fi

        echo -e "\n  ${STAR} ${DIM}Değişiklik bekleniyor...${NC}"
    done
}

#──────────────────────────────────────────────────────────────────────────────
# Ana Fonksiyon
#──────────────────────────────────────────────────────────────────────────────
main() {
    local watch=false
    local parallel=false
    local quiet=false
    local verbose=false
    local target=""

    # Argümanları parse et
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                exit 0
                ;;
            -l|--list)
                show_list
                exit 0
                ;;
            -w|--watch)
                watch=true
                shift
                ;;
            -p|--parallel)
                parallel=true
                shift
                ;;
            -q|--quick)
                quiet=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -*)
                echo -e "${CROSS} ${RED}Hata:${NC} Bilinmeyen seçenek: $1"
                echo -e "  ${DIM}Yardım için: ./run-tests.sh --help${NC}"
                exit 1
                ;;
            *)
                target="$1"
                shift
                ;;
        esac
    done

    # Watch modu
    if [ "$watch" = true ]; then
        run_watch "$target" "$quiet"
        exit 0
    fi

    # Paralel mod
    if [ "$parallel" = true ]; then
        run_parallel "$quiet"
        exit $?
    fi

    # Tek test veya tüm testler
    if [ -n "$target" ]; then
        print_header
        run_single_test "$target" "$quiet" "$verbose"
        exit $?
    else
        run_all_tests "$quiet" "$verbose"
        exit $?
    fi
}

main "$@"
