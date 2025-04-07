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
  
    let errorMessage = "";
    if (!errors.minLength) errorMessage += "Password must be at least 8 characters long.\n";
    else if (!errors.uppercase) errorMessage += "Password must contain one uppercase letter.\n";
    else if (!errors.lowercase) errorMessage += "Password must contain one lowercase letter.\n";
    else if (!errors.symbol) errorMessage += "Password must contain one symbol.\n";
    else if (!errors.number) errorMessage += "Password must contain one number.\n";
  
    return { isValid: Object.values(errors).every(v => v), errorMessage };
  };
  const handleChange = (name, value) => {
    // Update state
    setState(prev => ({ ...prev, [name]: value }));
  
    // Validate new password
    if (name === "newPassword") {
      const { isValid, errorMessage } = isValidPassword(value);
      setState(prev => ({
        ...prev,
        newPasswordError: isValid ? "" : errorMessage.trim()
      }));
    }
  
    // Validate password match
    if (name === "confirmPassword" || name === "newPassword") {
      setState(prev => ({
        ...prev,
        confirmPasswordError: 
          prev.confirmPassword && value !== prev.newPassword 
            ? "Passwords do not match" 
            : ""
      }));
    }
  };



  const handleResetPassword = async () => {
    
    const passwordValid = isValidPassword(state.newPassword).isValid;
    const passwordsMatch = state.newPassword === state.confirmPassword;


  if (!passwordValid || !passwordsMatch) {
    setState(prev => ({
      ...prev,
      newPasswordError: !passwordValid ? prev.newPasswordError : "",
      confirmPasswordError: !passwordsMatch ? "Passwords do not match" : ""
    }));
    return;
  }
    
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
    handleChange,
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