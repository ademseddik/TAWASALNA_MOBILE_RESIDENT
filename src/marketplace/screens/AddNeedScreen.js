import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '../../../assets/Colors';
import { addNeed } from '../../services/marketplaceNeed.service';

export default function AddNeedScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Validation states
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    } catch (err) {
      console.error('Failed to load user ID:', err);
      Alert.alert('Error', 'Failed to load user information');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Price validation

    if (minPrice && isNaN(parseFloat(minPrice))) {
      newErrors.minPrice = 'Minimum price must be a valid number';
    }
    if (maxPrice && isNaN(parseFloat(maxPrice))) {
      newErrors.maxPrice = 'Maximum price must be a valid number';
    }

    // Price range validation
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      newErrors.maxPrice = 'Maximum price must be greater than minimum price';
    }

    // Date validation
    if (startTime >= endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    setLoading(true);

    try {
      const needData = {
        title: title.trim(),
        description: description.trim(),
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        clientId: userId,
      };
     
      

      // Call the API service
      await addNeed(needData);
      
      // Set refresh flag for when returning to needs screen
      await AsyncStorage.setItem('shouldRefreshNeeds', 'true');
      
      Alert.alert(
        'Success',
        'Need added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding need:', error);
      Alert.alert('Error', 'Failed to add need. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const onStartDateChange = (event, selectedDate) => {
    if (event?.type === 'dismissed') {
      setShowStartDatePicker(false);
      return;
    }
    if (selectedDate) {
      // Merge selected date with existing time
      const merged = new Date(startTime);
      merged.setFullYear(selectedDate.getFullYear());
      merged.setMonth(selectedDate.getMonth());
      merged.setDate(selectedDate.getDate());
      setStartTime(merged);
      setShowStartDatePicker(false);
      setShowStartTimePicker(true);
    }
  };

  const onStartTimeChange = (event, selectedTime) => {
    if (event?.type === 'dismissed') {
      setShowStartTimePicker(false);
      return;
    }
    if (selectedTime) {
      const merged = new Date(startTime);
      merged.setHours(selectedTime.getHours());
      merged.setMinutes(selectedTime.getMinutes());
      merged.setSeconds(0);
      merged.setMilliseconds(0);
      setStartTime(merged);
      setShowStartTimePicker(false);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    if (event?.type === 'dismissed') {
      setShowEndDatePicker(false);
      return;
    }
    if (selectedDate) {
      // Merge selected date with existing time
      const merged = new Date(endTime);
      merged.setFullYear(selectedDate.getFullYear());
      merged.setMonth(selectedDate.getMonth());
      merged.setDate(selectedDate.getDate());
      setEndTime(merged);
      setShowEndDatePicker(false);
      setShowEndTimePicker(true);
    }
  };

  const onEndTimeChange = (event, selectedTime) => {
    if (event?.type === 'dismissed') {
      setShowEndTimePicker(false);
      return;
    }
    if (selectedTime) {
      const merged = new Date(endTime);
      merged.setHours(selectedTime.getHours());
      merged.setMinutes(selectedTime.getMinutes());
      merged.setSeconds(0);
      merged.setMilliseconds(0);
      setEndTime(merged);
      setShowEndTimePicker(false);
    }
  };

  const clearErrors = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name="arrow-left" size={20} color={Colors.LIGHT_PURPLE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Need</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                clearErrors('title');
              }}
              placeholder="Enter need title"
              placeholderTextColor="#9CA3AF"
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                clearErrors('description');
              }}
              placeholder="Describe your need in detail"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Price Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            
       

            {/* Price Range */}
            <View style={styles.priceRangeContainer}>
              <View style={styles.priceRangeInput}>
                <Text style={styles.label}>Min Price</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={[styles.priceInput, errors.minPrice && styles.inputError]}
                    value={minPrice}
                    onChangeText={(text) => {
                      setMinPrice(text);
                      clearErrors('minPrice');
                    }}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
                {errors.minPrice && <Text style={styles.errorText}>{errors.minPrice}</Text>}
              </View>

              <View style={styles.priceRangeDivider} />

              <View style={styles.priceRangeInput}>
                <Text style={styles.label}>Max Price</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={[styles.priceInput, errors.maxPrice && styles.inputError]}
                    value={maxPrice}
                    onChangeText={(text) => {
                      setMaxPrice(text);
                      clearErrors('maxPrice');
                    }}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
                {errors.maxPrice && <Text style={styles.errorText}>{errors.maxPrice}</Text>}
              </View>
            </View>
          </View>

          {/* Timeline Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            
            {/* Start Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Time *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.LIGHT_PURPLE} />
                <Text style={styles.dateText}>{formatDate(startTime)}</Text>
                <FontAwesome name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* End Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Time *</Text>
              <TouchableOpacity
                style={[styles.dateInput, errors.endTime && styles.inputError]}
                onPress={() => setShowEndDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.LIGHT_PURPLE} />
                <Text style={styles.dateText}>{formatDate(endTime)}</Text>
                <FontAwesome name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.WHITE} />
            ) : (
              <>
                <FontAwesome name="plus" size={16} color={Colors.WHITE} />
                <Text style={styles.submitButtonText}>Add Need</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startTime}
          mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {showStartTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour
          display="default"
          onChange={onStartTimeChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endTime}
          mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
          minimumDate={startTime}
        />
      )}

      {showEndTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour
          display="default"
          onChange={onEndTimeChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 36,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  priceRangeInput: {
    flex: 1,
  },
  priceRangeDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    marginBottom: 32,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
