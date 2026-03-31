import { useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import type { AnnotationTool } from '../types/annotation.types';
import {
  PEN_COLOR,
  PEN_WIDTH,
  TEXT_COLOR,
  TEXT_FONT_SIZE,
  SHAPE_STROKE_COLOR,
  SHAPE_FILL_COLOR,
} from '../utils/constants';
import { fabricCanvasManager } from '../services/fabricCanvasManager';

interface UseFabricCanvasOptions {
  canvasEl: HTMLCanvasElement | null;
  pageNumber: number;
  activeTool: AnnotationTool;
  scale: number;
}

export function useFabricCanvas({
  canvasEl,
  pageNumber,
  activeTool,
  scale,
}: UseFabricCanvasOptions) {
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawingShapeRef = useRef(false);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const activeShapeRef = useRef<fabric.Object | null>(null);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasEl) return;

    const fc = new fabric.Canvas(canvasEl, {
      selection: activeTool === 'cursor',
      enableRetinaScaling: true,
    });

    fabricRef.current = fc;
    fabricCanvasManager.register(pageNumber, fc);

    return () => {
      fabricCanvasManager.unregister(pageNumber);
      fc.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasEl, pageNumber]);

  // Update tool behavior when activeTool changes
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    // Reset modes
    fc.isDrawingMode = false;
    fc.selection = false;
    fc.defaultCursor = 'default';

    // Remove previous shape listeners
    fc.off('mouse:down');
    fc.off('mouse:move');
    fc.off('mouse:up');

    switch (activeTool) {
      case 'cursor':
        fc.selection = true;
        fc.defaultCursor = 'default';
        fc.forEachObject(obj => { obj.selectable = true; });
        break;

      case 'pen':
        fc.isDrawingMode = true;
        fc.freeDrawingBrush.color = PEN_COLOR;
        fc.freeDrawingBrush.width = PEN_WIDTH;
        fc.forEachObject(obj => { obj.selectable = false; });
        break;

      case 'eraser':
        fc.defaultCursor = 'crosshair';
        fc.on('mouse:down', (opt) => {
          const target = fc.findTarget(opt.e as MouseEvent, false);
          if (target) fc.remove(target);
        });
        break;

      case 'text': {
        fc.defaultCursor = 'text';
        fc.forEachObject(obj => { obj.selectable = false; });
        fc.on('mouse:down', (opt) => {
          const pointer = fc.getPointer(opt.e as MouseEvent);
          const text = new fabric.IText('Type here...', {
            left: pointer.x,
            top: pointer.y,
            fill: TEXT_COLOR,
            fontSize: TEXT_FONT_SIZE,
            fontFamily: 'Arial',
            selectable: true,
            editable: true,
          });
          fc.add(text);
          fc.setActiveObject(text);
          text.enterEditing();
          text.selectAll();
          fc.requestRenderAll();
        });
        break;
      }

      case 'rect': {
        fc.defaultCursor = 'crosshair';
        fc.forEachObject(obj => { obj.selectable = false; });

        fc.on('mouse:down', (opt) => {
          const pointer = fc.getPointer(opt.e as MouseEvent);
          isDrawingShapeRef.current = true;
          shapeStartRef.current = { x: pointer.x, y: pointer.y };

          const rect = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            stroke: SHAPE_STROKE_COLOR,
            strokeWidth: 2,
            fill: SHAPE_FILL_COLOR,
            selectable: false,
          });
          fc.add(rect);
          activeShapeRef.current = rect;
        });

        fc.on('mouse:move', (opt) => {
          if (!isDrawingShapeRef.current || !shapeStartRef.current) return;
          const pointer = fc.getPointer(opt.e as MouseEvent);
          const rect = activeShapeRef.current as fabric.Rect;
          if (!rect) return;

          const { x, y } = shapeStartRef.current;
          rect.set({
            left: Math.min(pointer.x, x),
            top: Math.min(pointer.y, y),
            width: Math.abs(pointer.x - x),
            height: Math.abs(pointer.y - y),
          });
          fc.requestRenderAll();
        });

        fc.on('mouse:up', () => {
          isDrawingShapeRef.current = false;
          shapeStartRef.current = null;
          if (activeShapeRef.current) {
            activeShapeRef.current.set({ selectable: true });
          }
          activeShapeRef.current = null;
        });
        break;
      }

      case 'arrow': {
        fc.defaultCursor = 'crosshair';
        fc.forEachObject(obj => { obj.selectable = false; });

        fc.on('mouse:down', (opt) => {
          const pointer = fc.getPointer(opt.e as MouseEvent);
          isDrawingShapeRef.current = true;
          shapeStartRef.current = { x: pointer.x, y: pointer.y };

          const line = new fabric.Line(
            [pointer.x, pointer.y, pointer.x, pointer.y],
            {
              stroke: SHAPE_STROKE_COLOR,
              strokeWidth: 2,
              selectable: false,
            }
          );
          fc.add(line);
          activeShapeRef.current = line;
        });

        fc.on('mouse:move', (opt) => {
          if (!isDrawingShapeRef.current || !shapeStartRef.current) return;
          const pointer = fc.getPointer(opt.e as MouseEvent);
          const line = activeShapeRef.current as fabric.Line;
          if (!line) return;
          line.set({ x2: pointer.x, y2: pointer.y });
          fc.requestRenderAll();
        });

        fc.on('mouse:up', () => {
          isDrawingShapeRef.current = false;
          shapeStartRef.current = null;
          if (activeShapeRef.current) {
            activeShapeRef.current.set({ selectable: true });
          }
          activeShapeRef.current = null;
        });
        break;
      }

      default:
        // highlight, underline, sticky, signature handled outside
        fc.defaultCursor = 'crosshair';
        fc.forEachObject(obj => { obj.selectable = false; });
        break;
    }

    fc.requestRenderAll();
  }, [activeTool]);

  const addImageFromDataUrl = useCallback(
    (dataUrl: string, x = 50, y = 50) => {
      const fc = fabricRef.current;
      if (!fc) return;
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
    },
    []
  );

  const addHighlightRect = useCallback(
    (
      x: number,
      y: number,
      width: number,
      height: number,
      color: string,
      isUnderline = false
    ) => {
      const fc = fabricRef.current;
      if (!fc) return;

      if (isUnderline) {
        const line = new fabric.Line([x, y + height, x + width, y + height], {
          stroke: color,
          strokeWidth: 2,
          selectable: true,
          evented: true,
          opacity: 0.9,
        });
        fc.add(line);
      } else {
        const rect = new fabric.Rect({
          left: x,
          top: y,
          width,
          height,
          fill: color,
          selectable: true,
          evented: true,
          opacity: 1,
        });
        fc.add(rect);
      }
      fc.requestRenderAll();
    },
    []
  );

  const addStickyNoteIcon = useCallback(
    (x: number, y: number, text: string) => {
      const fc = fabricRef.current;
      if (!fc) return;

      const group = new fabric.Group([], {
        left: x,
        top: y,
        selectable: true,
      });

      const bg = new fabric.Rect({
        width: 140,
        height: 80,
        fill: '#fff9c4',
        stroke: '#f9a825',
        strokeWidth: 1.5,
        rx: 4,
        ry: 4,
      });

      const label = new fabric.Text(text || 'Note', {
        fontSize: 12,
        fill: '#5d4037',
        left: 6,
        top: 8,
        width: 128,
        fontFamily: 'Arial',
      });

      group.addWithUpdate(bg);
      group.addWithUpdate(label);
      fc.add(group);
      fc.setActiveObject(group);
      fc.requestRenderAll();
    },
    []
  );

  const getCanvasDataUrl = useCallback((): string => {
    return fabricRef.current?.toDataURL({ format: 'png', multiplier: 1 }) ?? '';
  }, []);

  const getCanvasJson = useCallback((): string => {
    return JSON.stringify(fabricRef.current?.toJSON() ?? {});
  }, []);

  return {
    fabricCanvas: fabricRef.current,
    addImageFromDataUrl,
    addHighlightRect,
    addStickyNoteIcon,
    getCanvasDataUrl,
    getCanvasJson,
  };
}
