import React from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../assets/Colors';
import useGroupChatViewModel from '../../viewmodels/useGroupChatViewModel';

const PAGE_SIZE = 9;

export default function GroupChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId, groupName } = route.params || {};
  const {
    currentUserId,
    messages,
    loading,
    loadingMore,
    hasMore,
    inputText,
    sending,
    modalVisible,
    selectedMessage,
    isEditing,
    editText,
    setEditText,
    loadMore,
    handleSend,
    handleInputChange,
    onLongPressMessage,
    startEdit,
    cancelEdit,
    confirmEdit,
    confirmDelete,
    typingUsers,
  } = useGroupChatViewModel({ groupId });

  // Refactored to MVVM: View-only. Logic moved to src/viewmodels/useGroupChatViewModel

  // ViewModel loads user and messages

  

  // ViewModel handles STOMP subscription lifecycle

  

  

  

  

  

  const renderItem = ({ item }) => {
    const isMe = item?.sender?.id === currentUserId;
    const isDeleted = !!item.deleted;

    const displayName = item?.senderName
      || item?.sender?.fullName
      || item?.sender?.residentProfile?.fullName
      || item?.sender?.name
      || '';

    const displayImage = item?.senderImage
      || item?.sender?.residentProfile?.profilephoto
      || item?.sender?.image
      || '';

    const hasValidImage = displayImage && displayImage !== 'data:image/jpeg;base64,';
    return (
      <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
        {!isMe ? (
          <View style={styles.avatarWrap}>
            {hasValidImage ? (
              <Image source={{ uri: displayImage }} style={styles.avatar} />
            ) : (
              <Image source={require('../../../assets/default-avatar.jpg')} style={styles.avatar} />
            )}
          </View>
        ) : null}
        <View style={{ maxWidth: '92%' }}>
          {!isMe && !!displayName && !isDeleted ? (
            <Text style={styles.senderName}>{displayName}</Text>
          ) : null}
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, isDeleted && styles.bubbleDeleted]}>
            <Text
              onLongPress={() => onLongPressMessage(item)}
              style={[styles.text, isMe ? styles.textMe : styles.textOther, isDeleted && styles.textDeleted]}
            >
              {isDeleted ? 'This message has been deleted' : item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // keyExtractor defined inline in FlatList

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#64748B" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {groupName || 'Group Chat'}
        </Text>
      </View>
      {loading ? (
        <View style={styles.center}> 
          <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
        </View>
      ) : (
        <FlatList
          inverted
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || item.tempId}
          contentContainerStyle={styles.list}
          maintainVisibleContentPosition={{ minIndexForVisible: 1, autoscrollToTopThreshold: 10 }}
          onEndReachedThreshold={0.2}
          onEndReached={() => { if (!loadingMore && hasMore) loadMore(); }}
          ListFooterComponent={loadingMore ? (
            <View style={{ paddingVertical: 14 }}>
              <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
            </View>
          ) : null}
        />
      )}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={handleInputChange}
            multiline
          />
          <TouchableOpacity style={[styles.send, { backgroundColor: inputText.trim() ? Colors.LIGHT_PURPLE : '#F1F5F9' }]} disabled={!inputText.trim() || sending} onPress={handleSend}>
            <Ionicons name="send" size={18} color={inputText.trim() ? '#fff' : '#94A3B8'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {Object.keys(typingUsers).length > 0 && (
        <View style={styles.typingBar}>
          <View style={styles.typingAvatarRow}>
            {Object.entries(typingUsers)
              .slice(0, 3)
              .map(([uid, u]) => {
                const img = u?.senderImage;
                const valid = img && img !== 'data:image/jpeg;base64,';
                return (
                  <Image
                    key={uid}
                    source={valid ? { uri: img } : require('../../../assets/default-avatar.jpg')}
                    style={styles.typingAvatar}
                  />
                );
              })}
            {Object.keys(typingUsers).length > 3 && (
              <Text style={styles.moreTypers}>+{Object.keys(typingUsers).length - 3}</Text>
            )}
          </View>
        </View>
      )}
      {modalVisible && (
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.modalBackdrop} onPress={cancelEdit} />
          <View style={styles.modalContent}>
            {selectedMessage && String(selectedMessage?.sender?.id) === String(currentUserId) && !isEditing && (
              <TouchableOpacity style={styles.modalButton} onPress={startEdit}>
                <Text style={styles.modalButtonText}>Edit Message</Text>
              </TouchableOpacity>
            )}
            {!isEditing && (
              <TouchableOpacity style={styles.modalButton} onPress={() => confirmDelete(false)}>
                <Text style={styles.modalButtonText}>Delete for Me</Text>
              </TouchableOpacity>
            )}
            {selectedMessage && String(selectedMessage?.sender?.id) === String(currentUserId) && !isEditing && (
              <TouchableOpacity style={[styles.modalButton, { borderBottomWidth: 0 }]} onPress={() => confirmDelete(true)}>
                <Text style={[styles.modalButtonText, { color: 'red' }]}>Unsend for Everyone</Text>
              </TouchableOpacity>
            )}
            {isEditing && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
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
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                  <TouchableOpacity onPress={confirmEdit} style={[styles.editButton, { backgroundColor: Colors.LIGHT_PURPLE }]}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={cancelEdit} style={styles.editButton}>
                    <Text style={{ color: '#64748B', fontWeight: '500' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8, minHeight: 70 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1E293B', flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 16, minHeight: 200 },
  row: { width: '100%', marginVertical: 4, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8 },
  rowLeft: { justifyContent: 'flex-start', paddingRight: 40 },
  rowRight: { justifyContent: 'flex-end', paddingLeft: 40 },
  bubble: { maxWidth: '88%', minWidth: 80, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  bubbleMe: { backgroundColor: Colors.LIGHT_PURPLE, borderBottomRightRadius: 8, alignSelf: 'flex-end' },
  bubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignSelf: 'flex-start' },
  bubbleDeleted: { backgroundColor: '#E5E7EB' },
  text: { color: '#1F2937', fontSize: 16, lineHeight: 22, flexShrink: 1 },
  textMe: { color: '#FFFFFF' },
  textOther: { color: '#1F2937' },
  textDeleted: { color: '#6B7280', fontStyle: 'italic' },
  actions: { position: 'absolute', right: 8, bottom: -18, flexDirection: 'row' },
  deleteForMe: { position: 'absolute', right: -8, top: -8, backgroundColor: '#64748B', borderRadius: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', minHeight: 80 },
  input: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 28, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0', marginHorizontal: 12, minHeight: 44, maxHeight: 120, color: '#1E293B', fontSize: 16 },
  send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { width: 36, height: 36, borderRadius: 18, marginRight: 12, overflow: 'hidden', alignSelf: 'flex-end', borderWidth: 2, borderColor: '#F1F5F9' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  senderName: { marginLeft: 6, marginBottom: 4, color: '#6B7280', fontSize: 12, fontWeight: '600' },
  // Modal styles
  modalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, width: '85%', maxWidth: 340, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, zIndex: 1001 },
  modalButton: { paddingVertical: 18, borderBottomWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', minHeight: 56 },
  modalButtonText: { fontSize: 17, color: '#1E293B', fontWeight: '500' },
  editInput: { borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFFFF', maxHeight: 120, minHeight: 48, fontSize: 16, color: '#1E293B' },
  editButton: { marginLeft: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', minWidth: 60, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  typingBar: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  typingAvatarRow: { flexDirection: 'row', alignItems: 'center' },
  typingAvatar: { width: 22, height: 22, borderRadius: 11, marginRight: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  moreTypers: { color: '#64748B', fontSize: 12, fontWeight: '600' },
});


