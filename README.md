# Document Scanner Web Application

A professional document scanning and enhancement web application built with React and Firebase. Upload images or PDF documents, apply intelligent enhancement filters, and store processed documents securely in the browser.

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React 19)                     │
├─────────────────────────────────────────────────────────────────┤
│  Pages          │  Components       │  Hooks                    │
│  - Login        │  - UploadDropzone │  - useAuth                │
│  - Gallery      │  - BeforeAfter    │  - useUploads             │
│  - Upload       │  - Loader         │  - useProcessingStatus    │
│  - Viewer       │  - WarningBanner  │                           │
├─────────────────────────────────────────────────────────────────┤
│                     Services Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  - authService (Firebase Auth)                                  │
│  - firestoreService (Metadata Storage)                          │
│  - indexedDBService (Image Blob Storage)                        │
├─────────────────────────────────────────────────────────────────┤
│               Image Processing Utilities                        │
├─────────────────────────────────────────────────────────────────┤
│  - imageEnhancement.js (Canvas API Filters)                     │
│  - geminiEnhancer.js (Optional AI Filter Selection)             │
│  - pdfToImage.js (PDF.js Integration)                           │
│  - imageHelpers.js (Utility Functions)                          │
├─────────────────────────────────────────────────────────────────┤
│                    External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  Firebase Auth  │  Firestore DB  │  IndexedDB  │  Gemini AI    │
│  (Email/Google) │  (Metadata)    │  (Images)   │  (Optional)   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Authentication**: Firebase Authentication handles email/password and Google OAuth
2. **Document Upload**: Files uploaded through drag-and-drop or file picker
3. **PDF Processing**: PDF.js converts PDF pages to images
4. **Enhancement**: Canvas API applies selected image filters
5. **Storage**: 
   - Image blobs stored in browser IndexedDB (no server costs)
   - Metadata stored in Firebase Firestore
6. **Retrieval**: Documents loaded from IndexedDB and displayed in gallery/viewer

## How Auto-Crop Works

The application uses Canvas API for real-time image enhancement. Here's the algorithm pipeline:

### Enhancement Pipeline

```
User Uploads File
       ↓
Convert to Image (PDF.js if needed)
       ↓
Load Image → Canvas Context
       ↓
Extract ImageData (pixel array)
       ↓
Apply Selected Filter Algorithm
       ↓
Update Canvas with Modified Pixels
       ↓
Export as Blob
       ↓
Store in IndexedDB + Metadata in Firestore
```

### Filter Algorithms

#### 1. Auto Enhancement (Default)
```
Step 1: Convert to Grayscale
  Formula: Gray = 0.299×R + 0.587×G + 0.114×B
  
Step 2: Apply Contrast Enhancement (factor: 1.4)
  Formula: NewPixel = 1.4 × (Pixel - 128) + 128
  
Step 3: Apply Brightness Adjustment (+15)
  Formula: NewPixel = Pixel + 15
```

#### 2. Grayscale
```
Convert RGB to grayscale using luminosity formula
Preserves perceived brightness of colors
Formula: Gray = 0.299×R + 0.587×G + 0.114×B
```

#### 3. High Contrast
```
Step 1: Convert to grayscale
Step 2: Strong contrast (factor: 1.5)
Step 3: Brightness boost (+10)
Ideal for: Scanned text documents
```

#### 4. Black & White
```
Step 1: Convert to grayscale
Step 2: Apply binary threshold (default: 128)
  Formula: Pixel = (Gray > 128) ? 255 : 0
Result: Sharp binary images
```

#### 5. Smart Enhancement
```
Step 1: Apply sharpening kernel convolution
  Kernel Matrix:
  [  0, -1,  0 ]
  [ -1,  5, -1 ]
  [  0, -1,  0 ]
  
Step 2: Moderate contrast (factor: 1.2)
Step 3: Slight brightness (+5)
```

#### 6. Original
```
No processing applied
Returns original image unchanged
```

### Optional AI Enhancement

When Gemini API is configured:
1. Convert image to base64 format
2. Send to Gemini with analysis prompt
3. AI analyzes image content and suggests optimal filter
4. Returns filter recommendation with analysis explanation

