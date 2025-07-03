import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import DownloadModal from "@/components/DownloadModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useImageEditor } from "@/hooks/useImageEditor";
import { 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  Download, 
  Type, 
  Plus, 
  Trash2,
  RotateCw,
  Move,
  Copy
} from "lucide-react";
import type { Image } from "@shared/schema";

export default function ImageEditor() {
  const [, params] = useRoute("/editor/:id");
  const [, setLocation] = useLocation();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  const {
    overlays,
    selectedOverlay,
    setSelectedOverlay,
    addOverlay,
    updateOverlay,
    duplicateOverlay,
    deleteOverlay,
    undo,
    redo,
    canUndo,
    canRedo,
    downloadImage,
    isDownloading,
  } = useImageEditor();

  const imageId = params?.id ? parseInt(params.id) : null;

  const { data: images, isLoading: imagesLoading } = useQuery<Image[]>({
    queryKey: ['/api/images'],
  });
  
  const image = images?.find(img => img.id === imageId);
  const isLoading = imagesLoading;
  const error = !imagesLoading && !image;

  const selectedOverlayData = overlays.find(o => o.id === selectedOverlay);

  const handleDownload = (quality: string) => {
    if (imageId) {
      // Get the image element for canvas rendering
      const imageElement = document.querySelector('img[src*="uploads"]') as HTMLImageElement;
      downloadImage({ imageId, quality, imageElement });
      setShowDownloadModal(false);
    }
  };



  if (error || (!isLoading && !image)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Image not found or failed to load.</p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gallery
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingSpinner message="Loading image editor..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Editor Header */}
      <div className="bg-card shadow-lg px-4 py-3 flex items-center justify-between border-b">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium text-foreground">Image Editor</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={undo}
            disabled={!canUndo}
            className="p-2"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={redo}
            disabled={!canRedo}
            className="p-2"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button
            onClick={() => setShowDownloadModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>

        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Tools Sidebar */}
        <div className="w-80 bg-card shadow-lg p-4 overflow-y-auto border-r">
          <div className="space-y-6">
            {/* Text Overlay Tools */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Type className="h-4 w-4 mr-2" />
                  Text Overlays
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={addOverlay}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Text Overlay
                </Button>
                
                {overlays.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Type className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No text overlays added</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {overlays.map((overlay) => (
                      <div
                        key={overlay.id}
                        className={`bg-muted rounded-lg p-3 cursor-pointer border-2 material-transition ${
                          selectedOverlay === overlay.id 
                            ? "border-primary" 
                            : "border-transparent hover:border-border"
                        }`}
                        onClick={() => setSelectedOverlay(overlay.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {overlay.text || "Text Layer"}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateOverlay(overlay.id);
                              }}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              title="Duplicate layer"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteOverlay(overlay.id);
                              }}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              title="Delete layer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {overlay.fontSize}px • {overlay.fontFamily}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Text Editing Controls */}
            {selectedOverlayData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Edit Text</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="text" className="text-xs text-muted-foreground">
                      Text
                    </Label>
                    <Input
                      id="text"
                      value={selectedOverlayData.text}
                      onChange={(e) => updateOverlay(selectedOverlayData.id, { text: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Font</Label>
                      <Select
                        value={selectedOverlayData.fontFamily}
                        onValueChange={(value) => updateOverlay(selectedOverlayData.id, { fontFamily: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times</SelectItem>
                          <SelectItem value="Courier New">Courier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Size: {selectedOverlayData.fontSize}px
                      </Label>
                      <Slider
                        value={[selectedOverlayData.fontSize]}
                        onValueChange={([value]) => updateOverlay(selectedOverlayData.id, { fontSize: value })}
                        min={12}
                        max={72}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Color</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="color"
                        value={selectedOverlayData.color}
                        onChange={(e) => updateOverlay(selectedOverlayData.id, { color: e.target.value })}
                        className="w-8 h-6 rounded border border-border"
                      />
                      <Input
                        value={selectedOverlayData.color}
                        onChange={(e) => updateOverlay(selectedOverlayData.id, { color: e.target.value })}
                        className="flex-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transform Controls */}
            {selectedOverlayData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Move className="h-4 w-4 mr-2" />
                    Transform
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Position X: {Math.round(selectedOverlayData.x)}px
                    </Label>
                    <Slider
                      value={[selectedOverlayData.x]}
                      onValueChange={([value]) => updateOverlay(selectedOverlayData.id, { x: value })}
                      min={0}
                      max={800}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Position Y: {Math.round(selectedOverlayData.y)}px
                    </Label>
                    <Slider
                      value={[selectedOverlayData.y]}
                      onValueChange={([value]) => updateOverlay(selectedOverlayData.id, { y: value })}
                      min={0}
                      max={600}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center">
                      <RotateCw className="h-3 w-3 mr-1" />
                      Rotation: {Math.round(selectedOverlayData.rotation)}°
                    </Label>
                    <Slider
                      value={[selectedOverlayData.rotation]}
                      onValueChange={([value]) => updateOverlay(selectedOverlayData.id, { rotation: value })}
                      min={-180}
                      max={180}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
          <div className="relative bg-white shadow-xl rounded-lg overflow-hidden">
            <div 
              className="relative"
              style={{ 
                width: image?.width ? `${Math.min(image.width, 800)}px` : "600px",
                height: image?.height && image?.width ? `${Math.min(image.height * (Math.min(image.width, 800) / image.width), 600)}px` : "400px"
              }}
            >
              {/* Background Image */}
              {image?.filename && (
                <img
                  src={`/uploads/${image.filename}`}
                  alt={image.originalName}
                  className="w-full h-full object-cover"
                  style={{ 
                    display: "block",
                    userSelect: "none"
                  }}
                  onError={() => {
                    console.error("Image failed to load:", `/uploads/${image.filename}`);
                    console.log("Full image data:", image);
                  }}
                  onLoad={() => {
                    console.log("Image loaded successfully:", `/uploads/${image.filename}`);
                  }}
                  draggable={false}
                />
              )}
              
              {!image?.filename && (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">Loading image...</p>
                    <p className="text-sm text-gray-400">Image ID: {imageId}</p>
                  </div>
                </div>
              )}
              
              {/* Text Overlays */}
              {overlays.map((overlay) => {
                let isDragging = false;
                let startX = 0;
                let startY = 0;
                
                const handleMouseDown = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedOverlay(overlay.id);
                  isDragging = true;
                  startX = e.clientX - overlay.x;
                  startY = e.clientY - overlay.y;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    if (isDragging) {
                      const newX = Math.max(0, Math.min(e.clientX - startX, 750));
                      const newY = Math.max(0, Math.min(e.clientY - startY, 550));
                      updateOverlay(overlay.id, { x: newX, y: newY });
                    }
                  };
                  
                  const handleMouseUp = () => {
                    isDragging = false;
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                };

                return (
                  <div
                    key={overlay.id}
                    className={`absolute cursor-move select-none border-2 px-2 py-1 ${
                      selectedOverlay === overlay.id 
                        ? "border-blue-500 bg-blue-50 bg-opacity-20" 
                        : "border-transparent hover:border-gray-300"
                    }`}
                    style={{
                      left: `${overlay.x}px`,
                      top: `${overlay.y}px`,
                      fontSize: `${overlay.fontSize}px`,
                      fontFamily: overlay.fontFamily,
                      color: overlay.color,
                      transform: `rotate(${overlay.rotation}deg)`,
                      transformOrigin: "top left",
                      zIndex: 10,
                      fontWeight: "bold",
                      textShadow: "1px 1px 2px rgba(0,0,0,0.5)"
                    }}
                    onMouseDown={handleMouseDown}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      const newText = prompt("Edit text:", overlay.text);
                      if (newText !== null && newText.trim()) {
                        updateOverlay(overlay.id, { text: newText.trim() });
                      }
                    }}
                  >
                    {overlay.text || "Double-click to edit"}
                  </div>
                );
              })}

              {/* Click to add overlay */}
              <div
                className="absolute inset-0"
                style={{ zIndex: 5 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Add overlay at click position using the hook function
                    addOverlay();
                    
                    // Position the new overlay where clicked (after a brief delay)
                    setTimeout(() => {
                      if (overlays.length > 0) {
                        const lastOverlay = overlays[overlays.length - 1];
                        updateOverlay(lastOverlay.id, { 
                          x: Math.max(0, x - 50), 
                          y: Math.max(0, y - 15) 
                        });
                      }
                    }, 50);
                  }
                }}
              />

              {/* Watermark */}
              <div 
                className="absolute bottom-2 right-2 text-white text-xs px-2 py-1 rounded pointer-events-none"
                style={{ 
                  backgroundColor: "rgba(0,0,0,0.7)",
                  fontSize: "10px",
                  fontWeight: "bold",
                  zIndex: 20
                }}
              >
                PhotoGallery
              </div>
            </div>
          </div>
        </div>
      </div>

      <DownloadModal
        open={showDownloadModal}
        onOpenChange={setShowDownloadModal}
        onDownload={handleDownload}
        isDownloading={isDownloading}
      />
    </div>
  );
}
