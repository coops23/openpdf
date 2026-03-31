import React, { useEffect, useRef } from 'react';
import type * as pdfjsLib from 'pdfjs-dist';

interface PDFPageCanvasProps {
  page: pdfjsLib.PDFPageProxy;
  scale: number;
  onDimensionsChange: (width: number, height: number) => void;
}

const PDFPageCanvas: React.FC<PDFPageCanvasProps> = ({ page, scale, onDimensionsChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const viewport = page.getViewport({ scale });
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = viewport.width * pixelRatio;
    canvas.height = viewport.height * pixelRatio;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    ctx.scale(pixelRatio, pixelRatio);

    onDimensionsChange(viewport.width, viewport.height);

    // Cancel any existing render
    renderTaskRef.current?.cancel();

    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
    });
    renderTaskRef.current = renderTask;

    renderTask.promise.catch((err) => {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('PDF render error:', err);
      }
    });

    return () => {
      renderTaskRef.current?.cancel();
    };
  }, [page, scale, onDimensionsChange]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', position: 'absolute', inset: 0 }}
    />
  );
};

export default PDFPageCanvas;
