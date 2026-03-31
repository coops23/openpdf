import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDF_WORKER_SRC } from '../utils/constants';

pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

export interface PDFState {
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  numPages: number;
  loading: boolean;
  error: string | null;
  fileName: string | null;
  originalBytes: Uint8Array | null;
}

export function usePDF() {
  const [state, setState] = useState<PDFState>({
    pdfDocument: null,
    numPages: 0,
    loading: false,
    error: null,
    fileName: null,
    originalBytes: null,
  });

  const docRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const loadPDF = useCallback(async (file: File) => {
    setState(s => ({ ...s, loading: true, error: null }));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Destroy previous document
      if (docRef.current) {
        await docRef.current.destroy();
        docRef.current = null;
      }

      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
      const doc = await loadingTask.promise;

      docRef.current = doc;
      setState({
        pdfDocument: doc,
        numPages: doc.numPages,
        loading: false,
        error: null,
        fileName: file.name,
        originalBytes: bytes,
      });
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load PDF',
      }));
    }
  }, []);

  const closePDF = useCallback(async () => {
    if (docRef.current) {
      await docRef.current.destroy();
      docRef.current = null;
    }
    setState({
      pdfDocument: null,
      numPages: 0,
      loading: false,
      error: null,
      fileName: null,
      originalBytes: null,
    });
  }, []);

  useEffect(() => {
    return () => {
      docRef.current?.destroy();
    };
  }, []);

  return { ...state, loadPDF, closePDF };
}
