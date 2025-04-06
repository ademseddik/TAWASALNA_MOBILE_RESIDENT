import { useState, useRef,useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from '../services/auth.service';
import { useTranslation } from 'react-i18next';
import { useNetworkMonitor } from './useNetworkMonitor';

export const useEnterCode = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const isConnected = useNetworkMonitor();
  const [timeLeft, setTimeLeft] = useState(120); // 15 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef(null);

  
  const codeInputRefs = useRef([]);
  const [state, setState] = useState({
    code: ["", "", "", "", "", ""],
    email: route.params?.email || "",
    isLoading: false,
    codeError: ""
  });

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsExpired(true);
            //navigation.navigate("Login");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [timeLeft, navigation]);

  const handleCodeChange = async (text, index) => {
    const newCode = [...state.code];
    newCode[index] = text;
    
    setState(prev => ({
      ...prev,
      code: newCode,
      codeError: ""
    }));

    if (index === 5 && newCode.every(item => item !== "")) {
      await verifyCode(newCode.join(""));
    } else if (text !== "") {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const verifyCode = async (enteredCode) => {

    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await AuthService.verifyCode({
        email: state.email,
        code: enteredCode
      });

      console.log("jawna fesfes",response)
    
      await AsyncStorage.setItem("CodeFromEnterCode", enteredCode);
      navigation.navigate("Reset your password", { email: state.email });
    } catch (error) {
      handleVerificationError(error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleVerificationError = (error) => {
    const errorMessage = error.response?.data?.error || '';
    if (errorMessage === "Code Expired") {
      setState(prev => ({ ...prev, codeError: t("Code Expired") }));
    }
  };

  const handleResendCode = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await AuthService.resetcode({ email: state.email });
      setTimeLeft(120);
      setIsExpired(false);
      setState(prev => ({
        ...prev,
        code: ["", "", "", "", "", ""],
        codeError: ""
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        codeError: t("Failed to resend code")
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    ...state,
    t,
    isConnected,
    timeLeft: formatTime(timeLeft),
    isExpired,
    codeInputRefs,
    handleCodeChange,
    handleResendCode,
    setState: (update) => setState(prev => ({ ...prev, ...update }))
  };
};