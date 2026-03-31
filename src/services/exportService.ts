import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { fabricCanvasManager } from './fabricCanvasManager';
import type { Annotation, HighlightAnnotation } from '../types/annotation.types';

interface ExportOptions {
  originalBytes: Uint8Array;
  numPages: number;
  fileName: string;
  annotationsByPage: Map<number, Annotation[]>;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [0, 0, 0];
}

function parseRgba(color: string): [number, number, number, number] {
  // Handles rgba(r,g,b,a) or #rrggbb
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return [
      parseInt(rgbaMatch[1]) / 255,
      parseInt(rgbaMatch[2]) / 255,
      parseInt(rgbaMatch[3]) / 255,
      rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    ];
  }
  const [r, g, b] = hexToRgb(color);
  return [r, g, b, 1];
}

export async function exportAnnotatedPDF(options: ExportOptions): Promise<void> {
  const { originalBytes, numPages, fileName, annotationsByPage } = options;

  const pdfDoc = await PDFDocument.load(originalBytes);
  const pages = pdfDoc.getPages();

  for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
    const pageNum = pageIndex + 1;
    const pdfPage = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = pdfPage.getSize();

    // 1. Embed Fabric.js canvas as PNG overlay
    const canvasDataUrl = fabricCanvasManager.getDataUrl(pageNum);
    if (canvasDataUrl) {
      try {
        const base64 = canvasDataUrl.replace(/^data:image\/png;base64,/, '');
        const pngBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const pngImage = await pdfDoc.embedPng(pngBytes);

        // The fabric canvas dimensions match the rendered PDF page dimensions.
        // We need to scale to the actual PDF page dimensions.
        pdfPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
          opacity: 1,
        });
      } catch (e) {
        console.warn(`Failed to embed canvas for page ${pageNum}:`, e);
      }
    }

    // 2. Draw highlight annotations as proper PDF path annotations
    const annotations = annotationsByPage.get(pageNum) ?? [];
    const highlights = annotations.filter(
      (a): a is HighlightAnnotation =>
        a.tool === 'highlight' || a.tool === 'underline'
    );

    // We need the canvas size to compute the coordinate transform
    const fabricCanvas = fabricCanvasManager.get(pageNum);
    const canvasWidth = fabricCanvas?.getWidth() ?? pageWidth;
    const canvasHeight = fabricCanvas?.getHeight() ?? pageHeight;

    const scaleX = pageWidth / canvasWidth;
    const scaleY = pageHeight / canvasHeight;

    for (const hl of highlights) {
      const [r, g, b, a] = parseRgba(hl.color);

      for (const rect of hl.rects) {
        // Convert canvas coords to PDF coords (PDF Y-axis is bottom-up)
        const pdfX = rect.x * scaleX;
        const pdfY = pageHeight - (rect.y + rect.height) * scaleY;
        const pdfW = rect.width * scaleX;
        const pdfH = rect.height * scaleY;

        if (hl.tool === 'highlight') {
          pdfPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            color: rgb(r, g, b),
            opacity: a,
          });
        } else {
          // Underline: draw a line at the bottom of the rect
          pdfPage.drawLine({
            start: { x: pdfX, y: pdfY },
            end: { x: pdfX + pdfW, y: pdfY },
            thickness: 2,
            color: rgb(r, g, b),
            opacity: a,
          });
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  // pdf-lib always returns a plain ArrayBuffer; cast to satisfy TS strict types
  const blob = new Blob([(pdfBytes.buffer as ArrayBuffer).slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.replace(/\.pdf$/i, '') + '_annotated.pdf';
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
