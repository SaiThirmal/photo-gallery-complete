import sharp from 'sharp';

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
  const { quality = "original", addWatermark = false } = options;
  
  let sharpInstance = sharp(imageBuffer);
  
  // Apply quality settings
  switch (quality) {
    case "high":
      sharpInstance = sharpInstance.jpeg({ quality: 90, progressive: true });
      break;
    case "medium":
      sharpInstance = sharpInstance.jpeg({ quality: 75, progressive: true });
      break;
    case "low":
      sharpInstance = sharpInstance.jpeg({ quality: 60, progressive: true });
      break;
    default:
      // Keep original format and quality
      break;
  }
  
  // Note: Text overlays will be handled client-side only in the non-Canvas version
  // The overlays parameter is kept for API compatibility but not processed server-side
  
  if (addWatermark) {
    // Create watermark using Sharp's overlay feature
    const { width, height } = await sharpInstance.metadata();
    if (width && height) {
      try {
        // Create a simple text watermark using a solid background
        const fontSize = Math.max(14, Math.min(width, height) / 50);
        const watermarkText = "© Photo Gallery";
        const padding = 10;
        
        // Create watermark as a separate image with text
        const watermarkSvg = `
          <svg width="200" height="40" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="40" fill="rgba(0,0,0,0.5)" rx="5"/>
            <text x="100" y="25" 
                  font-family="Arial, sans-serif" 
                  font-size="${fontSize}" 
                  font-weight="bold"
                  fill="white" 
                  text-anchor="middle" 
                  dominant-baseline="middle">${watermarkText}</text>
          </svg>`;
        
        const watermarkBuffer = Buffer.from(watermarkSvg);
        
        // Position watermark at bottom-right corner
        sharpInstance = sharpInstance.composite([{
          input: watermarkBuffer,
          top: height - 50,
          left: width - 210,
        }]);
        
        console.log("Watermark applied successfully");
      } catch (watermarkError) {
        console.error("Watermark error:", watermarkError);
        // Continue without watermark if there's an error
      }
    }
  }
  
  return await sharpInstance.toBuffer();
}

export async function generateThumbnail(imageBuffer: Buffer, size: number = 300): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(size, size, { 
      fit: 'cover', 
      position: 'center',
      withoutEnlargement: true
    })
    .jpeg({ 
      quality: 75, 
      progressive: true,
      mozjpeg: true
    })
    .toBuffer();
}

export async function compressImageWithResize(
  imageBuffer: Buffer,
  maxWidth: number = 2048,
  maxHeight: number = 2048,
  quality: number = 85
): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(maxWidth, maxHeight, { 
      fit: 'inside', 
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3
    })
    .jpeg({ 
      quality, 
      progressive: true,
      mozjpeg: true,
      optimiseCoding: true
    })
    .toBuffer();
}

export async function getImageMetadata(imageBuffer: Buffer) {
  const metadata = await sharp(imageBuffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: imageBuffer.length
  };
}