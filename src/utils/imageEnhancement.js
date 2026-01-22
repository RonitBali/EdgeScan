// AI-style image enhancement using Canvas API

export const enhanceDocument = (imageElement, filterType = 'auto') => {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  const ctx = canvas.getContext('2d');
  
  // Draw original image
  ctx.drawImage(imageElement, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  switch (filterType) {
    case 'grayscale':
      applyGrayscale(data);
      break;
    case 'highContrast':
      applyGrayscale(data);
      applyContrast(data, 1.5);
      applyBrightness(data, 10);
      break;
    case 'blackAndWhite':
      applyBlackAndWhite(data);
      break;
    case 'enhance':
      applySharpness(ctx, canvas.width, canvas.height);
      applyContrast(data, 1.2);
      applyBrightness(data, 5);
      break;
    case 'auto':
    default:
      // Auto mode: grayscale + high contrast for documents
      applyGrayscale(data);
      applyContrast(data, 1.4);
      applyBrightness(data, 15);
      break;
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  return {
    canvas,
    filter: filterType,
    confidence: 0.95 // Mock confidence score
  };
};

// Apply grayscale filter
const applyGrayscale = (data) => {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
};

// Apply contrast adjustment
const applyContrast = (data, contrast) => {
  const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i] - 128) + 128;
    data[i + 1] = factor * (data[i + 1] - 128) + 128;
    data[i + 2] = factor * (data[i + 2] - 128) + 128;
  }
};

// Apply brightness adjustment
const applyBrightness = (data, brightness) => {
  for (let i = 0; i < data.length; i += 4) {
    data[i] += brightness;
    data[i + 1] += brightness;
    data[i + 2] += brightness;
  }
};

// Apply black and white threshold
const applyBlackAndWhite = (data, threshold = 128) => {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const bw = gray > threshold ? 255 : 0;
    data[i] = bw;
    data[i + 1] = bw;
    data[i + 2] = bw;
  }
};

// Apply sharpness filter
const applySharpness = (ctx, width, height) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);
  
  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }
        const idx = (y * width + x) * 4 + c;
        output[idx] = Math.max(0, Math.min(255, sum));
      }
    }
  }
  
  for (let i = 0; i < data.length; i++) {
    data[i] = output[i];
  }
};

export const FILTER_OPTIONS = [
  { value: 'auto', label: 'Auto Enhance (Recommended)', description: 'Grayscale + High Contrast' },
  { value: 'grayscale', label: 'Grayscale', description: 'Convert to grayscale' },
  { value: 'highContrast', label: 'High Contrast', description: 'Best for scanned docs' },
  { value: 'blackAndWhite', label: 'Black & White', description: 'Sharp B&W threshold' },
  { value: 'enhance', label: 'Smart Enhance', description: 'Sharpen + Adjust' },
  { value: 'original', label: 'Original', description: 'No enhancement' },
];
