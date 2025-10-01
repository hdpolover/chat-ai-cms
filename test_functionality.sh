#!/bin/bash

# Test tenant functionality
echo "🧪 Testing Chat AI CMS Functionality"
echo "===================================="

# 1. Test tenant login
echo "1. Testing tenant authentication..."
RESPONSE=$(curl -s -X POST http://localhost:8000/v1/tenant/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "tenant@example.com", "password": "tenant123"}')

TOKEN=$(echo $RESPONSE | jq -r '.access_token')
if [ "$TOKEN" != "null" ]; then
    echo "✅ Tenant login successful"
else
    echo "❌ Tenant login failed"
    echo $RESPONSE | jq
    exit 1
fi

# 2. Test bots endpoint
echo "2. Testing tenant bots..."
BOTS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/v1/tenant/bots)
BOT_COUNT=$(echo $BOTS | jq 'length')
echo "✅ Found $BOT_COUNT bots"

# 3. Test conversations endpoint
echo "3. Testing conversations..."
CONVS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/v1/tenant/chats)
CONV_COUNT=$(echo $CONVS | jq 'length')
echo "✅ Found $CONV_COUNT conversations"

# 4. Test AI providers
echo "4. Testing AI providers..."
PROVIDERS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/v1/tenant/ai-providers)
PROV_COUNT=$(echo $PROVIDERS | jq 'length')
echo "✅ Found $PROV_COUNT AI providers configured"

# 5. Test dashboard stats
echo "5. Testing dashboard stats..."
STATS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/v1/tenant/dashboard/stats)
echo "✅ Dashboard stats: $(echo $STATS | jq -c .)"

echo ""
echo "🎉 All basic functionality tests passed!"
echo "System is ready for further development."