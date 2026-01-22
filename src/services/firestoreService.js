import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

const UPLOADS_COLLECTION = 'uploads';

export const firestoreService = {
  // Create a new upload record
  createUpload: async (userId, uploadData) => {
    try {
      const docRef = await addDoc(collection(db, UPLOADS_COLLECTION), {
        userId,
        ...uploadData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      console.error('Error creating upload:', error);
      return { id: null, error: error.message };
    }
  },

  // Update upload status
  updateUpload: async (uploadId, updates) => {
    try {
      const uploadRef = doc(db, UPLOADS_COLLECTION, uploadId);
      await updateDoc(uploadRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { error: null };
    } catch (error) {
      console.error('Error updating upload:', error);
      return { error: error.message };
    }
  },

  // Get all uploads for a user
  getUserUploads: async (userId) => {
    try {
      const q = query(
        collection(db, UPLOADS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const uploads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { uploads, error: null };
    } catch (error) {
      console.error('Error getting uploads:', error);
      return { uploads: [], error: error.message };
    }
  },

  // Get a single upload
  getUpload: async (uploadId) => {
    try {
      const docRef = doc(db, UPLOADS_COLLECTION, uploadId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { upload: { id: docSnap.id, ...docSnap.data() }, error: null };
      } else {
        return { upload: null, error: 'Upload not found' };
      }
    } catch (error) {
      console.error('Error getting upload:', error);
      return { upload: null, error: error.message };
    }
  }
};
