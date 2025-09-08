import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Colors from '../../../assets/Colors';
import { useConversation } from './useConversation';
import { conversationStyles as styles } from './ConversationScreen.styles';
import { markProductAsSold, markProductAsAvailable } from '../../services/marketplaceProduct.service';
import { BlurView } from 'expo-blur';
import SuccessAlert from '../../components/pupUps/SuccessAlert';
import NoticeAlert from '../../components/pupUps/NoticeAlert';

// ============================================================================
// COMPONENTS
// ============================================================================

const DateSeparator = ({ date }) => (
  <View style={styles.dateSeparatorContainer}>
    <View style={styles.dateSeparatorLine} />
    <Text style={styles.dateSeparatorText}>{date}</Text>
    <View style={styles.dateSeparatorLine} />
  </View>
);

DateSeparator.propTypes = {
  date: PropTypes.string.isRequired,
};

const SuggestedMessages = ({ onSelectMessage }) => (
  <View style={styles.suggestionContainer}>
    <Text style={styles.suggestionTitle}>
      You haven't messaged each other yet. Start the conversation!
    </Text>
    <View style={styles.suggestionRow}>
      <TouchableOpacity 
        style={styles.suggestionButton} 
        onPress={() => onSelectMessage('Hi!')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.suggestionText}>Hi!</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.suggestionButton} 
        onPress={() => onSelectMessage('How are you?')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.suggestionText}>How are you?</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Facebook-style typing indicator component
