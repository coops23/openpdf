import React from 'react';
import { MIN_SCALE, MAX_SCALE, SCALE_STEP } from '../../utils/constants';

interface ZoomControlsProps {
  scale: number;
  onScaleChange: (scale: number) => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ scale, onScaleChange }) => {
  const zoomIn = () => onScaleChange(Math.min(MAX_SCALE, +(scale + SCALE_STEP).toFixed(2)));
  const zoomOut = () => onScaleChange(Math.max(MIN_SCALE, +(scale - SCALE_STEP).toFixed(2)));
  const zoomReset = () => onScaleChange(1.5);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '6px',
        padding: '2px 6px',
      }}
    >
      <button
        onClick={zoomOut}
        disabled={scale <= MIN_SCALE}
        title="Zoom out"
        style={btnStyle}
      >
        −
      </button>
      <button
        onClick={zoomReset}
        title="Reset zoom"
        style={{ ...btnStyle, minWidth: 56, fontSize: 12 }}
      >
        {Math.round(scale * 100)}%
      </button>
      <button
        onClick={zoomIn}
        disabled={scale >= MAX_SCALE}
        title="Zoom in"
        style={btnStyle}
      >
        +
      </button>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#fff',
  fontSize: 18,
  cursor: 'pointer',
  padding: '2px 8px',
  borderRadius: '4px',
  lineHeight: 1.4,
  transition: 'background 0.15s',
};

export default ZoomControls;
