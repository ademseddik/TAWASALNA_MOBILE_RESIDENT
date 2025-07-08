import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { APP_ENV } from '../../utils/BaseUrl';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../assets/Colors';
import { initializeChatSocket } from '../../utils/initializeChatSocket';
import * as ImagePicker from 'expo-image-picker';

const ConversationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { chatId, userName, userImage } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [otherUserId, setOtherUserId] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false);
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const [tappedMessageId, setTappedMessageId] = useState(null);

  // PAGINATION: State for pagination
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // State to track when profile section should be shown
  const [showProfileSection, setShowProfileSection] = useState(false);


  const chatSocketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const scrollViewRef = useRef();
  const timestampTimeoutRef = useRef(null);

  // Keep track of scroll position to prevent jumping after prepending messages
  const scrollPositionRef = useRef(0);

  const scrollToBottom = (animated = true) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated });
    }
  };

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

  const sendTypingStatus = useCallback((typing) => {
    const socket = chatSocketRef.current;
    if (socket && currentUserId && otherUserId && chatId) {
      socket.sendMessage('/app/typing', {
        sender: currentUserId,
        recipient: otherUserId,
        chatId: chatId,
        typing: typing,
      });
    }
  }, [currentUserId, otherUserId, chatId]);

  const handleTextInputChange = useCallback((text) => {
    setMessageInput(text);
    
    if (!text.trim()) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
      return;
    }
    
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 3000);
  }, [sendTypingStatus]);

  const connectToSocket = useCallback(async () => {
    if (!currentUserId || !chatId || (chatSocketRef.current && chatSocketRef.current.connected)) {
      return;
    }

    try {
      chatSocketRef.current = await initializeChatSocket();
      const socket = chatSocketRef.current;
      
      socket.subscribe(`/user/${currentUserId}/queue/messages/${chatId}`, (notification) => {
        const newMsg = JSON.parse(notification.body);
        setMessages(prev => [
          ...prev.filter(m => m.tempId !== newMsg.tempId),
          {
            ...newMsg,
            id: newMsg.id,
            senderId: newMsg.sender.id,
            message: newMsg.content,
            image: newMsg.image,
            userImage: newMsg.sender.residentProfile.profilephoto,
            deletedBy: newMsg.deletedBy || [],
          }
        ]);
      });

      socket.subscribe(`/topic/messages/${chatId}/edited`, (notification) => {
        const editedMsg = JSON.parse(notification.body);
        if (editedMsg.sender.id !== currentUserId) {
          setMessages(prev => prev.map(msg => msg.id === editedMsg.id ? { ...msg, message: editedMsg.content, edited: true } : msg));
        }
      });

      socket.subscribe(`/topic/messages/${chatId}/deleted`, (notification) => {
        const deletedMsg = JSON.parse(notification.body);
        if (deletedMsg.sender.id !== currentUserId) {
          setMessages(prev => prev.map(msg => msg.id === deletedMsg.id ? { ...msg, message: deletedMsg.content, deleted: true } : msg));
        }
      });
      
      socket.subscribe(`/user/${currentUserId}/queue/messages/deleted-for-me`, (notification) => {
        const deletedForMeMsg = JSON.parse(notification.body);
        if (deletedForMeMsg.sender.id !== currentUserId) {
          setMessages(prev => prev.map(msg => 
            msg.id === deletedForMeMsg.id 
            ? { ...msg, deletedBy: [...(msg.deletedBy || []), deletedForMeMsg.recipient.id] } 
            : msg
          ));
        }
      });

      socket.subscribe(`/user/${currentUserId}/queue/typing/${chatId}`, (notification) => {
        const typingIndicator = JSON.parse(notification.body);
        if (typingIndicator.sender === otherUserId) {
          setOtherUserIsTyping(typingIndicator.typing);
        }
      });

    } catch (error) {
      console.error('Failed to connect to chat socket:', error);
    }
  }, [currentUserId, chatId, otherUserId]);

  // PAGINATION: Function to fetch more messages
  const fetchMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const response = await axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/messages-paged/${chatId}?pageNo=${page}`
      );
      
      const { content, last } = response.data;
      
      if (content && content.length > 0) {
        // Prepend older messages to the start of the array
        setMessages(prevMessages => [...content.reverse(), ...prevMessages]);
        setPage(prevPage => prevPage + 1);
      }
      
      // Update hasMore based on the 'last' property from the backend
      setHasMore(!last);
      
      // If this was the last page, check if we should show profile section
      if (last && !loadingMore) {
        setShowProfileSection(true);
      }

    } catch (error) {
      console.error('Error fetching more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, chatId]);

  // PAGINATION: Scroll handler
  const handleScroll = ({ nativeEvent }) => {
    // A small threshold to trigger the fetch before reaching the absolute top
    if (nativeEvent.contentOffset.y <= 20) {
      fetchMoreMessages();
    }
    
    // Show profile section when at the very top and no more messages to load
    if (nativeEvent.contentOffset.y <= 10 && !hasMore && !loadingMore) {
      setShowProfileSection(true);
    } else if (nativeEvent.contentOffset.y > 10) {
      setShowProfileSection(false);
    }
  };


  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const id = await AsyncStorage.getItem('userId');
        if (!id || !chatId) {
          setLoading(false);
          return;
        }
        setCurrentUserId(id);

        const ids = chatId.split('_');
        const otherId = ids[0] === id ? ids[1] : ids[0];
        setOtherUserId(otherId);
        
        // PAGINATION: Fetch the very first page
        const response = await axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/messages-paged/${chatId}?pageNo=1`
        );
        
        // PAGINATION: Handle response from paginated endpoint
        const { content, last } = response.data;

        if (content && content.length > 0) {
          setMessages(content.reverse());
          setPage(2); // Prepare to fetch the next page
          setHasMore(!last); // Set whether there are more pages
          setIsRoomCreated(true);
          connectToSocket();
        } else {
          setMessages([]);
          setHasMore(false);
          setIsRoomCreated(false);
          // Show profile section immediately for new conversations
          setShowProfileSection(true);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setMessages([]);
          setIsRoomCreated(false);
          setHasMore(false);
        } else {
          console.error('Error fetching messages:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (timestampTimeoutRef.current) clearTimeout(timestampTimeoutRef.current);
      if (chatSocketRef.current && chatSocketRef.current.connected) {
        console.log("Chat screen unmounting...");
      }
    };
  }, [chatId, connectToSocket]);

  useEffect(() => {
    if(messages.length <= 20) { // Only auto-scroll on initial load or for new messages
      scrollToBottom();
    }
  }, [messages]);
  
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
    if (message.senderId === currentUserId && !message.deleted && !message.image) {
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
    if (socket) {
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
    
    if (socket) {
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
  
  setMessages(prev => [...prev, optimisticMessage]);
  setMessageInput('');

  if (isRoomCreated) {
    const socket = chatSocketRef.current;
    if (socket) {
      socket.sendMessage('/app/chat', {
        sender: currentUserId,
        recipient: otherUserId,
        content,
        image: null,
        tempId: tempId  
      });
    } else {
      console.warn("Socket not connected. Trying to reconnect and send.");
      await connectToSocket();
    }
  } else {
    try {
      const url = `${APP_ENV.SOCIAL_PORT}/tawasalna-community/send?senderId=${currentUserId}&receiverId=${otherUserId}`;
      const response = await axios.post(url, content, {
        headers: { 'Content-Type': 'text/plain' }
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
        setMessages(prev => [
          ...prev.filter(m => m.tempId !== tempId),
          {
            id: Date.now().toString(), // or any unique id
            senderId: lastMessage.senderId,
            message: parsedContent.messageContent || parsedContent, // fallback if not an object
            timestamp: new Date().toISOString(),
          }
        ]);
      }
      setIsRoomCreated(true);
      connectToSocket();

    } catch (error) {
      console.error("Failed to create chat room:", error);
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
    }
  }
}, [messageInput, currentUserId, otherUserId, isRoomCreated, connectToSocket]);

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
    setMessages(prev => [...prev, optimisticMessage]);

    const formData = new FormData();
    const filename = localUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('file', { uri: localUri, name: filename, type });
    formData.append('userId', currentUserId);

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
      if (socket && isRoomCreated) {
        socket.sendMessage('/app/chat', { 
          sender: currentUserId, 
          recipient: otherUserId, 
          content: null,
          image: imageUrl,
          tempId: tempId,
        });
      } else {
        console.error("Cannot send image: chat room not ready or socket not connected.");
        // We don't remove the message because we already updated it to have the image and no loading.
      }

    } catch (error) {
      console.error('Image upload failed:', error);
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
          onPress={() => setMessageInput('Hi!')}>
          <Text style={styles.suggestionText}>Hi!</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.suggestionButton} 
          onPress={() => setMessageInput('How are you?')}>
          <Text style={styles.suggestionText}>How are you?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const groupedMessages = useMemo(() => {
    return messages.reduce((acc, message) => {
      const dateKey = formatDateForSeparator(message.timestamp);
      if (dateKey) {
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(message);
      }
      return acc;
    }, {});
  }, [messages]);

  const DateSeparator = ({ date }) => (
    <View style={styles.dateSeparatorContainer}>
      <View style={styles.dateSeparatorLine} />
      <Text style={styles.dateSeparatorText}>{date}</Text>
      <View style={styles.dateSeparatorLine} />
    </View>
  );

  const renderMessage = (message, index) => { // Added index for key
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
      <View key={message.id || `msg-${index}`}>
        {tappedMessageId === message.id && (
          <Text style={styles.transientTimestamp}>
            {formatTime(message.timestamp)}
          </Text>
        )}
        <TouchableOpacity
          onLongPress={() => handleLongPress(message)}
          onPress={() => handleMessagePress(message.id)}
          activeOpacity={0.8}
          disabled={isUnsent}>
          <View style={[styles.messageContainer, isCurrentUser && styles.currentUserContainer]}>
            {!isCurrentUser && !isUnsent && (
              <Image
                source={{ uri: message.userImage || 'https://i.ibb.co/cXTTnFdP/profile-photo.jpg' }}
                style={styles.messageAvatar}/>
            )}
            <View style={bubbleStyle}>
              {isImageMessage ? (
                <View>
                  <Image
                    source={{ uri: message.image || message.imageUri }}
                    style={styles.chatImage}
                  />
                  {message.sending && (
                    <View style={styles.imageLoader}>
                      <ActivityIndicator size="small" color={Colors.WHITE} />
                    </View>
                  )}
                </View>
              ) : (
                <Text style={messageTextStyle}>{messageContent}</Text>
              )}

              {!isUnsent && (
                <View style={[styles.timestampContainer, isImageMessage && styles.imageTimestampContainer]}>
                  {message.edited && <Text style={[styles.editedText, { color: isCurrentUser ? '#eee' : '#999' }]}>edited</Text>}
                  {isCurrentUser && message.viewedAt && <Ionicons name="checkmark-done" size={14} color={isImageMessage ? 'white' : '#ADD8E6'} style={styles.seenIcon} />}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
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
      <StatusBar barStyle="light-content" backgroundColor={Colors.LIGHT_PURPLE} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.WHITE} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{userName}</Text>
          {otherUserIsTyping && <Text style={styles.typingText}>typing...</Text>}
        </View>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          ref={scrollViewRef}
          onScroll={handleScroll} // PAGINATION: Attach scroll handler
          scrollEventThrottle={16} // PAGINATION: Optimize scroll event frequency
          onContentSizeChange={() => {
              if (messages.length <= 20) { // Only autoscroll on initial load
                  scrollToBottom(false);
              }
          }}
          >
          {/* PAGINATION: Loading indicator for older messages */}
          {loadingMore && <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} style={{ marginVertical: 10 }} />}
          
          {/* Profile section - only show when at the very top and all messages loaded */}
          {showProfileSection && (
            <View style={styles.profileSection}>
              <Image
                source={{ uri: userImage || 'https://i.ibb.co/cXTTnFdP/profile-photo.jpg' }}
                style={styles.profileImage}/>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.connectionText}>You can now message each other on Tawasalna</Text>
              <TouchableOpacity style={styles.viewProfileButton} onPress={() => navigation.navigate("UsersProfile", { userId: otherUserId })}>
                <Text style={styles.viewProfileText}>View profile</Text>
              </TouchableOpacity>
            </View>
          )}
          {loading && !loadingMore ? ( // Show main loader only on initial load
            <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} style={{marginTop: 20}} />
          ) : (
            <View style={styles.messageSection}>
              {messages.length === 0 && !isRoomCreated && <SuggestedMessages />}
              
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <React.Fragment key={date}>
                  <DateSeparator date={date} />
                  {msgs.map(renderMessage)}
                </React.Fragment>
              ))}
            </View>
          )}
        </ScrollView>
        {isEditing ? (
          <View style={styles.editContainer}>
            <Ionicons name="create-outline" size={20} color={Colors.LIGHT_PURPLE} style={{marginRight: 10}}/>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={styles.editInput}
              placeholder="Editing message..."
              autoFocus
              multiline/>
            <TouchableOpacity onPress={confirmEdit} style={styles.editButton}>
                <Text style={{color: Colors.LIGHT_PURPLE, fontWeight: 'bold'}}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelEdit} style={styles.editButton}>
                <Text style={{color: 'gray'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bottomInput}>
            <TouchableOpacity style={styles.inputAction} onPress={handleImageSelection}>
              <Ionicons name="attach-outline" size={28} color={Colors.LIGHT_PURPLE} />
            </TouchableOpacity>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Message..."
                placeholderTextColor={Colors.LIGHT_BLACK}
                style={styles.textInput}
                value={messageInput}
                onChangeText={handleTextInputChange}
                multiline/>
            </View>
            <TouchableOpacity style={styles.inputAction} onPress={handleSendMessage}>
              <Ionicons name="send" size={24} color={Colors.LIGHT_PURPLE} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalButton} onPress={startEdit}>
              <Text style={styles.modalButtonText}>Edit Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => confirmDelete(false)}>
              <Text style={styles.modalButtonText}>Delete for Me</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { borderBottomWidth: 0 }]} onPress={() => confirmDelete(true)}>
              <Text style={[styles.modalButtonText, { color: 'red' }]}>Unsend for Everyone</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

