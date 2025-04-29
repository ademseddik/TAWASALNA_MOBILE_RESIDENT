// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { isSignedIn: isClerkSignedIn } = useAuth();
  const [isCustomSignedIn, setIsCustomSignedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('USER_ACCESS');
      setIsCustomSignedIn(!!token);
    };
    checkAuth();
  }, []);

  const value = {
    isAuthenticated: isClerkSignedIn || isCustomSignedIn,
    updateCustomAuth: (status) => setIsCustomSignedIn(status)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthState = () => {
  return useContext(AuthContext);
};