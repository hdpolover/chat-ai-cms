#!/bin/bash

# Chat AI CMS API - Stop All Services Script

echo "🛑 Stopping Chat AI CMS API System..."
echo "===================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop Node.js processes (dashboards)
echo -e "${BLUE}Stopping Dashboard Processes...${NC}"

# Kill processes running on specific ports
PORTS_TO_KILL=(3000 3001 3002 3003)

for port in "${PORTS_TO_KILL[@]}"; do
    PID=$(lsof -ti:$port)
    if [ ! -z "$PID" ]; then
        echo "Killing process on port $port (PID: $PID)"
        kill -9 $PID
    fi
done

# Alternative: Kill by process name
pkill -f "next-server" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

echo -e "${GREEN}✅ Dashboard processes stopped${NC}"

# Stop Docker services
echo -e "\n${BLUE}Stopping Docker Services...${NC}"
docker-compose down

echo -e "\n${GREEN}🎉 All services stopped successfully!${NC}"
echo "=================================="
echo -e "${BLUE}💡 To restart everything, run: ./start-all.sh${NC}"