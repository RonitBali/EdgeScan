// IndexedDB service for storing images locally in browser
const DB_NAME = 'DocumentScannerDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

class IndexedDBService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async saveImage(id, blob, type = 'original') {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const key = `${id}_${type}`;
      const request = store.put({ id: key, blob, timestamp: Date.now() });

      request.onsuccess = () => resolve(key);
      request.onerror = () => reject(request.error);
    });
  }

  async getImage(id, type = 'original') {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const key = `${id}_${type}`;
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteImage(id, type = 'original') {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const key = `${id}_${type}`;
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteUpload(uploadId) {
    await this.init();

    // Delete both original and processed images
    await this.deleteImage(uploadId, 'original');
    
    // Try to delete all processed versions (0-9)
    for (let i = 0; i < 10; i++) {
      try {
        await this.deleteImage(uploadId, `processed_${i}`);
      } catch (e) {
        // Ignore if doesn't exist
      }
    }
  }

  blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  dataURLToBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}

export const indexedDBService = new IndexedDBService();
