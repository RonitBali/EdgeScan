import React, { useState, useRef, useEffect, useCallback } from 'react';

export const BeforeAfter = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      setIsDragging(true);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  }, [isDragging]);

  const handlePanStart = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handlePanMove = useCallback((e) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom(prevZoom => Math.max(0.5, Math.min(5, prevZoom + delta)));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handlePanMove);
      window.addEventListener('mouseup', handlePanEnd);
      return () => {
        window.removeEventListener('mousemove', handlePanMove);
        window.removeEventListener('mouseup', handlePanEnd);
      };
    }
  }, [isPanning, handlePanMove, handlePanEnd]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.controls}>
        <button onClick={() => setZoom(Math.min(5, zoom + 0.25))} style={styles.button}>
          🔍 Zoom In
        </button>
        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} style={styles.button}>
          🔍 Zoom Out
        </button>
        <button onClick={resetView} style={styles.button}>
          🔄 Reset View
        </button>
        <span style={styles.zoomLabel}>Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>

      <div
        ref={containerRef}
        style={styles.container}
        onMouseDown={handlePanStart}
        onWheel={handleWheel}
      >
        <div
          style={{
            ...styles.imagesContainer,
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          }}
        >
          <img src={beforeImage} alt="Before" style={styles.image} />
          <div
            style={{
              ...styles.afterImageContainer,
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            }}
          >
            <img src={afterImage} alt="After" style={styles.image} />
          </div>

          <div
            style={{
              ...styles.slider,
              left: `${sliderPosition}%`,
            }}
            onMouseDown={handleMouseDown}
          >
            <div style={styles.sliderHandle}>
              <div style={styles.sliderArrow}>←</div>
              <div style={styles.sliderLine}></div>
              <div style={styles.sliderArrow}>→</div>
            </div>
          </div>
        </div>

        <div style={styles.labels}>
          <div style={styles.label}>Before</div>
          <div style={styles.label}>After</div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  controls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  zoomLabel: {
    marginLeft: 'auto',
    fontSize: '0.9rem',
    color: '#555',
  },
  container: {
    position: 'relative',
    width: '100%',
    maxWidth: '900px',
    aspectRatio: '16/9',
    overflow: 'hidden',
    borderRadius: '8px',
    backgroundColor: '#000',
    cursor: 'move',
  },
  imagesContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformOrigin: 'center center',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    userSelect: 'none',
  },
  afterImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  slider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '4px',
    backgroundColor: 'transparent',
    cursor: 'ew-resize',
    transform: 'translateX(-50%)',
    zIndex: 10,
  },
  sliderHandle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '5px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  sliderArrow: {
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: '1.2rem',
  },
  sliderLine: {
    width: '2px',
    height: '40px',
    backgroundColor: 'white',
    margin: '0 5px',
  },
  labels: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    right: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  label: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
};
