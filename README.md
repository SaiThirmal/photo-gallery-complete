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
