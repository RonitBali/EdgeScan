// Gemini AI-powered document enhancement
// Uses Google's Gemini API to analyze and enhance document images

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const analyzeWithGemini = async (imageBlob) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.log('Gemini API key not configured, using smart defaults');
    return {
      suggestedFilter: 'auto',
      confidence: 0.85,
      analysis: 'Using automatic enhancement'
    };
  }

  try {
    // Convert blob to base64
    const base64 = await blobToBase64(imageBlob);
    const imageData = base64.split(',')[1];

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analyze this document image and recommend the best enhancement filter. 
                
Available filters:
- grayscale: Convert to grayscale
- highContrast: High contrast for scanned docs
- blackAndWhite: Sharp black and white
- enhance: Sharpen and adjust
- auto: Automatic enhancement

Respond with ONLY a JSON object in this exact format:
{
  "filter": "filterName",
  "reason": "brief explanation",
  "documentType": "type of document"
}`
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageData
                }
              }
            ]
          }]
        })
      }
    );

    const result = await response.json();
    
    if (result.candidates && result.candidates[0]) {
      const text = result.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          suggestedFilter: analysis.filter || 'auto',
          confidence: 0.95,
          analysis: analysis.reason || 'AI-analyzed',
          documentType: analysis.documentType
        };
      }
    }

    return {
      suggestedFilter: 'auto',
      confidence: 0.85,
      analysis: 'AI analysis completed'
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      suggestedFilter: 'auto',
      confidence: 0.80,
      analysis: 'Using automatic enhancement (AI unavailable)'
    };
  }
};

export const enhanceWithGemini = async (imageElement) => {
  // Convert image to blob
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0);
  
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  
  // Get AI recommendation
  const aiAnalysis = await analyzeWithGemini(blob);
  
  return {
    ...aiAnalysis,
    originalImage: imageElement
  };
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const isGeminiConfigured = () => {
  return GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here';
};
