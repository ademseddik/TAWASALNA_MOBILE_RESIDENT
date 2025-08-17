import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
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
  ScrollView
} from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { APP_ENV } from '../../utils/BaseUrl';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../assets/Colors';
import { initializeChatSocket } from '../../utils/initializeChatSocket';
import * as ImagePicker from 'expo-image-picker';
import { getProductsByIds } from '../../services/marketplaceProduct.service';
import { getServicesByIds } from '../../services/marketplaceService.service';
import { getNeedsByIds } from '../../services/marketplaceNeed.service';

// Reusable top-level component to avoid redefining on each render
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

const ConversationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { 
    chatId, 
    userName, 
    userImage, 
    user1ID, 
    user2ID, 
    productId, 
    serviceId,  
    needId      
  } = route.params || {};

  // Navigation source detection
  const [navigationSource, setNavigationSource] = useState(null);
  const [conversationExists, setConversationExists] = useState(false);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [otherUserId, setOtherUserId] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false);
  
  // Debug typing state changes
  useEffect(() => {
    // Typing state changed
  }, [otherUserIsTyping]);
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const [tappedMessageId, setTappedMessageId] = useState(null);
  // Header animation to match other screens
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(50)).current;

  // PAGINATION: State for pagination
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // State to track when profile section should be shown
  const [showProfileSection, setShowProfileSection] = useState(false);
  const profileSectionOpacity = useRef(new Animated.Value(0)).current;

  // Filter states
  const [filterItems, setFilterItems] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [filterDetailsVisible, setFilterDetailsVisible] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const chatSocketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const timestampTimeoutRef = useRef(null);
  const connectionCheckIntervalRef = useRef(null);

  // Detect navigation source
  const detectNavigationSource = useCallback(() => {
    // From Conversations: Has arrays of productId, serviceId, needId
    if (Array.isArray(productId) && productId.length > 0 || 
        Array.isArray(serviceId) && serviceId.length > 0 || 
        Array.isArray(needId) && needId.length > 0) {
      return 'conversations';
    }
    
    // From Marketplace: Has single productId, serviceId, or needId
    if ((productId && !Array.isArray(productId)) || 
        (serviceId && !Array.isArray(serviceId)) || 
        (needId && !Array.isArray(needId))) {
      return 'marketplace';
    }
    
    // From Profile: Only has user1ID and user2ID
    if (user1ID && user2ID && !productId && !serviceId && !needId) {
      return 'profile';
    }
    
    return 'unknown';
  }, [productId, serviceId, needId, user1ID, user2ID]);

  // Check if conversation exists (for marketplace navigation)
  const checkConversationExists = useCallback(async () => {
    if (!user1ID || !user2ID) return false;
    
    try {
      const response = await axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/messages?page=0&size=1&user1ID=${user1ID}&user2ID=${user2ID}`
      );
      const { content } = response.data;
      return content && content.length > 0;
    } catch (error) {
      return false;
    }
  }, [user1ID, user2ID]);

  // Fetch single item for marketplace navigation
  const fetchSingleItem = useCallback(async () => {
    if (navigationSource !== 'marketplace') return;
    
    setLoadingFilters(true);
    try {
      let itemData = null;
      let itemType = null;
      let itemId = null;

      // Fetch single product
      if (productId && !Array.isArray(productId)) {
        try {
          const response = await getProductsByIds([productId]);
          if (response.data && response.data.length > 0) {
            itemData = response.data[0];
            itemType = 'product';
            itemId = productId;
          }
        } catch (error) {
          // Error fetching product
        }
      }

      // Fetch single service
      if (serviceId && !Array.isArray(serviceId)) {
        try {
          const response = await getServicesByIds([serviceId]);
          if (response.data && response.data.length > 0) {
            itemData = response.data[0];
            itemType = 'service';
            itemId = serviceId;
          }
        } catch (error) {
          // Error fetching service
        }
      }

      // Fetch single need
      if (needId && !Array.isArray(needId)) {
        try {
          const response = await getNeedsByIds([needId]);
          if (response.data && response.data.length > 0) {
            itemData = response.data[0];
            itemType = 'need';
            itemId = needId;
          }
        } catch (error) {
          // Error fetching need
        }
      }

      if (itemData) {
        const filterItem = {
          id: itemId,
          type: itemType,
          title: itemType === 'need' ? itemData.needTitle : 
                 itemType === 'service' ? itemData.serviceName : 
                 itemData.name,
          image: itemType === 'need' ? null : 
                 itemType === 'service' ? itemData.photos : 
                 itemData.image,
          data: itemData
        };

        // Add default "All Messages" filter
        const filterItemsData = [
          {
            id: 'all',
            type: 'all',
            title: 'All Messages',
            image: userImage,
            data: null
          },
          filterItem
        ];

        setFilterItems(filterItemsData);
        
        // Auto-select the item filter if conversation exists
        if (conversationExists) {
          setSelectedFilter(filterItem);
          setFilterDetailsVisible(true);
        }
      }
    } catch (error) {
      // Error fetching single item
    } finally {
      setLoadingFilters(false);
    }
  }, [navigationSource, productId, serviceId, needId, userImage, conversationExists]);

  // no additional keys needed; FlatList keyExtractor handles uniqueness

  const formatDateForSeparator = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Fetch filter data (products, services, needs) - for conversations navigation
  const fetchFilterData = useCallback(async () => {
    if (navigationSource !== 'conversations') return;
    
    if (!productId?.length && !serviceId?.length && !needId?.length) {
      return;
    }

    setLoadingFilters(true);
    try {
      const filterItemsData = [];

      // Fetch products
      if (productId && productId.length > 0) {
        try {
          const productsResponse = await getProductsByIds(productId);
          const products = productsResponse.data || [];
          products.forEach(product => {
            filterItemsData.push({
              id: product.id,
              type: 'product',
              title: product.name,
              image: product.image,
              data: product
            });
          });
              } catch (error) {
        // Error fetching products
      }
      }

      // Fetch services
      if (serviceId && serviceId.length > 0) {
        try {
          const servicesResponse = await getServicesByIds(serviceId);
          const services = servicesResponse.data || [];
          // Services fetched for conversations
          services.forEach(service => {
            // Service data processed
            filterItemsData.push({
              id: service.id,
              type: 'service',
              title: service.serviceName,
              image: service.photos,
              data: service
            });
          });
        } catch (error) {
          // Error fetching services
        }
      }

      // Fetch needs
      if (needId && needId.length > 0) {
        try {
          const needsResponse = await getNeedsByIds(needId);
          const needs = needsResponse.data || [];
          // Needs fetched for conversations
          needs.forEach(need => {
            // Need data processed
            filterItemsData.push({
              id: need.id,
              type: 'need',
              title: need.needTitle,
              image: null, // Needs don't have images
              data: need
            });
          });
        } catch (error) {
          // Error fetching needs
        }
      }

      // Add default "All Messages" filter
      filterItemsData.unshift({
        id: 'all',
        type: 'all',
        title: 'All Messages',
        image: userImage,
        data: null
      });

      setFilterItems(filterItemsData);
    } catch (error) {
      // Error fetching filter data
    } finally {
      setLoadingFilters(false);
    }
  }, [navigationSource, productId, serviceId, needId, userImage]);

  // Handle filter selection
  const handleFilterSelect = useCallback((filterItem) => {
    // Filter selected
    setSelectedFilter(filterItem);
    
    if (filterItem.type === 'all') {
      setFilterDetailsVisible(false);
      // Reset to default conversation view
      setMessages([]);
      setPage(1);
      setHasMore(true);
      setShowProfileSection(false);
      // Fetch initial data again
      fetchInitialData();
    } else {
      setFilterDetailsVisible(true);
      
      // Reset messages and fetch filtered messages
      setMessages([]);
      setPage(1);
      setHasMore(true);
      setShowProfileSection(false);
      
      // Fetch filtered messages
      fetchFilteredMessages(filterItem);
    }
  }, [fetchFilteredMessages, fetchInitialData]);

  // Fetch filtered messages
  const fetchFilteredMessages = useCallback(async (filterItem) => {
    if (!user1ID || !user2ID) return;

    setLoading(true);
    try {
      const filterDTO = {
        user1Id: user1ID,
        user2Id: user2ID,
        productId: filterItem.type === 'product' ? filterItem.id : "",
        serviceId: filterItem.type === 'service' ? filterItem.id : "",
        needId: filterItem.type === 'need' ? filterItem.id : "",
      };

      const response = await axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/messagesfiltered?page=0&size=10`,
        filterDTO
      );

      const { content, last, empty } = response.data;
      
      if (content && content.length > 0) {
        const normalized = [...content].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setMessages(normalized);
        setPage(2);
        setHasMore(!last);
        setIsRoomCreated(true);
      } else {
        setMessages([]);
        setHasMore(false);
        setIsRoomCreated(false);
      }
    } catch (error) {
      // Error fetching filtered messages
      setMessages([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user1ID, user2ID]);

  // Fetch initial data function
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const id = await AsyncStorage.getItem('userId');
      if (!id || !chatId || !user1ID || !user2ID) {
        setLoading(false);
        return;
      }
      
      // All required data available, setting up conversation
      setCurrentUserId(id);

      // Determine which user ID is the other user (not the current user)
      const otherId = id === user1ID ? user2ID : user1ID;
      setOtherUserId(otherId);
      
      // ALWAYS connect to socket first, regardless of whether there are existing messages
      await connectToSocket(id, chatId);
      
      // Wait a moment for socket connection to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // PAGINATION: Fetch the very first page using the new endpoint
      let response;
      try {
        const initialUrl = `${APP_ENV.SOCIAL_PORT}/tawasalna-community/messages?page=0&size=10&user1ID=${user1ID}&user2ID=${user2ID}`;
        response = await axios.get(initialUrl);
      } catch (error) {
        // If new endpoint fails with 500, try the old endpoint as fallback
        if (error.response?.status === 500) {
          try {
            const fallbackUrl = `${APP_ENV.SOCIAL_PORT}/tawasalna-community/messages-paged/${chatId}?pageNo=1`;
            response = await axios.get(fallbackUrl);
          } catch (fallbackError) {
            throw error; // Re-throw the original error for consistent handling
          }
        } else {
          throw error;
        }
      }
      
      // PAGINATION: Handle response from paginated endpoint
      const { content, last, empty } = response.data;

      if (content && content.length > 0) {
        const normalized = [...content].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setMessages(normalized);
        setPage(2); // Prepare to fetch the next page
        setHasMore(!last); // Set whether there are more pages
        setIsRoomCreated(true);
      } else {
        setMessages([]);
        setHasMore(false);
        setIsRoomCreated(false);
        // Show profile section immediately for new conversations or when content is empty
        setShowProfileSection(true);
        Animated.timing(profileSectionOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setMessages([]);
        setIsRoomCreated(false);
        setHasMore(false);
      } else if (error.response?.status === 500) {
        // Handle backend error - assume no messages available
        console.log('Backend error on initial fetch, treating as empty conversation');
        setMessages([]);
        setIsRoomCreated(false);
        setHasMore(false);
        setShowProfileSection(true);
        Animated.timing(profileSectionOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        console.error('Error fetching messages:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [chatId, user1ID, user2ID, connectToSocket]);

  const sendTypingStatus = useCallback((typing) => {
    const socket = chatSocketRef.current;
    if (socket && socket.client && socket.client.connected && currentUserId && otherUserId && chatId && isSocketConnected) {
      socket.sendMessage('/app/typing', {
        sender: currentUserId,
        recipient: otherUserId,
        chatId: chatId,
        typing: typing,
      });
    } else {
      // Cannot send typing status
    }
  }, [currentUserId, otherUserId, chatId, isSocketConnected]);

  const handleTextInputChange = useCallback((text) => {
    setMessageInput(text);
    
    if (!text.trim()) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
      return;
    }
    
    // Try to send typing status immediately
    sendTypingStatus(true);
    
    // If socket is not connected yet, retry after a short delay
    if (!isSocketConnected || !chatSocketRef.current?.client?.connected) {
      setTimeout(() => {
        if (isSocketConnected && chatSocketRef.current?.client?.connected) {
          sendTypingStatus(true);
        }
      }, 1000);
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 3000);
  }, [sendTypingStatus, isSocketConnected]);

  const connectToSocket = useCallback(async (userId = null, chatRoomId = null) => {
    const userIdToUse = userId || currentUserId;
    const chatIdToUse = chatRoomId || chatId;
    
    if (!userIdToUse || !chatIdToUse) {
      return;
    }

    // Check if already connected
    if (chatSocketRef.current && chatSocketRef.current.client && chatSocketRef.current.client.connected) {
      setIsSocketConnected(true);
      return;
    }

    // Attempting to connect to chat socket
      try {
        chatSocketRef.current = await initializeChatSocket();
        const socket = chatSocketRef.current;
        
        // Enable debug logging
        socket.enableDebugLogging(true);
        
        // Test the connection
        const connectionStatus = socket.testConnection();
        
        // Force connection if not already connected
        if (!connectionStatus.connected) {
          socket.forceConnect();
        }
        
        // Add connection event listener
        socket.on('connected', () => {
          setIsSocketConnected(true);
        });
        
        // Add global error handlers
        socket.onError((error) => {
          setIsSocketConnected(false);
        });
        
        socket.onUnhandledFrame((frame) => {
          // Unhandled frame received
        });
        
        socket.onUnhandledMessage((message) => {
          // Unhandled message received
        });
        
        socket.onWebSocketError((error) => {
          setIsSocketConnected(false);
        });
        
        socket.onDisconnected((frame) => {
          setIsSocketConnected(false);
        });
        
        // Set up subscriptions
        socket.subscribe(`/user/${userIdToUse}/queue/messages/${chatIdToUse}`, (notification) => {
        // Handle parsing errors gracefully
        if (notification.error === 'PARSE_ERROR') {
          return;
        }
        
        try {
          const newMsg = notification;
          console.log('📨 New message received:', {
            id: newMsg.id,
            senderId: newMsg.sender?.id,
            hasImage: !!newMsg.image,
            imageUrl: newMsg.image,
            content: newMsg.content,
            tempId: newMsg.tempId
          });
          
          setMessages(prev => {
            const filtered = prev.filter(m => m.tempId !== newMsg.tempId);
            const normalized = {
              ...newMsg,
              id: newMsg.id,
              senderId: newMsg.sender.id,
              message: newMsg.content,
              image: newMsg.image,
              userImage: newMsg.sender?.residentProfile?.profilephoto,
              deletedBy: newMsg.deletedBy || [],
            };
            console.log('📨 Normalized message:', {
              id: normalized.id,
              senderId: normalized.senderId,
              hasImage: !!normalized.image,
              imageUrl: normalized.image
            });
            return [normalized, ...filtered];
          });
        } catch (error) {
          // Error processing new message
        }
      });

      socket.subscribe(`/topic/messages/${chatIdToUse}/edited`, (notification) => {
        if (notification.error === 'PARSE_ERROR') {
          return;
        }
        
        try {
          const editedMsg = notification;
          if (editedMsg.sender && editedMsg.sender.id !== userIdToUse) {
            setMessages(prev => prev.map(msg => msg.id === editedMsg.id ? { ...msg, message: editedMsg.content, edited: true } : msg));
          }
        } catch (error) {
          // Error processing edited message
        }
      });

      socket.subscribe(`/topic/messages/${chatIdToUse}/deleted`, (notification) => {
        if (notification.error === 'PARSE_ERROR') {
          return;
        }
        
        try {
          const deletedMsg = notification;
          if (deletedMsg.sender && deletedMsg.sender.id !== userIdToUse) {
            setMessages(prev => prev.map(msg => msg.id === deletedMsg.id ? { ...msg, message: deletedMsg.content, deleted: true } : msg));
          }
        } catch (error) {
          // Error processing deleted message
        }
      });
      
      socket.subscribe(`/user/${userIdToUse}/queue/messages/deleted-for-me`, (notification) => {
        if (notification.error === 'PARSE_ERROR') {
          console.error('Failed to parse deleted-for-me notification:', notification);
          return;
        }
        
        try {
          const deletedForMeMsg = notification;
          if (deletedForMeMsg.sender && deletedForMeMsg.sender.id !== userIdToUse) {
            setMessages(prev => prev.map(msg => 
              msg.id === deletedForMeMsg.id 
              ? { ...msg, deletedBy: [...(msg.deletedBy || []), deletedForMeMsg.recipient.id] } 
              : msg
            ));
          }
        } catch (error) {
          // Error processing deleted-for-me message
        }
      });

      socket.subscribe(`/user/${userIdToUse}/queue/typing/${chatIdToUse}`, (notification) => {
        if (notification.error === 'PARSE_ERROR') {
          return;
        }
        
        try {
          const typingIndicator = notification;
          // Check if the typing is from the other user (not the current user)
          if (typingIndicator.sender !== userIdToUse) {
            setOtherUserIsTyping(typingIndicator.typing);
          }
        } catch (error) {
          // Error processing typing indicator
        }
      });

      // Socket connected and subscriptions set up successfully
      
      // Check if already connected after setup
      if (socket.client && socket.client.connected) {
        setIsSocketConnected(true);
      }

      // Set up periodic connection check
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current);
      }
      connectionCheckIntervalRef.current = setInterval(checkSocketConnection, 2000);

    } catch (error) {
      setIsSocketConnected(false);
      throw error; // Re-throw to handle in calling function
    }
  }, [checkSocketConnection]);

  // Add connection check function
  const checkSocketConnection = useCallback(() => {
    const socket = chatSocketRef.current;
    if (socket) {
      const status = socket.getConnectionStatus();
      if (!status.connected && isSocketConnected) {
        setIsSocketConnected(false);
      } else if (status.connected && !isSocketConnected) {
        setIsSocketConnected(true);
      }
    }
  }, [isSocketConnected]);


  // PAGINATION: Function to fetch more messages
  const fetchMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !user1ID || !user2ID) {
      return;
    }

    // Starting fetchMoreMessages for page
    setLoadingMore(true);
    
    try {
      
      // Try the new endpoint first
      const url = `${APP_ENV.SOCIAL_PORT}/tawasalna-community/messages?page=${page}&size=10&user1ID=${user1ID}&user2ID=${user2ID}`;
      
      const response = await axios.get(url);
      
      const { content, last, empty } = response.data;
      
      if (content && content.length > 0) {
        // Normalize to newest-first order in state
        const olderNewestFirst = [...content].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setMessages(prevMessages => {
          const existingIds = new Set(prevMessages.map(m => m.id));
          const toAdd = olderNewestFirst.filter(m => !existingIds.has(m.id));
          return [...prevMessages, ...toAdd];
        });
        setPage(prevPage => prevPage + 1);
      }
      
      // Update hasMore based on the 'last' property from the backend
      setHasMore(!last);
      
      // If this was the last page or content is empty, show profile section
      if (last || empty) {
        setShowProfileSection(true);
        Animated.timing(profileSectionOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }

    } catch (error) {
      // If it's a 500 error, try the old endpoint as fallback
      if (error.response && error.response.status === 500) {
        try {
          const fallbackUrl = `${APP_ENV.SOCIAL_PORT}/tawasalna-community/messages-paged/${chatId}?pageNo=${page}`;
          
          const fallbackResponse = await axios.get(fallbackUrl);
          
          const { content, last } = fallbackResponse.data;
          
          if (content && content.length > 0) {
            const olderNewestFirst = [...content].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setMessages(prevMessages => {
              const existingIds = new Set(prevMessages.map(m => m.id));
              const toAdd = olderNewestFirst.filter(m => !existingIds.has(m.id));
              return [...prevMessages, ...toAdd];
            });
            setPage(prevPage => prevPage + 1);
          }
          
          setHasMore(!last);
          
          if (last) {
            setShowProfileSection(true);
            Animated.timing(profileSectionOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        } catch (fallbackError) {
          // If both endpoints fail, assume no more messages
          setHasMore(false);
          setShowProfileSection(true);
          Animated.timing(profileSectionOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      }
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, user1ID, user2ID, chatId, messages.length]);

  // With FlatList inverted and maintainVisibleContentPosition we no longer need manual scroll handling


  useEffect(() => {
    // Entrance animation for header
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Detect navigation source
    const source = detectNavigationSource();
    setNavigationSource(source);

    // Initialize conversation existence check
    setConversationExists(false);

    // Handle different navigation sources
    const initializeScreen = async () => {
      if (source === 'conversations') {
        fetchFilterData();
      } else if (source === 'marketplace') {
        const exists = await checkConversationExists();
        setConversationExists(exists);
        fetchSingleItem();
      } else if (source === 'profile') {
        const exists = await checkConversationExists();
        setConversationExists(exists);
      }
    };

    initializeScreen();

    // Reset any per-conversation state if needed when conversation changes
    fetchInitialData();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (timestampTimeoutRef.current) clearTimeout(timestampTimeoutRef.current);
      if (connectionCheckIntervalRef.current) clearInterval(connectionCheckIntervalRef.current);
      setIsSocketConnected(false);
      if (chatSocketRef.current && chatSocketRef.current.client && chatSocketRef.current.client.connected) {
        // Chat screen unmounting, socket will be cleaned up by the socket service
      }
    };
  }, [chatId, user1ID, user2ID, connectToSocket, fetchFilterData, fetchInitialData, detectNavigationSource, fetchSingleItem, checkConversationExists]);

  // No auto-scroll side-effects needed with inverted FlatList
  
  // ... (the rest of your functions: handleMessagePress, handleLongPress, startEdit, etc. remain the same) ...

  const handleMessagePress = (messageId) => {
    if (timestampTimeoutRef.current) {
      clearTimeout(timestampTimeoutRef.current);
    }
    setTappedMessageId(messageId);
    timestampTimeoutRef.current = setTimeout(() => {
      setTappedMessageId(null);
    }, 5000);
  };
  
  const handleLongPress = (message) => {
    if (!message.deleted && !message.image) {
      setSelectedMessage(message);
      setModalVisible(true);
    }
  };

  const startEdit = () => {
    if (!selectedMessage) return;
    setEditText(selectedMessage.message);
    setIsEditing(true);
    setModalVisible(false);
  };
  
  const cancelEdit = () => {
    setIsEditing(false);
    setEditText('');
    setSelectedMessage(null);
  };
  
  const confirmEdit = () => {
    if (!editText.trim() || !selectedMessage) return;
    const socket = chatSocketRef.current;
    if (socket && socket.client && socket.client.connected) {
      socket.sendMessage('/app/editMessage', {
        messageId: selectedMessage.id,
        newContent: editText,
        userId: currentUserId,
      });
    }

    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === selectedMessage.id
          ? { ...msg, message: editText, edited: true }
          : msg
      )
    );
    
    cancelEdit();
  };
  
  const confirmDelete = (deleteForEveryone) => {
    if (!selectedMessage) return;
    const socket = chatSocketRef.current;
    
    if (socket && socket.client && socket.client.connected) {
      socket.sendMessage('/app/deleteMessage', {
        messageId: selectedMessage.id,
        userId: currentUserId,
        deleteForEveryone,
      });
    }

    if (deleteForEveryone) {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === selectedMessage.id
            ? { ...msg, message: "You unsent a message", deleted: true, edited: false, image: null }
            : msg
        )
      );
    } else {
      setMessages(prevMessages =>
        prevMessages.filter(msg => msg.id !== selectedMessage.id)
      );
    }

    setModalVisible(false);
    setSelectedMessage(null);
  };
  
 const handleSendMessage = useCallback(async () => {
  const content = messageInput.trim();
  if (content === '' || !currentUserId || !otherUserId) return;

  const tempId = `temp_${Date.now()}`;
  const optimisticMessage = {
    id: tempId,
    senderId: currentUserId,
    message: content,
    timestamp: new Date().toISOString(),
    sending: true,
    tempId: tempId,
  };

  // Determine filter IDs based on navigation source
  let productIdToSend = "";
  let serviceIdToSend = "";
  let needIdToSend = "";

  if (navigationSource === 'conversations' || navigationSource === 'marketplace') {
    // For conversations and marketplace, use selected filter
    productIdToSend = selectedFilter?.type === 'product' ? selectedFilter.id : "";
    serviceIdToSend = selectedFilter?.type === 'service' ? selectedFilter.id : "";
    needIdToSend = selectedFilter?.type === 'need' ? selectedFilter.id : "";
  } else if (navigationSource === 'profile') {
    // For profile navigation, no filtering
    productIdToSend = "";
    serviceIdToSend = "";
    needIdToSend = "";
  }

  const firstMessage = {
    senderId: currentUserId,
    receiverId: otherUserId,
    content: content,
    productId: productIdToSend,
    serviceId: serviceIdToSend,
    needId: needIdToSend,
  };

  // Sending message with navigation source
  
  setMessages(prev => [optimisticMessage, ...prev]);
  setMessageInput('');

  if (isRoomCreated) {
    const socket = chatSocketRef.current;
    if (socket && socket.client && socket.client.connected) {
      socket.sendMessage('/app/chat', {
        sender: currentUserId,
        recipient: otherUserId,
        content,
        image: null,
        tempId: tempId,
        productId: productIdToSend,
        serviceId: serviceIdToSend,
        needId: needIdToSend,
      });

      // Sending socket message with filter
    } else {
      await connectToSocket(currentUserId, chatId);
      // After reconnecting, try to send the message again
      const reconnectedSocket = chatSocketRef.current;
      if (reconnectedSocket && reconnectedSocket.client && reconnectedSocket.client.connected) {
        reconnectedSocket.sendMessage('/app/chat', {
          sender: currentUserId,
          recipient: otherUserId,
          content,
          image: null,
          tempId: tempId,
          productId: productIdToSend,
          serviceId: serviceIdToSend,
          needId: needIdToSend,
        });
      }
    }
  } else {
    try {
      const url = `${APP_ENV.SOCIAL_PORT}/tawasalna-community/sendtest?senderId=${currentUserId}&receiverId=${otherUserId}`;
      const response = await axios.post(url, firstMessage, {
   
      });

      // Use lastMessage[0] from backend response
      const lastMessage = response.data.lastMessage?.[0];
      if (lastMessage) {
        let parsedContent = lastMessage.content;
        try {
          parsedContent = JSON.parse(lastMessage.content);
        } catch (e) {
          // fallback: use as is
        }
        setMessages(prev => {
          const filtered = prev.filter(m => m.tempId !== tempId);
          const newMsg = {
            id: Date.now().toString(),
            senderId: lastMessage.senderId,
            message: parsedContent.messageContent || parsedContent,
            timestamp: new Date().toISOString(),
          };
          return [newMsg, ...filtered];
        });
      }
      setIsRoomCreated(true);
      // Connect to socket if not already connected
      if (!chatSocketRef.current || !chatSocketRef.current.client || !chatSocketRef.current.client.connected) {
        await connectToSocket(currentUserId, chatId);
      }

    } catch (error) {
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
    }
  }
}, [messageInput, currentUserId, otherUserId, isRoomCreated, navigationSource, selectedFilter]);

  const handleImageSelection = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (pickerResult.canceled) {
      return;
    }

    const localUri = pickerResult.assets[0].uri;
    const tempId = `temp_${Date.now()}`;
    
    const optimisticMessage = {
      id: tempId,
      senderId: currentUserId,
      imageUri: localUri,
      timestamp: new Date().toISOString(),
      sending: true,
    };
    setMessages(prev => [optimisticMessage, ...prev]);

    const formData = new FormData();
    const filename = localUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('file', { uri: localUri, name: filename, type });
    formData.append('userId', currentUserId);

    // Uploading image to server
    try {
      const response = await axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/chat/upload-image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const imageUrl = response.data.imageUrl;
      
      // Update the message to remove loading state and add server image URL
      setMessages(prev => prev.map(m => 
        m.id === tempId 
          ? { ...m, sending: false, image: imageUrl } 
          : m
      ));

      const socket = chatSocketRef.current;
      if (socket && socket.client && socket.client.connected && isRoomCreated) {
        // Determine filter IDs based on navigation source
        let productIdToSend = "";
        let serviceIdToSend = "";
        let needIdToSend = "";

        if (navigationSource === 'conversations' || navigationSource === 'marketplace') {
          // For conversations and marketplace, use selected filter
          productIdToSend = selectedFilter?.type === 'product' ? selectedFilter.id : "";
          serviceIdToSend = selectedFilter?.type === 'service' ? selectedFilter.id : "";
          needIdToSend = selectedFilter?.type === 'need' ? selectedFilter.id : "";
        } else if (navigationSource === 'profile') {
          // For profile navigation, no filtering
          productIdToSend = "";
          serviceIdToSend = "";
          needIdToSend = "";
        }
        
        socket.sendMessage('/app/chat', { 
          sender: currentUserId, 
          recipient: otherUserId, 
          content: null,
          image: imageUrl,
          tempId: tempId,
          productId: productIdToSend,
          serviceId: serviceIdToSend,
          needId: needIdToSend,
        });
      }

    } catch (error) {
      alert('Failed to send image. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const SuggestedMessages = () => (
    <View style={styles.suggestionContainer}>
      <Text style={styles.suggestionTitle}>
        You haven't messaged each other yet. Start the conversation!
      </Text>
      <View style={styles.suggestionRow}>
        <TouchableOpacity 
          style={styles.suggestionButton} 
          onPress={() => setMessageInput('Hi!')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.suggestionText}>Hi!</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.suggestionButton} 
          onPress={() => setMessageInput('How are you?')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.suggestionText}>How are you?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Build FlatList data with date separators in chronological order (oldest -> newest)
  const decoratedData = useMemo(() => {
    const items = [];
    let lastDateKey = null;
    for (const m of messages) {
      const dateKey = formatDateForSeparator(m.timestamp);
      if (dateKey && dateKey !== lastDateKey) {
        items.push({ type: 'separator', date: dateKey });
        lastDateKey = dateKey;
      }
      items.push({ type: 'message', message: m });
    }
    return items;
  }, [messages]);

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
  

  if (!chatId) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Modern Header Section */}
      <Animated.View style={[styles.header, { opacity: headerFadeAnim, transform: [{ translateY: headerSlideAnim }] }]}>
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
          {otherUserIsTyping && (
            <Text style={styles.typingText} numberOfLines={1}>
              typing...
            </Text>
          )}
        </View>
      </Animated.View>

      {/* Filter Bubbles - Only show for conversations and marketplace navigation */}
      {filterItems.length > 1 && (navigationSource === 'conversations' || navigationSource === 'marketplace') && (
        <View style={styles.filterContainer}>
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
                {filterItem.type === 'need' ? (
                  <Image
                    source={{ uri: "https://i.ibb.co/qM0wGwdH/N-1.png" }}
                    style={styles.filterBubbleImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={{ uri: filterItem.image }}
                    style={styles.filterBubbleImage}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filter Details Modal - Only show for conversations and marketplace navigation */}
      {filterDetailsVisible && selectedFilter && (navigationSource === 'conversations' || navigationSource === 'marketplace') && (
        <View style={styles.filterDetailsContainer}>
          <View style={styles.filterDetailsHeader}>
            <Text style={styles.filterDetailsTitle}>
              {selectedFilter.type === 'product' ? 'Product Details' :
               selectedFilter.type === 'service' ? 'Service Details' :
               selectedFilter.type === 'need' ? 'Need Details' : 'All Messages'}
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
                  source={{ uri: selectedFilter.image }}
                  style={styles.filterDetailsImage}
                />
              )}
              <Text style={styles.filterDetailsName}>{selectedFilter.title}</Text>
              
              {/* Description */}
              {selectedFilter.data.description && (
                <Text style={styles.filterDetailsDescription}>
                  {selectedFilter.data.description}
                </Text>
              )}
              
              {/* Price Information */}
              {selectedFilter.type === 'service' && selectedFilter.data.price && (
                <Text style={styles.filterDetailsPrice}>
                  ${selectedFilter.data.price}
                </Text>
              )}
              
              {/* Need Price Range */}
              {selectedFilter.type === 'need' && (selectedFilter.data.minPrice || selectedFilter.data.maxPrice) && (
                <Text style={styles.filterDetailsPrice}>
                  ${selectedFilter.data.minPrice || 0} - ${selectedFilter.data.maxPrice || 0}
                </Text>
              )}
              
              {/* Service Details */}
              {selectedFilter.type === 'service' && (
                <View style={styles.filterDetailsInfo}>
                  {selectedFilter.data.deliveryTimeInHours && (
                    <Text style={styles.filterDetailsInfoText}>
                      📦 Delivery: {selectedFilter.data.deliveryTimeInHours}h
                    </Text>
                  )}
                  {selectedFilter.data.category?.title && (
                    <Text style={styles.filterDetailsInfoText}>
                      📂 Category: {selectedFilter.data.category.title}
                    </Text>
                  )}
                  {selectedFilter.data.owner?.name && (
                    <Text style={styles.filterDetailsInfoText}>
                      👤 Provider: {selectedFilter.data.owner.name}
                    </Text>
                  )}
                  {selectedFilter.data.averageStars && (
                    <Text style={styles.filterDetailsInfoText}>
                      ⭐ Rating: {selectedFilter.data.averageStars.toFixed(1)} ({selectedFilter.data.totalReviews || 0} reviews)
                    </Text>
                  )}
                </View>
              )}
              
              {/* Need Details */}
              {selectedFilter.type === 'need' && (
                <View style={styles.filterDetailsInfo}>
                  {selectedFilter.data.publisher?.name && (
                    <Text style={styles.filterDetailsInfoText}>
                      👤 Publisher: {selectedFilter.data.publisher.name}
                    </Text>
                  )}
                  {selectedFilter.data.status && (
                    <Text style={styles.filterDetailsInfoText}>
                      📊 Status: {selectedFilter.data.status}
                    </Text>
                  )}
                  {selectedFilter.data.needDayStart && (
                    <Text style={styles.filterDetailsInfoText}>
                      📅 Start: {new Date(selectedFilter.data.needDayStart).toLocaleDateString()}
                    </Text>
                  )}
                  {selectedFilter.data.needDayEnd && (
                    <Text style={styles.filterDetailsInfoText}>
                      📅 End: {new Date(selectedFilter.data.needDayEnd).toLocaleDateString()}
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
      >
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
          ListEmptyComponent={loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
            </View>
          ) : (
            !isRoomCreated ? <SuggestedMessages /> : null
          )}
          ListFooterComponent={() => (
            <View>
              {loadingMore && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
                </View>
              )}
              {!hasMore && (
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
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          bounces={false}
        />
        {isEditing ? (
          <View style={styles.editContainer}>
            <Ionicons name="create-outline" size={20} color={Colors.LIGHT_PURPLE} style={{marginRight: 12}}/>
            <TextInput
              value={editText}
              onChangeText={setEditText}
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
                onPress={handleImageSelection}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                activeOpacity={0.7}
              >
                <Ionicons name="attach-outline" size={24} color="#64748B" />
              </TouchableOpacity>
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
              <TouchableOpacity 
                style={[styles.inputAction, { backgroundColor: messageInput.trim() ? Colors.LIGHT_PURPLE : '#F1F5F9' }]} 
                onPress={handleSendMessage}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                activeOpacity={0.8}
                disabled={!messageInput.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={messageInput.trim() ? '#FFFFFF' : '#94A3B8'} 
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Loading State
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  
  // Header Section - Modern Gradient Design
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 70,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  headerTitle: {
    color: '#1E293B',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  typingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  
  // Profile Section - Card Design
  profileSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#F1F5F9',
  },
  profileName: {
    color: '#1E293B',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  connectionText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  viewProfileButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: Colors.LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewProfileText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Message List
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  
  // Message Bubbles - Modern Design
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  messageBubble: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    maxWidth: '70%',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currentUserBubble: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderBottomRightRadius: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    marginTop: 6,
    minHeight: 16,
  },
  seenIcon: {
    marginLeft: 6,
  },
  editedText: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginRight: 8,
    fontWeight: '500',
  },
  
  // Unsent Messages
  unsentBubble: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    maxWidth: '70%',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  unsentText: {
    fontSize: 16,
    color: '#94A3B8',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  
  // Chat Images
  chatImage: {
    width: 240,
    height: 240,
    borderRadius: 20,
    resizeMode: 'cover',
    maxWidth: '100%',
  },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  imageTimestampContainer: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  // Date Separators
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    marginHorizontal: 16,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dateSeparatorText: {
    color: '#64748B',
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transientTimestamp: {
    alignSelf: 'center',
    color: '#64748B',
    fontSize: 12,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  
  // Bottom Input - Modern Design
  bottomInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    minHeight: 80,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 12,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    color: '#1E293B',
    fontSize: 16,
    maxHeight: 120,
    minHeight: 24,
    lineHeight: 22,
  },
  inputAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Edit Mode
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    minHeight: 80,
  },
  editInput: {
    flex: 1,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    maxHeight: 120,
    minHeight: 48,
    fontSize: 16,
  },
  editButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal Design
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 20,
    width: '85%',
    maxWidth: 320,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalButton: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    minHeight: 56,
  },
  modalButtonText: {
    fontSize: 17,
    color: '#1E293B',
    fontWeight: '500',
  },
  
  // Suggestions
  suggestionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  suggestionTitle: {
    color: '#64748B',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
    fontWeight: '500',
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  suggestionButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    marginHorizontal: 8,
    marginVertical: 6,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionText: {
    color: Colors.LIGHT_PURPLE,
    fontSize: 15,
    fontWeight: '600',
  },
  
  // Filter System - Modern Design
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 16,
    minHeight: 70,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
  },
  filterBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent',
    width: 56,
    height: 56,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  selectedFilterBubble: {
    borderColor: Colors.LIGHT_PURPLE,
    backgroundColor: '#F0F4FF',
  },
  filterBubbleImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  
  // Filter Details
  filterDetailsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 44,
  },
  filterDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  closeFilterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterDetailsContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  filterDetailsImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  filterDetailsName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  filterDetailsDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  filterDetailsPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.LIGHT_PURPLE,
    marginBottom: 12,
  },
  filterDetailsInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
  },
  filterDetailsInfoText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
});
  
export default ConversationScreen;