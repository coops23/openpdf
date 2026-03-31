import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Annotation,
  AnnotationTool,
  HighlightAnnotation,
  StickyNoteAnnotation,
  AnnotationRect,
} from '../types/annotation.types';
import { HIGHLIGHT_COLOR, UNDERLINE_COLOR } from '../utils/constants';

export function useAnnotations() {
  // Map of pageNumber -> Annotation[]
  const [annotationsByPage, setAnnotationsByPage] = useState<Map<number, Annotation[]>>(new Map());

  const getPageAnnotations = useCallback(
    (pageNumber: number): Annotation[] => {
      return annotationsByPage.get(pageNumber) ?? [];
    },
    [annotationsByPage]
  );

  const addAnnotation = useCallback((annotation: Annotation) => {
    setAnnotationsByPage(prev => {
      const next = new Map(prev);
      const existing = next.get(annotation.pageNumber) ?? [];
      next.set(annotation.pageNumber, [...existing, annotation]);
      return next;
    });
  }, []);

  const removeAnnotation = useCallback((pageNumber: number, id: string) => {
    setAnnotationsByPage(prev => {
      const next = new Map(prev);
      const existing = next.get(pageNumber) ?? [];
      next.set(pageNumber, existing.filter(a => a.id !== id));
      return next;
    });
  }, []);

  const clearPageAnnotations = useCallback((pageNumber: number) => {
    setAnnotationsByPage(prev => {
      const next = new Map(prev);
      next.set(pageNumber, []);
      return next;
    });
  }, []);

  const clearAllAnnotations = useCallback(() => {
    setAnnotationsByPage(new Map());
  }, []);

  const addHighlight = useCallback(
    (
      pageNumber: number,
      tool: 'highlight' | 'underline',
      rects: AnnotationRect[],
      selectedText: string
    ) => {
      const annotation: HighlightAnnotation = {
        id: uuidv4(),
        pageNumber,
        tool,
        createdAt: Date.now(),
        rects,
        color: tool === 'highlight' ? HIGHLIGHT_COLOR : UNDERLINE_COLOR,
        selectedText,
      };
      addAnnotation(annotation);
      return annotation;
    },
    [addAnnotation]
  );

  const addStickyNote = useCallback(
    (pageNumber: number, x: number, y: number, text: string) => {
      const annotation: StickyNoteAnnotation = {
        id: uuidv4(),
        pageNumber,
        tool: 'sticky',
        createdAt: Date.now(),
        x,
        y,
        text,
        color: '#fff9c4',
      };
      addAnnotation(annotation);
      return annotation;
    },
    [addAnnotation]
  );

  const getAllAnnotations = useCallback((): Annotation[] => {
    const all: Annotation[] = [];
    for (const annotations of annotationsByPage.values()) {
      all.push(...annotations);
    }
    return all;
  }, [annotationsByPage]);

  return {
    annotationsByPage,
    getPageAnnotations,
    addAnnotation,
    removeAnnotation,
    clearPageAnnotations,
    clearAllAnnotations,
    addHighlight,
    addStickyNote,
    getAllAnnotations,
  };
}
