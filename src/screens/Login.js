import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  Pressable,
  Modal,
  FlatList
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '../../assets/Colors';
import { useLogin } from '../hooks/useLogin';
import i18n from '../../i18n';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useOAuth, useAuth, useUser } from '@clerk/clerk-expo';
import Axios from "axios";
import { APP_ENV } from '../utils/BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";


export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};
const languages = [
  { code: 'en', name: 'English', flag: require('../../assets/flags/enFlag.png') },
  { code: 'fr', name: 'Français', flag: require('../../assets/flags/FranceFlag.png') },
  { code: 'es', name: 'Español', flag: require('../../assets/flags/SpainFlag.png') },
  { code: 'ar', name: 'العربية', flag: require('../../assets/flags/ArFlag.png') },
  { code: 'pr', name: 'Portuguese', flag: require('../../assets/flags/portugalFlag.png') },
  { code: 'al', name: 'German', flag: require('../../assets/flags/GermanyFlag.png') },
];

const SocialLoginButton = ({ strategy }) => {
  const getStrategy = () => {
    if (strategy === 'google') return 'oauth_google';
    if (strategy === 'apple') return 'oauth_apple';
    if (strategy === 'facebook') return 'oauth_facebook';
    return 'oauth_google';
  };

  const { startOAuthFlow } = useOAuth({ strategy: getStrategy() });
  const { user } = useUser(); // User data from Clerk
  const [isLoading, setIsLoading] = useState(false);

  const buttonIcon = () => {
    if (isLoading) return <ActivityIndicator size="small" color="black" />;
    if (strategy === 'apple')
      return <Image source={require('../../assets/Icons/apple.png')} style={socialStyles.icon} />;
    if (strategy === 'google')
      return <Image source={require('../../assets/Icons/google.png')} style={socialStyles.icon} />;
    if (strategy === 'facebook')
      return <Image source={require('../../assets/Icons/facebook.png')} style={socialStyles.icon} />;
  };

  const onSocialLoginPress = React.useCallback(async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.setItem('socialProvider', strategy);
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/dashboard', { scheme: 'myapp' }),
      });

      if (createdSessionId) {

        await setActive({ session: createdSessionId });
        // Reload user data and wait for it to complete
        if (user) {
          await user.reload();
          // Log the updated user data after reload
          console.log('Logged in user after reload:', {
            id: user,
            fullName: user.fullName,
            email: user.primaryEmailAddress?.emailAddress,
            profileImage: user.imageUrl,
          });


        } else {
          console.log('User object not available immediately after setActive');
        }
      }
    } catch (err) {
      setIsLoading(false);
      console.error('OAuth Error:', JSON.stringify(err, null, 2));
    } finally {

    }
  }, [startOAuthFlow, strategy]); // Removed 'user' from dependencies to avoid stale reference

  return (
    <TouchableOpacity
      style={socialStyles.container}
      onPress={onSocialLoginPress}
      disabled={isLoading}
    >
      {buttonIcon()}
    </TouchableOpacity>
  );
};

const Login = () => {
  useWarmUpBrowser();
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);
  const navigation = useNavigation();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const { t } = useTranslation();
  const {
    isConnected,
    email,
    password,
    showPassword,
    isChecked,
    isLoading,
    errors,
    emailTouched,
    passwordTouched,
    setState,
    handleLogin,
    toggleCheckbox,
    toggleShowPassword,
    handleEmailChange,
    handlePasswordChange,
    handleSignUp,
    handleForgotPassword,
    handleLanguageChange,
  } = useLogin();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
const [role, setRole] = useState("65d6717f31baa16064d291dc");
  

  // Log user updates when they occur
  useEffect(() => {
    if (user) {
      const checkProviderAndSignIn = async () => {
        const provider = await AsyncStorage.getItem('socialProvider');
        if (provider) {
          handleSigninSocial(provider);
          // Clean up after use
        }
      };
      checkProviderAndSignIn();
    }
  }, [user]);
  const handleSigninSocial = async (provider) => {
    await AsyncStorage.setItem('SOCIAL_AUTH', "true");
    try {
      const concatenated = `${provider}_${user.primaryEmailAddress?.emailAddress}`;
      console.log(concatenated); // Output: "google_user@example.com"
      console.log(user.fullName)
      console.log(user.primaryEmailAddress?.emailAddress)
      console.log(role)
      const email = user.primaryEmailAddress?.emailAddress;
      const fullname = user.fullName;
      const response = await Axios.post(`${APP_ENV.AUTH_PORT}/tawasalna-user/auth/signin_and_register__with_social_media`,

        {
          email: concatenated,
          provider: provider,
          fullname: fullname,
          role,
        }
      )
      await AsyncStorage.setItem('userId', response.data.id);
      console.log(response.data.token)
      await AsyncStorage.setItem('USER_ACCESS', response.data.token);
      await AsyncStorage.setItem("USER_REFRESH", response.data.refreshToken),
      console.log("Sign-in successful:", response.data);
       navigation.navigate("ProfileScreen");
    } catch (error) {
      if (error.response) {
        console.log(error.response)
        if (error.response.data.error == "User not found") {
          navigation.navigate("ProfileScreen");
        }
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
        console.log("Sign-in successfl:", response.data);
        console.error("Error signing i:", error);
      }
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const changeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
    setShowLanguagePicker(false);
  };

  if (!isConnected) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.LIGHT_PURPLE,
        }}
      >
        <Image
          source={require('../../assets/Icons/NoInternet.png')}
          style={{ width: 80, height: 80 }}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: Colors.WHITE, flex: 1 }}>
      <View style={{ marginTop: '6%' }}>
        <TouchableOpacity
          style={styles.languageSelector}
          onPress={() => setShowLanguagePicker(!showLanguagePicker)}
        >
          <Image source={require('../../assets/Icons/earth.png')} style={styles.earthIcon} />
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
  flexDirection: 'row',
  alignItems: 'center',
  marginLeft: '5%',
  marginBottom: 90,
  marginTop:50
}}>
  <Image
    source={require('../../assets/Icons/logo.png')}
    style={{ width: 50, height: 50, marginRight: 10 }} // adjust size as needed
    resizeMode="contain"
  />
  <Text style={{ fontSize: 50, fontWeight: 'bold' }}>{t('Login')}</Text>
