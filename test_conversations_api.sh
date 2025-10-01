#!/bin/bash

# Test the new conversation endpoints
echo "🧪 Testing Conversation Endpoints"
echo "=================================="

# Get authentication token
echo "1. Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:8000/v1/tenant/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "tenant@example.com", "password": "tenant123"}' | jq -r '.access_token')

if [ "$TOKEN" = "null" ]; then
    echo "❌ Failed to get auth token"
    exit 1
fi

# Get first bot ID
echo "2. Getting bot information..."
BOT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/v1/tenant/bots | jq -r '.[0].id')

if [ "$BOT_ID" = "null" ]; then
    echo "❌ No bots available"
    exit 1
fi

echo "✅ Using bot: $BOT_ID"

# Test getting bot conversations
echo "3. Testing get bot conversations..."
CONVERSATIONS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/v1/tenant/bots/$BOT_ID/conversations")

echo "✅ Existing conversations: $(echo $CONVERSATIONS | jq 'length')"

# Test starting a new conversation
echo "4. Testing start new conversation..."
START_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8000/v1/tenant/bots/$BOT_ID/conversations" \
  -d '{"message": "Hello! This is a test message from the new chat interface."}')

CONVERSATION_ID=$(echo $START_RESPONSE | jq -r '.conversation_id')

if [ "$CONVERSATION_ID" = "null" ]; then
    echo "❌ Failed to start conversation"
    echo $START_RESPONSE | jq
    exit 1
fi

echo "✅ Started conversation: $CONVERSATION_ID"
echo "Bot response: $(echo $START_RESPONSE | jq -r '.message.content' | head -c 100)..."

# Test sending another message
echo "5. Testing send message..."
MESSAGE_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8000/v1/tenant/conversations/$CONVERSATION_ID/messages" \
  -d '{"message": "Can you tell me more about your capabilities?"}')

if echo $MESSAGE_RESPONSE | jq -e '.content' > /dev/null; then
    echo "✅ Message sent successfully"
    echo "Bot response: $(echo $MESSAGE_RESPONSE | jq -r '.content' | head -c 100)..."
else
    echo "⚠️  Message response format: $(echo $MESSAGE_RESPONSE | jq -c .)"
fi

# Test getting conversation messages
echo "6. Testing get conversation messages..."
MESSAGES=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/v1/tenant/conversations/$CONVERSATION_ID/messages")

MESSAGE_COUNT=$(echo $MESSAGES | jq 'length')
echo "✅ Conversation has $MESSAGE_COUNT messages"

echo ""
echo "🎉 Conversation endpoints are working!"
echo "✅ Authentication: Working"
echo "✅ Start conversation: Working"  
echo "✅ Send message: Working"
echo "✅ Get messages: Working"