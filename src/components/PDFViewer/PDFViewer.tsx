import React, { useState, useEffect, useCallback, useRef } from 'react';
import type * as pdfjsLib from 'pdfjs-dist';
import type { AnnotationTool } from '../../types/annotation.types';
import PDFPage from './PDFPage';
import { DEFAULT_SCALE } from '../../utils/constants';

interface PDFViewerProps {
  pdfDocument: pdfjsLib.PDFDocumentProxy;
  scale: number;
  activeTool: AnnotationTool;
  onStickyClick: (pageNumber: number, x: number, y: number) => void;
  onSignatureClick: (pageNumber: number, x: number, y: number) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfDocument,
  scale,
  activeTool,
  onStickyClick,
  onSignatureClick,
}) => {
  const [pages, setPages] = useState<pdfjsLib.PDFPageProxy[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load all pages when document changes
  useEffect(() => {
    let cancelled = false;

    const loadPages = async () => {
      const loaded: pdfjsLib.PDFPageProxy[] = [];
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        if (cancelled) break;
        const page = await pdfDocument.getPage(i);
        loaded.push(page);
      }
      if (!cancelled) setPages(loaded);
    };

    setPages([]);
    loadPages();

    return () => {
      cancelled = true;
    };
  }, [pdfDocument]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
        padding: '24px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {pages.map((page, index) => (
        <PDFPage
          key={`page-${index + 1}-${pdfDocument.fingerprints[0]}`}
          page={page}
          pageNumber={index + 1}
          scale={scale}
          activeTool={activeTool}
          onStickyClick={onStickyClick}
          onSignatureClick={onSignatureClick}
        />
      ))}

      {pages.length === 0 && (
        <div style={{ color: '#9e9e9e', marginTop: 80, fontSize: 16 }}>
          Loading pages…
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
