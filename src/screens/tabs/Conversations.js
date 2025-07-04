import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  StyleSheet
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
                lastMessage: notification.content, // Update with new message content
                lastMessageTimestamp: notification.timestamp,
                unreadCount: conv.unreadCount + 1, // Increment unread count
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
      const res = await fetch(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/myrooms-paged/${currentUserId}?pageNo=${currentPage + 1}`);
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
    fetchConversations(userId, page);
  };

  const renderConversationItem = ({ item }) => {
    // Check if lastMessage is an array and take the first element, otherwise use directly
    const lastMsgContent = Array.isArray(item.lastMessage) ? item.lastMessage[0]?.content : item.lastMessage;
    const hasNewMessages = item.unreadCount > 0; // Use unreadCount for new messages

    return (
      <TouchableOpacity key={item.chatId}
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Conversation', {
          chatId: item.chatId,
          userName: item.userName,
          userImage: item.userImage
        })}
      >
        <View style={styles.conversationLeft}>
          <Image
            source={{ uri: item.userImage || 'https://i.ibb.co/cXTTnFdP/profile-photo.jpg' }}
            style={styles.conversationAvatar}
          />
          <View style={styles.conversationInfo}>
            <Text style={styles.conversationName}>{item.userName}</Text>
            <Text style={[
              styles.conversationMessage,
              hasNewMessages && styles.newMessage
            ]}>
              {lastMsgContent || 'No messages yet'}
            </Text>
          </View>
        </View>
        <View style={styles.conversationRight}>
          {hasNewMessages && <View style={styles.newMessageDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  const stories = [
    {
      id: 2,
      name: 'Trafalgar D: water Law',
      avatar: 'https://i.ibb.co/cXTTnFdP/profile-photo.jpg',
      hasNote: false,
    },
    {
      id: 3,
      name: 'Amine Arfaoui',
      avatar: 'https://i.ibb.co/cXTTnFdP/profile-photo.jpg',
      hasNote: false,
    },
    {
      id: 4,
      name: 'Siwar',
      avatar: 'https://i.ibb.co/cXTTnFdP/profile-photo.jpg',
      hasNote: false,
      isOnline: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.LIGHT_PURPLE} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>adem_seddik</Text>
          <View style={styles.onlineIndicator} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#666"
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Stories Section */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer}>
          {stories.map((story) => (
            <TouchableOpacity key={story.id} style={styles.storyItem}>
              <View style={styles.storyImageContainer}>
                <Image
                  source={{ uri: story.avatar }}
                  style={styles.storyImage}
                  defaultSource={require('../../../assets/default-avatar.jpg')}
                />
                {story.isOnline && <View style={styles.onlineStatus} />}
              </View>
              <Text style={styles.storyName} numberOfLines={1}>
                {story.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Messages Header */}
        <View style={styles.messagesHeader}>
          <Text style={styles.messagesTitle}>Messages</Text>
        </View>

        {/* Conversations List */}
        <View style={styles.conversationsList}>
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={item => item.chatId}
            ListFooterComponent={
              loading ? <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} /> : null
            }
            onEndReached={loadMoreConversations}
            onEndReachedThreshold={0.5}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerTitle: {
    color: Colors.LIGHT_PURPLE,
    fontSize: 18,
    fontWeight: '600',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3040',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  storiesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  storyImageContainer: {
    position: 'relative',
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 8,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00FF00',
    borderWidth: 2,
    borderColor: '#000',
  },
  storyName: {
    color: Colors.LIGHT_PURPLE,
    fontSize: 12,
    textAlign: 'center',
  },
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messagesTitle: {
    color: Colors.LIGHT_PURPLE,
    fontSize: 20,
    fontWeight: 'bold',
  },
  requestsText: {
    color: Colors.LIGHT_PURPLE,
    fontSize: 16,
    fontWeight: '600',
  },
  conversationsList: {
    paddingHorizontal: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  conversationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    color: Colors.BLACK,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  conversationMessage: {
    color: Colors.LIGHT_PURPLE,
    fontSize: 14,
  },
  newMessage: {
    color: Colors.LIGHT_PURPLE,
    fontWeight: '500',
  },
  conversationRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newMessageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
    marginRight: 12,
  },
  cameraButton: {
    padding: 8,
  },
});

export default Conversations;