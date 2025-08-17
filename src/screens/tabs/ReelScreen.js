import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  RefreshControl, 
  FlatList, 
  Animated, 
  Dimensions,
  StatusBar,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Axios from 'axios';
import { APP_ENV } from '../../utils/BaseUrl';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FollowService } from '../../services/follow.service';
import Colors from '../../../assets/Colors';
import { initializeSocket, disconnectSocket } from '../../services/WebSocketService';

const { width, height } = Dimensions.get('window');

const Notifications = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActions, setLoadingActions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [socket, setSocket] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Helper function to safely add new notifications without duplicates
  const addNotificationSafely = (newNotification) => {
    setNotifications(prev => {
      // Check if notification already exists
      const existingIds = new Set(prev.map(n => n.id));
      if (existingIds.has(newNotification.id)) {
        console.log('Duplicate WebSocket notification filtered out:', newNotification.id);
        return prev;
      }
      return [newNotification, ...prev];
    });
  };

  // Animation for new notifications
  const animateNewNotification = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    const setupSocket = async () => {
      try {
        const socketWrapper = await initializeSocket();
        setSocket(socketWrapper);

        socketWrapper.on('likePostNotification', (notification) => {
          addNotificationSafely({
            id: `like_${notification.senderUser.id}_${Date.now()}`,
            type: 'like',
            userId: notification.senderUser.id,
            fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
            bio: 'Liked your post',
            image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
            postId: notification.postId
          });
          animateNewNotification();
        });

        socketWrapper.on('commentNotification', (notification) => {
          addNotificationSafely({
            id: `comment_${notification.senderUser.id}_${Date.now()}`,
            type: 'comment',
            userId: notification.senderUser.id,
            fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
            bio: 'Commented on your post',
            image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
            postId: notification.postId,
            commentId: notification.commentId
          });
          animateNewNotification();
        });

        socketWrapper.on('replyToCommentNotification', (notification) => {
          addNotificationSafely({
            id: `reply_${notification.senderUser.id}_${Date.now()}`,
            type: 'reply',
            userId: notification.senderUser.id,
            fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
            bio: 'Replied to your comment',
            image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
            postId: notification.postId,
            commentId: notification.commentId
          });
          animateNewNotification();
        });

        socketWrapper.on('reactionOnCommentNotification', (notification) => {
          addNotificationSafely({
            id: `reaction_on_comment_${notification.senderUser.id}_${Date.now()}`,
            type: 'reaction_on_comment',
            userId: notification.senderUser.id,
            fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
            bio: 'Reacted to your comment',
            image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
            postId: notification.postId,
            commentId: notification.commentId
          });
          animateNewNotification();
        });

        socketWrapper.on('followRequest', (notification) => {
          addNotificationSafely({
            id: `follow_${notification.senderUser.id}_${Date.now()}`,
            type: 'follow',
            userId: notification.senderUser.id,
            fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
            bio: 'Has requested to follow you',
            image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
            isRequest: true
          });
          animateNewNotification();
        });

        socketWrapper.on('followNotification', (notification) => {
          addNotificationSafely({
            id: `follow_${notification.senderUser.id}_${Date.now()}`,
            type: 'follow',
            userId: notification.senderUser.id,
            fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
            bio: 'Started following you',
            image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
            isRequest: false
          });
          animateNewNotification();
        });

        socketWrapper.on('disconnect', () => {
          console.log('Disconnected from WebSocket');
        });

      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    };

    setupSocket();
    fetchData(0, false);

    // Initial animation
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

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const fetchData = async (page = 0, append = false) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      
      console.log('fetchData called:', { page, append, userId });
      
      // Fetch notifications from the new backend endpoint
      const response = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/findNotificationsForUser/${userId}?page=${page}&size=20`);
      
      const notificationsData = response.data.content || [];
      const { last, totalPages } = response.data;
      
      console.log('API response:', { 
        page, 
        notificationsCount: notificationsData.length, 
        last, 
        totalPages,
        append 
      });
      
      // Update pagination state
      setHasMore(!last);
      setCurrentPage(page);
      
      // Transform the backend response to match the existing UI structure
      const transformedNotifications = notificationsData.map(notification => {
        const baseNotification = {
          id: notification.id,
          message: notification.message,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt,
          image: notification.senderInfo?.profilePhoto || 'https://placeholder.com/avatar',
          fullName: notification.senderInfo?.fullName || 'Unknown User',
          userId: notification.senderInfo?.userId,
          groupId: notification.groupInfo?.groupId,
          groupName: notification.groupInfo?.name,
          groupImage: notification.groupInfo?.image,
          postInfo: notification.postInfo || null,
          postId: notification.postInfo?.postId || null,
          commentId: notification.postInfo?.commentId || null,
          replyId: notification.postInfo?.replyId || null
        };

        // Map notification types to UI types and determine if it's a request
        switch (notification.type) {
          case 'followRequest':
            return {
              ...baseNotification,
              type: 'follow',
              bio: 'Has requested to follow you',
              isRequest: true
            };
          case 'followNotification':
            return {
              ...baseNotification,
              type: 'follow',
              bio: 'Started following you',
              isRequest: false
            };
          case 'likePostNotification':
            return {
              ...baseNotification,
              type: 'like',
              bio: 'Liked your post'
            };
          case 'commentNotification':
            return {
              ...baseNotification,
              type: 'comment',
              bio: 'Commented on your post'
            };
          case 'replyNotification':
            return {
              ...baseNotification,
              type: 'reply',
              bio: 'Replied to your comment'
            };
          case 'reactionOnCommentNotification':
            return {
              ...baseNotification,
              type: 'reaction_on_comment',
              bio: 'Replied to your comment'
            };
          case 'inviteToGroupRequest':
            return {
              ...baseNotification,
              type: 'group',
              bio: 'Invited you to join',
              name: notification.groupInfo?.name,
              image: notification.groupInfo?.image || 'https://placeholder.com/avatar',
              isRequest: true
            };
          default:
            return {
              ...baseNotification,
              bio: notification.message
            };
        }
      });

      if (append) {
        setNotifications(prev => {
          // Create a Set of existing IDs for fast lookup
          const existingIds = new Set(prev.map(n => n.id));
          
          // Filter out duplicates from new notifications
          const uniqueNewNotifications = transformedNotifications.filter(notification => {
            if (existingIds.has(notification.id)) {
              console.log('Duplicate notification filtered out:', notification.id);
              return false;
            }
            return true;
          });
          
          const newNotifications = [...prev, ...uniqueNewNotifications];
          console.log('Appending notifications:', { 
            prevCount: prev.length, 
            newCount: transformedNotifications.length,
            uniqueNewCount: uniqueNewNotifications.length,
            totalCount: newNotifications.length 
          });
          return newNotifications;
        });
      } else {
        // For initial load, remove duplicates from the same response
        const uniqueNotifications = transformedNotifications.filter((notification, index, self) => 
          index === self.findIndex(n => n.id === notification.id)
        );
        
        console.log('Setting new notifications:', { 
          originalCount: transformedNotifications.length,
          uniqueCount: uniqueNotifications.length 
        });
        setNotifications(uniqueNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(0);
    fetchData(0, false);
  };

  const loadMore = () => {
    console.log('loadMore called:', { hasMore, loadingMore, currentPage });
    if (hasMore && !loadingMore) {
      console.log('Starting to load more notifications, page:', currentPage + 1);
      setLoadingMore(true);
      fetchData(currentPage + 1, true);
    } else {
      console.log('loadMore conditions not met:', { hasMore, loadingMore });
    }
  };

  const acceptFollowRequest = async (followerUserId) => {
    setLoadingActions(true);
    try {
      await FollowService.AcceptFollowRequest(followerUserId);
      setNotifications(prev => prev.filter(n => !(n.type === 'follow' && n.userId === followerUserId && n.isRequest)));
    } catch (error) {
      console.error('Error accepting follow request:', error);
    } finally {
      setLoadingActions(false);
    }
  };

  const rejectFollowRequest = async (followerUserId) => {
    setLoadingActions(true);
    try {
      await FollowService.RejectFollowRequest(followerUserId);
      setNotifications(prev => prev.filter(n => !(n.type === 'follow' && n.userId === followerUserId && n.isRequest)));
    } catch (error) {
      console.error('Error rejecting follow request:', error);
    } finally {
      setLoadingActions(false);
    }
  };

  const acceptGroupInvitation = async (groupId) => {
    setLoadingActions(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      await Axios.post(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/acceptgroupinvitation/${groupId}/${userId}`);
      setNotifications(prev => prev.filter(n => !(n.type === 'group' && n.groupId === groupId)));
    } catch (error) {
      console.error('Error accepting group invitation:', error);
    } finally {
      setLoadingActions(false);
    }
  };

  const rejectGroupInvitation = async (groupId) => {
    setLoadingActions(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      await Axios.post(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/regetGroupInvitation/${groupId}/${userId}`);
      setNotifications(prev => prev.filter(n => !(n.type === 'group' && n.groupId === groupId)));
    } catch (error) {
      console.error('Error rejecting group invitation:', error);
    } finally {
      setLoadingActions(false);
    }
  };

  const handleNotificationPress = async (item) => {
    // Mark notification as read if it's not already read
    if (!item.read) {
      try {
        await Axios.put(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/markNotificationAsRead/${item.id}`);
        // Update local state to mark as read
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === item.id 
              ? { ...notification, read: true }
              : notification
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    switch (item.type) {
      case 'follow':
        navigation.navigate("UsersProfile", { userId: item.userId });
        break;
      case 'like':
        navigation.navigate("PostDetail", {
          postId: item.postInfo?.postId || item.postId,
        });
        break;
      case 'comment':
      case 'reply':
      case 'reaction_on_comment':
      case 'mention':
        const commentId = item.postInfo?.commentId || item.commentId;
        const navigationParams = {
          postId: item.postInfo?.postId || item.postId,
        };
        // Only add highlightCommentId if commentId exists
        if (commentId) {
          navigationParams.highlightCommentId = commentId;
        }
        navigation.navigate("PostDetail", navigationParams);
        break;
      case 'group':
        navigation.navigate("GroupDetails", {
          groupId: item.groupId
        });
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like':
        return { name: 'heart', color: '#FF6B6B', bgColor: '#FFE8E8' };
      case 'comment':
      case 'reply':
      case 'reaction_on_comment':
        return { name: 'comment', color: '#4ECDC4', bgColor: '#E8F8F7' };
      case 'follow':
        return { name: 'user-plus', color: '#45B7D1', bgColor: '#E8F4F8' };
      case 'group':
        return { name: 'users', color: '#96CEB4', bgColor: '#E8F5E8' };
      default:
        return { name: 'bell', color: Colors.LIGHT_PURPLE, bgColor: '#F0E8FF' };
    }
  };

  const getTimeAgo = (createdAt) => {
    if (!createdAt) return '';
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderNotificationItem = ({ item, index }) => {
    const icon = getNotificationIcon(item.type);
    const timeAgo = getTimeAgo(item.createdAt);
    
    return (
      <Animated.View
        style={[
          styles.notificationCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
          !item.read && styles.unreadCard
        ]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          {/* Notification Icon */}
          <View style={[styles.iconContainer, { backgroundColor: icon.bgColor }]}>
            <Icon name={icon.name} size={16} color={icon.color} />
          </View>

          {/* User Avatar */}
          <View style={styles.avatarContainer}>
            <Image source={{ uri: item.image }} style={styles.avatar} />
            {!item.read && <View style={styles.unreadDot} />}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.username} numberOfLines={1}>
                {item.type === 'group' ? (item.groupName || item.name) : item.fullName}
              </Text>
              <Text style={styles.timeText}>{timeAgo}</Text>
            </View>
            
            <Text style={styles.messageText} numberOfLines={2}>
              {item.message || item.bio}
            </Text>

            {/* Action Buttons for Requests */}
            {(item.isRequest && (item.type === 'follow' || item.type === 'group')) && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    item.type === 'follow' 
                      ? acceptFollowRequest(item.userId) 
                      : acceptGroupInvitation(item.groupId);
                  }}
                  disabled={loadingActions}
                  activeOpacity={0.8}
                >
                  {loadingActions ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Icon name="check" size={12} color="#fff" />
                      <Text style={styles.actionButtonText}>Accept</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    item.type === 'follow' 
                      ? rejectFollowRequest(item.userId) 
                      : rejectGroupInvitation(item.groupId);
                  }}
                  disabled={loadingActions}
                  activeOpacity={0.8}
                >
                  {loadingActions ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Icon name="times" size={12} color="#fff" />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Arrow Icon */}
          <View style={styles.arrowContainer}>
            <Icon name="chevron-right" size={16} color="#C7C7CC" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name="bell-slash" size={60} color="#C7C7CC" />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        When you get notifications, they'll appear here
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Notifications</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {renderHeader()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[Colors.LIGHT_PURPLE]}
              tintColor={Colors.LIGHT_PURPLE}
            />
          }
          onEndReached={() => {
            console.log('onEndReached triggered');
            if (hasMore && !loadingMore) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={() => 
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  unreadCard: {
    backgroundColor: '#F8F5FF',
    borderLeftWidth: 4,
    borderLeftColor: Colors.LIGHT_PURPLE,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.LIGHT_PURPLE,
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
    gap: 4,
  },
  acceptButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  loadingMoreText: {
    color: Colors.LIGHT_PURPLE,
    fontSize: 14,
    fontWeight: '500',
  },
});