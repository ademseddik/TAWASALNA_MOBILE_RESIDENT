import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../services/auth.service';
import { useTranslation } from 'react-i18next';
import { useNetworkMonitor } from './useNetworkMonitor';

export const useForgotPassword = () => {
  const navigation = useNavigation();
  const isConnected = useNetworkMonitor();
  const { t } = useTranslation();
  
  const [state, setState] = useState({
    email: '',
    isLoading: false,
    errors: {}
  });

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const errors = {};
    if (!state.email.trim()) errors.email = t("Email is required!");
    else if (!isValidEmail(state.email)) errors.email = t("Invalid email address!");
    
    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleForgotPassword = async () => {
    if (!validateForm()) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await AuthService.forgetPassWord({ email: state.email });
      navigation.navigate("Enter Code", { email: state.email });
   
      setState(prev => ({
        ...prev,
        errors: { email: t("Email doesn't exist!") }
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    ...state,
    isConnected,
    t,
    setState: (update) => setState(prev => ({ ...prev, ...update })),
    handleForgotPassword
  };
};