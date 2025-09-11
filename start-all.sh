#!/bin/bash

# Chat AI CMS API - Complete Startup Script
# This script starts all components of the system

echo "🚀 Starting Chat AI CMS API System..."
echo "=================================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -ti:$port > /dev/null; then
        return 0  # Port is in use
    else
        return 1  # Port is available
    fi
}

# Function to find next available port
find_available_port() {
    local start_port=$1
    local port=$start_port
    while check_port $port; do
        port=$((port + 1))
    done
    echo $port
}

echo -e "${BLUE}Step 1: Starting Backend Services (Docker)...${NC}"
echo "=============================================="

# Start Docker services
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 10

# Check Docker container status
echo -e "\n${GREEN}Docker Services Status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${BLUE}Step 2: Starting Admin Dashboard...${NC}"
echo "===================================="

# Check and start admin dashboard
ADMIN_PORT=$(find_available_port 3000)
if [ $ADMIN_PORT -ne 3000 ]; then
    echo -e "${YELLOW}Port 3000 is busy, using port $ADMIN_PORT for Admin Dashboard${NC}"
fi

cd admin-dashboard
echo "Installing/updating dependencies..."
npm install > /dev/null 2>&1
echo "Starting Admin Dashboard on port $ADMIN_PORT..."
PORT=$ADMIN_PORT npm run dev > /dev/null 2>&1 &
ADMIN_PID=$!
cd ..

# Wait a moment for admin dashboard to start
sleep 5

echo -e "\n${BLUE}Step 3: Starting Tenant Dashboard...${NC}"
echo "====================================="

# Check and start tenant dashboard  
TENANT_PORT=$(find_available_port 3002)
if [ $TENANT_PORT -ne 3002 ]; then
    echo -e "${YELLOW}Port 3002 is busy, using port $TENANT_PORT for Tenant Dashboard${NC}"
fi

cd tenant-dashboard
echo "Installing/updating dependencies..."
npm install > /dev/null 2>&1
echo "Starting Tenant Dashboard on port $TENANT_PORT..."
PORT=$TENANT_PORT npm run dev > /dev/null 2>&1 &
TENANT_PID=$!
cd ..

# Wait for dashboards to fully start
echo "Waiting for dashboards to start..."
sleep 10

echo -e "\n${GREEN}🎉 System Started Successfully!${NC}"
echo "==============================="
echo -e "${GREEN}✅ Backend API:${NC}       http://localhost:8000"
echo -e "${GREEN}✅ Admin Dashboard:${NC}   http://localhost:$ADMIN_PORT"
echo -e "${GREEN}✅ Tenant Dashboard:${NC}  http://localhost:$TENANT_PORT"
echo ""
echo -e "${BLUE}📋 Quick Access:${NC}"
echo "• API Health: http://localhost:8000/health"
echo "• API Docs: http://localhost:8000/docs"
echo "• Admin Login: admin@test.com / admin123"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "• Use Ctrl+C to stop this script"
echo "• Dashboards will continue running in background"
echo "• Use './stop-all.sh' to stop everything"
echo ""
echo -e "${BLUE}🔍 Process IDs:${NC}"
echo "• Admin Dashboard PID: $ADMIN_PID"
echo "• Tenant Dashboard PID: $TENANT_PID"

# Function to handle cleanup on script exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping dashboards...${NC}"
    if [ ! -z "$ADMIN_PID" ]; then
        kill $ADMIN_PID 2>/dev/null
    fi
    if [ ! -z "$TENANT_PID" ]; then
        kill $TENANT_PID 2>/dev/null
    fi
    echo -e "${GREEN}Dashboards stopped. Docker services are still running.${NC}"
    echo -e "${BLUE}Use 'docker-compose down' to stop backend services.${NC}"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Keep the script running and show logs
echo -e "${BLUE}📊 Monitoring (Press Ctrl+C to stop)...${NC}"
echo "======================================="

# Wait for user to stop
while true; do
    sleep 1
done