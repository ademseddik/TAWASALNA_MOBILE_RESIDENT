import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, Image, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from '../../utils/BaseUrl';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
import  Colors  from '../../../assets/Colors';
import * as Haptics from 'expo-haptics';

const AddPostModal = ({ visible, onClose }) => {
  const [caption, setCaption] = useState('');
  const [photo, setPhoto] = useState(null);
  const [video, setVideo] = useState(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };
  const playSuccessSound = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // 🔥 Haptic
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/success.mp3')
      );
      await sound.playAsync();
    } catch (err) {
      console.error('Error playing success sound or haptic:', err);
    }
  };
  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
    if (result.type !== 'cancel') {
      setVideo(result);
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
    if (video) {
      formData.append('video', {
        uri: video.uri,
        name: video.name || 'video.mp4',
        type: 'video/mp4'
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
            <TextInput placeholder="Caption" value={caption} onChangeText={setCaption} style={styles.input} />
            <Button title="Pick an image" onPress={pickImage} />
            {photo && <Image source={{ uri: photo.uri }} style={styles.image} />}
            <Button title="Pick a video" onPress={pickVideo} />
            {video && <Text>{video.name}</Text>}

            <View style={styles.switchContainer}>
              <Text>Is Announcement?</Text>
              <Switch value={isAnnouncement} onValueChange={setIsAnnouncement} />
            </View>

            {isAnnouncement && (
              <>
                <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
                <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
                <TextInput placeholder="Category" value={category} onChangeText={setCategory} style={styles.input} />
              </>
            )}

<View style={styles.buttonRow}>
  <Button title="Cancel" onPress={onClose} />
  
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
    <Button title="Add Post" onPress={handleAddPost} />
  )}
</View>
</View>
         
       
</View>
  </View>
</Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center',  backgroundColor: '#2196F3',borderRadius:20,padding:20},
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: { borderBottomWidth: 1, marginBottom: 10, padding: 8 },
  image: { width: 100, height: 100, marginTop: 10 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  postButton: {
    width: 120,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // dimmed background
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  loaderButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  
  loaderAnimation: {
    width: 50,
    height: 50,
  },
});

export default AddPostModal;
