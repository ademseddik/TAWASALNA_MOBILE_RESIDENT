import React from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from "react-native";
import Colors from "../../../assets/Colors";
import { useEnterCode } from "../../hooks/useEnterCode";

const EnterCode = () => {
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
      <View style={styles.container}>
        <Text style={styles.title}>{t("Enter your code")}</Text>

        <Text style={styles.subtitle}>
          {t("We've sent you a 6-digit code to")} {email}
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => codeInputRefs.current[index] = ref}
              style={styles.codeInput}
              keyboardType="numeric"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
            />
          ))}
        </View>

        {codeError && <Text style={styles.errorText}>{codeError}</Text>}

        <View style={styles.resendContainer}>
          <Text>{t("Did not receive a code?")}</Text>
          <TouchableOpacity onPress={handleResendCode}>
            <Text style={styles.resendText}>{t("Resend")}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.timerContainer}>
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
  container: {
    marginTop: "20%",
    paddingHorizontal: 20
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 20,
    marginLeft: 15
  },
  subtitle: {
    fontSize: 12,
    color: "gray",
    fontStyle: "italic",
    marginBottom: 40,
    marginLeft: 15
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20
  },
  codeInput: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.PURPLE,
    marginHorizontal: 5,
    width: 40,
    textAlign: "center",
    fontSize: 16
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20
  },
  resendText: {
    color: Colors.PURPLE,
    marginLeft: 5
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10
  },
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
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timerText: {
    fontSize: 16,
    color: Colors.PURPLE,
  },
  expiredText: {
    fontSize: 16,
    color: 'red',
  },
};

export default EnterCode;