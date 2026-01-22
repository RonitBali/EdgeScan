import React from 'react';

export const WarningBanner = ({ message, onDismiss }) => {
  if (!message) return null;
  
  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        <span style={styles.icon}>⚠️</span>
        <span style={styles.message}>{message}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} style={styles.closeButton}>
          ✕
        </button>
      )}
    </div>
  );
};

const styles = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    padding: '12px 16px',
    marginBottom: '1rem',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  icon: {
    fontSize: '1.2rem',
  },
  message: {
    color: '#856404',
    fontSize: '0.95rem',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    color: '#856404',
    cursor: 'pointer',
    padding: '0',
    marginLeft: '10px',
  },
};
