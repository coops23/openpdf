import React, { useState, useCallback } from 'react';
import { usePDF } from './hooks/usePDF';
import { DEFAULT_SCALE } from './utils/constants';
import type { AnnotationTool } from './types/annotation.types';
import { fabricCanvasManager } from './services/fabricCanvasManager';
import { exportAnnotatedPDF } from './services/exportService';
import { fabric } from 'fabric';

import FileUpload from './components/FileUpload/FileUpload';
import PDFViewer from './components/PDFViewer/PDFViewer';
import Toolbar from './components/Toolbar/Toolbar';
import CommentModal from './components/Modals/CommentModal';
import SignatureModal from './components/Modals/SignatureModal';

interface PendingPlacement {
  pageNumber: number;
  x: number;
  y: number;
}

const App: React.FC = () => {
  const { pdfDocument, numPages, loading, error, fileName, originalBytes, loadPDF, closePDF } =
    usePDF();

  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('cursor');
  const [isSaving, setIsSaving] = useState(false);

  // Modals state
  const [stickyPending, setStickyPending] = useState<PendingPlacement | null>(null);
  const [signaturePending, setSignaturePending] = useState<PendingPlacement | null>(null);

  // Annotation state (lightweight — Fabric canvases hold the real state)
  const [annotationsByPage] = useState<Map<number, []>>(new Map());

  const handleFileSelected = useCallback(
    (file: File) => {
      setActiveTool('cursor');
      loadPDF(file);
    },
    [loadPDF]
  );

  const handleClose = useCallback(() => {
    closePDF();
    setActiveTool('cursor');
    setScale(DEFAULT_SCALE);
  }, [closePDF]);

  const handleSave = useCallback(async () => {
    if (!originalBytes || !fileName || numPages === 0) return;
    setIsSaving(true);
    try {
      await exportAnnotatedPDF({
        originalBytes,
        numPages,
        fileName,
        annotationsByPage: annotationsByPage as Map<number, never>,
      });
    } catch (e) {
      console.error('Export error:', e);
      alert('Failed to save PDF. See console for details.');
    } finally {
      setIsSaving(false);
    }
  }, [originalBytes, fileName, numPages, annotationsByPage]);

  // Sticky note handlers
  const handleStickyClick = useCallback((pageNumber: number, x: number, y: number) => {
    setStickyPending({ pageNumber, x, y });
  }, []);

  const handleStickyConfirm = useCallback(
    (text: string) => {
      if (!stickyPending) return;
      const { pageNumber, x, y } = stickyPending;
      const fc = fabricCanvasManager.get(pageNumber);
      if (fc) {
        const bg = new fabric.Rect({
          width: 150,
          height: 90,
          fill: '#fff9c4',
          stroke: '#f9a825',
          strokeWidth: 1.5,
          rx: 4,
          ry: 4,
        });
        const label = new fabric.Textbox(text || 'Note', {
          fontSize: 12,
          fill: '#5d4037',
          width: 138,
          left: 6,
          top: 8,
          fontFamily: 'Arial',
          editable: true,
        });
        const group = new fabric.Group([bg, label], {
          left: x,
          top: y,
          selectable: true,
        });
        fc.add(group);
        fc.setActiveObject(group);
        fc.requestRenderAll();
      }
      setStickyPending(null);
    },
    [stickyPending]
  );

  // Signature handlers
  const handleSignatureClick = useCallback((pageNumber: number, x: number, y: number) => {
    setSignaturePending({ pageNumber, x, y });
  }, []);

  const handleSignatureConfirm = useCallback(
    (dataUrl: string) => {
      if (!signaturePending) return;
      const { pageNumber, x, y } = signaturePending;
      const fc = fabricCanvasManager.get(pageNumber);
      if (fc) {
        fabric.Image.fromURL(dataUrl, (img) => {
          img.set({
            left: x,
            top: y,
            scaleX: 0.5,
            scaleY: 0.5,
            selectable: true,
          });
          fc.add(img);
          fc.setActiveObject(img);
          fc.requestRenderAll();
        });
      }
      setSignaturePending(null);
    },
    [signaturePending]
  );

  const hasPDF = pdfDocument !== null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* Header / App bar */}
      <div
        style={{
          background: '#1a1a2e',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          height: 44,
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        <h1 style={{ color: '#64b5f6', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
          OpenPDF
        </h1>
        <span style={{ color: '#546e7a', fontSize: 12, marginLeft: 8 }}>
          Client-side PDF Annotator
        </span>
      </div>

      {/* Toolbar (only when PDF is loaded) */}
      {hasPDF && (
        <Toolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          scale={scale}
          onScaleChange={setScale}
          numPages={numPages}
          fileName={fileName}
          onSave={handleSave}
          onClose={handleClose}
          isSaving={isSaving}
        />
      )}

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {hasPDF ? (
          <PDFViewer
            pdfDocument={pdfDocument}
            scale={scale}
            activeTool={activeTool}
            onStickyClick={handleStickyClick}
            onSignatureClick={handleSignatureClick}
          />
        ) : (
          <FileUpload
            onFileSelected={handleFileSelected}
            loading={loading}
            error={error}
          />
        )}
      </div>

      {/* Modals */}
      {stickyPending && (
        <CommentModal
          onConfirm={handleStickyConfirm}
          onCancel={() => setStickyPending(null)}
        />
      )}
      {signaturePending && (
        <SignatureModal
          onConfirm={handleSignatureConfirm}
          onCancel={() => setSignaturePending(null)}
        />
      )}
    </div>
  );
};

export default App;
