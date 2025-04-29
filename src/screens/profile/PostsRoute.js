import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { APP_ENV } from '../../utils/BaseUrl';
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from 'lottie-react-native';
import loadingAnimation from '../../../assets/animations/LoadingAnimatoion3.json';

function PostsRoute() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const userId = await AsyncStorage.getItem("userId");
    try {
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentposts/${userId}/${userId}`
      );
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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
      
          {posts.map((item) => {
            const user = item.user?.residentProfile;
            const hasPhoto = item.photos && item.photos.length > 0;

            return (
              <View key={item.id.toString()} style={styles.postCard}>
                <View style={styles.userInfo}>
                  <Image
                    source={{ uri: user?.profilephoto || 'https://placeholder.com/avatar' }}
                    style={styles.avatar}
                  />
                  <Text style={styles.username}>{user?.fullName}</Text>
                </View>

                {hasPhoto && (
                  <Image
                    source={{ uri: item.photos[0] }}
                    style={styles.postImage}
                  />
                )}

                <Text style={styles.caption}>{item.caption}</Text>
              </View>
            );
          })}
        
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
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  loadingAnimation: {
    width: 600, // Adjust the size as needed
    height: 500, // Adjust the size as needed
    alignSelf: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  postCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  caption: {
    fontSize: 14,
    color: '#333',
  },
});

export default PostsRoute;
