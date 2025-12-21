#!/bin/bash
# JAM Stack Application Management Script
# Comprehensive script for managing the micro-frontend application

# Note: Not using 'set -e' as it interferes with interactive menu arithmetic

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Read application info from app.json
APP_INFO_FILE="app.json"
if [ -f "$APP_INFO_FILE" ]; then
    # Using sed for compatibility - avoids jq dependency
    APP_TITLE=$(grep -o '"title": *"[^"]*"' "$APP_INFO_FILE" | sed -e 's/"title": *"//' -e 's/"//')
    APP_VERSION=$(grep -o '"version": *"[^"]*"' "$APP_INFO_FILE" | sed -e 's/"version": *"//' -e 's/"//')
else
    APP_TITLE="JAM Stack Application Manager"
    APP_VERSION="2.1.0" # Fallback if app.json is missing
fi


# Menu categories for organization
declare -A MENU_ITEMS
MENU_ITEMS=(
    # Start commands (when not running)
    ["dev"]="Start Development|Start all services in development mode|start"
    ["dev-build"]="Build & Start|Build and start all services|start"
    ["prod"]="Start Production|Start in production mode (detached)|start"
    ["service"]="Start Service|Start specific service(s)|start"

    # Running commands (when containers are up)
    ["stop"]="Stop Services|Stop all running services|running"
    ["restart"]="Restart Services|Restart all running services|running"
    ["logs"]="View Logs|Follow logs from all services|running"
    ["status"]="Show Status|Display container status|running"
    ["health"]="Health Check|Check service health endpoints|running"
    ["db-connect"]="Database Connect|Connect to a service database|running"

    # Hostname commands
    ["setup-hostname"]="Setup Hostname|Add custom hostname (requires sudo)|hostname_not_set"
    ["remove-hostname"]="Remove Hostname|Remove custom hostname (requires sudo)|hostname_set"
    ["change-hostname"]="Change Hostname|Change the application hostname|always"
    ["show-hostname"]="Show Hostname|Display hostname configuration|always"

    # Utility commands (always available)
    ["rebuild"]="Rebuild All|Rebuild all services without cache|always"
    ["clean"]="Clean Up|Remove containers and volumes|always"
    ["info"]="Show Info|Display application information|always"
    ["help"]="Full Help|Show detailed help documentation|always"
)

