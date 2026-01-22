import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUploads } from '../hooks/useUploads';
import { Loader } from '../components/Loader';
import { indexedDBService } from '../services/indexedDBService';
import { authService } from '../services/authService';

export const Gallery = () => {
  const { user } = useAuth();
  const { uploads, loading, error } = useUploads(user?.uid);
  const navigate = useNavigate();

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    await authService.signOut();
    navigate('/');
  }, [navigate]);

  if (loading) {
    return (
      <div style={styles.container}>
        <Loader message="Loading your uploads..." />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>My Documents</h1>
          <p style={styles.headerSubtitle}>View and manage all your scanned documents</p>
        </div>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/upload')} style={styles.primaryButton}>
            New Document
          </button>
          <button onClick={handleLogout} style={styles.secondaryButton}>
            Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          <p>Error loading uploads: {error}</p>
        </div>
      )}

      {!error && uploads.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyContent}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={styles.emptyIcon}>
              <rect x="20" y="20" width="80" height="90" rx="8" stroke="#d1d5db" strokeWidth="3" fill="none"/>
              <line x1="35" y1="40" x2="85" y2="40" stroke="#d1d5db" strokeWidth="3"/>
              <line x1="35" y1="55" x2="70" y2="55" stroke="#d1d5db" strokeWidth="3"/>
              <line x1="35" y1="70" x2="85" y2="70" stroke="#d1d5db" strokeWidth="3"/>
            </svg>
            <h2 style={styles.emptyTitle}>No Documents Yet</h2>
            <p style={styles.emptyText}>
              Upload your first document to get started with scanning and enhancement
            </p>
            <button onClick={() => navigate('/upload')} style={styles.uploadButton}>
              Upload Your First Document
            </button>
          </div>
        </div>
      )}

      {uploads.length > 0 && (
        <div style={styles.grid}>
          {uploads.map((upload) => (
            <GalleryCard
              key={upload.id}
              upload={upload}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// GalleryCard component
const GalleryCard = ({ upload, onNavigate }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);

  useEffect(() => {
    const loadThumbnail = async () => {
      if (upload.storedLocally && upload.uploadId) {
        const blob = await indexedDBService.getImage(upload.uploadId, 'processed_0');
        if (blob) {
          setThumbnailUrl(URL.createObjectURL(blob));
        }
      }
    };

    loadThumbnail();

    return () => {
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
  }, [upload]);

  const handleClick = () => {
    onNavigate(`/viewer/${upload.id}`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp.toMillis()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFilterLabel = (filter) => {
    const labels = {
      auto: 'Auto Enhanced',
      grayscale: 'Grayscale',
      highContrast: 'High Contrast',
      blackAndWhite: 'Black & White',
      enhance: 'Smart Enhanced',
      original: 'Original'
    };
    return labels[filter] || 'Enhanced';
  };

  return (
    <div style={styles.card} onClick={handleClick}>
      <div style={styles.imageContainer}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={upload.filename} style={styles.thumbnail} />
        ) : (
          <div style={styles.thumbnailPlaceholder}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <rect x="15" y="15" width="50" height="60" rx="4" stroke="#d1d5db" strokeWidth="2" fill="none"/>
              <line x1="25" y1="30" x2="55" y2="30" stroke="#d1d5db" strokeWidth="2"/>
              <line x1="25" y1="40" x2="45" y2="40" stroke="#d1d5db" strokeWidth="2"/>
              <line x1="25" y1="50" x2="55" y2="50" stroke="#d1d5db" strokeWidth="2"/>
            </svg>
          </div>
        )}
        {upload.documentCount > 1 && (
          <div style={styles.badge}>{upload.documentCount} pages</div>
        )}
      </div>
      <div style={styles.cardContent}>
        <h3 style={styles.cardTitle}>{upload.filename}</h3>
        <div style={styles.cardMeta}>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>Filter</span>
            <span style={styles.metaValue}>{getFilterLabel(upload.filter)}</span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>Created</span>
            <span style={styles.metaValue}>{formatDate(upload.createdAt)}</span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>Status</span>
            <span style={{
              ...styles.statusBadge,
              ...(upload.status === 'completed' ? styles.statusSuccess : styles.statusPending)
            }}>
              {upload.status === 'completed' ? 'Ready' : 'Processing'}
            </span>
          </div>
        </div>
      </div>
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
  primaryButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
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
  error: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  empty: {
    backgroundColor: 'white',
    padding: '4rem 2rem',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  emptyContent: {
    maxWidth: '400px',
    margin: '0 auto',
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: '2rem',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    color: '#111827',
    marginBottom: '0.75rem',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '2rem',
    lineHeight: '1.6',
  },
  uploadButton: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #e5e7eb',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '220px',
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  badge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: '#111827',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  cardContent: {
    padding: '1.25rem',
  },
  cardTitle: {
    fontSize: '1rem',
    color: '#111827',
    marginBottom: '1rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: '600',
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem',
  },
  metaLabel: {
    color: '#6b7280',
    fontWeight: '500',
  },
  metaValue: {
    color: '#111827',
    fontWeight: '600',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  statusSuccess: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
};
