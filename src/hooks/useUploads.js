import { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';

export const useUploads = (userId) => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUploads = async () => {
      setLoading(true);
      const { uploads, error } = await firestoreService.getUserUploads(userId);
      
      if (error) {
        setError(error);
      } else {
        setUploads(uploads);
      }
      
      setLoading(false);
    };

    fetchUploads();
  }, [userId]);

  const refetch = async () => {
    if (!userId) return;
    
    setLoading(true);
    const { uploads, error } = await firestoreService.getUserUploads(userId);
    
    if (error) {
      setError(error);
    } else {
      setUploads(uploads);
    }
    
    setLoading(false);
  };

  return {
    uploads,
    loading,
    error,
    refetch
  };
};
