import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/auth.service';
import { useTranslation } from 'react-i18next';
import { useNetworkMonitor } from './useNetworkMonitor';

export const useChangePassword = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isConnected = useNetworkMonitor();

  const [state, setState] = useState({
    currentpassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrentPassword: false,
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    currentPasswordError: "",
    newPasswordError: "",
    confirmPasswordError: "",
    generalError: ""
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
    if (!errors.minLength) errorMessage += t("password_min_length");
    if (!errors.uppercase) errorMessage += t("password_uppercase");
    if (!errors.lowercase) errorMessage += t("password_lowercase");
    if (!errors.symbol) errorMessage += t("password_symbol");
    if (!errors.number) errorMessage += t("password_number");

    return { isValid: Object.values(errors).every(v => v), errorMessage };
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      currentPasswordError: "",
      newPasswordError: "",
      confirmPasswordError: "",
      generalError: ""
    };

    if (!state.currentpassword) {
      newErrors.currentPasswordError = t("current_password_required");
      isValid = false;
    }

    const passwordValidation = isValidPassword(state.newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPasswordError = passwordValidation.errorMessage;
      isValid = false;
    }

    if (state.newPassword !== state.confirmPassword) {
      newErrors.confirmPasswordError = t("passwords_not_match");
      isValid = false;
    }

    setState(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleChange = (name, value) => {
    setState(prev => ({
      ...prev,
      [name]: value,
      [`${name}Error`]: "",
      generalError: ""
    }));

    if (name === "newPassword") {
      const { isValid, errorMessage } = isValidPassword(value);
      setState(prev => ({
        ...prev,
        newPasswordError: isValid ? "" : errorMessage
      }));
    }
  };

  const handleResetPassword = async () => {
 
    if (!validateForm()) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("USER_ACCESS");
      console.log(`token from the hook ${token}`)

      console.log(userId)
      await AuthService.ChangePassword({
        userId,
        token,
        currentpassword: state.currentpassword,
        newpassword: state.newPassword,
        confirmpassword: state.confirmPassword,
      });

      navigation.goBack();
    } catch (error) {
      handleResetError(error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleResetError = (error) => {
    const errorMessage = error.response?.data?.error || t("general_error");
    
    switch (errorMessage) {
      case "Current password is incorrect":
        setState(prev => ({
          ...prev,
          currentPasswordError: t("incorrect_current_password")
        }));
        break;
      case "You've already used this password":
        setState(prev => ({
          ...prev,
          newPasswordError: t("password_already_used")
        }));
        break;
      default:
        setState(prev => ({ ...prev, generalError: errorMessage }));
    }
  };

  return {
    ...state,
    t,
    isConnected,
    handleChange,
    handleResetPassword,
    toggleShowCurrentPassword: () => setState(prev => ({
      ...prev,
      showCurrentPassword: !prev.showCurrentPassword
    })),
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