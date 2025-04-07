import React from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Colors from '../../../assets/Colors';
import { useVerifyAccount } from '../../hooks/useVerifyAccount';
import { useTranslation } from 'react-i18next';

const VerifyAccount = () => {
  const {
    t,
    isConnected,
    code,
    email,
    timeLeft,
    isExpired,
    codeError,
    isLoading,
    codeInputRefs,
    handleCodeChange,
    handleResendCode,
  } = useVerifyAccount();

  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

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
    <SafeAreaView style={{ backgroundColor: Colors.WHITE, flex: 1 }}>
      {/* Language Selector */}


      <View style={{ marginTop: "20%" }}>
        <View style={{ marginBottom: "6%", marginLeft: "8%" }}>
          <Text style={{ fontSize: 35, fontWeight: "bold" }}>
            {t("Verify your account")}
          </Text>
        </View>
        <View style={{ marginBottom: "20%", marginLeft: "8%", marginRight: "4%" }}>
          <Text style={{ fontSize: 12, color: "gray", fontStyle: "italic" }}>
            {t("We've sent you a 6-digit code to")} {email}
          </Text>
        </View>
        <View>
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (codeInputRefs.current[index] = ref)}
                style={styles.codeInput}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
              />
            ))}
          </View>
          {codeError && <Text style={styles.errorText}>{codeError}</Text>}
        </View>
        <View style={styles.resendContainer}>
          <Text>{t("Did not receive a code?")}</Text>
          <TouchableOpacity onPress={handleResendCode}>
            <Text style={styles.resendText}>{t("Resend")}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: "6%", marginLeft: "21%" }}>
          {!isExpired ? (
            <Text style={styles.timerText}>
              {t('Code will expire in')} {timeLeft}
            </Text>
          ) : (
            <Text style={styles.expiredText}>
              {t('Code has expired!')}
            </Text>
          )}
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.PURPLE} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = {
  languageSelector: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  earthIcon: {
    width: 30,
    height: 30,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "-13%",
  },
  codeInput: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.PURPLE,
    marginHorizontal: 5,
    width: 40,
    textAlign: "center",
    fontSize: 16,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "5%",
    marginRight: 10,
  },
  resendText: {
    color: Colors.PURPLE,
    marginLeft: 5,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
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
  },
  offlineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.LIGHT_PURPLE,
  },
  offlineIcon: {
    width: 80,
    height: 80,
  },
};

export default VerifyAccount;