# Photo Gallery with Image Editor

A full-stack web application that provides a photo gallery with image editing capabilities. Features admin-only upload functionality and public gallery view with text overlay editing, watermarked downloads, and image compression.

## Features

- **Admin Portal**: Single admin authentication for uploading images
- **Image Gallery**: Public gallery view with responsive grid layout
- **Image Editor**: Add, edit, and position text overlays on images
- **Download System**: Download edited images with text overlays and watermarks
- **Image Compression**: Automatic compression while preserving aspect ratios
- **Database Storage**: PostgreSQL database for metadata and session management

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui component library
- TanStack Query for state management
- Wouter for routing

### Backend
- Node.js with Express.js
- TypeScript
- Drizzle ORM with PostgreSQL
- Sharp for image processing
- Canvas for server-side text rendering
- Multer for file uploads

## Prerequisites

Before running this application, ensure you have:

- **Node.js** (version 18 or higher)
- **PostgreSQL** database (local or cloud-hosted like Neon)
- **Git** for cloning the repository

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd photo-gallery-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"

# Admin Credentials
ADMIN_EMAIL="admin@photogallery.com"
ADMIN_PASSWORD="your-secure-password"

# Session Configuration
SESSION_SECRET="your-long-random-session-secret"

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL
1. Install PostgreSQL on your system
2. Create a new database
3. Update the `DATABASE_URL` in your `.env` file

#### Option B: Neon (Cloud PostgreSQL)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to your `.env` file

### 5. Initialize Database Schema

```bash
# Push the database schema
npm run db:push
```

### 6. Create Upload Directories

```bash
mkdir -p uploads/thumbnails
```

### 7. Install System Dependencies (for Canvas)

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y libuuid1 libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

#### macOS:
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

#### Windows:
Use the Windows build tools or WSL with Ubuntu instructions.

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts both the backend server and frontend development server. The application will be available at `http://localhost:5000`.

### Production Mode

1. **Build the application:**
```bash
npm run build
```

2. **Start the production server:**
```bash
npm start
```

## Configuration

### Admin Setup
- The admin email and password are set via environment variables
- Only one admin account is supported
- Admin can upload images and manage the gallery

### Image Storage
- Images are stored in the `uploads/` directory
- Thumbnails are automatically generated in `uploads/thumbnails/`
- Original images are compressed to max 2048x2048 while preserving aspect ratio

### Database Schema
The application uses two main tables:
- `images`: Stores image metadata (filename, dimensions, file size, etc.)
- `admin_sessions`: Manages admin authentication sessions

## Usage

### For Admins
1. Navigate to the gallery
2. Click "Admin Login" 
3. Enter admin credentials
4. Upload images using the upload interface

### For Users
1. Browse the public gallery
2. Click any image to open the editor
3. Add text overlays by clicking "Add Text"
4. Drag and position text overlays
5. Customize font, size, color, and rotation
6. Download the edited image with watermark

## API Endpoints

### Public Endpoints
- `GET /api/images` - Get all images
- `GET /api/images/:id` - Get specific image
- `POST /api/images/:id/process` - Process image with overlays

### Admin Endpoints
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/validate` - Validate session
- `POST /api/images/upload` - Upload images (admin only)
- `DELETE /api/images/:id` - Delete image (admin only)

## Deployment Options

### Option 1: Traditional VPS/Server
1. Set up a Linux server (Ubuntu recommended)
2. Install Node.js, PostgreSQL, and system dependencies
3. Clone the repository and follow the setup steps
4. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "photo-gallery" -- start
pm2 startup
pm2 save
```

### Option 2: Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Option 3: Platform as a Service
Deploy to platforms like:
- **Railway**: Connect GitHub repo, set environment variables
- **Render**: Auto-deploy from GitHub with build commands
- **Heroku**: Use Node.js buildpack with PostgreSQL addon

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `ADMIN_EMAIL` | Admin login email | Yes | - |
| `ADMIN_PASSWORD` | Admin login password | Yes | - |
| `SESSION_SECRET` | Session encryption secret | Yes | - |
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment mode | No | development |

## Troubleshooting

### Common Issues

**Canvas installation fails:**
- Install system dependencies for your platform
- On Windows, consider using WSL

**Database connection errors:**
- Verify DATABASE_URL format
- Check database server is running
- Ensure database exists and credentials are correct

**Image upload fails:**
- Check `uploads/` directory exists and is writable
- Verify disk space availability
- Check file size limits

**Text overlays not appearing:**
- Verify Canvas system dependencies are installed
- Check server logs for processing errors

### Getting Help

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure all system dependencies are installed
4. Test database connectivity independently

## Security Considerations

- Change default admin credentials
- Use strong session secrets
- Set up HTTPS in production
- Implement rate limiting for uploads
- Regular security updates

## License

This project is open source and available under the MIT License.