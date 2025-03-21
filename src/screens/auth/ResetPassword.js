import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Image
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
    setState,
    handleResetPassword,
    toggleShowPassword,
    toggleShowConfirmPassword
  } = useResetPassword();

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
        <Text style={styles.title}>{t("Reset your password")}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t("New Password")}</Text>
          <View style={styles.passwordInput}>
            <TextInput
              placeholder="*********"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={newPassword}
              onChangeText={(text) => setState({ newPassword: text })}
              style={styles.input}
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
            <Text style={styles.errorText}>{newPasswordError}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t("Confirm New Password")}</Text>
          <View style={styles.passwordInput}>
            <TextInput
              placeholder="*********"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={(text) => setState({ confirmPassword: text })}
              style={styles.input}
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
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          )}
        </View>

        <TouchableOpacity 
          onPress={handleResetPassword} 
          style={styles.submitButton}
        >
          <MaterialIcons name="send" size={24} color={Colors.LIGHT_WHITE} />
          <Text style={styles.buttonText}>{t("Submit")}</Text>
        </TouchableOpacity>
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
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
    marginLeft: 15
  },
  inputContainer: {
    marginBottom: 20,
    
  },
  label: {
    marginBottom: 5,
    marginLeft: 15
  },
  passwordInput: {
    flexDirection: "row",
    borderColor: "gray",
    width:"100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
   
    alignItems: "center"
  },
  input: {
    flex: 1
  },
  errorText: {
    color: "red",
    marginLeft: 20,
    marginTop: 5
  },
  submitButton: {
    flexDirection: "row",
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    marginHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.PURPLE
  },
  buttonText: {
    color: Colors.WHITE,
    marginLeft: 5
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
  }
};

export default ResetPassword;