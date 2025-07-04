import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const [isRoomCreated, setIsRoomCreated] = useState(false); // NEW: Track if room exists
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const chatSocketRef = useRef(null);
  const scrollViewRef = useRef();

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // NEW: Connect to socket only when room exists
  const connectToSocket = useCallback(async () => {
    if (!currentUserId || !chatId || (chatSocketRef.current && chatSocketRef.current.connected)) {
      return;
    }

    try {
      chatSocketRef.current = await initializeChatSocket();
      const socket = chatSocketRef.current;
      
      socket.subscribe(`/user/${currentUserId}/queue/messages/${chatId}`, (notification) => {
        const newMsg = JSON.parse(notification.body);
        const normalizedMsg = {
          ...newMsg,
          id: newMsg.id,
          senderId: newMsg.sender.id,
          message: newMsg.content,
          userImage: newMsg.sender.residentProfile.profilephoto,
          deletedBy: newMsg.deletedBy || [],
        };
        setMessages(prev => [...prev, normalizedMsg]);
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

  // UPDATED: Initial data fetch with room creation check
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // 1. Get current user ID
        const id = await AsyncStorage.getItem('userId');
        if (!id || !chatId) {
          setLoading(false);
          return;
        }
        setCurrentUserId(id);

        // 2. Separate the IDs to find the other user
        const ids = chatId.split('_');
        const otherId = ids[0] === id ? ids[1] : ids[0];
        setOtherUserId(otherId);

        // 3. Attempt to fetch messages
        const response = await axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/messages-paged/${chatId}?pageNo=1`
        );
        
        // 4. Check if conversation exists
        if (response.data.content && response.data.content.length > 0) {
          setMessages(response.data.content.reverse());
          setIsRoomCreated(true);
          connectToSocket();
        } else {
          // New conversation - no room exists yet
          setMessages([]);
          setIsRoomCreated(false);
        }
      } catch (error) {
        // 404 means chat doesn't exist
        if (error.response?.status === 404) {
          setMessages([]);
          setIsRoomCreated(false);
        } else {
          console.error('Error fetching messages:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      if (chatSocketRef.current && chatSocketRef.current.connected) {
        console.log("Chat screen unmounting...");
      }
    };
  }, [chatId, connectToSocket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleLongPress = (message) => {
    if (message.senderId === currentUserId && !message.deleted) {
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
            ? { ...msg, message: "You unsent a message", deleted: true, edited: false }
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
  
  // UPDATED: Handle room creation on first message
  const handleSendMessage = useCallback(async () => {
    const content = messageInput.trim();
    if (content === '' || !currentUserId || !otherUserId) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      senderId: currentUserId,
      message: content,
      timestamp: new Date().toISOString(),
      userImage: userImage,
      sending: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');

    if (isRoomCreated) {
      // Room exists - send via socket
      const socket = chatSocketRef.current;
      if (socket) {
        socket.sendMessage('/app/chat', { 
          sender: currentUserId, 
          recipient: otherUserId, 
          content, 
          image: null 
        });
      }
    } else {
      // NEW: Create room with first message
      try {
        const url = `${APP_ENV.SOCIAL_PORT}/tawasalna-community/send?senderId=${currentUserId}&receiverId=${otherUserId}`;
        const response = await axios.post(url, content, {
          headers: { 'Content-Type': 'text/plain' }
        });

        // Replace temp message with actual message
        if (response.data.messages && response.data.messages.length > 0) {
          const firstMessage = response.data.messages[0];
          setMessages(prev => [
            ...prev.filter(m => m.id !== tempId), 
            {
              ...firstMessage,
              id: firstMessage.id,
              senderId: firstMessage.sender.id,
              message: firstMessage.content,
              userImage: firstMessage.sender.residentProfile.profilephoto,
            }
          ]);
        }
        
        setIsRoomCreated(true);
        connectToSocket();
      } catch (error) {
        console.error("Failed to create chat room:", error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    }
  }, [messageInput, currentUserId, otherUserId, isRoomCreated, connectToSocket, userImage]);

  // NEW: Suggested messages component
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

  const renderMessage = (message) => {
    if (message.deletedBy && message.deletedBy.includes(currentUserId)) {
      return null;
    }

    const isCurrentUser = message.senderId === currentUserId;
    const isUnsent = message.deleted;
    
    const bubbleStyle = isUnsent 
      ? styles.unsentBubble
      : [styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble];

    const messageContent = isUnsent 
      ? (isCurrentUser ? "You unsent a message" : "This message was unsent") 
      : message.message;
      
    const messageTextStyle = isUnsent ? styles.unsentText : [
      styles.messageText, 
      isCurrentUser ? { color: Colors.WHITE } : { color: Colors.LIGHT_BLACK }
    ];

    return (
      <TouchableOpacity
        key={message.id}
        onLongPress={() => handleLongPress(message)}
        activeOpacity={0.8}
        disabled={isUnsent}>
        <View style={[styles.messageContainer, isCurrentUser && styles.currentUserContainer]}>
          {!isCurrentUser && !isUnsent && (
            <Image
              source={{ uri: message.userImage || 'https://i.ibb.co/cXTTnFdP/profile-photo.jpg' }}
              style={styles.messageAvatar}/>
          )}
          <View style={bubbleStyle}>
            <Text style={messageTextStyle}>
              {messageContent}
            </Text>
            {!isUnsent && (
              <View style={styles.timestampContainer}>
                {message.edited && <Text style={[styles.editedText, { color: isCurrentUser ? '#eee' : '#999' }]}>edited</Text>}
                <Text style={[styles.timestampText, { color: isCurrentUser ? '#eee' : '#999' }]}>
                  {formatDate(message.timestamp)}
                </Text>
                {isCurrentUser && message.viewedAt && <Ionicons name="checkmark-done" size={14} color="#ADD8E6" style={styles.seenIcon} />}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
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
          onContentSizeChange={scrollToBottom}>
          <View style={styles.profileSection}>
            <Image
              source={{ uri: userImage || 'https://i.ibb.co/cXTTnFdP/profile-photo.jpg' }}
              style={styles.profileImage}/>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.connectionText}>You can now message each other on Tawasalna</Text>
            <TouchableOpacity style={styles.viewProfileButton} onPress={() => navigation.navigate("OtherUserProfile", { userId: otherUserId })}>
              <Text style={styles.viewProfileText}>View profile</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} style={{marginTop: 20}} />
          ) : (
            <View style={styles.messageSection}>
              {/* Show suggestions for new conversations */}
              {messages.length === 0 && !isRoomCreated && <SuggestedMessages />}
              {messages.map(renderMessage)}
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
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Message..."
                placeholderTextColor={Colors.LIGHT_BLACK}
                style={styles.textInput}
                value={messageInput}
                onChangeText={(text) => setMessageInput(text)}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.WHITE },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
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
  messageContainer: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 5 },
  currentUserContainer: { justifyContent: 'flex-end' },
  messageAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, maxWidth: '80%' },
  otherUserBubble: { backgroundColor: '#f1f0f0', borderBottomLeftRadius: 4 },
  currentUserBubble: { backgroundColor: Colors.LIGHT_PURPLE, borderBottomRightRadius: 4 },
  messageText: { fontSize: 16 },
  timestampContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', alignSelf: 'flex-end', marginTop: 4 },
  timestampText: { fontSize: 10 },
  seenIcon: { marginLeft: 4 },
  bottomInput: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: Colors.WHITE },
  inputContainer: { flex: 1, backgroundColor: '#f1f0f0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 0, marginRight: 8 },
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
  // NEW: Styles for suggested messages
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
});

export default ConversationScreen;