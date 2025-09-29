import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Switch,
  TouchableWithoutFeedback,
  Animated,
  Pressable,
  Dimensions,
  StatusBar,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from '../../../utils/BaseUrl';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../../assets/Colors';

const { width } = Dimensions.get('window');

const UserGroups = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [fetchedGroups, setFetchedGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    groupphoto: '',
    type: 'PUBLIC',
  });

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

  const handleToggle = () => {
    const newType = isPublic ? 'PRIVATE' : 'PUBLIC';  
    setIsPublic(prev => !prev);
    setGroupData(prevData => ({ ...prevData, type: newType }));
  };

  const handleCreateGroup = async () => {
    if (isCreatingGroup || !groupData.name.trim()) {
      return; // Prevent multiple submissions or empty group name
    }

    setIsCreatingGroup(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/create/${userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(groupData),
        }
      );

      if (response.ok) {
        fetchGroups(); // Refresh list
        setModalVisible(false);
        // Reset form
        setGroupData({
          name: '',
          description: '',
          groupphoto: '',
          type: 'PUBLIC',
        });
        setIsPublic(true);
      } else {
        console.error('Failed to create group:', await response.text());
      }
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/getAllGroupsByUser/${userId}/0/100`
      );
      const data = await response.json();
      console.log('Groups API response:', data);
      
      // Extract groups from the content array in the paginated response
      const groups = data.content || [];
      const formattedGroups = groups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description || 'No description available',
        image: group.image || 'https://i.ibb.co/GLMJBr3/Group-Photo-Place-Holder.jpg',
        owner: group.owner,
        type: 'group'
      }));

      setFetchedGroups(formattedGroups);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSearch = query => {
    setSearchQuery(query);
    filterGroups(query, filter);
  };

  const filterGroups = (query, filterType) => {
    let filtered = fetchedGroups;

    if (filterType === 'owned') {
      filtered = filtered.filter(group => group.owner === "true");
    } else if (filterType === 'member') {
      filtered = filtered.filter(group => group.owner === "false");
    }

    if (query.length > 0) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredGroups(filtered);
  };

  useEffect(() => {
    filterGroups(searchQuery, filter);
  }, [filter, fetchedGroups]);

  // Animated press effect
  const scaleAnim = useRef({}).current;

  const getScaleAnim = (id) => {
    if (!scaleAnim[id]) {
      scaleAnim[id] = new Animated.Value(1);
    }
    return scaleAnim[id];
  };

  const handlePress = (id, item) => {
    setTimeout(() => {
      navigation.navigate('GroupDetails', { 
        groupId: item.id
      });
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
      <Text style={styles.headerTitle}>My Groups</Text>
      <Text style={styles.headerSubtitle}>Manage your groups and communities</Text>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <View style={styles.emptyIconContainer}>
        <Icon name="users" size={48} color={Colors.LIGHT_PURPLE} />
      </View>
      <Text style={styles.emptyTitle}>No groups found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? `No matches for "${searchQuery}"` : 'Create your first group to get started'}
      </Text>
    </Animated.View>
  );

  const renderItem = ({ item }) => {
    const scale = getScaleAnim(item.id);
    
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
          <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
            <Icon name="users" size={20} color="#8B5CF6" />
          </View>

          {/* Avatar Container */}
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: item.image }} 
              style={styles.avatar} 
            />
          </View>

          {/* Content Container */}
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.username}>{item.name}</Text>
                             <View style={[styles.ownerBadge, item.owner === "true" ? styles.ownerBadgeActive : styles.memberBadge]}>
                 <Text style={styles.ownerBadgeText}>{item.owner === "true" ? 'Owner' : 'Member'}</Text>
               </View>
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
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
            placeholder="Search groups..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'owned' && styles.filterButtonActive]}
            onPress={() => setFilter('owned')}
          >
            <Text style={[styles.filterButtonText, filter === 'owned' && styles.filterButtonTextActive]}>Owned</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'member' && styles.filterButtonActive]}
            onPress={() => setFilter('member')}
          >
            <Text style={[styles.filterButtonText, filter === 'member' && styles.filterButtonTextActive]}>Member</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : filteredGroups.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Group</Text>
              <TextInput
                style={styles.input}
                placeholder="Group Name"
                value={groupData.name}
                onChangeText={(text) => setGroupData({ ...groupData, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={groupData.description}
                onChangeText={(text) => setGroupData({ ...groupData, description: text })}
                multiline
                numberOfLines={3}
              />
              <View style={styles.section}>
                <View style={styles.sectionContent}>
                  <Switch
                    trackColor={{ false: Colors.GRAY, true: Colors.LIGHT_PURPLE }}
                    thumbColor={isPublic ? Colors.GRAY : Colors.LIGHT_PURPLE}
                    onValueChange={handleToggle}
                    value={isPublic}
                  />
                  <Ionicons name="people" size={24} color="#333" />
                  <View style={styles.textContainer}>
                    <Text style={styles.sectionTitle}>
                      {isPublic ? 'Public Group' : 'Private Group'}
                    </Text>
                    <Text style={styles.description}>
                      {isPublic ? 'Your group and posts are visible to everyone' : 'Only approved followers can see your posts'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.createButton, isCreatingGroup && styles.createButtonDisabled]} 
                onPress={handleCreateGroup}
                disabled={isCreatingGroup || !groupData.name.trim()}
              >
                {isCreatingGroup ? (
                  <View style={styles.loadingButtonContent}>
                    <ActivityIndicator size="small" color="#fff" style={styles.buttonLoader} />
                    <Text style={styles.buttonText}>Creating...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  ownerBadgeActive: {
    backgroundColor: '#F3E8FF',
  },
  memberBadge: {
    backgroundColor: '#FCE7F3',
  },
  ownerBadgeText: {
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.LIGHT_PURPLE,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  createButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonDisabled: {
    backgroundColor: '#B8B8B8',
    opacity: 0.7,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textContainer: {
    marginLeft: 16,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default UserGroups;
