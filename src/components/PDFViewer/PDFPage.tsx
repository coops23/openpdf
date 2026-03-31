import React, { useState, useRef, useCallback, useEffect } from 'react';
import type * as pdfjsLib from 'pdfjs-dist';
import type { AnnotationTool } from '../../types/annotation.types';
import PDFPageCanvas from './PDFPageCanvas';
import PDFTextLayer from './PDFTextLayer';
import AnnotationLayer from '../Annotations/AnnotationLayer';
import { fabricCanvasManager } from '../../services/fabricCanvasManager';
import { HIGHLIGHT_COLOR, UNDERLINE_COLOR } from '../../utils/constants';
import { fabric } from 'fabric';

interface PDFPageProps {
  page: pdfjsLib.PDFPageProxy;
  pageNumber: number;
  scale: number;
  activeTool: AnnotationTool;
  onStickyClick: (pageNumber: number, x: number, y: number) => void;
  onSignatureClick: (pageNumber: number, x: number, y: number) => void;
}

const PDFPage: React.FC<PDFPageProps> = ({
  page,
  pageNumber,
  scale,
  activeTool,
  onStickyClick,
  onSignatureClick,
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const pageRef = useRef<HTMLDivElement>(null);

  const handleDimensionsChange = useCallback((width: number, height: number) => {
    setDimensions({ width, height });
  }, []);

  // Handle text selection for highlight/underline
  useEffect(() => {
    if (activeTool !== 'highlight' && activeTool !== 'underline') return;

    const container = pageRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      const domRects = range.getClientRects();
      const pageRect = container.getBoundingClientRect();
      const fc = fabricCanvasManager.get(pageNumber);
      if (!fc) return;

      const isUnderline = activeTool === 'underline';
      const color = isUnderline ? UNDERLINE_COLOR : HIGHLIGHT_COLOR;

      for (let i = 0; i < domRects.length; i++) {
        const r = domRects[i];
        if (r.width < 1 || r.height < 1) continue;

        const x = r.left - pageRect.left;
        const y = r.top - pageRect.top;
        const w = r.width;
        const h = r.height;

        if (isUnderline) {
          const line = new fabric.Line([x, y + h, x + w, y + h], {
            stroke: color,
            strokeWidth: 2,
            selectable: true,
            opacity: 0.9,
          });
          fc.add(line);
        } else {
          const rect = new fabric.Rect({
            left: x,
            top: y,
            width: w,
            height: h,
            fill: color,
            selectable: true,
            opacity: 1,
          });
          fc.add(rect);
        }
      }

      fc.requestRenderAll();
      selection.removeAllRanges();
    };

    container.addEventListener('mouseup', handleMouseUp);
    return () => container.removeEventListener('mouseup', handleMouseUp);
  }, [activeTool, pageNumber]);

  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (activeTool === 'sticky') {
        onStickyClick(pageNumber, x, y);
      } else if (activeTool === 'signature') {
        onSignatureClick(pageNumber, x, y);
      }
    },
    [activeTool, pageNumber, onStickyClick, onSignatureClick]
  );

  return (
    <div
      ref={pageRef}
      style={{
        position: 'relative',
        width: dimensions.width || 'auto',
        height: dimensions.height || 'auto',
        margin: '0 auto 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        background: '#fff',
        flexShrink: 0,
      }}
    >
      {/* Layer 1 (bottom): PDF.js rendered canvas */}
      <PDFPageCanvas
        page={page}
        scale={scale}
        onDimensionsChange={handleDimensionsChange}
      />

      {/* Layer 2 (middle): PDF.js text layer for text selection */}
      {dimensions.width > 0 && (
        <PDFTextLayer
          page={page}
          scale={scale}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      {/* Layer 3 (top): Fabric.js annotation canvas */}
      {dimensions.width > 0 && (
        <AnnotationLayer
          pageNumber={pageNumber}
          width={dimensions.width}
          height={dimensions.height}
          activeTool={activeTool}
          onCanvasClick={handleCanvasClick}
        />
      )}
    </div>
  );
};

export default PDFPage;