// ... (your styles remain the same) ...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.WHITE },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1 },
    scrollContent: { paddingBottom: 20, paddingTop: 10 }, // Added paddingTop
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      backgroundColor: Colors.LIGHT_PURPLE,
      borderBottomColor: Colors.LIGHT_PURPLE,
    },
    backButton: { padding: 8, marginRight: 10 },
    headerCenter: { flex: 1, alignItems: 'flex-start' },
    headerTitle: { color: Colors.WHITE, fontSize: 18, fontWeight: '600' },
    typingText: { color: Colors.WHITE, fontSize: 12, fontStyle: 'italic' },
    profileSection: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#eee'
    },
    profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
    profileName: { color: Colors.LIGHT_PURPLE, fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
    connectionText: { color: '#999', fontSize: 14, textAlign: 'center', marginBottom: 16 },
    viewProfileButton: { backgroundColor: Colors.LIGHT_PURPLE, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 25 },
    viewProfileText: { color: 'white', fontSize: 16, fontWeight: '600' },
    messageSection: { paddingHorizontal: 10, paddingBottom: 20, flex: 1 },
    messageContainer: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2 },
    currentUserContainer: { justifyContent: 'flex-end' },
    messageAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
    messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, maxWidth: '80%' },
    otherUserBubble: { backgroundColor: '#f1f0f0', borderBottomLeftRadius: 4 },
    currentUserBubble: { backgroundColor: Colors.LIGHT_PURPLE, borderBottomRightRadius: 4 },
    messageText: { fontSize: 16 },
    timestampContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', alignSelf: 'flex-end', marginTop: 4, minHeight: 0 },
    seenIcon: { marginLeft: 4 },
    bottomInput: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: Colors.WHITE },
    inputContainer: { flex: 1, backgroundColor: '#f1f0f0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 0, },
    textInput: { color: Colors.LIGHT_BLACK, fontSize: 16, maxHeight: 100 },
    inputAction: { padding: 8 },
    editedText: { fontSize: 10, alignSelf: 'flex-end', marginRight: 8 },
    editContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderColor: '#ccc', backgroundColor: '#f9f9f9' },
    editInput: { flex: 1, borderColor: '#e0e0e0', borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: 'white', maxHeight: 100 },
    editButton: { marginLeft: 10, padding: 8 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalContent: { backgroundColor: 'white', paddingVertical: 10, borderRadius: 15, width: '80%', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
    modalButton: { paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f0f0f0', alignItems: 'center' },
    modalButtonText: { fontSize: 17, color: '#007AFF' },
    unsentBubble: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      borderWidth: 1,
      maxWidth: '80%',
      borderColor: '#e0e0e0',
      backgroundColor: 'transparent',
    },
    unsentText: {
      fontSize: 16,
      color: '#a0a0a0',
      fontStyle: 'italic',
    },
    suggestionContainer: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      alignItems: 'center',
    },
    suggestionTitle: {
      color: '#a0a0a0',
      fontSize: 14,
      marginBottom: 12,
      textAlign: 'center'
    },
    suggestionRow: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    suggestionButton: {
      backgroundColor: '#f1f0f0',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginHorizontal: 5,
    },
    suggestionText: {
      color: Colors.LIGHT_PURPLE,
      fontSize: 15,
      fontWeight: '500',
    },
    chatImage: {
      width: 200,
      height: 200,
      borderRadius: 15,
      resizeMode: 'cover',
    },
    imageLoader: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 15,
    },
    imageTimestampContainer: {
      position: 'absolute',
      bottom: 5,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.4)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    dateSeparatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
      marginHorizontal: 10,
    },
    dateSeparatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#e0e0e0',
    },
    dateSeparatorText: {
      color: '#a0a0a0',
      marginHorizontal: 10,
      fontSize: 12,
      fontWeight: '600'
    },
    transientTimestamp: {
      alignSelf: 'center',
      color: '#a0a0a0',
      fontSize: 12,
      marginBottom: 8,
    },
  });
  
export default ConversationScreen;