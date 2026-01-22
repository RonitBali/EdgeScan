import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const result = await authService.signIn(email, password);
    return result;
  };

  const signUp = async (email, password) => {
    const result = await authService.signUp(email, password);
    return result;
  };

  const signOut = async () => {
    const result = await authService.signOut();
    return result;
  };

  const signInWithGoogle = async () => {
    const result = await authService.signInWithGoogle();
    return result;
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    isAuthenticated: !!user
  };
};
