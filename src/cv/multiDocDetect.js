import { perspectiveWarp } from './perspectiveWarp';
import { calculateConfidenceScore } from '../utils/confidenceScore';

/**
 * Detects and crops multiple documents from a single image
 * @param {HTMLImageElement|HTMLCanvasElement} image - Source image
 * @param {Object} cv - OpenCV instance
 * @returns {Array} Array of {canvas, corners, confidence} objects
 */
export const multiDocDetect = (image, cv) => {
  try {
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
    
    // Process contours
    const documents = [];
    const minArea = (src.cols * src.rows) * 0.05; // At least 5% of image
    
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      // Skip small contours
      if (area < minArea) {
        continue;
      }
      
      const peri = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * peri, true);
      
      // Look for 4-sided polygons
      if (approx.rows === 4) {
        const corners = [];
        for (let j = 0; j < 4; j++) {
          corners.push({
            x: approx.data32S[j * 2],
            y: approx.data32S[j * 2 + 1]
          });
        }
        
        const confidence = calculateConfidenceScore(corners, src.cols, src.rows);
        
        // Only include high confidence detections
        if (confidence > 0.6) {
          try {
            const canvas = perspectiveWarp(image, corners, cv);
            documents.push({ canvas, corners, confidence });
          } catch (e) {
            console.warn('Failed to warp document:', e);
          }
        }
      }
      
      approx.delete();
    }
    
    // Sort by confidence
    documents.sort((a, b) => b.confidence - a.confidence);
    
    // Cleanup
    src.delete();
    gray.delete();
    blurred.delete();
    edged.delete();
    contours.delete();
    hierarchy.delete();
    
    return documents;
    
  } catch (error) {
    console.error('Error in multiDocDetect:', error);
    throw error;
  }
};
