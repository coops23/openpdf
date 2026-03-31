import React, { useState, useRef, useEffect } from 'react';

interface CommentModalProps {
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ onConfirm, onCancel }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      onConfirm(text);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2>Add Sticky Note</h2>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your note... (Ctrl+Enter to confirm)"
          rows={5}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
          }}
        />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onConfirm(text)}
            disabled={!text.trim()}
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
