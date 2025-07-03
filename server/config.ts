export const config = {
  adminEmail: process.env.ADMIN_EMAIL || "admin@photogallery.com",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  sessionSecret: process.env.SESSION_SECRET || "your-secret-key-here",
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  watermark: {
    text: "PhotoGallery",
    opacity: 0.7,
    fontSize: 12,
  },
  compression: {
    uploadQuality: "medium", // Compress uploaded images for storage efficiency
    thumbnailSize: 300, // Max thumbnail dimension while preserving aspect ratio
    maxImageWidth: 2048, // Max width for uploaded images
    maxImageHeight: 2048, // Max height for uploaded images
  }
};
