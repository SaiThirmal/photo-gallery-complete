import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
}

interface HistoryEntry {
  overlays: TextOverlay[];
}

export function useImageEditor() {
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([{ overlays: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const { toast } = useToast();

  const saveToHistory = useCallback((newOverlays: TextOverlay[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ overlays: newOverlays });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const addOverlay = useCallback(() => {
    const newOverlay: TextOverlay = {
      id: `overlay_${Date.now()}`,
      text: "New Text",
      x: 50,
      y: 50,
      fontSize: 32,
      fontFamily: "Inter",
      color: "#ffffff",
      rotation: 0,
    };
    const newOverlays = [...overlays, newOverlay];
    setOverlays(newOverlays);
    setSelectedOverlay(newOverlay.id);
    saveToHistory(newOverlays);
  }, [overlays, saveToHistory]);

  const updateOverlay = useCallback((id: string, updates: Partial<TextOverlay>) => {
    const newOverlays = overlays.map(overlay =>
      overlay.id === id ? { ...overlay, ...updates } : overlay
    );
    setOverlays(newOverlays);
    saveToHistory(newOverlays);
  }, [overlays, saveToHistory]);

  const duplicateOverlay = useCallback((id: string) => {
    const overlay = overlays.find(o => o.id === id);
    if (!overlay) return;
    
    const duplicatedOverlay: TextOverlay = {
      ...overlay,
      id: `overlay_${Date.now()}`,
      x: overlay.x + 20, // Offset position slightly
      y: overlay.y + 20,
    };
    const newOverlays = [...overlays, duplicatedOverlay];
    setOverlays(newOverlays);
    setSelectedOverlay(duplicatedOverlay.id);
    saveToHistory(newOverlays);
  }, [overlays, saveToHistory]);

  const deleteOverlay = useCallback((id: string) => {
    const newOverlays = overlays.filter(overlay => overlay.id !== id);
    setOverlays(newOverlays);
    setSelectedOverlay(null);
    saveToHistory(newOverlays);
  }, [overlays, saveToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setOverlays(history[newIndex].overlays);
      setSelectedOverlay(null);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setOverlays(history[newIndex].overlays);
      setSelectedOverlay(null);
    }
  }, [history, historyIndex]);

  const getQualityValue = (quality: string): number => {
    switch (quality) {
      case "high": return 0.9;
      case "medium": return 0.75;
      case "low": return 0.6;
      default: return 0.8;
    }
  };

  const downloadMutation = useMutation({
    mutationFn: async ({ imageId, quality, imageElement }: { imageId: number; quality: string; imageElement?: HTMLImageElement }) => {
      console.log("Downloading with overlays:", overlays);
      console.log("Download quality:", quality);
      
      if (!imageElement) {
        throw new Error("No image element provided");
      }
      
      // Create a canvas to render the image with overlays for client-side processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Set canvas size to match image
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      
      // Calculate scale factors between display and actual image size
      const displayWidth = imageElement.clientWidth;
      const displayHeight = imageElement.clientHeight;
      const scaleX = imageElement.naturalWidth / displayWidth;
      const scaleY = imageElement.naturalHeight / displayHeight;
      
      // Draw the background image
      ctx.drawImage(imageElement, 0, 0);
      
      // Draw text overlays with proper scaling
      overlays.forEach(overlay => {
        ctx.save();
        
        // Scale font size and position to match actual image dimensions
        const scaledFontSize = overlay.fontSize * scaleX;
        const scaledX = overlay.x * scaleX;
        const scaledY = overlay.y * scaleY;
        
        // Set font
        ctx.font = `${scaledFontSize}px ${overlay.fontFamily}`;
        ctx.fillStyle = overlay.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Apply rotation and position
        ctx.translate(scaledX, scaledY);
        ctx.rotate((overlay.rotation * Math.PI) / 180);
        
        // Draw text
        ctx.fillText(overlay.text, 0, 0);
        
        ctx.restore();
      });
      
      // Add watermark directly to client-side canvas
      ctx.save();
      const watermarkText = "© Photo Gallery";
      const fontSize = Math.max(16, Math.min(canvas.width, canvas.height) / 50);
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      
      const padding = 20;
      const x = canvas.width - padding;
      const y = canvas.height - padding;
      
      // Draw watermark with stroke for better visibility
      ctx.strokeText(watermarkText, x, y);
      ctx.fillText(watermarkText, x, y);
      ctx.restore();
      
      // Convert to blob with quality
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create image blob"));
          },
          'image/jpeg',
          getQualityValue(quality)
        );
      });
    },
    onSuccess: (blob, { imageId }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited_image_${imageId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Image downloaded successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download image",
        variant: "destructive",
      });
    },
  });

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    overlays,
    selectedOverlay,
    setSelectedOverlay,
    addOverlay,
    updateOverlay,
    deleteOverlay,
    duplicateOverlay,
    undo,
    redo,
    canUndo,
    canRedo,
    downloadImage: downloadMutation.mutate,
    isDownloading: downloadMutation.isPending,
  };
}
