import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Axios from 'axios';
import { APP_ENV } from '../../utils/BaseUrl';
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  EvilIcons,
  Feather,
  Entypo,
  Fontisto
} from "react-native-vector-icons";
import Colors from "../../../assets/Colors";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Card, Title, Paragraph } from "react-native-paper";
import { Dimensions } from "react-native";
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

import GroupMembersModal from "../../components/pupUps/GroupMembersModal";
import InviteToGroupModal from "../../components/pupUps/InviteToGroupModal";
import CommentModel from "../../components/pupUps/CommentModel";
import SendModel from "../../components/pupUps/SendModel";
import ShareModel from "../../components/pupUps/ShareModel";
import PostOptionsModel from "../../components/pupUps/PostOptionsModel";
import PostCard from "../../components/PostCard";

const GroupDetails = ({ route }) => {
  const navigation = useNavigation();
  const { groupId } = route.params;
  const { width } = Dimensions.get("window");
  
  // Debug logging
  console.log("GroupDetails - route.params:", route.params);
  console.log("GroupDetails - groupId:", groupId);
  
  // State for group information
  const [groupInfo, setGroupInfo] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for posts
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  
  // State for creating posts
  const [caption, setCaption] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  
  // State for modals
  const [groupMembersModalVisible, setGroupMembersModalVisible] = useState(false);
  const [inviteToGroupModalVisible, setInviteToGroupModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostCommentId, setSelectedPostCommentId] = useState(null);
  const [optionsPostModalVisible, setOptionsPostModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  
  // State for group image
  const [selectedGroupImage, setSelectedGroupImage] = useState(null);
  const [isUpdatingGroupImage, setIsUpdatingGroupImage] = useState(false);
  const [isJoiningLeaving, setIsJoiningLeaving] = useState(false);

  // Get current user ID on component mount
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        setCurrentUserId(userId);
      } catch (error) {
        console.error("Error getting current user ID:", error);
      }
    };
    getCurrentUserId();
  }, []);

  // Memoized caption handler to prevent keyboard closing
  const handleCaptionChange = useCallback((text) => {
    setCaption(text);
  }, []);

  // Handle media selection for posts
  const handleMediaSelection = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      aspect: [4, 4],
      quality: 1,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const selectedAssets = result.assets;
      const hasVideo = selectedAssets.some((asset) =>
        asset.type.toLowerCase().includes("video")
      );

      if (hasVideo) {
        const videoAsset = selectedAssets.find((asset) =>
          asset.type.toLowerCase().includes("video")
        );
        setSelectedVideo(videoAsset.uri);
        setSelectedPhotos([]);
      } else {
        setSelectedPhotos(selectedAssets.map(asset => asset.uri));
        setSelectedVideo("");
      }
    }
  }, []);

  // Create post
  const createPost = useCallback(async () => {
    if (!caption.trim() && selectedPhotos.length === 0 && !selectedVideo) {
      Toast.show({
        type: "info",
        text1: "Please add content to your post",
        visibilityTime: 3000,
      });
      return;
    }

    try {
      setIsCreatingPost(true);
      const formData = new FormData();
      
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }
      
      if (selectedPhotos.length > 0) {
        selectedPhotos.forEach((photo, index) => {
          formData.append(`photos[${index}]`, {
            uri: photo,
            name: `photo${index}.jpg`,
            type: "image/jpeg",
          });
        });
      }

      if (selectedVideo) {
        const videoResponse = await fetch(selectedVideo);
        const videoBlob = await videoResponse.blob();
        formData.append("video", {
          uri: selectedVideo,
          name: "video.mp4",
          type: videoBlob.type,
        });
      }

      await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/addpost/${groupId}/${currentUserId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Toast.show({
        type: "success",
        text1: "Post created successfully",
        visibilityTime: 3000,
      });

      // Clear form and refresh posts
      setCaption("");
      setSelectedPhotos([]);
      setSelectedVideo("");
      fetchGroupPosts(0, true);
    } catch (error) {
      console.error("Error creating post:", error);
      Toast.show({
        type: "error",
        text1: "Error creating post",
        visibilityTime: 3000,
      });
    } finally {
      setIsCreatingPost(false);
    }
  }, [caption, selectedPhotos, selectedVideo, groupId, currentUserId]);

  // Modal toggle functions
  const toggleGroupMembersModal = useCallback(() => setGroupMembersModalVisible(!groupMembersModalVisible), [groupMembersModalVisible]);
  const toggleInviteToGroupModal = useCallback(() => setInviteToGroupModalVisible(!inviteToGroupModalVisible), [inviteToGroupModalVisible]);
  const toggleCommentModal = useCallback((postId) => {
    setSelectedPostCommentId(postId);
    setCommentModalVisible(!commentModalVisible);
  }, [commentModalVisible]);
  const toggleOptionsPostModal = useCallback((postId) => {
    setSelectedPostId(postId);
    setOptionsPostModalVisible(!optionsPostModalVisible);
  }, [optionsPostModalVisible]);
  const toggleSendModal = useCallback(() => setSendModalVisible(!sendModalVisible), [sendModalVisible]);
  const toggleShareModal = useCallback(() => setShareModalVisible(!shareModalVisible), [shareModalVisible]);

  // Join/Leave group functions
  const joinGroup = useCallback(async () => {
    // Add join group logic here
    console.log('Join group functionality');
  }, []);

  const leaveGroup = useCallback(async () => {
    // Add leave group logic here
    console.log('Leave group functionality');
  }, []);

  // Handle group image selection (only for creator)
  const handleGroupImageSelection = useCallback(async () => {
    if (!isCreator) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedGroupImage(result.assets[0].uri);
      // updateGroupImage(result.assets[0].uri);
    }
  }, [isCreator]);

  // Render group header (Memoized to prevent re-renders)
  const renderGroupHeader = useMemo(() => (
    <View>
      {/* Group Header */}
      <TouchableOpacity onPress={handleGroupImageSelection} disabled={!isCreator}>
        <View>
          <Image
            source={{ uri: groupInfo?.image }}
            style={{ width: width, height: 200, borderRadius: 10 }}
            resizeMode="cover"
          />
          {isCreator && (
            <MaterialIcons 
              name="edit" 
              size={30} 
              color={Colors.LIGHT_PURPLE} 
              style={{ position: "absolute", bottom: 10, right: 10 }} 
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Group Info */}
      <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
        <Text style={{ color: "black", fontWeight: "bold", fontSize: 20 }}>{groupInfo?.name}</Text>
      </View>

      <View style={{ flexDirection: "row", marginTop: 10, marginLeft: 15 }}>
        {groupInfo?.type === "PUBLIC" ? (
          <>
            <MaterialIcons name="public" size={20} />
            <Text style={{ color: "grey" }}> Group (Public) </Text>
          </>
        ) : (
          <Text style={{ color: "grey" }}>Group (private)</Text>
        )}
        <Text>{groupInfo?.members?.length || 0} </Text>
        <TouchableOpacity onPress={toggleGroupMembersModal}>
          <Text style={{ color: "grey" }}>members</Text>
        </TouchableOpacity>
      </View>

      {groupInfo?.description && (
        <View style={{ marginTop: 10, marginLeft: 15, marginRight: 15 }}>
          <Text style={{ color: "grey", fontSize: 14 }}>{groupInfo.description}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ flexDirection: "row", marginTop: 25, justifyContent: "space-around" }}>
        <TouchableOpacity
          onPress={isMember ? leaveGroup : joinGroup}
          disabled={isJoiningLeaving}
          style={{
            height: 35,
            width: "40%",
            borderColor: "gray",
            borderWidth: 0.3,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            backgroundColor: isMember ? Colors.LIGHT_PURPLE : "white",
            opacity: isJoiningLeaving ? 0.7 : 1,
          }}
        >
          {isJoiningLeaving ? (
            <ActivityIndicator 
              size="small" 
              color={isMember ? "white" : Colors.LIGHT_PURPLE} 
            />
          ) : (
            <>
              <FontAwesome5
                name="user-friends"
                color={isMember ? "white" : "black"}
                size={15}
                style={{ marginRight: 5 }}
              />
              <Text style={{ fontSize: 17, color: isMember ? "white" : "black" }}>
                {isMember ? "Member" : "Join"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Invite Button - only visible for members and admins */}
        {(isMember || isAdmin) && (
          <TouchableOpacity
            onPress={toggleInviteToGroupModal}
            style={{
              height: 35,
              width: "40%",
              borderColor: Colors.LIGHT_PURPLE,
              borderWidth: 1,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: Colors.LIGHT_PURPLE,
              flexDirection: "row",
            }}
          >
            <Ionicons
              name="person-add-outline"
              color="white"
              size={15}
              style={{ marginRight: 5 }}
            />
            <Text style={{ fontSize: 17, color: "white" }}>Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Create Post Section - Only for members */}
      {isMember && (
        <View style={{
          marginTop: 25,
          marginHorizontal: 15,
          marginBottom: 20,
          backgroundColor: '#fff',
          borderRadius: 15,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
          borderWidth: 1,
          borderColor: '#f0f0f0',
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: Colors.LIGHT_PURPLE,
            marginBottom: 15,
            textAlign: 'center'
          }}>Create New Post</Text>
          
          <TextInput
            placeholder="What's new?"
            value={caption}
            onChangeText={handleCaptionChange}
            multiline
            textAlignVertical="top"
            blurOnSubmit={false}
            style={{
              minHeight: 80,
              maxHeight: 120,
              padding: 15,
              fontSize: 16,
              borderWidth: 1.5,
              borderColor: "#e1e5e9",
              borderRadius: 12,
              backgroundColor: '#f8f9fa',
              color: '#333',
              lineHeight: 22,
            }}
            placeholderTextColor="#9ca3af"
          />
          
          <TouchableOpacity
            onPress={handleMediaSelection}
            style={{
              marginTop: 15,
              height: 50,
              borderColor: Colors.LIGHT_PURPLE,
              borderWidth: 1.5,
              borderRadius: 12,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: '#f8f9ff',
              flexDirection: 'row'
            }}
          >
            <MaterialIcons name="add-photo-alternate" size={24} color={Colors.LIGHT_PURPLE} style={{ marginRight: 8 }} />
            <Text style={{
              color: Colors.LIGHT_PURPLE,
              fontSize: 16,
              fontWeight: '500'
            }}>Add Photos</Text>
          </TouchableOpacity>

          {/* Selected Media Preview */}
          {(selectedPhotos.length > 0 || selectedVideo) && (
            <View style={{ 
              marginTop: 15, 
              padding: 12,
              backgroundColor: '#f8f9fa',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#e9ecef'
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#495057',
                marginBottom: 10
              }}>Selected Media:</Text>
              {selectedPhotos.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 5 }}
                >
                  {selectedPhotos.map((photo, index) => (
                    <View key={index} style={{ marginRight: 8 }}>
                      <Image
                        source={{ uri: photo }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: Colors.LIGHT_PURPLE,
                        }}
                      />
                      <View style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        backgroundColor: Colors.LIGHT_PURPLE,
                        borderRadius: 10,
                        width: 20,
                        height: 20,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{index + 1}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
              {selectedVideo && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.LIGHT_PURPLE,
                  padding: 8,
                  borderRadius: 8
                }}>
                  <MaterialIcons name="videocam" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={{ color: 'white', fontWeight: '500' }}>Video ready to upload</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={createPost}
            disabled={isCreatingPost || (!caption.trim() && selectedPhotos.length === 0 && !selectedVideo)}
            style={{
              marginTop: 20,
              height: 45,
              backgroundColor: (isCreatingPost || (!caption.trim() && selectedPhotos.length === 0 && !selectedVideo)) 
                ? '#d1d5db' 
                : Colors.LIGHT_PURPLE,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 12,
              shadowColor: Colors.LIGHT_PURPLE,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isCreatingPost ? 0 : 0.2,
              shadowRadius: 4,
              elevation: isCreatingPost ? 0 : 3,
            }}
          >
            {isCreatingPost ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: "white", fontSize: 16, fontWeight: '600' }}>Publishing...</Text>
              </View>
            ) : (
              <Text style={{ 
                color: "white", 
                fontSize: 16, 
                fontWeight: '600' 
              }}>Publish Post</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [
    groupInfo,
    isCreator,
    isMember,
    isAdmin,
    isJoiningLeaving,
    caption,
    selectedPhotos,
    selectedVideo,
    isCreatingPost,
    handleCaptionChange,
    handleMediaSelection,
    createPost,
    toggleGroupMembersModal,
    toggleInviteToGroupModal,
    handleGroupImageSelection,
    leaveGroup,
    joinGroup,
    width
  ]);

  // Fetch group information
  const fetchGroupInfo = async (isRefresh = false) => {
    if (!groupId) {
      console.error("GroupDetails: groupId is undefined");
      Toast.show({
        type: "error",
        text1: "Group ID is missing",
        visibilityTime: 3000,
      });
      return;
    }
    
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      
      console.log('Fetching group info:', { groupId, currentUserId });
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/${groupId}/info`
      );
      
      const groupData = response.data;
      console.log('Group data received:', {
        groupId: groupData.id,
        membersCount: groupData.members?.length,
        adminsCount: groupData.admins?.length,
        creator: groupData.creator
      });
      
      setGroupInfo(groupData);
      
      // Check user's role in the group
      if (currentUserId) {
        // Convert currentUserId to string for comparison since API might return strings
        const userIdStr = String(currentUserId);
        const isUserMember = groupData.members?.some(memberId => String(memberId) === userIdStr) || false;
        const isUserAdmin = groupData.admins?.some(adminId => String(adminId) === userIdStr) || false;
        const isUserCreator = String(groupData.creator) === userIdStr;
        
        console.log('User role check:', {
          currentUserId,
          userIdStr,
          isUserMember,
          isUserAdmin,
          isUserCreator,
          members: groupData.members,
          admins: groupData.admins,
          creator: groupData.creator
        });
        
        setIsMember(isUserMember);
        setIsAdmin(isUserAdmin);
        setIsCreator(isUserCreator);
      }
    } catch (error) {
      console.error("Error fetching group info:", error);
      Toast.show({
        type: "error",
        text1: "Error loading group information",
        text2: error.response?.data || "Please try again",
        visibilityTime: 3000,
      });
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
      }
    }
  };

  // Fetch group posts
  const fetchGroupPosts = async (page = 0, refresh = false) => {
    console.log("fetchGroupPosts called with page:", page, "refresh:", refresh);
    if (!groupId) {
      console.error("GroupDetails: groupId is undefined for posts fetch");
      return;
    }
    
    try {
      if (refresh) {
        console.log("Setting refresh state to true");
        setIsRefreshing(true);
        setCurrentPage(0);
      } else {
        setIsLoadingPosts(true);
      }
      
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/getAllGroupRelatedPost/${groupId}/${page}/10`
      );
      
      const postsData = response.data;
      
      if (refresh || page === 0) {
        setPosts(postsData.content);
      } else {
        setPosts(prevPosts => [...prevPosts, ...postsData.content]);
      }
      
      setCurrentPage(page);
      setHasMorePosts(!postsData.last);
    } catch (error) {
      console.error("Error fetching group posts:", error);
      Toast.show({
        type: "error",
        text1: "Error loading posts",
        visibilityTime: 3000,
      });
    } finally {
      console.log("Setting loading states to false");
      setIsLoadingPosts(false);
      setIsRefreshing(false);
    }
  };

  // Load more posts
  const loadMorePosts = () => {
    if (hasMorePosts && !isLoadingPosts) {
      fetchGroupPosts(currentPage + 1);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    console.log("Refresh triggered");
    try {
      await Promise.all([
        fetchGroupInfo(true),
        fetchGroupPosts(0, true)
      ]);
      console.log("Refresh completed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // Initial data loading
  useEffect(() => {
    if (currentUserId && groupId) {
      fetchGroupInfo();
      fetchGroupPosts();
    }
  }, [currentUserId, groupId]);

  // Debug: Track membership state changes
  useEffect(() => {
    console.log('Membership state changed:', {
      isMember,
      isAdmin,
      isCreator,
      currentUserId,
      groupId
    });
  }, [isMember, isAdmin, isCreator, currentUserId, groupId]);



  // Update group image
  const updateGroupImage = async (imageUri) => {
    try {
      setIsUpdatingGroupImage(true);
      const formData = new FormData();
      formData.append("groupPhoto", {
        uri: imageUri,
        name: "group_photo.jpg",
        type: "image/jpeg",
      });

      await Axios.put(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/updateGroupPicture/${groupId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Toast.show({
        type: "success",
        text1: "Group image updated successfully",
        visibilityTime: 3000,
      });
      
      // Refresh group info to get updated image
      fetchGroupInfo();
    } catch (error) {
      console.error("Error updating group image:", error);
      Toast.show({
        type: "error",
        text1: "Error updating group image",
        visibilityTime: 3000,
      });
    } finally {
      setIsUpdatingGroupImage(false);
    }
  };






  // Like/Unlike post
  const toggleLike = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId);
      const isLiked = post.reactions.some(reaction => 
        reaction.userId === currentUserId && reaction.reactionType === "like"
      );

      if (isLiked) {
        await Axios.delete(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/dislikepost/${postId}/${currentUserId}`
        );
      } else {
        await Axios.post(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/likepost/${postId}/${currentUserId}`
        );
      }

      // Refresh posts to get updated like status
      fetchGroupPosts(0, true);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Format date time
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds === 1 ? "" : "s"} ago`;
    } else if (diffInSeconds < 3600) {
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    } else if (diffInSeconds < 86400) {
      const diffInHours = Math.floor(diffInSeconds / 3600);
      return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    } else {
      const diffInDays = Math.floor(diffInSeconds / 86400);
      return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    }
  };



  // Loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <LottieView
          source={require('../../../assets/animations/LoadingPublications.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
      </View>
    );
  }

  // Error state - group not found
  if (!groupInfo) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: Colors.BLACK }}>Group not found</Text>
      </View>
    );
  }

  // Private group access check
  if (groupInfo.type === "PRIVATE" && !isMember) {
    return (
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <View>
            <Image
              source={{ uri: groupInfo.image }}
              style={{ width: width, height: 200, borderRadius: 10 }}
              resizeMode="cover"
            />
          </View>

          <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "grey" }}>Group (private)</Text>
            <Text> {groupInfo.members.length} </Text>
            <Text style={{ color: "grey" }}>members</Text>
          </View>

          <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "black", fontWeight: "bold", fontSize: 20 }}>{groupInfo.name}</Text>
          </View>

          <View style={{ flexDirection: "row", marginTop: 25 }}>
            <TouchableOpacity
              onPress={joinGroup}
              disabled={isJoiningLeaving}
              style={{
                height: 30,
                width: "40%",
                borderColor: "gray",
                borderWidth: 0.3,
                borderRadius: 10,
                marginLeft: 10,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                opacity: isJoiningLeaving ? 0.7 : 1,
              }}
            >
              {isJoiningLeaving ? (
                <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
              ) : (
                <>
                  <FontAwesome5
                    name="user-friends"
                    color="black"
                    size={15}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={{ fontSize: 17 }}>Join</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontWeight: "800",
              marginTop: 50,
              marginLeft: 60,
              marginRight: 60,
            }}
          >
            This group is private. You must send a join request to be a member.
          </Text>
          
          <View
            style={{
              width: width,
              height: 200,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Fontisto name="locked" size={70} color={Colors.LIGHT_PURPLE} />
          </View>
        </ScrollView>
      </View>
    );
  }


  // Render post item
  const renderPostItem = ({ item: post }) => (
    <PostCard
      key={post.id}
      postId={post.id}
      user={post.user}
      group={groupInfo}
      postDateTime={post.postDateTime}
      caption={post.caption}
      photos={post.photos}
      reactions={post.reactions || []}
      comments={post.comments || []}
      commentsNumber={post.commentsNumber || 0}
      userReaction={post.reactions?.find(r => r.userId === currentUserId)?.reactionType}
      onComment={() => toggleCommentModal(post.id)}
    />
  );

  // Main group view
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header with back arrow */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons name="arrow-back" size={24} color={Colors.LIGHT_PURPLE} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Group</Text>
              <View style={styles.placeholder} />
            </View>
            
            <View style={{ flex: 1, backgroundColor: "white" }}>
            {isLoadingPosts && posts.length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <LottieView
                  source={require('../../../assets/animations/LoadingPublications.json')}
                  autoPlay
                  loop
                  style={{ width: 200, height: 200 }}
                />
              </View>
            ) : (
              <FlatList
                data={posts}
                renderItem={renderPostItem}
                keyExtractor={item => item.id}
                onEndReached={loadMorePosts}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={renderGroupHeader}
                ListFooterComponent={isLoadingPosts && posts.length > 0 ? (
                  <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
                  </View>
                ) : null}
                ListEmptyComponent={isLoadingPosts ? (
                  <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.LIGHT_PURPLE} />
                  </View>
                ) : (
                  <View style={{ alignItems: "center", marginTop: "50%" }}>
                    <Text>No posts in this group yet</Text>
                  </View>
                )}
                refreshControl={
                  <RefreshControl 
                    refreshing={isRefreshing} 
                    onRefresh={onRefresh}
                    colors={[Colors.LIGHT_PURPLE]}
                    tintColor={Colors.LIGHT_PURPLE}
                    progressBackgroundColor="#ffffff"
                  />
                }
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              />
            )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Modals */}
      {selectedPostCommentId && (
        <CommentModel
          isVisible={commentModalVisible}
          onClose={toggleCommentModal}
          postId={selectedPostCommentId}
          refreshPosts={() => fetchGroupPosts(0, true)}
        />
      )}
      <SendModel isVisible={sendModalVisible} onClose={toggleSendModal} />
      <ShareModel isVisible={shareModalVisible} onClose={toggleShareModal} />
      <PostOptionsModel
        isVisible={optionsPostModalVisible}
        onClose={toggleOptionsPostModal}
        postId={selectedPostId}
      />
      <GroupMembersModal
        isVisible={groupMembersModalVisible}
        onClose={toggleGroupMembersModal}
        members={groupInfo.members}
      />
      <InviteToGroupModal
        isVisible={inviteToGroupModalVisible}
        onClose={toggleInviteToGroupModal}
        groupId={groupId}
      />
    </SafeAreaView>
  );
};

export default GroupDetails;

// Basic header styles for GroupDetails
const styles = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
    height: 44,
    marginLeft: 16,
  },
};
