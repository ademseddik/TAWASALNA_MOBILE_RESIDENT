import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ImageBackground,
  Dimensions
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Colors from "../../../assets/Colors";
import { useForgotPassword } from "../../hooks/useForgotPassword";

const ForgotPassword = () => {
  const {
    t,
    email,
    errors,
    isLoading,
    isConnected,
    setState,
    handleForgotPassword
  } = useForgotPassword();
  
  const { width, height } = Dimensions.get('window');

  if (!isConnected) {
    return (
      <View style={styles.offlineContainer}>
        <Image
          source={require("../../../assets/Icons/NoInternet.png")}
          style={styles.offlineIcon}
        />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../../assets/ImgBackGoung.jpg')}
      style={{ flex: 1, resizeMode: 'cover' }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginBottom: height * 0.015,
          marginTop: 0
        }}>
          <View style={{
            width: width * 1,
            height: height * 0.08,
            backgroundColor: Colors.LIGHT_PURPLE,
            paddingLeft: width * 0.040,
            justifyContent: 'center',
            top: 0
          }}>
            <Image
              source={require('../../../assets/Icons/TawasalnaLogoW1.png')}
              style={{ width: width * 0.4, height: height * 0.06, marginRight: width * 0.02 }}
              resizeMode="contain"
            />
          </View>
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
          }}>
            {t("Forgot Password")}
          </Text>
        </View>

        <View style={{ marginTop: -height * 0.07 }}>
          <Text style={{
            marginLeft: width * 0.04,
            fontSize: width * 0.045,
            color: Colors.WHITE,
            textShadowColor: Colors.LIGHT_PURPLE,
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 7,
            marginBottom: height * 0.02
          }}>
            {t("Enter your email to proceed with resetting your password.")}
          </Text>
          
          <Text style={{
            marginLeft: width * 0.04,
            fontSize: width * 0.045,
            color: Colors.WHITE,
            textShadowColor: Colors.LIGHT_PURPLE,
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 7,
          }}>
            {t("Email")}
          </Text>
          
          <View style={{
            borderColor: errors.email ? "red" : "gray",
            borderWidth: 1,
            borderRadius: 12,
            padding: 8,
            marginBottom: 10,
            marginTop: 5,
            width: '92%',
            marginLeft: '4%',
            backgroundColor: '#F7F7F7',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}>
            <TextInput
              placeholder={t("Your email")}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => setState({ email: text })}
              style={{ fontSize: width * 0.045 }}
            />
          </View>
          
          {errors.email && (
            <Text style={{ color: "red", marginLeft: width * 0.04 }}>{errors.email}</Text>
          )}

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={{
              borderRadius: width * 0.03,
              padding: width * 0.03,
              marginBottom: height * 0.03,
              alignSelf: 'center',
              alignItems: 'center',
              backgroundColor: Colors.LIGHT_PURPLE,
              width: width * 0.92,
              marginLeft: width * 0.01,
              marginTop: width * 0.070,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <MaterialIcons name="send" size={24} color={Colors.WHITE} />
            <Text style={{ color: '#FFFFFF', fontSize: width * 0.05, fontWeight: 'bold', marginLeft: 5 }}>
              {t("Send")}
            </Text>
          </TouchableOpacity>

          {/* Copyright Notice */}
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              marginTop: height * 1.1,
              left: 0,
              right: 0,
            }}
          >
            <Text style={{ color: 'gray', fontSize: width * 0.035 }}>
              © {new Date().getUTCFullYear()} - {t('Tawasalna - All Rights Reserved.')}
            </Text>
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.PURPLE} />
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = {
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.LIGHT_PURPLE,
  },
  offlineIcon: {
    width: 80,
    height: 80
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  }
};

export default ForgotPassword;