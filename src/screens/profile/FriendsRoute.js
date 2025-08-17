import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { APP_ENV } from '../../utils/BaseUrl';
import { ScrollView } from 'react-native-gesture-handler';
import LottieView from 'lottie-react-native';
import loadingAnimation from '../../../assets/animations/LoadingAnimatoion3.json';
import Colors from '../../../assets/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function FriendsRoute({ userId, navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [relationships, setRelationships] = useState({ followers: [], following: [] });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnims = useRef({}).current;

  const fetchUserProfile = async (id) => {
    try {
      const response = await fetch(`${APP_ENV.AUTH_PORT}/tawasalna-user/user/${id}`);
      if (!response.ok) {
        console.error(`Failed to fetch user ${id}: HTTP ${response.status}`);
        return null;
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
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
      const profileResponse = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`
      );

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

      setRelationships({
        followers: profileData.followers,
        following: profileData.following,
      });

      const allUsers = [...profileData.followers, ...profileData.following];
      const allUserIds = [...new Set(allUsers.map(u => (typeof u === 'string' ? u : u._id)))];

      const usersData = await Promise.all(allUserIds.map(id => fetchUserProfile(id)));
      setUsers(usersData.filter(user => user !== null));
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

  // Initialize animations
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const followerIds = relationships.followers.map(u => (typeof u === 'string' ? u : u._id));
  const followingIds = relationships.following.map(u => (typeof u === 'string' ? u : u._id));

  const filteredUsers = users.filter(user => {
    if (!user?.id) return false;

    if (filter === 'followers') {
      return followerIds.includes(user.id);
    } else if (filter === 'following') {
      return followingIds.includes(user.id);
    }
    return true; // All
  });

  const getScaleAnim = (id) => {
    if (!scaleAnims[id]) {
      scaleAnims[id] = new Animated.Value(1);
    }
    return scaleAnims[id];
  };

  const handlePressIn = (id) => {
    Animated.spring(getScaleAnim(id), {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = (id) => {
    Animated.spring(getScaleAnim(id), {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons name="account-group" size={48} color={Colors.LIGHT_PURPLE} />
      </View>
      <Text style={styles.emptyTitle}>No connections yet</Text>
      <Text style={styles.emptySubtitle}>
        Start connecting with people in your community
      </Text>
    </Animated.View>
  );

  const renderUserCard = ({ item, index }) => {
    const scaleAnim = getScaleAnim(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.userCard}
        onPress={() => navigation.navigate("UsersProfile", { userId: item.id })}
        onPressIn={() => handlePressIn(item.id)}
        onPressOut={() => handlePressOut(item.id)}
        activeOpacity={0.9}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={styles.userCardContent}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: item.residentProfile?.profilephoto || 'https://placeholder.com/avatar' }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{item.residentProfile?.fullName || 'Unknown'}</Text>
              <Text style={styles.bio}>
                {item.residentProfile?.bio?.length > 30
                  ? `${item.residentProfile.bio.slice(0, 30)}...`
                  : item.residentProfile?.bio || 'No bio available'}
              </Text>
            </View>
            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.viewProfileButton}>
                <MaterialCommunityIcons name="account-arrow-right" size={16} color="#fff" />
                <Text style={styles.buttonText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.filterContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'followers' && styles.filterButtonActive]}
          onPress={() => setFilter('followers')}
        >
          <Text style={[styles.filterButtonText, filter === 'followers' && styles.filterButtonTextActive]}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'following' && styles.filterButtonActive]}
          onPress={() => setFilter('following')}
        >
          <Text style={[styles.filterButtonText, filter === 'following' && styles.filterButtonTextActive]}>Following</Text>
        </TouchableOpacity>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LottieView source={loadingAnimation} autoPlay loop style={styles.loadingAnimation} />
          <Text style={styles.loadingText}>Loading connections...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredUsers.map((item, index) => renderUserCard({ item, index }))}
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
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderColor: Colors.LIGHT_PURPLE,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionContainer: {
    marginLeft: 12,
  },
  viewProfileButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: Colors.LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default FriendsRoute;