# Helper functions
print_header() {
    local title_version="${APP_TITLE} v${APP_VERSION}"
    # Calculate padding for centering the title
    local header_width=60
    local title_len=${#title_version}
    local padding_total=$((header_width - title_len))
    local padding_left=$((padding_total / 2))
    local padding_right=$((padding_total - padding_left))

    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════╗${NC}"
    printf "${CYAN}║%*s${MAGENTA}%s${NC}%*s${CYAN}║${NC}\n" "$padding_left" "" "$title_version" "$padding_right" ""
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# State detection functions
is_any_container_running() {
    local count=$(docker compose ps -q 2>/dev/null | wc -l)
    [ "$count" -gt 0 ]
}

is_db_container_running() {
    docker compose ps 2>/dev/null | grep -qE "(auth-db|todos-db|fundflow-db).*running"
}

is_hostname_configured() {
    local HOSTNAME=$(get_hostname)
    grep -q "127.0.0.1.*$HOSTNAME" /etc/hosts 2>/dev/null
}

get_running_services_count() {
    docker compose ps -q 2>/dev/null | wc -l
}

# Build dynamic menu based on current state
build_menu() {
    DYNAMIC_MENU=()

    local containers_running=false
    local db_running=false
    local hostname_set=false

    # Check states (suppress errors)
    if is_any_container_running 2>/dev/null; then
        containers_running=true
    fi

    if is_db_container_running 2>/dev/null; then
        db_running=true
    fi

    if is_hostname_configured 2>/dev/null; then
        hostname_set=true
    fi

    # Define menu order
    local menu_order

    if [ "$containers_running" = true ]; then
        # Services are running - show management options first
        menu_order=("stop" "restart" "logs" "status" "health")
        [ "$db_running" = true ] && menu_order+=("db-connect")
        menu_order+=("---") # separator
        menu_order+=("dev" "dev-build" "prod")
    else
        # Services not running - show start options first
        menu_order=("dev" "dev-build" "prod" "service")
    fi

    # Add separator and hostname section
    menu_order+=("---")
    if [ "$hostname_set" = true ]; then
        menu_order+=("show-hostname" "change-hostname" "remove-hostname")
    else
        menu_order+=("setup-hostname" "show-hostname")
    fi

    # Add separator and utilities
    menu_order+=("---")
    menu_order+=("rebuild" "clean" "info" "help")

    # Build the menu array
    for cmd in "${menu_order[@]}"; do
        if [ "$cmd" = "---" ]; then
            DYNAMIC_MENU+=("---|---|---")
        elif [ -n "${MENU_ITEMS[$cmd]}" ]; then
            DYNAMIC_MENU+=("$cmd|${MENU_ITEMS[$cmd]}")
        fi
    done
}

# Interactive menu function
show_interactive_menu() {
    local selected=0
    local first_draw=true

    # Hide cursor
    tput civis

    # Trap to restore cursor on exit
    trap 'tput cnorm; tput clear' EXIT INT TERM

    # Build menu once (state check only on initial load)
    build_menu
    local total=${#DYNAMIC_MENU[@]}

    # Skip separators when counting selectable items
    local selectable_indices=()
    for i in "${!DYNAMIC_MENU[@]}"; do
        IFS='|' read -r cmd rest <<< "${DYNAMIC_MENU[$i]}"
        if [ "$cmd" != "---" ]; then
            selectable_indices+=("$i")
        fi
    done

    local num_selectable=${#selectable_indices[@]}

    # Clear screen once and draw static header
    clear
    print_header

    # Show status indicator
    if is_any_container_running 2>/dev/null; then
        local count=$(get_running_services_count)
        echo -e "${GREEN}●${NC} ${count} container(s) running"
    else
        echo -e "${RED}○${NC} No containers running"
    fi
    echo ""
    echo -e "Use ${CYAN}↑/↓${NC} arrows, ${CYAN}Enter${NC} to select, ${CYAN}q${NC} to quit"
    echo ""

    # Save cursor position for menu start
    local menu_start_line=$(tput lines)
    tput sc

    while true; do
        # Move cursor to menu start position
        tput rc

        # Display menu options (inline format like --help)
        for i in "${!DYNAMIC_MENU[@]}"; do
            IFS='|' read -r cmd title desc condition <<< "${DYNAMIC_MENU[$i]}"

            # Clear line first
            tput el

            if [ "$cmd" = "---" ]; then
                # Separator line
                echo ""
            else
                if [ $i -eq ${selectable_indices[$selected]} ]; then
                    # Highlighted option with description
                    printf "  ${CYAN}▶${NC} ${GREEN}%-20s${NC} ${BLUE}%s${NC}\n" "$title" "$desc"
                else
                    # Normal option with description
                    printf "    ${YELLOW}%-20s${NC} ${BLUE}%s${NC}\n" "$title" "$desc"
                fi
            fi
        done

        # Draw footer only on first draw
        if [ "$first_draw" = true ]; then
            echo ""
            echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
            echo -e "  ${CYAN}Tip:${NC} Run ${YELLOW}./script.sh --help${NC} for full command reference"
            first_draw=false
        fi

        # Read single keypress
        read -rsn1 key

        # Handle arrow keys (they send escape sequences)
        if [[ $key == $'\x1b' ]]; then
            read -rsn2 key
            case $key in
                '[A') # Up arrow
                    selected=$((selected - 1))
                    if [ $selected -lt 0 ]; then
                        selected=$((num_selectable - 1))
                    fi
                    ;;
                '[B') # Down arrow
                    selected=$((selected + 1))
                    if [ $selected -ge $num_selectable ]; then
                        selected=0
                    fi
                    ;;
            esac
        elif [[ $key == '' ]]; then  # Enter key
            # Get selected command
            local selected_idx=${selectable_indices[$selected]}
            IFS='|' read -r cmd title desc condition <<< "${DYNAMIC_MENU[$selected_idx]}"

            # Restore cursor and clear
            tput cnorm
            trap - EXIT INT TERM
            clear

            # Execute the command
            echo -e "${GREEN}Executing:${NC} ./script.sh $cmd"
            echo ""

            # Handle commands that need additional input
            case $cmd in
                db-connect)
                    show_db_select_menu
                    ;;
                service)
                    show_service_select_menu
                    ;;
                *)
                    main "$cmd"
                    ;;
            esac
            wait_for_user_action
        elif [[ $key == 'q' ]] || [[ $key == 'Q' ]]; then
            # Quit
            tput cnorm
            trap - EXIT INT TERM
            clear
            echo "Goodbye!"
            exit 0
        fi
    done
}

# Service selection submenu
show_service_select_menu() {
    local svc_names=("auth" "todos" "fundflow" "base" "auth todos" "All (dev)")
    local svc_commands=("auth" "todos" "fundflow" "base" "auth todos" "dev")
    local svc_descs=(
        "Authentication service"
        "Todo management service"
        "Financial tracking service"
        "Base dashboard app"
        "Auth + Todos services"
        "All services + Mailpit"
    )
    local selected=0
    local total=${#svc_names[@]}

    tput civis
    clear
    print_header
    echo -e "${GREEN}Select service to start:${NC} (↑/↓ arrows, Enter to select, q to go back)"
    echo ""
    tput sc

    while true; do
        tput rc

        for i in "${!svc_names[@]}"; do
            tput el
            if [ $i -eq $selected ]; then
                printf "  ${CYAN}▶${NC} ${GREEN}%-18s${NC} ${BLUE}%s${NC}\n" "${svc_names[$i]}" "${svc_descs[$i]}"
            else
                printf "    ${YELLOW}%-18s${NC} ${BLUE}%s${NC}\n" "${svc_names[$i]}" "${svc_descs[$i]}"
            fi
        done

        read -rsn1 key

        if [[ $key == $'\x1b' ]]; then
            read -rsn2 key
            case $key in
                '[A') selected=$((selected - 1)); [ $selected -lt 0 ] && selected=$((total - 1)) ;;
                '[B') selected=$((selected + 1)); [ $selected -ge $total ] && selected=0 ;;
            esac
        elif [[ $key == '' ]]; then
            tput cnorm
            clear
            local svc="${svc_commands[$selected]}"
            if [ "$svc" = "dev" ]; then
                cmd_dev
            else
                cmd_service "$svc"
            fi
            wait_for_user_action
        elif [[ $key == 'q' ]] || [[ $key == 'Q' ]]; then
            tput cnorm
            show_interactive_menu
            exit 0
        fi
    done
}