</View>
        <View style={{ marginTop: -60 }}>
          <Text style={{ marginLeft: '4%' }}>{t('Email')}</Text>
          <View
            style={{
              borderColor: emailTouched && errors.general ? 'red' : 'gray',
              borderWidth: 1,
              borderRadius: 8,
              padding: 4,
              marginBottom: 10,
              marginTop: 5,
              width: '92%',
              marginLeft: '4%',
            }}
          >
            <TextInput
              placeholder={t('Your email')}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={handleEmailChange}
            />
          </View>
          {errors.general && (
            <Text style={{ color: 'red', marginLeft: '4%' }}>{errors.general}</Text>
          )}

          <Text style={{ marginLeft: '4%' }}>{t('Password')}</Text>
          <View
            style={{
              flexDirection: 'row',
              borderColor: passwordTouched && errors.password ? 'red' : 'gray',
              borderWidth: 1,
              borderRadius: 8,
              padding: 4,
              marginBottom: 10,
              marginTop: 5,
              width: '92%',
              marginLeft: '4%',
            }}
          >
            <TextInput
              placeholder="*********"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={handlePasswordChange}
              style={{ flex: 1 }}
            />
            <TouchableOpacity onPress={toggleShowPassword}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye' : 'eye-off'}
                size={24}
                color="black"
              />
            </TouchableOpacity>

          </View>
          {errors.password && (
            <Text style={{ color: 'red', marginLeft: '4%' }}>{errors.password}</Text>
          )}

          <TouchableOpacity
            onPress={handleLogin}
            style={{
              borderColor: 'gray',
              borderWidth: 1,
              borderRadius: 8,
              padding: 13,
              marginBottom: 15,
              alignSelf: 'center',
              alignItems: 'center',
              backgroundColor: Colors.PURPLE,
              width: '92%',
              marginLeft: '1%',
            }}
          >
            <Text style={{ color: '#FFFFFF' }}>{t('Continue')}</Text>
          </TouchableOpacity>

          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              marginLeft: '2%',
            }}
          >
            <TouchableOpacity style={{ marginLeft: '2%' }} onPress={toggleCheckbox}>
              <MaterialIcons
                name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color={isChecked ? 'green' : 'black'}
              />
            </TouchableOpacity>
            <Text>{t('Remember me?')}</Text>
            <TouchableOpacity onPress={handleForgotPassword} style={{ marginLeft: 'auto' }}>
              <Text style={{ color: Colors.PURPLE, marginRight: '4%' }}>
                {t('Forgot Password')}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: 'row',
              marginTop: '5%',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                borderBottomColor: 'grey',
                borderBottomWidth: 1,
                width: '40%',
                marginVertical: 5,
                marginRight: '2%',
              }}
            />
            <Text>{t('Or connect via')}</Text>
            <View
              style={{
                borderBottomColor: 'grey',
                borderBottomWidth: 1,
                width: '40%',
                marginVertical: 5,
                marginLeft: '2%',
              }}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: '5%',
            }}
          >
            <SocialLoginButton strategy="google" />
            <SocialLoginButton strategy="apple" />
            <SocialLoginButton strategy="facebook" />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: '5%',
            }}
          >
            <Text>{t('Not a member yet?')}</Text>
            <TouchableOpacity onPress={handleSignUp} style={{ marginLeft: '2%' }}>
              <Text style={{ color: Colors.PURPLE }}>{t('Register here')}</Text>
            </TouchableOpacity>
            
          </View>

          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              marginTop: '195%',
              left: 0,
              right: 0,
            }}
          >
            <Text style={{ color: 'gray' }}>
              © {new Date().getUTCFullYear()} - {t('Tawasalna - All Rights Reserved.')}
            </Text>
          </View>
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

export default Login;