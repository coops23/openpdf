import React, { useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';

interface SignatureModalProps {
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ onConfirm, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = (rect.width || 500) * ratio;
    canvas.height = (rect.height || 200) * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);

    const pad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: '#1a1a1a',
      minWidth: 1,
      maxWidth: 3,
    });
    padRef.current = pad;

    pad.addEventListener('endStroke', () => {
      setIsEmpty(pad.isEmpty());
    });

    return () => {
      pad.off();
    };
  }, []);

  const handleClear = () => {
    padRef.current?.clear();
    setIsEmpty(true);
  };

  const handleConfirm = () => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    const dataUrl = pad.toDataURL('image/png');
    onConfirm(dataUrl);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ minWidth: 520 }}>
        <h2>Draw Signature</h2>
        <div
          style={{
            border: '2px solid #ddd',
            borderRadius: '6px',
            overflow: 'hidden',
            background: '#fafafa',
            cursor: 'crosshair',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              width: '100%',
              height: '200px',
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: '#888', marginTop: -8 }}>
          Draw your signature above
        </p>
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={handleClear}>
            Clear
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={isEmpty}
          >
            Place Signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
