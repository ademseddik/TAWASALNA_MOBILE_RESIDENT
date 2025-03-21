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
import VerifyAccount from './src/screens/auth/VerifyAccount';
//////////////////////////////////////////////////////////////////
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
const Stack = createStackNavigator();

const App = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <NavigationContainer>
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
            name="Verify email"
            component={VerifyAccount}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TABBAR"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </I18nextProvider>
  );
};

export default App;