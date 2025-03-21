import React from 'react';
// import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  // ActivityIndicator,
  StyleSheet
} from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import axios from 'axios';
// import { APP_ENV } from '../../core/utils/BaseUrl';
// import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = () => {
  // Comment out all state management
  // const [posts, setPosts] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);
  // const navigation = useNavigation();

  // Comment out API calls
  /*
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = await AsyncStorage.getItem('USER_ACCESS');
        const response = await axios.get(`${APP_ENV.SOCIAL_PORT}/posts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);
  */

  // Comment out interaction handlers
  /*
  const handlePostPress = (postId) => {
    navigation.navigate('PostDetails', { postId });
  };
  */

  // Comment out render items
  /*
  const renderPostItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.postContainer}
      onPress={() => handlePostPress(item.id)}
    >
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text>{item.content}</Text>
    </TouchableOpacity>
  );
  */

  // Static UI only
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
        />
      </View>

      {/* Example static content */}
      <View style={styles.postContainer}>
        <Text style={styles.postTitle}>Sample Post Title 1</Text>
        <Text>This is a sample post content to demonstrate the UI layout.</Text>
      </View>

      <View style={styles.postContainer}>
        <Text style={styles.postTitle}>Sample Post Title 2</Text>
        <Text>Another example of static content for the home feed.</Text>
      </View>

      {/* Commented out dynamic content */}
      {/* {loading ? (
        <ActivityIndicator size="large" />
      ) : error ? (
        <Text>Error loading posts</Text>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id.toString()}
        />
      )} */}

      {/* Static bottom navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Text>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Text>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Text>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logo: {
    width: 40,
    height: 40,
  },
  postContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  navButton: {
    padding: 8,
  }
});

export default HomeScreen;