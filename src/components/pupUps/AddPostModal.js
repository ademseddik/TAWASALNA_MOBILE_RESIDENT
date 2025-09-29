import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from '../../utils/BaseUrl';
import { Audio } from 'expo-av';
import Colors from '../../../assets/Colors';
import * as Haptics from 'expo-haptics';

const MAX_IMAGES = 5;

const AddPostModal = ({ visible, onClose, onPostAdded, onLoadingChange }) => {
  const [caption, setCaption] = useState('');
  const [photos, setPhotos] = useState([]); // changed from single photo to array
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captionError, setCaptionError] = useState('');

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  // Reset all fields
  const resetFields = () => {
    setCaption('');
    setPhotos([]);
    setIsAnnouncement(false);
    setTitle('');
    setDescription('');
    setCategory('');
    setIsLoading(false);
    setCaptionError('');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES, // optional: limit number of images
    });
    if (!result.canceled) {
      setPhotos(prev => {
        // Filter out duplicates by uri, and limit to MAX_IMAGES
        const uris = new Set(prev.map(img => img.uri));
        const newAssets = result.assets.filter(img => !uris.has(img.uri));
        const combined = [...prev, ...newAssets].slice(0, MAX_IMAGES);
        return combined;
      });
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
    // Validate caption
    if (!caption.trim()) {
      setCaptionError('Please add a caption before posting');
      return;
    }
    
    setCaptionError('');
    setIsLoading(true);
    const formData = new FormData();
    formData.append('caption', caption);

    if (photos.length > 0) {
      photos.forEach((img, idx) => {
        formData.append('photos', {
          uri: img.uri,
          name: img.fileName || `photo${idx}.jpg`,
          type: 'image/jpeg'
        });
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
      resetFields();
      // Close first for better UX, then notify parent to refresh
      onClose();
      if (typeof onPostAdded === 'function') {
        onPostAdded();
      }
    } catch (err) {
      console.error('Error adding post:', err);
      setIsLoading(false);
    }
  };

  // Remove image handler
  const removeImage = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handle caption change and clear error
  const handleCaptionChange = (text) => {
    setCaption(text);
    if (captionError) {
      setCaptionError('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.header}>Add New Post</Text>
          <View style={styles.headerDivider} />
          <TextInput
            placeholder="Caption"
            value={caption}
            onChangeText={handleCaptionChange}
            style={[styles.textField, captionError ? styles.textFieldError : null]}
            placeholderTextColor="#888"
          />
          {captionError ? (
            <Text style={styles.errorText}>{captionError}</Text>
          ) : null}

          {photos.length > 0 && (
            <View style={styles.imageGrid}>
              {photos.map((img) => (
                <View key={img.uri} style={styles.imageWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(photos.findIndex(p => p.uri === img.uri))}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < MAX_IMAGES && (
                <TouchableOpacity style={styles.addImageTile} onPress={pickImage} activeOpacity={0.7}>
                  <Ionicons name="add" size={32} color={Colors.LIGHT_PURPLE} />
                  <Text style={styles.addImageLabel}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {photos.length === 0 && (
            <TouchableOpacity style={styles.addImageTile} onPress={pickImage} activeOpacity={0.7}>
              <Ionicons name="add" size={32} color={Colors.LIGHT_PURPLE} />
              <Text style={styles.addImageLabel}>Add Photo</Text>
            </TouchableOpacity>
          )}

      

          {isAnnouncement && (
            <>
              <TextInput
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                style={styles.textField}
                placeholderTextColor="#888"
              />
              <TextInput
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                style={styles.textField}
                placeholderTextColor="#888"
              />
              <TextInput
                placeholder="Category"
                value={category}
                onChangeText={setCategory}
                style={styles.textField}
                placeholderTextColor="#888"
              />
            </>
          )}

          <View style={styles.buttonRowStyled}>
            <TouchableOpacity style={styles.cancelButtonStyled} onPress={() => { resetFields(); onClose(); }}>
              <Text style={styles.cancelButtonTextStyled}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.postButtonStyled}>
              {isLoading ? (
                <View style={styles.loaderButton}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : (
                <TouchableOpacity style={styles.addPostButtonStyled} onPress={handleAddPost}>
                  <Text style={styles.addPostButtonTextStyled}>Add Post</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

AddPostModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPostAdded: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 20
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
  image: {
    width: 80,
    height: 80,
    borderRadius: 16,
    margin: 2,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    backgroundColor: '#f8f8f8',
  },
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
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 28,
    padding: 24,
    width: '92%',
    maxWidth: 400,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loaderButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePickerIcon: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 10
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
    gap: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
    maxWidth: 350,
    alignSelf: 'center',
  },
  imageWrapper: {
    position: 'relative',
    margin: 2,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 16,
    zIndex: 2,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#fff',
  },
  addImageTile: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.LIGHT_PURPLE,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    backgroundColor: '#f5f5fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 2,
  },
  addImageLabel: {
    fontSize: 12,
    color: Colors.LIGHT_PURPLE,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  headerDivider: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.LIGHT_PURPLE,
    opacity: 0.12,
    marginBottom: 16,
    borderRadius: 2,
  },
  textField: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#f5f5fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
    color: Colors.BLACK,
    borderWidth: 1.5,
    borderColor: '#ececec',
  },
  textFieldError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  buttonRowStyled: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    alignItems: 'center',
    width: '100%',
    marginTop: 18,
    marginBottom: 6,
    gap: 10,
  },
  cancelButtonStyled: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButtonTextStyled: {
    color: Colors.LIGHT_PURPLE,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  postButtonStyled: {
    width: 120,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPostButtonStyled: {
    backgroundColor: Colors.LIGHT_PURPLE,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  addPostButtonTextStyled: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});

AddPostModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPostAdded: PropTypes.func.isRequired,
  onLoadingChange: PropTypes.func,
};

export default AddPostModal;
