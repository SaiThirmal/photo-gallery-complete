import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { authenticateAdmin, validateSession, logoutAdmin } from "./services/auth";
import { processImageWithOverlays, generateThumbnail, getImageMetadata, compressImageWithResize, type TextOverlay } from "./services/imageProcessor-no-canvas.js";
import { config } from "./config";
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
  const sessionId = req.headers.authorization?.replace("Bearer ", "");
  if (!sessionId || !(await validateSession(sessionId))) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  const thumbnailsDir = path.join(uploadsDir, "thumbnails");
  
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(thumbnailsDir, { recursive: true });
  } catch (error) {
    console.error("Failed to create uploads directory:", error);
  }

  // Serve static files
  app.use("/uploads", express.static(uploadsDir));

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const sessionId = await authenticateAdmin(email, password);
      
      if (sessionId) {
        res.json({ sessionId });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", requireAdmin, async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace("Bearer ", "");
      if (sessionId) {
        await logoutAdmin(sessionId);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/validate", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace("Bearer ", "");
      const isValid = sessionId ? await validateSession(sessionId) : false;
      res.json({ isValid });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Image routes
  app.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  app.get("/api/images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const image = await storage.getImage(id);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json(image);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch image" });
    }
  });

  app.post("/api/images/upload", requireAdmin, upload.array("images", 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedImages = [];

      for (const file of files) {
        const metadata = await getImageMetadata(file.buffer);
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
        const thumbnailFilename = `thumb_${filename}`;
        
        // Compress the original image while preserving aspect ratio
        // Resize large images to reasonable dimensions for storage efficiency
        const compressedBuffer = await compressImageWithResize(
          file.buffer,
          config.compression.maxImageWidth,
          config.compression.maxImageHeight,
          75 // Medium compression quality
        );
        
        // Generate thumbnail with aspect ratio preservation
        const thumbnailBuffer = await generateThumbnail(file.buffer, config.compression.thumbnailSize);
        
        // Save compressed original and thumbnail
        const imagePath = path.join(uploadsDir, filename);
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
        
        await fs.writeFile(imagePath, compressedBuffer);
        await fs.writeFile(thumbnailPath, thumbnailBuffer);
        
        const image = await storage.createImage({
          filename,
          originalName: file.originalname,
          url: `/uploads/${filename}`,
          thumbnailUrl: `/uploads/thumbnails/${thumbnailFilename}`,
          width: metadata.width,
          height: metadata.height,
          fileSize: compressedBuffer.length, // Use compressed file size
          mimeType: "image/jpeg", // Always JPEG after compression
        });
        
        uploadedImages.push(image);
      }

      res.json(uploadedImages);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload images" });
    }
  });

  app.delete("/api/images/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const image = await storage.getImage(id);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Delete files
      const imagePath = path.join(process.cwd(), image.url);
      const thumbnailPath = path.join(process.cwd(), image.thumbnailUrl || "");
      
      try {
        await fs.unlink(imagePath);
        if (image.thumbnailUrl) {
          await fs.unlink(thumbnailPath);
        }
      } catch (fileError) {
        console.error("Failed to delete files:", fileError);
      }
      
      await storage.deleteImage(id);
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  app.post("/api/images/:id/process", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { overlays, quality = "medium" } = req.body;
      
      console.log("Processing image with overlays:", overlays);
      console.log("Quality:", quality);
      console.log("Number of overlays:", overlays?.length || 0);
      
      const image = await storage.getImage(id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Scale coordinates from frontend display size to original image size
      let scaledOverlays = overlays;
      if (overlays && overlays.length > 0) {
        // Frontend scales images to max 800px width, maintaining aspect ratio
        const displayWidth = Math.min(image.width, 800);
        const displayHeight = image.height * (displayWidth / image.width);
        
        // Calculate scaling factors
        const scaleX = image.width / displayWidth;
        const scaleY = image.height / displayHeight;
        
        console.log(`Original image: ${image.width}x${image.height}`);
        console.log(`Display size: ${displayWidth}x${displayHeight}`);
        console.log(`Scale factors: ${scaleX}x, ${scaleY}y`);
        
        scaledOverlays = overlays.map((overlay: any) => ({
          ...overlay,
          x: overlay.x * scaleX,
          y: overlay.y * scaleY,
          fontSize: overlay.fontSize * scaleX, // Scale font size too
        }));
        
        console.log("Scaled overlays:", scaledOverlays);
      }
      
      // Read the original image file
      const imagePath = path.join(process.cwd(), image.url);
      const imageBuffer = await fs.readFile(imagePath);
      
      // Process the image with scaled overlays
      const processedBuffer = await processImageWithOverlays(imageBuffer, {
        overlays: scaledOverlays as TextOverlay[],
        quality,
        addWatermark: true,
      });
      
      // Set appropriate headers for download
      res.set({
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="edited_${image.originalName}"`,
      });
      
      res.send(processedBuffer);
    } catch (error) {
      console.error("Process error:", error);
      res.status(500).json({ message: "Failed to process image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
