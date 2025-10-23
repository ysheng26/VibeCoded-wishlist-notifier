#!/bin/bash

echo "🚀 Wishlist Notifier Backend Starter"
echo "======================================"
echo ""

if [ -f ".env" ]; then
    echo "📁 Loading environment from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
    echo "   ✅ Environment loaded"
else
    echo "⚠️  No .env file found. Please create one from .env.example"
    exit 1
fi

if [ -z "$SENDER_EMAIL" ] || [ -z "$SENDER_PASSWORD" ]; then
    echo "❌ Error: Missing required environment variables"
    exit 1
fi

echo ""
echo "📧 Sender Email: $SENDER_EMAIL"
echo "🔌 Port: ${PORT:-8080}"
echo ""

if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed"
    exit 1
fi

echo "📦 Checking dependencies..."
if [ ! -f "go.sum" ]; then
    go mod download
fi

echo ""
echo "🎯 Starting server..."
echo ""

go run main.go
