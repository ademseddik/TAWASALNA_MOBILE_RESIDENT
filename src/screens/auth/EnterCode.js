import React from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ImageBackground,
  Dimensions
} from "react-native";
import Colors from "../../../assets/Colors";
import { useEnterCode } from "../../hooks/useEnterCode";
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const EnterCode = () => {
  const navigation = useNavigation();
  const {
    t,
    code,
    email,
    codeError,
    timeLeft,
    isExpired,
    isLoading,
    isConnected,
    codeInputRefs,
    handleCodeChange,
    handleResendCode
  } = useEnterCode();

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
            flexDirection: 'row',
            alignItems: 'center',
            top: 0
          }}>
            <TouchableOpacity 
              style={{
                position: 'absolute',
                left: width * 0.040,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color={Colors.WHITE} />
            </TouchableOpacity>
            <Image
              source={require('../../../assets/Icons/TawasalnaLogoW1.png')}
              style={{ width: width * 0.4, height: height * 0.06 }}
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
            {t("Enter your code")}
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
            {t("We've sent you a 6-digit code to")} {email}
          </Text>

          <View style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 20,
            marginTop: height * 0.03
          }}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => codeInputRefs.current[index] = ref}
                style={{
                  borderBottomWidth: 2,
                  borderBottomColor: digit ? Colors.LIGHT_PURPLE : Colors.WHITE,
                  marginHorizontal: 5,
                  width: 45,
                  height: 50,
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 8,
                  padding: 8,
                  color: Colors.BLACK,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 3,
                }}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && digit === '' && index > 0) {
                    // Handle backspace when field is empty
                    codeInputRefs.current[index - 1]?.focus();
                  }
                }}
                selectTextOnFocus={true}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
              />
            ))}
          </View>

          {codeError && <Text style={{ color: "red", textAlign: "center", marginTop: 10 }}>{codeError}</Text>}

          <View style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 20
          }}>
            <Text style={{ color: Colors.WHITE, fontSize: width * 0.04 }}>{t("Did not receive a code?")}</Text>
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={{ 
                color: Colors.WHITE, 
                marginLeft: 5, 
                fontSize: width * 0.04,
                textShadowColor: Colors.LIGHT_PURPLE,
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}>{t("Resend")}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{
            alignItems: 'center',
            marginVertical: 20,
          }}>
            {!isExpired ? (
              <Text style={{ 
                fontSize: 16, 
                color: Colors.WHITE,
                textShadowColor: Colors.LIGHT_PURPLE,
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}>
                {t('Code will expire in')} {timeLeft}
              </Text>
            ) : (
              <Text style={{ 
                fontSize: 16, 
                color: 'red',
                textShadowColor: Colors.LIGHT_PURPLE,
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
              }}>
                {t('Code has expired!')}
              </Text>
            )}
          </View>

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

export default EnterCode;