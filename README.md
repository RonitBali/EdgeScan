# 📄 Document Scanner Web App

A full-stack React web application that automatically detects, perspective-corrects, and crops documents from images (CamScanner-style) using OpenCV.js. Features include PDF support, multi-document detection, before/after comparison with zoom/pan, and secure per-user storage.

## 🎯 Features

### Core Functionality
- **✅ Email/Password Authentication** - Secure user authentication via Firebase Auth
- **✅ Image Upload** - Support for PNG, JPEG formats with drag-and-drop interface
- **✅ PDF Support** - Automatically converts first page of PDF to image using pdf.js
- **✅ Auto-Crop & Perspective Correction** - Detects document edges and applies perspective warp
- **✅ Multi-Document Detection** - Detects and crops multiple documents from a single image
- **✅ Before/After Viewer** - Interactive side-by-side comparison with zoom and pan controls
- **✅ Gallery View** - Browse all uploaded documents with thumbnails
- **✅ Secure Storage** - Per-user data isolation with Firebase Security Rules
- **✅ Real-time Status** - Loading states, progress indicators, and error handling

### Advanced Features
- **High-Quality Processing** - Scanner-grade perspective correction
- **Confidence Scoring** - Algorithm confidence metrics for each detection
- **Warning System** - Fallback with warnings when auto-detection is uncertain
- **Responsive Design** - Works on desktop and mobile devices
- **Optimized Performance** - Code splitting and lazy loading

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: React 19 with Hooks
- **Routing**: React Router v6
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **Storage**: IndexedDB (browser local storage) - No Firebase Storage costs!
- **Computer Vision**: OpenCV.js (client-side processing)
- **PDF Processing**: PDF.js
- **Build Tool**: Vite

### Data Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Uploads image/PDF
       ▼
┌─────────────────────────┐
│  React Frontend         │
│  - File validation      │
│  - PDF → Image (pdf.js) │
└──────┬──────────────────┘
       │ Image data
       ▼
┌─────────────────────────┐
│  OpenCV.js (Client)     │
│  1. Grayscale + Blur    │
│  2. Canny edge detect   │
│  3. Contour detection   │
│  4. Polygon approx      │
│  5. Perspective warp    │
└──────┬──────────────────┘
       │ Processed canvas
       ▼
┌─────────────────────────┐
│  IndexedDB (Browser)    │
│  - Stores images as     │
│    blobs locally        │
│  - No external storage  │
│  - 100% free            │
└──────┬──────────────────┘
       │ Metadata only
       ▼
┌─────────────────────────┐
│  Firestore Database     │
│  - uploads collection   │
│    - userId, uploadId,  │
│      metadata, etc.     │
└─────────────────────────┘
```

## 🔬 Auto-Crop Algorithm

The document detection and cropping pipeline:

### 1. **Preprocessing**
```javascript
- Convert to grayscale (reduces color noise)
- Apply Gaussian blur (5x5 kernel) to reduce detail noise
```

### 2. **Edge Detection**
```javascript
- Canny edge detection (thresholds: 75, 200)
- Produces binary edge map highlighting document boundaries
```

### 3. **Contour Analysis**
```javascript
- Find all contours in edge map
- Sort by area (largest first)
- Approximate each contour to polygon (2% tolerance)
- Select first 4-sided polygon (quadrilateral)
```

### 4. **Validation & Confidence Scoring**
```javascript
- Check if corners are too close to image edges (reduce confidence)
- Verify area ratio (10%-95% of image)
- Ensure opposite sides are similar length (rectangularity check)
- Compute final confidence score (0-1)
```

### 5. **Perspective Transformation**
```javascript
- Order corners: top-left, top-right, bottom-right, bottom-left
- Calculate destination dimensions from corner distances
- Compute perspective transform matrix
- Apply warpPerspective to straighten document
```

### 6. **Fallback Strategy**
```javascript
if (confidence < 0.5 || no_quadrilateral_found) {
  - Use entire image as document
  - Display warning to user
  - Return original with minimal processing
}
```

### Multi-Document Mode
- Detects ALL quadrilaterals with area > 5% of image
- Filters by confidence > 0.6
- Generates separate cropped image for each document
- Useful for scanning multiple ID cards, receipts, etc.

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+ and npm/yarn
- Firebase account (free tier works)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd document-scanner
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Email/Password + Google provider
4. Enable **Firestore Database** (start in test mode, we'll add rules)
5. ~~Enable **Storage**~~ - **NOT NEEDED!** Using IndexedDB instead (100% free)
6. Enable **Hosting** (optional, for deployment)

#### Get Firebase Config
1. Go to Project Settings → General
2. Scroll to "Your apps" → Add web app
3. Copy the config object

#### Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your Firebase config:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Security Rules

#### Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:
- Firestore (use existing files)
- Hosting (use existing files)
- ~~Storage~~ - Skip, not using Firebase Storage

#### Deploy Rules
```bash
firebase deploy --only firestore:rules
```

### 5. Run Development Server
```bash
npm run dev
```

App will open at `http://localhost:3000`

