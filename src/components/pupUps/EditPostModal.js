import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from '../../utils/BaseUrl';
import Colors from '../../../assets/Colors';
import Toast from 'react-native-toast-message';

const MAX_IMAGES = 5;

const EditPostModal = ({ visible, onClose, onPostUpdated, postId, initialCaption = '', initialPhotos = [] }) => {
  const [caption, setCaption] = useState(initialCaption);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [captionError, setCaptionError] = useState('');

  // Update caption and photos when modal opens with new post data
  useEffect(() => {
    if (visible) {
      setCaption(initialCaption);
      setCaptionError('');
      
      // Initialize photos from existing post data
      if (initialPhotos && initialPhotos.length > 0) {
        const photoObjects = initialPhotos.map((photoUrl, index) => ({
          uri: photoUrl,
          fileName: `post_photo_${index}.jpg`,
          type: 'image/jpeg',
          isExisting: true // Mark as existing photo
        }));
        setPhotos(photoObjects);
      } else {
        setPhotos([]);
      }
    }
  }, [visible, initialCaption, initialPhotos]);

  // Reset fields when modal closes
  const resetFields = () => {
    setCaption(initialCaption);
    setPhotos(initialPhotos && initialPhotos.length > 0 ? 
      initialPhotos.map((photoUrl, index) => ({
        uri: photoUrl,
        fileName: `post_photo_${index}.jpg`,
        type: 'image/jpeg',
        isExisting: true
      })) : []);
    setCaptionError('');
    setIsLoading(false);
  };

  // Handle image picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setPhotos(prev => {
        // Filter out duplicates by uri, and limit to MAX_IMAGES
        const uris = new Set(prev.map(img => img.uri));
        const newAssets = result.assets
          .filter(img => !uris.has(img.uri))
          .map(asset => ({
            uri: asset.uri,
            fileName: asset.fileName || `new_photo_${Date.now()}.jpg`,
            type: 'image/jpeg',
            isExisting: false // Mark as new photo
          }));
        const combined = [...prev, ...newAssets].slice(0, MAX_IMAGES);
        return combined;
      });
    }
  };

  // Remove image handler
  const removeImage = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdatePost = async () => {
    // Validate caption (allow empty if there are photos)
    if (!caption.trim() && photos.length === 0) {
      setCaptionError('Please add a caption or at least one photo');
      return;
    }
    
    setCaptionError('');
    setIsLoading(true);

    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Create FormData for the PUT request as expected by the endpoint
      const formData = new FormData();
      formData.append('id', postId.toString());
      formData.append('caption', caption.trim());

      // Handle photos: separate oldphotos (existing URLs) and newphotos (new files)
      const oldphotos = [];
      const newphotos = [];
      
      photos.forEach((img) => {
        if (img.isExisting && img.uri.startsWith('http')) {
          // This is an existing photo URL - add to oldphotos
          oldphotos.push(img.uri);
        } else if (!img.isExisting) {
          // This is a new photo file - add to newphotos
          newphotos.push({
            uri: img.uri,
            name: img.fileName || `post_photo_${Date.now()}.jpg`,
            type: 'image/jpeg'
          });
        }
      });
      
      console.log('Old photos to keep:', oldphotos.length);
      console.log('New photos to upload:', newphotos.length);
      
      // Add oldphotos as individual strings
      oldphotos.forEach((photoUrl) => {
        formData.append('oldphotos', photoUrl);
      });
      
      // Add new photos as 'photos' (backend expects List<MultipartFile> named 'photos')
      if (newphotos.length > 0) {
        newphotos.forEach((img) => {
          formData.append('photos', img); // Backend expects 'photos', not 'newphotos'
        });
      }

      console.log('Updating post with data:', { 
        id: postId, 
        caption: caption.trim(), 
        oldphotos: oldphotos.length, 
        photos: newphotos.length 
      });

      const response = await Axios.put(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/updateResidentPost`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Post update response:', response.status);

      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Post Updated',
        text2: 'Your post has been updated successfully',
        visibilityTime: 3000,
      });

      setIsLoading(false);
      resetFields();
      onClose();
      
      // Notify parent to refresh posts
      if (typeof onPostUpdated === 'function') {
        onPostUpdated();
      }
    } catch (err) {
      console.error('Error updating post:', err);
      setIsLoading(false);
      
      // Show error message
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: err.response?.data?.message || 'Failed to update post. Please try again.',
        visibilityTime: 3000,
      });
    }
  };

  // Handle caption change and clear error
  const handleCaptionChange = (text) => {
    setCaption(text);
    if (captionError) {
      setCaptionError('');
    }
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Post</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerDivider} />
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Caption</Text>
            <TextInput
              placeholder="What's on your mind?"
              value={caption}
              onChangeText={handleCaptionChange}
              style={[styles.textField, captionError ? styles.textFieldError : null]}
              placeholderTextColor="#888"
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            {captionError ? (
              <Text style={styles.errorText}>{captionError}</Text>
            ) : null}
            
            <Text style={styles.characterCount}>
              {caption.length}/500 characters
            </Text>

            {/* Image Section */}
            <Text style={styles.label}>Photos</Text>
            {photos.length > 0 && (
              <View style={styles.imageGrid}>
                {photos.map((img, idx) => (
                  <View key={idx} style={styles.imageWrapper}>
                    <Image source={{ uri: img.uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(idx)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                    {/* Indicator for existing vs new photos */}
                    {img.isExisting && (
                      <View style={styles.existingIndicator}>
                        <MaterialIcons name="cloud-done" size={12} color="#10B981" />
                      </View>
                    )}
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

            {/* Helper text */}
            <Text style={styles.helperText}>
              💡 You can keep existing photos and add new ones. Remove photos by tapping the ✕ button.
            </Text>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.updateButton,
                isLoading && styles.updateButtonDisabled
              ]}
              onPress={handleUpdatePost}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.updateButtonText}>Updating...</Text>
                </View>
              ) : (
                <Text style={styles.updateButtonText}>Update Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

EditPostModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPostUpdated: PropTypes.func.isRequired,
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  initialCaption: PropTypes.string,
  initialPhotos: PropTypes.array,
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  closeButton: {
    padding: 5,
  },
  headerDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.BLACK,
    marginBottom: 8,
  },
  textField: {
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.BLACK,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 120,
    maxHeight: 200,
  },
  textFieldError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  updateButton: {
    flex: 1,
    backgroundColor: Colors.LIGHT_PURPLE,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  updateButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Image picker styles
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 16,
    gap: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#fff',
  },
  existingIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 2,
  },
  addImageTile: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.LIGHT_PURPLE,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
  },
  addImageLabel: {
    fontSize: 12,
    color: Colors.LIGHT_PURPLE,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default EditPostModal;