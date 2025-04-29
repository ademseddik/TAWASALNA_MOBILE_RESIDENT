import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import AddPostModal from '../../components/pupUps/AddPostModal';

export default function HomeScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {/* Your feed or post list */}
      <Text style={{ marginTop: 30 }}>Your Home Feed</Text>

      {/* Add Post Modal */}
      <AddPostModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
        <Text style={styles.addText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#2196F3',
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
    bottom: 25,
    right: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4
  },
  addText: {
    color: '#fff',
    marginTop:20,
    fontSize: 30,
    fontWeight: 'bold'
  }
});
