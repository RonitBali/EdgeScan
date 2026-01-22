import React, { useState, useRef } from 'react';

export const UploadDropzone = ({ onFileSelect, accept = 'image/*,.pdf', multiple = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (multiple) {
        onFileSelect(files);
      } else {
        onFileSelect(files[0]);
      }
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (multiple) {
        onFileSelect(files);
      } else {
        onFileSelect(files[0]);
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      style={{
        ...styles.dropzone,
        ...(isDragging ? styles.dropzoneDragging : {}),
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        style={styles.fileInput}
      />
      
      <div style={styles.content}>
        <div style={styles.icon}>📁</div>
        <p style={styles.text}>
          {isDragging
            ? 'Drop file here'
            : 'Drag & drop a file here, or click to select'}
        </p>
        <p style={styles.subtext}>Supports PNG, JPEG, and PDF files</p>
      </div>
    </div>
  );
};

const styles = {
  dropzone: {
    border: '2px dashed #ccc',
    borderRadius: '8px',
    padding: '3rem 2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: '#fafafa',
  },
  dropzoneDragging: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  fileInput: {
    display: 'none',
  },
  content: {
    pointerEvents: 'none',
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  text: {
    fontSize: '1.1rem',
    color: '#333',
    marginBottom: '0.5rem',
  },
  subtext: {
    fontSize: '0.9rem',
    color: '#777',
  },
};
