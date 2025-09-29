import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  BackHandler,
  Image,
  Modal,
  Pressable,
  FlatList,
  Dimensions,
  ImageBackground
} from "react-native";
import Colors from "../../../assets/Colors";
import i18n from '../../../i18n'
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Termsofservices from "../../components/pupUps/Termsofservices";
import PrivacyPolicy from "../../components/pupUps/PrivacyPolicy";

import { APP_ENV } from "../../../src/utils/BaseUrl";
import { useTranslation } from "react-i18next";
import Axios from "axios";
import { Picker } from '@react-native-picker/picker';

const SignUp = () => {
  const navigation = useNavigation();
  const [isChecked, setIsChecked] = useState(false);
  const [role, setRole] = useState("65d6717f31baa16064d291dc");
  const [email, setEmail] = useState("");
  const [fullname, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [residentId, setResidentId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullnameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmpasswordError, setConfirmPasswordError] = useState("");
  const [termspolicyError, setTermsPolicyError] = useState("");
  const [isTermsModalVisible, setTermsModalVisible] = useState(false);
  const [isPrivacyPolicyModalVisible, setPrivacyPolicyModalVisible] =
    useState(false);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [authToken, setAuthToken] = useState('eyJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE3NDU1MjM3NDMsImV4cCI6MTc1MDcwNzc0M30.lYAhJCya5jUvhMTigBRVpXwCrzHZ34e8cC1WgudKIkn80Bph0fiTl0ttpeHVwvWVOpT1udpLHwU-itVbz34zEQ'); // Your hardcoded token
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const { width, height } = Dimensions.get('window');
  //////////////////////////////////////////////Language//////////////////////////////////////
 const inputStyles = {
    height: 50, // Set your desired height here
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    width: "92%",
    marginLeft: "4%",
    marginTop: 5,
  };
const languages = [
  { code: 'en', name: 'English', flag: require('../../../assets/flags/enFlag.png') },
  { code: 'fr', name: 'Français', flag: require('../../../assets/flags/FranceFlag.png') },
  { code: 'es', name: 'Español', flag: require('../../../assets/flags/SpainFlag.png') },
  { code: 'ar', name: 'العربية', flag: require('../../../assets/flags/ArFlag.png') },
  { code: 'pr', name: 'Portuguese', flag: require('../../../assets/flags/portugalFlag.png') },
  { code: 'al', name: 'German', flag: require('../../../assets/flags/GermanyFlag.png') },
];
  /////////////////////////////////////////////////////////////////
  useEffect(() => {
    const backAction = () => {
      navigation.navigate("Login");
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setIsLoadingCommunities(true);
        const response = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/community/findAll`);
        setCommunities(response.data);


      } catch (error) {
        setCommunityError('Failed to load communities');
        console.error('Error fetching communities:', error);
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    fetchCommunities();
  }, []);


  //////////////////////////////////////////////////////////////////
  const togglePrivacyPolicyModal = () => {
    setPrivacyPolicyModalVisible(!isPrivacyPolicyModalVisible);
  };
  //////////////////////////////////////////////////////////////////
  const toggleTermsModal = () => {
    setTermsModalVisible(!isTermsModalVisible);
  };
  /////////////////////////////////////////////////////////////////
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  //////////////////////////////////////////////////////////////////
  const toggleCheckbox = () => {
    setIsChecked(!isChecked);
  };
  const navigateToLogin = () => {
    navigation.navigate("Login");
  };
  /////////////////////////////////////////////////////////////////
  const isValidEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };
  //////////////////////////////////////////////////////////////////
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
  /////////////////////////////////////////////////////////////////////
  const handleSignUp = async () => {
    // Clear all previous errors
    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setTermsPolicyError("");
    setCommunityError("");
    
    const passwordValidation = isValidPassword(password);
    if (!fullname.trim()) {
      setFullNameError(t("FullName is required!"));
      return;
    } else if (!email.trim()) {
      setEmailError(t("Email is required!"));
      return;
    } else if (!isValidEmail(email)) {
      setEmailError(t("Invalid email address"));
      return;
    } else if (!selectedCommunity || selectedCommunity === '') {
      setCommunityError(t("Please select a community!"));
      return;
    } else if (!password.trim()) {
      setPasswordError(t("Password is required"));
      return;
    } else if (!passwordValidation.isValid) {
      let errorMessage = "";

      if (!passwordValidation.errors.minLength) {
        errorMessage += t("Password must be at least 8 characters long.") + "\n";
      }
      if (!passwordValidation.errors.uppercase) {
        errorMessage += t("Password must contain at least one uppercase letter.") + "\n";
      }
      if (!passwordValidation.errors.lowercase) {
        errorMessage += t("Password must contain at least one lowercase letter.") + "\n";
      }
      if (!passwordValidation.errors.symbol) {
        errorMessage += t("Password must contain at least one symbol.") + "\n";
      }
      if (!passwordValidation.errors.number) {
        errorMessage += t("Password must contain at least one number.") + "\n";
      }

      setPasswordError(errorMessage);

      return;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t("Passwords do not match!"));
      return;
    } else if (!isChecked) {
      setTermsPolicyError(
        t("Please accept the Terms of Services and Privacy Policy!")
      );
      return;
    } else {
      setConfirmPasswordError("");
      setTermsPolicyError("");
    }

    setIsLoading(true);

    try {

      const response = await Axios.post(`${APP_ENV.AUTH_PORT}/tawasalna-user/auth/signup`, {
        fullname,
        email,
        password,
        role,
        residentId,
        communityId:selectedCommunity
      });
     // const userResponse = await Axios.get(`${APP_ENV.AUTH_PORT}/tawasalna-user/auth/users/email/${email}`);
   
     console.log("Sign-up successful:",response);


//       const AddUserToCommunity = await Axios.put(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/community/${selectedCommunity}/userAdd/${userResponse.data}`
//         , null, {
//         headers: {
//           Authorization: `Bearer ${authToken}`,
//           "Content-Type": "application/json"
//         }
//       }
//       );
//console.log(`responce of the addcommunity ${AddUserToCommunity}`)



    // const userId = userResponse.data._id || userResponse.data.id;


      navigation.navigate("Verify email", { email }); // Pass userId if needed
    } catch (error) {
    //  console.error('Error during sign-up or fetching user:', error);
      if (error.response) {
if (error.response.data.error==="User already exists"){
  setEmailError(t("Email is already used try another one"));
}
        console.log('Error response data:', error.response.data);
        console.log('Error status:', error.response.status);
        // Handle specific errors from GET request
        if (error.response.status === 404) {
          console.log('User not found after sign-up');
        }

      } else {
        console.error("Error signing up:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const changeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
    setShowLanguagePicker(false);
  };




  return (
    <ImageBackground
      source={require('../../../assets/ImgBackGoung.jpg')}
      style={{ flex: 1, resizeMode: 'cover' }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        {/* Header with back arrow */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Create Account')}</Text>
          <View style={styles.placeholder} />
        </View>
        
        <ScrollView style={{ marginTop: 0 }}>
          <View style={{ marginTop: 0 }}>
            <TouchableOpacity
              style={styles.languageSelector}
              onPress={() => setShowLanguagePicker(!showLanguagePicker)}
            >
              <Image source={require('../../../assets/Icons/earth2.png')} style={styles.earthIcon} />
            </TouchableOpacity>
            {/* Language Picker Modal */}
            {showLanguagePicker && (
              <Modal
                transparent={true}
                visible={showLanguagePicker}
                onRequestClose={() => setShowLanguagePicker(false)}
              >
                <Pressable 
                  style={styles.modalOverlay} 
                  onPress={() => setShowLanguagePicker(false)}
                >
                  <View style={styles.languageListContainer}>
                    <FlatList
                      data={languages}
                      keyExtractor={(item) => item.code}
                      renderItem={({ item }) => (
                        <Pressable
                          style={styles.languageItem}
                          onPress={() => {
                            changeLanguage(item.code);
                            setShowLanguagePicker(false);
                          }}
                        >
                          <Image source={item.flag} style={styles.flagIcon} />
                          <Text style={styles.languageText}>{item.name}</Text>
                        </Pressable>
                      )}
                    />
                  </View>
                </Pressable>
              </Modal>
            )}
            <View style={{
              flexDirection: 'column',
              alignItems: 'flex-start',
             width:width*1,
              marginBottom: height * 0.015,
              marginTop: 0
            }}>
          
              <Text style={{
                fontSize: width * 0.1,
                fontWeight: 'bold',
                color: Colors.WHITE,
                textShadowColor: Colors.LIGHT_PURPLE,
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 20,
                letterSpacing: 5,
                marginLeft: width * 0.025,
                marginTop: height * 0.025,
                marginBottom: height * 0.070
              }}>{t('Register here')}</Text>
            </View>
            {isLoading && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
              >
                <ActivityIndicator size="large" color={Colors.PURPLE} />
              </View>
            )}
          </View>
          <View style={{ marginTop: -height * 0.07 }}>
            {/* FullName Label */}
            <Text style={{
              marginLeft: width * 0.04,
              fontSize: width * 0.045,
              color: Colors.WHITE,
              textShadowColor: Colors.LIGHT_PURPLE,
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 7,
            }}>
              {t("FullName")}
              <Text style={{ color: fullname.trim() ? "white" : "red" }}>*</Text>
            </Text>
            {/* FullName Input */}
            <View
              style={{
                borderColor: fullnameError ? "red" : "gray",
                borderWidth: 1,
                borderRadius: 12,
                padding: 8,
                marginBottom: 10,
                width: width * 0.92,
                marginLeft: width * 0.04,
                marginTop: 5,
                backgroundColor: '#F7F7F7',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <TextInput
                placeholder={t("Enter your Full Name")}
                autoCapitalize="words"
                autoCompleteType="name"
                autoCorrect={false}
                value={fullname}
                onChangeText={(text) => {
                  setFullName(text);
                  if (text.trim()) {
                    setFullNameError("");
                  }
                }}
                style={{ fontSize: width * 0.045 }}
              />
            </View>
            {fullnameError ? (
              <Text style={{ color: "red", marginLeft: width * 0.07 }}>
                {fullnameError}
              </Text>
            ) : null}
            {/* Email Label */}
            <Text style={{
              marginLeft: width * 0.04,
              fontSize: width * 0.045,
              color: Colors.WHITE,
              textShadowColor: Colors.LIGHT_PURPLE,
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 7,
            }}>
              {t("Email")}
              <Text style={{ color: email.trim() ? "white" : "red" }}>*</Text>
            </Text>
            {/* Email Input */}
            <View
              style={{
                borderColor: emailError ? "red" : "gray",
                borderWidth: 1,
                borderRadius: 12,
                padding: 8,
                marginBottom: 10,
                width: width * 0.92,
                marginLeft: width * 0.04,
                marginTop: 5,
                backgroundColor: '#F7F7F7',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <TextInput
                placeholder={t("Enter your email address")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCompleteType="email"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (text.trim()) {
                    setEmailError("");
                  }
                }}
                style={{ fontSize: width * 0.045 }}
              />
            </View>
            {emailError || (!isValidEmail(email) && email.trim().length > 0) ? (
              <Text style={{ color: "red", marginLeft: width * 0.07 }}>
                {emailError || t("Invalid email address")}
              </Text>
            ) : null}
            {/* Password Label */}
            <Text style={{
              marginLeft: width * 0.04,
              fontSize: width * 0.045,
              color: Colors.WHITE,
              textShadowColor: Colors.LIGHT_PURPLE,
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 7,
            }}>
              {t("Password")}
              <Text style={{ color: password.trim() ? "white" : "red" }}>*</Text>
            </Text>
            {/* Password Input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderColor: passwordError ? "red" : "gray",
                borderWidth: 1,
                borderRadius: 12,
                padding: 8,
                marginBottom: 10,
                width: width * 0.92,
                marginLeft: width * 0.04,
                marginTop: 5,
                backgroundColor: '#F7F7F7',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <TextInput
                placeholder={t('Password')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCompleteType="password"
                autoCorrect={false}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  // Real-time validation for confirm password matching
                  if (confirmPassword.length > 0) {
                    if (text === confirmPassword) {
                      setConfirmPasswordError("");
                    } else {
                      setConfirmPasswordError(t("Passwords do not match!"));
                    }
                  }
                  
                  // Password strength validation
                  const passwordValidation = isValidPassword(text);
                  let errorMessage = "";
                  if (!text.trim()) {
                    errorMessage = t("Password is required");
                  } else if (!passwordValidation.errors.minLength) {
                    errorMessage =
                      t("Password must be at least 8 characters long.") + "\n";
                  } else if (!passwordValidation.errors.uppercase) {
                    errorMessage +=
                      t("Password must contain at least one uppercase letter.") + "\n";
                  } else if (!passwordValidation.errors.lowercase) {
                    errorMessage +=
                      t("Password must contain at least one lowercase letter.") + "\n";
                  } else if (!passwordValidation.errors.symbol) {
                    errorMessage +=
                      t("Password must contain at least one symbol(?,!,...).") + "\n";
                  } else if (!passwordValidation.errors.number) {
                    errorMessage +=
                      t("Password must contain at least one number.") + "\n";
                  }
                  setPasswordError(errorMessage);
                }}
                style={{ flex: 1, fontSize: width * 0.045 }}
              />
              <TouchableOpacity onPress={toggleShowPassword}>
                <MaterialCommunityIcons
                  name={showPassword ? "eye" : "eye-off"}
                  size={24}
                  color="black"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={{ color: "red", marginLeft: width * 0.07 }}>
                {passwordError}
              </Text>
            ) : null}
            {/* Confirm Password Label */}
            <Text style={{
              marginLeft: width * 0.04,
              fontSize: width * 0.045,
              color: Colors.WHITE,
              textShadowColor: Colors.LIGHT_PURPLE,
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 7,
            }}>
              {t("Confirm your password")}
              <Text style={{ color: confirmPassword.trim() ? "white" : "red" }}>*</Text>
            </Text>
            {/* Confirm Password Input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderColor:
                  confirmpasswordError ||
                  (confirmPassword.trim() && password !== confirmPassword)
                    ? "red"
                    : "gray",
                borderWidth: 1,
                borderRadius: 12,
                padding: 8,
                marginBottom: 10,
                width: width * 0.92,
                marginLeft: width * 0.04,
                marginTop: 5,
                backgroundColor: '#F7F7F7',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <TextInput
                placeholder={t('Confirm your password')}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCompleteType="password"
                autoCorrect={false}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  // Real-time validation - clear error immediately when passwords match
                  if (text === password) {
                    setConfirmPasswordError("");
                  } else if (text.length > 0 && password.length > 0) {
                    // Show error in real-time if both fields have content and don't match
                    setConfirmPasswordError(t("Passwords do not match!"));
                  }
                }}
                style={{ flex: 1, fontSize: width * 0.045 }}
              />
              <TouchableOpacity onPress={toggleShowConfirmPassword}>
                <MaterialCommunityIcons
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={24}
                  color="black"
                />
              </TouchableOpacity>
            </View>
            {confirmpasswordError ? (
              <Text style={{ color: "red", marginLeft: width * 0.07 }}>
                {confirmpasswordError}
              </Text>
            ) : null}
            {/* Community Label */}
            <View style={{ marginLeft: width * 0.04 }}>
              <Text style={{
                marginBottom: 5,
                fontSize: width * 0.045,
                color: Colors.WHITE,
                textShadowColor: Colors.LIGHT_PURPLE,
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 7,
              }}>
                {t("Community")}
                <Text style={{ color: "red" }}>*</Text>
              </Text>
              <View
                style={{
                  borderWidth: 1,
                  borderRadius: 12,
                  borderColor: communityError ? 'red' : 'gray',
                  width: width * 0.92,
                  marginBottom: 1,
                  backgroundColor: '#F7F7F7',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                {isLoadingCommunities ? (
                  <ActivityIndicator size="small" color={Colors.PURPLE} />
                ) : (
                  <Picker
                    selectedValue={selectedCommunity}
                    onValueChange={(itemValue) => {
                      setSelectedCommunity(itemValue);
                      setCommunityError('');
                    }}
                    style={{ color: Colors.BLACK, fontSize: width * 0.045 }}
                  >
                    <Picker.Item label={t("Select a community")} value="" />
                    {communities.map((community) => (
                      <Picker.Item
                        key={community.id}
                        label={community.name}
                        value={community.id}
                      />
                    ))}
                  </Picker>
                )}
              </View>
              {communityError && (
                <Text style={{ color: 'red', marginLeft: width * 0.03 }}>{communityError}</Text>
              )}
            </View>
            {/* Resident ID Label */}
            <Text style={{
              marginLeft: width * 0.04,
              marginTop: 10,
              fontSize: width * 0.045,
              color: Colors.WHITE,
              textShadowColor: Colors.LIGHT_PURPLE,
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 7,
            }}>{t("Your ID")}</Text>
            {/* Resident ID Input */}
            <View
              style={{
                borderColor: "gray",
                borderWidth: 1,
                borderRadius: 12,
                padding: 8,
                marginBottom: 10,
                width: width * 0.92,
                marginLeft: width * 0.04,
                marginTop: 5,
                backgroundColor: '#F7F7F7',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <TextInput
                placeholder={t('Enter your ID number')}
                autoCapitalize="none"
                autoCorrect={false}
                value={residentId}
                onChangeText={setResidentId}
                style={{ fontSize: width * 0.045 }}
              />
            </View>
          </View>
          {/* Checkbox and Terms */}
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              marginLeft: width * 0.02,
              marginTop: height * 0.03,
            }}
          >
            <TouchableOpacity
              style={{ marginLeft: width * 0.02 }}
              onPress={toggleCheckbox}
            >
              <MaterialIcons
                name={isChecked ? "check-box" : "check-box-outline-blank"}
                size={22}
                color={isChecked ? "green" : "white"}
              />
            </TouchableOpacity>
            <Text style={{ fontSize: width * 0.04, marginLeft: 10, color: Colors.WHITE }}>{t("I accept the")} </Text>
            <TouchableOpacity onPress={toggleTermsModal}>
              <Text
                style={{
                  fontSize: width * 0.040,
                  color: Colors.WHITE,
                  textShadowColor: Colors.LIGHT_PURPLE,
                  textShadowOffset: { width: 2, height: 2 },
                  textShadowRadius: 7,
                }}
              >
                {t("Terms of Services")}
              </Text>
            </TouchableOpacity>
            <Termsofservices
              isVisible={isTermsModalVisible}
              onClose={toggleTermsModal}
            />
            <Text style={{ fontSize: width * 0.04, color: Colors.WHITE }}> {t("and")} </Text>
          </View>
          <TouchableOpacity onPress={togglePrivacyPolicyModal}>
            <Text
              style={{
                fontSize: width * 0.040,
                color: Colors.WHITE,
                textShadowColor: Colors.LIGHT_PURPLE,
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 7,
                marginLeft:width*0.125
              }}
            >
              {t("Privacy Policy.")}
            </Text>
          </TouchableOpacity>
          <PrivacyPolicy
            isVisible={isPrivacyPolicyModalVisible}
            onClose={togglePrivacyPolicyModal}
          />
          {!isChecked && (
            <Text style={{ color: "red", marginLeft: width * 0.07 }}>
              {termspolicyError}
            </Text>
          )}
          {/* Submit Button */}
          <View>
            <TouchableOpacity
              onPress={handleSignUp}
              style={{
                borderRadius: width * 0.03,
                padding: width * 0.03,
                marginBottom: height * 0.03,
                alignSelf: 'center',
                alignItems: 'center',
                backgroundColor: Colors.LIGHT_PURPLE,
                width: width * 0.92,
                marginLeft: width * 0.01,
                marginTop: height * 0.05,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: width * 0.05, fontWeight: 'bold' }}>{t("Submit")}</Text>
            </TouchableOpacity>
          </View>
          {/* Already have an account? */}
          <View
            style={{
              flexDirection: "row",
              marginLeft: width * 0.28,
              marginTop: height * 0.05,
              marginBottom: height * 0.03
            }}
          >
            <Text style={{ alignItems: "center", fontSize: width * 0.04, color: Colors.WHITE }}>
              {t("Already have an account?")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={navigateToLogin}
            style={{ alignItems: "center" }}
          >
            <Text style={{ color: Colors.WHITE, marginLeft: width * 0.05, marginBottom: height * 0.1, fontSize: width * 0.04 }}>
              {t("Login now!")}
            </Text>
          </TouchableOpacity>

          {/* Copyright Notice */}
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: height * 0.05,
              marginBottom: height * 0.05,
            }}
          >
            <Text style={{ color: 'gray', fontSize: width * 0.035 }}>
              © {new Date().getUTCFullYear()} - {t('Tawasalna - All Rights Reserved.')}
            </Text>
          </View>
        </ScrollView>
        {isLoading && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <ActivityIndicator size="large" color={Colors.PURPLE} />
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};
const styles = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.WHITE,
    textAlign: 'center',
    marginHorizontal: 16,
    textShadowColor: Colors.LIGHT_PURPLE,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  placeholder: {
    width: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  languageListContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  flagIcon: {
    width: 30,
    height: 20,
    marginRight: 15,
    borderRadius: 3,
  },
  languageText: {
    fontSize: 16,
  },
  languageSelector: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  earthIcon: {
    width: 30,
    height: 30,
  },
  languagePicker: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: Colors.WHITE,
    borderRadius: 5,
    elevation: 3,
    zIndex: 1000,
    width: 150,
  },
};

const socialStyles = {
  container: {
    backgroundColor: Colors.WHITE,
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '5%',
  },
  icon: {
    width: 45,
    height: 45,
  },
};
export default SignUp;
