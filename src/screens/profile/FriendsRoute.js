import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { APP_ENV } from '../../utils/BaseUrl';
import { ScrollView } from 'react-native-gesture-handler';
import LottieView from 'lottie-react-native';
import loadingAnimation from '../../../assets/animations/LoadingAnimatoion3.json';
import Colors from '../../../assets/Colors';

function FriendsRoute({ userId, navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // Default to 'all'
  const [relationships, setRelationships] = useState({ followers: [], following: [] });

  const fetchUserProfile = async (id) => {
    try {
      const response = await fetch(`${APP_ENV.AUTH_PORT}/tawasalna-user/user/${id}`);

      if (!response.ok) {
        console.error(`Failed to fetch user ${id}: HTTP ${response.status}`);
        return null;
      }

      const text = await response.text(); // Read as raw text first

      try {
        return JSON.parse(text); // Try parsing JSON
      } catch (jsonError) {
        console.error(`Invalid JSON response for user ${id}:`, text);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return null;
    }
  };

  const fetchUsers = async () => {
    try {
      const profileResponse = await fetch(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`);
      
      if (!profileResponse.ok) {
        console.error(`Failed to fetch profile: HTTP ${profileResponse.status}`);
        setUsers([]);
        setLoading(false);
        return;
      }

      const profileData = await profileResponse.json();

      if (!profileData || !profileData.followers || !profileData.following) {
        console.log("No followers or following found.");
        setUsers([]);
        setLoading(false);
        return;
      }

      setRelationships({ followers: profileData.followers, following: profileData.following });

      const allUserIds = [...profileData.followers, ...profileData.following];

      // Fetch individual profiles for each user
      const usersData = await Promise.all(allUserIds.map(id => fetchUserProfile(id)));
      setUsers(usersData.filter(user => user !== null)); // Remove failed fetch attempts
    } catch (error) {
      console.error("Failed to fetch user relationships:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    console.log("Fetched Users:", users);
  }, [users]); // Logs every time `users` state updates

  const filteredUsers = users.filter(user => {
    if (filter === 'followers') {

      return relationships.followers.includes(user.id);}
    
    else if (filter === 'following') return relationships.following.includes(user.id);
    return true;
  });

  return (
    <View style={styles.container}>
     
      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterButton, filter === 'all' && styles.activeFilter]} onPress={() => setFilter('all')}>
          <Text style={styles.filterText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'followers' && styles.activeFilter]} onPress={() => setFilter('followers')}>
          <Text style={styles.filterText}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'following' && styles.activeFilter]} onPress={() => setFilter('following')}>
          <Text style={styles.filterText}>Following</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LottieView source={loadingAnimation} autoPlay loop style={styles.loadingAnimation} />
      ) : filteredUsers.length === 0 ? (
        <View style={styles.noUsersContainer}>
          <Text style={styles.noUsersText}>No users found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
         {filteredUsers.map((item) => (
  <TouchableOpacity
    key={item.id} // Ensure each item has a unique key
    style={styles.userCard}
    onPress={() => navigation.navigate("UsersProfile", { userId: item.id })}
  >
    <Image
      source={{ uri: item.residentProfile?.profilephoto || 'https://placeholder.com/avatar' }}
      style={styles.avatar}
    />
    <View style={styles.userInfo}>
      <Text style={styles.username}>{item.residentProfile?.fullName || 'Unknown'}</Text>
      <Text style={styles.bio}>
        {item.residentProfile?.bio?.length > 30
          ? `${item.residentProfile.bio.slice(0, 30)}...`
          : item.residentProfile?.bio || 'No bio available'}
      </Text>
    </View>
    <TouchableOpacity style={styles.viewProfileButton}>
      <Text style={styles.buttonText}>View Profile</Text>
    </TouchableOpacity>
  </TouchableOpacity>
))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filterContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
  filterButton: { backgroundColor: '#ddd', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginHorizontal: 5 },
  activeFilter: { backgroundColor: Colors.LIGHT_PURPLE },
  filterText: { color: 'black', fontSize: 14, fontWeight: '500' },
  noUsersContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  noUsersText: { fontSize: 18, color: '#777', fontWeight: 'bold' },
  listContent: { paddingHorizontal: 15, paddingTop: 10 },
  loadingAnimation: { width: 600, height: 500, alignSelf: 'center' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  userInfo: { flex: 1 },
  username: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  bio: { fontSize: 14, color: '#666', maxWidth: 140 },
  viewProfileButton: { backgroundColor: Colors.LIGHT_PURPLE, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, width: 100 },
  buttonText: { color: 'white', fontSize: 12, fontWeight: '400' },
});

export default FriendsRoute;