# Database selection submenu
show_db_select_menu() {
    # Check which databases are running
    local db_options=()
    local db_descs=()
    local db_all=("auth" "todos" "fundflow")
    local db_all_descs=("Authentication database" "Todo management database" "Financial tracking database")

    for i in "${!db_all[@]}"; do
        local db="${db_all[$i]}"
        if docker compose ps 2>/dev/null | grep -q "${db}-db.*running"; then
            db_options+=("$db")
            db_descs+=("${db_all_descs[$i]}")
        fi
    done

    if [ ${#db_options[@]} -eq 0 ]; then
        print_error "No database containers are running"
        echo ""
        print_info "Start services first: ./script.sh dev"
        exit 1
    fi

    local selected=0
    local total=${#db_options[@]}

    tput civis
    clear
    print_header
    echo -e "${GREEN}Select database to connect:${NC} (↑/↓ arrows, Enter to select, q to go back)"
    echo ""
    tput sc

    while true; do
        tput rc

        for i in "${!db_options[@]}"; do
            tput el
            if [ $i -eq $selected ]; then
                printf "  ${CYAN}▶${NC} ${GREEN}%-12s${NC} ${BLUE}%s${NC}\n" "${db_options[$i]}" "${db_descs[$i]}"
            else
                printf "    ${YELLOW}%-12s${NC} ${BLUE}%s${NC}\n" "${db_options[$i]}" "${db_descs[$i]}"
            fi
        done

        read -rsn1 key

        if [[ $key == $'\x1b' ]]; then
            read -rsn2 key
            case $key in
                '[A') selected=$((selected - 1)); [ $selected -lt 0 ] && selected=$((total - 1)) ;;
                '[B') selected=$((selected + 1)); [ $selected -ge $total ] && selected=0 ;;
            esac
        elif [[ $key == '' ]]; then
            tput cnorm
            clear
            cmd_db_connect "${db_options[$selected]}"
            wait_for_user_action
        elif [[ $key == 'q' ]] || [[ $key == 'Q' ]]; then
            tput cnorm
            show_interactive_menu
            exit 0
        fi
    done
}

# Function to wait for user action after a command
wait_for_user_action() {
    echo ""
    echo -e "${CYAN}Use Esc to back, q to quit${NC}"

    while true; do
        read -rsn1 key
        if [[ $key == $'\x1b' ]]; then # Escape key
            show_interactive_menu
            exit 0
        elif [[ $key == 'q' ]] || [[ $key == 'Q' ]]; then
            tput cnorm
            trap - EXIT INT TERM
            clear
            echo "Goodbye!"
            exit 0
        fi
    done
}

# Load hostname from .env file
get_hostname() {
    if [ -f .env ]; then
        HOSTNAME=$(grep -E "^APP_HOSTNAME=" .env | cut -d '=' -f2)
        echo "${HOSTNAME:-jamstack.local}"
    else
        echo "jamstack.local"
    fi
}

# Load mailpit hostname from .env file
get_mailpit_hostname() {
    if [ -f .env ]; then
        MAILPIT=$(grep -E "^MAILPIT_HOSTNAME=" .env | cut -d '=' -f2)
        echo "${MAILPIT:-mailpit.jamstack.local}"
    else
        echo "mailpit.jamstack.local"
    fi
}

# Show help
show_help() {
    print_header
    echo -e "${GREEN}USAGE:${NC}"
    echo "    ./script.sh <command> [options]"
    echo ""
    echo -e "${GREEN}COMMANDS:${NC}"
    echo ""
    echo -e "  ${CYAN}Development:${NC}"
    echo -e "    ${YELLOW}dev${NC}              Start all services in development mode"
    echo -e "    ${YELLOW}dev-build${NC}        Rebuild and start all services in development"
    echo -e "    ${YELLOW}prod${NC}             Start all services in production mode (detached)"
    echo -e "    ${YELLOW}prod-build${NC}       Rebuild and start all services in production"
    echo ""
    echo -e "  ${CYAN}Service Management:${NC}"
    echo -e "    ${YELLOW}service${NC} <name>   Start specific service(s)"
    echo "                       Examples:"
    echo "                         ./script.sh service auth"
    echo "                         ./script.sh service \"auth todos\""
    echo "                         ./script.sh service auth --build"
    echo -e "    ${YELLOW}stop${NC}             Stop all running services"
    echo -e "    ${YELLOW}restart${NC}          Restart all running services"
    echo -e "    ${YELLOW}clean${NC}            Stop services and remove volumes (with confirmation)"
    echo ""
    echo -e "  ${CYAN}Monitoring:${NC}"
    echo -e "    ${YELLOW}logs${NC} [service]   View logs (follow mode)"
    echo "                       Examples:"
    echo "                         ./script.sh logs"
    echo "                         ./script.sh logs auth-service"
    echo -e "    ${YELLOW}status${NC}           Show container status and resource usage"
    echo -e "    ${YELLOW}health${NC}           Check health of all service endpoints"
    echo -e "    ${YELLOW}ps${NC}               Show running containers (alias for status)"
    echo ""
    echo -e "  ${CYAN}Database:${NC}"
    echo -e "    ${YELLOW}db-connect${NC} <svc> Connect to service database"
    echo "                       Services: auth, todos, fundflow"
    echo "                       Example: ./script.sh db-connect auth"
    echo -e "    ${YELLOW}db-backup${NC} <svc>  Backup service database to file"
    echo -e "    ${YELLOW}db-restore${NC} <svc> Restore database from backup file"
    echo ""
    echo -e "  ${CYAN}Hostname (like DDEV):${NC}"
    echo -e "    ${YELLOW}setup-hostname${NC}   Add custom hostname to /etc/hosts (requires sudo)"
    echo "                       Makes app accessible at http://jamstack.local"
    echo -e "    ${YELLOW}remove-hostname${NC}  Remove custom hostname from /etc/hosts (requires sudo)"
    echo -e "    ${YELLOW}show-hostname${NC}    Show current hostname configuration"
    echo ""
    echo -e "  ${CYAN}Utilities:${NC}"
    echo -e "    ${YELLOW}exec${NC} <service>   Execute command in running container"
    echo "                       Example: ./script.sh exec auth-service sh"
    echo -e "    ${YELLOW}rebuild${NC}          Rebuild all services without cache"
    echo -e "    ${YELLOW}pull${NC}             Pull latest images"
    echo -e "    ${YELLOW}prune${NC}            Remove unused Docker resources"
    echo ""
    echo -e "  ${CYAN}Information:${NC}"
    echo -e "    ${YELLOW}help${NC}             Show this help message"
    echo -e "    ${YELLOW}version${NC}          Show script version"
    echo -e "    ${YELLOW}info${NC}             Show application information"
    echo ""
    echo -e "${GREEN}AVAILABLE SERVICES:${NC}"
    echo -e "    ${YELLOW}base${NC}      - Base app (unified dashboard)"
    echo -e "    ${YELLOW}auth${NC}      - Authentication service"
    echo -e "    ${YELLOW}todos${NC}     - Todos management service"
    echo -e "    ${YELLOW}fundflow${NC}  - Financial tracking service"
    echo -e "    ${YELLOW}dev${NC}       - All services + Mailpit (email testing)"
    echo -e "    ${YELLOW}prod${NC}      - All production services"
    echo ""
    echo -e "${GREEN}EXAMPLES:${NC}"
    echo -e "    ${CYAN}# Start all services in development${NC}"
    echo "    ./script.sh dev"
    echo ""
    echo -e "    ${CYAN}# Start only auth and todos services${NC}"
    echo "    ./script.sh service \"auth todos\""
    echo ""
    echo -e "    ${CYAN}# View logs for auth service${NC}"
    echo "    ./script.sh logs auth-service"
    echo ""
    echo -e "    ${CYAN}# Check health of all services${NC}"
    echo "    ./script.sh health"
    echo ""
    echo -e "    ${CYAN}# Connect to auth database${NC}"
    echo "    ./script.sh db-connect auth"
    echo ""
    echo -e "    ${CYAN}# Setup custom hostname (like DDEV)${NC}"
    echo "    sudo ./script.sh setup-hostname"
    echo ""
    echo -e "    ${CYAN}# Production deployment${NC}"
    echo "    ./script.sh prod-build"
    echo ""
    echo -e "${GREEN}OPTIONS:${NC}"
    echo -e "    ${YELLOW}--help${NC}, ${YELLOW}-h${NC}      Show this help message"
    echo -e "    ${YELLOW}--version${NC}, ${YELLOW}-v${NC}   Show script version"
    echo ""
    echo -e "${GREEN}DOCUMENTATION:${NC}"
    echo "    README.md          - Architecture overview"
    echo "    Workflow.md        - Development workflows"
    echo "    .env.example       - Environment configuration"
    echo ""
}

# Show version
show_version() {
    echo "${APP_TITLE} v${APP_VERSION}"
}

# Show application info
show_info() {
    local HOSTNAME=$(get_hostname)
    local MAILPIT_HOSTNAME=$(get_mailpit_hostname)
    print_header
    echo -e "${GREEN}Application Information:${NC}"
    echo ""
    echo -e "  ${CYAN}Architecture:${NC}    Micro-frontend with Python/FastAPI backends"
    echo -e "  ${CYAN}Frontend:${NC}        Next.js 16, React 19, TypeScript 5.7"
    echo -e "  ${CYAN}Backend:${NC}         Python 3.12, FastAPI, SQLAlchemy 2.0"
    echo -e "  ${CYAN}Database:${NC}        PostgreSQL 16 (per-service)"
    echo -e "  ${CYAN}Proxy:${NC}           Nginx (path-based routing)"
    echo -e "  ${CYAN}Hostname:${NC}        $HOSTNAME"
    echo ""
    echo -e "${GREEN}Access Points:${NC}"
    echo -e "  ${CYAN}Dashboard:${NC}       http://$HOSTNAME"
    echo -e "  ${CYAN}Auth:${NC}            http://$HOSTNAME/auth"
    echo -e "  ${CYAN}Todos:${NC}           http://$HOSTNAME/todos"
    echo -e "  ${CYAN}Fundflow:${NC}        http://$HOSTNAME/fundflow"
    if [ -n "$MAILPIT_HOSTNAME" ]; then
        echo -e "  ${CYAN}Mailpit:${NC}         http://$MAILPIT_HOSTNAME"
    else
        echo -e "  ${CYAN}Mailpit:${NC}         http://localhost:8030"
    fi
    echo ""
}


# Prompt for hostname setup if not configured
prompt_for_hostname_setup() {
    if ! is_hostname_configured; then
        print_warning "Hostname is not configured. The application may not work as expected."
        local DEFAULT_HOSTNAME=$(get_hostname)
        read -p "Do you want to set up the default hostname '$DEFAULT_HOSTNAME' now? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            # We need sudo for this.
            if [ "$EUID" -ne 0 ]; then
                print_error "Hostname setup requires sudo. Please run 'sudo ./script.sh setup-hostname' manually."
            else
                cmd_setup_hostname
            fi
        fi
    fi
}

# Development commands
cmd_dev() {
    prompt_for_hostname_setup
    print_info "Starting all services in development mode..."
    docker compose --profile dev up "$@"
}

cmd_dev_build() {
    prompt_for_hostname_setup
    print_info "Building and starting all services in development mode..."
    docker compose --profile dev up --build "$@"
}

cmd_prod() {
    prompt_for_hostname_setup
    print_info "Starting all services in production mode..."
    docker compose --profile prod up -d "$@"
}

cmd_prod_build() {
    prompt_for_hostname_setup
    print_info "Building and starting all services in production mode..."
    docker compose --profile prod up -d --build "$@"
}

# Service management
cmd_service() {
    if [ -z "$1" ]; then
        print_error "Service name required"
        echo ""
        echo "Usage: ./script.sh service <service-name> [options]"
        echo ""
        echo "Available services: base, auth, todos, fundflow"
        echo ""
        echo "Examples:"
        echo "  ./script.sh service auth"
        echo "  ./script.sh service \"auth todos\""
        echo "  ./script.sh service auth --build"
        exit 1
    fi

    SERVICE=$1
    shift

    # Convert service names to profile flags
    PROFILES=""
    for svc in $SERVICE; do
        PROFILES="$PROFILES --profile $svc"
    done

    print_info "Starting service(s): $SERVICE"
    docker compose $PROFILES up "$@"
}

cmd_stop() {
    print_info "Stopping all services..."
    docker compose down "$@"
    print_success "All services stopped"
}

cmd_restart() {
    print_info "Restarting all services..."
    docker compose restart "$@"
    print_success "All services restarted"
}

cmd_clean() {
    print_warning "This will remove all volumes and DELETE ALL DATA!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up services and volumes..."
        docker compose down -v "$@"
        print_success "Cleanup complete"
    else
        print_info "Cleanup cancelled"
    fi
}

# Monitoring commands
cmd_logs() {
    if [ -z "$1" ]; then
        print_info "Viewing logs from all services (Ctrl+C to exit)..."
        docker compose logs -f
    else
        print_info "Viewing logs from $1 (Ctrl+C to exit)..."
        docker compose logs -f "$@"
    fi
}

cmd_status() {
    print_header
    echo -e "${GREEN}Container Status:${NC}"
    echo "═══════════════════════════════════════════════════════"
    docker compose ps
    echo ""
    echo -e "${GREEN}Volume Usage:${NC}"
    echo "═══════════════════════════════════════════════════════"
    docker volume ls | grep jam || print_warning "No JAM volumes found"
    echo ""
}

cmd_health() {
    print_header
    echo -e "${GREEN}Service Health Check:${NC}"
    echo "═══════════════════════════════════════════════════════"
    echo ""

    # Define services to check
    declare -A services=(
        ["Base App"]="http://localhost:3000"
        ["Auth Service"]="http://localhost:3001"
        ["Todos Service"]="http://localhost:3002"
        ["Fundflow Service"]="http://localhost:3003"
    )

    for name in "${!services[@]}"; do
        url="${services[$name]}"
        printf "  %-20s ... " "$name"

        if curl -s -f "$url/health" > /dev/null 2>&1 || curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ UP${NC}"
        else
            echo -e "${RED}❌ DOWN${NC}"
        fi
    done

    echo ""
    echo -e "${BLUE}For detailed logs, run: ./script.sh logs${NC}"
    echo ""
}

# Database commands
cmd_db_connect() {
    if [ -z "$1" ]; then
        print_error "Service name required"
        echo ""
        echo "Usage: ./script.sh db-connect <service>"
        echo "Services: auth, todos, fundflow"
        exit 1
    fi

    case "$1" in
        auth)
            print_info "Connecting to auth database..."
            docker exec -it jam-auth-db psql -U postgres -d auth
            ;;
        todos)
            print_info "Connecting to todos database..."
            docker exec -it jam-todos-db psql -U postgres -d todos
            ;;
        fundflow)
            print_info "Connecting to fundflow database..."
            docker exec -it jam-fundflow-db psql -U postgres -d fundflow
            ;;
        *)
            print_error "Unknown service: $1"
            echo "Available services: auth, todos, fundflow"
            exit 1
            ;;
    esac
}

