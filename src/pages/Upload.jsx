import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadDropzone } from '../components/UploadDropzone';
import { Loader } from '../components/Loader';
import { WarningBanner } from '../components/WarningBanner';
import { useAuth } from '../hooks/useAuth';
import { useProcessingStatus } from '../hooks/useProcessingStatus';
import { pdfToImage } from '../utils/pdfToImage';
import { enhanceDocument, FILTER_OPTIONS } from '../utils/imageEnhancement';
import { loadImage, canvasToBlob, isImageFile, isPDFFile } from '../utils/imageHelpers';
import { indexedDBService } from '../services/indexedDBService';
import { firestoreService } from '../services/firestoreService';

export const Upload = () => {
  const [file, setFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedResults, setProcessedResults] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('auto');
  const [warning, setWarning] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const processing = useProcessingStatus();

  // No need to load external libraries - using built-in Canvas API!

  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setWarning('');
    setProcessedResults([]);
    
    try {
      processing.startProcessing('Loading image...');
      
      let imageElement;
      
      if (isPDFFile(selectedFile)) {
        processing.updateProgress(25, 'Converting PDF to image...');
        const canvas = await pdfToImage(selectedFile);
        const blob = await canvasToBlob(canvas);
        imageElement = await loadImage(blob);
      } else if (isImageFile(selectedFile)) {
        imageElement = await loadImage(selectedFile);
      } else {
        throw new Error('Unsupported file type');
      }
      
      setOriginalImage(imageElement);
      
      // Process the image
      await processImage(imageElement);
      
    } catch (error) {
      console.error('Error processing file:', error);
      processing.errorProcessing('Failed to process file: ' + error.message);
    }
  }, [processing]);

  const processImage = useCallback(async (imageElement) => {
    try {
      processing.updateProgress(50, 'Enhancing document...');
      
      // Apply selected filter
      const result = enhanceDocument(imageElement, selectedFilter);
      
      if (selectedFilter === 'original') {
        // No filter - just use original
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0);
        result.canvas = canvas;
      }
      
      setProcessedResults([result]);
      processing.completeProcessing('Enhancement complete!');
      
    } catch (error) {
      console.error('Error processing image:', error);
      processing.errorProcessing('Failed to process image: ' + error.message);
    }
  }, [selectedFilter, processing]);

  const handleSave = useCallback(async () => {
    if (!user || processedResults.length === 0) return;
    
    try {
      processing.startProcessing('Saving files...');
      
      // Generate unique upload ID
      const uploadId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save original image to IndexedDB
      processing.updateProgress(20, 'Saving original image...');
      await indexedDBService.saveImage(uploadId, file, 'original');
      
      // Save processed images to IndexedDB
      const processedData = [];
      
      for (let i = 0; i < processedResults.length; i++) {
        const progress = 20 + ((i + 1) / processedResults.length) * 60;
        processing.updateProgress(progress, `Saving processed image ${i + 1}/${processedResults.length}...`);
        
        const result = processedResults[i];
        const blob = await canvasToBlob(result.canvas);
        await indexedDBService.saveImage(uploadId, blob, `processed_${i}`);
        
        processedData.push({
          index: i,
          confidence: result.confidence,
          corners: result.corners
        });
      }
      
      // Create Firestore record (metadata only)
      processing.updateProgress(90, 'Saving metadata...');
      
      const uploadData = {
        filename: file.name,
        uploadId, // Reference to IndexedDB storage
        processedData,
        status: 'completed',
        filter: selectedFilter,
        documentCount: processedResults.length,
        warning: warning || null,
        storedLocally: true // Flag to indicate local storage
      };
      
      const { id, error } = await firestoreService.createUpload(user.uid, uploadData);
      
      if (error) throw new Error(error);
      
      processing.completeProcessing('Upload saved successfully!');
      
      // Navigate to viewer
      setTimeout(() => {
        navigate(`/viewer/${id}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error saving upload:', error);
      processing.errorProcessing('Failed to save upload: ' + error.message);
    }
  }, [user, processedResults, file, processing, navigate, selectedFilter]);

  const handleReset = useCallback(() => {
    setFile(null);
    setOriginalImage(null);
    setProcessedResults([]);
    setWarning('');
    processing.reset();
  }, [processing]);

  // Memoize preview URLs to prevent recreation
  const processedPreviews = useMemo(() => {
    return processedResults.map((result, index) => ({
      id: index,
      url: result.canvas.toDataURL('image/jpeg', 0.85)
    }));
  }, [processedResults]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📄 Upload Document</h1>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/gallery')} style={styles.navButton}>
            📚 Gallery
          </button>
          <button onClick={() => navigate('/')} style={styles.navButton}>
            🚪 Logout
          </button>
        </div>
      </div>

      {warning && <WarningBanner message={warning} onDismiss={() => setWarning('')} />}

      {!file && (
        <>
          <div style={styles.filterSelector}>
            <h3 style={styles.filterTitle}>Select Enhancement Filter:</h3>
            <div style={styles.filterGrid}>
              {FILTER_OPTIONS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedFilter(filter.value)}
                  style={{
                    ...styles.filterButton,
                    ...(selectedFilter === filter.value ? styles.filterButtonActive : {}),
                  }}
                >
                  <div style={styles.filterLabel}>{filter.label}</div>
                  <div style={styles.filterDescription}>{filter.description}</div>
                </button>
              ))}
            </div>
          </div>
          <UploadDropzone onFileSelect={handleFileSelect} />
        </>
      )}

      {processing.isProcessing && (
        <Loader message={processing.message} progress={processing.progress} />
      )}

      {processing.isError && (
        <div style={styles.error}>
          <p>{processing.message}</p>
          <button onClick={handleReset} style={styles.button}>
            Try Again
          </button>
        </div>
      )}

      {processing.isSuccess && processedResults.length > 0 && (
        <div style={styles.results}>
          <h2 style={styles.resultsTitle}>
            Document Enhanced - {FILTER_OPTIONS.find(f => f.value === selectedFilter)?.label}
          </h2>
          
          <div style={styles.preview}>
            <div style={styles.imageColumn}>
              <h3 style={styles.imageTitle}>Original</h3>
              <img src={originalImage.src} alt="Original" style={styles.previewImage} />
            </div>
            
            <div style={styles.imageColumn}>
              <h3 style={styles.imageTitle}>Enhanced</h3>
              <div style={styles.processedGrid}>
                {processedPreviews.map((preview) => (
                  <div key={preview.id} style={styles.processedItem}>
                    <img 
                      src={preview.url} 
                      alt="Enhanced" 
                      style={styles.previewImage}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.actions}>
            <button onClick={handleSave} style={styles.saveButton}>
              💾 Save & Continue
            </button>
            <button onClick={handleReset} style={styles.resetButton}>
              🔄 Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '2rem',
    backgroundColor: '#f5f5f5',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    color: '#333',
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  modeToggle: {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '6px',
  },
  filterSelector: {
    marginBottom: '1.5rem',
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
  filterTitle: {
    fontSize: '1.1rem',
    marginBottom: '1rem',
    color: '#333',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
  },
  filterButton: {
    padding: '12px',
    backgroundColor: '#f8f9fa',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  filterLabel: {
    fontWeight: '600',
    fontSize: '0.95rem',
    color: '#333',
    marginBottom: '4px',
  },
  filterDescription: {
    fontSize: '0.85rem',
    color: '#666',
  },
  modeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  error: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    textAlign: 'center',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1rem',
  },
  results: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
  },
  resultsTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: '#333',
  },
  preview: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
    marginBottom: '2rem',
  },
  imageColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  imageTitle: {
    fontSize: '1.1rem',
    color: '#555',
  },
  previewImage: {
    width: '100%',
    height: 'auto',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  processedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  processedItem: {
    position: 'relative',
  },
  confidence: {
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    color: '#666',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  saveButton: {
    padding: '14px 28px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1.05rem',
    fontWeight: '500',
  },
  resetButton: {
    padding: '14px 28px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1.05rem',
  },
};
