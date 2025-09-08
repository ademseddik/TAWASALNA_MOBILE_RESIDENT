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
} from "react-native";
import React, { useEffect, useState } from "react";
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
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/${groupId}/info`
      );
      
      const groupData = response.data;
      setGroupInfo(groupData);
      
      // Check user's role in the group
      if (currentUserId) {
        const isUserMember = groupData.members.includes(currentUserId);
        const isUserAdmin = groupData.admins.includes(currentUserId);
        const isUserCreator = groupData.creator === currentUserId;
        
        setIsMember(isUserMember);
        setIsAdmin(isUserAdmin);
        setIsCreator(isUserCreator);
      }
    } catch (error) {
      console.error("Error fetching group info:", error);
      Toast.show({
        type: "error",
        text1: "Error loading group information",
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

  // Handle group image selection (only for creator)
  const handleGroupImageSelection = async () => {
    if (!isCreator) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedGroupImage(result.assets[0].uri);
      updateGroupImage(result.assets[0].uri);
    }
  };

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

  // Handle media selection for posts
  const handleMediaSelection = async () => {
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
  };

  // Create post
  const createPost = async () => {
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
  };

  // Join group
  const joinGroup = async () => {
    try {
      const response = await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/join/${groupId}/${currentUserId}`
      );
      
      if (response.data === "You joined the group") {
        Toast.show({
          type: "success",
          text1: `You are now a member of ${groupInfo.name}`,
          visibilityTime: 3000,
        });
        setIsMember(true);
        fetchGroupInfo();
      } else if (response.data === "Follow request to join group sent") {
        Toast.show({
          type: "success",
          text1: `Join request sent to ${groupInfo.name}`,
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error("Error joining group:", error);
      Toast.show({
        type: "error",
        text1: "Error joining group",
        visibilityTime: 3000,
      });
    }
  };

  // Leave group
  const leaveGroup = async () => {
    try {
      const response = await Axios.delete(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/leave/${groupId}/${currentUserId}`
      );
      
      if (response.data === "You have left the group") {
        Toast.show({
          type: "success",
          text1: "You have left the group",
          visibilityTime: 3000,
        });
        setIsMember(false);
        fetchGroupInfo();
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        Toast.show({
          type: "error",
          text1: "Cannot leave the group as the only admin",
          visibilityTime: 3000,
        });
      } else {
        console.error("Error leaving group:", error);
        Toast.show({
          type: "error",
          text1: "Error leaving group",
          visibilityTime: 3000,
        });
      }
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

  // Modal toggle functions
  const toggleGroupMembersModal = () => setGroupMembersModalVisible(!groupMembersModalVisible);
  const toggleInviteToGroupModal = () => setInviteToGroupModalVisible(!inviteToGroupModalVisible);
  const toggleCommentModal = (postId) => {
    setSelectedPostCommentId(postId);
    setCommentModalVisible(!commentModalVisible);
  };
  const toggleOptionsPostModal = (postId) => {
    setSelectedPostId(postId);
    setOptionsPostModalVisible(!optionsPostModalVisible);
  };
  const toggleSendModal = () => setSendModalVisible(!sendModalVisible);
  const toggleShareModal = () => setShareModalVisible(!shareModalVisible);

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
              style={{
                height: 30,
                width: "40%",
                borderColor: "gray",
                borderWidth: 0.3,
                borderRadius: 10,
                marginLeft: 10,
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              <FontAwesome5
                name="user-friends"
                color="black"
                size={15}
                style={{ marginLeft: 18 }}
              />
              <Text style={{ fontSize: 17, marginLeft: 5 }}>Join</Text>
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

  // Render group header
  const renderGroupHeader = () => (
    <View>
      {/* Group Header */}
      <TouchableOpacity onPress={handleGroupImageSelection} disabled={!isCreator}>
        <View>
          <Image
            source={{ uri: groupInfo.image }}
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
        <Text style={{ color: "black", fontWeight: "bold", fontSize: 20 }}>{groupInfo.name}</Text>
      </View>

      <View style={{ flexDirection: "row", marginTop: 10, marginLeft: 15 }}>
        {groupInfo.type === "PUBLIC" ? (
          <>
            <MaterialIcons name="public" size={20} />
            <Text style={{ color: "grey" }}> Group (Public) </Text>
          </>
        ) : (
          <Text style={{ color: "grey" }}>Group (private)</Text>
        )}
        <Text>{groupInfo.members.length} </Text>
        <TouchableOpacity onPress={toggleGroupMembersModal}>
          <Text style={{ color: "grey" }}>members</Text>
        </TouchableOpacity>
      </View>

      {groupInfo.description && (
        <View style={{ marginTop: 10, marginLeft: 15, marginRight: 15 }}>
          <Text style={{ color: "grey", fontSize: 14 }}>{groupInfo.description}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ flexDirection: "row", marginTop: 25, justifyContent: "space-around" }}>
        <TouchableOpacity
          onPress={isMember ? leaveGroup : joinGroup}
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
          }}
        >
          <FontAwesome5
            name="user-friends"
            color={isMember ? "white" : "black"}
            size={15}
            style={{ marginRight: 5 }}
          />
          <Text style={{ fontSize: 17, color: isMember ? "white" : "black" }}>
            {isMember ? "Member" : "Join"}
          </Text>
        </TouchableOpacity>

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

        {/* Group Chat Button - visible for members */}
        {isMember && (
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupChat', { groupId, groupName: groupInfo?.name })}
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
              name="chatbubble-ellipses-outline"
              color="white"
              size={15}
              style={{ marginRight: 5 }}
            />
            <Text style={{ fontSize: 17, color: "white" }}>Group Chat</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Create Post Section - Only for members */}
      {isMember && (
        <View style={{ marginTop: 25, alignItems: "center" }}>
          <TextInput
            placeholder="What's new?"
            value={caption}
            onChangeText={setCaption}
            multiline
            style={{
              height: 60,
              padding: 10,
              fontSize: 16,
              borderWidth: 0.5,
              borderColor: "grey",
              borderRadius: 10,
              width: "80%",
            }}
          />
          
          <TouchableOpacity
            onPress={handleMediaSelection}
            style={{ marginTop: 15, width: "80%" }}
          >
            <View
              style={{
                height: 50,
                borderColor: "grey",
                borderWidth: 0.5,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text>Pick a media</Text>
            </View>
          </TouchableOpacity>

          {/* Selected Media Preview */}
          {(selectedPhotos.length > 0 || selectedVideo) && (
            <View style={{ marginTop: 15, width: "80%" }}>
              {selectedPhotos.length > 0 && (
                <ScrollView horizontal>
                  {selectedPhotos.map((photo, index) => (
                    <Image
                      key={index}
                      source={{ uri: photo }}
                      style={{
                        width: 80,
                        height: 80,
                        margin: 5,
                        borderRadius: 5,
                      }}
                    />
                  ))}
                </ScrollView>
              )}
              {selectedVideo && (
                <View style={{ margin: 5 }}>
                  <Text style={{ color: Colors.LIGHT_PURPLE }}>Video selected</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={createPost}
            disabled={isCreatingPost}
            style={{ marginTop: 15, width: "50%" }}
          >
            <View
              style={{
                height: 35,
                backgroundColor: Colors.LIGHT_PURPLE,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 10,
                opacity: isCreatingPost ? 0.7 : 1,
              }}
            >
              <Text style={{ color: "white", fontSize: 16 }}>
                {isCreatingPost ? "Publishing..." : "Publish"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
        />
      )}

      {/* Modals */}
      <CommentModel
        isVisible={commentModalVisible}
        onClose={toggleCommentModal}
        postId={selectedPostCommentId}
        refreshPosts={() => fetchGroupPosts(0, true)}
      />
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
    </View>
  );
};

export default GroupDetails;
