#!/bin/bash

echo "🚀 Starting Nomedia Production (Local Hosting)..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get local IP address
if command -v hostname &> /dev/null; then
    LOCAL_IP=$(hostname -I | cut -d' ' -f1 2>/dev/null || echo "localhost")
else
    LOCAL_IP="localhost"
fi

echo -e "${BLUE}📋 Starting Nomedia Local Production...${NC}"

# Build the application with latest fixes
echo -e "${BLUE}🔨 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Start the production server
echo -e "${BLUE}🚀 Starting production server...${NC}"
npm run start:prod &

# Wait a moment for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Server started successfully!${NC}"
    echo ""
    echo -e "${YELLOW}🌐 ACCESS INFORMATION:${NC}"
    echo -e "   Local access:    http://localhost:8000"
    echo -e "   Network access:  http://${LOCAL_IP}:8000"
    echo ""
    echo -e "${YELLOW}👥 SHARE WITH YOUR TEAM:${NC}"
    echo -e "   URL: ${GREEN}http://${LOCAL_IP}:8000${NC}"
    echo ""
    echo -e "${YELLOW}📝 LOGIN ACCOUNTS:${NC}"
    echo -e "   Admin:   mohammed@nomedia.ma : mohammed123"
    echo -e "   Manager: zineb@nomedia.ma    : zineb123"
    echo -e "   User:    karim@nomedia.ma    : karim123"
    echo ""
    echo -e "${GREEN}🎉 Nomedia is ready for your team of 5 users!${NC}"
    echo -e "${BLUE}💡 Keep this terminal open to keep the server running${NC}"
    
    # Keep the script running
    wait
else
    echo -e "${RED}❌ Failed to start server${NC}"
    exit 1
fi
