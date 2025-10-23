#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./test-backend.sh <recipient-email>"
    exit 1
fi

RECIPIENT_EMAIL=$1
BACKEND_URL="http://localhost:8080"

echo "Testing Wishlist Notifier Backend..."
echo ""

echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ Health check passed"
else
    echo "   ❌ Health check failed"
    exit 1
fi

echo ""
echo "2. Sending test notification..."
curl -X POST "$BACKEND_URL/api/notify" \
    -H "Content-Type: application/json" \
    -d "{
        \"recipientEmail\": \"$RECIPIENT_EMAIL\",
        \"productName\": \"Test Product - RTX 4090\",
        \"productPrice\": \"\$1,599.99\",
        \"productUrl\": \"https://example.com/product\",
        \"storeName\": \"Test Store\",
        \"senderName\": \"Test User\"
    }"

echo ""
echo "📧 Check the inbox of: $RECIPIENT_EMAIL"
