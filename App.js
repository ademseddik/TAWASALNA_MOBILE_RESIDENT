import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
///////////////////////screens import/////////////////////////////
import SplashScreen from './src/components/SplashScreen';
import LoginScreen from './src/screens/Login';
import HomeScreen from './src/screens/HomeScreen';
import ForgotPassword from './src/screens/auth/ForgotPassword';
import EnterCode from './src/screens/auth/EnterCode';
import ResetPassword from './src/screens/auth/ResetPassword';
import SignUp from './src/screens/auth/SignUp';
import signup_with_social_media from './src/screens/auth/SignUpSocial';
import VerifyAccount from './src/screens/auth/VerifyAccount';
import EditProfile from './src/screens/profile/EditProfile';
import ProfileScreen from "./src/screens/profile/UserProfile";
//////////////////////////////////////////////////////////////////
import { I18nextProvider } from 'react-i18next';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
//import { Slot } from 'expo-router';
import i18n from './i18n';
const Stack = createStackNavigator();

const App = () => {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
  console.log(publishableKey)
  if (!publishableKey) {
    throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env')
  }
  return (
    <NavigationContainer>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <I18nextProvider i18n={i18n}>

          <Stack.Navigator initialRouteName="Splash">
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Forgot Password"
              component={ForgotPassword}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Enter Code"
              component={EnterCode}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Reset your password"
              component={ResetPassword}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Sign up"
              component={SignUp}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Sign up with social"
              component={signup_with_social_media}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Verify email"
              component={VerifyAccount}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="TABBAR"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Edit profile"
              component={EditProfile}
              options={{ headerShown: false }}
            />
                        <Stack.Screen
              name="ProfileScreen"
              component={ProfileScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>

        </I18nextProvider>
      </ClerkProvider>
    </NavigationContainer>
  );
};

export default App;