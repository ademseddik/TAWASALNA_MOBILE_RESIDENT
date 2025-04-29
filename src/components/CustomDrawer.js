import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../assets/Colors';

const CustomDrawer = ({ navigation }) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      await AsyncStorage.multiRemove(["userId", "token", "SOCIAL_AUTH"]);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: Colors.LIGHT_WHITE,
  },
  logoutButton: {
    backgroundColor: Colors.RED,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CustomDrawer;