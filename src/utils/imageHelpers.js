/**
 * Load an image file and return it as an HTMLImageElement (auto-resized for performance)
 * @param {File|Blob} file - Image file
 * @param {number} maxSize - Maximum dimension (default 2000px)
 * @returns {Promise<HTMLImageElement>}
 */
export const loadImage = (file, maxSize = 2000) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Auto-resize if image is too large (prevents lag)
      if (img.width > maxSize || img.height > maxSize) {
        const resized = resizeImage(img, maxSize);
        const resizedImg = new Image();
        resizedImg.onload = () => resolve(resizedImg);
        resizedImg.src = resized.toDataURL('image/jpeg', 0.9);
      } else {
        resolve(img);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Convert canvas to blob
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} type - Image MIME type
 * @param {number} quality - Image quality (0-1)
 * @returns {Promise<Blob>}
 */
export const canvasToBlob = (canvas, type = 'image/png', quality = 0.95) => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      type,
      quality
    );
  });
};

/**
 * Resize image if it's too large
 * @param {HTMLImageElement} image - Source image
 * @param {number} maxSize - Maximum width or height
 * @returns {HTMLCanvasElement}
 */
export const resizeImage = (image, maxSize = 2000) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  let { width, height } = image;
  
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = (height / width) * maxSize;
      width = maxSize;
    } else {
      width = (width / height) * maxSize;
      height = maxSize;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  
  return canvas;
};

/**
 * Check if file is an image
 * @param {File} file
 * @returns {boolean}
 */
export const isImageFile = (file) => {
  return file.type.startsWith('image/');
};

/**
 * Check if file is a PDF
 * @param {File} file
 * @returns {boolean}
 */
export const isPDFFile = (file) => {
  return file.type === 'application/pdf';
};

/**
 * Get file extension
 * @param {string} filename
 * @returns {string}
 */
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};
