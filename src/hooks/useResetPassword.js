import { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/auth.service';
import { useTranslation } from 'react-i18next';
import { useNetworkMonitor } from './useNetworkMonitor';

export const useResetPassword = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const isConnected = useNetworkMonitor();
  
  const [state, setState] = useState({
    email: route.params?.email || "",
    newPassword: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    newPasswordError: "",
    confirmPasswordError: ""
  });

  const isValidPassword = (password) => {
    const errors = {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      number: /\d/.test(password),
    };

    return {
      isValid: Object.values(errors).every(valid => valid),
      errors
    };
  };

  const validateForm = () => {
    const passwordValidation = isValidPassword(state.newPassword);
    let newPasswordError = "";
    
    if (!state.newPassword.trim()) {
      newPasswordError = t("Password is required");
    } else if (!passwordValidation.isValid) {
      newPasswordError = Object.entries(passwordValidation.errors)
        .filter(([_, valid]) => !valid)
        .map(([key]) => {
          switch(key) {
            case 'minLength': return t("Password must be at least 8 characters long");
            case 'uppercase': return t("Password must contain at least one uppercase letter");
            case 'lowercase': return t("Password must contain at least one lowercase letter");
            case 'symbol': return t("Password must contain at least one symbol");
            case 'number': return t("Password must contain at least one number");
            default: return "";
          }
        })
        .join("\n");
    }

    const confirmPasswordError = state.newPassword !== state.confirmPassword 
      ? t("Passwords do not match") 
      : "";

    setState(prev => ({
      ...prev,
      newPasswordError,
      confirmPasswordError
    }));

    return !newPasswordError && !confirmPasswordError;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const code = await AsyncStorage.getItem("CodeFromEnterCode");
      await AuthService.resetPassword({
        email: state.email,
        newPassword: state.newPassword,
        code
      });
      
      navigation.navigate("Login");
    } catch (error) {
      handleResetError(error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleResetError = (error) => {
    const errorMessage = error.response?.data?.error || '';
    if (errorMessage === "You've already used this password.") {
      setState(prev => ({
        ...prev,
        newPasswordError: t("You've already used this password")
      }));
    }
  };

  return {
    ...state,
    t,
    isConnected,
    setState: (update) => setState(prev => ({ ...prev, ...update })),
    handleResetPassword,
    toggleShowPassword: () => setState(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    })),
    toggleShowConfirmPassword: () => setState(prev => ({
      ...prev,
      showConfirmPassword: !prev.showConfirmPassword
    }))
  };
};