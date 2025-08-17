import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Image,
  ImageBackground,
  Dimensions
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../../assets/Colors";
import { useResetPassword } from "../../hooks/useResetPassword";

const ResetPassword = () => {
  const {
    t,
    email,
    newPassword,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    isLoading,
    isConnected,
    newPasswordError,
    confirmPasswordError,
    handleChange,
    setState,
    handleResetPassword,
    toggleShowPassword,
    toggleShowConfirmPassword
  } = useResetPassword();

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
            {t("Reset your password")}
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
          }}>
            {t("New Password")}
          </Text>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            borderColor: newPasswordError ? "red" : "gray",
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
              placeholder="*********"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={newPassword}
              onChangeText={(text) => handleChange("newPassword", text)}
              style={{ flex: 1, fontSize: width * 0.045 }}
            />
            <TouchableOpacity onPress={toggleShowPassword}>
              <MaterialCommunityIcons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="black"
              />
            </TouchableOpacity>
          </View>
          {newPasswordError && (
            <View style={{ marginLeft: width * 0.04 }}>
              {newPasswordError.split('\n').map((line, index) => (
                line && <Text key={index} style={{ color: "red", marginTop: 2 }}>{line}</Text>
              ))}
            </View>
          )}

          <Text style={{
            marginLeft: width * 0.04,
            fontSize: width * 0.045,
            color: Colors.WHITE,
            textShadowColor: Colors.LIGHT_PURPLE,
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 7,
          }}>
            {t("Confirm New Password")}
          </Text>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            borderColor: confirmPasswordError ? "red" : "gray",
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
              placeholder="*********"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={(text) => handleChange("confirmPassword", text)}
              style={{ flex: 1, fontSize: width * 0.045 }}
            />
            <TouchableOpacity onPress={toggleShowConfirmPassword}>
              <MaterialCommunityIcons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={24}
                color="black"
              />
            </TouchableOpacity>
          </View>
          {confirmPasswordError && (
            <Text style={{ color: "red", marginLeft: width * 0.04 }}>{confirmPasswordError}</Text>
          )}

          <TouchableOpacity
            onPress={handleResetPassword}
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
              {t("Submit")}
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  offlineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.LIGHT_PURPLE
  },
  offlineIcon: {
    width: 80,
    height: 80
  }
};

export default ResetPassword;