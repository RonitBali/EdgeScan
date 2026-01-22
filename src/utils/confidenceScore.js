/**
 * Calculate confidence score for detected document corners
 * @param {Array} corners - Array of 4 corner points
 * @param {number} imageWidth - Image width
 * @param {number} imageHeight - Image height
 * @returns {number} Confidence score between 0 and 1
 */
export const calculateConfidenceScore = (corners, imageWidth, imageHeight) => {
  if (!corners || corners.length !== 4) return 0;
  
  let score = 1.0;
  
  // Check if corners are too close to image edges (might be detecting image boundary)
  const edgeMargin = 10;
  const tooCloseToEdge = corners.some(corner => 
    corner.x < edgeMargin || 
    corner.x > imageWidth - edgeMargin ||
    corner.y < edgeMargin || 
    corner.y > imageHeight - edgeMargin
  );
  
  if (tooCloseToEdge) {
    score *= 0.5;
  }
  
  // Calculate area of detected quadrilateral
  const area = Math.abs(
    (corners[0].x * corners[1].y - corners[1].x * corners[0].y) +
    (corners[1].x * corners[2].y - corners[2].x * corners[1].y) +
    (corners[2].x * corners[3].y - corners[3].x * corners[2].y) +
    (corners[3].x * corners[0].y - corners[0].x * corners[3].y)
  ) / 2;
  
  const imageArea = imageWidth * imageHeight;
  const areaRatio = area / imageArea;
  
  // Document should be at least 10% of image, but not the entire image
  if (areaRatio < 0.1) {
    score *= 0.3;
  } else if (areaRatio > 0.95) {
    score *= 0.5;
  }
  
  // Check if shape is roughly rectangular
  const distances = [
    Math.sqrt(Math.pow(corners[1].x - corners[0].x, 2) + Math.pow(corners[1].y - corners[0].y, 2)),
    Math.sqrt(Math.pow(corners[2].x - corners[1].x, 2) + Math.pow(corners[2].y - corners[1].y, 2)),
    Math.sqrt(Math.pow(corners[3].x - corners[2].x, 2) + Math.pow(corners[3].y - corners[2].y, 2)),
    Math.sqrt(Math.pow(corners[0].x - corners[3].x, 2) + Math.pow(corners[0].y - corners[3].y, 2))
  ];
  
  // Check if opposite sides are similar length
  const ratio1 = Math.min(distances[0], distances[2]) / Math.max(distances[0], distances[2]);
  const ratio2 = Math.min(distances[1], distances[3]) / Math.max(distances[1], distances[3]);
  
  const rectangularScore = (ratio1 + ratio2) / 2;
  score *= rectangularScore;
  
  return Math.max(0, Math.min(1, score));
};
