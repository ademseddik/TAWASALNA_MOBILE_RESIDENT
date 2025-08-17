import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';


import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateNeed } from '../../services/marketplaceNeed.service';
import Colors from '../../../assets/Colors';

import SuccessAlert from '../../components/pupUps/SuccessAlert';



export default function EditNeedScreen({ navigation, route }) {
    const { Need: product } = route.params; // Product data passed from navigation
  
 
  const [title, setTitle] = useState(product?.needTitle || '');
  const [description, setDescription] = useState(product?.description || '');
  const [Minprice, setMinPrice] = useState(product?.minPrice?.toString() || '');
  const [Maxprice, setMaxPrice] = useState(product?.maxPrice?.toString() || '');
  const [error, setError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  
  // Success alert state
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  









 

  const handleSubmit = async () => {
    if (!title || !description || !Maxprice || !Minprice) {
      setError('Please fill all required fields (Title, Description, and Prices).');
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

      const updateData = {
        title: title,
        description: description,
        minPrice: parseFloat(Minprice), // Make sure Minprice state is correct
        maxPrice: parseFloat(Maxprice)  // Make sure Maxprice state is correct
    };
      
     
      
      // Handle photos: separate oldphotos (URIs) and newphotos (files)
   
      const response = await updateNeed(product.id, updateData);

      console.log('Need updated successfully:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      setShowSuccessAlert(true);
      
    } catch (error) {
      console.error('Error updating need:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to update need. Please try again.');
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
        <Text style={styles.header}>Edit Need</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        
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

      <Text style={styles.label}>Min Price </Text>
<TextInput
  style={styles.input}
  value={Minprice} // <-- Controls Minprice state
  onChangeText={setMinPrice}
  placeholder="0.00"
  keyboardType="numeric"
/>

<Text style={styles.label}>Max Price </Text>
<TextInput
  style={styles.input}
  value={Maxprice} // <-- Controls Maxprice state
  onChangeText={setMaxPrice}
  placeholder="0.00"
  keyboardType="numeric"
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
          <Text style={styles.submitBtnText}>Update Need</Text>
        )}
      </TouchableOpacity>
      </ScrollView>
      
      {/* Success Alert */}
      <SuccessAlert
        visible={showSuccessAlert}
        title="Need Updated!"
        message="Your Need has been successfully updated."
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
