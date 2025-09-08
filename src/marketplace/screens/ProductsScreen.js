import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView, Image, Animated, Modal, Dimensions, TouchableWithoutFeedback, TextInput } from 'react-native';
import { getProductsByCommunityWithFilters, getAllProductCategories, markProductAsSold, markProductAsAvailable, archiveProduct, aiSearchProducts } from '../../services/marketplaceProduct.service';
import { PRODUCT_CATEGORIES } from '../data/productOptions';
import Colors from '../../../assets/Colors';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import ImageViewing from 'react-native-image-viewing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from 'react-native-vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import SuccessAlert from '../../components/pupUps/SuccessAlert';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useNavigation } from '@react-navigation/native';


const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [aiMode, setAiMode] = useState(false);
  
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
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Price selector states
  const [isPriceSliderActive, setIsPriceSliderActive] = useState(false);
  const [priceInputMode, setPriceInputMode] = useState('slider'); // 'slider' or 'input'

  // Animation states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cardLayout, setCardLayout] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef(null);
  
  // Image gallery states
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Image viewer states
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const navigation = useNavigation();

  // Success alert states
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
        const resp = await getAllProductCategories();
        setCategories(resp.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Pulse animation for AI loader
  const startPulseAnimation = () => {
    if (pulseLoopRef.current) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();
  };

  useEffect(() => {
    if (aiLoading) {
      startPulseAnimation();
    } else {
      if (pulseLoopRef.current) {
        pulseLoopRef.current.stop();
        pulseLoopRef.current = null;
      }
      pulseAnim.setValue(1);
    }
    return () => {
      if (pulseLoopRef.current) {
        pulseLoopRef.current.stop();
        pulseLoopRef.current = null;
      }
    };
  }, [aiLoading, pulseAnim]);

  // Fetch all products by default
  const fetchAllProducts = async (resetPage = true) => {
    if (!userId) return;
    
    if (resetPage) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    }
    
    setError(null);
    try {
      const pageToFetch = resetPage ? 0 : page;
      
      // Create filters object
      const filters = {
        categoryId: selectedCategory?.id || null,
        searchQuery: searchTitle || null,
        minPrice: priceRange[0] || null,
        maxPrice: priceRange[1] || null,
        brand: selectedBrand?.label || null,
        model: selectedModel || null
      };
      
      const resp = await getProductsByCommunityWithFilters(userId, filters, pageToFetch, 10);
      
      if (resetPage) {
        setProducts(resp.data.content || []);
      } else {
        setProducts(prev => [...prev, ...(resp.data.content || [])]);
      }
      
      setHasMore(!resp.data.last);
      console.log('Fetched products:', resp.data.content?.length || 0, 'Total:', resp.data.totalElements);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Load products when user ID is available
  useEffect(() => {
    if (userId) {
      fetchAllProducts(true);
    }
  }, [userId]);

  // Load more products function
  const loadMoreProducts = async () => {
    if (aiMode || loadingMore || !hasMore || !userId) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      
      // Create filters object
      const filters = {
        categoryId: selectedCategory?.id || null,
        searchQuery: searchTitle || null,
        minPrice: priceRange[0] || null,
        maxPrice: priceRange[1] || null,
        brand: selectedBrand?.label || null,
        model: selectedModel || null
      };
      
      const resp = await getProductsByCommunityWithFilters(userId, filters, nextPage, 10);
      const newProducts = resp.data.content || [];
      
      if (newProducts.length > 0) {
        setProducts(prev => [...prev, ...newProducts]);
        setPage(nextPage);
        setHasMore(!resp.data.last);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more products:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Refresh function for pull-to-refresh
  const onRefresh = () => {
    if (aiMode) {
      runAiSearch();
    } else {
      fetchAllProducts(true);
    }
  };

  // AI search
  const runAiSearch = async () => {
    const query = (searchTitle || '').trim();
    if (!query) {
      setAiMode(false);
      fetchAllProducts(true);
      return;
    }
    setError(null);
    setAiLoading(true);
    setAiMode(true);
    try {
      const resp = await aiSearchProducts(query);
      const data = Array.isArray(resp.data) ? resp.data : (resp.data?.content || []);
      setProducts(data || []);
      setHasMore(false);
      setPage(0);
    } catch (err) {
      console.error('AI search failed:', err);
      setError('AI search failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Apply filters and search
  const applyFilters = () => {
    if ((searchTitle || '').trim()) {
      runAiSearch();
    } else {
      setAiMode(false);
      fetchAllProducts(true);
    }
  };

  // Helper functions for filter options
  const getAvailableBrands = () => {
    if (!selectedCategory) return [];
    const categoryData = PRODUCT_CATEGORIES.find(cat => cat.label === selectedCategory.name);
    return categoryData?.brands || [];
  };

  const getAvailableModels = () => {
    if (!selectedBrand) return [];
    return selectedBrand.models || [];
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedBrand(null);
    setSelectedModel(null);
    setShowCategoryDropdown(false);
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setShowBrandDropdown(false);
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setShowModelDropdown(false);
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowCategoryDropdown(false);
    setShowBrandDropdown(false);
    setShowModelDropdown(false);
  };

  // Price selector handlers
  const handlePriceRangeChange = (values) => {
    setPriceRange(values);
    setIsPriceSliderActive(true);
    // Auto-apply after a short delay for fluid experience
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

  // Helper to get product images array
  const getProductImages = (product) => {
    if (!product) return [];
    // Use photos array if available, otherwise fall back to single image
    return product.photos && product.photos.length > 0 ? product.photos : [product.image];
  };

  // Helper function to get status display info
  const getStatusInfo = (product) => {
    if (product.isArchived) {
      return { text: 'Archived', color: '#888', backgroundColor: '#f0f0f0' };
    }
    
    switch (product.status) {
      case 'SOLD':
        return { text: 'Sold', color: '#fff', backgroundColor: '#e74c3c' };
      case 'FOR_SALE':
        return { text: 'For Sale', color: '#fff', backgroundColor: '#27ae60' };
      case 'RESERVED':
        return { text: 'Reserved', color: '#fff', backgroundColor: '#f39c12' };
      default:
        return { text: 'Active', color: '#fff', backgroundColor: '#3498db' };
    }
  };

  const handleSendMessagePress = async (userId,productId,fullName,profilePic) => {
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

      console.log('🚀 UsersProfile navigation to conversation:', {
        chatId,
        user1ID,
        user2ID,
        productId: productId,
        userName: fullName
      });

      navigation.navigate('Conversation', {
        chatId: chatId,
        userName: fullName,
        userImage: profilePic,
        user1ID: user1ID,
        user2ID: user2ID,
        productId: productId,
      });
    } catch (error) {
      console.error("Failed to navigate to conversation:", error);
    }
  };
  // Helper to render product card
  const renderProductItem = ({ item }) => {
    const productImages = getProductImages(item);
    const imageCount = productImages.length;
    const isOwner = String(item?.publisher?.publisherId) === String(userId);
    
    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={event => {
            event.persist(); // Prevent synthetic event reuse warning
            setTimeout(() => {
              if (event.target && event.target.measure) {
                event.target.measure((fx, fy, width, height, px, py) => {
                  setCardLayout({ x: px, y: py, width, height });
                  setSelectedProduct(item);
                  setCurrentImageIndex(0);
                  setModalVisible(true);
                  animation.setValue(0);
                  blurAnim.setValue(0);
                  Animated.parallel([
                    Animated.spring(animation, { toValue: 1, useNativeDriver: false }),
                    Animated.timing(blurAnim, { toValue: 100, duration: 400, useNativeDriver: false })
                  ]).start();
                });
              }
            }, 0);
          }}
        >
          <View style={styles.imageWrapper}>
            {/* Image count badge */}
            {imageCount > 1 && (
              <View style={styles.imageCountBadge}>
                <Text style={styles.imageCountText}>{imageCount}</Text>
              </View>
            )}
            {/* Owner badge */}
            {isOwner && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>Yours</Text>
              </View>
            )}
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
              <Text style={styles.floatingPriceText}>${item.price}</Text>
            </View>
            <Image
              source={item.image ? { uri: item.image } : require('../../../assets/Icons/logo.png')}
              style={styles.productImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={1}>{item.productName || item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Animated style for modal card
  const animatedStyle = cardLayout && selectedProduct
    ? {
        position: 'absolute',
        left: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [cardLayout.x, screenWidth / 2 - (screenWidth * 0.95) / 2],
        }),
        top: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [cardLayout.y, screenHeight / 2 - (screenHeight * 0.8) / 2],
        }),
        width: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [cardLayout.width, screenWidth * 0.95],
        }),
        height: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [cardLayout.height, screenHeight * 0.8],
        }),
        zIndex: 100,
        borderRadius: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 24],
        }),
        backgroundColor: '#fff',
        elevation: 10,
        overflow: 'hidden',
      }
    : {};

  // Handle image swipe - handled via ScrollView momentum

  // Open image viewer
  const openImageViewer = () => {
    setImageViewerIndex(currentImageIndex);
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
      {userId && (
        <>
          {/* Header Title */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>
              All Community Products
            </Text>
            <Text style={styles.headerSubtitle}>
              {products.length > 0 ? `${products.length} product${products.length !== 1 ? 's' : ''} found` : 'No products found'}
            </Text>
          </View>
          
          {/* Action Buttons Row - All buttons in same line with responsive gaps */}
          <View style={styles.actionButtonsContainer}>
            {/* Add Product Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.addProductButton]}
              onPress={() => navigation.navigate('AddProduct')}
              activeOpacity={0.7}
            >
              <FontAwesome name="plus" size={16} color={Colors.LIGHT_PURPLE} style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>Add Product</Text>
            </TouchableOpacity>
            
            {/* My Products Dashboard Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.myProductsButton]}
              onPress={() => navigation.navigate('UserProductsDashboard')}
              activeOpacity={0.7}
            >
              <FontAwesome name="list" size={16} color={Colors.LIGHT_PURPLE} style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>My Products</Text>
            </TouchableOpacity>
            
            {/* Filter Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.filterButton, showFilters && styles.activeButton]}
              onPress={() => setShowFilters(v => !v)}
              activeOpacity={0.7}
            >
              <FontAwesome name="sliders" size={18} color={showFilters ? '#fff' : Colors.LIGHT_PURPLE} />
            </TouchableOpacity>
            
            {/* Search Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.searchButton, showSearch && styles.activeButton]}
              onPress={() => setShowSearch(v => !v)}
              activeOpacity={0.7}
            >
              <FontAwesome name="search" size={18} color={showSearch ? '#fff' : Colors.LIGHT_PURPLE} />
            </TouchableOpacity>
          </View>
          
          {/* Clear Filters Button - Only show when filters are active */}
          {(searchTitle || (priceRange[0] > 0 || priceRange[1] < 100000) || selectedCategory || selectedBrand || selectedModel) && (
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
                  setSelectedBrand(null);
                  setSelectedModel(null);
                  fetchAllProducts(true);
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
               style={{ Height: 600  }}
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
                    {selectedCategory ? selectedCategory.name : 'Select Category'}
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
                          <Text style={styles.dropdownItemText}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Brand Filter */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ marginBottom: 8, color: Colors.LIGHT_PURPLE, fontWeight: 'bold', fontSize: 16 }}>
                  Brand
                </Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, !selectedCategory && styles.dropdownButtonDisabled]}
                  onPress={() => selectedCategory && setShowBrandDropdown(!showBrandDropdown)}
                  activeOpacity={0.7}
                  disabled={!selectedCategory}
                >
                  <Text style={[styles.dropdownButtonText, !selectedCategory && styles.dropdownButtonTextDisabled]}>
                    {selectedBrand ? selectedBrand.label : 'Select Brand'}
                  </Text>
                  <FontAwesome name={showBrandDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={selectedCategory ? Colors.LIGHT_PURPLE : '#ccc'} />
                </TouchableOpacity>
                
                {showBrandDropdown && selectedCategory && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView 
                      style={{ maxHeight: 200 }}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleBrandSelect(null)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemText}>All Brands</Text>
                      </TouchableOpacity>
                      {getAvailableBrands().map(brand => (
                        <TouchableOpacity
                          key={brand.key}
                          style={styles.dropdownItem}
                          onPress={() => handleBrandSelect(brand)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dropdownItemText}>{brand.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Model Filter */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ marginBottom: 8, color: Colors.LIGHT_PURPLE, fontWeight: 'bold', fontSize: 16 }}>
                  Model
                </Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, !selectedBrand && styles.dropdownButtonDisabled]}
                  onPress={() => selectedBrand && setShowModelDropdown(!showModelDropdown)}
                  activeOpacity={0.7}
                  disabled={!selectedBrand}
                >
                  <Text style={[styles.dropdownButtonText, !selectedBrand && styles.dropdownButtonTextDisabled]}>
                    {selectedModel ? selectedModel : 'Select Model'}
                  </Text>
                  <FontAwesome name={showModelDropdown ? 'chevron-up' : 'chevron-down'} size={16} color={selectedBrand ? Colors.LIGHT_PURPLE : '#ccc'} />
                </TouchableOpacity>
                
                {showModelDropdown && selectedBrand && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView 
                      style={{ maxHeight: 200 }}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleModelSelect(null)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownItemText}>All Models</Text>
                      </TouchableOpacity>
                      {getAvailableModels().map(model => (
                        <TouchableOpacity
                          key={model}
                          style={styles.dropdownItem}
                          onPress={() => handleModelSelect(model)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dropdownItemText}>{model}</Text>
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
            <View style={{ paddingHorizontal: 12, marginTop: 4, marginBottom: 4 }}>
              <View style={styles.aiSearchContainer}>
                <FontAwesome name="magic" size={18} color={Colors.LIGHT_PURPLE} style={{ marginHorizontal: 8 }} />
                <TextInput
                  placeholder="Example: I want a big television that ..."
                  value={searchTitle}
                  onChangeText={setSearchTitle}
                  onSubmitEditing={applyFilters}
                  style={styles.aiSearchInput}
                  placeholderTextColor="#9aa0a6"
                />
                <TouchableOpacity onPress={applyFilters} style={styles.aiSearchButton} activeOpacity={0.7}>
                  <FontAwesome name="search" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowSearch(false);
                    setSearchTitle('');
                    setAiMode(false);
                    fetchAllProducts(true);
                  }}
                  style={styles.aiSearchClear}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="close" size={18} color={Colors.LIGHT_PURPLE} />
                </TouchableOpacity>
              </View>
              {aiMode && !aiLoading && (
                <Text style={{ marginTop: 6, marginLeft: 8, color: Colors.LIGHT_PURPLE, fontSize: 12 }}>
                  AI results for: "{searchTitle}"
                </Text>
              )}
            </View>
          )}
          {aiLoading ? (
            <View style={styles.center}>
              <Animated.View style={[{ transform: [{ scale: pulseAnim }] }, styles.aiLottieShadow]}> 
                <LottieView
                  source={require('../../../assets/animations/AI_Loading_Animation.json')}
                  autoPlay
                  loop
                  style={{ width: 200, height: 200 }}
                />
              </Animated.View>
              <Text style={{ marginTop: 8, color: Colors.LIGHT_PURPLE, fontSize: 14 }}>Searching with AI...</Text>
            </View>
          ) : loading ? (
            <View style={styles.center}><ActivityIndicator size="large" /></View>
          ) : error ? (
            <View style={styles.center}><Text>{error}</Text></View>
          ) : !products.length ? (
            <View style={styles.emptyState}>
              <Image source={require('../../../assets/Icons/NoInternet.png')} style={{ width: 80, height: 80, marginBottom: 10 }} />
              <Text style={styles.emptyText}>
                No products found in your community.
              </Text>
            </View>
          ) : (
            <FlatList
              data={products}
              numColumns={2}
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              renderItem={renderProductItem}
              contentContainerStyle={{ padding: 8, paddingBottom: 32 }}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              onEndReached={loadMoreProducts}
              onEndReachedThreshold={0.1}
              refreshing={loading && !loadingMore}
              onRefresh={onRefresh}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
                    <Text style={{ marginTop: 8, color: Colors.LIGHT_PURPLE, fontSize: 14 }}>
                      Loading more products...
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
        <TouchableWithoutFeedback
          onPress={() => {
            Animated.parallel([
              Animated.timing(animation, { toValue: 0, duration: 200, useNativeDriver: false }),
              Animated.timing(blurAnim, { toValue: 0, duration: 500, useNativeDriver: false })
            ]).start(() => {
              setModalVisible(false);
              setSelectedProduct(null);
              setCardLayout(null);
              setCurrentImageIndex(0);
            });
          }}
        >
          <View style={{ flex: 1 }}>
            <AnimatedBlurView
              style={StyleSheet.absoluteFill}
              intensity={blurAnim}
              tint="dark"
            />
            {selectedProduct && cardLayout && (
              <Animated.View
                style={animatedStyle}
                pointerEvents="box-none" // allow touches to pass through to close
              >
                <View style={styles.imageWrapper}>
                  {/* Image Gallery with Swipe */}
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(event) => {
                      const offset = event.nativeEvent.contentOffset.x;
                      const index = Math.round(offset / screenWidth);
                      setCurrentImageIndex(index);
                    }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    {getProductImages(selectedProduct).map((imageUri, index) => (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={1}
                        onPress={openImageViewer}
                        style={{ width: screenWidth * 0.95, height: '100%' }}
                      >
                        <Image
                          source={{ uri: imageUri }}
                          style={[styles.productImage, { width: screenWidth * 0.95 }]}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  {/* Image counter */}
                  {getProductImages(selectedProduct).length > 1 && (
                    <View style={styles.modalImageCounter}>
                      <Text style={styles.modalImageCounterText}>
                        {currentImageIndex + 1} / {getProductImages(selectedProduct).length}
                      </Text>
                    </View>
                  )}
                  
                  {/* Status badge */}
                  {(() => {
                    const statusInfo = getStatusInfo(selectedProduct);
                    return (
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                      </View>
                    );
                  })()}
                </View>
                <View style={[styles.cardContent, { paddingHorizontal: 20, paddingTop: 16 }]}>
                  <Text style={[styles.title, { fontSize: 18, marginBottom: 8 }]} numberOfLines={1}>{selectedProduct.productName || selectedProduct.title}</Text>
                  
                  {/* Publisher Info */}
                  {selectedProduct.publisher && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Image
                        source={{ uri: selectedProduct.publisher.image }}
                        style={{ width: 28, height: 28, borderRadius: 14, marginRight: 10 }}
                        defaultSource={require('../../../assets/default-avatar.jpg')}
                      />
                      <Text style={{ color: Colors.LIGHT_PURPLE, fontSize: 15, fontWeight: '600' }}>
                        {selectedProduct.publisher.businessName || selectedProduct.publisher.name}
                      </Text>
                    </View>
                  )}
                  
                  {/* Brand and Model if available */}
                  {(selectedProduct.brand || selectedProduct.model) && (
                    <View style={{ flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap' }}>
                      {selectedProduct.brand && (
                        <View style={styles.infoTag}>
                          <Text style={styles.infoTagText}>Brand: {selectedProduct.brand}</Text>
                        </View>
                      )}
                      {selectedProduct.model && (
                        <View style={styles.infoTag}>
                          <Text style={styles.infoTagText}>Model: {selectedProduct.model}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Show full description */}
                  <Text style={styles.desc}>{selectedProduct.description}</Text>
                </View>
                
                <View style={[styles.priceWrapper, { paddingHorizontal: 20, paddingBottom: 16 }]}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>${selectedProduct.price}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  {String(selectedProduct?.publisher?.publisherId) === String(userId) ? (
                    <>
                      <TouchableOpacity
                        style={[styles.modalActionButton, { backgroundColor: Colors.LIGHT_PURPLE }]}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('EditProduct', { product: selectedProduct })}
                      >
                        <FontAwesome name="edit" size={16} color="#fff" />
                        <Text style={styles.modalActionText}>Edit</Text>
                      </TouchableOpacity>

                      {String(selectedProduct.status).toUpperCase() === 'FOR_SALE' ? (
                        <TouchableOpacity
                          style={[styles.modalActionButton, { backgroundColor: '#27ae60' }]}
                          activeOpacity={0.7}
                          onPress={async () => {
                            try {
                              await markProductAsSold(selectedProduct.id);
                              setSuccessMessage(`"${selectedProduct.productName}" marked as sold successfully!`);
                              setShowSuccessAlert(true);
                              // Update local state
                              setSelectedProduct(prev => ({ ...prev, status: 'SOLD' }));
                              // Refresh list
                              fetchAllProducts(true);
                            } catch (e) {}
                          }}
                        >
                          <FontAwesome name="check" size={16} color="#fff" />
                          <Text style={styles.modalActionText}>Mark Sold</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.modalActionButton, { backgroundColor: '#f39c12' }]}
                          activeOpacity={0.7}
                          onPress={async () => {
                            try {
                              await markProductAsAvailable(selectedProduct.id);
                              setSuccessMessage(`"${selectedProduct.productName}" marked as available successfully!`);
                              setShowSuccessAlert(true);
                              setSelectedProduct(prev => ({ ...prev, status: 'FOR_SALE' }));
                              fetchAllProducts(true);
                            } catch (e) {}
                          }}
                        >
                          <FontAwesome name="refresh" size={16} color="#fff" />
                          <Text style={styles.modalActionText}>Mark Available</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.modalActionButton, { backgroundColor: '#888' }]}
                        activeOpacity={0.7}
                        onPress={async () => {
                          try {
                            await archiveProduct(selectedProduct.id);
                            setSuccessMessage(`"${selectedProduct.productName}" archived successfully!`);
                            setShowSuccessAlert(true);
                            fetchAllProducts(true);
                          } catch (e) {}
                        }}
                      >
                        <FontAwesome name="archive" size={16} color="#fff" />
                        <Text style={styles.modalActionText}>Archive</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                     

                      <TouchableOpacity 
                        style={[styles.modalActionButton, { backgroundColor: Colors.LIGHT_PURPLE }]}
                        activeOpacity={0.7}
                        onPress={() => handleSendMessagePress(selectedProduct.publisher.publisherId, selectedProduct.id, selectedProduct.publisher.name, selectedProduct.publisher.image)}          
                      >
                        <AntDesign name="message1" size={16} color={Colors.WHITE} />
                        <Text style={styles.modalActionText}>Send Message</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                </View>
                <TouchableOpacity
                  style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
                  onPress={e => {
                    e.stopPropagation();
                    Animated.parallel([
                      Animated.timing(animation, { toValue: 0, duration: 200, useNativeDriver: false }),
                      Animated.timing(blurAnim, { toValue: 0, duration: 200, useNativeDriver: false })
                    ]).start(() => {
                      setModalVisible(false);
                      setSelectedProduct(null);
                      setCardLayout(null);
                      setCurrentImageIndex(0);
                    });
                  }}
                >
                  <Text style={{ fontSize: 18, color: '#888' }}>✕</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Full Screen Image Viewer */}
      {selectedProduct && (
        <ImageViewing
          images={getProductImages(selectedProduct).map(uri => ({ uri }))}
          imageIndex={imageViewerIndex}
          visible={imageViewerVisible}
          onRequestClose={() => setImageViewerVisible(false)}
          swipeToCloseEnabled
          doubleTapToZoomEnabled
          presentationStyle="overFullScreen"
          backgroundComponent={() => (
            <BlurView intensity={100} tint='light' style={{ flex: 1 }}>
              <View style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: 'rgba(187, 177, 202, 0.18)'
              }} />
            </BlurView>
          )}
        />
      )}
      {/* Success alert for owner actions */}
      <SuccessAlert
        visible={showSuccessAlert}
        title="Success!"
        message={successMessage}
        onClose={() => setShowSuccessAlert(false)}
      />
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
  header: {
    fontWeight: 'bold',
    fontSize: 26,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
    color: Colors.LIGHT_PURPLE,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(44,44,44,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: Colors.PURPLE,
    paddingLeft: 12,
    backgroundColor: 'rgba(245,245,255,0.5)',
    borderRadius: 8,
  },
  categoryScroll: {
    paddingHorizontal: 8,
    marginBottom: 8,
    minHeight: 56,
  },
  categoryChip: {
    backgroundColor: Colors.LIGHT_WHITE,
    borderRadius: 20,
    paddingHorizontal: 20,
    marginHorizontal: 6,
    marginVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.LIGHT_PURPLE,
    height: 48, // Fixed height
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChipSelected: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderColor: Colors.PURPLE,
    elevation: 4,
    shadowColor: Colors.LIGHT_PURPLE,
  },
  categoryText: {
    fontWeight: 'bold',
    color: Colors.PURPLE,
    fontSize: 15,
  },
  categoryTextSelected: {
    color: Colors.WHITE,
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
    height: 210, // Slightly reduced card height
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1.2, // Slightly less tall image
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImage: {
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
  ownerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.PURPLE,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  ownerBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
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
  filterChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.LIGHT_PURPLE,
    elevation: 1,
  },
  filterChipSelected: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderColor: Colors.PURPLE,
  },
  filterChipText: {
    color: Colors.PURPLE,
    fontWeight: '500',
    fontSize: 14,
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  filterInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
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
  dropdownButtonDisabled: {
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownButtonTextDisabled: {
    color: '#999',
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
  // New modal styles
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    minWidth: 80,
  
    justifyContent: 'center',
    marginRight: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  modalActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
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
  // Action Buttons Styles
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 4,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.LIGHT_PURPLE,
    elevation: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
   
  },
  addProductButton: {
    flex: 2,
    paddingHorizontal: 13,
  },
  myProductsButton: {
    flex: 2,
    paddingHorizontal: 20,
  },
  filterButton: {
    flex: 1,
    paddingHorizontal: 8,
  },
  searchButton: {
    flex: 1,
    paddingHorizontal: 8,
  },
  activeButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    elevation: 2,
  },
  actionButtonText: {
    color: Colors.LIGHT_PURPLE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  aiLottieShadow: {
    shadowColor: Colors.LIGHT_PURPLE,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 120,
    backgroundColor: 'transparent',
  },
  aiSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 6,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: Colors.LIGHT_PURPLE,
  },
  aiSearchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 14,
    color: '#222',
  },
  aiSearchButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 6,
  },
  aiSearchClear: {
    padding: 8,
    marginLeft: 2,
  },
  statusBadgeBottom: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  statusTextBottom: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
}); 