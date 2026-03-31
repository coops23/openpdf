import React from 'react';
import type { AnnotationTool } from '../../types/annotation.types';
import AnnotationTools from './AnnotationTools';
import ZoomControls from './ZoomControls';

interface ToolbarProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  numPages: number;
  fileName: string | null;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolChange,
  scale,
  onScaleChange,
  numPages,
  fileName,
  onSave,
  onClose,
  isSaving,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '6px 16px',
        background: '#3d3d3d',
        borderBottom: '1px solid #222',
        flexShrink: 0,
        flexWrap: 'wrap',
        minHeight: 52,
        zIndex: 10,
      }}
    >
      {/* File info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', minWidth: 0 }}>
        <span
          style={{
            fontSize: 13,
            maxWidth: 180,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={fileName ?? ''}
        >
          {fileName ?? 'No file'}
        </span>
        {numPages > 0 && (
          <span style={{ fontSize: 12, opacity: 0.6 }}>({numPages} pages)</span>
        )}
      </div>

      <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

      {/* Annotation tools */}
      <AnnotationTools activeTool={activeTool} onToolChange={onToolChange} />

      <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />

      {/* Zoom */}
      <ZoomControls scale={scale} onScaleChange={onScaleChange} />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Action buttons */}
      <button
        onClick={onSave}
        disabled={isSaving || numPages === 0}
        style={{
          padding: '7px 16px',
          background: isSaving ? '#555' : '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: 13,
          fontWeight: 600,
          cursor: isSaving ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {isSaving ? 'Saving…' : '⬇ Save PDF'}
      </button>

      <button
        onClick={onClose}
        title="Close PDF"
        style={{
          padding: '7px 12px',
          background: 'rgba(255,255,255,0.1)',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        ✕ Close
      </button>
    </div>
  );
};

export default Toolbar;
