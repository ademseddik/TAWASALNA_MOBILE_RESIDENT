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
  FlatList
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
    const passwordValidation = isValidPassword(password);
if (!fullname.trim()) {
      setFullNameError("FullName is required!");
    } else if (!email.trim()) {
      setEmailError("Email is required!");
      return;
    } else if (!isValidEmail(email)) {
      setEmailError("Invalid email address!");
      return;
    } else if (!password.trim()) {
      setPasswordError("Password is required");
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

      setPasswordError(errorMessage);

      return;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match!");
      return;
    } else if (!isChecked) {
      setTermsPolicyError(
        "Please accept the Terms of Services and Privacy Policy!"
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
// console.log(`responce of the addcommunity ${AddUserToCommunity}`)



    // const userId = userResponse.data._id || userResponse.data.id;


      navigation.navigate("Verify email", { email }); // Pass userId if needed
    } catch (error) {
    //  console.error('Error during sign-up or fetching user:', error);
      if (error.response) {
if (error.response.data.error==="User already exists"){
  setEmailError("Email is already used try another one ");
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
    <SafeAreaView style={{ backgroundColor: Colors.WHITE, flex: 1 }}>
      <ScrollView style={{ marginTop: "0%" }}>
          <View style={{ marginTop: '0%' }}>
                <TouchableOpacity
                  style={styles.languageSelector}
                  onPress={() => setShowLanguagePicker(!showLanguagePicker)}
                >
                  <Image source={require('../../../assets/Icons/earth2.png')} style={styles.earthIcon} />
                </TouchableOpacity>
        
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
          marginLeft: '5%',
          marginBottom: 20,
          marginTop:10
        }}>
              <View style={{
        width: 384, height: 70,
        marginLeft:-19,
        backgroundColor:Colors.PURPLE,
        paddingLeft:10,
        top:-10
   
        }}>
          <Image
            source={require('../../../assets/Icons/TawasalnaLogoW1.png')}
            style={{ width: 150, height: 50, marginRight: 15 ,top:10}} // adjust size as needed
            resizeMode="contain"
          />
          </View>
          <Text style={{ fontSize: 50, fontWeight: 'bold' }}>{t('Register here')}</Text>
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
        <View style={{ marginTop: 0 }}>
          <Text style={{ marginLeft: "4%" }}>
            {t("FullName")}
            <Text style={{ color: fullname.trim() ? "black" : "red" }}>*</Text>
          </Text>
          <View
            style={{
              borderColor: fullnameError ? "red" : "gray",
              borderWidth: 1,
              borderRadius: 8,
              padding: 8,
              marginBottom: 10,
              width: "92%",
              marginLeft: "4%",
              marginTop: 5,
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
            />
          </View>
          {fullnameError ? (
            <Text style={{ color: "red", marginLeft: "7%" }}>
              {fullnameError}
            </Text>
          ) : null}


          <Text style={{ marginLeft: "4%" }}>
            {t("Email")}
            <Text style={{ color: email.trim() ? "black" : "red" }}>*</Text>
          </Text>

          <View
            style={{
              borderColor: emailError ? "red" : "gray",
              borderWidth: 1,
              borderRadius: 8,
              padding: 8,
              marginBottom: 10,
              width: "92%",
              marginLeft: "4%",
              marginTop: 5,
            }}
          >
            <TextInput
              placeholder={t("Enter your email address...")}
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
            />
          </View>
          {emailError || (!isValidEmail(email) && email.trim().length > 0) ? (
            <Text style={{ color: "red", marginLeft: "7%" }}>
              {emailError || "Invalid email address"}
            </Text>
          ) : null}

          <Text style={{ marginLeft: "4%" }}>
            {t("Password")}
            <Text style={{ color: password.trim() ? "black" : "red" }}>*</Text>
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderColor: passwordError ? "red" : "gray",
              borderWidth: 1,
              borderRadius: 8,
              padding: 8,
              marginBottom: 10,
              width: "92%",
              marginLeft: "4%",
              marginTop: 5,
            }}
          >
            <TextInput
              placeholder="*********"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCompleteType="password"
              autoCorrect={false}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                const passwordValidation = isValidPassword(text);
                let errorMessage = "";
                if (!text.trim()) {
                  errorMessage = "Password is required";
                } else if (!passwordValidation.errors.minLength) {
                  errorMessage =
                    "Password must be at least 8 characters long.\n";
                } else if (!passwordValidation.errors.uppercase) {
                  errorMessage +=
                    "Password must contain at least one uppercase letter.\n";
                } else if (!passwordValidation.errors.lowercase) {
                  errorMessage +=
                    "Password must contain at least one lowercase letter.\n";
                } else if (!passwordValidation.errors.symbol) {
                  errorMessage +=
                    "Password must contain at least one symbol(?,!,...).\n";
                } else if (!passwordValidation.errors.number) {
                  errorMessage +=
                    "Password must contain at least one number.\n";
                }
                setPasswordError(errorMessage);
              }}
              style={{ flex: 1 }}
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
            <Text style={{ color: "red", marginLeft: "7%" }}>
              {passwordError}
            </Text>
          ) : null}
          <Text style={{ marginLeft: "4%" }}>
            {t("Confirm your password")}
            <Text style={{ color: confirmPassword.trim() ? "black" : "red" }}>
              *
            </Text>
          </Text>
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
              borderRadius: 8,
              padding: 8,
              marginBottom: 10,
              width: "92%",
              marginLeft: "4%",
              marginTop: 5,
            }}
          >
            <TextInput
              placeholder="*********"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCompleteType="password"
              autoCorrect={false}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={{ flex: 1 }}
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
            <Text style={{ color: "red", marginLeft: "7%" }}>
              {confirmpasswordError}
            </Text>
          ) : null}
          <View style={{ marginLeft: "4%" }}>
            <Text style={{ marginBottom: 5 }}>
              {t("Community")}
              <Text style={{ color: "red" }}>*</Text>
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderRadius: 8,
                borderColor: communityError ? 'red' : 'gray',
                width: 355,
                marginBottom: 1,
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
                  style={{ color: Colors.BLACK }}
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
              <Text style={{ color: 'red', marginLeft: '3%' }}>{communityError}</Text>
            )}
          </View>
          <Text style={{ marginLeft: "4%" ,marginTop:10}}>{t("Your ID")} </Text>

          <View
            style={{
              borderColor: "gray",
              borderWidth: 1,
              borderRadius: 8,
              padding: 8,
              marginBottom: 10,
              width: "92%",
              marginLeft: "4%",
              marginTop: 5,
            }}
          >
            <TextInput
              placeholder="Enter your ID number..."
              autoCapitalize="none"
              autoCorrect={false}
              value={residentId}
              onChangeText={setResidentId}
            />
          </View>
        </View>
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            marginLeft: "2%",
            marginTop: "3%",
          }}
        >
          <TouchableOpacity
            style={{ marginLeft: "5%" }}
            onPress={toggleCheckbox}
          >
            <MaterialIcons
              name={isChecked ? "check-box" : "check-box-outline-blank"}
              size={20}
              color={isChecked ? "green" : "black"}
            />
          </TouchableOpacity>
          <Text style={{ marginLeft: 10 }}>{t("I accept the")} </Text>
          <TouchableOpacity onPress={toggleTermsModal}>
            <Text
              style={{
                color: Colors.PURPLE,
                textDecorationLine: "underline",
              }}
            >
              {t("Terms of Services")}
            </Text>
          </TouchableOpacity>
          <Termsofservices
            isVisible={isTermsModalVisible}
            onClose={toggleTermsModal}
          />
          <Text> {t("and")} </Text>
        </View>
        <TouchableOpacity onPress={togglePrivacyPolicyModal}>
          <Text
            style={{
              color: Colors.PURPLE,
              textDecorationLine: "underline",
              marginLeft: "15%",
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
          <Text style={{ color: "red", marginLeft: "7%" }}>
            {termspolicyError}
          </Text>
        )}
        <View>
          <TouchableOpacity
            onPress={handleSignUp}
            style={{
              borderColor: "gray",
              borderWidth: 1,
              borderRadius: 8,
              padding: 13,
              marginBottom: 10,
              width: "92%",
              marginLeft: "4%",
              alignItems: "center",
              backgroundColor: Colors.PURPLE,
              marginTop: "5%",
            }}
          >
            <Text style={{ color: Colors.LIGHT_WHITE }}>{t("Submit")}</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginLeft: "28%",
            marginTop: "5%",
            marginBottom: '3%'
          }}
        >
          <Text style={{ alignItems: "center" }}>
            {t("Already have an account?")}
          </Text>
        </View>
        <TouchableOpacity
          onPress={navigateToLogin}
          style={{ alignItems: "center" }}
        >
          <Text style={{ color: Colors.PURPLE, marginLeft: "5%", marginBottom: '10%' }}>
            {t("Login now!")}
          </Text>
        </TouchableOpacity>
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
  );
};
const styles = {
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
