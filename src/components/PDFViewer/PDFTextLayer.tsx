import React, { useEffect, useRef } from 'react';
import type * as pdfjsLib from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';

interface PDFTextLayerProps {
  page: pdfjsLib.PDFPageProxy;
  scale: number;
  width: number;
  height: number;
}

const PDFTextLayer: React.FC<PDFTextLayerProps> = ({ page, scale, width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<TextLayer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || width === 0 || height === 0) return;

    // Cancel and clean up existing text layer
    textLayerRef.current?.cancel();
    container.innerHTML = '';

    const viewport = page.getViewport({ scale });

    const readableStream = page.streamTextContent({
      includeMarkedContent: true,
    });

    const textLayer = new TextLayer({
      textContentSource: readableStream,
      container,
      viewport,
    });

    textLayerRef.current = textLayer;
    textLayer.render().catch((err) => {
      if (err?.name !== 'AbortException') {
        console.warn('Text layer render error:', err);
      }
    });

    return () => {
      textLayerRef.current?.cancel();
      textLayerRef.current = null;
    };
  }, [page, scale, width, height]);

  return (
    <div
      ref={containerRef}
      className="textLayer"
      style={{
        position: 'absolute',
        inset: 0,
        width,
        height,
        pointerEvents: 'all',
        userSelect: 'text',
        WebkitUserSelect: 'text',
        zIndex: 1,
      }}
    />
  );
};

export default PDFTextLayer;
