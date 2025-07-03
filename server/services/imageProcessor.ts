import sharp from "sharp";
import { config } from "../config";
import { createCanvas, loadImage } from "canvas";

export interface TextOverlay {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
}

export interface ProcessImageOptions {
  overlays?: TextOverlay[];
  quality?: "original" | "high" | "medium" | "low";
  addWatermark?: boolean;
}

export async function processImageWithOverlays(
  imageBuffer: Buffer,
  options: ProcessImageOptions = {}
): Promise<Buffer> {
  const { overlays = [], quality = "medium", addWatermark = true } = options;
  
  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;
  
  // Apply quality-based compression settings
  const compressionSettings = {
    original: { quality: 100, progressive: false },
    high: { quality: 90, progressive: true },
    medium: { quality: 75, progressive: true },
    low: { quality: 60, progressive: true },
  };
  
  const settings = compressionSettings[quality];
  
  // If no overlays and no watermark, just compress and return
  if (overlays.length === 0 && !addWatermark) {
    return sharp(imageBuffer)
      .jpeg({ quality: settings.quality, progressive: settings.progressive })
      .toBuffer();
  }
  
  try {
    console.log("Creating canvas with dimensions:", width, height);
    
    // Create canvas for text rendering
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    console.log("Canvas created successfully");
    
    // Load and draw the original image
    const image = await loadImage(imageBuffer);
    console.log("Image loaded, drawing to canvas");
    ctx.drawImage(image, 0, 0, width, height);
    console.log("Image drawn to canvas");
    
    // Draw text overlays
    if (overlays.length > 0) {
      console.log("Processing overlays with Canvas:", overlays);
      
      overlays.forEach(overlay => {
        ctx.save();
        
        // Map font families to system fonts available on server
        const fontMap = {
          'Inter': 'Arial',
          'Times New Roman': 'Times',
          'Georgia': 'Georgia',
          'Arial': 'Arial',
          'Helvetica': 'Arial',
          'Courier New': 'Courier',
          'Verdana': 'Arial',
          'Trebuchet MS': 'Arial'
        };
        
        const systemFont = (fontMap as any)[overlay.fontFamily] || 'Arial';
        
        // Set text properties - using exact coordinates from frontend
        ctx.font = `bold ${overlay.fontSize}px ${systemFont}`;
        ctx.fillStyle = overlay.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Add stroke for better visibility
        const strokeColor = overlay.color === '#ffffff' || overlay.color === '#fff' ? '#000000' : '#ffffff';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(2, overlay.fontSize / 16);
        
        console.log(`Drawing text "${overlay.text}" at (${overlay.x}, ${overlay.y}) with font ${overlay.fontSize}px ${systemFont} in color ${overlay.color}`);
        
        // Apply rotation if needed
        if (overlay.rotation !== 0) {
          ctx.translate(overlay.x, overlay.y);
          ctx.rotate((overlay.rotation * Math.PI) / 180);
          ctx.strokeText(overlay.text, 0, 0);
          ctx.fillText(overlay.text, 0, 0);
        } else {
          // Use exact coordinates from frontend
          ctx.strokeText(overlay.text, overlay.x, overlay.y);
          ctx.fillText(overlay.text, overlay.x, overlay.y);
        }
        
        ctx.restore();
      });
    }
    
    // Add watermark if requested
    if (addWatermark) {
      ctx.save();
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      
      const watermarkText = "PhotoGallery";
      const watermarkX = width - 15;
      const watermarkY = height - 15;
      
      ctx.strokeText(watermarkText, watermarkX, watermarkY);
      ctx.fillText(watermarkText, watermarkX, watermarkY);
      ctx.restore();
    }
    
    // Convert canvas to buffer
    console.log("Converting canvas to buffer...");
    const canvasBuffer = canvas.toBuffer('image/jpeg', { quality: settings.quality / 100 });
    console.log("Canvas buffer size:", canvasBuffer.length);
    
    // Apply final compression with Sharp
    console.log("Applying final compression with Sharp...");
    const finalBuffer = await sharp(canvasBuffer)
      .jpeg({ quality: settings.quality, progressive: settings.progressive })
      .toBuffer();
    console.log("Final buffer size:", finalBuffer.length);
    
    return finalBuffer;
      
  } catch (error) {
    console.error("Canvas processing error:", error);
    // Fallback to original image with compression
    return sharp(imageBuffer)
      .jpeg({ quality: settings.quality, progressive: settings.progressive })
      .toBuffer();
  }
}

export async function generateThumbnail(imageBuffer: Buffer, size: number = 300): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(size, size, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
}

export async function compressImageWithResize(
  imageBuffer: Buffer,
  maxWidth: number,
  maxHeight: number,
  quality: number = 80
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, progressive: true })
    .toBuffer();
}

export async function getImageMetadata(imageBuffer: Buffer) {
  const metadata = await sharp(imageBuffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'jpeg',
    size: imageBuffer.length,
  };
}