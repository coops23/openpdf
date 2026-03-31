import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import type { AnnotationTool } from '../../types/annotation.types';
import { fabricCanvasManager } from '../../services/fabricCanvasManager';
import {
  PEN_COLOR,
  PEN_WIDTH,
  TEXT_COLOR,
  TEXT_FONT_SIZE,
  SHAPE_STROKE_COLOR,
  SHAPE_FILL_COLOR,
} from '../../utils/constants';

interface AnnotationLayerProps {
  pageNumber: number;
  width: number;
  height: number;
  activeTool: AnnotationTool;
  onCanvasClick?: (x: number, y: number) => void;
}

const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  pageNumber,
  width,
  height,
  activeTool,
  onCanvasClick,
}) => {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawingRef = useRef(false);
  const startPtRef = useRef<{ x: number; y: number } | null>(null);
  const activeObjRef = useRef<fabric.Object | null>(null);

  // Initialize Fabric canvas
  useEffect(() => {
    const el = canvasElRef.current;
    if (!el || width === 0 || height === 0) return;

    const fc = new fabric.Canvas(el, {
      selection: false,
      enableRetinaScaling: false,
      width,
      height,
    });

    fabricRef.current = fc;
    fabricCanvasManager.register(pageNumber, fc);

    return () => {
      fabricCanvasManager.unregister(pageNumber);
      fc.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasElRef.current, pageNumber]);

  // Resize canvas when dimensions change
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || width === 0 || height === 0) return;
    fc.setWidth(width);
    fc.setHeight(height);
    fc.requestRenderAll();
  }, [width, height]);

  // Apply tool behavior
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    fc.isDrawingMode = false;
    fc.selection = false;
    fc.off('mouse:down');
    fc.off('mouse:move');
    fc.off('mouse:up');
    fc.forEachObject(obj => { obj.selectable = activeTool === 'cursor'; });

    switch (activeTool) {
      case 'cursor':
        fc.selection = true;
        fc.defaultCursor = 'default';
        fc.forEachObject(obj => { obj.selectable = true; obj.evented = true; });
        break;

      case 'pen':
        fc.isDrawingMode = true;
        if (fc.freeDrawingBrush) {
          fc.freeDrawingBrush.color = PEN_COLOR;
          fc.freeDrawingBrush.width = PEN_WIDTH;
        }
        break;

      case 'eraser':
        fc.defaultCursor = 'not-allowed';
        fc.on('mouse:down', (opt) => {
          const target = opt.target;
          if (target) {
            fc.remove(target);
            fc.requestRenderAll();
          }
        });
        break;

      case 'text':
        fc.defaultCursor = 'text';
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

      case 'rect':
        fc.defaultCursor = 'crosshair';
        fc.on('mouse:down', (opt) => {
          const pointer = fc.getPointer(opt.e as MouseEvent);
          isDrawingRef.current = true;
          startPtRef.current = { x: pointer.x, y: pointer.y };
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
          activeObjRef.current = rect;
        });
        fc.on('mouse:move', (opt) => {
          if (!isDrawingRef.current || !startPtRef.current) return;
          const pointer = fc.getPointer(opt.e as MouseEvent);
          const rect = activeObjRef.current as fabric.Rect | null;
          if (!rect) return;
          const { x, y } = startPtRef.current;
          rect.set({
            left: Math.min(pointer.x, x),
            top: Math.min(pointer.y, y),
            width: Math.abs(pointer.x - x),
            height: Math.abs(pointer.y - y),
          });
          fc.requestRenderAll();
        });
        fc.on('mouse:up', () => {
          isDrawingRef.current = false;
          startPtRef.current = null;
          activeObjRef.current?.set({ selectable: true });
          activeObjRef.current = null;
        });
        break;

      case 'arrow':
        fc.defaultCursor = 'crosshair';
        fc.on('mouse:down', (opt) => {
          const pointer = fc.getPointer(opt.e as MouseEvent);
          isDrawingRef.current = true;
          startPtRef.current = { x: pointer.x, y: pointer.y };
          const line = new fabric.Line(
            [pointer.x, pointer.y, pointer.x, pointer.y],
            {
              stroke: SHAPE_STROKE_COLOR,
              strokeWidth: 2,
              selectable: false,
            }
          );
          fc.add(line);
          activeObjRef.current = line;
        });
        fc.on('mouse:move', (opt) => {
          if (!isDrawingRef.current) return;
          const pointer = fc.getPointer(opt.e as MouseEvent);
          const line = activeObjRef.current as fabric.Line | null;
          if (!line) return;
          line.set({ x2: pointer.x, y2: pointer.y });
          fc.requestRenderAll();
        });
        fc.on('mouse:up', () => {
          isDrawingRef.current = false;
          startPtRef.current = null;
          activeObjRef.current?.set({ selectable: true });
          activeObjRef.current = null;
        });
        break;

      case 'sticky':
      case 'signature':
        fc.defaultCursor = 'crosshair';
        fc.on('mouse:down', (opt) => {
          const pointer = fc.getPointer(opt.e as MouseEvent);
          onCanvasClick?.(pointer.x, pointer.y);
        });
        break;

      default:
        // highlight / underline: pointer events pass through to text layer
        fc.defaultCursor = 'text';
        break;
    }

    fc.requestRenderAll();
  }, [activeTool, onCanvasClick]);

  const pointerEvents =
    activeTool === 'highlight' || activeTool === 'underline' ? 'none' : 'all';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width,
        height,
        zIndex: 2,
        pointerEvents,
      }}
    >
      <canvas ref={canvasElRef} style={{ display: 'block' }} />
    </div>
  );
};

export default AnnotationLayer;
