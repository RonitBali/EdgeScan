/**
 * Orders points in clockwise order starting from top-left
 * @param {Array} points - Array of 4 points [{x, y}, ...]
 * @returns {Array} Ordered points [topLeft, topRight, bottomRight, bottomLeft]
 */
export const orderPoints = (points) => {
  // Sort by y-coordinate
  const sorted = points.sort((a, b) => a.y - b.y);
  
  // Top two points
  const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
  // Bottom two points
  const bottom = sorted.slice(2, 4).sort((a, b) => a.x - b.x);
  
  return [
    top[0],      // top-left
    top[1],      // top-right
    bottom[1],   // bottom-right
    bottom[0]    // bottom-left
  ];
};

/**
 * Apply perspective transformation to correct document skew
 * @param {HTMLImageElement|HTMLCanvasElement} image - Source image
 * @param {Array} corners - Four corner points of the document
 * @param {Object} cv - OpenCV instance
 * @returns {HTMLCanvasElement} Warped image canvas
 */
export const perspectiveWarp = (image, corners, cv) => {
  // Create source mat from image
  const src = cv.imread(image);
  
  // Order corner points
  const orderedCorners = orderPoints(corners);
  
  // Calculate destination dimensions
  const [tl, tr, br, bl] = orderedCorners;
  
  const widthA = Math.sqrt(Math.pow(br.x - bl.x, 2) + Math.pow(br.y - bl.y, 2));
  const widthB = Math.sqrt(Math.pow(tr.x - tl.x, 2) + Math.pow(tr.y - tl.y, 2));
  const maxWidth = Math.max(widthA, widthB);
  
  const heightA = Math.sqrt(Math.pow(tr.x - br.x, 2) + Math.pow(tr.y - br.y, 2));
  const heightB = Math.sqrt(Math.pow(tl.x - bl.x, 2) + Math.pow(tl.y - bl.y, 2));
  const maxHeight = Math.max(heightA, heightB);
  
  // Source points
  const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x, tl.y,
    tr.x, tr.y,
    br.x, br.y,
    bl.x, bl.y
  ]);
  
  // Destination points
  const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    maxWidth, 0,
    maxWidth, maxHeight,
    0, maxHeight
  ]);
  
  // Get perspective transform matrix
  const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
  
  // Apply warp
  const dst = new cv.Mat();
  const dsize = new cv.Size(maxWidth, maxHeight);
  cv.warpPerspective(src, dst, M, dsize);
  
  // Create output canvas
  const canvas = document.createElement('canvas');
  cv.imshow(canvas, dst);
  
  // Cleanup
  src.delete();
  dst.delete();
  M.delete();
  srcPoints.delete();
  dstPoints.delete();
  
  return canvas;
};