### 6. Build for Production
```bash
npm run build
```

### 7. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

Your app will be live at `https://your-project-id.web.app`

## 🧪 Testing

### Test Credentials
After deploying, create test accounts:
1. Navigate to the app
2. Click "Sign Up"
3. Use: `test@example.com` / `password123`

### Test Images
Try uploading:
- **Documents**: Receipts, contracts, ID cards
- **Rotated/Skewed**: Photos taken at angles
- **Multiple Documents**: Two business cards on a desk
- **PDFs**: Multi-page documents (first page extracted)

## 📚 Libraries Used

All libraries are **open-source** with permissive licenses:

| Library | Version | License | Purpose |
|---------|---------|---------|---------|
| React | 19.2.0 | MIT | UI framework |
| React Router | 6.20.1 | MIT | Client-side routing |
| Firebase | 10.7.1 | Apache 2.0 | Backend services |
| OpenCV.js | 4.5.2 | Apache 2.0 | Computer vision |
| PDF.js | 3.11.174 | Apache 2.0 | PDF rendering |
| Vite | 7.2.4 | MIT | Build tool |

**No commercial or closed-source APIs used.**

## 🔒 Security

### Firestore Rules
- Users can only read/write their own uploads
- `userId` field enforced on all operations
- Prevents data leakage between users

### Storage Rules
- Per-user folder isolation: `/uploads/{userId}/`
- File size limit: 10MB max
- Content type validation: images and PDFs only
- Users cannot access other users' files

### Authentication
- Firebase Auth handles secure password storage
- Tokens automatically managed
- Protected routes redirect unauthenticated users

## ⚖️ Trade-offs & Future Improvements

### Current Trade-offs

1. **Client-Side Processing**
   - ✅ **Pro**: No server costs, instant feedback
   - ❌ **Con**: Performance depends on user's device
   - **Improvement**: Add optional server-side processing for large files

2. **OpenCV.js Loading**
   - ✅ **Pro**: No installation needed
   - ❌ **Con**: ~8MB download on first load
   - **Improvement**: Implement service worker caching

3. **Single Page Extraction for PDFs**
   - ✅ **Pro**: Simpler UX, faster processing
   - ❌ **Con**: Can't process multi-page docs
   - **Improvement**: Add page selection UI

4. **No Offline Support**
   - ✅ **Pro**: Simpler architecture
   - ❌ **Con**: Requires internet connection
   - **Improvement**: Add PWA with offline queue

### Future Enhancements

- [ ] **Batch Upload**: Process multiple files in queue
- [ ] **Image Enhancement**: Auto-brightness, contrast, sharpening
- [ ] **OCR Integration**: Extract text from scanned documents
- [ ] **Export Options**: Multi-page PDF generation
- [ ] **Editing Tools**: Manual corner adjustment, rotation
- [ ] **Collaboration**: Share documents with other users
- [ ] **Mobile App**: React Native version
- [ ] **Unit Tests**: Jest + React Testing Library
- [ ] **E2E Tests**: Cypress or Playwright
- [ ] **Performance Monitoring**: Firebase Performance
- [ ] **Analytics**: Track usage patterns

## 🐛 Known Issues

1. Very low-light or high-contrast images may fail detection
2. Documents with busy patterns (e.g., blueprints) may confuse edge detection
3. OpenCV loading timeout on slow connections (30s limit)

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 👨‍💻 Author

Built as a Full-Stack Intern Assignment demonstrating:
- React architecture and state management
- Firebase integration (Auth, Firestore, Storage, Hosting)
- Computer vision with OpenCV.js
- Secure multi-user application design
- Production-ready deployment

---

**Live Demo**: [https://your-project-id.web.app](https://your-project-id.web.app)  
**GitHub**: [https://github.com/your-username/document-scanner](https://github.com/your-username/document-scanner)

