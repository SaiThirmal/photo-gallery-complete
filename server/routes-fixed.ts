import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage.js";
import { authenticateAdmin, validateSession, logoutAdmin } from "./services/auth.js";
import { processImageWithOverlays, generateThumbnail, getImageMetadata, compressImageWithResize, type TextOverlay } from "./services/imageProcessor-no-canvas.js";
import { config } from "./config.js";
import { insertImageSchema } from "../shared/schema.js";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Middleware to check admin authentication
async function requireAdmin(req: any, res: any, next: any) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    return res.status(401).json({ message: "No session token provided" });
  }

  const isValid = await validateSession(sessionId);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }

  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Admin authentication endpoints  
  app.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const sessionId = await authenticateAdmin(email, password);
      if (sessionId) {
        res.json({ sessionId });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/auth/logout", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (sessionId) {
        await logoutAdmin(sessionId);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/auth/validate", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (!sessionId) {
        return res.status(401).json({ isValid: false });
      }

      const isValid = await validateSession(sessionId);
      res.json({ isValid });
    } catch (error) {
      console.error("Validation error:", error);
      res.status(500).json({ isValid: false });
    }
  });

  // Image upload endpoint (admin only)
  app.post("/api/images", requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const file = req.file;
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const extension = path.extname(file.originalname);
      const filename = `${timestamp}-${randomStr}${extension}`;
      
      // Get image metadata
      const metadata = await getImageMetadata(file.buffer);
      
      // Compress the main image
      const compressedBuffer = await compressImageWithResize(file.buffer);
      
      // Generate thumbnail
      const thumbnailBuffer = await generateThumbnail(file.buffer);
      const thumbnailFilename = `thumb_${filename}`;
      
      // Save files
      const imagePath = path.join('uploads', filename);
      const thumbnailPath = path.join('uploads/thumbnails', thumbnailFilename);
      
      await fs.writeFile(imagePath, compressedBuffer);
      await fs.writeFile(thumbnailPath, thumbnailBuffer);
      
      // Save to database
      const imageData = {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: compressedBuffer.length,
        width: metadata.width,
        height: metadata.height,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`
      };
      
      const savedImage = await storage.createImage(imageData);
      
      res.json({
        ...savedImage,
        url: `/uploads/${filename}`,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Get all images
  app.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getImages();
      const imagesWithUrls = images.map(image => ({
        ...image,
        url: `/uploads/${image.filename}`,
        thumbnailUrl: image.thumbnailUrl || `/uploads/thumbnails/thumb_${image.filename}`
      }));
      res.json(imagesWithUrls);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Get single image
  app.get("/api/images/:id", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.getImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      const imageWithUrls = {
        ...image,
        url: `/uploads/${image.filename}`,
        thumbnailUrl: image.thumbnailUrl || `/uploads/thumbnails/thumb_${image.filename}`
      };
      
      res.json(imageWithUrls);
    } catch (error) {
      console.error("Failed to fetch image:", error);
      res.status(500).json({ message: "Failed to fetch image" });
    }
  });

  // Delete image (admin only)
  app.delete("/api/images/:id", requireAdmin, async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.getImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Delete files
      try {
        await fs.unlink(path.join('uploads', image.filename));
        await fs.unlink(path.join('uploads/thumbnails', `thumb_${image.filename}`));
      } catch (fileError) {
        console.error("Error deleting files:", fileError);
      }

      // Delete from database
      await storage.deleteImage(imageId);
      
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Image deletion error:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Process image with overlays for download
  app.post("/api/images/:id/process", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.getImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      const { overlays = [], quality = "original", addWatermark = true } = req.body;
      
      // Read original image
      const imagePath = path.join('uploads', image.filename);
      const imageBuffer = await fs.readFile(imagePath);
      
      // Process image (client-side text overlays, server applies quality/watermark only)
      const processedBuffer = await processImageWithOverlays(imageBuffer, {
        overlays: [], // Text overlays handled client-side in non-Canvas version
        quality: quality as "original" | "high" | "medium" | "low",
        addWatermark
      });
      
      // Set headers for download
      const downloadFilename = `edited_${image.originalName}`;
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', processedBuffer.length.toString());
      
      res.end(processedBuffer, 'binary');
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to process download" });
    }
  });

  // Serve static files
  app.use('/uploads', express.static('uploads'));

  return httpServer;
}