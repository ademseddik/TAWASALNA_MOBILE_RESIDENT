import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import Colors from "../../../assets/Colors";
import {
  MaterialIcons,
  Entypo,
  Octicons,
  AntDesign,
  Ionicons,
} from "@expo/vector-icons";
import ProfilePosts from "../../components/ProfilePosts";
import ProfileVideos from "../../components/ProfileVideos";
import { useNavigation, useRoute } from "@react-navigation/native";
import { encode } from "base64-arraybuffer";
import ProfileStatus from "../../components/ProfileStatus";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Axios from 'axios';
import { APP_ENV } from '../../utils/BaseUrl';
import Toast from "react-native-toast-message";
import ProfileSurveys from "../../components/ProfileSurveys";
import { FollowService } from '../../services/follow.service';

const UsersProfile = () => {
  const route = useRoute();
  const { userId } = route.params;
  const [selectedButton, setSelectedButton] = useState("Posts");
  const [fullName, setFullName] = useState("");
  const [ConnectedUserfullName, setFullNameConnectedUser] = useState("");
  const [data, setData] = useState([]);
  const [dataConnectedUser, setDataConnectedUser] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [coverPic, setCoverPic] = useState(null);
  const navigation = useNavigation();
  const [accountType, setAccountType] = useState(null);
  const [following, setFollowing] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  
  // New follow state management
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [followStatus, setFollowStatus] = useState("follow");

  ///////////////////////////////////////////////////////
  const handleButtonPress = (buttonName) => {
    setSelectedButton(buttonName);
  };
  
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
        const response = await Axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`
        );
        setDataConnectedUser(response.data);
        const residentProfile = response.data;
        setFullNameConnectedUser(residentProfile.fullName);
        setFollowing(residentProfile.following);
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
        const response = await Axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`
        );
        setData(response.data);
        const residentProfile = response.data;
        setFullName(residentProfile.fullName);
        setAccountType(residentProfile.accountType);
        updateFollowStatus(); // Update follow status when profile data is loaded
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
        const response = await Axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentposts/${userId}/${userId}`
        );
        setPostsCount(response.data === "No posts found" ? 0 : response.data.length);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPostsCount();
  }, [userId]);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      setIsLoading(true);

      try {
        const response = await Axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getprofilephoto/${userId}`,
          {
            responseType: "arraybuffer",
          }
        );
        const base64Image = encode(response.data);
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;
        setProfilePic(imageUrl);
      } catch (error) {
        console.error("Error getting profile photo:", error);
        throw new Error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfilePhoto();
  }, [userId]);
  
  /////////////////////////////////////////////////////
  useEffect(() => {
    const fetchCoverPhoto = async () => {
      setIsLoading(true);

      try {
        const response = await Axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getcoverphoto/${userId}`,
          {
            responseType: "arraybuffer",
          }
        );

        const base64Image = encode(response.data);
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;
        setCoverPic(imageUrl);
      } catch (error) {
        //console.error("Error getting cover photo:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoverPhoto();
  }, [userId]);

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
      >
        <View
          style={{
            backgroundColor: Colors.LIGHT_PURPLE,
            alignItems: "center",
            
            borderRadius: 10,
            margin: "2%",
            height: 35,
          }}
        >
          {loadingFollow ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text
              style={{
                color: Colors.WHITE,
                paddingTop: 6,
                fontWeight: "500",
                fontSize: 17,
              }}
            >
              {followStatus === "unfollow" ? "Followed" :
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
  return (
    <ScrollView style={{ backgroundColor: Colors.WHITE }}>
      {accountType === "PRIVATE" && (followStatus === "follow" || followStatus === "pending") ?(
        <View>
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
              {postsCount}              </Text>
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
        <View>
          <View style={{ position: "relative" }}>
            {coverPic !== "data:image/jpeg;base64," ? (
              <Image
                style={{ width: "100%", height: 200, borderRadius: 10 }}
                source={{ uri: coverPic }}
              />
            ) : (
              <Image
                source={require("../../../assets/default-avatar.jpg")}
                style={{ width: "100%", height: 200, borderRadius: 10 }}
              />
            )}
          </View>

          <View style={{ flexDirection: "row", position: "relative" }}>
            {profilePic !== "data:image/jpeg;base64," ? (
              <Image
                style={{
                  borderRadius: 50,
                  marginTop: "-5%",
                  marginLeft: "3%",
                  width: 90,
                  height: 90,
                  borderWidth: 3,
                }}
                source={{ uri: profilePic }}
              />
            ) : (
              <Image
                source={require("../../../assets/default-avatar.jpg")}
                style={{
                  borderRadius: 50,
                  marginTop: "-5%",
                  marginLeft: "3%",
                  width: 90,
                  height: 90,
                  borderWidth: 3,
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
                  <AntDesign name="filetext1" size={18} />
                  <Text
                    style={{ color: "grey", flexWrap: "wrap", marginLeft: 5, maxWidth: 200 }}
                  >
                    {isBioExpanded || data.bio.length <= 100 ? data.bio : `${data.bio.substring(0, 100)}...`}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {data.address ? (
                <View style={{ flexDirection: "row", marginTop: 3 }}>
                  <Entypo name="address" size={18} />
                  <Text
                    style={{ color: "grey", flexWrap: "wrap", marginLeft: 5 }}
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
              justifyContent: "space-around",
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: Colors.BLACK,
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {postsCount}
              </Text>
              <Text style={{ color: Colors.BLACK, fontSize: 13 }}>Posts</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: Colors.BLACK,
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {data.followers ? data.followers.length : 0}
              </Text>
              <Text style={{ color: Colors.BLACK, fontSize: 13 }}>
                Followers
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: Colors.BLACK,
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {data.following ? data.following.length : 0}
              </Text>
              <Text style={{ color: Colors.BLACK, fontSize: 13 }}>
                Following
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              marginLeft: "auto",
              marginRight: "auto",
              marginTop: "3%",
            }}
          >
            {renderFollowButton()}
            <TouchableOpacity>
              <View
                style={{
                  backgroundColor: Colors.LIGHT_PURPLE,
                  alignItems: "center",
                  width: 150,
                  borderRadius: 10,
                  marginLeft: "3%",
                  marginTop: "2%",
                  height: 35,
                }}
              >
                <Text
                  style={{
                    color: Colors.WHITE,
                    paddingTop: 6,
                    fontWeight: "500",
                    fontSize: 17,
                  }}
                >
                  Send Message
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", marginTop: "5%" }}>
            <TouchableOpacity
              style={{ marginLeft: "9%", marginRight: "4%" }}
              onPress={() => handleButtonPress("Posts")}
            >
              <MaterialIcons
                name="add-photo-alternate"
                size={40}
                color={
                  selectedButton === "Posts"
                    ? Colors.LIGHT_PURPLE
                    : Colors.BLACK
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginLeft: "11%" }}
              onPress={() => handleButtonPress("Videos")}
            >
              <Entypo
                name="video"
                size={40}
                color={
                  selectedButton === "Videos"
                    ? Colors.LIGHT_PURPLE
                    : Colors.BLACK
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginLeft: "13%" }}
              onPress={() => handleButtonPress("status")}
            >
              <MaterialIcons
                name="post-add"
                size={40}
                color={
                  selectedButton === "status"
                    ? Colors.LIGHT_PURPLE
                    : Colors.BLACK
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginLeft: "13%" }}
              onPress={() => handleButtonPress("surveys")}
            >
              <Ionicons
                name="stats-chart"
                size={35}
                color={
                  selectedButton === "surveys"
                    ? Colors.LIGHT_PURPLE
                    : Colors.BLACK
                }
              />
            </TouchableOpacity>
          </View>

          {selectedButton === "Posts" && (
            <ProfilePosts
              fullName={fullName}
              profilePic={profilePic}
              idfromUsersprofile={userId}
            />
          )}
          {selectedButton === "Videos" && <ProfileVideos />}
          {selectedButton === "status" && (
            <ProfileStatus
              fullName={fullName}
              profilePic={profilePic}
              idfromUsersprofile={userId}
            />
          )}
          {selectedButton === "surveys" && (
            <ProfileSurveys fullName={fullName} profilePic={profilePic} />
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default UsersProfile;