cmd_db_backup() {
    if [ -z "$1" ]; then
        print_error "Service name required"
        echo ""
        echo "Usage: ./script.sh db-backup <service>"
        echo "Services: auth, todos, fundflow"
        exit 1
    fi

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${1}_backup_${TIMESTAMP}.sql"

    case "$1" in
        auth)
            print_info "Backing up auth database to $BACKUP_FILE..."
            docker exec jam-auth-db pg_dump -U postgres auth > "$BACKUP_FILE"
            ;;
        todos)
            print_info "Backing up todos database to $BACKUP_FILE..."
            docker exec jam-todos-db pg_dump -U postgres todos > "$BACKUP_FILE"
            ;;
        fundflow)
            print_info "Backing up fundflow database to $BACKUP_FILE..."
            docker exec jam-fundflow-db pg_dump -U postgres fundflow > "$BACKUP_FILE"
            ;;
        *)
            print_error "Unknown service: $1"
            echo "Available services: auth, todos, fundflow"
            exit 1
            ;;
    esac

    print_success "Backup saved to $BACKUP_FILE"
}

cmd_db_restore() {
    if [ -z "$1" ] || [ -z "$2" ]; then
        print_error "Service name and backup file required"
        echo ""
        echo "Usage: ./script.sh db-restore <service> <backup-file>"
        echo "Services: auth, todos, fundflow"
        exit 1
    fi

    if [ ! -f "$2" ]; then
        print_error "Backup file not found: $2"
        exit 1
    fi

    print_warning "This will OVERWRITE the current database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restore cancelled"
        exit 0
    fi

    case "$1" in
        auth)
            print_info "Restoring auth database from $2..."
            docker exec -i jam-auth-db psql -U postgres auth < "$2"
            ;;
        todos)
            print_info "Restoring todos database from $2..."
            docker exec -i jam-todos-db psql -U postgres todos < "$2"
            ;;
        fundflow)
            print_info "Restoring fundflow database from $2..."
            docker exec -i jam-fundflow-db psql -U postgres fundflow < "$2"
            ;;
        *)
            print_error "Unknown service: $1"
            echo "Available services: auth, todos, fundflow"
            exit 1
            ;;
    esac

    print_success "Database restored successfully"
}

