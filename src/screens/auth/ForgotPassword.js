import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
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
      <View style={{ marginTop: "20%" }}>
        <View style={{ marginBottom: 90, marginLeft: "5%" }}>
          <Text style={{ fontSize: 35, fontWeight: "bold" }}>
            {t("Forgot Password")}
          </Text>
        </View>

        <View style={{ marginTop: -90 }}>
          <Text style={{ fontSize: 12, marginLeft: "3%", marginTop: "7%" }}>
            {t("Enter your email to proceed with resetting your password.")}
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              placeholder={t("Your email")}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => setState({ email: text })}
            />
          </View>
          
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.sendButton}
          >
            <MaterialIcons name="send" size={24} color={Colors.LIGHT_WHITE} />
            <Text style={styles.buttonText}>{t("Send")}</Text>
          </TouchableOpacity>
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
  inputContainer: {
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    width: "95%",
    marginLeft: "2%",
    marginTop: "3%"
  },
  sendButton: {
    flexDirection: "row",
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    marginBottom: 10,
    width: "95%",
    marginLeft: "2%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "3%",
    backgroundColor: Colors.PURPLE,
  },
  buttonText: {
    color: Colors.WHITE,
    marginLeft: 5
  },
  errorText: {
    color: "red",
    marginLeft: "3%"
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