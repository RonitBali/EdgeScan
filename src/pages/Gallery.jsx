import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUploads } from '../hooks/useUploads';
import { Loader } from '../components/Loader';
import { indexedDBService } from '../services/indexedDBService';

export const Gallery = () => {
  const { user } = useAuth();
  const { uploads, loading, error } = useUploads(user?.uid);
  const navigate = useNavigate();

  const handleNavigate = useCallback((path) => {
    navigate(path);
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
        <h1 style={styles.title}>📚 My Gallery</h1>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/upload')} style={styles.navButton}>
            ➕ New Upload
          </button>
          <button onClick={() => navigate('/')} style={styles.navButton}>
            🚪 Logout
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
          <div style={styles.emptyIcon}>📭</div>
          <h2 style={styles.emptyTitle}>No uploads yet</h2>
          <p style={styles.emptyText}>
            Start by uploading your first document!
          </p>
          <button onClick={() => navigate('/upload')} style={styles.uploadButton}>
            Upload Document
          </button>
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
  error: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    color: '#c33',
    textAlign: 'center',
  },
  empty: {
    backgroundColor: 'white',
    padding: '4rem 2rem',
    borderRadius: '8px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.5rem',
    color: '#333',
    marginBottom: '0.5rem',
  },
  emptyText: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '2rem',
  },
  uploadButton: {
    padding: '14px 28px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1.05rem',
    fontWeight: '500',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '200px',
    backgroundColor: '#f0f0f0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  badge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  cardContent: {
    padding: '1rem',
  },
  cardTitle: {
    fontSize: '1.1rem',
    color: '#333',
    marginBottom: '0.75rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  metaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9rem',
  },
  metaLabel: {
    color: '#666',
  },
  metaValue: {
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  statusSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    backgroundColor: '#f0f0f0',
  },
  warningText: {
    fontSize: '0.85rem',
    color: '#856404',
    marginTop: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
  },
};
