import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const storageService = {
  // Upload a file to Firebase Storage
  uploadFile: async (file, path) => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { url: downloadURL, error: null };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { url: null, error: error.message };
    }
  },

  // Upload blob (for processed images)
  uploadBlob: async (blob, path, contentType = 'image/png') => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType
      });
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { url: downloadURL, error: null };
    } catch (error) {
      console.error('Error uploading blob:', error);
      return { url: null, error: error.message };
    }
  },

  // Generate storage path for user uploads
  generateUploadPath: (userId, filename, type = 'original') => {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `uploads/${userId}/${type}/${timestamp}_${sanitizedFilename}`;
  }
};
