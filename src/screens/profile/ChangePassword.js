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
import { useNavigation } from '@react-navigation/native';
import Colors from "../../../assets/Colors";
import { useChangePassword } from "../../hooks/useChangePassword";

const ChangePassword = () => {
  const navigation = useNavigation();
  const {
    t,
    currentpassword,
    newPassword,
    confirmPassword,
    showCurrentPassword,
    showPassword,
    showConfirmPassword,
    isLoading,
    isConnected,
    currentPasswordError,
    newPasswordError,
    confirmPasswordError,
    generalError,
    handleChange,
    handleResetPassword,
    toggleShowCurrentPassword,
    toggleShowPassword,
    toggleShowConfirmPassword
  } = useChangePassword();

  if (!isConnected) {
    return (
      <View style={styles.offlineContainer}>
        <Image
          source={require("../../../assets/Icons/NoInternet.png")}
          style={styles.offlineIcon}
        />
        <Text style={styles.offlineText}>{t("no_internet_connection")}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: Colors.WHITE, flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.LIGHT_PURPLE} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("Change your password")}</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.container}>

        {generalError && (
          <Text style={styles.generalError}>{generalError}</Text>
        )}

        {/* Current Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t("Current Password")}</Text>
          <View style={styles.passwordInput}>
            <TextInput
              placeholder="*********"
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
              value={currentpassword}
              onChangeText={(text) => handleChange("currentpassword", text)}
              style={styles.input}
            />
            <TouchableOpacity onPress={toggleShowCurrentPassword}>
              <MaterialCommunityIcons
                name={showCurrentPassword ? "eye-off" : "eye"}
                size={24}
                color="black"
              />
            </TouchableOpacity>
          </View>
          {currentPasswordError && (
            <Text style={styles.errorText}>{currentPasswordError}</Text>
          )}
        </View>

        {/* New Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t("New Password")}</Text>
          <View style={styles.passwordInput}>
            <TextInput
              placeholder="*********"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={newPassword}
              onChangeText={(text) => handleChange("newPassword", text)}
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
            <View style={styles.errorContainer}>
              {newPasswordError.split('\n').map((line, index) => (
                line && <Text key={index} style={styles.errorText}>{line.trim()}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t("Confirm New Password")}</Text>
          <View style={styles.passwordInput}>
            <TextInput
              placeholder="*********"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={(text) => handleChange("confirmPassword", text)}
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
          disabled={isLoading}
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
    generalError: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 20,
      },
      offlineText: {
        marginTop: 20,
        fontSize: 16,
        color: Colors.DARK_GREY,
      },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
    height: 44,
    marginLeft: 16,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,

  },
  label: {
    marginBottom: 5,
    marginLeft: 5
  },
  passwordInput: {
    flexDirection: "row",
    borderColor: "gray",
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,

    alignItems: "center"
  },
  input: {
    flex: 1
  },
  errorContainer: {
    marginTop: 5,
  },
  errorText: {
    color: "red",
    marginLeft: 20,
    marginTop: 2,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2
  },
  submitButton: {
    flexDirection: "row",
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 15,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.LIGHT_PURPLE,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: Colors.WHITE,
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
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

export default ChangePassword;