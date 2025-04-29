import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../services/auth.service';
import { useTranslation } from 'react-i18next';
import { useNetworkMonitor } from './useNetworkMonitor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../../i18n';

export const useSignUp = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isConnected = useNetworkMonitor();
  const [baseState, setBaseState] = useState({
    isChecked: false,
    email: "",
    fullname: "",
    password: "",
    dateOfBirth: "",
    confirmPassword: "",
    residentId: "",
    showPassword: false,
    showConfirmPassword: false,
    dateofbirthError: "",
    fullnameError: "",
    emailError: "",
    passwordError: "",
    confirmpasswordError: "",
    termspolicyError: "",
    
    isTermsModalVisible: false,
    isPrivacyPolicyModalVisible: false,
    isLoading: false,
    date: new Date(),
    showPicker: false,
   });

  const setState = (update) => {
    setBaseState(prev => ({ ...prev, ...update }));
  };

  const toggleCheckbox = () => {
    setState((prev) => ({ ...prev, isChecked: !prev.isChecked }));
  };

  const toggleTermsModal = () => {
    setState((prev) => ({ ...prev, isTermsModalVisible: !prev.isTermsModalVisible }));
  };

  const togglePrivacyPolicyModal = () => {
    setState((prev) => ({ ...prev, isPrivacyPolicyModalVisible: !prev.isPrivacyPolicyModalVisible }));
  };

  const toggleShowPassword = () => {
    setState((prev) => ({ ...prev, showPassword: !prev.showPassword }));
  };

  const toggleShowConfirmPassword = () => {
    setState((prev) => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }));
  };

  const toggleDatePicker = () => {
    setState(prev => ({ 
      ...prev, 
      showPicker: !prev.showPicker 
    }));
  };

  const onchangeDatePicker = ({ type }, selectedDate) => {
    if (type === "set") {
      const currentDate = selectedDate || prev.date;
      setState(prev => ({
        ...prev,
        date: currentDate,
        dateOfBirth: currentDate.toISOString().split('T')[0],
        showPicker: Platform.OS === 'ios' // Keep open on iOS, close on Android
      }));
    } else {
      setState(prev => ({ ...prev, showPicker: false }));
    }
  };

  const navigateToLogin = () => {
    navigation.navigate("Login");
  };

  const isValidEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const isValidPassword = (password) => {
    const errors = {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      number: /\d/.test(password),
    };

    const isValid = Object.values(errors).every((valid) => valid);

    return { isValid, errors };
  };

  const handleSignUp = async () => {
    const passwordValidation = isValidPassword(state.password);
    if (new Date(state.dateOfBirth) > new Date()) {
      setState((prev) => ({ ...prev, dateofbirthError: "Date of birth cannot be in the future" }));
    } else if (!state.fullname.trim()) {
      setState((prev) => ({ ...prev, fullnameError: "FullName is required!" }));
    } else if (!state.email.trim()) {
      setState((prev) => ({ ...prev, emailError: "Email is required!" }));
      return;
    } else if (!isValidEmail(state.email)) {
      setState((prev) => ({ ...prev, emailError: "Invalid email address!" }));
      return;
    } else if (!state.password.trim()) {
      setState((prev) => ({ ...prev, passwordError: "Password is required" }));
      return;
    } else if (!passwordValidation.isValid) {
      let errorMessage = "";

      if (!passwordValidation.errors.minLength) {
        errorMessage += "Password must be at least 8 characters long.\n";
      }
      if (!passwordValidation.errors.uppercase) {
        errorMessage +=
          "Password must contain at least one uppercase letter.\n";
      }
      if (!passwordValidation.errors.lowercase) {
        errorMessage +=
          "Password must contain at least one lowercase letter.\n";
      }
      if (!passwordValidation.errors.symbol) {
        errorMessage += "Password must contain at least one symbol.\n";
      }
      if (!passwordValidation.errors.number) {
        errorMessage += "Password must contain at least one number.\n";
      }

      setState((prev) => ({ ...prev, passwordError: errorMessage }));

      return;
    } else if (state.password !== state.confirmPassword) {
      setState((prev) => ({ ...prev, confirmpasswordError: "Passwords do not match!" }));
      return;
    } else if (!state.isChecked) {
      setState((prev) => ({ ...prev, termspolicyError: "Please accept the Terms of Services and Privacy Policy!" }));
      return;
    } else {
      setState((prev) => ({ ...prev, confirmpasswordError: "", termspolicyError: "" }));
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await AuthService.signUp({
        fullname: state.fullname,
        dateOfBirth: new Date(state.dateOfBirth),
        email: state.email,
        password: state.password,
        role: "65d6717f31baa16064d291dc",
        residentId: state.residentId,
      });
      console.log("Sign-up successful:", response.data);
      navigation.navigate("Verify email", { email: state.email });
    } catch (error) {
      if (error.response) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          const errorMessage = error.response.data.error;
          console.log(errorMessage);
          if (errorMessage === "User already exists") {
            setState((prev) => ({ ...prev, emailError: "User already exists" }));
          }
        }
      } else {
        console.error("Error signing up:", error);
      }
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return {
    state: baseState,
    setState,
    t,
    isConnected,
    changeLanguage,
    isValidEmail,
    handleSignUp,
    toggleCheckbox,
    toggleTermsModal,
    togglePrivacyPolicyModal,
    toggleShowPassword,
    toggleShowConfirmPassword,
    toggleDatePicker,
    onchangeDatePicker,
    navigateToLogin,
  };
};