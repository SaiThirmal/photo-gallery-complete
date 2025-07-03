import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (quality: string) => void;
  isDownloading?: boolean;
}

export default function DownloadModal({ 
  open, 
  onOpenChange, 
  onDownload, 
  isDownloading = false 
}: DownloadModalProps) {
  const [quality, setQuality] = useState("medium");

  const qualityOptions = [
    { value: "original", label: "Original Quality (100%)", size: "~4.2 MB", description: "No compression, best quality" },
    { value: "high", label: "High Quality (90%)", size: "~2.8 MB", description: "Minimal compression, excellent quality" },
    { value: "medium", label: "Medium Quality (75%)", size: "~1.9 MB", description: "Balanced compression and quality" },
    { value: "low", label: "Low Quality (60%)", size: "~1.2 MB", description: "High compression, smaller file size" },
  ];

  const selectedOption = qualityOptions.find(opt => opt.value === quality);

  const handleDownload = () => {
    onDownload(quality);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Download Image
          </DialogTitle>
          <DialogDescription>
            Choose image quality and format for download. All downloads include a watermark.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Quality
            </label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {qualityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Format:</span>
              <span className="text-foreground">JPEG</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated size:</span>
              <span className="text-foreground">{selectedOption?.size}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dimensions:</span>
              <span className="text-foreground">Preserved</span>
            </div>
            {selectedOption?.description && (
              <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                {selectedOption.description}
              </div>
            )}
          </div>

          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Downloaded images will include a small watermark.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isDownloading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isDownloading ? "Processing..." : "Download"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