# Hostname commands
cmd_setup_hostname() {
    local HOSTNAME=$(get_hostname)
    local MAILPIT_HOSTNAME=$(get_mailpit_hostname)

    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        print_error "This command requires sudo privileges"
        echo ""
        echo "Please run: sudo ./script.sh setup-hostname"
        exit 1
    fi

    print_header
    print_info "Setting up custom hostnames..."
    echo ""

    # Backup /etc/hosts
    cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backed up /etc/hosts"

    # Add main hostname to /etc/hosts
    if grep -q "127.0.0.1.*$HOSTNAME" /etc/hosts; then
        print_warning "Main hostname $HOSTNAME already exists in /etc/hosts"
    else
        echo "127.0.0.1    $HOSTNAME" >> /etc/hosts
        print_success "Added $HOSTNAME to /etc/hosts"
    fi

    # Add mailpit hostname if configured
    if [ -n "$MAILPIT_HOSTNAME" ] && [ "$MAILPIT_HOSTNAME" != "localhost" ]; then
        if grep -q "127.0.0.1.*$MAILPIT_HOSTNAME" /etc/hosts; then
            print_warning "Mailpit hostname $MAILPIT_HOSTNAME already exists in /etc/hosts"
        else
            echo "127.0.0.1    $MAILPIT_HOSTNAME" >> /etc/hosts
            print_success "Added $MAILPIT_HOSTNAME to /etc/hosts"
        fi
    fi

    echo ""
    print_success "Hostname setup complete!"
    echo ""
    echo -e "${GREEN}You can now access the application at:${NC}"
    echo -e "  ${CYAN}Dashboard:${NC}  http://$HOSTNAME"
    echo -e "  ${CYAN}Auth:${NC}       http://$HOSTNAME/auth"
    echo -e "  ${CYAN}Todos:${NC}      http://$HOSTNAME/todos"
    echo -e "  ${CYAN}Fundflow:${NC}   http://$HOSTNAME/fundflow"
    if [ -n "$MAILPIT_HOSTNAME" ] && [ "$MAILPIT_HOSTNAME" != "localhost" ]; then
        echo -e "  ${CYAN}Mailpit:${NC}    http://$MAILPIT_HOSTNAME"
    else
        echo -e "  ${CYAN}Mailpit:${NC}    http://localhost:8030"
    fi
    echo ""
    print_info "Start the application with: ./script.sh dev"
    echo ""
}

