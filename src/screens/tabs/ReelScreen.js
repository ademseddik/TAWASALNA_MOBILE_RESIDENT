import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, RefreshControl,ScrollView  } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Axios from 'axios';
import { APP_ENV } from '../../utils/BaseUrl';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FollowService } from '../../services/follow.service';
import Colors from '../../../assets/Colors';

const Notifications = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
const [loadingActions, setLoadingActions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
          bio: userRes.data.bio,
          image: userRes.data.profilephoto || 'https://placeholder.com/avatar'
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
      id: `${group.id}`,
      type: 'group',
      groupId: group.id,
      name: group.name,
      description: group.description || 'No description available',
      image: group.groupphoto || 'https://placeholder.com/avatar'
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
useEffect(() => {
  fetchData();
}, []);
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };
  const acceptFollowRequest = async (followerUserId) => {
  setLoadingActions(true);
  try {
    const userId = await AsyncStorage.getItem("userId");
    await FollowService.AcceptFollowRequest(followerUserId);
    
    setNotifications(prev => prev.filter(n => n.userId !== followerUserId));
  } catch (error) {
    console.error('Error accepting follow request:', error);
  } finally {
    setLoadingActions(false);  }
};

const rejectFollowRequest = async (followerUserId) => {
  setLoadingActions(true);
  try {
    const userId = await AsyncStorage.getItem("userId");
    await FollowService.RejectFollowRequest(followerUserId);
    setNotifications(prev => prev.filter(n => n.userId !== followerUserId));
  } catch (error) {
    console.error('Error rejecting follow request:', error);
  } finally {
    setLoadingActions(false);
  }
};

// Same pattern for group invitations...
const acceptGroupInvitation = async (groupId) => {
      setLoadingActions(true);
  try {
    const userId = await AsyncStorage.getItem("userId");
    await Axios.post(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/acceptgroupinvitation/${groupId}/${userId}`);
    setNotifications(prev => prev.filter(n => n.groupId !== groupId));
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
    setNotifications(prev => prev.filter(n => n.groupId !== groupId));
  } catch (error) {
    console.error('Error rejecting group invitation:', error);
  } finally {
        setLoadingActions(false);
  }
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
          {notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.userCard}
              onPress={() => {
                if (item.type === 'follow') {
                  navigation.navigate("UsersProfile", { userId: item.userId });
                } else if (item.type === 'group') {
                  navigation.navigate("GroupDetails", {
                    groupData: item,
                    groupPics: item.image
                  });
                }
              }}
            >
              <Image source={{ uri: item.image }} style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.username}>
                  {item.type === 'follow' ? item.fullName : item.name}
                </Text>
                <Text style={styles.bio}>
                  {item.type === 'follow' ? item.bio?.slice(0, 30) + '...' : item.description}
                </Text>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => {
                      item.type === 'follow'
                        ? acceptFollowRequest(item.userId)
                        : acceptGroupInvitation(item.groupId);
                    }}
                    disabled={loadingActions[`${item.userId || item.groupId}_accept`]}
                  >
                    {loadingActions[`${item.userId || item.groupId}_accept`] ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Accept</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => {
                      item.type === 'follow'
                        ? rejectFollowRequest(item.userId)
                        : rejectGroupInvitation(item.groupId);
                    }}
                    disabled={loadingActions[`${item.userId || item.groupId}_reject`]}
                  >
                    {loadingActions[`${item.userId || item.groupId}_reject`] ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Reject</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color={Colors.LIGHT_PURPLE} style={styles.nextIcon} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, marginTop: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 20 },
  userCard: {
    flexDirection: 'row',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  userInfo: { flex: 1 },
  username: { fontWeight: 'bold', fontSize: 16 },
  bio: { fontSize: 14, color: '#666' },
  row: { flexDirection: 'row', marginTop: 8 },
  acceptButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5
  },
  rejectButton: {
    backgroundColor: Colors.GRAY,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10
  },
  buttonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  nextIcon: { alignSelf: "center", marginLeft: "auto" }
});
