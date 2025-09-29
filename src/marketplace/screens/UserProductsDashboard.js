import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Animated, 
  Modal, 
  Dimensions, 
  TouchableWithoutFeedback, 
  Alert,
  RefreshControl 
} from 'react-native';
import SuccessAlert from '../../components/pupUps/SuccessAlert';
import { 
  getUserProducts, 
  markProductAsSold, 
  markProductAsAvailable, 
  archiveProduct, 
  unarchiveProduct,
  deleteProduct
} from '../../services/marketplaceProduct.service';
import Colors from '../../../assets/Colors';
import { BlurView } from 'expo-blur';
import ImageViewing from 'react-native-image-viewing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function UserProductsDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cardLayout, setCardLayout] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Image viewer states
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  
  // Success alert states
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const navigation = useNavigation();

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

  // Fetch user products
  const fetchUserProducts = async (resetPage = true) => {
    if (!userId) return;
    
    if (resetPage) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    }
    
    setError(null);
    try {
      const pageToFetch = resetPage ? 0 : page;
      const resp = await getUserProducts(userId, pageToFetch, 10);
      
      if (resetPage) {
        setProducts(resp.data.content || []);
      } else {
        setProducts(prev => [...prev, ...(resp.data.content || [])]);
      }
      
      setHasMore(!resp.data.last);
      console.log('Fetched user products:', resp.data.content?.length || 0, 'Total:', resp.data.totalElements);
    } catch (err) {
      console.error('Failed to load user products:', err);
      setError('Failed to load your products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load products when user ID is available
  useEffect(() => {
    if (userId) {
      fetchUserProducts(true);
    }
  }, [userId]);
  
  // Auto-refresh when returning from AddProduct screen
  useFocusEffect(
    useCallback(() => {
      const checkAndRefresh = async () => {
        try {
          const shouldRefresh = await AsyncStorage.getItem('shouldRefreshProducts');
          if (shouldRefresh === 'true') {
            await AsyncStorage.removeItem('shouldRefreshProducts');
            if (userId) {
              fetchUserProducts(true);
            }
          }
        } catch (error) {
          console.error('Error checking refresh flag:', error);
        }
      };
      
      checkAndRefresh();
    }, [userId, fetchUserProducts])
  );

  // Load more products function
  const loadMoreProducts = async () => {
    if (loadingMore || !hasMore || !userId) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const resp = await getUserProducts(userId, nextPage, 10);
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
    setRefreshing(true);
    fetchUserProducts(true);
  };

  // Helper to get product images array
  const getProductImages = (product) => {
    if (!product) return [];
    return product.photos && product.photos.length > 0 ? product.photos : [product.image];
  };

  // Action handlers with API integration
  const handleEditProduct = (product) => {
    navigation.navigate('EditProduct', { product });
  };

  const handleDeleteProduct = async (product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              setSuccessMessage(`"${product.productName}" deleted successfully!`);
              setShowSuccessAlert(true);
              fetchUserProducts(true); // Refresh the list
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleMarkAsSold = async (product) => {
    try {
      await markProductAsSold(product.id);
      setSuccessMessage(`"${product.productName}" marked as sold successfully!`);
      setShowSuccessAlert(true);
      
      // Update the product in the list
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, status: 'SOLD' } : p
      ));
      
      // Update the selected product in modal if it's the same product
      if (selectedProduct && selectedProduct.id === product.id) {
        setSelectedProduct(prev => ({ ...prev, status: 'SOLD' }));
      }
    } catch (error) {
      console.error('Error marking product as sold:', error);
      Alert.alert('Error', 'Failed to mark product as sold. Please try again.');
    }
  };

  const handleMarkAsAvailable = async (product) => {
    try {
      await markProductAsAvailable(product.id);
      setSuccessMessage(`"${product.productName}" marked as available successfully!`);
      setShowSuccessAlert(true);
      
      // Update the product in the list
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, status: 'FOR_SALE' } : p
      ));
      
      // Update the selected product in modal if it's the same product
      if (selectedProduct && selectedProduct.id === product.id) {
        setSelectedProduct(prev => ({ ...prev, status: 'FOR_SALE' }));
      }
    } catch (error) {
      console.error('Error marking product as available:', error);
      Alert.alert('Error', 'Failed to mark product as available. Please try again.');
    }
  };

  const handleArchiveProduct = async (product) => {
    try {
      await archiveProduct(product.id);
      setSuccessMessage(`"${product.productName}" archived successfully!`);
      setShowSuccessAlert(true);
      
      // Update the product in the list
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, isArchived: true } : p
      ));
      
      // Update the selected product in modal if it's the same product
      if (selectedProduct && selectedProduct.id === product.id) {
        setSelectedProduct(prev => ({ ...prev, isArchived: true }));
      }
    } catch (error) {
      console.error('Error archiving product:', error);
      Alert.alert('Error', 'Failed to archive product. Please try again.');
    }
  };

  const handleUnarchiveProduct = async (product) => {
    try {
      await unarchiveProduct(product.id);
      setSuccessMessage(`"${product.productName}" unarchived successfully!`);
      setShowSuccessAlert(true);
      
      // Update the product in the list
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, isArchived: false } : p
      ));
      
      // Update the selected product in modal if it's the same product
      if (selectedProduct && selectedProduct.id === product.id) {
        setSelectedProduct(prev => ({ ...prev, isArchived: false }));
      }
    } catch (error) {
      console.error('Error unarchiving product:', error);
      Alert.alert('Error', 'Failed to unarchive product. Please try again.');
    }
  };





  // Helper function to get status display info
  const getStatusInfo = (product) => {
    // Handle null isArchived values - treat as false (not archived)
    const isArchived = product.isArchived === true;
    
    if (isArchived) {
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

  // Helper to render product card
  const renderProductItem = ({ item }) => {
    const productImages = getProductImages(item);
    const imageCount = productImages.length;
    
    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={event => {
            event.persist();
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
            <Text style={styles.title} numberOfLines={1}>{item.productName}</Text>
            <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
            
            {/* Quick action buttons */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleEditProduct(item)}
                activeOpacity={0.7}
              >
                <FontAwesome name="edit" size={12} color={Colors.LIGHT_PURPLE} />
              </TouchableOpacity>
              {item.status === 'FOR_SALE' && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => handleMarkAsSold(item)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="check" size={12} color="#27ae60" />
                </TouchableOpacity>
              )}
              {item.status === 'SOLD' && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => handleMarkAsAvailable(item)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="refresh" size={12} color="#f39c12" />
                </TouchableOpacity>
              )}
              {item.isArchived !== true ? (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => handleArchiveProduct(item)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="archive" size={12} color="#e74c3c" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => handleUnarchiveProduct(item)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="archive" size={12} color="#3498db" />
                </TouchableOpacity>
              )}
            </View>
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

  // Open image viewer
  const openImageViewer = () => {
    setImageViewerIndex(currentImageIndex);
    setImageViewerVisible(true);
  };

  // Dashboard stats
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + product.price, 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
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
          {/* Dashboard Header */}
          <View style={styles.dashboardHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome name="arrow-left" size={20} color={Colors.LIGHT_PURPLE} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>My Products Dashboard</Text>
                <Text style={styles.headerSubtitle}>Manage your marketplace listings</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddProduct')}
                activeOpacity={0.7}
              >
                <FontAwesome name="plus" size={16} color="#fff" />
                <Text style={styles.addButtonText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <FontAwesome name="cube" size={20} color={Colors.LIGHT_PURPLE} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{totalProducts}</Text>
                <Text style={styles.statLabel}>Total Products</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <FontAwesome name="dollar" size={20} color="#2e7d32" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>${totalValue.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </View>
            </View>
          </View>

          {/* Products Section */}
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Products</Text>
              <Text style={styles.sectionSubtitle}>
                {products.length > 0 ? `${products.length} product${products.length !== 1 ? 's' : ''} listed` : 'No products yet'}
              </Text>
            </View>

            {loading ? (
              <View style={styles.center}><ActivityIndicator size="large" /></View>
            ) : error ? (
              <View style={styles.center}><Text>{error}</Text></View>
            ) : !products.length ? (
              <View style={styles.emptyState}>
                <Image source={require('../../../assets/Icons/logo.png')} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No Products Yet</Text>
                <Text style={styles.emptyText}>
                  Start selling by adding your first product to the marketplace.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => navigation.navigate('AddProduct')}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="plus" size={16} color="#fff" />
                  <Text style={styles.emptyActionText}>Add Your First Product</Text>
                </TouchableOpacity>
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
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[Colors.LIGHT_PURPLE]}
                    tintColor={Colors.LIGHT_PURPLE}
                  />
                }
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
          </View>
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
                pointerEvents="box-none"
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
                      <View style={[styles.modalStatusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
                        <Text style={[styles.modalStatusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                      </View>
                    );
                  })()}
                </View>
                
                <View style={[styles.cardContent, { paddingHorizontal: 20, paddingTop: 16 }]}>
                  <Text style={[styles.title, { fontSize: 18, marginBottom: 8 }]} numberOfLines={1}>{selectedProduct.productName}</Text>
                  
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
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.editButton]}
                    onPress={() => handleEditProduct(selectedProduct)}
                    activeOpacity={0.7}
                  >
                    <FontAwesome name="edit" size={16} color="#fff" />
                    <Text style={styles.modalActionText}>Edit</Text>
                  </TouchableOpacity>
                  
                  {/* Status Management Buttons */}
                  {selectedProduct.status === 'FOR_SALE' && (
                    <TouchableOpacity
                      style={[styles.modalActionButton, { backgroundColor: '#27ae60' }]}
                      onPress={() => handleMarkAsSold(selectedProduct)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="check" size={16} color="#fff" />
                      <Text style={styles.modalActionText}>Mark Sold</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedProduct.status === 'SOLD' && (
                    <TouchableOpacity
                      style={[styles.modalActionButton, { backgroundColor: '#f39c12' }]}
                      onPress={() => handleMarkAsAvailable(selectedProduct)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="refresh" size={16} color="#fff" />
                      <Text style={styles.modalActionText}>Mark Available</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Archive/Unarchive Buttons */}
                  {selectedProduct.isArchived === true ? (
                    <TouchableOpacity
                      style={[styles.modalActionButton, { backgroundColor: '#3498db' }]}
                      onPress={() => handleUnarchiveProduct(selectedProduct)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="unarchive" size={16} color="#fff" />
                      <Text style={styles.modalActionText}>Unarchive</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.archiveButton]}
                      onPress={() => handleArchiveProduct(selectedProduct)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="archive" size={16} color="#fff" />
                      <Text style={styles.modalActionText}>Archive</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Delete Action */}
              
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
      
      {/* Success Alert */}
      <SuccessAlert
        visible={showSuccessAlert}
        title="Success!"
        message={successMessage}
        onClose={() => setShowSuccessAlert(false)}
        autoClose={true}
        autoCloseDelay={2500}
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
  dashboardHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.LIGHT_PURPLE,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  productsSection: {
    flex: 1,
  },
  sectionHeader: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.LIGHT_PURPLE,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyActionButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
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
    height: 240,
    overflow: 'hidden',
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
    marginBottom: 8,
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
  priceContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    bottom: 8,
    left: 8,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 4,
  },
  quickActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  modalStatusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalStatusText: {
    fontWeight: 'bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
    minWidth: 90,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  editButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
  },
  archiveButton: {
    backgroundColor: '#ff9800',
  },
  deleteButton: {
    backgroundColor: '#f44336',
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
});
