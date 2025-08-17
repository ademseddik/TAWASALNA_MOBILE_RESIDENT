import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllProductCategories, updateProductForResident, updateProductForResidentJSON } from '../../services/marketplaceProduct.service';
import Colors from '../../../assets/Colors';
import { APP_ENV } from '../../utils/BaseUrl';
import SuccessAlert from '../../components/pupUps/SuccessAlert';

const MAX_IMAGES = 5;

export default function EditProductScreen({ navigation, route }) {
  const { product } = route.params; // Product data passed from navigation
  
  const [category, setCategory] = useState(null);
  const [brand, setBrand] = useState(product?.brand || '');
  const [model, setModel] = useState(product?.model || '');
  const [title, setTitle] = useState(product?.productName || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // Success alert state
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  
  // Collapsible states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Search states
  const [categorySearch, setCategorySearch] = useState('');

  // Load categories from backend and set initial category
  useEffect(() => {
    async function fetchCategories() {
      setLoadingCategories(true);
      try {
        const resp = await getAllProductCategories();
        setCategories(resp.data || []);
        
        // Set the initial category if product has one
        if (product?.productCategory) {
          // Use the productCategory from the API response
          setCategory(product.productCategory);
        } else if (product?.categoryId) {
          // Fallback to categoryId if productCategory is not available
          const productCategory = resp.data?.find(cat => cat.id === product.categoryId);
          if (productCategory) {
            setCategory(productCategory);
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, [product]);

  // Initialize photos from product data
  useEffect(() => {
    if (product?.photos && product.photos.length > 0) {
      // Convert URLs to image objects for display
      const photoObjects = product.photos.map((photoUrl, index) => ({
        uri: photoUrl,
        fileName: `product_${index}.jpg`,
        type: 'image/jpeg'
      }));
      setPhotos(photoObjects);
    }
  }, [product]);

  const handleCategoryChange = (selectedCategory) => {
    setCategory(selectedCategory);
    setShowCategoryDropdown(false);
    setCategorySearch('');
  };

  // Close dropdown when tapping outside
  const closeDropdowns = () => {
    setShowCategoryDropdown(false);
    setCategorySearch('');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES,
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

  // Remove image handler
  const removeImage = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Filter functions for search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!title || !description || !price) {
      setError('Please fill all required fields (Title, Description, and Price).');
      return;
    }

    if (!category) {
      setError('Please select a category.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem('USER_ACCESS');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      
      // Add basic product information as per ResidentEditProductDTO
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', parseFloat(price));
      formData.append('categoryId', category.id);
      
      if (brand) {
        formData.append('brand', brand);
      }
      if (model) {
        formData.append('model', model);
      }
      
      // Handle photos: separate oldphotos (URIs) and newphotos (files)
      const oldphotos = [];
      const newphotos = [];
      
      photos.forEach((img) => {
        if (img.uri.startsWith('http')) {
          // This is an existing photo URL - add to oldphotos
          oldphotos.push(img.uri);
        } else {
          // This is a new photo file - add to newphotos
          newphotos.push({
            uri: img.uri,
            name: img.fileName || `product_${Date.now()}.jpg`,
            type: 'image/jpeg'
          });
        }
      });
      
      console.log('Old photos to keep:', oldphotos);
      console.log('New photos to upload:', newphotos.length);
      
      // Add oldphotos as individual strings (backend expects List<String>)
      // Always send oldphotos, even if empty, to avoid null issues
      oldphotos.forEach((photoUrl) => {
        formData.append('oldphotos', photoUrl);
      });
      
      // Add newphotos as files
      if (newphotos.length > 0) {
        newphotos.forEach((img) => {
          formData.append('newphotos', img);
        });
      }

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await updateProductForResident(product.id, formData, token);

      console.log('Product updated successfully:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      setShowSuccessAlert(true);
      
    } catch (error) {
      console.error('Error updating product:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to update product. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* Return Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <FontAwesome name="arrow-left" size={20} color={Colors.LIGHT_PURPLE} />
        </TouchableOpacity>
        <Text style={styles.header}>Edit Product</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={closeDropdowns}
      >
      {/* Category Selection */}
      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Product title"
      />
      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Product description"
        multiline
      />
      {/* Price */}
      <Text style={styles.label}>Price *</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="0.00"
        keyboardType="numeric"
      />
            {error ? <Text style={styles.error}>{error}</Text> : null}
      
      {/* Image Picker */}
      <Text style={styles.label}>Product Images</Text>
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
      
      {/* Helpful Message */}
      <View style={styles.helpMessage}>
        <FontAwesome name="info-circle" size={17}width={20} height={20} color={Colors.LIGHT_PURPLE} style={{ marginRight: 8 }} />
        <Text style={styles.helpText}>
          Filling in Category, Brand, and Model helps other users find your product more easily! Brand and Model are optional.
        </Text>
      </View>
      <Text style={styles.label}>Category</Text>
      {loadingCategories ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.selectionButton}
          onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          activeOpacity={0.7}
          disabled={loadingCategories}
        >
          <Text style={category ? styles.selectedText : styles.placeholderText}>
            {category ? category.name : 'Select Category'}
          </Text>
          <FontAwesome 
            name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={Colors.LIGHT_PURPLE} 
          />
        </TouchableOpacity>
      )}
      
      {showCategoryDropdown && (
        <View style={styles.dropdownContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={categorySearch}
            onChangeText={setCategorySearch}
          />
          <ScrollView 
            style={styles.dropdownScroll} 
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {filteredCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.dropdownItem, category?.id === cat.id && styles.selectedDropdownItem]}
                onPress={() => handleCategoryChange(cat)}
                activeOpacity={0.7}
              >
                <Text style={category?.id === cat.id ? styles.selectedDropdownText : styles.dropdownText}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {/* Brand Selection */}
      <Text style={styles.label}>Brand (Optional)</Text>
      <TextInput
        style={styles.input}
        value={brand || ''}
        onChangeText={setBrand}
        placeholder="Enter brand name"
      />
      {/* Model Selection */}
      <Text style={styles.label}>Model (Optional)</Text>
      <TextInput
        style={styles.input}
        value={model || ''}
        onChangeText={setModel}
        placeholder="Enter model name"
      />
      
      <TouchableOpacity 
        style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.submitBtnText}>Updating...</Text>
          </View>
        ) : (
          <Text style={styles.submitBtnText}>Update Product</Text>
        )}
      </TouchableOpacity>
      </ScrollView>
      
      {/* Success Alert */}
      <SuccessAlert
        visible={showSuccessAlert}
        title="Product Updated!"
        message="Your product has been successfully updated."
        onClose={() => {
          setShowSuccessAlert(false);
          navigation.goBack();
        }}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  returnButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  placeholder: {
    width: 40,
  },
  container: {
    padding: 18,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedText: {
    color: Colors.PURPLE,
    fontWeight: 'bold',
    fontSize: 16,
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
    maxHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 1000,
  },
  searchInput: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 10,
    margin: 8,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 14,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  helpMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    marginTop: 10,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.LIGHT_PURPLE,
  },
  helpText: {
    flex: 1,
    color: Colors.LIGHT_PURPLE,
    fontSize: 14,
    lineHeight: 20,
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
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.PURPLE,
  },
  label: {
    fontWeight: 'bold',
    color: Colors.LIGHT_PURPLE,
    marginTop: 10,
    marginBottom: 4,
  },
  dropdownWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  dropdownItem: {
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedDropdownItem: {
    backgroundColor: Colors.LIGHT_PURPLE,
  },
  dropdownText: {
    color: '#444',
  },
  selectedDropdownText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  error: {
    color: 'red',
    marginBottom: 8,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: Colors.PURPLE,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: Colors.LIGHT_PURPLE,
    fontSize: 14,
  },
});
