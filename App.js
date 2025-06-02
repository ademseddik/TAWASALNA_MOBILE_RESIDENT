import React from 'react';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

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
import UsersProfile from './src/screens/profile/UsersProfile';
import ChangePassword from './src/screens/profile/ChangePassword';
import SearchScreen from './src/screens/tabs/SearchScreen';
import ShowGroup from './src/screens/groups/ShowGroup';
import GroupDetails from './src/screens/groups/GroupDetails';
//////////////////////////////////////////////////////////////////
import { I18nextProvider } from 'react-i18next';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
//import { Slot } from 'expo-router';
import i18n from './i18n';
enableScreens();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const App = () => {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
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
              options={{ headerShown: false}}
            />
            <Stack.Screen
              name="Edit profile"
              component={EditProfile}
              options={{ headerShown: false }}
            />
          
                       <Stack.Screen
              name="UsersProfile"
              component={UsersProfile}
              options={{ headerShown: false }}
            />
                                   <Stack.Screen
              name="Showgroup"
              component={ShowGroup}
              options={{ headerShown: false }}
            />
            
            
                                   <Stack.Screen
              name="GroupDetails"
              component={GroupDetails}
              options={{ headerShown: false }}
            />
                                  <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="change password"
              component={ChangePassword}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>

        </I18nextProvider>
      </ClerkProvider>
    </NavigationContainer>
  );
};

export default App;