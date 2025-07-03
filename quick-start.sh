#!/bin/bash

echo "🚀 Photo Gallery Quick Start"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create uploads directories
echo "📁 Creating upload directories..."
mkdir -p uploads/thumbnails

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "📝 Please edit .env file with your database connection and admin credentials"
    echo "   Then run: npm run db:push"
    echo "   Finally: npm run dev"
else
    echo "✓ .env file already exists"
    
    # Initialize database
    echo "🗄️  Initializing database..."
    npm run db:push
    
    # Start development server
    echo "🚀 Starting development server..."
    npm run dev
fi
