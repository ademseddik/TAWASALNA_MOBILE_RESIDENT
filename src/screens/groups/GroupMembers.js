import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { APP_ENV } from '../../utils/BaseUrl';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView } from 'react-native-gesture-handler';
import Colors from '../../../assets/Colors';
import LottieView from 'lottie-react-native';
import loadingAnimation from '../../../assets/animations/LoadingAnimatoion3.json';

function GroupMembers({ userId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const Community = await AsyncStorage.getItem("USERCOMMUNITY");
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getUsersByCommunity?community=${encodeURIComponent(Community)}`
      );
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddFriend = async (friendId) => {
    // try {
    //   const userId = await AsyncStorage.getItem("userId");
    //   const response = await fetch(
    //     `${APP_ENV.SOCIAL_PORT}/api/send-friend-request`, // Update this endpoint
    //     {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({
    //         senderId: userId,
    //         receiverId: friendId
    //       }),
    //     }
    //   );
      
    //   if (response.ok) {
    //     // Update UI state to reflect sent request
    //     setUsers(users.map(user => 
    //       user.id === friendId ? { ...user, status: 'pending' } : user
    //     ));
    //   }
    // } catch (error) {
    //   console.error('Failed to send friend request:', error);
    // }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <LottieView
        source={loadingAnimation}
        autoPlay
        loop
        style={styles.loadingAnimation} // Add custom styling if needed
      />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {/* Other components before the list */}
  
          {users.map((item) => (
            <View key={item.id.toString()} style={styles.userCard}>
              <Image 
                source={{ uri: item.residentProfile.profilephoto || 'https://placeholder.com/avatar' }} 
                style={styles.avatar} 
              />
              <View style={styles.userInfo}>
                <Text style={styles.username}>{item.residentProfile.fullName}</Text>
                <Text style={styles.bio}>
                  {item.residentProfile.bio.length > 30 
                    ? item.residentProfile.bio.slice(0, 30) + '...' 
                    : item.residentProfile.bio}
                </Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.addButton,
                  item.status === 'pending' && styles.pendingButton
                ]}
                onPress={() => handleAddFriend(item.id)}
                disabled={item.status === 'pending'}
              >
                <Text style={styles.buttonText}>
                  {item.status === 'pending' ? 'Pending' : 'View profile'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
  
          {/* Other components after the list */}
       
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  loadingAnimation: {
    width: 600, // Adjust the size as needed
    height: 500, // Adjust the size as needed
    alignSelf: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor:Colors.LIGHT_PURPLE,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  pendingButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default GroupMembers;