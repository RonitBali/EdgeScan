import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadDropzone } from '../components/UploadDropzone';
import { Loader } from '../components/Loader';
import { WarningBanner } from '../components/WarningBanner';
import { useAuth } from '../hooks/useAuth';
import { useProcessingStatus } from '../hooks/useProcessingStatus';
import { pdfToImage } from '../utils/pdfToImage';
import { enhanceDocument, FILTER_OPTIONS } from '../utils/imageEnhancement';
import { enhanceWithGemini, isGeminiConfigured } from '../utils/geminiEnhancer';
import { loadImage, canvasToBlob, isImageFile, isPDFFile } from '../utils/imageHelpers';
import { indexedDBService } from '../services/indexedDBService';
import { firestoreService } from '../services/firestoreService';
import { authService } from '../services/authService';

export const Upload = () => {
  const [file, setFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [originalImagePreview, setOriginalImagePreview] = useState(null);
  const [processedResults, setProcessedResults] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('auto');
  const [useAI, setUseAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
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
      
      // Create data URL preview
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageElement, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setOriginalImagePreview(dataUrl);
      
      // Process the image
      await processImage(imageElement);
      
    } catch (error) {
      console.error('Error processing file:', error);
      processing.errorProcessing('Failed to process file: ' + error.message);
    }
  }, [processing]);

  const processImage = useCallback(async (imageElement) => {
    try {
      processing.updateProgress(30, 'Analyzing document...');
      
      let filterToUse = selectedFilter;
      let analysis = null;
      
      // Use AI to determine best filter if enabled
      if (useAI && isGeminiConfigured()) {
        processing.updateProgress(40, '🤖 AI analyzing document...');
        analysis = await enhanceWithGemini(imageElement);
        filterToUse = analysis.suggestedFilter;
        setAiAnalysis(analysis);
        setWarning(`AI Recommendation: ${analysis.analysis} (${analysis.documentType || 'document'})`);
      } else if (useAI && !isGeminiConfigured()) {
        setWarning('⚠️ Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env file. Using automatic enhancement.');
      }
      
      processing.updateProgress(60, 'Enhancing document...');
      
      // Apply selected or AI-recommended filter
      const result = enhanceDocument(imageElement, filterToUse);
      
      if (filterToUse === 'original') {
        // No filter - just use original
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0);
        result.canvas = canvas;
      }
      
      if (analysis) {
        result.aiEnhanced = true;
        result.aiAnalysis = analysis;
      }
      
      setProcessedResults([result]);
      processing.completeProcessing('Enhancement complete!');
      
    } catch (error) {
      console.error('Error processing image:', error);
      processing.errorProcessing('Failed to process image: ' + error.message);
    }
  }, [selectedFilter, useAI, processing]);

  const handleSave = useCallback(async () => {
    if (!user || processedResults.length === 0 || !originalImage) return;
    
    try {
      processing.startProcessing('Saving files...');
      
      // Generate unique upload ID
      const uploadId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save original image to IndexedDB
      processing.updateProgress(20, 'Saving original image...');
      
      // Convert originalImage to blob
      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = originalImage.width;
      originalCanvas.height = originalImage.height;
      const ctx = originalCanvas.getContext('2d');
      ctx.drawImage(originalImage, 0, 0);
      const originalBlob = await canvasToBlob(originalCanvas);
      
      await indexedDBService.saveImage(uploadId, originalBlob, 'original');
      
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
          confidence: result.confidence || 0.95,
          filter: result.filter || selectedFilter
        });
      }
      
      // Create Firestore record (metadata only)
      processing.updateProgress(90, 'Saving metadata...');
      
      const uploadData = {
        filename: file.name,
        uploadId, // Reference to IndexedDB storage
        processedData,
        status: 'completed',
        filter: selectedFilter || 'auto',
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
  }, [user, processedResults, originalImage, processing, navigate, selectedFilter, warning]);

  const handleReset = useCallback(() => {
    setFile(null);
    setOriginalImage(null);
    setOriginalImagePreview(null);
    setProcessedResults([]);
    setWarning('');
    processing.reset();
  }, [processing]);

  const handleLogout = useCallback(async () => {
    await authService.signOut();
    navigate('/');
  }, [navigate]);

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
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Upload Document</h1>
          <p style={styles.headerSubtitle}>Upload and enhance your documents with professional filters</p>
        </div>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/gallery')} style={styles.secondaryButton}>
            My Documents
          </button>
          <button onClick={handleLogout} style={styles.secondaryButton}>
            Sign Out
          </button>
        </div>
      </div>

      {warning && <WarningBanner message={warning} onDismiss={() => setWarning('')} />}

      {!file && (
        <>
          {isGeminiConfigured() && (
            <div style={styles.aiToggle}>
              <label style={styles.aiLabel}>
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  style={styles.checkbox}
                />
                <span style={styles.aiText}>Use Gemini AI to auto-select best filter</span>
                <span style={styles.aiBadge}>AI POWERED</span>
              </label>
            </div>
          )}
          
          {!useAI && (
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
          )}
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
            {aiAnalysis ? (
              <>🤖 AI-Enhanced: {aiAnalysis.documentType || 'Document'}</>
            ) : (
              <>Document Enhanced - {FILTER_OPTIONS.find(f => f.value === selectedFilter)?.label}</>
            )}
          </h2>
          
          {aiAnalysis && (
            <div style={styles.aiAnalysisCard}>
              <div style={styles.aiAnalysisTitle}>AI Analysis</div>
              <div style={styles.aiAnalysisContent}>
                <div><strong>Filter Applied:</strong> {FILTER_OPTIONS.find(f => f.value === aiAnalysis.suggestedFilter)?.label}</div>
                <div><strong>Reason:</strong> {aiAnalysis.analysis}</div>
                <div><strong>Confidence:</strong> {(aiAnalysis.confidence * 100).toFixed(0)}%</div>
              </div>
            </div>
          )}
          
          <div style={styles.preview}>
            <div style={styles.imageColumn}>
              <h3 style={styles.imageTitle}>Original</h3>
              <img src={originalImagePreview} alt="Original" style={styles.previewImage} />
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
              Save & Continue
            </button>
            <button onClick={handleReset} style={styles.resetButton}>
              Upload Another
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
    padding: '2rem 3rem',
    backgroundColor: '#f9fafb',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '3rem',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  headerLeft: {
    flex: '1',
    minWidth: '250px',
  },
  title: {
    fontSize: '2.5rem',
    color: '#111827',
    fontWeight: '800',
    marginBottom: '0.5rem',
    letterSpacing: '-0.5px',
  },
  headerSubtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    fontWeight: '400',
  },
  headerButtons: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  secondaryButton: {
    padding: '12px 24px',
    background: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  filterSelector: {
    marginBottom: '1.5rem',
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  filterTitle: {
    fontSize: '1rem',
    marginBottom: '1rem',
    color: '#111827',
    fontWeight: '700',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  filterButton: {
    padding: '14px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  filterButtonActive: {
    backgroundColor: '#ede9fe',
    borderColor: '#667eea',
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
  },
  filterLabel: {
    fontWeight: '600',
    fontSize: '0.95rem',
    color: '#111827',
    marginBottom: '6px',
  },
  filterDescription: {
    fontSize: '0.85rem',
    color: '#6b7280',
  },
  aiToggle: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
  },
  aiLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#374151',
  },
  aiText: {
    flex: '1',
  },
  aiBadge: {
    padding: '4px 10px',
    backgroundColor: '#667eea',
    color: 'white',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  aiAnalysisCard: {
    backgroundColor: '#f0f7ff',
    border: '2px solid #4285f4',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
  },
  aiAnalysisTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1a73e8',
    marginBottom: '0.75rem',
  },
  aiAnalysisContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    fontSize: '0.9rem',
    lineHeight: '1.5',
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
    padding: '2.5rem',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  resultsTitle: {
    fontSize: '1.6rem',
    marginBottom: '1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '700',
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
    color: '#374151',
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 'auto',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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
    color: '#6b7280',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '2rem',
  },
  saveButton: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  resetButton: {
    padding: '14px 32px',
    background: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
};
