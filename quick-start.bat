@echo off
echo 🚀 Photo Gallery Quick Start
echo ==============================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found
node --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create uploads directories
echo 📁 Creating upload directories...
if not exist "uploads" mkdir uploads
if not exist "uploads\thumbnails" mkdir uploads\thumbnails

REM Check if .env exists
if not exist ".env" (
    echo ⚙️  Creating .env file...
    copy .env.example .env
    echo 📝 Please edit .env file with your database connection and admin credentials
    echo    Then run: npm run db:push
    echo    Finally: npm run dev
    pause
) else (
    echo ✓ .env file already exists
    
    REM Initialize database
    echo 🗄️  Initializing database...
    npm run db:push
    
    REM Start development server
    echo 🚀 Starting development server...
    npm run dev
)