cmd_remove_hostname() {
    local HOSTNAME=$(get_hostname)
    local MAILPIT_HOSTNAME=$(get_mailpit_hostname)

    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        print_error "This command requires sudo privileges"
        echo ""
        echo "Please run: sudo ./script.sh remove-hostname"
        exit 1
    fi

    print_header
    print_info "Removing custom hostnames..."
    echo ""

    # Backup /etc/hosts
    cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backed up /etc/hosts"

    # Remove main hostname from /etc/hosts
    if grep -q "127.0.0.1.*$HOSTNAME" /etc/hosts; then
        sed -i.bak "/127.0.0.1.*$HOSTNAME/d" /etc/hosts
        print_success "Removed $HOSTNAME from /etc/hosts"
    else
        print_warning "Hostname $HOSTNAME not found in /etc/hosts"
    fi

    # Remove mailpit hostname if configured
    if [ -n "$MAILPIT_HOSTNAME" ] && [ "$MAILPIT_HOSTNAME" != "localhost" ]; then
        if grep -q "127.0.0.1.*$MAILPIT_HOSTNAME" /etc/hosts; then
            sed -i.bak "/127.0.0.1.*$MAILPIT_HOSTNAME/d" /etc/hosts
            print_success "Removed $MAILPIT_HOSTNAME from /etc/hosts"
        else
            print_warning "Mailpit hostname $MAILPIT_HOSTNAME not found in /etc/hosts"
        fi
    fi

    echo ""
    print_success "Hostname cleanup complete!"
    echo ""
    print_info "The application is now accessible only via http://localhost"
    echo ""
}