## Setup Instructions

### Prerequisites

- Node.js 16 or higher
- npm or yarn package manager
- Firebase account (free Spark plan sufficient)
- Optional: Google Gemini API key

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd document-scanner
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**

Create `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: For AI-powered filter selection
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Firebase Setup

1. **Create Firebase Project**
   - Visit https://console.firebase.google.com/
   - Create a new project
   - Copy configuration values to `.env`

2. **Enable Authentication**
   - Navigate to Authentication section
   - Enable Email/Password provider
   - Enable Google provider
   - Add your domain to authorized domains

3. **Create Firestore Database**
   - Navigate to Firestore Database
   - Create database in production mode
   - Choose region closest to your users

4. **Deploy Firestore Rules**

Copy rules from `firestore.rules` to Firebase Console:
- Go to Firestore Database > Rules tab
- Paste the rules and publish

Or use Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### Development Scripts

**Start development server:**
```bash
npm run dev
```
Application runs at http://localhost:3000

**Build for production:**
```bash
npm run build
```
Creates optimized build in `dist/` directory

**Run linter:**
```bash
npm run lint
```

**Deploy to Firebase Hosting:**
```bash
firebase deploy --only hosting
```

### Demo Credentials

For testing:
```
Email: demo@test.com
Password: demo123
```

## Libraries Used

### Core Dependencies

| Library | Version | License | Purpose |
|---------|---------|---------|---------|
| react | 19.2.0 | MIT | UI framework |
| react-dom | 19.2.0 | MIT | React DOM renderer |
| react-router-dom | 6.20.1 | MIT | Client-side routing |
| firebase | 10.7.1 | Apache-2.0 | Authentication, Firestore |
| pdfjs-dist | 3.11.174 | Apache-2.0 | PDF parsing |

### Development Dependencies

| Library | Version | License | Purpose |
|---------|---------|---------|---------|
| vite | 7.2.4 | MIT | Build tool and dev server |
| @vitejs/plugin-react | 5.1.1 | MIT | React Fast Refresh |
| eslint | 9.39.1 | MIT | Code linting |

All dependencies use OSS-compatible licenses (MIT, Apache-2.0) suitable for commercial and personal use.

## Trade-offs & Design Decisions

### 1. IndexedDB vs Firebase Storage

**Decision**: Use browser IndexedDB for image storage

**Rationale**:
- Zero storage costs (Firebase Storage requires paid Blaze plan)
- Faster load times (no network latency)
- Works offline after initial load
- Suitable for MVP and individual use

**Trade-offs**:
- Images tied to specific browser/device
- No cross-device synchronization
- Limited by browser storage quotas (50-100MB typical)
- Not suitable for team collaboration

**Future Improvement**: Hybrid approach - IndexedDB for caching with optional Firebase Storage for cross-device sync

### 2. Canvas API vs OpenCV.js

**Decision**: Use native Canvas API for image processing

**Rationale**:
- No external library loading delays
- Smaller bundle size (OpenCV.js is 8MB+)
- Sufficient for document enhancement
- Better browser compatibility
- Instant processing with no initialization

**Trade-offs**:
- Limited to basic image operations
- No advanced computer vision (edge detection, perspective correction)
- Manual filter implementation required
- Cannot handle complex document detection

**Future Improvement**: Server-side processing with OpenCV/Python for advanced features like automatic perspective correction

### 3. Client-Side Processing

**Decision**: All image processing happens in the browser

**Rationale**:
- Zero server costs
- Instant feedback to users
- Privacy (images never leave device)
- Scales automatically with number of users
- No server infrastructure needed

**Trade-offs**:
- Limited by client device performance
- Inconsistent processing speed across devices
- Cannot process very large images efficiently
- Battery drain on mobile devices
- No background processing

**Future Improvement**: Offload heavy processing to cloud functions for files > 5MB

### 4. Firestore Query Optimization

**Decision**: Client-side sorting instead of composite indexes

**Rationale**:
- Avoids creating Firebase composite indexes
- Faster development iteration
- Simpler deployment process
- No index management overhead

**Trade-offs**:
- Less efficient for large datasets (1000+ documents)
- Slight performance impact on initial gallery load
- All documents fetched before sorting

**Future Improvement**: Create composite index (userId + createdAt) for production deployments

### 5. Synchronous File Processing

**Decision**: Process one file at a time

**Rationale**:
- Simpler code and state management
- More predictable resource usage
- Better error handling per file
- Clear progress indication

**Trade-offs**:
- Cannot process multiple files simultaneously
- Slower for batch uploads
- User must wait for each file sequentially

**Future Improvement**: Implement batch upload with parallel processing using Web Workers

## What I'd Improve Next

### High Priority

1. **Batch Upload Processing**
   - Allow multiple file selection
   - Process files in parallel using Web Workers
   - Show progress for each file individually

2. **Advanced Export Options**
   - Download as ZIP archive
   - Export as multi-page PDF
   - Bulk download all documents
   - Email documents directly

3. **Mobile Optimization**
   - Progressive Web App (PWA) support
   - Native camera integration
   - Touch gestures for zoom/pan
   - Optimize for smaller screens

4. **Perspective Correction**
   - Automatic edge detection using OpenCV.js
   - Four-point perspective transformation
   - Manual corner adjustment UI
   - Grid overlay for alignment

5. **Share & Collaborate**
   - Generate shareable links
   - Set expiration dates
   - Password protection
   - View-only access control

### Medium Priority

1. **Document OCR**
   - Extract text using Tesseract.js
   - Copy text to clipboard
   - Search within documents
   - Multilingual support

2. **Annotation Tools**
   - Draw shapes and arrows
   - Add text notes
   - Highlight important sections
   - Save annotations with document

3. **Version History**
   - Track document changes
   - Compare versions side-by-side
   - Revert to previous versions
   - Show edit timestamps

4. **Cloud Synchronization**
   - Optional Firebase Storage integration
   - Cross-device access
   - Automatic backup
   - Conflict resolution

5. **Advanced Filters**
   - Noise reduction
   - Automatic rotation
   - Color correction
   - Adaptive thresholding

### Low Priority

1. **UI Enhancements**
   - Dark mode toggle
   - Customizable themes
   - Keyboard shortcuts
   - Accessibility improvements

2. **Analytics Dashboard**
   - Document statistics
   - Storage usage charts
   - Processing time metrics
   - Usage trends

3. **Print Optimization**
   - Direct printing
   - Page layout options
   - Print multiple documents
   - Save as print-ready PDF

4. **API Integration**
   - REST API for uploads
   - Webhooks for processing events
   - Third-party integrations
   - Zapier/IFTTT support

5. **Performance Optimization**
   - Lazy loading for large galleries
   - Image thumbnail caching
   - Service worker for offline support
   - Code splitting by route

## Project Structure

```
document-scanner/
├── public/
│   └── index.html
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   └── router.jsx
│   ├── components/
│   │   ├── BeforeAfter.jsx
│   │   ├── Loader.jsx
│   │   ├── UploadDropzone.jsx
│   │   └── WarningBanner.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProcessingStatus.js
│   │   └── useUploads.js
│   ├── pages/
│   │   ├── Gallery.jsx
│   │   ├── Login.jsx
│   │   ├── Upload.jsx
│   │   └── Viewer.jsx
│   ├── services/
│   │   ├── authService.js
│   │   ├── firebase.js
│   │   ├── firestoreService.js
│   │   └── indexedDBService.js
│   ├── styles/
│   │   └── global.css
│   ├── utils/
│   │   ├── confidenceScore.js
│   │   ├── geminiEnhancer.js
│   │   ├── imageEnhancement.js
│   │   ├── imageHelpers.js
│   │   └── pdfToImage.js
│   ├── main.jsx
│   └── App.jsx
├── .env
├── .gitignore
├── eslint.config.js
├── firebase.json
├── firestore.rules
├── package.json
├── README.md
└── vite.config.js
```

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open an issue on the repository.

