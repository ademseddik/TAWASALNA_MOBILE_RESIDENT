import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
    Modal
, Switch,
TouchableWithoutFeedback 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from '../../utils/BaseUrl';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';

const UserGroups = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [fetchedGroups, setFetchedGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
 const [modalVisible, setModalVisible] = useState(false);
    const [isPublic, setIsPublic] = useState(true);
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    groupphoto: '',
    type: 'PUBLIC',
  });
const handleToggle = () => {
  const newType = isPublic ? 'PRIVATE' : 'PUBLIC';  
  setIsPublic(prev => !prev);
  setGroupData(prevData => ({ ...prevData, type: newType }));
};

 const handleCreateGroup = async () => {
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
      } else {
        console.error('Failed to create group:', await response.text());
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };


  const fetchGroups = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/getGroupByUserId/${userId}`
      );
      const data = await response.json();

        const formattedGroups = data.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description || 'No description available',
      image: group.groupphoto ? 
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/images?fileUrl=${group.groupphoto}` : 
        'https://via.placeholder.com/150',
      type: group.type,
      creator: group.creator,
      members: group.members
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

    if (filterType !== 'all') {
      filtered = filtered.filter(group => group.relation === filterType);
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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
       onPress={() => navigation.navigate('GroupDetails', { 
      groupData: item,  // Pass the entire group object
      groupPics: item.groupphoto
    })}
    >
      <Image
        source={{
          uri: item.image || 'https://i.ibb.co/GLMJBr3/Group-Photo-Place-Holder.jpg',
        }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.name}</Text>
        <Text style={styles.bio}>
          {item.description.length > 30
            ? `${item.description.slice(0, 30)}...`
            : item.description}
        </Text>
        <View style={styles.row}>
          <Text style={styles.typeIndicator}>{item.type}</Text>
        </View>
      </View>
      <Icon name="chevron-right" size={24} color="#6200EE" style={styles.nextIcon} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search Groups..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => setFilter('creator')}>
          <Text>Owned</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('member')}>
          <Text>Member</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('all')}>
          <Text>All</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" />
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
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
        />
        <View>
          <View style={styles.sectionContent}>
            <Ionicons name="people" size={24} color="#333" />
            <View style={styles.textContainer}>
              <Text style={styles.sectionTitle}>Private Account</Text>
              <Text style={styles.description}>
                {isPublic ? 'Your group and posts are visible to everyone' : 'Only approved followers can see your posts'}
              </Text>
            </View>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isPublic ? "#f5dd4b" : "#f4f3f4"}
            onValueChange={handleToggle}
            value={isPublic}
          />
        </View>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableWithoutFeedback>
</Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    marginTop: 40,
  },
  searchBar: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  userCard: {
    flexDirection: 'row',
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
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
  },
  bio: {
    fontSize: 14,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  typeIndicator: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#007AFF',
  },
  nextIcon: {
    alignSelf: 'center',
    marginLeft: 'auto',
  },
   fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6200EE',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: '#6200EE',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
    textContainer: {
        marginLeft: 16,
    },sectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        maxWidth: 250,
    },sectionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    }, section: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
    },

});

export default UserGroups;
