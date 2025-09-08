import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView, Image, Animated, Modal, Dimensions, TouchableWithoutFeedback, TextInput } from 'react-native';
import { getAllServiceCategories, getServicesByCommunityWithFilters } from '../../services/marketplaceService.service';
import Colors from '../../../assets/Colors';
import { BlurView } from 'expo-blur';
import ImageViewing from 'react-native-image-viewing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from 'react-native-vector-icons';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function ServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();
  // Pagination states
  const [page, setPage] = useState(0); // Backend uses 0-indexed pages
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 100000]); // [min, max]
  const [searchTitle, setSearchTitle] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  
  // Price selector states
  const [isPriceSliderActive, setIsPriceSliderActive] = useState(false);
  const [priceInputMode, setPriceInputMode] = useState('slider'); // 'slider' or 'input'

  // Animation states
  const [selectedService, setSelectedService] = useState(null);
  const [isOpeningModal, setIsOpeningModal] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  
  // Image viewer states
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Truncate helper for card descriptions
  const truncateText = (text, max = 30) => {
    if (!text) return '';
    const str = String(text);
    return str.length > max ? str.slice(0, max) + '..' : str;
  };

  // Load user ID on component mount
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        setUserId(id);
      } catch (err) {
        console.error('Failed to load user ID:', err);
      }
    };
    loadUserId();
  }, []);

  // Load categories from backend
  useEffect(() => {
    async function fetchCategories() {
      try {
        const resp = await getAllServiceCategories();
        setCategories(resp.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch all services by default
  const fetchAllServices = async (resetPage = true) => {
    if (!userId) return;
    
    if (resetPage) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    }
    
    setError(null);
    try {
      const pageToFetch = resetPage ? 0 : page;
      
      // Create filters object based on ServiceFilterDTO
      const filters = {
        categoryId: selectedCategory?.id || null,
        searchQuery: searchTitle || null,
        minPrice: priceRange[0] || null,
        maxPrice: priceRange[1] || null,
        dayOfWeek: selectedDayOfWeek || null,
        featureId: selectedFeatureId || null
      };
      
      const resp = await getServicesByCommunityWithFilters(userId, filters, pageToFetch, 10);
      
      if (resetPage) {
        setServices(resp.data.content || []);
      } else {
        setServices(prev => [...prev, ...(resp.data.content || [])]);
      }
      
      setHasMore(!resp.data.last);
      console.log('Fetched services:', resp.data.content?.length || 0, 'Total:', resp.data.totalElements);
    } catch (err) {
      console.error('Failed to load services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  // Load services when user ID is available
  useEffect(() => {
    if (userId) {
      fetchAllServices(true);
    }
  }, [userId]);

  // Load more services function
  const loadMoreServices = async () => {
    if (loadingMore || !hasMore || !userId) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      
      // Create filters object
      const filters = {
        categoryId: selectedCategory?.id || null,
        searchQuery: searchTitle || null,
        minPrice: priceRange[0] || null,
        maxPrice: priceRange[1] || null,
        dayOfWeek: selectedDayOfWeek || null,
        featureId: selectedFeatureId || null
      };
      
      const resp = await getServicesByCommunityWithFilters(userId, filters, nextPage, 10);
      const newServices = resp.data.content || [];
      
      if (newServices.length > 0) {
        setServices(prev => [...prev, ...newServices]);
      setPage(nextPage);
      setHasMore(!resp.data.last);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more services:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Refresh function for pull-to-refresh
  const onRefresh = () => {
    fetchAllServices(true);
  };

  // Apply filters and search
  const applyFilters = () => {
    fetchAllServices(true);
  };

  // Helper functions for filter options
  const getAvailableDays = () => {
    return [
      { label: 'Monday', value: 'Monday' },
      { label: 'Tuesday', value: 'Tuesday' },
      { label: 'Wednesday', value: 'Wednesday' },
      { label: 'Thursday', value: 'Thursday' },
      { label: 'Friday', value: 'Friday' },
      { label: 'Saturday', value: 'Saturday' },
      { label: 'Sunday', value: 'Sunday' }
    ];
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
  };

  const handleDaySelect = (day) => {
    setSelectedDayOfWeek(day);
    setShowDayDropdown(false);
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowCategoryDropdown(false);
    setShowDayDropdown(false);
  };

  // Price selector handlers
  const handlePriceRangeChange = (values) => {
    setPriceRange(values);
    setIsPriceSliderActive(true);
    // Auto-apply after a short delay fofluid experience
    setTimeout(() => {
      setIsPriceSliderActive(false);
    }, 1000);
  };

  const handleMinPriceChange = (text) => {
    const value = parseInt(text) || 0;
    setPriceRange([Math.min(value, priceRange[1]), priceRange[1]]);
  };

  const handleMaxPriceChange = (text) => {
    const value = parseInt(text) || 100000;
    setPriceRange([priceRange[0], Math.max(value, priceRange[0])]);
  };

  const formatPrice = (price) => {
    return price.toLocaleString();
  };

  // Helpers to get service image
  // - getServiceImageUri: returns a URI string for remote images (used by ImageViewing)
  // - getServiceImageSource: returns a valid Image source for React Native <Image/>
  const getServiceImageUri = (service) => {
    if (!service) return null;
    const photo = service.photos;
    if (typeof photo === 'string' && photo.trim().length > 0) {
      const trimmedUri = photo.trim();
      // Basic URL validation
      if (trimmedUri.startsWith('http://') || trimmedUri.startsWith('https://')) {
        return trimmedUri;
      }
    }
    return null;
  };

  const getServiceImageSource = (service) => {
    const uri = getServiceImageUri(service);
    if (uri) return { uri };
    return require('../../../assets/Icons/logo.png');
  };

  // Helper function to get status display info
  const getStatusInfo = (service) => {
    if (service.isArchived) {
      return { text: 'Archived', color: '#888', backgroundColor: '#f0f0f0' };
    }
    return { text: 'Active', color: '#fff', backgroundColor: '#27ae60' };
  };

  const handleSendMessagePress = async (userId,serviceID,fullName,profilePic) => {
    try {
      const currentUserId = await AsyncStorage.getItem("userId");
      if (!currentUserId) {
        return;
      }
      
      const otherUserId = userId;

      // Create chatId by sorting user IDs and joining with underscore
      const ids = [currentUserId, otherUserId].sort();
      const chatId = ids.join('_');
      
      // Extract user IDs for the conversation screen
      const user1ID = ids[0];
      const user2ID = ids[1];

      console.log('🚀 service screen navigation to conversation:', {
        chatId,
        user1ID,
        user2ID,
        serviceId: serviceID,
        userName: fullName
      });

      navigation.navigate('Conversation', {
        chatId: chatId,
        userName: fullName,
        userImage: profilePic,
        user1ID: user1ID,
        user2ID: user2ID,
        serviceId: serviceID,
      });
    } catch (error) {
      console.error("Failed to navigate to conversation:", error);
    }
  };
  // Render rating stars (0..5) with half support
  const renderStars = (rating) => {
    const normalized = Math.max(0, Math.min(5, Number(rating) || 0));
    const fullStars = Math.floor(normalized);
    const hasHalf = normalized - fullStars >= 0.5 && normalized - fullStars < 1 ? 1 : 0;
    const emptyStars = 5 - fullStars - hasHalf;
    const stars = [];
    for (let i = 0; i < fullStars; i++) stars.push('full');
    if (hasHalf) stars.push('half');
    for (let i = 0; i < emptyStars; i++) stars.push('empty');
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {stars.map((type, idx) => (
          <FontAwesome
            key={idx}
            name={type === 'full' ? 'star' : type === 'half' ? 'star-half-empty' : 'star-o'}
            size={14}
            color={'#f1c40f'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  // Format time strings to HH:mm when possible
  const formatTime = (value) => {
    if (!value) return '';
    const str = String(value);
    // Simple HH:mm
    if (/^\d{2}:\d{2}$/.test(str)) return str;
    // Try parse ISO / RFC strings
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return str;
  };

    // Helper to render service card
  const renderServiceItem = ({ item }) => {
    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          style={[styles.card, isOpeningModal && styles.cardPressed]}
          activeOpacity={0.85}
          onPress={() => {
            // Prevent multiple rapid taps
            if (isOpeningModal) return;
            
            console.log('🎯 Service card pressed:', item.id, item.serviceName);
            setIsOpeningModal(true);
            
            // Set the selected service immediately
            setSelectedService(item);
            
            // Use a timeout to ensure the modal is ready
            setTimeout(() => {
              console.log('🚀 Opening modal for service:', item.id);
              setModalVisible(true);
              animation.setValue(0);
              blurAnim.setValue(0);
              
              // Start the animation
              Animated.parallel([
                Animated.spring(animation, { toValue: 1, useNativeDriver: false }),
                Animated.timing(blurAnim, { toValue: 100, duration: 400, useNativeDriver: false })
              ]).start(() => {
                console.log('✅ Modal animation completed for service:', item.id);
                setIsOpeningModal(false);
              });
            }, 50);
          }}
        >
          <View style={styles.imageWrapper}>
            {/* Status badge */}
            {(() => {
              const statusInfo = getStatusInfo(item);
              return (
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                </View>
              );
            })()}
            {/* Floating price tag */}
            <View style={styles.floatingPrice}>
              <Text style={styles.floatingPriceText}>${item.price?.toString() || '0'}</Text>
            </View>
            <Image
              source={getServiceImageSource(item)}
              style={styles.serviceImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('Image loading error for service:', item.id, error.nativeEvent);
              }}
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={1}>{item.serviceName}</Text>
            <Text style={styles.desc}>{truncateText(item.description, 25)}</Text>
            
            {/* Service owner info */}
        
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Remove the old modal functions as they're not needed anymore

  // Animated style for modal card - simplified approach
  const animatedStyle = selectedService
    ? {
        position: 'absolute',
        left: screenWidth / 2 - (screenWidth * 0.95) / 2,
        top: screenHeight / 2 - (screenHeight * 0.8) / 2,
        width: screenWidth * 0.95,
        height: screenHeight * 0.8,
        zIndex: 100,
        borderRadius: 24,
        backgroundColor: '#fff',
        elevation: 10,
        overflow: 'hidden',
        opacity: animation,
        transform: [
          {
            scale: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          },
        ],
      }
    : {};

  // Open image viewer
  const openImageViewer = () => {
    setImageViewerVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7f7' ,marginTop: 10}}>
   
      {loading && !userId ? (
        <View style={styles.center}><ActivityIndicator size="large" /></View>
      ) : error && !userId ? (
        <View style={styles.center}><Text>{error}</Text></View>
      ) : !userId ? (
        <View style={styles.center}>
          <Text style={{ color: '#888', fontSize: 16 }}>Loading user information...</Text>
        </View>
      ) : null}
      {Boolean(userId) && (
        <>
          {/* Header Title */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>
              All Community Services
            </Text>
            <Text style={styles.headerSubtitle}>
              {services.length > 0 ? `${services.length} service${services.length !== 1 ? 's' : ''} found` : 'No services found'}
            </Text>
          </View>
          
          {/* Action Buttons Row - Filter, Search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 12, marginBottom: 4 }}>
            <TouchableOpacity
              style={{ 
                marginRight: 16, 
                backgroundColor: showFilters ? Colors.LIGHT_PURPLE : '#fff', 
                borderRadius: 20, 
                padding: 8, 
                borderWidth: 1, 
                borderColor: Colors.LIGHT_PURPLE, 
                elevation: showFilters ? 2 : 0 
              }}
              onPress={() => setShowFilters(v => !v)}
              activeOpacity={0.7}
            >
              <FontAwesome name="sliders" size={18} color={showFilters ? '#fff' : Colors.LIGHT_PURPLE} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ 
                backgroundColor: showSearch ? Colors.LIGHT_PURPLE : '#fff', 
                borderRadius: 20, 
                padding: 8, 
                borderWidth: 1, 
                borderColor: Colors.LIGHT_PURPLE, 
                elevation: showSearch ? 2 : 0 
              }}
              onPress={() => setShowSearch(v => !v)}
              activeOpacity={0.7}
            >
              <FontAwesome name="search" size={18} color={showSearch ? '#fff' : Colors.LIGHT_PURPLE} />
            </TouchableOpacity>
          </View>
          
          {/* Clear Filters Button - Only show when filters are active */}
          {Boolean(searchTitle || (priceRange[0] > 0 || priceRange[1] < 100000) || selectedCategory || selectedDayOfWeek) && (
            <View style={{ paddingHorizontal: 12, marginBottom: 8 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: '#ddd',
                  alignSelf: 'flex-start'
                }}
                onPress={() => {
                  setSearchTitle('');
                  setPriceRange([0, 100000]);
                  setSelectedCategory(null);
                  setSelectedDayOfWeek(null);
                  setSelectedFeatureId(null);
                  fetchAllServices(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#666', fontSize: 12 }}>Clear All Filters</Text>
              </TouchableOpacity>
        </View>
          )}
          
          {/* Filters UI */}
          {showFilters && (
            <ScrollView 
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={closeAllDropdowns}
            >
              {/* Category Filter */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ marginBottom: 8, color: Colors.LIGHT_PURPLE, fontWeight: 'bold', fontSize: 16 }}>
                  Category
                </Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedCategory ? selectedCategory.title : 'Select Category'}
                  </Text>
                  <FontAwesome name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.LIGHT_PURPLE} />
                </TouchableOpacity>
                
                {showCategoryDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView 
                      style={{ maxHeight: 200 }}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleCategorySelect(null)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemText}>All Categories</Text>
                      </TouchableOpacity>
                      {categories.map(cat => (
                        <TouchableOpacity
                          key={cat.id}
                          style={styles.dropdownItem}
                          onPress={() => handleCategorySelect(cat)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dropdownItemText}>{cat.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Day of Week Filter */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ marginBottom: 8, color: Colors.LIGHT_PURPLE, fontWeight: 'bold', fontSize: 16 }}>
                  Available Day
                </Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDayDropdown(!showDayDropdown)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedDayOfWeek ? selectedDayOfWeek : 'Select Day'}
                  </Text>
                  <FontAwesome name={showDayDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.LIGHT_PURPLE} />
                </TouchableOpacity>
                
                {showDayDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView 
                      style={{ maxHeight: 200 }}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleDaySelect(null)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemText}>Any Day</Text>
                      </TouchableOpacity>
                      {getAvailableDays().map(day => (
                        <TouchableOpacity
                          key={day.value}
                          style={styles.dropdownItem}
                          onPress={() => handleDaySelect(day.value)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dropdownItemText}>{day.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Price Range Filter */}
              <View style={{ marginBottom: 16 }}>
                <View style={styles.priceHeaderContainer}>
                  <Text style={styles.priceHeaderText}>
                    Price Range
                  </Text>
                  <View style={styles.priceModeToggle}>
                    <TouchableOpacity
                      style={[styles.priceModeButton, priceInputMode === 'slider' && styles.priceModeButtonActive]}
                      onPress={() => setPriceInputMode('slider')}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="sliders" size={14} color={priceInputMode === 'slider' ? '#fff' : Colors.LIGHT_PURPLE} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.priceModeButton, priceInputMode === 'input' && styles.priceModeButtonActive]}
                      onPress={() => setPriceInputMode('input')}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="keyboard-o" size={14} color={priceInputMode === 'input' ? '#fff' : Colors.LIGHT_PURPLE} />
                    </TouchableOpacity>
                  </View>
                </View>

                {priceInputMode === 'slider' ? (
                  <View style={styles.sliderContainer}>
                    {/* Price Display */}
                    <View style={styles.priceDisplayContainer}>
                      <View style={styles.priceDisplayItem}>
                        <Text style={styles.priceLabel}>Min</Text>
                        <Text style={styles.priceValue}>${formatPrice(priceRange[0])}</Text>
                      </View>
                      <View style={styles.priceDisplayDivider} />
                      <View style={styles.priceDisplayItem}>
                        <Text style={styles.priceLabel}>Max</Text>
                        <Text style={styles.priceValue}>${formatPrice(priceRange[1])}</Text>
                      </View>
                    </View>

                    {/* Enhanced Slider */}
                    <View style={styles.sliderWrapper}>
                      <MultiSlider
                        values={priceRange}
                        min={0}
                        max={100000}
                        step={50}
                        onValuesChange={handlePriceRangeChange}
                        selectedStyle={{ 
                          backgroundColor: Colors.LIGHT_PURPLE,
                          height: 4,
                          borderRadius: 2
                        }}
                        unselectedStyle={{ 
                          backgroundColor: '#E0E0E0',
                          height: 4,
                          borderRadius: 2
                        }}
                        markerStyle={{ 
                          backgroundColor: Colors.PURPLE,
                          borderWidth: 3,
                          borderColor: '#fff',
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          elevation: 4,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 4,
                        }}
                        containerStyle={{ marginHorizontal: 12, marginVertical: 20 }}
                        trackStyle={{ height: 4, borderRadius: 2 }}
                      />
                    </View>

                    {/* Price Indicators */}
                    <View style={styles.priceIndicators}>
                      <Text style={styles.priceIndicator}>$0</Text>
                      <Text style={styles.priceIndicator}>$1,000</Text>
                      <Text style={styles.priceIndicator}>$2,000</Text>
                      <Text style={styles.priceIndicator}>$3,000</Text>
                      <Text style={styles.priceIndicator}>$4,000</Text>
                      <Text style={styles.priceIndicator}>$5,000</Text>
                    </View>

                    {/* Auto-apply indicator */}
                    {isPriceSliderActive && (
                      <View style={styles.autoApplyIndicator}>
                        <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
                        <Text style={styles.autoApplyText}>Auto-applying...</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.priceInputContainer}>
                    <View style={styles.priceInputRow}>
                      <View style={styles.priceInputWrapper}>
                        <Text style={styles.priceInputLabel}>Min Price</Text>
                        <View style={styles.priceInputField}>
                          <Text style={styles.priceInputPrefix}>$</Text>
            <TextInput
                            style={styles.priceInput}
                            value={priceRange[0].toString()}
                            onChangeText={handleMinPriceChange}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#999"
                          />
                        </View>
                      </View>
                      <View style={styles.priceInputDivider} />
                      <View style={styles.priceInputWrapper}>
                        <Text style={styles.priceInputLabel}>Max Price</Text>
                        <View style={styles.priceInputField}>
                          <Text style={styles.priceInputPrefix}>$</Text>
                          <TextInput
                            style={styles.priceInput}
                            value={priceRange[1].toString()}
                            onChangeText={handleMaxPriceChange}
                            keyboardType="numeric"
                            placeholder="100000"
                            placeholderTextColor="#999"
                          />
                        </View>
                      </View>
                    </View>
          </View>
        )}
      </View>

              {/* Apply Filters Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.LIGHT_PURPLE,
                  borderRadius: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginTop: 8
                }}
                onPress={applyFilters}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Apply Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
          
          {/* Search UI */}
          {showSearch && (
            <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginTop: 4, alignItems: 'center', marginBottom: 4 }}>
              <TextInput
                placeholder="Search service name or description"
                value={searchTitle}
                onChangeText={setSearchTitle}
                style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#eee' }}
              />
              <TouchableOpacity
                onPress={applyFilters}
                style={{ marginLeft: 8, backgroundColor: Colors.LIGHT_PURPLE, borderRadius: 8, padding: 8 }}
              >
                <FontAwesome name="search" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowSearch(false);
                  setSearchTitle('');
                  applyFilters();
                }}
                style={{ marginLeft: 4, padding: 8 }}
              >
                <FontAwesome name="close" size={18} color={Colors.LIGHT_PURPLE} />
              </TouchableOpacity>
      </View>
          )}
          
          {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" /></View>
          ) : error ? (
            <View style={styles.center}><Text>{error}</Text></View>
          ) : !services.length ? (
            <View style={styles.emptyState}>
              <Image source={require('../../../assets/Icons/NoInternet.png')} style={{ width: 80, height: 80, marginBottom: 10 }} />
              <Text style={styles.emptyText}>
                No services found in your community.
              </Text>
            </View>
          ) : (
      <FlatList
        data={services}
              numColumns={2}
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={renderServiceItem}
              contentContainerStyle={{ padding: 8, paddingBottom: 32 }}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
        onEndReached={loadMoreServices}
        onEndReachedThreshold={0.1}
              refreshing={loading && !loadingMore}
        onRefresh={onRefresh}
        ListFooterComponent={
          loadingMore ? (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
                    <Text style={{ marginTop: 8, color: Colors.LIGHT_PURPLE, fontSize: 14 }}>
                      Loading more services...
                    </Text>
            </View>
          ) : null
        }
            />
          )}
        </>
      )}
      
      {/* Animated Modal Overlay */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1 }}>
          {/* Backdrop that closes on outside press only */}
          <TouchableWithoutFeedback
            onPress={() => {
              Animated.parallel([
                Animated.timing(animation, { toValue: 0, duration: 200, useNativeDriver: false }),
                                      Animated.timing(blurAnim, { toValue: 0, duration: 500, useNativeDriver: false })
                    ]).start(() => {
                      setModalVisible(false);
                      setSelectedService(null);
                      setIsOpeningModal(false);
                    });
            }}
          >
            <AnimatedBlurView style={StyleSheet.absoluteFill} intensity={blurAnim} tint="dark" />
          </TouchableWithoutFeedback>

          {Boolean(selectedService) && (
            <Animated.View style={animatedStyle} pointerEvents="box-none">
              <View style={{ flex: 1, backgroundColor: '#fff' }}>
                  <View style={styles.imageWrapper}>
                    <TouchableOpacity activeOpacity={0.9} onPress={openImageViewer} style={{ width: '100%', height: '100%' }}>
                      <Image
                        source={getServiceImageSource(selectedService)}
                        style={[styles.serviceImage, { width: '100%' }]}
                        resizeMode="cover"
                        onError={(error) => {
                          console.log('Modal image loading error for service:', selectedService.id, error.nativeEvent);
                        }}
                      />
                    </TouchableOpacity>
                    {/* Floating price on image (modal) */}
                    <View style={[styles.floatingPrice, { top: undefined, bottom: 8 }]}>
                      <Text style={styles.floatingPriceText}>${selectedService.price?.toString() || '0'}</Text>
                    </View>
                    {(() => {
                      const statusInfo = getStatusInfo(selectedService);
                      return (
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                        </View>
                      );
                    })()}
                  </View>

                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.title, { fontSize: 18, marginBottom: 8, flex: 1 }]} numberOfLines={2}>
                        {selectedService.serviceName || 'Service'}
                      </Text>
                    </View>

                    {/* Rating & reviews */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      {renderStars(selectedService.averageStars || 0)}
                      <Text style={{ marginLeft: 6, color: '#666', fontSize: 12 }}>
                        {Number(selectedService.averageStars || 0).toFixed(1)} ({selectedService.totalReviews || 0})
                      </Text>
                    </View>

                    {/* Owner */}
                    {Boolean(selectedService.owner) && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Image
                          source={{ uri: selectedService.owner.image || 'https://via.placeholder.com/28' }}
                          style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }}
                          defaultSource={require('../../../assets/default-avatar.jpg')}
                        />
                        <Text style={{ color: Colors.LIGHT_PURPLE, fontSize: 15, fontWeight: '600' }}>
                          {selectedService.owner.name || 'Unknown Owner'}
                        </Text>
                      </View>
                    )}

                    {/* Quick info chips */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                      {Boolean(selectedService.category?.title) && (
                        <View style={styles.infoTag}>
                          <Text style={styles.infoTagText}>Category: {selectedService.category.title}</Text>
                        </View>
                      )}
                      {selectedService.deliveryTimeInHours !== undefined && selectedService.deliveryTimeInHours !== null && (
                        <View style={styles.infoTag}>
                          <Text style={styles.infoTagText}>Delivery: {selectedService.deliveryTimeInHours}h</Text>
                        </View>
                      )}
                      {selectedService.isArchived === false && (
                        <View style={styles.infoTag}>
                          <Text style={styles.infoTagText}>Status: Active</Text>
                        </View>
                      )}
                      {selectedService.isArchived === true && (
                        <View style={styles.infoTag}>
                          <Text style={styles.infoTagText}>Status: Archived</Text>
                        </View>
                      )}
                    </View>

                    {/* Description */}
                    <Text style={[styles.desc, { lineHeight: 20 }]}>
                      {selectedService.description || 'No description available'}
                    </Text>

                    {/* Features with descriptions */}
                    {selectedService.features?.length > 0 && (
                      <View style={{ marginTop: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.LIGHT_PURPLE, marginBottom: 10 }}>
                          Features
                        </Text>
                        {selectedService.features.map((feature) => (
                          <View key={feature.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <FontAwesome name="check" size={14} color={Colors.LIGHT_PURPLE} style={{ marginRight: 8 }} />
                                <Text style={{ color: '#333', fontSize: 14, fontWeight: '600', flexShrink: 1 }}>
                                  {feature.title || 'Feature'}
                                </Text>
                              </View>
                              <Text style={{ color: '#2e7d32', fontWeight: '700' }}>
                                ${feature.price?.toString() || '0'}
                              </Text>
                            </View>
                            {feature.description ? (
                              <Text style={{ color: '#666', marginTop: 4, fontSize: 13 }}>{feature.description}</Text>
                            ) : null}
                            {feature.isBase ? (
                              <View style={[styles.infoTag, { alignSelf: 'flex-start', marginTop: 6 }]}> 
                                <Text style={styles.infoTagText}>Base</Text>
                              </View>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Availability with times */}
                    {selectedService.availability?.length > 0 && (
                      <View style={{ marginTop: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.LIGHT_PURPLE, marginBottom: 10 }}>
                          Availability
                        </Text>
                        {selectedService.availability.map((avail) => (
                          <View key={avail.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                            <FontAwesome name="calendar" size={14} color={Colors.LIGHT_PURPLE} style={{ marginRight: 8 }} />
                            <Text style={{ color: '#333', width: 95 }}>{avail.dayOfWeek || 'Day'}</Text>
                            <View style={[styles.infoTag, { backgroundColor: avail.available ? '#e8f5e9' : '#ffebee' }]}>
                              <Text style={[styles.infoTagText, { color: avail.available ? '#2e7d32' : '#c62828' }]}>
                                {avail.available ? 'Available' : 'Unavailable'}
                              </Text>
                            </View>
                            {avail.available ? (
                              <Text style={{ marginLeft: 8, color: '#666' }}>
                                {formatTime(avail.startTime)} - {formatTime(avail.endTime)}
                              </Text>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    )}
                  </ScrollView>

                  {/* Actions */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                    onPress={() => handleSendMessagePress(selectedService.owner.OwnerId, selectedService.id, selectedService.owner.name, selectedService.owner.image)} 
                    style={[styles.modalActionButton, { backgroundColor: Colors.LIGHT_PURPLE }]} activeOpacity={0.7}>
                      <AntDesign name="message1" size={16} color={Colors.WHITE} />
                      <Text style={styles.modalActionText}>Contact</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
                    onPress={() => {
                      Animated.parallel([
                        Animated.timing(animation, { toValue: 0, duration: 200, useNativeDriver: false }),
                        Animated.timing(blurAnim, { toValue: 0, duration: 200, useNativeDriver: false })
                      ]).start(() => {
                        setModalVisible(false);
                        setSelectedService(null);
                        setIsOpeningModal(false);
                      });
                    }}
                  >
                    <Text style={{ fontSize: 18, color: '#888' }}>✕</Text>
                  </TouchableOpacity>
                </View>
            </Animated.View>
          )}
        </View>
      </Modal>

      {/* Full Screen Image Viewer */}
      {Boolean(selectedService && getServiceImageUri(selectedService)) && (
        <ImageViewing
          images={[{ uri: getServiceImageUri(selectedService) }]}
          imageIndex={0}
          visible={imageViewerVisible}
          onRequestClose={() => setImageViewerVisible(false)}
          swipeToCloseEnabled
          doubleTapToZoomEnabled
          presentationStyle="overFullScreen"
          onImageIndexChange={() => {}} // Prevent index changes since we only have one image
          backgroundComponent={() => (
            <BlurView intensity={100} tint='light' style={{ flex: 1 }}>
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: 'rgba(187, 177, 202, 0.18)'
                }}
              />
            </BlurView>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.LIGHT_PURPLE,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  cardWrapper: {
    flex: 1,
    margin: 6,
    minWidth: 160,
    maxWidth: '48%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    marginBottom: 4,
    height: 220, // Slightly taller for services
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    aspectRatio: 1.2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    minHeight: 38,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
    color: '#222',
    textAlign: 'left',
    width: '100%',
    flexShrink: 1,
    minHeight: 18,
  },
  desc: {
    color: '#666',
    fontSize: 13,
    textAlign: 'left',
    marginTop: 2,
    width: '100%',
  },
  priceWrapper: {
    width: '100%',
    paddingHorizontal: 10,
    paddingBottom: 8,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  price: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 8,
  },
  floatingPrice: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(44,44,44,0.7)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
    alignSelf: 'flex-end',
  },
  floatingPriceText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  imageCountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  modalImageCounter: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  modalImageCounterText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.LIGHT_PURPLE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.LIGHT_PURPLE,
    marginTop: 4,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  // Price Selector Styles
  priceHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceHeaderText: {
    color: Colors.LIGHT_PURPLE,
    fontWeight: 'bold',
    fontSize: 16,
  },
  priceModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 2,
  },
  priceModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    marginHorizontal: 2,
  },
  priceModeButtonActive: {
    backgroundColor: Colors.LIGHT_PURPLE,
  },
  sliderContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  priceDisplayItem: {
    alignItems: 'center',
    flex: 1,
  },
  priceDisplayDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.LIGHT_PURPLE,
  },
  sliderWrapper: {
    marginVertical: 8,
  },
  priceIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceIndicator: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  autoApplyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  autoApplyText: {
    fontSize: 12,
    color: Colors.LIGHT_PURPLE,
    marginLeft: 6,
    fontWeight: '500',
  },
  priceInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  priceInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priceInputPrefix: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    padding: 0,
  },
  priceInputDivider: {
    width: 20,
    height: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 12,
    marginTop: 20,
  },
  // Modal styles
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 90,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  modalActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  infoTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  infoTagText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  priceContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  // Service-specific styles
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ownerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  ownerName: {
    fontSize: 12,
    color: Colors.LIGHT_PURPLE,
    fontWeight: '600',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  deliveryText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
}); 