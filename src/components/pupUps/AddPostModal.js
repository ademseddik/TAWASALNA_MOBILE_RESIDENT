import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Button
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from '../../utils/BaseUrl';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import Colors from '../../../assets/Colors';
import * as Haptics from 'expo-haptics';

const AddPostModal = ({ visible, onClose }) => {
  const [caption, setCaption] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images
    });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const playSuccessSound = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/success.mp3')
      );
      await sound.playAsync();
    } catch (err) {
      console.error('Error playing success sound or haptic:', err);
    }
  };

  const handleAddPost = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('caption', caption);

    if (photo) {
      formData.append('photos', {
        uri: photo.uri,
        name: photo.fileName || 'photo.jpg',
        type: 'image/jpeg'
      });
    }

    formData.append('isAnnouncement', isAnnouncement);
    if (isAnnouncement) {
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
    }

    try {
      const userId = await AsyncStorage.getItem("userId");
      const res = await Axios.post(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/addresidentpost/${userId}/FALSE`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Post added:', res.data);
      setIsLoading(false);
      playSuccessSound();
      onClose();
    } catch (err) {
      console.error('Error adding post:', err);
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.header}>Add New Post</Text>
          <TextInput
            placeholder="Caption"
            value={caption}
            onChangeText={setCaption}
            style={styles.input}
          />

        <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
  <Ionicons name="camera-outline" size={24} color="#fff" />
</TouchableOpacity>

          {photo && <Image source={{ uri: photo.uri }} style={styles.image} />}

          <View style={styles.switchContainer}>
            <Text>Is Announcement?</Text>
            <Switch value={isAnnouncement} onValueChange={setIsAnnouncement} />
          </View>

          {isAnnouncement && (
            <>
              <TextInput
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
              <TextInput
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
              />
              <TextInput
                placeholder="Category"
                value={category}
                onChangeText={setCategory}
                style={styles.input}
              />
            </>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.postButton}>
              {isLoading ? (
                <View style={styles.loaderButton}>
                  <LottieView
                    source={require('../../../assets/animations/loading.json')}
                    autoPlay
                    loop
                    style={styles.loaderAnimation}
                  />
                </View>
              ) : (
                <TouchableOpacity style={styles.addPostButton} onPress={handleAddPost}>
                  <Text style={styles.addPostButtonText}>Add Post</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 20
  },
  addPostButton: {
    backgroundColor: Colors.LIGHT_PURPLE, // or any hex like '#4CAF50'
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addPostButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ccc', // Light gray
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
  backgroundColor: Colors.LIGHT_PURPLE, // or a hex value like '#a18cd1'
  padding: 12,
  borderRadius: 30,
  alignSelf: 'flex-start',
  marginBottom: 10,
  marginTop: 10,
},

  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: { borderBottomWidth: 1, marginBottom: 10, padding: 8 },
  image: { width: 100, height: 100, marginTop: 10 },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  postButton: {
    width: 120,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '90%'
  },
  loaderButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 5
  },
  loaderAnimation: {
    width: 50,
    height: 50
  },
  imagePickerIcon: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 10
  }
});

export default AddPostModal;
