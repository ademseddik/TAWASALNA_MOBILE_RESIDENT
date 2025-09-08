import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import React, { useState, useEffect } from "react";
import Colors from "../../../assets/Colors";
import {
  MaterialIcons,
  AntDesign,
} from "@expo/vector-icons";
 
import { useNavigation, useRoute } from "@react-navigation/native";
 
import AsyncStorage from "@react-native-async-storage/async-storage";
 
import { APP_ENV } from '../../utils/BaseUrl';
import Toast from "react-native-toast-message";
 
import { FollowService } from '../../services/follow.service';
import { ProfileService } from '../../services/profile.service';
import PostCard from "../../components/PostCard";
import CommentModel from '../../components/pupUps/CommentModel';

const UsersProfile = () => {
  const route = useRoute();
  const { userId } = route.params;
  
  const [fullName, setFullName] = useState("");
  
  const [data, setData] = useState([]);
  const [dataConnectedUser, setDataConnectedUser] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [coverPic, setCoverPic] = useState(null);
  const navigation = useNavigation();
  const [accountType, setAccountType] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  
  const [postsCount, setPostsCount] = useState(0);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [followStatus, setFollowStatus] = useState("follow");
  const [posts, setPosts] = useState([]);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [postsPage, setPostsPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const PAGE_SIZE = 10;
  
  ///////////////////////////////////////////////////////
  
  
  const toggleBio = () => {
    setIsBioExpanded(!isBioExpanded);
  };

  // Updated follow handling functions
  const showFollowToast = () => {
    Toast.show({
      type: "success",
      text1: `You are now following ${fullName}`,
      visibilityTime: 3000,
      autoHide: true,
    });
  };
  
  const showFollowRequestToast = () => {
    Toast.show({
      type: "success",
      text1: `Follow request sent to ${fullName}`,
      visibilityTime: 3000,
      autoHide: true,
    });
  };
  
  const showUnfollowToast = () => {
    Toast.show({
      type: "info",
      text1: `You have unfollowed ${fullName}`,
      visibilityTime: 3000,
      autoHide: true,
    });
  };
const handleSendMessagePress = async () => {
    try {
      const currentUserId = await AsyncStorage.getItem("userId");
      if (!currentUserId) {
        return;
      }
      
      const otherUserId = userId;

      // Create chatId by sorting user IDs and joining with underscore
      const ids = [currentUserId, otherUserId].sort();
      const chatId = ids.join('_');
      
      // Extract user IDs for the conversation screen
      const user1ID = ids[0];
      const user2ID = ids[1];

      console.log('🚀 UsersProfile navigation to conversation:', {
        chatId,
        user1ID,
        user2ID,
        userName: fullName
      });

      navigation.navigate('Conversation', {
        chatId: chatId,
        userName: fullName,
        userImage: profilePic,
        user1ID: user1ID,
        user2ID: user2ID
      });
    } catch (error) {
      console.error("Failed to navigate to conversation:", error);
    }
  };
  const handleFollowAction = async () => {
    setLoadingFollow(true);
  console.log(`the follow statues ${followStatus}`)
    try {
      if (followStatus === "follow") {
        await FollowService.followUser(userId);
        if(accountType === "PUBLIC") {
          setFollowStatus("unfollow");
          showFollowToast();
        } else {
          setFollowStatus("pending");
          showFollowRequestToast();
        }
      } else if (followStatus === "unfollow") {
        await FollowService.unfollowUser(userId);
        setFollowStatus("follow");
        showUnfollowToast();
      } else if (followStatus === "pending") {
        await FollowService.cancelFollowRequest(userId);
        setFollowStatus("follow");
      } else if (followStatus === "follow-back") {
        await FollowService.followUser(userId);
        setFollowStatus("unfollow");
        showFollowToast();
      }
    } catch (error) {
      console.error("Action failed:", error.message);
    }
  
    setLoadingFollow(false);
  };

  // Update follow status when data changes
  const updateFollowStatus = async () => {
    try {
      const currentuserId = await AsyncStorage.getItem("userId");
      if (data.followers?.includes(currentuserId)) {
        setFollowStatus("unfollow");
      } else if (data.followrequests?.includes(currentuserId)) {
        setFollowStatus("pending");
      } else if (data.following?.includes(currentuserId)) {
        setFollowStatus("follow-back");
      } 
    else {
        setFollowStatus("follow");
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  //////////////////////////////////////////////////////
  useEffect(() => {
    const fetchConnectedUserProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const residentProfile = await ProfileService.GetConnectedUserProfile(userId);
        setDataConnectedUser(residentProfile);
        
      } catch (error) {
        console.error("Error getting resident profile:", error);
        throw new Error(error);
      }
    };

    fetchConnectedUserProfile();
  }, []);
  
  //////////////////////////////////////////////////////
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const residentProfile = await ProfileService.GetUserProfileById(userId);
        setData(residentProfile);
        setFullName(residentProfile.fullName);
        setCoverPic(residentProfile.coverphoto);
        setProfilePic(residentProfile.profilephoto);
        setAccountType(residentProfile.accountType);
        updateFollowStatus();
      } catch (error) {
        console.error("Error getting resident profile:", error);
        throw new Error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);
  
  // Update follow status when data changes
  useEffect(() => {
    if (data) {
      updateFollowStatus();
    }
  }, [data]);

  /////////////////////////////////////////////////////

  useEffect(() => {
    const fetchPostsCount = async () => {
      try {
        const response = await fetch(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getAllUserPosts/${userId}/0/10`
        );
        const data = await response.json();
        setPostsCount(data.totalElements || 0);
      } catch (error) {
        console.error("Error fetching posts count:", error);
      }
    };

    fetchPostsCount();
  }, [userId]);

  

  useEffect(() => {
    const fetchUserPosts = async () => {
      setIsFetchingPosts(true);
      try {
        const response = await fetch(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getAllUserPosts/${userId}/${postsPage}/${PAGE_SIZE}`
        );
        const data = await response.json();
        if (postsPage === 0) {
          setPosts(data.content || []);
        } else {
          setPosts(prev => [...prev, ...(data.content || [])]);
        }
        setHasMorePosts((data.content?.length || 0) === PAGE_SIZE);
      } catch (error) {
        console.error("Error fetching user posts:", error);
      } finally {
        setIsFetchingPosts(false);
      }
    };
    fetchUserPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, postsPage]);

  const loadMorePosts = () => {
    if (hasMorePosts && !isFetchingPosts) {
      setPostsPage(prev => prev + 1);
    }
  };

  const handleCommentsCountChange = (updatedPostId, delta) => {
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.id === updatedPostId
          ? { ...p, commentsNumber: (p.commentsNumber || 0) + delta }
          : p
      )
    );
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            borderRadius: 50,
            width: 90,
            height: 90,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={Colors.PURPLE} />
        </View>
      </View>
    );
  }

  // Helper function to render follow button
  const renderFollowButton = () => {
    return (
      <TouchableOpacity
        onPress={handleFollowAction}
        disabled={loadingFollow}
        style={{
          flex: 1,
          marginRight: 8,
        }}
      >
        <View
          style={{
            backgroundColor: followStatus === "unfollow" ? "#e9ecef" : Colors.LIGHT_PURPLE,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: followStatus === "unfollow" ? "#dee2e6" : Colors.LIGHT_PURPLE,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 3,
          }}
        >
          {loadingFollow ? (
            <ActivityIndicator color={followStatus === "unfollow" ? Colors.LIGHT_PURPLE : "white"} size="small" />
          ) : (
            <Text
              style={{
                color: followStatus === "unfollow" ? Colors.LIGHT_PURPLE : Colors.WHITE,
                fontWeight: "600",
                fontSize: 15,
              }}
            >
              {followStatus === "unfollow" ? "Following" :
               followStatus === "pending" ? "Cancel Request" :
               followStatus === "follow-back" ? "Follow Back" :
               "Follow"}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  ///////////////////////////////////////////////////////////////
  // 1. Define a function to render the profile header (all profile info, stats, buttons, tab selector)
  const renderProfileHeader = () => (
    <>
      {accountType === "PRIVATE" && (followStatus === "follow" || followStatus === "pending") ? (
        <View>
          {/* Profile info and private account UI */}
          <View>
            <View style={{ flexDirection: "row", marginTop: "12%" }}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginLeft: "2%",
                  }}
                >
                  <AntDesign
                    name="arrowleft"
                    size={35}
                    color={Colors.BLACK}
                  />
                </View>
              </TouchableOpacity>
              <View
                style={{
                  borderRadius: 10,
                  height: 40,
                  flexDirection: "row",
                  width: 300,
                  marginLeft: "10%",
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: "500" }}>
                  {data.fullName}
                </Text>
              </View>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              marginTop: "4%",
              marginLeft: "8%",
            }}
          >
            {profilePic !== "data:image/jpeg;base64," ? (
              <Image
                source={{ uri: profilePic }}
                style={{ height: 80, width: 80, borderRadius: 50 }}
              />
            ) : (
              <Image
                source={require("../../../assets/default-avatar.jpg")}
                style={{ height: 80, width: 80, borderRadius: 50 }}
              />
            )}
          </View>
          <View
            style={{
              marginTop: "-17%",
              flexDirection: "row",
              marginLeft: "40%",
            }}
          >
            <Text
              style={{
                color: Colors.BLACK,
                marginLeft: "8%",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              {postsCount}
            </Text>
            <Text
              style={{
                color: Colors.BLACK,
                marginLeft: "25%",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              {data.followers ? data.followers.length : 0}
            </Text>
            <Text
              style={{
                color: Colors.BLACK,
                marginLeft: "30%",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              {data.following ? data.following.length : 0}
            </Text>
          </View>
          <View
            style={{
              marginTop: "1%",
              flexDirection: "row",
              marginLeft: "40%",
            }}
          >
            <Text
              style={{
                color: Colors.BLACK,
                marginLeft: "5%",
                fontSize: 13,
              }}
            >
              Posts
            </Text>
            <Text
              style={{
                color: Colors.BLACK,
                marginLeft: "10%",
                fontSize: 13,
              }}
            >
              Followers
            </Text>
            <Text
              style={{
                color: Colors.BLACK,
                marginLeft: "8%",
                fontSize: 13,
              }}
            >
              Following
            </Text>
          </View>
          <View style={{ marginLeft: "5%", marginTop: "4%" }}>
            <Text style={{ fontWeight: "500" }}> {data.fullName}</Text>
          </View>
          {renderFollowButton()}
          <View style={{ alignItems: "center" }}>
            <Image
              source={require("../../../assets/Icons/private-account.png")}
              style={{
                width: 90,
                height: 90,
                marginTop: "35%",
                borderRadius: 30,
              }}
            />
            <Text style={{ fontWeight: "800", marginTop: "2%" }}>
              This account is private.
            </Text>
            <Text style={{ color: "grey", marginTop: "2%" }}>
              Follow this account to see its photos and videos.
            </Text>
          </View>
        </View>
      ) : (
        <>
          {/* Profile info and public account UI */}
          <View style={{ position: "relative" }}>
            {coverPic !== "data:image/jpeg;base64," ? (
              <Image
                style={{ width: "100%", height: 200 }}
                source={{ uri: coverPic }}
              />
            ) : (
              <Image
                source={require("../../../assets/default-avatar.jpg")}
                style={{ width: "100%", height: 200 }}
              />
            )}
          </View>
          <View style={{ flexDirection: "row", position: "relative" }}>
            {profilePic !== "data:image/jpeg;base64," ? (
              <Image
                style={{
                  borderRadius: 50,
                  marginTop: "-10%",
                  marginLeft: "5%",
                  width: 100,
                  height: 100,
                  borderWidth: 0,
                }}
                source={{ uri: profilePic }}
              />
            ) : (
              <Image
                source={require("../../../assets/default-avatar.jpg")}
                style={{
                  borderRadius: 50,
                  marginTop: "-15%",
                  marginLeft: "5%",
                  width: 100,
                  height: 100,
                  borderWidth: 0,
                }}
              />
            )}
            <View style={{ marginLeft: 25, flex: 1 }}>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ color: Colors.BLACK, fontSize: 20 }}>
                  {fullName}
                </Text>
                <MaterialIcons
                  name="verified"
                  size={20}
                  color={Colors.LIGHT_PURPLE}
                  style={{ marginLeft: "3%", marginTop: "2%" }}
                />
              </View>
              {data.bio ? (
                <TouchableOpacity 
                  style={{ flexDirection: "row", marginTop: 3, maxWidth: 200 }}
                  onPress={toggleBio}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="description" size={18} color="#6c757d" />
                  <Text
                    style={{ color: "#6c757d", flexWrap: "wrap", marginLeft: 5, maxWidth: 200 }}
                  >
                    {isBioExpanded || data.bio.length <= 100 ? data.bio : `${data.bio.substring(0, 100)}...`}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {data.address ? (
                <View style={{ flexDirection: "row", marginTop: 3 }}>
                  <MaterialIcons name="location-on" size={18} color="#6c757d" />
                  <Text
                    style={{ color: "#6c757d", flexWrap: "wrap", marginLeft: 5 }}
                  >
                    {data.address}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              marginTop: "7%",
              marginHorizontal: 20,
              backgroundColor: "#f8f9fa",
              borderRadius: 16,
              paddingVertical: 20,
              paddingHorizontal: 10,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 3.84,
              elevation: 3,
            }}
          >
            <View style={{ 
              flex: 1, 
              alignItems: "center",
              borderRightWidth: 1,
              borderRightColor: "#e9ecef",
              paddingRight: 10
            }}>
              <Text
                style={{
                  color: Colors.LIGHT_PURPLE,
                  fontSize: 24,
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                {postsCount}
              </Text>
              <Text style={{ 
                color: "#6c757d", 
                fontSize: 12,
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: 0.5
              }}>
                Posts
              </Text>
            </View>
            <View style={{ 
              flex: 1, 
              alignItems: "center",
              borderRightWidth: 1,
              borderRightColor: "#e9ecef",
              paddingHorizontal: 10
            }}>
              <Text
                style={{
                  color: Colors.LIGHT_PURPLE,
                  fontSize: 24,
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                {data.followers ? data.followers.length : 0}
              </Text>
              <Text style={{ 
                color: "#6c757d", 
                fontSize: 12,
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: 0.5
              }}>
                Followers
              </Text>
            </View>
            <View style={{ 
              flex: 1, 
              alignItems: "center",
              paddingLeft: 10
            }}>
              <Text
                style={{
                  color: Colors.LIGHT_PURPLE,
                  fontSize: 24,
                  fontWeight: "700",
                  marginBottom: 4,
                }}
              >
                {data.following ? data.following.length : 0}
              </Text>
              <Text style={{ 
                color: "#6c757d", 
                fontSize: 12,
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: 0.5
              }}>
                Following
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              marginHorizontal: 20,
              marginTop: "3%",
            }}
          >
            {renderFollowButton()}
            <TouchableOpacity 
              onPress={handleSendMessagePress}
              style={{
                flex: 1,
                marginLeft: 8,
              }}
            >
              <View
                style={{
                  backgroundColor: "#f8f9fa",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: "#e9ecef",
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.1,
                  shadowRadius: 3.84,
                  elevation: 3,
                }}
              >
                <Text
                  style={{
                    color: Colors.LIGHT_PURPLE,
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  Send Message
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
        </>
      )}
    </>
  );

  // 2. Main return: Only Posts FlatList
  return (
    <>
      <FlatList
        data={posts}
        renderItem={({ item: post }) => (
          <PostCard
            key={post.id}
            user={{ name: fullName, image: profilePic }}
            postDateTime={post.postDateTime}
            caption={post.caption}
            photos={post.photos}
            reactions={post.reactions || []}
            comments={post.comments || []}
            commentsNumber={post.commentsNumber || 0}
            userReaction={post.reactions?.find(r => r.userId === dataConnectedUser.id)?.reactionType}
            postId={post.id}
            onComment={() => {
              setSelectedPostId(post.id);
              setCommentModalVisible(true);
            }}
          />
        )}
        keyExtractor={item => item.id}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderProfileHeader}
        ListFooterComponent={isFetchingPosts && posts.length > 0 ? (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.PURPLE} />
          </View>
        ) : null}
        ListEmptyComponent={isFetchingPosts ? (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.PURPLE} />
          </View>
        ) : (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text>No posts yet</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
      {/* Comment Modal */}
      {isCommentModalVisible && selectedPostId !== null && (
        <CommentModel
          isVisible={isCommentModalVisible}
          onClose={() => setCommentModalVisible(false)}
          postId={selectedPostId}
          onCommentsCountChange={handleCommentsCountChange}
        />
      )}
    </>
  );
};

export default UsersProfile;