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
} from "react-native";
import Colors from "../../../assets/Colors";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Termsofservices from "../../components/pupUps/Termsofservices";
import PrivacyPolicy from "../../components/pupUps/PrivacyPolicy";
import DateTimePicker from "@react-native-community/datetimepicker";
//import createAxiosInstance from "../../core/config/Axios";
import { APP_ENV } from "../../../src/utils/BaseUrl";
import { I18nextProvider, useTranslation } from "react-i18next";
//import i18n from "../../../i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Axios from "axios";


const SignUp = () => {
  const navigation = useNavigation();
  const [isChecked, setIsChecked] = useState(false);
  const [role, setRole] = useState("65d6717f31baa16064d291dc");
  const [email, setEmail] = useState("");
  const [fullname, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [residentId, setResidentId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dateofbirthError, setDateOfBirthError] = useState("");
  const [fullnameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmpasswordError, setConfirmPasswordError] = useState("");
  const [termspolicyError, setTermsPolicyError] = useState("");
  const [isTermsModalVisible, setTermsModalVisible] = useState(false);
  const [isPrivacyPolicyModalVisible, setPrivacyPolicyModalVisible] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

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
     if (new Date(dateOfBirth) > new Date()) {
      setDateOfBirthError("Date of birth cannot be in the future");
     }
    else if (!fullname.trim()) {
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
      const response = await Axios.post(`${APP_ENV.AUTH_PORT}/tawasalna-user/auth/signup`,
      
        {
          fullname,
          dateOfBirth: new Date(dateOfBirth),
          email,
          password,
          role,
          residentId,
        }
      )
      console.log("Sign-up successful:", response.data);
      console.log("date of birth", dateOfBirth);
      navigation.navigate("Verify email", { email });
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
            setEmailError("User already exists");
          }
        }
      } else {
        console.error("Error signing up:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // const formatDate = (date) => {
  //   const options = { year: "numeric", month: "short", day: "2-digit" };
  //   return date.toLocaleDateString("en-GB", options);
  // };

  const toggleDatePicker = () => {
    setShowPicker(!showPicker);
  };

 const onchangeDatePicker = (event, selectedDate) => {
   if (selectedDate) {
     setDate(selectedDate);
     const formattedDate = `${selectedDate.getFullYear()}-${
       selectedDate.getMonth() + 1
     }-${selectedDate.getDate()}`;
     setDateOfBirth(formattedDate); 
   }
   setShowPicker(false); 
 };

 


  return (
    <SafeAreaView style={{ backgroundColor: Colors.WHITE, flex: 1 }}>
      <ScrollView style={{ marginTop: "10%" }}>
        <View style={{ marginLeft: "5%", marginBottom: "-1%" }}>
          <Text style={{ fontSize: 50, fontWeight: "bold" }}>
            {t("Register")}
          </Text>
        </View>
        <View style={{ marginTop: 20 }}>
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
            {t("Date Of Birth")}
            <Text style={{ color: dateofbirthError ? "red" : "black" }}>*</Text>
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 8,
              marginBottom: 10,
              width: "92%",
              marginLeft: "4%",
              marginTop: 5,
            }}
          >
            {showPicker && (
              <DateTimePicker
                mode="date"
                display="spinner"
                value={date}
                onChange={onchangeDatePicker}
                editable={false}
              />
            )}

            {!showPicker && (
              <TouchableOpacity
                onPress={toggleDatePicker}
                style={{ flexDirection: "row" }}
              >
                <TextInput
                  placeholder={t("Select your date of birth")}
                  value={dateOfBirth}
                  onChangeText={(text) => setDateOfBirth(text)}
                  editable={false}
                  style={{ color: "black" }}
                />
                <MaterialCommunityIcons
                  name="calendar"
                  size={24}
                  color="black"
                  style={{ marginLeft: 130 }}
                />
              </TouchableOpacity>
            )}
          </View>
          {dateofbirthError ? (
            <Text style={{ color: "red", marginLeft: "7%" }}>
              {dateofbirthError}
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
                name={showPassword ? "eye-off" : "eye"}
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
                name={showConfirmPassword ? "eye-off" : "eye"}
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
          <Text style={{ marginLeft: "4%" }}>{t("Your ID")} </Text>

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
            style={{ marginLeft: "2%" }}
            onPress={toggleCheckbox}
          >
            <MaterialIcons
              name={isChecked ? "check-box" : "check-box-outline-blank"}
              size={20}
              color={isChecked ? "green" : "black"}
            />
          </TouchableOpacity>
          <Text style={{ marginLeft: 15 }}>{t("I accept the")} </Text>
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
              marginLeft: "22%",
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
            marginBottom:'3%'
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
          <Text style={{ color: Colors.PURPLE, marginLeft: "5%" , marginBottom:'10%'}}>
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

export default SignUp;
