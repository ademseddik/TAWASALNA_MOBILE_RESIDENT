import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GroupChatService } from '../services/groupChat.service';
import { initializeChatSocket } from '../utils/initializeChatSocket';
import { UserStorage } from '../storage/userStorage';

const PAGE_SIZE = 9;

export default function useGroupChatViewModel({ groupId }) {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserImage, setCurrentUserImage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const stompRef = useRef(null);
  const subsRef = useRef([]);
  const hasEnteredRef = useRef(false);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimersRef = useRef({});
  const selfTypingTimeoutRef = useRef(null);
  const selfTypingActiveRef = useRef(false);

  const normalizeMessage = (m) => {
    if (!m) return m;
    const senderId = (typeof m.sender === 'string') ? m.sender : (m?.sender?.id || m?.senderId || null);
    const name = m?.senderName || m?.userName
      || m?.sender?.fullName
      || m?.sender?.residentProfile?.fullName
      || '';
    const img = m?.senderImage || m?.userImage
      || m?.sender?.residentProfile?.profilephoto
      || '';
    const content = (typeof m.content !== 'undefined' && m.content !== null) ? m.content : (m?.message ?? '');
    const senderObj = (m && typeof m.sender === 'object') ? m.sender : { id: senderId };
    return { ...m, content, sender: senderObj, senderName: name, senderImage: img };
  };

  useEffect(() => {
    (async () => {
      const uid = await AsyncStorage.getItem('userId');
      setCurrentUserId(uid);
      try {
        const stored = await UserStorage.getAll();
        setCurrentUserName(stored?.username || '');
        setCurrentUserImage(stored?.userImage || '');
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      try {
        setLoading(true);
        const resp = await GroupChatService.getGroupMessages(groupId, 0, PAGE_SIZE);
        const contentDesc = resp?.content || [];
        const desc = contentDesc.map(normalizeMessage);
        setMessages(desc);
        setPage(0);
        setHasMore(!resp?.last);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    let isMounted = true;
    let connectedHandler = null;
    (async () => {
      try {
        const sock = await initializeChatSocket();
        stompRef.current = sock;

        const doSubscribe = () => {
          const subNew = sock.subscribe(`/topic/group/${groupId}`, (msg) => {
            if (!msg || msg.error || !isMounted) return;
            const normalized = normalizeMessage(msg);
            setMessages(prev => {
              if (normalized.tempId) {
                const idxByTemp = prev.findIndex(p => p.id === normalized.tempId || p.tempId === normalized.tempId);
                if (idxByTemp !== -1) {
                  const updated = [...prev];
                  updated[idxByTemp] = { ...prev[idxByTemp], ...normalized, id: normalized.id || prev[idxByTemp].id };
                  return updated;
                }
              }
              if (normalized.id && prev.some(p => p.id === normalized.id)) {
                return prev;
              }
              return [normalized, ...prev];
            });
            try {
              if (currentUserId && String(normalized?.sender?.id) !== String(currentUserId)) {
                GroupChatService.markAsSeen(groupId, currentUserId);
              }
            } catch (e) {}
          });
          const subEdited = sock.subscribe(`/topic/group/${groupId}/edited`, (msg) => {
            if (!msg || msg.error || !isMounted) return;
            const normalized = normalizeMessage(msg);
            setMessages(prev => prev.map(m => m.id === normalized.id ? { ...m, ...normalized } : m));
          });
          const subDeleted = sock.subscribe(`/topic/group/${groupId}/deleted`, (msg) => {
            if (!msg || msg.error || !isMounted) return;
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
          });
          const subTyping = sock.subscribe(`/topic/group/${groupId}/typing`, (msg) => {
            if (!msg || msg.error || !isMounted) return;
            const { senderId, typing, senderName, senderImage } = msg;
            if (!senderId || String(senderId) === String(currentUserId)) return;
            setTypingUsers(prev => {
              const next = { ...prev };
              if (typing) {
                next[senderId] = { senderName: senderName || 'Someone', senderImage: senderImage || '' };
                if (typingTimersRef.current[senderId]) clearTimeout(typingTimersRef.current[senderId]);
                typingTimersRef.current[senderId] = setTimeout(() => {
                  setTypingUsers(curr => {
                    const cp = { ...curr };
                    delete cp[senderId];
                    return cp;
                  });
                  delete typingTimersRef.current[senderId];
                }, 2500);
              } else {
                delete next[senderId];
                if (typingTimersRef.current[senderId]) {
                  clearTimeout(typingTimersRef.current[senderId]);
                  delete typingTimersRef.current[senderId];
                }
              }
              return next;
            });
          });
          const subRead = sock.subscribe(`/topic/group/${groupId}/read`, (msg) => {
            if (!msg || msg.error || !isMounted) return;
            const messageId = msg.messageId || msg.id || msg?.message?.id;
            const viewerId = msg.userId || msg.viewerId || msg.viewedBy || msg.readerId;
            const viewedAt = msg.viewedAt || msg.readAt || msg.timestamp || new Date().toISOString();
            if (!messageId || !viewerId) return;
            setMessages(prev => prev.map(m => {
              if (String(m.id) !== String(messageId)) return m;
              const nextStatus = { ...(m.readStatus || {}) };
              nextStatus[viewerId] = viewedAt;
              const viewedByArr = Array.isArray(m.viewedBy) ? m.viewedBy : [];
              const nextViewedBy = viewedByArr.includes(viewerId) ? viewedByArr : [...viewedByArr, viewerId];
              return { ...m, readStatus: nextStatus, viewedBy: nextViewedBy };
            }));
          });
          const subDeletedForMe = sock.subscribe(`/user/queue/group/messages/deleted-for-me`, (msg) => {
            if (!msg || msg.error || !isMounted) return;
            setMessages(prev => prev.filter(m => m.id !== msg.id));
          });
          subsRef.current = [subNew, subEdited, subDeleted, subTyping, subRead, subDeletedForMe];

          // Send enter event once per mount
          try {
            if (!hasEnteredRef.current && currentUserId) {
              sock.sendMessage('/app/group/enter', { groupId, userId: currentUserId });
              hasEnteredRef.current = true;
            }
          } catch (e) {}

          // Mark latest as seen on enter
          try {
            if (currentUserId) {
              GroupChatService.markAsSeen(groupId, currentUserId);
            }
          } catch (e) {}
        };

        if (sock && sock.client && sock.client.connected) {
          doSubscribe();
        } else {
          try { sock.forceConnect && sock.forceConnect(); } catch {}
          connectedHandler = () => { if (isMounted) doSubscribe(); };
          sock.on && sock.on('connected', connectedHandler);
        }
      } catch (e) {}
    })();
    return () => {
      isMounted = false;
      try { subsRef.current.forEach(s => s && s.unsubscribe && s.unsubscribe()); } catch {}
      subsRef.current = [];
      try {
        const sock = stompRef.current;
        if (sock && connectedHandler) { sock.off && sock.off('connected', connectedHandler); }
      } catch {}
      try {
        const sock = stompRef.current;
        if (sock && currentUserId && hasEnteredRef.current) {
          sock.sendMessage('/app/group/leave', { groupId, userId: currentUserId });
        }
      } catch (e) {}
      try {
        Object.values(typingTimersRef.current).forEach(t => clearTimeout(t));
        typingTimersRef.current = {};
        if (selfTypingTimeoutRef.current) clearTimeout(selfTypingTimeoutRef.current);
      } catch {}
    };
  }, [groupId, currentUserId]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const next = page + 1;
      const resp = await GroupChatService.getGroupMessages(groupId, next, PAGE_SIZE);
      const contentDesc = resp?.content || [];
      const desc = contentDesc.map(normalizeMessage);
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const filtered = desc.filter(m => (m.id ? !existingIds.has(m.id) : true));
        return [...prev, ...filtered];
      });
      setPage(next);
      setHasMore(!resp?.last);
    } catch (e) {
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !stompRef.current || !currentUserId) return;
    setSending(true);
    const tempId = `tmp_${Date.now()}`;
    try {
      try {
        if (selfTypingTimeoutRef.current) clearTimeout(selfTypingTimeoutRef.current);
        if (selfTypingActiveRef.current) {
          stompRef.current.sendMessage('/app/group/typing', { groupId, senderId: currentUserId, typing: false });
          selfTypingActiveRef.current = false;
        }
      } catch (e) {}
      const optimistic = {
        id: tempId,
        group: { id: groupId },
        sender: { id: currentUserId, name: currentUserName, image: currentUserImage },
        content: text,
        image: null,
        tempId,
        timestamp: new Date().toISOString(),
        edited: false,
        deleted: false,
        deletedBy: [],
        viewedBy: [],
        senderName: currentUserName,
        senderImage: currentUserImage,
      };
      setMessages(prev => [optimistic, ...prev]);
      setInputText('');
      stompRef.current.sendMessage('/app/group/chat', {
        groupId,
        senderId: currentUserId,
        content: text,
        image: null,
        tempId,
        senderName: currentUserName,
        senderImage: currentUserImage,
      });
    } catch (e) {
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);
    if (!stompRef.current || !currentUserId) return;
    const trimmed = text.trim();
    if (!selfTypingActiveRef.current && trimmed.length > 0) {
      selfTypingActiveRef.current = true;
      stompRef.current.sendMessage('/app/group/typing', { groupId, senderId: currentUserId, typing: true });
    }
    if (selfTypingTimeoutRef.current) clearTimeout(selfTypingTimeoutRef.current);
    selfTypingTimeoutRef.current = setTimeout(() => {
      if (selfTypingActiveRef.current) {
        stompRef.current.sendMessage('/app/group/typing', { groupId, senderId: currentUserId, typing: false });
        selfTypingActiveRef.current = false;
      }
    }, trimmed.length > 0 ? 1800 : 0);
  };

  const handleEdit = (messageId, newContent) => {
    if (!stompRef.current || !currentUserId) return;
    stompRef.current.sendMessage('/app/group/edit', { messageId, newContent, userId: currentUserId });
  };

  const handleDelete = (messageId, forEveryone = false) => {
    if (!stompRef.current || !currentUserId) return;
    stompRef.current.sendMessage('/app/group/delete', { messageId, userId: currentUserId, deleteForEveryone: !!forEveryone });
    if (!forEveryone) setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const onLongPressMessage = (item) => {
    if (!item || item.deleted) return;
    setSelectedMessage(item);
    setIsEditing(false);
    setEditText(item.content || '');
    setModalVisible(true);
  };

  const startEdit = () => setIsEditing(true);
  const cancelEdit = () => { setIsEditing(false); setModalVisible(false); setSelectedMessage(null); setEditText(''); };
  const confirmEdit = () => { if (!selectedMessage) return; handleEdit(selectedMessage.id, editText.trim()); cancelEdit(); };
  const confirmDelete = (forEveryone = false) => { if (!selectedMessage) return; handleDelete(selectedMessage.id, !!forEveryone); cancelEdit(); };

  return {
    // state
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
    typingUsers,

    // actions
    loadMore,
    handleSend,
    handleInputChange,
    onLongPressMessage,
    startEdit,
    cancelEdit,
    confirmEdit,
    confirmDelete,
    setModalVisible,
  };
}


