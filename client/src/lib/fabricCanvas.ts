import { fabric } from "fabric";
import type { TextOverlay } from "@/hooks/useImageEditor";

export class FabricCanvasManager {
  private canvas: fabric.Canvas;
  private backgroundImage: fabric.Image | null = null;
  private onOverlayChange?: (overlays: TextOverlay[]) => void;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = new fabric.Canvas(canvasElement, {
      selection: true,
      preserveObjectStacking: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.on("object:modified", () => {
      this.notifyOverlayChange();
    });

    this.canvas.on("object:added", () => {
      this.notifyOverlayChange();
    });

    this.canvas.on("object:removed", () => {
      this.notifyOverlayChange();
    });
  }

  public setBackgroundImage(imageUrl: string): Promise<void> {
    return new Promise((resolve) => {
      fabric.Image.fromURL(imageUrl, (img) => {
        this.backgroundImage = img;
        
        // Scale canvas to fit the image
        const canvasAspect = this.canvas.getWidth() / this.canvas.getHeight();
        const imageAspect = img.width! / img.height!;
        
        let scale: number;
        if (imageAspect > canvasAspect) {
          scale = this.canvas.getWidth() / img.width!;
        } else {
          scale = this.canvas.getHeight() / img.height!;
        }
        
        img.scale(scale);
        img.set({
          left: (this.canvas.getWidth() - img.getScaledWidth()) / 2,
          top: (this.canvas.getHeight() - img.getScaledHeight()) / 2,
          selectable: false,
          evented: false,
        });
        
        this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas));
        resolve();
      });
    });
  }

  public addTextOverlay(overlay: TextOverlay): fabric.Text {
    const textObject = new fabric.Text(overlay.text, {
      left: overlay.x,
      top: overlay.y,
      fontSize: overlay.fontSize,
      fontFamily: overlay.fontFamily,
      fill: overlay.color,
      angle: overlay.rotation,
      data: { id: overlay.id },
    });

    this.canvas.add(textObject);
    this.canvas.setActiveObject(textObject);
    return textObject;
  }

  public updateTextOverlay(id: string, updates: Partial<TextOverlay>) {
    const objects = this.canvas.getObjects();
    const textObject = objects.find(obj => obj.data?.id === id) as fabric.Text;
    
    if (textObject) {
      if (updates.text !== undefined) textObject.set("text", updates.text);
      if (updates.fontSize !== undefined) textObject.set("fontSize", updates.fontSize);
      if (updates.fontFamily !== undefined) textObject.set("fontFamily", updates.fontFamily);
      if (updates.color !== undefined) textObject.set("fill", updates.color);
      if (updates.x !== undefined) textObject.set("left", updates.x);
      if (updates.y !== undefined) textObject.set("top", updates.y);
      if (updates.rotation !== undefined) textObject.set("angle", updates.rotation);
      
      this.canvas.renderAll();
    }
  }

  public deleteTextOverlay(id: string) {
    const objects = this.canvas.getObjects();
    const textObject = objects.find(obj => obj.data?.id === id);
    
    if (textObject) {
      this.canvas.remove(textObject);
    }
  }

  public getOverlays(): TextOverlay[] {
    const objects = this.canvas.getObjects();
    return objects
      .filter(obj => obj.data?.id)
      .map(obj => {
        const textObj = obj as fabric.Text;
        return {
          id: obj.data.id,
          text: textObj.text || "",
          x: textObj.left || 0,
          y: textObj.top || 0,
          fontSize: textObj.fontSize || 20,
          fontFamily: textObj.fontFamily || "Arial",
          color: textObj.fill?.toString() || "#000000",
          rotation: textObj.angle || 0,
        };
      });
  }

  public setOnOverlayChange(callback: (overlays: TextOverlay[]) => void) {
    this.onOverlayChange = callback;
  }

  private notifyOverlayChange() {
    if (this.onOverlayChange) {
      this.onOverlayChange(this.getOverlays());
    }
  }

  public exportAsDataURL(format: string = "image/jpeg", quality: number = 0.8): string {
    return this.canvas.toDataURL({
      format,
      quality,
      multiplier: 1,
    });
  }

  public dispose() {
    this.canvas.dispose();
  }
}