const TypingIndicator = () => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dot1Anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 1,
            duration: 400,
            delay: 200,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 1,
            duration: 400,
            delay: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dot1Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animateDots());
    };

    animateDots();

    return () => {
      dot1Anim.stopAnimation();
      dot2Anim.stopAnimation();
      dot3Anim.stopAnimation();
    };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={styles.typingIndicatorContainer}>
      <View style={styles.typingIndicatorBox}>
        <Animated.View
          style={[
            styles.typingDot,
            {
              opacity: dot1Anim,
              transform: [
                {
                  scale: dot1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            {
              opacity: dot2Anim,
              transform: [
                {
                  scale: dot2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            {
              opacity: dot3Anim,
              transform: [
                {
                  scale: dot3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
};

SuggestedMessages.propTypes = {
  onSelectMessage: PropTypes.func.isRequired,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ConversationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [filterHidden, setFilterHidden] = useState(false);
  const [filterHeight, setFilterHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const filterTranslateY = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef(null);
  
  // Success alert state (reused component)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(null); // 'sold' | 'available' | null
  const [showInfoAlert, setShowInfoAlert] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  // Add mark as sold functionality
  const handleMarkAsSold = async (productId) => {
    try {
      setStatusUpdateLoading('sold');
      await markProductAsSold(productId);
      // Optimistic UI: flip status to SOLD so other button appears immediately
      if (selectedFilter?.type === ITEM_TYPES.PRODUCT && selectedFilter?.data) {
        const updated = {
          ...selectedFilter,
          data: { ...selectedFilter.data, status: 'SOLD' },
        };
        await handleFilterSelect(updated);
      }
      const name = selectedFilter?.data?.productName || selectedFilter?.title || 'Product';
      setSuccessMessage(`"${name}" marked as sold successfully!\nNow no one can send you messages about this product.\n But you can mark it as available at any time.`);
      setShowSuccessAlert(true);
      // Background refresh to ensure consistency
      refreshFilterData();
    } catch (error) {
      console.error('Error marking product as sold:', error);
      alert('Failed to mark product as sold. Please try again.');
    } finally {
      setStatusUpdateLoading(null);
    }
  };
  
  // Add mark as available functionality
  const handleMarkAsAvailable = async (productId) => {
    try {
      setStatusUpdateLoading('available');
      await markProductAsAvailable(productId);
      // Optimistic UI: flip status to FOR_SALE so other button appears immediately
      if (selectedFilter?.type === ITEM_TYPES.PRODUCT && selectedFilter?.data) {
        const updated = {
          ...selectedFilter,
          data: { ...selectedFilter.data, status: 'FOR_SALE' },
        };
        await handleFilterSelect(updated);
      }
      const name = selectedFilter?.data?.productName || selectedFilter?.title || 'Product';
      setSuccessMessage(`"${name}" marked as available successfully!`);
      setShowSuccessAlert(true);
      // Background refresh to ensure consistency
      refreshFilterData();
    } catch (error) {
      console.error('Error marking product as available:', error);
      alert('Failed to mark product as available. Please try again.');
    } finally {
      setStatusUpdateLoading(null);
    }
  };
  
  // ============================================================================
  // CUSTOM HOOK
  // ============================================================================
  
  const {
    // State
    navigationSource,
    conversationExists,
    isRoomCreated,
    currentUserId,
    otherUserId,
    messages,
    loading,
    // initialLoading is not exposed; use current loading when no chat yet
    messageInput,
    page,
    loadingMore,
    hasMore,
    isSocketConnected,
    otherUserIsTyping,
    modalVisible,
    selectedMessage,
    isEditing,
    editText,
    tappedMessageId,
    showProfileSection,
    filterItems,
    selectedFilter,
    filterDetailsVisible,
    loadingFilters,
    isTransitioningFilter,
    
    // Refs
    flatListRef,
    headerFadeAnim,
    headerSlideAnim,
    profileSectionOpacity,
    
    // Functions
    setModalVisible,
    setFilterDetailsVisible,
    handleFilterSelect,
    handleTextInputChange,
    handleMessagePress,
    handleLongPress,
    startEdit,
    cancelEdit,
    confirmEdit,
    confirmDelete,
    handleSendMessage,
    handleImageSelection,
    fetchMoreMessages,
    refreshFilterData,
    
    // Data
    decoratedData,
    formatTime,
    
    // Constants
    NAVIGATION_SOURCES,
    ITEM_TYPES,
  } = useConversation(route.params);

  // Computed: when other participant tries to message about a SOLD product
  const isProductSoldAndNotOwner =
    selectedFilter?.type === ITEM_TYPES.PRODUCT &&
    String(selectedFilter?.data?.status).toUpperCase() === 'SOLD' &&
    String(selectedFilter?.data?.publisher?.publisherId) !== String(currentUserId);

  const handleShowSoldNotice = () => {
    const name = selectedFilter?.data?.productName || selectedFilter?.title || 'This product';
    setInfoMessage(`${name} has been sold. You cannot discuss about this product.`);
    setShowInfoAlert(true);
  };

  // ----------------------------------------------------------------------------
  // Glass filter show/hide behavior
  // ----------------------------------------------------------------------------
  const cancelHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleHide = () => {
    cancelHideTimer();
    hideTimerRef.current = setTimeout(() => {
      const target = -(filterHeight ? filterHeight + 16 : 100);
      Animated.timing(filterTranslateY, {
        toValue: target,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setFilterHidden(true));
    }, loadingFilters || isTransitioningFilter ? 3200 : 2000);
  };

  const showFilterBar = () => {
    cancelHideTimer();
    if (filterHidden) {
      Animated.timing(filterTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setFilterHidden(false);
        scheduleHide();
      });
    } else {
      // already visible; restart hide timer
      scheduleHide();
    }
  };

  useEffect(() => {
    // auto-hide shortly after mount when filters are present
    if (filterItems.length > 1) {
      scheduleHide();
    }
    return () => {
      cancelHideTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterItems.length, filterHeight]);

  // ============================================================================
  // MESSAGE RENDERING
  // ============================================================================
  
  const renderMessage = (message) => {
    if (message.deletedBy && message.deletedBy.includes(currentUserId)) {
      return null;
    }

    const isCurrentUser = message.senderId === currentUserId;
    const isUnsent = message.deleted;
    const isImageMessage = !!(message.image || message.imageUri);

    const bubbleStyle = isUnsent 
      ? styles.unsentBubble
      : [styles.messageBubble, 
         isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
         isImageMessage && { padding: 4, backgroundColor: 'transparent' }
       ];

    const messageContent = isUnsent 
      ? (isCurrentUser ? "You unsent a message" : "This message was unsent") 
      : message.message;
      
    const messageTextStyle = isUnsent ? styles.unsentText : [
      styles.messageText, 
      isCurrentUser ? { color: Colors.WHITE } : { color: Colors.LIGHT_BLACK }
    ];

    return (
      <View style={{ marginVertical: 1 }}>
        <TouchableOpacity
          onLongPress={() => handleLongPress(message)}
          onPress={() => handleMessagePress(message.id)}
          activeOpacity={0.8}
          disabled={isUnsent}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <View style={[styles.messageContainer, isCurrentUser && styles.currentUserContainer]}>
            {!isCurrentUser && !isUnsent && (
              <Image
                source={{ uri: message.userImage || 'https://i.ibb.co/cXTTnFdP/profile-photo.jpg' }}
                style={styles.messageAvatar}
                resizeMode="cover"
              />
            )}
            <View style={bubbleStyle}>
              {isImageMessage ? (
                <View>
                  <Image
                    source={{ uri: message.image || message.imageUri }}
                    style={styles.chatImage}
                    resizeMode="cover"
                  />
                  {message.sending && (
                    <View style={styles.imageLoader}>
                      <ActivityIndicator size="small" color={Colors.WHITE} />
                    </View>
                  )}
                </View>
              ) : (
                <Text 
                  style={messageTextStyle}
                  numberOfLines={0}
                  ellipsizeMode="tail"
                >
                  {messageContent}
                </Text>
              )}

              {!isUnsent && (
                <View style={[styles.timestampContainer, isImageMessage && styles.imageTimestampContainer]}>
                  {message.edited && (
                    <Text style={[styles.editedText, { color: isCurrentUser ? '#eee' : '#999' }]}>
                      edited
                    </Text>
                  )}
                  {isCurrentUser && message.viewedAt && (
                    <Ionicons 
                      name="checkmark-done" 
                      size={14} 
                      color={isImageMessage ? 'white' : '#ADD8E6'} 
                      style={styles.seenIcon} 
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        {tappedMessageId === message.id && (
          <Text style={styles.transientTimestamp}>
            {formatTime(message.timestamp)}
          </Text>
        )}
      </View>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  if (!route.params?.chatId) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} style={styles.loader} />
      </SafeAreaView>
    );
  }

  const { userName, userImage } = route.params;

  // Fullscreen loading overlay while first page/filter is loading to avoid background flashes
  const showFullscreenLoader = loading && messages.length === 0;

  return (
    <SafeAreaView style={styles.container} onTouchStart={showFilterBar}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Modern Header Section */}
      <Animated.View 
        style={[styles.header, { opacity: headerFadeAnim, transform: [{ translateY: headerSlideAnim }] }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#64748B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {userName}
          </Text>
        </View>
      </Animated.View>

      {/* Filter Bubbles - Only show when not in fullscreen loading */}
      {!showFullscreenLoader && filterItems.length > 1 && (navigationSource === NAVIGATION_SOURCES.CONVERSATIONS || navigationSource === NAVIGATION_SOURCES.MARKETPLACE) && (
        <Animated.View 
          pointerEvents={filterHidden ? 'none' : 'auto'}
          style={[
            styles.filterContainer,
            { transform: [{ translateY: filterTranslateY }], top: headerHeight + 10 },
          ]}
          onLayout={(e) => setFilterHeight(e.nativeEvent.layout.height)}
        >
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            bounces={false}
          >
            {filterItems.map((filterItem) => (
              <TouchableOpacity
                key={filterItem.id}
                style={[
                  styles.filterBubble,
                  selectedFilter?.id === filterItem.id && styles.selectedFilterBubble
                ]}
                onPress={() => handleFilterSelect(filterItem)}
                activeOpacity={0.8}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                {filterItem.type === ITEM_TYPES.NEED ? (
                  <Image
                    source={{ uri: "https://i.ibb.co/qM0wGwdH/N-1.png" }}
                    style={styles.filterBubbleImage}
                    resizeMode="cover"
                  />
                ) : filterItem.image ? (
                  <Image
                    source={{ uri: String(filterItem.image) }}
                    style={styles.filterBubbleImage}
                    resizeMode="cover"
                  />
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Filter Details Modal - Only show when not in fullscreen loading */}
      {!showFullscreenLoader && filterDetailsVisible && selectedFilter && (navigationSource === NAVIGATION_SOURCES.CONVERSATIONS || navigationSource === NAVIGATION_SOURCES.MARKETPLACE) && (
        <View 
          style={[
            styles.filterDetailsContainer,
            { marginTop: filterHidden ? 0 : filterHeight + 18 },
          ]}
        >
          <BlurView intensity={90} tint="extraLight" style={StyleSheet.absoluteFillObject} />
          <View style={styles.filterDetailsHeader}>
            <Text style={styles.filterDetailsTitle}>
              {selectedFilter.type === ITEM_TYPES.PRODUCT ? 'Product Details' :
               selectedFilter.type === ITEM_TYPES.SERVICE ? 'Service Details' :
               selectedFilter.type === ITEM_TYPES.NEED ? 'Need Details' : 'All Messages'}
            </Text>
            <TouchableOpacity
              onPress={() => setFilterDetailsVisible(false)}
              style={styles.closeFilterButton}
            >
              <Ionicons name="close" size={24} color={Colors.LIGHT_PURPLE} />
            </TouchableOpacity>
          </View>
          {selectedFilter.data && (
            <View style={styles.filterDetailsContent}>
              {selectedFilter.image && (
                <Image
                  source={{ uri: String(selectedFilter.image) }}
                  style={styles.filterDetailsImage}
                />
              )}
              <Text style={styles.filterDetailsName}>{String(selectedFilter.title)}</Text>
              
              {/* Description */}
              {selectedFilter.data.description && (
                <Text style={styles.filterDetailsDescription}>
                  {String(selectedFilter.data.description)}
                </Text>
              )}
              
              {/* Product Details */}
              {selectedFilter.type === ITEM_TYPES.PRODUCT && (
                <View style={styles.filterDetailsInfo}>
                  {/* Price */}
                  {selectedFilter.data.price && (
                    <Text style={styles.filterDetailsInfoText}>
                      💰 Price: ${String(selectedFilter.data.price)}
                    </Text>
                  )}
                  
                  {/* Brand and Model */}
                  {(selectedFilter.data.brand || selectedFilter.data.model) && (
                    <Text style={styles.filterDetailsInfoText}>
                      🏷️ {selectedFilter.data.brand && `Brand: ${String(selectedFilter.data.brand)}`}
                      {selectedFilter.data.brand && selectedFilter.data.model && ' | '}
                      {selectedFilter.data.model && `Model: ${String(selectedFilter.data.model)}`}
                    </Text>
                  )}
                  
                  {/* Status */}
                  {selectedFilter.data.status && (
                    <Text style={styles.filterDetailsInfoText}>
                      📊 Status: {String(selectedFilter.data.status)}
                    </Text>
                  )}
                  
                  {/* Publisher */}
                  {selectedFilter.data.publisher?.name && (
                    <Text style={styles.filterDetailsInfoText}>
                      👤 Publisher: {String(selectedFilter.data.publisher.name)}
                    </Text>
                  )}
                  
                  {/* Mark as Sold Button - Only show for product owners */
                  }
                  {String(selectedFilter.data.publisher?.publisherId) === String(currentUserId) && String(selectedFilter.data.status).toUpperCase() === 'FOR_SALE' && (
                    <TouchableOpacity
                      style={styles.markAsSoldButton}
                      onPress={() => handleMarkAsSold(selectedFilter.id)}
                      activeOpacity={0.8}
                      disabled={statusUpdateLoading === 'sold'}
                    >
                      {statusUpdateLoading === 'sold' ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.markAsSoldButtonText}>Mark as Sold</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  
                  {/* Mark as Available Button - Only show for product owners when SOLD */}
                  {String(selectedFilter.data.publisher?.publisherId) === String(currentUserId) && String(selectedFilter.data.status).toUpperCase() === 'SOLD' && (
                    <TouchableOpacity
                      style={styles.markAsAvailableButton}
                      onPress={() => handleMarkAsAvailable(selectedFilter.id)}
                      activeOpacity={0.8}
                      disabled={statusUpdateLoading === 'available'}
                    >
                      {statusUpdateLoading === 'available' ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.markAsSoldButtonText}>Mark as Available</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {/* Price Information for Services */}
              {selectedFilter.type === ITEM_TYPES.SERVICE && selectedFilter.data.price && (
                <Text style={styles.filterDetailsPrice}>
                  ${String(selectedFilter.data.price)}
                </Text>
              )}
              
              {/* Need Price Range */}
              {selectedFilter.type === ITEM_TYPES.NEED && (selectedFilter.data.minPrice || selectedFilter.data.maxPrice) && (
                <Text style={styles.filterDetailsPrice}>
                  ${String(selectedFilter.data.minPrice || 0)} - ${String(selectedFilter.data.maxPrice || 0)}
                </Text>
              )}
              
              {/* Service Details */}
              {selectedFilter.type === ITEM_TYPES.SERVICE && (
                <View style={styles.filterDetailsInfo}>
                  {selectedFilter.data.deliveryTimeInHours && (
                    <Text style={styles.filterDetailsInfoText}>
                      📦 Delivery: {String(selectedFilter.data.deliveryTimeInHours)}h
                    </Text>
                  )}
                  {selectedFilter.data.category?.title && (
                    <Text style={styles.filterDetailsInfoText}>
                      📂 Category: {String(selectedFilter.data.category.title)}
                    </Text>
                  )}
                  {selectedFilter.data.owner?.name && (
                    <Text style={styles.filterDetailsInfoText}>
                      👤 Provider: {String(selectedFilter.data.owner.name)}
                    </Text>
                  )}
                  {selectedFilter.data.averageStars && (
                    <Text style={styles.filterDetailsInfoText}>
                      ⭐ Rating: {String(selectedFilter.data.averageStars.toFixed(1))} ({String(selectedFilter.data.totalReviews || 0)} reviews)
                    </Text>
                  )}
                </View>
              )}
              
              {/* Need Details */}
              {selectedFilter.type === ITEM_TYPES.NEED && (
                <View style={styles.filterDetailsInfo}>
                  {selectedFilter.data.publisher?.name && (
                    <Text style={styles.filterDetailsInfoText}>
                      👤 Publisher: {String(selectedFilter.data.publisher.name)}
                    </Text>
                  )}
                  {selectedFilter.data.status && (
                    <Text style={styles.filterDetailsInfoText}>
                      📊 Status: {String(selectedFilter.data.status)}
                    </Text>
                  )}
                  {selectedFilter.data.needDayStart && (
                    <Text style={styles.filterDetailsInfoText}>
                      📅 Start: {String(new Date(selectedFilter.data.needDayStart).toLocaleDateString())}
                    </Text>
                  )}
                  {selectedFilter.data.needDayEnd && (
                    <Text style={styles.filterDetailsInfoText}>
                      📅 End: {String(new Date(selectedFilter.data.needDayEnd).toLocaleDateString())}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        onTouchStart={showFilterBar}
      >
        {showFullscreenLoader ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
          </View>
        ) : (
        <Animated.View style={{ flex: 1, opacity: isTransitioningFilter ? 0.6 : 1 }}>
        <FlatList
          ref={flatListRef}
          inverted={messages.length > 0}
          data={decoratedData}
          keyExtractor={(item, index) => item.type === 'separator' ? `sep_${item.date}_${index}` : `${item.message.id || 'temp'}_${index}`}
          renderItem={({ item }) => (
            item.type === 'separator' ? (
              <DateSeparator date={item.date} />
            ) : (
              renderMessage(item.message)
            )
          )}
          contentContainerStyle={styles.listContent}
          maintainVisibleContentPosition={{ minIndexForVisible: 1, autoscrollToTopThreshold: 10 }}
          onEndReachedThreshold={0.1}
          onEndReached={() => {
            if (!loadingMore && hasMore) {
              fetchMoreMessages();
            }
          }}
          onScrollBeginDrag={showFilterBar}
          onScrollEndDrag={scheduleHide}
          onMomentumScrollEnd={scheduleHide}
          onTouchStart={showFilterBar}
          removeClippedSubviews={false}
          ListEmptyComponent={loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
            </View>
          ) : !isRoomCreated ? (
            <SuggestedMessages onSelectMessage={handleTextInputChange} />
          ) : null}
          ListFooterComponent={() => (
            <View>
              {loadingMore && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
                </View>
              )}
              {!hasMore && (!selectedFilter || selectedFilter.type === ITEM_TYPES.ALL) && (
                <Animated.View style={[styles.profileSection, { opacity: profileSectionOpacity }]}> 
                  <Image
                    source={{ uri: userImage || 'https://i.ibb.co/cXTTnFdP/profile-photo.jpg' }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.profileName} numberOfLines={2}>
                    {userName}
                  </Text>
                  <Text style={styles.connectionText}>
                    You can now message each other on Tawasalna
                  </Text>
                  <TouchableOpacity 
                    style={styles.viewProfileButton} 
                    onPress={() => navigation.navigate("UsersProfile", { userId: otherUserId })}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.viewProfileText}>View profile</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          )}
          initialNumToRender={20}
          windowSize={10}
          showsVerticalScrollIndicator={false}
          bounces={false}
        />
        </Animated.View>
        )}
        
        {/* Facebook-style typing indicator */}
        {otherUserIsTyping && (
          <TypingIndicator />
        )}
        
        {isEditing ? (
          <View style={styles.editContainer}>
            <Ionicons name="create-outline" size={20} color={Colors.LIGHT_PURPLE} style={{marginRight: 12}}/>
            <TextInput
              value={editText}
              onChangeText={handleTextInputChange}
              style={styles.editInput}
              placeholder="Editing message..."
              placeholderTextColor="#94A3B8"
              autoFocus
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              onPress={confirmEdit} 
              style={[styles.editButton, { backgroundColor: Colors.LIGHT_PURPLE }]}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              activeOpacity={0.8}
            >
              <Text style={{color: '#FFFFFF', fontWeight: '600'}}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={cancelEdit} 
              style={styles.editButton}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              activeOpacity={0.8}
            >
              <Text style={{color: '#64748B', fontWeight: '500'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SafeAreaView style={{ backgroundColor: '#FFFFFF' }}>
            <View style={styles.bottomInput}>
              <TouchableOpacity 
                style={styles.inputAction} 
                onPress={isProductSoldAndNotOwner ? handleShowSoldNotice : handleImageSelection}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                activeOpacity={0.7}
                disabled={isProductSoldAndNotOwner}
              >
                <Ionicons name="attach-outline" size={24} color="#64748B" />
              </TouchableOpacity>
              {isProductSoldAndNotOwner ? (
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={handleShowSoldNotice}
                  activeOpacity={0.9}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <TextInput
                    placeholder="Product is sold. You cannot send messages."
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    value={''}
                    editable={false}
                    multiline
                    maxLength={1000}
                    textAlignVertical="center"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="Type a message..."
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                    value={messageInput}
                    onChangeText={handleTextInputChange}
                    multiline
                    maxLength={1000}
                    textAlignVertical="center"
                  />
                </View>
              )}
              <TouchableOpacity 
                style={[styles.inputAction, { backgroundColor: (!isProductSoldAndNotOwner && messageInput.trim()) ? Colors.LIGHT_PURPLE : '#F1F5F9' }]} 
                onPress={isProductSoldAndNotOwner ? handleShowSoldNotice : handleSendMessage}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                activeOpacity={0.8}
                disabled={isProductSoldAndNotOwner || !messageInput.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={(!isProductSoldAndNotOwner && messageInput.trim()) ? '#FFFFFF' : '#94A3B8'} 
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </KeyboardAvoidingView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {selectedMessage && selectedMessage.senderId === currentUserId && (
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={startEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalButtonText}>Edit Message</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => confirmDelete(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.modalButtonText}>Delete for Me</Text>
            </TouchableOpacity>
            {selectedMessage && selectedMessage.senderId === currentUserId && (
              <TouchableOpacity 
                style={[styles.modalButton, { borderBottomWidth: 0 }]} 
                onPress={() => confirmDelete(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.modalButtonText, { color: 'red' }]}>
                  Unsend for Everyone
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
      {/* Info alert for sold products (non-owner) */}
      <NoticeAlert
        visible={showInfoAlert}
        title="Notice"
        message={infoMessage}
        onClose={() => setShowInfoAlert(false)}
      />
      {/* Success alert (shared component) */}
      <SuccessAlert
        visible={showSuccessAlert}
        title="Success!"
        message={successMessage}
        onClose={() => setShowSuccessAlert(false)}
      />
    </SafeAreaView>
  );
};

export default ConversationScreen;