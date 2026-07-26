#!/bin/bash

# ============================================
# Spring Boot Application Runner Script
# ============================================

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Configuration
# ============================================

# Default profile (can be overridden)
DEFAULT_PROFILE="dev"

# Application name (customize this)
APP_NAME="campaign-loyalty-backend-0.0.1-SNAPSHOT"

# JAR file location (adjust if different)
JAR_PATH="target/${APP_NAME}.jar"

# Log directory
LOG_DIR="logs"
LOG_FILE="${LOG_DIR}/application.log"

# ============================================
# Helper Functions
# ============================================

print_header() {
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}   $1${NC}"
    echo -e "${BLUE}=========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# ============================================
# Main Functions
# ============================================

build_app() {
    print_header "Building Application"
    
    print_info "Running Maven clean package..."
    cd ..
    if mvn clean package -DskipTests; then
        print_success "Build completed successfully!"
        return 0
    else
        print_error "Build failed!"
        return 1
    fi
}

run_dev() {
    print_header "Running Application - DEV Profile"
    
    # Check if JAR exists
    if [ ! -f "$JAR_PATH" ]; then
        print_error "JAR file not found at $JAR_PATH"
        print_info "Running build first..."
        if ! build_app; then
            return 1
        fi
    fi
    
    # Create logs directory if it doesn't exist
    mkdir -p "$LOG_DIR"
    
    print_info "Profile: dev"
    print_info "Log file: $LOG_FILE"
    print_info "Starting application..."
    echo ""
    
    # Run with dev profile
    java -jar "$JAR_PATH" \
        --spring.profiles.active=dev \
        --logging.file.name="$LOG_FILE"
}

run_prod() {
    print_header "Running Application - PROD Profile"
    
    # Check if JAR exists
    if [ ! -f "$JAR_PATH" ]; then
        print_error "JAR file not found at $JAR_PATH"
        print_info "Please build first using: ./run-app.sh build"
        return 1
    fi
    
    # Production-specific checks
    if [ -z "$DB_PASSWORD" ]; then
        print_error "DB_PASSWORD environment variable not set!"
        print_info "Please set: export DB_PASSWORD=your_password"
        return 1
    fi
    
    mkdir -p "$LOG_DIR"
    
    print_info "Profile: prod"
    print_info "Log file: $LOG_FILE"
    print_info "Starting application in PRODUCTION mode..."
    echo ""
    
    # Run with prod profile
    java -jar "$JAR_PATH" \
        --spring.profiles.active=prod \
        --logging.file.name="$LOG_FILE"
}

run_with_profile() {
    local profile=$1
    if [ -z "$profile" ]; then
        profile="$DEFAULT_PROFILE"
    fi
    
    case "$profile" in
        dev|development)
            run_dev
            ;;
        prod|production)
            run_prod
            ;;
        *)
            print_error "Unknown profile: $profile"
            echo "Available profiles: dev, prod"
            return 1
            ;;
    esac
}

show_status() {
    print_header "Application Status"
    
    # Check if running
    if pgrep -f "$APP_NAME" > /dev/null; then
        print_success "Application is running"
        
        # Show PID
        PID=$(pgrep -f "$APP_NAME")
        print_info "PID: $PID"
        
        # Show port (assuming 8080, adjust if needed)
        if lsof -i :8080 > /dev/null 2>&1; then
            print_info "Listening on port: 8080"
        fi
    else
        print_error "Application is NOT running"
    fi
}

stop_app() {
    print_header "Stopping Application"
    
    PIDS=$(pgrep -f "$APP_NAME")
    if [ -n "$PIDS" ]; then
        print_info "Found processes: $PIDS"
        echo "Killing processes..."
        pkill -f "$APP_NAME"
        print_success "Application stopped"
    else
        print_info "No running application found"
    fi
}

tail_logs() {
    print_header "Showing Logs"
    
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        print_error "Log file not found: $LOG_FILE"
    fi
}

show_help() {
    echo ""
    echo -e "${BLUE}Spring Boot Application Runner${NC}"
    echo ""
    echo "Usage: ./run-app.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  build              - Build the application"
    echo "  run [profile]      - Run with specified profile (default: dev)"
    echo "  dev                - Run with dev profile (shortcut)"
    echo "  prod               - Run with prod profile (shortcut)"
    echo "  status             - Show application status"
    echo "  stop               - Stop the application"
    echo "  restart [profile]  - Restart the application"
    echo "  logs               - Tail application logs"
    echo "  help               - Show this help"
    echo ""
    echo "Examples:"
    echo "  ./run-app.sh dev              # Run with dev profile"
    echo "  ./run-app.sh prod             # Run with prod profile"
    echo "  ./run-app.sh run staging      # Run with staging profile"
    echo "  ./run-app.sh restart prod     # Restart with prod profile"
    echo ""
}

# ============================================
# Main Script Logic
# ============================================

# Make the script executable
chmod +x "$0"

# Parse command
COMMAND=$1
PROFILE=$2

case "$COMMAND" in
    build)
        build_app
        ;;
    run)
        run_with_profile "$PROFILE"
        ;;
    dev)
        run_with_profile "dev"
        ;;
    prod)
        run_with_profile "prod"
        ;;
    status)
        show_status
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        sleep 2
        run_with_profile "$PROFILE"
        ;;
    logs)
        tail_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$COMMAND" ]; then
            echo "No command specified. Showing help..."
            show_help
        else
            print_error "Unknown command: $COMMAND"
            echo ""
            show_help
        fi
        ;;
esac

exit 0