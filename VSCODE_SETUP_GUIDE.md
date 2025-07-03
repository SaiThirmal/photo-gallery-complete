# Photo Gallery - VS Code Setup Guide

## Complete Step-by-Step Setup Instructions

### Prerequisites

Before starting, ensure you have these installed on your computer:

1. **Node.js 18 or higher**
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - Verify installation: Open terminal/command prompt and run `node --version`

2. **VS Code**
   - Download from: https://code.visualstudio.com/
   - Install the following extensions (recommended):
     - TypeScript and JavaScript Language Features (built-in)
     - Prettier - Code formatter
     - ES7+ React/Redux/React-Native snippets
     - Auto Rename Tag
     - Bracket Pair Colorizer

3. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

4. **PostgreSQL Database**
   - **Option A - Neon (Recommended)**: https://neon.tech/
   - **Option B - Local PostgreSQL**: https://www.postgresql.org/download/

### Step 1: Download the Project

1. **Download project files**
   - If you have the project as a ZIP file, extract it to your desired folder
   - Or clone from repository: `git clone <repository-url>`

2. **Open in VS Code**
   - Open VS Code
   - File → Open Folder
   - Select your project folder

### Step 2: Install Dependencies

1. **Open VS Code Terminal**
   - Terminal → New Terminal (or Ctrl+`)

2. **Install packages**
   ```bash
   npm install
   ```

3. **Install Canvas system dependencies (Platform-specific)**

   **Windows:**
   ```bash
   # No additional steps needed - npm install handles it
   ```

   **macOS:**
   ```bash
   # Install Xcode command line tools if not already installed
   xcode-select --install
   
   # If you have Homebrew installed:
   brew install pkg-config cairo pango libpng jpeg giflib librsvg
   ```

   **Ubuntu/Debian Linux:**
   ```bash
   sudo apt-get update
   sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
   ```

### Step 3: Database Setup

#### Option A: Neon Database (Recommended)

1. **Create Neon Account**
   - Go to https://neon.tech/
   - Sign up for a free account

2. **Create New Project**
   - Click "Create Project"
   - Choose your region
   - Give it a name like "photo-gallery"

3. **Get Connection String**
   - In your Neon dashboard, click "Connect"
   - Copy the connection string under "Connection string" → "Pooled connection"
   - It looks like: `postgresql://username:password@host/database?sslmode=require`

#### Option B: Local PostgreSQL

1. **Install PostgreSQL**
   - Download and install from https://www.postgresql.org/download/
   - Remember the password you set for the postgres user

2. **Create Database**
   ```bash
   # Login to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE photo_gallery;
   
   # Exit
   \q
   ```

### Step 4: Environment Configuration

1. **Create .env file**
   - In VS Code, create a new file called `.env` in the root folder
   - Add the following content:

   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@host:port/database"
   
   # Admin Authentication
   ADMIN_EMAIL="admin@photogallery.com"
   ADMIN_PASSWORD="your-secure-password"
   
   # Session Security
   SESSION_SECRET="your-very-long-random-string-here-minimum-32-characters"
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

2. **Configure your values**
   - Replace `DATABASE_URL` with your actual database connection string
   - Change `ADMIN_PASSWORD` to a secure password
   - Generate a random string for `SESSION_SECRET` (at least 32 characters)

### Step 5: Initialize Database

1. **Push database schema**
   ```bash
   npm run db:push
   ```

   This creates the necessary tables in your database.

### Step 6: Create Upload Directories

1. **Create folders**
   ```bash
   mkdir uploads
   mkdir uploads/thumbnails
   ```

   Or create them manually in VS Code:
   - Right-click in Explorer → New Folder → "uploads"
   - Right-click in uploads → New Folder → "thumbnails"

### Step 7: Start the Application

1. **Run development server**
   ```bash
   npm run dev
   ```

2. **Open in browser**
   - Go to http://localhost:5000
   - You should see your photo gallery

### Step 8: Test the Application

1. **Admin Login**
   - Click "Admin" in the top right
   - Use the email and password from your .env file

2. **Upload Images**
   - After logging in, click "Upload Images"
   - Select some photos to test

3. **Edit Images**
   - Click any image in the gallery
   - Add text overlays
   - Download with different quality settings

## VS Code Development Tips

### Recommended VS Code Settings

Create `.vscode/settings.json` in your project:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/uploads": true,
    "**/.git": true
  }
}
```

### Useful VS Code Extensions

1. **Thunder Client** - Test API endpoints
2. **PostgreSQL** - Database management
3. **GitLens** - Enhanced Git capabilities
4. **Error Lens** - Inline error display

### Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Update database schema
npm run db:push

# Format code
npm run format
```

## Troubleshooting

### Common Issues

1. **Canvas installation fails**
   - Make sure you have the correct system dependencies
   - On Windows, try running VS Code as administrator
   - Restart VS Code after installing dependencies

2. **Database connection fails**
   - Check your DATABASE_URL format
   - Ensure your database is running
   - For Neon, check if your IP is whitelisted

3. **Port already in use**
   - Change PORT in .env file to another number (e.g., 3000, 8000)
   - Or kill the process using the port

4. **Images not loading**
   - Check if uploads and uploads/thumbnails folders exist
   - Verify file permissions

### Need Help?

- Check the terminal output for specific error messages
- Ensure all dependencies are properly installed
- Verify your .env file configuration
- Make sure your database is accessible

## Next Steps

Once everything is working:

1. **Customize the application**
   - Modify colors in `client/src/index.css`
   - Update admin credentials
   - Add your own branding

2. **Prepare for production**
   - Set NODE_ENV=production
   - Use a secure SESSION_SECRET
   - Configure proper database backups

3. **Deploy to production**
   - Choose a hosting provider (Vercel, Railway, Render)
   - Set up environment variables
   - Configure domain and SSL

Your photo gallery is now ready for development in VS Code!