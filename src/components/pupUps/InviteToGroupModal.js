import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native";
import { AntDesign, Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import Colors from "../../../assets/Colors";
import Axios from 'axios';
import { APP_ENV } from '../../utils/BaseUrl';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get('window');

const InviteToGroupModal = ({ isVisible, onClose, groupId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch users from community
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      const communityId = await AsyncStorage.getItem("USERCOMMUNITY");
      
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getUserByCommunityid/${userId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      
             // Filter out current user and format data
       const formattedUsers = data
         .filter(user => user.id !== userId)
         .map(user => ({
           id: user.id,
           name: user.name || 'Unknown User',
           avatar: user.image || 'https://via.placeholder.com/100',
           bio: user.description || '',
         }));
      
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load users",
        text2: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load users when modal opens
  useEffect(() => {
    if (isVisible) {
      fetchUsers();
    }
  }, [isVisible]);

  // Filter users based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.bio.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Handle user selection
  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Send invitations
  const sendInvitations = async () => {
    if (selectedUsers.length === 0) {
      Toast.show({
        type: "info",
        text1: "Please select users to invite",
      });
      return;
    }

    setSending(true);
    try {
      const currentUserId = await AsyncStorage.getItem("userId");
      
      const invitations = await Promise.all(
        selectedUsers.map(user =>
          Axios.post(
            `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/inviteToGroup/${groupId}/${currentUserId}/${user.id}`
          )
        )
      );

      const successCount = invitations.filter(res => res.status === 200).length;
      
      Toast.show({
        type: "success",
        text1: `Invitations sent successfully!`,
        text2: `${successCount} out of ${selectedUsers.length} invitations sent`,
      });

      setSelectedUsers([]);
      onClose();
    } catch (error) {
      console.error("Error sending invitations:", error);
      Toast.show({
        type: "error",
        text1: "Failed to send invitations",
        text2: "Please try again",
      });
    } finally {
      setSending(false);
    }
  };

  // Render individual user item
  const renderUserItem = ({ item: user }) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    
    return (
      <TouchableOpacity
        onPress={() => toggleUserSelection(user)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 20,
          backgroundColor: isSelected ? Colors.LIGHT_PURPLE + '15' : 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: Colors.PLATINUM,
        }}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: user.avatar }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              borderWidth: 2,
              borderColor: isSelected ? Colors.LIGHT_PURPLE : Colors.PLATINUM,
            }}
          />
          {isSelected && (
            <View style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: Colors.LIGHT_PURPLE,
              borderRadius: 16,
              width: 24,
              height: 24,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: 'white',
            }}>
              <Feather name="check" size={12} color="white" />
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: Colors.BLACK,
            marginBottom: 4,
          }}>
            {user.name}
          </Text>
          {user.bio && (
            <Text style={{
              fontSize: 14,
              color: Colors.GunmetalGray,
              lineHeight: 18,
            }} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
        </View>

        {/* Selection Indicator */}
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: isSelected ? Colors.LIGHT_PURPLE : Colors.GunmetalGray,
          backgroundColor: isSelected ? Colors.LIGHT_PURPLE : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {isSelected && (
            <Feather name="check" size={14} color="white" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render selected users chips
  const renderSelectedChips = () => {
    if (selectedUsers.length === 0) return null;

    return (
      <View style={{
        backgroundColor: Colors.LIGHT_PURPLE + '10',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: Colors.LIGHT_PURPLE,
          }}>
            Selected ({selectedUsers.length})
          </Text>
          <TouchableOpacity
            onPress={() => setSelectedUsers([])}
            style={{
              padding: 4,
            }}
          >
            <Text style={{
              fontSize: 12,
              color: Colors.GunmetalGray,
            }}>
              Clear all
            </Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={selectedUsers}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item: user }) => (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.LIGHT_PURPLE + '20',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginRight: 8,
            }}>
              <Image
                source={{ uri: user.avatar }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  marginRight: 6,
                }}
              />
              <Text style={{
                fontSize: 12,
                fontWeight: '500',
                color: Colors.LIGHT_PURPLE,
                marginRight: 4,
              }}>
                {user.name}
              </Text>
              <TouchableOpacity
                onPress={() => toggleUserSelection(user)}
                style={{
                  padding: 2,
                }}
              >
                <Feather name="x" size={12} color={Colors.LIGHT_PURPLE} />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={item => item.id}
        />
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          minHeight: height * 0.7,
          maxHeight: height * 0.9,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: Colors.PLATINUM,
          }}>
            <View>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: Colors.BLACK,
                marginBottom: 4,
              }}>
                Invite to Group
              </Text>
              <Text style={{
                fontSize: 14,
                color: Colors.GunmetalGray,
              }}>
                Select users to invite
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.PLATINUM,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="close" size={24} color={Colors.BLACK} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={{
            paddingHorizontal: 24,
            paddingVertical: 20,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.PLATINUM,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}>
              <AntDesign name="search1" size={20} color={Colors.GunmetalGray} />
              <TextInput
                placeholder="Search users by name or bio..."
                placeholderTextColor={Colors.GunmetalGray}
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: Colors.BLACK,
                }}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.GunmetalGray} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Selected Users */}
          {renderSelectedChips()}

          {/* Users List */}
          <View style={{ flex: 1 }}>
            {loading ? (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 60,
              }}>
                <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
                <Text style={{
                  marginTop: 16,
                  fontSize: 16,
                  color: Colors.GunmetalGray,
                }}>
                  Loading users...
                </Text>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 60,
              }}>
                <MaterialIcons 
                  name="people-outline" 
                  size={64} 
                  color={Colors.GunmetalGray} 
                />
                <Text style={{
                  marginTop: 16,
                  fontSize: 18,
                  fontWeight: '600',
                  color: Colors.BLACK,
                  textAlign: 'center',
                }}>
                  {searchQuery ? 'No users found' : 'No users available'}
                </Text>
                <Text style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: Colors.GunmetalGray,
                  textAlign: 'center',
                }}>
                  {searchQuery ? 'Try adjusting your search' : 'There are no users in your community'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
              />
            )}
          </View>

          {/* Bottom Action Bar */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: Colors.PLATINUM,
            paddingHorizontal: 24,
            paddingVertical: 20,
            paddingBottom: 40,
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: selectedUsers.length > 0 ? Colors.LIGHT_PURPLE : Colors.PLATINUM,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                opacity: sending ? 0.7 : 1,
              }}
              onPress={sendInvitations}
              disabled={sending || selectedUsers.length === 0}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={selectedUsers.length > 0 ? "white" : Colors.GunmetalGray} 
                  style={{ marginRight: 8 }} 
                />
              )}
              <Text style={{
                color: selectedUsers.length > 0 ? "white" : Colors.GunmetalGray,
                fontSize: 16,
                fontWeight: '600',
              }}>
                {sending 
                  ? 'Sending Invitations...' 
                  : selectedUsers.length > 0 
                    ? `Send Invitations (${selectedUsers.length})`
                    : 'Select users to invite'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InviteToGroupModal;
