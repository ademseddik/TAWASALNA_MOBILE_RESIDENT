import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
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
import ConfirmActionModel from '../../components/pupUps/ConfirmActionModel';

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
  // FOLLOW STATUS TYPES:
  // "follow" - Can follow this user (not following)
  // "following" - Currently following this user
  // "pending" - Follow request sent and pending
  // "follow-back" - User follows you but you don't follow them
  
  const [followStatus, setFollowStatus] = useState("follow");
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [postsPage, setPostsPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isUnfollowConfirmVisible, setUnfollowConfirmVisible] = useState(false);
  const PAGE_SIZE = 10;
  
  ///////////////////////////////////////////////////////
  
  
  const toggleBio = () => {
    setIsBioExpanded(!isBioExpanded);
  };

  // Toast notifications for follow actions
  const showFollowSuccessToast = (message) => {
    Toast.show({
      type: "success",
      text1: message,
      visibilityTime: 3000,
      autoHide: true,
    });
  };
  
  const showFollowInfoToast = (message) => {
    Toast.show({
      type: "info",
      text1: message,
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
  // Determine follow status based on user data
  const determineFollowStatus = async (userData) => {
    try {
      const currentUserId = await AsyncStorage.getItem("userId");
      if (!currentUserId || !userData) return "follow";
      
      const {
        followers = [],
        following = [],
        followrequests = [],
        accountType = "PUBLIC"
      } = userData;
      
      setIsPrivateAccount(accountType === "PRIVATE");
      
      // Check if current user is in different lists
      const isFollowing = followers.includes(currentUserId);
      const hasPendingRequest = followrequests.includes(currentUserId);
      const userFollowsMe = following.includes(currentUserId);
      
      if (isFollowing) {
        return "following";
      } else if (hasPendingRequest) {
        return "pending";
      } else if (userFollowsMe) {
        return "follow-back";
      } else {
        return "follow";
      }
    } catch (error) {
      console.error("Error determining follow status:", error);
      return "follow";
    }
  };
  
  // Update follow status
  const updateFollowStatus = async () => {
    if (data) {
      const status = await determineFollowStatus(data);
      setFollowStatus(status);
    }
  };
  
  // Main follow action handler
  const handleFollowAction = async () => {
    if (followStatus === "following") {
      // Show unfollow confirmation
      setUnfollowConfirmVisible(true);
      return;
    }
    
    await executeFollowAction();
  };
  
  // Execute the actual follow action
  const executeFollowAction = async () => {
    setLoadingFollow(true);
    
    try {
      const currentUserId = await AsyncStorage.getItem("userId");
      
      switch (followStatus) {
        case "follow":
        case "follow-back":
          await FollowService.followUser(userId);
          if (isPrivateAccount) {
            setFollowStatus("pending");
            showFollowInfoToast(`Follow request sent to ${fullName}`);
          } else {
            setFollowStatus("following");
            showFollowSuccessToast(`You are now following ${fullName}`);
          }
          break;
          
        case "following":
          await FollowService.unfollowUser(userId);
          setFollowStatus(data.following?.includes(currentUserId) ? "follow-back" : "follow");
          showFollowInfoToast(`You have unfollowed ${fullName}`);
          break;
          
        case "pending":
          await FollowService.cancelFollowRequest(userId);
          setFollowStatus(data.following?.includes(currentUserId) ? "follow-back" : "follow");
          showFollowInfoToast("Follow request cancelled");
          break;
          
        default:
          console.warn("Unknown follow status:", followStatus);
      }
      
      // Refresh user data after action
      setTimeout(async () => {
        try {
          const updatedProfile = await ProfileService.GetUserProfileById(userId);
          setData(updatedProfile);
        } catch (error) {
          console.error("Error refreshing profile:", error);
        }
      }, 1000);
      
    } catch (error) {
      console.error("Follow action failed:", error);
      Toast.show({
        type: "error",
        text1: "Action failed",
        text2: "Please try again",
        visibilityTime: 3000,
      });
    } finally {
      setLoadingFollow(false);
    }
  };
  
  // Handle unfollow confirmation
  const handleUnfollowConfirm = async () => {
    setUnfollowConfirmVisible(false);
    await executeFollowAction();
  };
  
  // Get button text based on status
  const getFollowButtonText = () => {
    switch (followStatus) {
      case "follow":
        return "Follow";
      case "following":
        return "Following";
      case "pending":
        return "Pending";
      case "follow-back":
        return "Follow Back";
      default:
        return "Follow";
    }
  };
  
  // Get button style based on status
  const getFollowButtonStyle = () => {
    const baseStyle = {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      paddingVertical: 15,
      paddingHorizontal: 20,
      minWidth: 120,
      borderWidth: 2,
    };
    
    switch (followStatus) {
      case "following":
        return {
          ...baseStyle,
          backgroundColor: "#e9ecef",
          borderColor: "#dee2e6",
        };
      case "pending":
        return {
          ...baseStyle,
          backgroundColor: "#ffc107",
          borderColor: "#ffc107",
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: Colors.LIGHT_PURPLE,
          borderColor: Colors.LIGHT_PURPLE,
        };
    }
  };
  
  // Get text color based on status
  const getFollowButtonTextColor = () => {
    switch (followStatus) {
      case "following":
        return Colors.LIGHT_PURPLE;
      case "pending":
        return "white";
      default:
        return "white";
    }
  };
  
  // Check if user can view posts
  const canViewPosts = () => {
    if (!isPrivateAccount) return true;
    return followStatus === "following";
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
        
        // Determine follow status with new logic
        const status = await determineFollowStatus(residentProfile);
        setFollowStatus(status);
        
      } catch (error) {
        console.error("Error getting resident profile:", error);
        Toast.show({
          type: "error",
          text1: "Error loading profile",
          text2: "Please try again",
          visibilityTime: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);


  /////////////////////////////////////////////////////

  useEffect(() => {
    const fetchPostsCount = async () => {
      // Always fetch posts count for display purposes
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
      // Use new canViewPosts logic
      if (!canViewPosts()) {
        setPosts([]);
        setHasMorePosts(false);
        return;
      }

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
  }, [userId, postsPage, followStatus, isPrivateAccount]);

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

  // Render the follow button with new clean logic
  const renderFollowButton = () => {
    const buttonStyle = getFollowButtonStyle();
    const textColor = getFollowButtonTextColor();
    const buttonText = getFollowButtonText();
    
    // Check if should take full width (private account with follow/follow-back/pending status)
    const shouldTakeFullWidth = isPrivateAccount && (followStatus === "follow" || followStatus === "follow-back" || followStatus === "pending");
    
    return (
      <TouchableOpacity
        onPress={handleFollowAction}
        disabled={loadingFollow}
        style={{
          flex: shouldTakeFullWidth ? 0 : 1,
          marginRight: shouldTakeFullWidth ? 0 : 8,
          marginHorizontal: shouldTakeFullWidth ? '2%' : 0,
          width: shouldTakeFullWidth ? '96%' : 'auto',
        }}
        activeOpacity={0.8}
      >
        <View style={buttonStyle}>
          {loadingFollow ? (
            <ActivityIndicator 
              color={textColor} 
              size="small" 
            />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {followStatus === "follow" && isPrivateAccount && (
                <MaterialIcons 
                  name="person-add" 
                  size={20} 
                  color={textColor} 
                  style={{ marginRight: 8 }}
                />
              )}
              {followStatus === "pending" && (
                <MaterialIcons 
                  name="schedule" 
                  size={20} 
                  color={textColor} 
                  style={{ marginRight: 8 }}
                />
              )}
              <Text
                style={{
                  color: textColor,
                  fontWeight: "600",
                  fontSize: 15,
                }}
              >
                {buttonText}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  ///////////////////////////////////////////////////////////////
  // Helper function to render empty state component
  const renderEmptyComponent = () => {
    if (isFetchingPosts) {
      return (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.PURPLE} />
        </View>
      );
    }
    
    if (accountType === "PRIVATE" && (followStatus === "follow" || followStatus === "pending")) {
      return (
        <View style={{ alignItems: 'center', marginTop: 32, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.BLACK, textAlign: 'center' }}>
            
          </Text>
          <Text style={{ fontSize: 14, color: '#6c757d', textAlign: 'center', marginTop: 8 }}>
           
          </Text>
        </View>
      );
    }
    
    return (
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Text>No posts yet</Text>
      </View>
    );
  };

  ///////////////////////////////////////////////////////////////
  // 1. Define a function to render the profile header using conditional logic instead of nested ternary
  const renderProfileHeader = () => {
    // Private account with following access
    if (isPrivateAccount && followStatus === "following") {
      return (
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
      );
    }
    
    // Private account without access
    if (isPrivateAccount && !canViewPosts()) {
      return (
        <View>
          {/* Profile info and private account UI with full layout */}
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
          <View style={{ 
            marginTop: "3%", 
            paddingHorizontal: 20,
            alignItems: "center"
          }}>
            {renderFollowButton()}
          </View>
          <View style={{ alignItems: "center", marginTop: "8%" }}>
            <View style={{
              backgroundColor: "#f8f9fa",
              borderRadius: 20,
              padding: 20,
              marginHorizontal: 20,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <Image
                source={require("../../../assets/Icons/private-account.png")}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 30,
                  alignSelf: "center",
                }}
              />
              <Text style={{ 
                fontWeight: "800", 
                marginTop: "4%",
                fontSize: 18,
                textAlign: "center",
                color: Colors.BLACK
              }}>
                This account is private.
              </Text>
              <Text style={{ 
                color: "#6c757d", 
                marginTop: "2%",
                textAlign: "center",
                fontSize: 14,
                lineHeight: 20
              }}>
                {followStatus === "pending" 
                  ? "Your follow request is pending. You'll see posts once approved."
                  : "Follow this account to see its photos."
                }
              </Text>
            </View>
          </View>
        </View>
      );
    }
    
    // Public account or other cases
    return (
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
      );
    }

  // 2. Main return: Only Posts FlatList
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with back arrow */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.LIGHT_PURPLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{data.fullName || 'Profile'}</Text>
        <View style={styles.placeholder} />
      </View>
      
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
        ListEmptyComponent={renderEmptyComponent()}
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
      
      {/* Unfollow Confirmation Modal */}
      <ConfirmActionModel
        isVisible={isUnfollowConfirmVisible}
        onClose={() => setUnfollowConfirmVisible(false)}
        message1={"Confirmer l'arrêt du suivi"}
        message2={`Êtes-vous sûr de vouloir arrêter de suivre ${fullName} ?`}
        onConfirm={handleUnfollowConfirm}
      />
    </SafeAreaView>
  );
};

const styles = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.BLACK,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
};

export default UsersProfile;