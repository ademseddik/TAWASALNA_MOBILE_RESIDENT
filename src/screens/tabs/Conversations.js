import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  RefreshControl,
  Animated
} from 'react-native';
import { APP_ENV } from '../../utils/BaseUrl';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../assets/Colors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { initializeNotificationSocket, disconnectNotificationSocket } from '../../utils/initializeNotificationSocket';

const Conversations = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null); // Store userId in state
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const PAGE_SIZE = 10;

  // Use useFocusEffect to refetch conversations when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadUserIdAndFetchConversations = async () => {
        const currentUserId = await AsyncStorage.getItem("userId");
        setUserId(currentUserId);
        // Reset state and fetch conversations from the beginning when focused
        setConversations([]);
        setPage(0);
        setLastPage(false);
        fetchConversations(currentUserId, 0, true); // Pass true to reset
      };
      loadUserIdAndFetchConversations();
    }, [])
  );

  useEffect(() => {
    // Simple entrance animation to match other screens
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    let notificationSocketInstance;

    const setupSocket = async () => {
      const currentUserId = await AsyncStorage.getItem("userId");
      if (!currentUserId) return;

      notificationSocketInstance = await initializeNotificationSocket();

      notificationSocketInstance.on('MESSAGE', (notification) => {
        console.log('Received chat message notification in Conversations:', notification);
        // Update the relevant conversation in the list
        setConversations(prevConversations => {
          const updatedConversations = prevConversations.map(conv => {
            if (conv.chatId === notification.chatId) {
              return {
                ...conv,
                lastMessage: [{ senderId: notification.senderId, content: notification.content }], // Update with new message content in array format
                lastMessageTimestamp: notification.timestamp,
                isSeen: false, // Mark as unread when new message arrives
              };
            }
            return conv;
          });

          // If the chat room is not in the current list, it means it's a new conversation
          // or it's beyond the current pagination. You might need to refetch if not found.
          if (!updatedConversations.some(conv => conv.chatId === notification.chatId)) {
            // This scenario means a new chat or a chat that was off-screen.
            // For simplicity, we'll refetch all conversations.
            // A more optimized approach would be to fetch only the new chat room or re-sort.
            console.log("New chat or off-screen chat, refetching conversations...");
            fetchConversations(currentUserId, 0, true);
          }
          return updatedConversations;
        });
      });
    };

    setupSocket();

    return () => {
      // Disconnect notification socket when component unmounts
      if (userId) {
        disconnectNotificationSocket(userId);
      }
    };
  }, [userId]); // Depend on userId to ensure socket setup happens after userId is available

  const fetchConversations = async (currentUserId, currentPage, reset = false) => {
    if (!currentUserId || (loading && !reset) || (lastPage && !reset)) return;
    setLoading(true);
    try {
      const res = await fetch(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/getmyrooms/${currentUserId}?page=${currentPage}&size=${PAGE_SIZE}`);
      const data = await res.json();
      setConversations(prev => reset ? [...data.content] : [...prev, ...data.content]);
      setPage(data.number);
      setLastPage(data.last);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreConversations = () => {
    if (!loading && !lastPage) {
      fetchConversations(userId, page + 1);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userId) {
      await fetchConversations(userId, 0, true);
    }
    setRefreshing(false);
  }, [userId]);

  // Filter conversations based on searchQuery
  const filteredConversations = conversations.filter(conv =>
    conv.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversationItem = ({ item }) => {
    // Handle the new data structure where lastMessage is an array
    let lastMsgContent = '';
    if (Array.isArray(item.lastMessage) && item.lastMessage.length > 0) {
      lastMsgContent = item.lastMessage[0]?.content || '';
    } else if (typeof item.lastMessage === 'string') {
      lastMsgContent = item.lastMessage;
    }
    
    // Use isSeen field from the new API response
    const hasNewMessages = !item.isSeen;

    // Extract user IDs from chatId (format: user1ID_user2ID)
    const userIds = item.chatId.split('_');
    const user1ID = userIds[0];
    const user2ID = userIds[1];

    return (
      <TouchableOpacity
        key={item.chatId}
        style={styles.conversationCard}
        onPress={() =>
          navigation.navigate('Conversation', {
            chatId: item.chatId,
            userName: item.userName,
            userImage: item.userImage,
            user1ID: user1ID,
            user2ID: user2ID,
            productId: item.productId || [],
            serviceId: item.serviceId || [],
            needId: item.needId || [],
          })
        }
        activeOpacity={0.9}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.userImage || 'https://i.ibb.co/cXTTnFdP/profile-photo.jpg' }}
            style={styles.conversationAvatar}
          />
        </View>

        {/* Content */}
        <View style={styles.conversationInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {item.userName ? String(item.userName) : ''}
            </Text>
            {hasNewMessages && <View style={styles.newMessageDot} />}
          </View>
          <Text
            style={[styles.conversationMessage, hasNewMessages && styles.newMessage]}
            numberOfLines={1}
          >
            {lastMsgContent || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

 

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Chat with people and groups</Text>
      </Animated.View>

      {/* Search */}
      <Animated.View style={[styles.searchContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}> 
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color={Colors.LIGHT_PURPLE} style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </Animated.View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.chatId}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.LIGHT_PURPLE} />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>Start a conversation to see it here</Text>
          </View>
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
              <Text style={styles.loadingMoreText}>Loading...</Text>
            </View>
          ) : null
        }
        onEndReached={loadMoreConversations}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.LIGHT_PURPLE]}
            tintColor={Colors.LIGHT_PURPLE}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  avatarContainer: {
    marginRight: 12,
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationMessage: {
    color: '#6B7280',
    fontSize: 14,
  },
  newMessage: {
    color: Colors.LIGHT_PURPLE,
    fontWeight: '600',
  },
  newMessageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.LIGHT_PURPLE,
    marginLeft: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
});

export default Conversations;