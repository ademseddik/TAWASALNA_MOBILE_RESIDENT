import { useState, useRef,useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthService } from '../services/auth.service';
import { useTranslation } from 'react-i18next';
import { useNetworkMonitor } from './useNetworkMonitor';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useVerifyAccount = () => {
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
    codeError: "",
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
    // Prevent input when code is expired
    if (isExpired) {
      return;
    }
    
    const newCode = [...state.code];
    
    // Handle backspace/delete
    if (text === "") {
      // If current field is empty and user presses backspace, go to previous field
      if (newCode[index] === "" && index > 0) {
        codeInputRefs.current[index - 1]?.focus();
        return;
      }
      // Clear current field
      newCode[index] = "";
    } else {
      // Handle new input
      newCode[index] = text;
      
      // Auto-focus next field if not the last one
      if (index < 5 && text !== "") {
        codeInputRefs.current[index + 1]?.focus();
      }
    }
    
    setState((prev) => ({ ...prev, code: newCode, codeError: "" }));

    // Auto-verify when all fields are filled
    if (index === 5 && newCode.every((item) => item !== "")) {
      await verifyCode(newCode.join(""));
    }
  };

  const verifyCode = async (enteredCode) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await AuthService.VerifyEmail({
        email: state.email,
        code: enteredCode,
      });
    
      await AsyncStorage.setItem("CodeFromEnterCode", enteredCode);
      navigation.navigate("Login");
    } catch (error) {
      setState((prev) => ({
        ...prev,
        codeError: t("Failed to verify account. Please try again."),
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleResendCode = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await AuthService.ResendCode({ email: state.email });
      // Restart timer and re-enable inputs
      setTimeLeft(120); // Reset to 2 minutes
      setIsExpired(false);
      // Clear the code inputs
      setState((prev) => ({ ...prev, code: ["", "", "", "", "", ""], codeError: "" }));
      // Focus on first input
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 100);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        codeError: t("Failed to resend code. Please try again."),
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
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
    setState: (update) => setState((prev) => ({ ...prev, ...update })),
  };
};