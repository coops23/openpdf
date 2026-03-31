import { fabric } from 'fabric';

/**
 * Central registry of Fabric.js canvases keyed by page number.
 * Allows exportService and other modules to access any page's canvas.
 */
class FabricCanvasManager {
  private canvases = new Map<number, fabric.Canvas>();

  register(pageNumber: number, canvas: fabric.Canvas): void {
    this.canvases.set(pageNumber, canvas);
  }

  unregister(pageNumber: number): void {
    this.canvases.delete(pageNumber);
  }

  get(pageNumber: number): fabric.Canvas | undefined {
    return this.canvases.get(pageNumber);
  }

  getAll(): Map<number, fabric.Canvas> {
    return new Map(this.canvases);
  }

  getPageNumbers(): number[] {
    return Array.from(this.canvases.keys()).sort((a, b) => a - b);
  }

  /**
   * Returns the canvas data URL for a page, or null if not found.
   */
  getDataUrl(pageNumber: number): string | null {
    const canvas = this.canvases.get(pageNumber);
    if (!canvas) return null;
    return canvas.toDataURL({ format: 'png', multiplier: 1 });
  }

  /**
   * Returns true if the page has any objects (annotations) drawn.
   */
  hasAnnotations(pageNumber: number): boolean {
    const canvas = this.canvases.get(pageNumber);
    return (canvas?.getObjects()?.length ?? 0) > 0;
  }
}

export const fabricCanvasManager = new FabricCanvasManager();
