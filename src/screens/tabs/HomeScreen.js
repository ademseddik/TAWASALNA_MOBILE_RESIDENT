import AddPostModal from '../../components/pupUps/AddPostModal';
import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { APP_ENV } from '../../utils/BaseUrl';
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from 'lottie-react-native';
import loadingAnimation from '../../../assets/animations/LoadingAnimatoion3.json';
import Colors from '../../../assets/Colors';
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import { differenceInCalendarISOWeek, parseISO } from 'date-fns';
import { Animated } from 'react-native'; // Add this import
import { useFocusEffect } from '@react-navigation/native';
export default function HomeScreen() {

  const [buttonAnim] = useState(new Animated.Value(100));
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


    useFocusEffect(
    React.useCallback(() => {
      // Reset animation value
      buttonAnim.setValue(100);
      
      // Run the animation
      Animated.spring(buttonAnim, {
        toValue: 0,
        delay:20,
        friction: 20,
        tension: 0,
        useNativeDriver: true,
      }).start();

     
      return () => {
        // Cleanup if needed
      };
    }, [buttonAnim])
  );

  const fetchPosts = async () => {
    const userId = await AsyncStorage.getItem("userId");
    try {
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getAllUserRelatedPost/${userId}`
      );
      const data = await response.json();

      const uniquePosts = data.filter(
        (post, index, self) =>
          index === self.findIndex((p) => p.id === post.id)
      );

      // Sort and shuffle logic
      const now = new Date();
      const currentWeek = getWeekNumber(now);
      const currentYear = now.getFullYear();

      const currentWeekPosts = [];
      const otherPosts = [];

      for (let post of uniquePosts) {
        const postDate = new Date(post.postDateTime);
        const postWeek = getWeekNumber(postDate);
        const postYear = postDate.getFullYear();

        if (postWeek === currentWeek && postYear === currentYear) {
          currentWeekPosts.push(post);
        } else {
          otherPosts.push(post);
        }
      }

      currentWeekPosts.sort((a, b) =>
        new Date(b.postDateTime) - new Date(a.postDateTime)
      );
      shuffleArray(otherPosts);

      const finalSortedPosts = [...currentWeekPosts, ...otherPosts];

      setPosts(finalSortedPosts);

    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Helper function to get ISO week number
  function getWeekNumber(date) {
    const onejan = new Date(date.getFullYear(), 0, 1);
    const millisInDay = 86400000;
    return Math.ceil(
      ((date - onejan + ((onejan.getDay() + 6) % 7) * millisInDay) / millisInDay + 1) / 7
    );
  }

  // Helper function to shuffle array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }




  const formatPostTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isNaN(date)) return 'Just now';

    const now = new Date();
    const diff = now - date;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      }).format(date);
    }
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };
  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <View style={styles.container}>
        {loading ? (
          <LottieView
            source={loadingAnimation}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        ) : posts.length === 0 ? (
          <View style={styles.noPostsContainer}>
            <Text style={styles.noPostsText}>No posts available</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.LIGHT_PURPLE]}
                tintColor={Colors.LIGHT_PURPLE}
              />
            }>
            {posts.map((item) => {
              const user = item.user?.residentProfile;
              const hasPhoto = item.photos && item.photos.length > 0;
              const isFromGroup = item.groupId && item.groupImage && item.groupName;

              return (
                <View key={item.id.toString()} style={styles.postContainer}>
                  <View style={styles.postHeader}>
                    <Image
                      source={{ uri: isFromGroup ? item.groupImage : user?.profilephoto || 'https://placeholder.com/avatar' }}
                      style={styles.avatar}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.username}>
                        {isFromGroup ? item.groupName : user?.fullName}
                      </Text>

                      {isFromGroup && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', top: 5 }}>
                          <Image
                            source={{ uri: user?.profilephoto || 'https://placeholder.com/avatar' }}
                            style={{ width: 20, height: 20, borderRadius: 10, marginRight: 6 }}
                          />
                          <Text style={{ fontSize: 13, color: Colors.GRAY }}>{user?.fullName}</Text>
                        </View>
                      )}

                      <View style={styles.postMeta}>
 {isFromGroup && (
                        <Text style={{
                          left: 26, color: Colors.GRAY,
                          fontSize: 12,
                        }}>{formatPostTime(item.postDateTime)}</Text>
                      )}
                       {!isFromGroup && (
                        <Text style={{
                          color: Colors.GRAY,
                          fontSize: 12,
                        }}>{formatPostTime(item.postDateTime)}</Text>
                      )}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.menuButton}>
                      <MaterialIcons name="more-horiz" size={24} color={Colors.BLACK} />
                    </TouchableOpacity>
                  </View>

                  {hasPhoto && (
                    <Image
                      source={{ uri: item.photos[0] }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <AntDesign name="hearto" size={24} color={Colors.LIGHT_PURPLE} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <MaterialIcons name="comment" size={24} color={Colors.LIGHT_PURPLE} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <MaterialIcons name="send" size={24} color={Colors.LIGHT_PURPLE} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.caption}>{item.caption}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <AddPostModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />

     <Animated.View // Replace TouchableOpacity with Animated.View
        style={[
          styles.addButton,
          {
            transform: [{ translateX: buttonAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Text style={styles.addText}>＋</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    marginTop: 40
  },
  listContent: {
    paddingBottom: 20,


  },
  loadingAnimation: {
    width: 600,
    height: 500,
    alignSelf: 'center',
  },
  postContainer: {
    marginVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_PURPLE,
    borderBottomWidth: 3,
    paddingBottom: 16,
    borderBottomEndRadius: 50,
    borderBottomStartRadius: 50
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    color: Colors.BLACK,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  postTime: {
    color: Colors.GRAY,
    fontSize: 12,
    marginLeft: 4,
  },
  menuButton: {
    padding: 8,
  },
  postImage: {
    width: '100%',
    height: 375,
    marginVertical: 8,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  actionButton: {
    marginRight: 16,
  },
  caption: {
    fontSize: 14,
    color: Colors.BLACK,
    paddingHorizontal: 16,
    marginTop: 8,
    lineHeight: 20,
  },
  noPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noPostsText: {
    fontSize: 18,
    color: Colors.GRAY,
    fontWeight: '500',
  },
   addButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    width: 56,
    height: 56,
    borderRadius: 28,
    position: 'absolute',
    bottom: 25,
    right: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addText: {
    color: Colors.WHITE,
    fontSize: 32,
    fontWeight: '300',
    marginTop: -4,
  },
  ownerLabel: {
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
});