cmd_change_hostname() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This command requires sudo privileges"
        echo ""
        echo "Please run: sudo ./script.sh change-hostname"
        exit 1
    fi

    local OLD_HOSTNAME=$(get_hostname)

    if is_hostname_configured; then
        print_warning "A hostname is already configured: $OLD_HOSTNAME"
        read -p "Do you want to remove it and set a new one? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Hostname change cancelled."
            exit 0
        fi
        
        print_info "Removing old hostname: $OLD_HOSTNAME"
        # Directly remove the old hostname from /etc/hosts
        sed -i.bak "/127.0.0.1.*$OLD_HOSTNAME/d" /etc/hosts
        print_success "Removed $OLD_HOSTNAME from /etc/hosts"
        echo ""
    fi

    read -p "Enter the new hostname (e.g., myapp.local): " NEW_HOSTNAME

    if [ -z "$NEW_HOSTNAME" ]; then
        print_error "Hostname cannot be empty."
        exit 1
    fi
    
    # Update .env file with new hostname
    if [ -f .env ]; then
        if grep -q "APP_HOSTNAME=" .env; then
            sed -i.bak "s/APP_HOSTNAME=.*/APP_HOSTNAME=$NEW_HOSTNAME/" .env
        else
            echo "" >> .env
            echo "APP_HOSTNAME=$NEW_HOSTNAME" >> .env
        fi
    else
        echo "APP_HOSTNAME=$NEW_HOSTNAME" > .env
    fi
    print_success "Updated .env with new hostname: $NEW_HOSTNAME"
    echo ""

    print_info "Now, let's set up the new hostname in /etc/hosts."
    cmd_setup_hostname
}


