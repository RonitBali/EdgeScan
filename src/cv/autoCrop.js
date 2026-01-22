import { perspectiveWarp } from './perspectiveWarp';
import { calculateConfidenceScore } from '../utils/confidenceScore';

/**
 * Detects and crops a document from an image
 * @param {HTMLImageElement|HTMLCanvasElement} image - Source image
 * @param {Object} cv - OpenCV instance
 * @returns {Object} { canvas, corners, confidence, warning }
 */
export const autoCrop = (image, cv) => {
  try {
    // Read image
    const src = cv.imread(image);
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edged = new cv.Mat();
    
    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Apply Gaussian blur
    const ksize = new cv.Size(5, 5);
    cv.GaussianBlur(gray, blurred, ksize, 0);
    
    // Edge detection
    cv.Canny(blurred, edged, 75, 200);
    
    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edged, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
    
    // Sort contours by area
    let contoursList = [];
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      contoursList.push({ contour, area });
    }
    contoursList.sort((a, b) => b.area - a.area);
    
    let documentCorners = null;
    let confidence = 0;
    
    // Find the largest contour with 4 corners
    for (let i = 0; i < Math.min(5, contoursList.length); i++) {
      const { contour } = contoursList[i];
      const peri = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      
      cv.approxPolyDP(contour, approx, 0.02 * peri, true);
      
      if (approx.rows === 4) {
        documentCorners = [];
        for (let j = 0; j < 4; j++) {
          documentCorners.push({
            x: approx.data32S[j * 2],
            y: approx.data32S[j * 2 + 1]
          });
        }
        
        // Calculate confidence score
        confidence = calculateConfidenceScore(documentCorners, src.cols, src.rows);
        approx.delete();
        break;
      }
      
      approx.delete();
    }
    
    let resultCanvas;
    let warning = null;
    
    if (documentCorners && confidence > 0.5) {
      // Apply perspective warp
      resultCanvas = perspectiveWarp(image, documentCorners, cv);
    } else {
      // Fallback: use image corners
      warning = 'Could not detect document boundaries precisely. Using best approximation.';
      documentCorners = [
        { x: 0, y: 0 },
        { x: src.cols, y: 0 },
        { x: src.cols, y: src.rows },
        { x: 0, y: src.rows }
      ];
      
      // Just copy the original image
      resultCanvas = document.createElement('canvas');
      cv.imshow(resultCanvas, src);
      confidence = 0.3;
    }
    
    // Cleanup
    src.delete();
    gray.delete();
    blurred.delete();
    edged.delete();
    contours.delete();
    hierarchy.delete();
    
    return {
      canvas: resultCanvas,
      corners: documentCorners,
      confidence,
      warning
    };
    
  } catch (error) {
    console.error('Error in autoCrop:', error);
    throw error;
  }
};
