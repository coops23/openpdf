import React from 'react';
import type { AnnotationTool } from '../../types/annotation.types';

interface Tool {
  id: AnnotationTool;
  label: string;
  icon: string;
  title: string;
}

const TOOLS: Tool[] = [
  { id: 'cursor', label: 'Select', icon: '↖', title: 'Select / Move' },
  { id: 'highlight', label: 'Highlight', icon: '✏', title: 'Highlight text' },
  { id: 'underline', label: 'Underline', icon: 'U̲', title: 'Underline text' },
  { id: 'pen', label: 'Pen', icon: '✒', title: 'Freehand drawing' },
  { id: 'text', label: 'Text', icon: 'T', title: 'Add text box' },
  { id: 'rect', label: 'Rect', icon: '▭', title: 'Draw rectangle' },
  { id: 'arrow', label: 'Arrow', icon: '→', title: 'Draw arrow' },
  { id: 'sticky', label: 'Note', icon: '📝', title: 'Add sticky note' },
  { id: 'signature', label: 'Sign', icon: '✍', title: 'Add signature' },
  { id: 'eraser', label: 'Erase', icon: '⌫', title: 'Erase annotation' },
];

interface AnnotationToolsProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
}

const AnnotationTools: React.FC<AnnotationToolsProps> = ({ activeTool, onToolChange }) => {
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          title={tool.title}
          onClick={() => onToolChange(tool.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1px',
            padding: '5px 8px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: activeTool === tool.id ? 'rgba(255,255,255,0.25)' : 'transparent',
            color: '#fff',
            fontSize: 16,
            minWidth: 44,
            transition: 'background 0.15s',
          }}
        >
          <span>{tool.icon}</span>
          <span style={{ fontSize: 9, opacity: 0.8 }}>{tool.label}</span>
        </button>
      ))}
    </div>
  );
};

export default AnnotationTools;