cmd_show_hostname() {
    local HOSTNAME=$(get_hostname)
    local MAILPIT_HOSTNAME=$(get_mailpit_hostname)

    print_header
    echo -e "${GREEN}Hostname Configuration:${NC}"
    echo ""
    echo -e "  ${CYAN}Main Hostname:${NC}     $HOSTNAME"
    if [ -n "$MAILPIT_HOSTNAME" ] && [ "$MAILPIT_HOSTNAME" != "localhost" ]; then
        echo -e "  ${CYAN}Mailpit Hostname:${NC}  $MAILPIT_HOSTNAME"
    fi
    echo -e "  ${CYAN}Source:${NC}            ${PWD}/.env"
    echo ""

    # Check /etc/hosts
    echo -e "${GREEN}Status in /etc/hosts:${NC}"
    echo ""

    local main_configured=false
    local mailpit_configured=false

    if grep -q "127.0.0.1.*$HOSTNAME" /etc/hosts; then
        main_configured=true
        print_success "Main hostname is configured"
        grep "127.0.0.1.*$HOSTNAME" /etc/hosts | sed 's/^/  /'
    else
        print_warning "Main hostname is NOT configured"
    fi

    if [ -n "$MAILPIT_HOSTNAME" ] && [ "$MAILPIT_HOSTNAME" != "localhost" ]; then
        if grep -q "127.0.0.1.*$MAILPIT_HOSTNAME" /etc/hosts; then
            mailpit_configured=true
            print_success "Mailpit hostname is configured"
            grep "127.0.0.1.*$MAILPIT_HOSTNAME" /etc/hosts | sed 's/^/  /'
        else
            print_warning "Mailpit hostname is NOT configured"
        fi
    fi

    echo ""

    if [ "$main_configured" = true ]; then
        echo -e "${GREEN}Access URLs:${NC}"
        echo -e "  ${CYAN}Dashboard:${NC}  http://$HOSTNAME"
        echo -e "  ${CYAN}Auth:${NC}       http://$HOSTNAME/auth"
        echo -e "  ${CYAN}Todos:${NC}      http://$HOSTNAME/todos"
        echo -e "  ${CYAN}Fundflow:${NC}   http://$HOSTNAME/fundflow"
        if [ "$mailpit_configured" = true ]; then
            echo -e "  ${CYAN}Mailpit:${NC}    http://$MAILPIT_HOSTNAME"
        else
            echo -e "  ${CYAN}Mailpit:${NC}    http://localhost:8030"
        fi
        echo ""
    else
        print_info "To set up hostnames, run:"
        echo "  sudo ./script.sh setup-hostname"
        echo ""
        echo "Currently accessible via http://localhost only"
        echo ""
    fi
}

# Utility commands
cmd_exec() {
    if [ -z "$1" ]; then
        print_error "Container name required"
        echo ""
        echo "Usage: ./script.sh exec <container> [command]"
        echo "Example: ./script.sh exec auth-service sh"
        exit 1
    fi

    print_info "Executing command in $1..."
    docker exec -it "$@"
}

cmd_rebuild() {
    print_info "Rebuilding all services without cache..."
    docker compose build --no-cache "$@"
    print_success "Rebuild complete"
}

cmd_pull() {
    print_info "Pulling latest images..."
    docker compose pull "$@"
    print_success "Pull complete"
}

cmd_prune() {
    print_warning "This will remove unused Docker resources!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Pruning unused resources..."
        docker system prune -f
        print_success "Prune complete"
    else
        print_info "Prune cancelled"
    fi
}

# Main command router
main() {
    # Handle no arguments - show interactive menu
    if [ -z "$1" ]; then
        show_interactive_menu
        exit 0
    fi

    # Handle help flags
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_help
        exit 0
    fi

    # Handle version flags
    if [ "$1" = "--version" ] || [ "$1" = "-v" ]; then
        show_version
        exit 0
    fi

    COMMAND=$1
    shift

    case "$COMMAND" in
        # Development
        dev)
            cmd_dev "$@"
            ;;
        dev-build)
            cmd_dev_build "$@"
            ;;
        prod)
            cmd_prod "$@"
            ;;
        prod-build)
            cmd_prod_build "$@"
            ;;

        # Service management
        service)
            cmd_service "$@"
            ;;
        stop)
            cmd_stop "$@"
            ;;
        restart)
            cmd_restart "$@"
            ;;
        clean)
            cmd_clean "$@"
            ;;

        # Monitoring
        logs)
            cmd_logs "$@"
            ;;
        status|ps)
            cmd_status "$@"
            ;;
        health)
            cmd_health "$@"
            ;;

        # Database
        db-connect)
            cmd_db_connect "$@"
            ;;
        db-backup)
            cmd_db_backup "$@"
            ;;
        db-restore)
            cmd_db_restore "$@"
            ;;

        # Hostname
        setup-hostname)
            cmd_setup_hostname "$@"
            ;;
        change-hostname)
            cmd_change_hostname "$@"
            ;;
        remove-hostname)
            cmd_remove_hostname "$@"
            ;;
        show-hostname)
            cmd_show_hostname "$@"
            ;;

        # Utilities
        exec)
            cmd_exec "$@"
            ;;
        rebuild)
            cmd_rebuild "$@"
            ;;
        pull)
            cmd_pull "$@"
            ;;
        prune)
            cmd_prune "$@"
            ;;

        # Information
        help)
            show_help
            ;;
        version)
            show_version
            ;;
        info)
            show_info
            ;;

        *)
            print_error "Unknown command: $COMMAND"
            echo ""
            echo "Run './script.sh --help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
