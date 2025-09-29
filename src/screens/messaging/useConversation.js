import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Animated } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { APP_ENV } from '../../utils/BaseUrl';
import { initializeChatSocket } from '../../utils/initializeChatSocket';
import { getProductsByIds } from '../../services/marketplaceProduct.service';
import { getServicesByIds } from '../../services/marketplaceService.service';
import { getNeedsByIds } from '../../services/marketplaceNeed.service';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const NAVIGATION_SOURCES = {
  CONVERSATIONS: 'conversations',
  MARKETPLACE: 'marketplace',
  PROFILE: 'profile'
};

const ITEM_TYPES = {
  PRODUCT: 'product',
  SERVICE: 'service',
  NEED: 'need',
  ALL: 'all'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useConversation = (routeParams) => {
  const { 
    chatId, 
    userName, 
    userImage, 
    user1ID, 
    user2ID, 
    productId, 
    serviceId,  
    needId      
  } = routeParams || {};

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Navigation & Conversation State
  const [navigationSource, setNavigationSource] = useState(null);
  const [conversationExists, setConversationExists] = useState(false);
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  
  // User State
  const [currentUserId, setCurrentUserId] = useState('');
  const [otherUserId, setOtherUserId] = useState('');
  
  // Messages State
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Socket State
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false);
  
  // UI State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [tappedMessageId, setTappedMessageId] = useState(null);
  const [showProfileSection, setShowProfileSection] = useState(false);
  const [isTransitioningFilter, setIsTransitioningFilter] = useState(false);
  
  // Filter State
  const [filterItems, setFilterItems] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [filterDetailsVisible, setFilterDetailsVisible] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  
  // ============================================================================
  // REFS
  // ============================================================================
  
  const chatSocketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const timestampTimeoutRef = useRef(null);
  const connectionCheckIntervalRef = useRef(null);
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(50)).current;
  const profileSectionOpacity = useRef(new Animated.Value(0)).current;

  // ============================================================================
  // NAVIGATION SOURCE DETECTION
  // ============================================================================
  
  const detectNavigationSource = useCallback(() => {
    // From Conversations: Has arrays of productId, serviceId, needId
    if (Array.isArray(productId) && productId.length > 0 || 
        Array.isArray(serviceId) && serviceId.length > 0 || 
        Array.isArray(needId) && needId.length > 0) {
      return NAVIGATION_SOURCES.CONVERSATIONS;
    }
    
    // From Marketplace: Has single productId, serviceId, or needId
    if ((productId && !Array.isArray(productId)) || 
        (serviceId && !Array.isArray(serviceId)) || 
        (needId && !Array.isArray(needId))) {
      return NAVIGATION_SOURCES.MARKETPLACE;
    }
    
    // From Profile: Only has user1ID and user2ID
    if (user1ID && user2ID && !productId && !serviceId && !needId) {
      return NAVIGATION_SOURCES.PROFILE;
    }
    
    return 'unknown';
  }, [productId, serviceId, needId, user1ID, user2ID]);

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================
  
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

  // ============================================================================
  // MARKETPLACE ITEM FETCHING
  // ============================================================================
  
  // Fetch single item for marketplace navigation
  const fetchSingleItem = useCallback(async () => {
    if (navigationSource !== NAVIGATION_SOURCES.MARKETPLACE) return;
    
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
            itemType = ITEM_TYPES.PRODUCT;
            itemId = productId;
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      }

      // Fetch single service
      if (serviceId && !Array.isArray(serviceId)) {
        try {
          const response = await getServicesByIds([serviceId]);
          if (response.data && response.data.length > 0) {
            itemData = response.data[0];
            itemType = ITEM_TYPES.SERVICE;
            itemId = serviceId;
          }
        } catch (error) {
          console.error('Error fetching service:', error);
        }
      }

      // Fetch single need
      if (needId && !Array.isArray(needId)) {
        try {
          const response = await getNeedsByIds([needId]);
          if (response.data && response.data.length > 0) {
            itemData = response.data[0];
            itemType = ITEM_TYPES.NEED;
            itemId = needId;
          }
        } catch (error) {
          console.error('Error fetching need:', error);
        }
      }

      if (itemData) {
        const filterItem = {
          id: itemId,
          type: itemType,
          title: itemType === ITEM_TYPES.NEED ? itemData.needTitle : 
                 itemType === ITEM_TYPES.SERVICE ? itemData.serviceName : 
                 itemType === ITEM_TYPES.PRODUCT ? itemData.productName :
                 itemData.name,
          image: itemType === ITEM_TYPES.NEED ? null : 
                 itemType === ITEM_TYPES.SERVICE ? itemData.photos : 
                 itemType === ITEM_TYPES.PRODUCT ? itemData.image :
                 itemData.image,
          data: itemData
        };

        // Add default "All Messages" filter
        const filterItemsData = [
          {
            id: 'all',
            type: ITEM_TYPES.ALL,
            title: 'All Messages',
            image: userImage,
            data: null
          },
          filterItem
        ];

        setFilterItems(filterItemsData);
        // Always select the marketplace item so new messages carry its id
        setSelectedFilter(filterItem);
        // Minimal debug: compare publisher id vs current user id
        console.log('itemData', itemData);
        try {
          console.log('[Conversation] owner check', {
            publisherId: String(itemData?.publisher?.publisherId || ''),
            currentUserId: String(currentUserId || ''),
            status: String(itemData?.status || ''),
          });
        } catch {}
        // Only open details panel if conversation already exists
        setFilterDetailsVisible(!!conversationExists);
      }
    } catch (error) {
      console.error('Error fetching single item:', error);
    } finally {
      setLoadingFilters(false);
    }
  }, [navigationSource, productId, serviceId, needId, userImage, conversationExists, currentUserId]);

  // Refresh filter data function
  const refreshFilterData = useCallback(async () => {
    if (navigationSource === NAVIGATION_SOURCES.MARKETPLACE) {
      await fetchSingleItem();
    } else if (navigationSource === NAVIGATION_SOURCES.CONVERSATIONS) {
      await fetchFilterData();
    }
  }, [navigationSource, fetchSingleItem, fetchFilterData]);

  // ============================================================================
  // FILTER DATA FETCHING (FOR CONVERSATIONS NAVIGATION)
  // ============================================================================
  
  // Fetch filter data (products, services, needs) - for conversations navigation
  const fetchFilterData = useCallback(async () => {
    if (navigationSource !== NAVIGATION_SOURCES.CONVERSATIONS) return;
    
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
              type: ITEM_TYPES.PRODUCT,
              title: product.productName || product.name,
              image: product.image,
              data: product
            });
          });
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      }

      // Fetch services
      if (serviceId && serviceId.length > 0) {
        try {
          const servicesResponse = await getServicesByIds(serviceId);
          const services = servicesResponse.data || [];
          services.forEach(service => {
            filterItemsData.push({
              id: service.id,
              type: ITEM_TYPES.SERVICE,
              title: service.serviceName,
              image: service.photos,
              data: service
            });
          });
        } catch (error) {
          console.error('Error fetching services:', error);
        }
      }

      // Fetch needs
      if (needId && needId.length > 0) {
        try {
          const needsResponse = await getNeedsByIds(needId);
          const needs = needsResponse.data || [];
          needs.forEach(need => {
            filterItemsData.push({
              id: need.id,
              type: ITEM_TYPES.NEED,
              title: need.needTitle,
              image: null, // Needs don't have images
              data: need
            });
          });
        } catch (error) {
          console.error('Error fetching needs:', error);
        }
      }

      // Add default "All Messages" filter
      filterItemsData.unshift({
        id: 'all',
        type: ITEM_TYPES.ALL,
        title: 'All Messages',
        image: userImage,
        data: null
      });

      setFilterItems(filterItemsData);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setLoadingFilters(false);
    }
  }, [navigationSource, productId, serviceId, needId, userImage]);

  // ============================================================================
  // FILTER HANDLING
  // ============================================================================
  
  // Handle filter selection
  const handleFilterSelect = useCallback(async (filterItem) => {
    setSelectedFilter(filterItem);
    setShowProfileSection(false);
    setFilterDetailsVisible(filterItem.type !== ITEM_TYPES.ALL);
    setIsTransitioningFilter(true);
    try {
      if (filterItem.type === ITEM_TYPES.ALL) {
        await fetchGeneralFirstPage();
      } else {
        await fetchFilteredMessages(filterItem);
      }
    } finally {
      setIsTransitioningFilter(false);
    }
  }, [fetchFilteredMessages, fetchGeneralFirstPage]);

  // Fetch filtered messages
  const fetchFilteredMessages = useCallback(async (filterItem) => {
    if (!user1ID || !user2ID) return;

    setLoading(true);
    try {
      const filterDTO = {
        user1Id: user1ID,
        user2Id: user2ID,
        productId: filterItem.type === ITEM_TYPES.PRODUCT ? filterItem.id : "",
        serviceId: filterItem.type === ITEM_TYPES.SERVICE ? filterItem.id : "",
        needId: filterItem.type === ITEM_TYPES.NEED ? filterItem.id : "",
      };

      const response = await axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/messagesfiltered?page=0&size=10`,
        filterDTO
      );

      const { content, last, empty } = response.data;
      
      if (content && content.length > 0) {
        const normalized = [...content].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setMessages(normalized);
        // NEW: ensure socket connects using chatId derived from payload
        try {
          const userIdForSocket = await AsyncStorage.getItem('userId');
          const derivedChatId = content[0]?.chatId;
          if (userIdForSocket && derivedChatId) {
            await connectToSocket(userIdForSocket, derivedChatId);
          }
        } catch {}
        setPage(2);
        setHasMore(!last);
        setIsRoomCreated(true);
      } else {
        setMessages([]);
        setHasMore(false);
        // Keep room as created if a general conversation already exists
        setIsRoomCreated(!!conversationExists);
      }
    } catch (error) {
      console.error('Error fetching filtered messages:', error);
      setMessages([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user1ID, user2ID, conversationExists, connectToSocket]);

  // ============================================================================
  // CORE DATA FETCHING
  // ============================================================================
  
  // Fetch general first page (no item filter)
  const fetchGeneralFirstPage = useCallback(async () => {
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
        // NEW: ensure socket connects using chatId derived from payload if present
        try {
          const derivedChatId = content[0]?.chatId;
          if (derivedChatId) {
            await connectToSocket(id, derivedChatId);
          } else {
            await connectToSocket(id, chatId);
          }
        } catch {}
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

  // Orchestrator: single entry point that avoids duplicate fetches/toggles
  const initializeConversationFlow = useCallback(async () => {
    // Detect source immediately
    const source = detectNavigationSource();
    setNavigationSource(source);

    // Ensure user ids are set and socket connects early
    try {
      const id = await AsyncStorage.getItem('userId');
      if (id) {
        setCurrentUserId(id);
        const otherId = id === user1ID ? user2ID : user1ID;
        setOtherUserId(otherId || '');
        if (chatId) {
          await connectToSocket(id, chatId);
        }
      }
    } catch {}

    if (source === NAVIGATION_SOURCES.MARKETPLACE) {
      setLoading(true);
      try {
        // In parallel: check if any conversation exists and fetch the marketplace item
        const [exists] = await Promise.all([
          checkConversationExists(),
        ]);
        setConversationExists(!!exists);

        // Build filter item from route params and fetch its data for display
        let itemFilter = null;
        if (productId && !Array.isArray(productId)) {
          try {
            const resp = await getProductsByIds([productId]);
            const itemData = resp.data?.[0];
            if (itemData) {
              itemFilter = {
                id: productId,
                type: ITEM_TYPES.PRODUCT,
                title: itemData.productName,
                image: itemData.image,
                data: itemData,
              };
            }
          } catch {}
        } else if (serviceId && !Array.isArray(serviceId)) {
          try {
            const resp = await getServicesByIds([serviceId]);
            const itemData = resp.data?.[0];
            if (itemData) {
              itemFilter = {
                id: serviceId,
                type: ITEM_TYPES.SERVICE,
                title: itemData.serviceName,
                image: itemData.photos,
                data: itemData,
              };
            }
          } catch {}
        } else if (needId && !Array.isArray(needId)) {
          try {
            const resp = await getNeedsByIds([needId]);
            const itemData = resp.data?.[0];
            if (itemData) {
              itemFilter = {
                id: needId,
                type: ITEM_TYPES.NEED,
                title: itemData.needTitle,
                image: null,
                data: itemData,
              };
            }
          } catch {}
        }

        // Prepare filter bar items (All + specific item)
        const itemsForBar = [{ id: 'all', type: ITEM_TYPES.ALL, title: 'All Messages', image: userImage, data: null }];
        if (itemFilter) itemsForBar.push(itemFilter);
        setFilterItems(itemsForBar);

        if (exists && itemFilter) {
          setSelectedFilter(itemFilter);
          await fetchFilteredMessages(itemFilter);
          setFilterDetailsVisible(true);
        } else {
          await fetchGeneralFirstPage();
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (source === NAVIGATION_SOURCES.CONVERSATIONS) {
      setLoading(true);
      try {
        await Promise.all([fetchGeneralFirstPage(), fetchFilterData()]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // PROFILE or unknown: just general thread
    await fetchGeneralFirstPage();
  }, [chatId, detectNavigationSource, checkConversationExists, productId, serviceId, needId, userImage, fetchFilteredMessages, fetchGeneralFirstPage, fetchFilterData, connectToSocket]);

  // ============================================================================
  // SOCKET & TYPING MANAGEMENT
  // ============================================================================
  
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
      console.log('Cannot send typing status - socket not ready');
    }
  }, [currentUserId, otherUserId, chatId, isSocketConnected]);

  const handleTextInputChange = useCallback((text) => {
    console.log(text)
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

  // ============================================================================
  // SOCKET CONNECTION
  // ============================================================================
  
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
        console.log('Unhandled frame received:', frame);
      });
      
      socket.onUnhandledMessage((message) => {
        console.log('Unhandled message received:', message);
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
          console.error('Error processing new message:', error);
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
          console.error('Error processing edited message:', error);
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
          console.error('Error processing deleted message:', error);
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
          console.error('Error processing deleted-for-me message:', error);
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
          console.error('Error processing typing indicator:', error);
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

  // ============================================================================
  // CONNECTION CHECK & PAGINATION
  // ============================================================================
  
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

    console.log('Starting fetchMoreMessages for page:', page);
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
      console.error('Error fetching more messages:', error);
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
          console.error('Fallback endpoint also failed:', fallbackError);
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

  // ============================================================================
  // INITIALIZATION & EFFECTS
  // ============================================================================
  
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

    // Single orchestrator to avoid duplicated fetches and UI flicker
    initializeConversationFlow();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (timestampTimeoutRef.current) clearTimeout(timestampTimeoutRef.current);
      if (connectionCheckIntervalRef.current) clearInterval(connectionCheckIntervalRef.current);
      setIsSocketConnected(false);
      if (chatSocketRef.current && chatSocketRef.current.client && chatSocketRef.current.client.connected) {
        console.log('Chat screen unmounting, socket will be cleaned up by the socket service');
      }
    };
  }, [chatId, initializeConversationFlow]);

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================
  
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

  // ============================================================================
  // MESSAGE SENDING
  // ============================================================================
  
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

    if (navigationSource === NAVIGATION_SOURCES.CONVERSATIONS || navigationSource === NAVIGATION_SOURCES.MARKETPLACE) {
      // Prefer selected filter
      productIdToSend = selectedFilter?.type === ITEM_TYPES.PRODUCT ? selectedFilter.id : "";
      serviceIdToSend = selectedFilter?.type === ITEM_TYPES.SERVICE ? selectedFilter.id : "";
      needIdToSend = selectedFilter?.type === ITEM_TYPES.NEED ? selectedFilter.id : "";
      // Fallback to route params when arriving from marketplace and filter not ready
      if (!productIdToSend && !serviceIdToSend && !needIdToSend) {
        if (productId && !Array.isArray(productId)) productIdToSend = productId;
        if (serviceId && !Array.isArray(serviceId)) serviceIdToSend = serviceId;
        if (needId && !Array.isArray(needId)) needIdToSend = needId;
      }
    } else if (navigationSource === NAVIGATION_SOURCES.PROFILE) {
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

    console.log('Sending message with navigation source:', navigationSource);
    
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

        console.log('Sending socket message with filter');
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
        const response = await axios.post(url, firstMessage);

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
        console.error('Error sending first message:', error);
        setMessages(prev => prev.filter(m => m.tempId !== tempId));
      }
    }
  }, [messageInput, currentUserId, otherUserId, isRoomCreated, navigationSource, selectedFilter]);

  // ============================================================================
  // IMAGE HANDLING
  // ============================================================================
  
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

        if (navigationSource === NAVIGATION_SOURCES.CONVERSATIONS || navigationSource === NAVIGATION_SOURCES.MARKETPLACE) {
          // Prefer selected filter
          productIdToSend = selectedFilter?.type === ITEM_TYPES.PRODUCT ? selectedFilter.id : "";
          serviceIdToSend = selectedFilter?.type === ITEM_TYPES.SERVICE ? selectedFilter.id : "";
          needIdToSend = selectedFilter?.type === ITEM_TYPES.NEED ? selectedFilter.id : "";
          // Fallback to route params when arriving from marketplace and filter not ready
          if (!productIdToSend && !serviceIdToSend && !needIdToSend) {
            if (productId && !Array.isArray(productId)) productIdToSend = productId;
            if (serviceId && !Array.isArray(serviceId)) serviceIdToSend = serviceId;
            if (needId && !Array.isArray(needId)) needIdToSend = needId;
          }
        } else if (navigationSource === NAVIGATION_SOURCES.PROFILE) {
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
      console.error('Error sending image:', error);
      alert('Failed to send image. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // ============================================================================
  // DATA PREPARATION & RENDERING
  // ============================================================================
  
  // Build FlatList data with date separators appearing at the TOP of each date block when using inverted list
  const decoratedData = useMemo(() => {
    const items = [];
    let currentDateKey = null;
    let currentGroup = [];

    const flushGroup = () => {
      if (currentGroup.length === 0) return;
      // Push messages first, then the separator for that date.
      // Because FlatList is inverted, this will render the separator at the top visually.
      for (const gMsg of currentGroup) {
        items.push({ type: 'message', message: gMsg });
      }
      if (currentDateKey) {
        items.push({ type: 'separator', date: currentDateKey });
      }
      currentGroup = [];
    };

    for (const msg of messages) {
      const dateKey = formatDateForSeparator(msg.timestamp);
      if (currentDateKey == null) {
        currentDateKey = dateKey;
        currentGroup.push(msg);
        continue;
      }
      if (dateKey === currentDateKey) {
        currentGroup.push(msg);
      } else {
        flushGroup();
        currentDateKey = dateKey;
        currentGroup.push(msg);
      }
    }

    // Flush the last group
    flushGroup();

    return items;
  }, [messages]);

  // ============================================================================
  // RETURN VALUES
  // ============================================================================
  
  return {
    // State
    navigationSource,
    conversationExists,
    isRoomCreated,
    currentUserId,
    otherUserId,
    messages,
    loading,
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
    chatSocketRef,
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
  };
};
