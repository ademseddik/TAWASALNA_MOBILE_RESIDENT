import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Animated, Pressable, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_ENV } from '../../utils/BaseUrl';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FollowService } from '../../services/follow.service';
import Colors from '../../../assets/Colors';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Modal from 'react-native-modal';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const SearchScreen = ({ navigation }) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [fetchedResults, setFetchedResults] = useState([]); // Store all fetched data
  const [results, setResults] = useState([]); // Filtered results for display
  const [loading, setLoading] = useState(true);
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  
  const [followStatus, setFollowStatus] = useState("follow");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Initialize animations
  useEffect(() => {
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
  }, []);

  const fetchUsers = async () => {
    try {
      const currentUserId = await AsyncStorage.getItem("userId");
      
   
      
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getUserByCommunityid/${currentUserId}`
      );
      
      console.log('Users API response status:', response.status);
      
      if (!response.ok) {
        console.error('Users API error:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      console.log('Users API data:', data);
  
      // Filter out current user if needed
      // const formattedUsers = data.filter(user => user.id !== currentUserId)
      const formattedUsers = data.map(user => {
        console.log('Processing user:', user);
        const formattedUser = {
          id: user.id,
          name: user.name,
          description: user.description || '', // Use bio from API response
          privacy: 'PUBLIC', // Default to public since not provided in API
          image: user.image || 'https://placeholder.com/avatar',
          type: 'person',
          followStatus,
        };
        console.log('Formatted user:', formattedUser);
        return formattedUser;
      });
      
      console.log('Formatted users:', formattedUsers);
      return formattedUsers; 
  
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  };
  
  const fetchGroups = async () => {
    try {
      const Community = "66867d06f4c3de5f09170f5b"
      const response = await fetch(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/getAllGroupsByCommunity/${Community}/0/100`);
      const data = await response.json();
      
      // Extract groups from the content array in the paginated response
      const groups = data.content || [];
      return groups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description || 'No description available',
        image: group.image || 'https://placeholder.com/avatar',
        type: 'group',
      }));
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const users = await fetchUsers();
      const groups = await fetchGroups();
      
      console.log('Fetched users count:', users.length);
      console.log('Fetched groups count:', groups.length);
      
      // Ensure both arrays are valid before combining
      const validUsers = Array.isArray(users) ? users : [];
      const validGroups = Array.isArray(groups) ? groups : [];
      
      const combinedResults = [...validUsers, ...validGroups];
      console.log('Combined results count:', combinedResults.length);
      console.log('Combined results:', combinedResults);
      
      // Log the breakdown by type
      const usersInResults = combinedResults.filter(item => item.type === 'person');
      const groupsInResults = combinedResults.filter(item => item.type === 'group');
      console.log('Users in combined results:', usersInResults.length);
      console.log('Groups in combined results:', groupsInResults.length);
      
      setFetchedResults(combinedResults); // Store all data separately
    } catch (error) {
      console.error('Error fetching data:', error);
      setFetchedResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  
   
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 0 && fetchedResults && fetchedResults.length > 0) {
      const filtered = fetchedResults.filter(item =>
        item && item.name && item.name.toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || item.type === filter)
      );
      setResults(filtered);
    } else {
      // Show all results when search is empty, filtered by current filter
      if (fetchedResults && fetchedResults.length > 0) {
        const filtered = fetchedResults.filter(item =>
          item && (filter === 'all' || item.type === filter)
        );
        setResults(filtered);
      } else {
        setResults([]);
      }
    }
  };

  useEffect(() => {
    console.log('Filter effect triggered - searchQuery:', searchQuery, 'filter:', filter, 'fetchedResults count:', fetchedResults?.length);
    
    if (searchQuery.length > 0 && fetchedResults && fetchedResults.length > 0) {
      const filtered = fetchedResults.filter(item =>
        item && item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (filter === 'all' || item.type === filter)
      );
      console.log('Search filtered results:', filtered.length);
      setResults(filtered);
    } else {
      // Show all results when search is empty, filtered by current filter
      if (fetchedResults && fetchedResults.length > 0) {
        const filtered = fetchedResults.filter(item =>
          item && (filter === 'all' || item.type === filter)
        );
        console.log('No search - filtered results:', filtered.length, 'filter type:', filter);
        console.log('Filtered results breakdown:', {
          all: filtered.filter(item => item.type === 'all').length,
          person: filtered.filter(item => item.type === 'person').length,
          group: filtered.filter(item => item.type === 'group').length
        });
        setResults(filtered);
      } else {
        setResults([]);
      }
    }
  }, [searchQuery, filter, fetchedResults]); 

  // Animated press effect
  const scaleAnim = useRef({}).current;

  const getScaleAnim = (id) => {
    if (!scaleAnim[id]) {
      scaleAnim[id] = new Animated.Value(1);
    }
    return scaleAnim[id];
  };

  const handlePress = (id, item) => {
    // Add a small delay to prevent accidental navigation during scrolling
    setTimeout(() => {
      if (item.type === 'group') {
        navigation.navigate('GroupDetails', {
          groupId: item.id,
        });
      } else {
        navigation.navigate('UsersProfile', {
          userId: item.id,
        });
      }
    }, 100);
  };

  const handlePressIn = (id) => {
    Animated.spring(getScaleAnim(id), {
      toValue: 0.97,
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

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.headerTitle}>Search</Text>
      <Text style={styles.headerSubtitle}>Find people and groups</Text>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <View style={styles.emptyIconContainer}>
        <Icon name="search" size={48} color={Colors.LIGHT_PURPLE} />
      </View>
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? `No matches for "${searchQuery}"` : 'Start typing to search for people and groups'}
      </Text>
    </Animated.View>
  );

  const renderLoadingMore = () => (
    <View style={styles.loadingMore}>
      <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
      <Text style={styles.loadingMoreText}>Loading...</Text>
    </View>
  );

  const getItemIcon = (type) => {
    if (type === 'group') {
      return { name: 'users', color: '#8B5CF6', bgColor: '#F3E8FF' };
    } else {
      return { name: 'user', color: '#EC4899', bgColor: '#FCE7F3' };
    }
  };

  const renderItem = ({ item, index }) => {
    const scale = getScaleAnim(item.id);
    const itemIcon = getItemIcon(item.type);
    
    return (
      <Pressable
        onPress={() => handlePress(item.id, item)}
        onPressIn={() => handlePressIn(item.id)}
        onPressOut={() => handlePressOut(item.id)}
        delayPressIn={150}
        style={{ marginBottom: 12 }}
      >
        <Animated.View
          style={[
            styles.searchCard,
            {
              transform: [{ scale }],
              shadowOpacity: scale.interpolate({
                inputRange: [0.97, 1],
                outputRange: [0.25, 0.15],
              }),
              elevation: scale.interpolate({
                inputRange: [0.97, 1],
                outputRange: [8, 4],
              }),
            },
          ]}
        >
          {/* Icon Container */}
          <View style={[styles.iconContainer, { backgroundColor: itemIcon.bgColor }]}>
            <Icon name={itemIcon.name} size={20} color={itemIcon.color} />
          </View>

          {/* Avatar Container */}
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: item.image || 'https://placeholder.com/avatar' }} 
              style={styles.avatar} 
            />
          </View>

          {/* Content Container */}
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.username}>{item.name}</Text>
              <View style={[styles.typeBadge, item.type === 'group' ? styles.groupBadge : styles.personBadge]}>
                <Text style={styles.typeBadgeText}>{item.type === 'group' ? 'Group' : 'Person'}</Text>
              </View>
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {item.description || (item.type === 'group' ? 'Join this group to connect with members' : 'Tap to view profile')}
            </Text>
            {item.privacy && (
              <View style={styles.privacyRow}>
                {item.privacy === 'PUBLIC' ? (
                  <Icon name="unlock" size={12} color="#10B981" />
                ) : (
                  <Icon name="lock" size={12} color="#6B7280" />
                )}
                <Text style={styles.privacyText}>
                  {item.privacy === 'PUBLIC' ? 'Public' : 'Private'}
                </Text>
              </View>
            )}
          </View>

          {/* Arrow Container */}
          <View style={styles.arrowContainer}>
            <Icon name="chevron-right" size={16} color={Colors.LIGHT_PURPLE} />
          </View>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {renderHeader()}

      <Animated.View style={[styles.searchContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.searchRow}>
          <Icon name="search" size={20} color={Colors.LIGHT_PURPLE} style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search people and groups..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={styles.qrIconButton}
            onPress={() => setScannerVisible(true)}
          >
            <Icon name="qrcode" size={20} color={Colors.LIGHT_PURPLE} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'person' && styles.filterButtonActive]}
            onPress={() => setFilter('person')}
          >
            <Text style={[styles.filterButtonText, filter === 'person' && styles.filterButtonTextActive]}>People</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'group' && styles.filterButtonActive]}
            onPress={() => setFilter('group')}
          >
            <Text style={[styles.filterButtonText, filter === 'group' && styles.filterButtonTextActive]}>Groups</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Modal
        isVisible={isScannerVisible}
        onBackdropPress={() => setScannerVisible(false)}
        onBackButtonPress={() => setScannerVisible(false)}
        style={{borderRadius:10,backgroundColor:"transparent"}}
      >
        <View style={{ 
            backgroundColor: 'white',
            borderRadius: 20, 
            overflow: 'hidden', 
            alignSelf: 'center', 
            width: '90%', 
            height: 300 
          }}>
          {permission?.granted ? (
            <CameraView
              style={{ flex: 1}}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => {
                setScannerVisible(false);
                navigation.navigate('UsersProfile', { userId: data });
              }}
            />
          ) : (
            <TouchableOpacity onPress={requestPermission} style={{flex:1,justifyContent:'center',alignItems:'center'}}>
              <Text>Grant Camera Permission</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : results.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList 
          data={results} 
          renderItem={renderItem} 
          keyExtractor={(item) => item.id.toString()} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
         
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  qrIconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
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
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  groupBadge: {
    backgroundColor: '#F3E8FF',
  },
  personBadge: {
    backgroundColor: '#FCE7F3',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 6,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  arrowContainer: {
    padding: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
});

export default SearchScreen;