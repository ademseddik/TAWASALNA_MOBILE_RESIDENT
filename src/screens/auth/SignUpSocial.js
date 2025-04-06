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

import AsyncStorage from "@react-native-async-storage/async-storage";
import Axios from "axios";
import { useOAuth, useAuth, useUser } from '@clerk/clerk-expo';


const SignUpSocial = () => {
    const navigation = useNavigation();
    const [isChecked, setIsChecked] = useState(false);
    const [role, setRole] = useState("65d6717f31baa16064d291dc");
    const { isSignedIn, signOut } = useAuth();
    const [residentId, setResidentId] = useState("");
    const [termspolicyError, setTermsPolicyError] = useState("");
    const [isTermsModalVisible, setTermsModalVisible] = useState(false);
    const [isPrivacyPolicyModalVisible, setPrivacyPolicyModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [dateofbirthError, setDateOfBirthError] = useState("");
    const { t } = useTranslation();
    const { user } = useUser(); // User data from Clerk
    /////////////////////////////////////////////////////////////////
    useEffect(() => {
        const backAction = () => {
            handleSignOut();
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

    //////////////////////////////////////////////////////////////////
    const toggleCheckbox = () => {
        setIsChecked(!isChecked);
    };
    const navigateToLogin = () => {
        navigation.navigate("Login");
        handleSignOut();
    };
    /////////////////////////////////////////////////////////////////
    const isValidDateOfBirth = () => {
        if (new Date(dateOfBirth) > new Date()) {
            setDateOfBirthError("Date of birth cannot be in the future");
           }
    //////////////////////////////////////////////////////////////////

    };

    const handleSignOut = async () => {
        try {
            await signOut();
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };
    /////////////////////////////////////////////////////////////////////
    const handleSignUp = async () => {
       
        if (new Date(dateOfBirth) > new Date()) {
            setDateOfBirthError("Date of birth cannot be in the future");
           }
        setIsLoading(true);
        if (user) {
            await user.reload();
            console.log('Logged in user after reload:', {
                id: user,
                fullName: user.fullName,
                email: user.primaryEmailAddress?.emailAddress,
                profileImage: user.imageUrl,
            });


        } else {
           
            console.log('hahahah User object not available immediately after setActive');
        }

        if (!isChecked) {
            setTermsPolicyError(
                "Please accept the Terms of Services and Privacy Policy!"
            );
            return;
        } else {
            setTermsPolicyError("");
        }

        setIsLoading(true);
        const provider = await AsyncStorage.getItem('socialProvider');
        try {
            const response = await Axios.post(`${APP_ENV.AUTH_PORT}/tawasalna-user/auth/signup_with_social_media`,

                {
                    fullname: user.fullName,
                    dateOfBirth: new Date(dateOfBirth),
                    email: user.primaryEmailAddress?.emailAddress,
                    provider,
                    role,
                    residentId,
                }
            )
            
            console.log("Sign-up successful:", response.data);
            navigation.navigate("ProfileScreen");
        } catch (error) {
            console.log(error.response)
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



    const toggleDatePicker = () => {
        setShowPicker(!showPicker);
    };

    const onchangeDatePicker = (event, selectedDate) => {
        if (selectedDate) {
            setDate(selectedDate);
            const formattedDate = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1
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
                        {t("Complete your registration")}
                    </Text>
                </View>
                <View style={{ marginTop: 20 }}>






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

export default SignUpSocial;
