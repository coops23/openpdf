import React, { useRef, useState, useCallback } from 'react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  loading: boolean;
  error: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, loading, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file.');
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      }}
    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !loading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? '#64b5f6' : '#6e7276'}`,
          borderRadius: '12px',
          padding: '48px 64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: isDragOver ? 'rgba(100, 181, 246, 0.08)' : 'rgba(255,255,255,0.04)',
          transition: 'all 0.2s',
          maxWidth: 480,
          width: '100%',
        }}
      >
        <div style={{ fontSize: 56 }}>📄</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#e0e0e0', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            {loading ? 'Loading PDF…' : 'Open a PDF'}
          </p>
          <p style={{ color: '#9e9e9e', fontSize: 14 }}>
            {loading
              ? 'Please wait…'
              : 'Drag & drop a PDF file here, or click to browse'}
          </p>
        </div>
        {!loading && (
          <button
            style={{
              padding: '10px 28px',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            Browse Files
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div
          style={{
            background: '#b71c1c',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            maxWidth: 480,
            width: '100%',
            fontSize: 14,
          }}
        >
          Error: {error}
        </div>
      )}

      <p style={{ color: '#757575', fontSize: 12, textAlign: 'center', maxWidth: 400 }}>
        All processing happens in your browser. Your PDF is never uploaded to any server.
      </p>
    </div>
  );
};

export default FileUpload;
