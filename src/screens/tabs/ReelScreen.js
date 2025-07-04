import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Axios from 'axios';
import { APP_ENV } from '../../utils/BaseUrl';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FollowService } from '../../services/follow.service';
import Colors from '../../../assets/Colors';
import { initializeSocket, disconnectSocket } from '../../services/WebSocketService';

const Notifications = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActions, setLoadingActions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [socket, setSocket] = useState(null);

    useEffect(() => {
    const setupSocket = async () => {
      try {
        const socketWrapper = await initializeSocket();
        setSocket(socketWrapper);

  
     socketWrapper.on('likePostNotification', (notification) => {
                    setNotifications(prev => [
                        {
                            id: `like_${notification.senderUser.id}_${Date.now()}`,
                            type: 'like',
                            userId: notification.senderUser.id,
                            fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
                            bio: 'Liked your post',
                            image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
                            postId: notification.postId
                        },
                        ...prev
                    ]);
                });
                socketWrapper.on('commentNotification', (notification) => {
                    setNotifications(prev => [
                        {
                            id: `comment_${notification.senderUser.id}_${Date.now()}`,
                            type: 'comment',
                            userId: notification.senderUser.id,
                            fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
                            bio: 'Commented on your post',
                            image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
                            postId: notification.postId,
                            commentId: notification.commentId // Make sure backend sends this
                        },
                        ...prev
                    ]);
                });

                socketWrapper.on('replyToCommentNotification', (notification) => {
                    setNotifications(prev => [
                        {
                            id: `reply_${notification.senderUser.id}_${Date.now()}`,
                            type: 'reply',
                            userId: notification.senderUser.id,
                            fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
                            bio: 'Replied to your comment',
                            image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
                            postId: notification.postId,
                            commentId: notification.commentId // And this
                        },
                        ...prev
                    ]);
                });
                 socketWrapper.on('reactionOnCommentNotification', (notification) => {
                    setNotifications(prev => [
                        {
                            id: `reaction_on_comment_${notification.senderUser.id}_${Date.now()}`,
                            type: 'reaction_on_comment',
                            userId: notification.senderUser.id,
                            fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
                            bio: 'Reacted to your comment',
                            image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
                            postId: notification.postId,
                            commentId: notification.commentId
                        },
                        ...prev
                    ]);
                });
        socketWrapper.on('followRequest', (notification) => {
          setNotifications(prev => [
            {
              id: `follow_${notification.senderUser.id}_${Date.now()}`,
              type: 'follow',
              userId: notification.senderUser.id,
              fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
              bio: 'Has requested to follow you',
              image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
              isRequest: true
            },
            ...prev
          ]);
        });

        socketWrapper.on('followNotification', (notification) => {
          setNotifications(prev => [
            {
              id: `follow_${notification.senderUser.id}_${Date.now()}`,
              type: 'follow',
              userId: notification.senderUser.id,
              fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
              bio: 'Started following you',
              image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
              isRequest: false
            },
            ...prev
          ]);
        });

        socketWrapper.on('likePostNotification', (notification) => {
          setNotifications(prev => [
            {
              id: `like_${notification.senderUser.id}_${Date.now()}`,
              type: 'like',
              userId: notification.senderUser.id,
              fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
              bio: 'Liked your post',
              image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
              postId: notification.postId
            },
            ...prev
          ]);
        });

        socketWrapper.on('commentNotification', (notification) => {
          setNotifications(prev => [
            {
              id: `comment_${notification.senderUser.id}_${Date.now()}`,
              type: 'comment',
              userId: notification.senderUser.id,
              fullName: notification.senderUser.residentProfile?.fullName || 'Unknown',
              bio: 'Commented on your post',
              image: notification.senderProfile?.profilephoto || 'https://placeholder.com/avatar',
              postId: notification.postId
            },
            ...prev
          ]);
        });

        socketWrapper.on('disconnect', () => {
          console.log('Disconnected from WebSocket');
        });

      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    };

    setupSocket();
    fetchData();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      // Fetch follow requests
      const followRes = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`);
      const followRequests = followRes.data.followrequests || [];

      const followUserData = await Promise.all(followRequests.map(async (followerId) => {
        try {
          const userRes = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${followerId}`);
          return {
            id: `follow_${followerId}`,
            type: 'follow',
            userId: followerId,
            fullName: userRes.data.fullName,
            bio: 'Has requested to follow you',
            image: userRes.data.profilephoto || 'https://placeholder.com/avatar',
            isRequest: true
          };
        } catch (error) {
          console.error(`Error fetching user ${followerId}:`, error);
          return null;
        }
      }));

      // Fetch group invitations
      const groupRes = await fetch(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/group`);
      const groupData = await groupRes.json();
      const groupInvitations = groupData.filter(group =>
        group.invitedUsers?.some(user => user.id === userId)
      ).map(group => ({
        id: `group_${group.id}`,
        type: 'group',
        groupId: group.id,
        name: group.name,
        bio: 'Invited you to join',
        image: group.groupphoto || 'https://placeholder.com/avatar',
        isRequest: true
      }));

      const combined = [...followUserData.filter(Boolean), ...groupInvitations];
      setNotifications(combined);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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

   const handleNotificationPress = (item) => {
        switch (item.type) {
            case 'follow':
                navigation.navigate("UsersProfile", { userId: item.userId });
                break;
            case 'like':
            case 'comment':
            case 'reply':
            case 'reaction_on_comment':
                navigation.navigate("PostDetail", {
                    postId: item.postId,
                    highlightCommentId: item.commentId, // Pass commentId for highlighting
                });
                break;
            case 'group':
        navigation.navigate("GroupDetails", {
          groupData: item,
          groupPics: item.image
        });
        break;
      default:
        break;
    }
  };

  const renderNotificationItem = (item) => {
    let cardStyle = [styles.userCard];
    
    // Apply different border colors based on notification type
    switch(item.type) {
      case 'like':
        cardStyle.push({ borderLeftWidth: 4, borderLeftColor: Colors.LIGHT_PURPLE });
        break;
      case 'comment':
        cardStyle.push({ borderLeftWidth: 4, borderLeftColor: Colors.BLUE });
        break;
      case 'follow':
        cardStyle.push({ borderLeftWidth: 4, borderLeftColor: Colors.GREEN });
        break;
      case 'group':
        cardStyle.push({ borderLeftWidth: 4, borderLeftColor: Colors.ORANGE });
        break;
      default:
        break;
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={cardStyle}
        onPress={() => handleNotificationPress(item)}
      >
        <Image source={{ uri: item.image }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {item.type === 'group' ? item.name : item.fullName}
          </Text>
          <Text style={styles.bio}>
            {item.bio}
          </Text>
          
          {(item.isRequest && (item.type === 'follow' || item.type === 'group')) && (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={(e) => {
                  e.stopPropagation();
                  item.type === 'follow' 
                    ? acceptFollowRequest(item.userId) 
                    : acceptGroupInvitation(item.groupId);
                }}
                disabled={loadingActions}
              >
                {loadingActions ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Accept</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectButton}
                onPress={(e) => {
                  e.stopPropagation();
                  item.type === 'follow' 
                    ? rejectFollowRequest(item.userId) 
                    : rejectGroupInvitation(item.groupId);
                }}
                disabled={loadingActions}
              >
                {loadingActions ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Icon name="chevron-right" size={24} color={Colors.LIGHT_PURPLE} style={styles.nextIcon} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" />
      ) : notifications.length === 0 ? (
        <Text style={styles.emptyText}>No notifications at the moment.</Text>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {notifications.map(renderNotificationItem)}
        </ScrollView>
      )}
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 10, 
    marginTop: 40,
    backgroundColor: '#f5f5f5'
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 15,
    color: Colors.LIGHT_PURPLE
  },
  emptyText: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center', 
    marginTop: 20 
  },
  userCard: {
    flexDirection: 'row',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 15 
  },
  userInfo: { 
    flex: 1 
  },
  username: { 
    fontWeight: 'bold', 
    fontSize: 16,
    color: '#333'
  },
  bio: { 
    fontSize: 14, 
    color: '#666',
    marginTop: 2
  },
  row: { 
    flexDirection: 'row', 
    marginTop: 8 
  },
  acceptButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center'
  },
  rejectButton: {
    backgroundColor: Colors.GRAY,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center'
  },
  buttonText: { 
    color: 'white', 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  nextIcon: { 
    alignSelf: "center", 
    marginLeft: "auto" 
  }
});