import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UserProfile = () => {
  return (
    <View style={styles.container}>
      <Text>Home Feed</Text>
    </View>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
