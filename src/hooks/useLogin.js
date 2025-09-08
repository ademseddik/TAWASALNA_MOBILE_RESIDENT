import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { UserStorage } from '../storage/userStorage';
import { useTranslation } from 'react-i18next';
import { useNetworkMonitor } from './useNetworkMonitor';

export const useLogin = () => {

  const navigation = useNavigation();
  const { t } = useTranslation();
  const isConnected = useNetworkMonitor();
  const [state, setState] = useState({ 
    email: '',
    password: '',
    showPassword: false,
    isChecked: false,
    isLoading: false,
    isConnected: true,
    errors: {},
    emailTouched: false,
    passwordTouched: false
  });



  // Remember me check
  useEffect(() => {
    const checkRememberMe = async () => {
      const rememberMe = await AsyncStorage.getItem("RememberMe");
      
      if (rememberMe === "true") {
        const [userId, token, timestamp] = await Promise.all([
          AsyncStorage.getItem("userId"),
          AsyncStorage.getItem("USER_ACCESS"),
          AsyncStorage.getItem("lastLoginTimestamp")
        ]);

        if (userId && token && timestamp) {
         // console.log("user id "+userId)
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - parseInt(timestamp) < sevenDays) {
            navigation.navigate("TABBAR");
          }
        }
      }
    };
    checkRememberMe();
  }, []);

  
  // Form validation
  const validateForm = () => {
    const errors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!state.email.trim()) errors.email = t("Email is required!");
    else if (!emailPattern.test(state.email)) errors.email = t("Email doesn't exist!");
    if (!state.password.trim()) errors.password = t("Password is required!");

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  // Login handler
  const handleLogin = async () => {
    console.log("Login button clicked");
    if (!validateForm()) return;
   
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Ensure no stale tokens are attached to signin request
      try { await AsyncStorage.multiRemove(["USER_ACCESS", "USER_REFRESH"]); } catch (e) {}
      
      const response = await AuthService.login({
        email: state.email,
        password: state.password,
      });
      console.log(response)
      const hasRequiredRole = Array.isArray(response?.roles)
        ? response.roles.includes("ROLE_COMMUNITY_MEMBER")
        : true; // If roles not present, proceed
      if (!hasRequiredRole) {
        setState(prev => ({ ...prev, isLoading: false, errors: { general: t("Unauthorized access: Invalid user role") } }));
        await AsyncStorage.clear();
        return;
      }
      await UserStorage.saveAuth({
        rememberMe: state.isChecked,
        email: state.email,
        userId: response.id,
        refreshToken: response.refreshToken,
        token: response.token,
      });
      // Stop loading and navigate immediately
      setState(prev => ({ ...prev, isLoading: false }));
      navigation.navigate("TABBAR");

      // Fire-and-forget: fetch resident profile in background (do not block UI)
      ProfileService.GetProfileData({ userId: response.id, token: response.token })
        .then(async (profile) => {
          const username = profile?.fullName || profile?.username || '';
          const image = profile?.profilephoto || '';
          await UserStorage.saveProfileBasics({ username, image });
        })
        .catch((e) => {
          console.log('Failed to fetch/store resident profile after login', e);
        })
        .finally(async () => {
          try {
            const stored = await UserStorage.getAll();
            console.log('Stored user info after login:', stored);
          } catch (e) {
            console.log('Failed to read stored user info', e);
          }
        });
    } catch (error) {
      handleLoginError(error);
    } finally {
      // isLoading already turned off above on success; ensure it turns off on errors too
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Error handling
  const handleLoginError = async (error) => {
    const errorMessage = error.response?.data?.error || '';
    const errors = {};

    switch (errorMessage) {
      case 'UNAUTHORIZED_ROLE':
        errors.general = t("Unauthorized access: Invalid user role");
        await AsyncStorage.clear(); // Clear any partial storage
        break;
      case 'User not found':
        errors.general = t("User not found");
        break;
      case 'User account disabled':
        errors.general = t("User account disabled");
        navigation.navigate("Verify your account", { email: state.email });
        break;
      case 'Invalid credentials':
        errors.password = t("Invalid credentials");
        handleInvalidCredentials();
        break;
      default:
        errors.general = t("Login failed. Please try again.");

    }

    setState(prev => ({ ...prev, errors }));
  };

  const handleInvalidCredentials = async () => {
    const attempts = parseInt(await AsyncStorage.getItem("loginAttempts")) || 0;
    await AsyncStorage.setItem("loginAttempts", (attempts + 1).toString());
    if (attempts >= 2) navigation.navigate("Forgot Password");
  };
  const handleLanguageChange = async (lng) => {
    try {
      await i18n.changeLanguage(lng);
      await AsyncStorage.setItem('Applanguage', lng);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };
  return {
    ...state,
    isConnected,
    handleLanguageChange,
    t,
    setState: (update) => setState(prev => ({ ...prev, ...update })),
    handleLogin,
    handleEmailChange: (text) => setState(prev => ({
      ...prev,
      email: text,
      emailTouched: true,
      errors: { ...prev.errors, email: '' }
    })),
    handlePasswordChange: (text) => setState(prev => ({
      ...prev,
      password: text,
      passwordTouched: true,
      errors: { ...prev.errors, password: '' }
    })),
    toggleCheckbox: () => setState(prev => ({ ...prev, isChecked: !prev.isChecked })),
    toggleShowPassword: () => setState(prev => ({ ...prev, showPassword: !prev.showPassword })),
    handleSignUp: () => navigation.navigate("Sign up"),
    handleForgotPassword: () => navigation.navigate("Forgot Password")
  };
};