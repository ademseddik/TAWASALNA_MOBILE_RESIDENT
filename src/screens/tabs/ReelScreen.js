import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Axios from 'axios';
import { APP_ENV } from '../../utils/BaseUrl';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FollowService } from '../../services/follow.service';

const Notifications = ({ navigation }) => {
  const [followRequests, setFollowRequests] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowRequests = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const response = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`);
        setFollowRequests(response.data.followrequests || []);
      } catch (error) {
        console.error('Error fetching follow requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowRequests();
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (followRequests.length === 0) return;
      const updatedUsersData = {};
      
      await Promise.all(followRequests.map(async (request) => {
        try {
          const response = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${request}`);
          updatedUsersData[request] = response.data;
        } catch (error) {
          console.error(`Error fetching user profile for ID ${request}:`, error);
        }
      }));

      setUsersData(updatedUsersData);
    };

    fetchUserDetails();
  }, [followRequests]);

  const acceptFollowRequest = async (followerUserId) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      await FollowService.AcceptFollowRequest(followerUserId);
     // await Axios.post(`${APP_ENV.SOCIAL_PORT}/AcceptfollowUser/${userId}/${followerUserId}`);
      setFollowRequests(prev => prev.filter(req => req !== followerUserId));
    } catch (error) {
      console.error('Error accepting follow request:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Follow Requests</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" />
      ) : (
        followRequests.map((userId) => {
          const user = usersData[userId];
          if (!user) return null;

          return (
            <TouchableOpacity 
              key={userId.toString()}
              style={styles.userCard}
              onPress={() => navigation.navigate("UsersProfile", { userId })}
            >
              <Image source={{ uri: user.profilephoto || 'https://placeholder.com/avatar' }} style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.username}>{user.fullName}</Text>
                <Text style={styles.bio}>{user.bio?.slice(0, 30)}...</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.acceptButton} onPress={() => acceptFollowRequest(userId)}>
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#6200EE" style={styles.nextIcon} />
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, marginTop: 40 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  userCard: { flexDirection: 'row', padding: 15, borderWidth: 1, borderRadius: 8, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  userInfo: { flex: 1 },
  username: { fontWeight: 'bold', fontSize: 16 },
  bio: { fontSize: 14, color: '#666' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  acceptButton: { backgroundColor: '#007AFF', padding: 8, borderRadius: 5 },
  buttonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  nextIcon: { alignSelf: "center", marginLeft: "auto" },
});