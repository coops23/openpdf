export type AnnotationTool =
  | 'cursor'
  | 'highlight'
  | 'underline'
  | 'pen'
  | 'text'
  | 'rect'
  | 'arrow'
  | 'sticky'
  | 'signature'
  | 'eraser';

export interface AnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BaseAnnotation {
  id: string;
  pageNumber: number;
  tool: AnnotationTool;
  createdAt: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  tool: 'highlight' | 'underline';
  rects: AnnotationRect[];
  color: string;
  selectedText: string;
}

export interface StickyNoteAnnotation extends BaseAnnotation {
  tool: 'sticky';
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface FabricAnnotation extends BaseAnnotation {
  tool: 'pen' | 'text' | 'rect' | 'arrow' | 'signature';
  fabricObjectJson: string;
}

export type Annotation =
  | HighlightAnnotation
  | StickyNoteAnnotation
  | FabricAnnotation;

export interface PageAnnotations {
  pageNumber: number;
  annotations: Annotation[];
}
