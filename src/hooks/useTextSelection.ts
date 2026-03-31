import { useCallback } from 'react';
import type { AnnotationRect } from '../types/annotation.types';

export interface TextSelectionResult {
  rects: AnnotationRect[];
  selectedText: string;
  pageElement: HTMLElement | null;
}

export function useTextSelection() {
  const getSelectionRects = useCallback(
    (pageElement: HTMLElement | null): TextSelectionResult => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return { rects: [], selectedText: '', pageElement };
      }

      const selectedText = selection.toString().trim();
      if (!selectedText) {
        return { rects: [], selectedText: '', pageElement };
      }

      const range = selection.getRangeAt(0);
      const domRects = range.getClientRects();

      if (!pageElement) {
        return { rects: [], selectedText, pageElement };
      }

      const pageRect = pageElement.getBoundingClientRect();
      const rects: AnnotationRect[] = [];

      for (let i = 0; i < domRects.length; i++) {
        const r = domRects[i];
        if (r.width < 1 || r.height < 1) continue;

        rects.push({
          x: r.left - pageRect.left,
          y: r.top - pageRect.top,
          width: r.width,
          height: r.height,
        });
      }

      return { rects, selectedText, pageElement };
    },
    []
  );

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
  }, []);

  return { getSelectionRects, clearSelection };
}
