import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_ENV } from '../../utils/BaseUrl';
import Icon from 'react-native-vector-icons/FontAwesome';
import { FollowService } from '../../services/follow.service';
import Colors from '../../../assets/Colors';

const SearchScreen = ({ navigation }) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [fetchedResults, setFetchedResults] = useState([]); // Store all fetched data
  const [results, setResults] = useState([]); // Filtered results for display
  const [loading, setLoading] = useState(true);

  const [followStatus, setFollowStatus] = useState("follow");



  const fetchUsers = async () => {
    try {
      const currentUserId = await AsyncStorage.getItem("userId");
      
      const Community = await AsyncStorage.getItem("USERCOMMUNITY");
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getUsersByCommunity?community=${encodeURIComponent(Community)}`
      );
      const data = await response.json();
  
      //const formattedUsers = data.filter(user => user.id !== currentUserId)
      const formattedUsers = data
      .map(user => {
        const profile = user.residentProfile;
    
        return {
          id: user.id,
          name: profile.fullName,
          description: profile.bio,
          privacy: profile.accountType,
          image: profile.profilephoto || 'https://placeholder.com/avatar',
          type: 'person',
          followStatus,
        };
      });
  
      return formattedUsers; 
  
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  };
  
  const fetchGroups = async () => {
    try {
      const response = await fetch(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/group`);
      const data = await response.json();
      return data.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description || 'No description available',
        image: group.groupphoto || 'https://placeholder.com/avatar',
        type: 'group',
      }));
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const users = await fetchUsers();
    const groups = await fetchGroups();
    setFetchedResults([...users, ...groups]); // Store all data separately
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);



  
   
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const filtered = fetchedResults.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || item.type === filter)
      );
      setResults(filtered);
    } else {
      setResults([]); // Clear results when search is empty
    }
  };

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = fetchedResults.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (filter === 'all' || item.type === filter)
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [searchQuery, filter, fetchedResults]); 

  const renderItem = ({ item }) => (
<TouchableOpacity
  style={styles.userCard}
  onPress={() => {
    if (item.type === 'group') {
      navigation.navigate('GroupDetails', {
        groupData: item,
        groupPics: item.groupphoto,
      });
    } else {
      navigation.navigate('UsersProfile', {
        userId: item.id,
      });
    }
  }}
>
      <Image source={{ uri: item.image || 'https://placeholder.com/avatar' }} style={styles.avatar} />
      
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.name}</Text>
        <Text style={styles.bio}>
          {item.description.length > 30 ? `${item.description.slice(0, 30)}...` : item.description}
        </Text>
  
        {/* Row for Type and Privacy */}
        <View style={styles.row}>
          <Text style={styles.typeIndicator}>{item.type === 'group' ? 'Group' : 'Person'}</Text>
          {item.privacy === 'PUBLIC' ? (
            <Icon name="unlock" size={15} color={Colors.LIGHT_PURPLE} style={styles.icon} />
          ) : (
            <Icon name="lock" size={15} color="black" style={styles.icon} />
          )}
        </View>
      </View>
  
      {/* Navigation Icon */}
      <Icon 
        name="chevron-right" 
        size={24} 
        color={Colors.LIGHT_PURPLE}
        style={styles.nextIcon} 
      />
    </TouchableOpacity>
  );
  


  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search..."
        value={searchQuery}
        onChangeText={handleSearch} // Filter data based on search input
      />
      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => setFilter('person')}><Text>People</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('group')}><Text>Groups</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('all')}><Text>All</Text></TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
      ) : (
        <FlatList data={results} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, marginTop: 40 },
  searchBar: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 10 },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  userCard: { flexDirection: 'row', padding: 15, borderWidth: 1, borderRadius: 8, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  userInfo: { flex: 1 },
  username: { fontWeight: 'bold', fontSize: 16 },
  bio: { fontSize: 14, color: '#666' },
  viewProfileButton: { backgroundColor: '#6200EE', padding: 10, borderRadius: 50,minHeight:70,minWidth:70,maxHeight:70},
  buttonText: { color: 'white', fontWeight: 'bold',alignContent:"center",alignSelf:"center",paddingTop:13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  typeIndicator: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#007AFF',
    marginRight: 10, // Space between text and icon
  },
  icon: {
    marginLeft: 5, // Space between type and privacy
  },
  nextIcon: {
    alignSelf: "center",
    marginLeft: "auto",
  },
  

});

export default SearchScreen;