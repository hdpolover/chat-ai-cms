#!/bin/bash

# Chat AI CMS API - Status Check Script

echo "🔍 Chat AI CMS API System Status"
echo "==============================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    local service=$2
    if lsof -ti:$port > /dev/null; then
        echo -e "${GREEN}✅ $service${NC} - Running on port $port"
        return 0
    else
        echo -e "${RED}❌ $service${NC} - Not running on port $port"
        return 1
    fi
}

# Function to check URL accessibility
check_url() {
    local url=$1
    local name=$2
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name${NC} - Accessible at $url"
    else
        echo -e "${RED}❌ $name${NC} - Not accessible at $url"
    fi
}

echo -e "${BLUE}🐳 Docker Services:${NC}"
echo "==================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo -e "${RED}Docker not running${NC}"

echo -e "\n${BLUE}🌐 Web Services:${NC}"
echo "================="
check_port 8000 "Backend API"
check_port 3000 "Admin Dashboard"
check_port 3002 "Tenant Dashboard"

echo -e "\n${BLUE}🔗 Service URLs:${NC}"
echo "================="
check_url "http://localhost:8000/health" "API Health"
check_url "http://localhost:3000" "Admin Dashboard"
check_url "http://localhost:3002" "Tenant Dashboard"

echo -e "\n${BLUE}📊 Quick Commands:${NC}"
echo "=================="
echo "• Start all services: ./start-all.sh"
echo "• Stop all services: ./stop-all.sh"
echo "• Check status: ./status.sh"
echo ""
echo -e "${YELLOW}🔑 Login Credentials:${NC}"
echo "• Admin: admin@test.com / admin123"