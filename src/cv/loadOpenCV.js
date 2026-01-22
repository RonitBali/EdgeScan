let cvReady = false;
let cvLoadPromise = null;

export const loadOpenCV = () => {
  if (cvReady) {
    return Promise.resolve(window.cv);
  }

  if (cvLoadPromise) {
    return cvLoadPromise;
  }

  cvLoadPromise = new Promise((resolve, reject) => {
    // Check if cv is already loaded
    if (window.cv && window.cv.Mat) {
      cvReady = true;
      resolve(window.cv);
      return;
    }

    // Set up timeout (reduced to 30 seconds)
    const timeoutId = setTimeout(() => {
      reject(new Error('OpenCV loading timeout - continuing without auto-crop'));
    }, 30000);

    // Try loading from unpkg CDN (most reliable)
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@techstark/opencv-js@4.5.2-1/dist/opencv.js';
    script.async = true;
    
    let initialized = false;

    script.onload = () => {
      console.log('OpenCV script loaded, waiting for initialization...');
      
      // OpenCV.js needs time to initialize WebAssembly
      const checkInterval = setInterval(() => {
        if (window.cv && window.cv.Mat && !initialized) {
          initialized = true;
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          cvReady = true;
          console.log('OpenCV initialized successfully');
          resolve(window.cv);
        }
      }, 100);
    };

    script.onerror = () => {
      clearTimeout(timeoutId);
      console.error('Failed to load OpenCV from primary CDN, trying docs.opencv.org...');
      
      // Try backup CDN (docs.opencv.org)
      const backupScript = document.createElement('script');
      backupScript.src = 'https://docs.opencv.org/4.5.2/opencv.js';
      backupScript.async = true;
      
      backupScript.onload = () => {
        console.log('OpenCV backup script loaded, waiting for initialization...');
        const checkInterval = setInterval(() => {
          if (window.cv && window.cv.Mat && !initialized) {
            initialized = true;
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            cvReady = true;
            console.log('OpenCV initialized successfully from backup');
            resolve(window.cv);
          }
        }, 100);
      };
      
      backupScript.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Failed to load OpenCV from all CDN sources'));
      };
      
      document.head.appendChild(backupScript);
    };

    document.head.appendChild(script);
  });

  return cvLoadPromise;
};

export const isOpenCVReady = () => cvReady;
