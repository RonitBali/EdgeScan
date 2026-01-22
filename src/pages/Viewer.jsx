import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BeforeAfter } from '../components/BeforeAfter';
import { Loader } from '../components/Loader';
import { WarningBanner } from '../components/WarningBanner';
import { firestoreService } from '../services/firestoreService';
import { indexedDBService } from '../services/indexedDBService';
import { useAuth } from '../hooks/useAuth';

export const Viewer = () => {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [upload, setUpload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [processedImageUrls, setProcessedImageUrls] = useState([]);

  useEffect(() => {
    if (!uploadId || !user) return;

    const fetchUpload = async () => {
      setLoading(true);
      setError(''); // Clear any previous errors
      try {
        console.log('Fetching upload:', uploadId, 'for user:', user.uid);
        const { upload, error } = await firestoreService.getUpload(uploadId);
        
        if (error) {
          console.error('Firestore error:', error);
          setError(error);
          setLoading(false);
          return;
        }
        
        if (!upload) {
          console.error('Upload not found');
          setError('Upload not found');
          setLoading(false);
          return;
        }
        
        console.log('Upload data:', upload);
        console.log('Upload userId:', upload.userId);
        console.log('Current user uid:', user.uid);
        console.log('Match?', upload.userId === user.uid);
        
        if (upload.userId !== user.uid) {
          console.error('Access denied. Upload userId:', upload.userId, 'Current user:', user.uid);
          setError('Access denied');
          setLoading(false);
          return;
        }
        
        setUpload(upload);
        
        console.log('Loading images. storedLocally:', upload.storedLocally, 'uploadId:', upload.uploadId);
        
        // Load images from IndexedDB
        if (upload.storedLocally && upload.uploadId) {
          // Load original image
          console.log('Fetching original image from IndexedDB...');
          const originalBlob = await indexedDBService.getImage(upload.uploadId, 'original');
          console.log('Original blob:', originalBlob);
          if (originalBlob) {
            // Convert blob to data URL instead of blob URL
            const reader = new FileReader();
            const dataUrl = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(originalBlob);
            });
            console.log('Original data URL created, length:', dataUrl.length);
            setOriginalImageUrl(dataUrl);
          } else {
            console.warn('No original blob found in IndexedDB');
            setOriginalImageUrl(null);
          }
          
          // Load processed images
          const processedDataUrls = [];
          for (let i = 0; i < upload.documentCount; i++) {
            console.log(`Fetching processed image ${i} from IndexedDB...`);
            const processedBlob = await indexedDBService.getImage(upload.uploadId, `processed_${i}`);
            console.log(`Processed blob ${i}:`, processedBlob);
            if (processedBlob) {
              // Convert blob to data URL
              const reader = new FileReader();
              const dataUrl = await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(processedBlob);
              });
              console.log(`Processed data URL ${i} created, length:`, dataUrl.length);
              processedDataUrls.push(dataUrl);
            }
          }
          setProcessedImageUrls(processedDataUrls);
          console.log('All images loaded as data URLs');
        } else {
          // Legacy Firebase Storage URLs (if any old uploads exist)
          setOriginalImageUrl(upload.originalUrl);
          setProcessedImageUrls(upload.processedUrls?.map(p => p.url) || []);
        }
      } catch (err) {
        console.error('Error in fetchUpload:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUpload();
  }, [uploadId, user]); // Only re-run when uploadId or user changes

  if (!user) {
    return (
      <div style={styles.container}>
        <Loader message="Authenticating..." />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <Loader message="Loading upload..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/gallery')} style={styles.button}>
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  if (!upload) {
    return null;
  }

  const processedDoc = upload.processedData?.[selectedDocIndex];
  const currentProcessedUrl = processedImageUrls[selectedDocIndex];

  console.log('Viewer render - originalImageUrl:', originalImageUrl);
  console.log('Viewer render - currentProcessedUrl:', currentProcessedUrl);
  console.log('Viewer render - processedImageUrls:', processedImageUrls);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📄 {upload.filename}</h1>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/gallery')} style={styles.navButton}>
            ← Back to Gallery
          </button>
          <button onClick={() => navigate('/upload')} style={styles.navButton}>
            ➕ New Upload
          </button>
        </div>
      </div>

      {upload.warning && <WarningBanner message={upload.warning} />}

      <div style={styles.content}>
        <div style={styles.info}>
          <div style={styles.infoItem}>
            <strong>Status:</strong> {upload.status}
          </div>
          <div style={styles.infoItem}>
            <strong>Documents:</strong> {upload.documentCount}
          </div>
          <div style={styles.infoItem}>
            <strong>Uploaded:</strong>{' '}
            {upload.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
          </div>
          {processedDoc && (
            <div style={styles.infoItem}>
              <strong>Confidence:</strong> {(processedDoc.confidence * 100).toFixed(0)}%
            </div>
          )}
        </div>

        {upload.documentCount > 1 && (
          <div style={styles.docSelector}>
            <h3 style={styles.docSelectorTitle}>Select Document:</h3>
            <div style={styles.docButtons}>
              {Array.from({ length: upload.documentCount }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDocIndex(index)}
                  style={{
                    ...styles.docButton,
                    ...(selectedDocIndex === index ? styles.docButtonActive : {}),
                  }}
                >
                  Document {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={styles.viewer}>
          <BeforeAfter
            beforeImage={originalImageUrl}
            afterImage={currentProcessedUrl}
          />
        </div>

        <div style={styles.actions}>
          {originalImageUrl && (
            <a
              href={originalImageUrl}
              download={`original_${upload.filename}`}
              style={styles.downloadButton}
            >
              ⬇️ Download Original
            </a>
          )}
          {currentProcessedUrl && (
            <a
              href={currentProcessedUrl}
              download={`processed_${selectedDocIndex + 1}_${upload.filename}`}
              style={styles.downloadButton}
            >
              ⬇️ Download Processed
            </a>
          )}
        </div>
      </div>
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
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.8rem',
    color: '#333',
    wordBreak: 'break-word',
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
  content: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
  },
  info: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  infoItem: {
    fontSize: '0.95rem',
    color: '#555',
  },
  docSelector: {
    marginBottom: '2rem',
  },
  docSelectorTitle: {
    fontSize: '1.1rem',
    marginBottom: '1rem',
    color: '#333',
  },
  docButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  docButton: {
    padding: '10px 20px',
    backgroundColor: '#e9ecef',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  docButtonActive: {
    backgroundColor: '#3498db',
    color: 'white',
    borderColor: '#3498db',
  },
  viewer: {
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'center',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  downloadButton: {
    padding: '12px 24px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    textDecoration: 'none',
    display: 'inline-block',
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
};
