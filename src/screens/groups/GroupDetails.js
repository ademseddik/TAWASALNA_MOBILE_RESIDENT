import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
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
import { encode } from "base64-arraybuffer";
import { Card, Title, Paragraph } from "react-native-paper";
import { Dimensions } from "react-native";
import LottieView from 'lottie-react-native';



import GroupMembersModal from "../../components/pupUps/GroupMembersModal";
import InviteToGroupModal from "../../components/pupUps/InviteToGroupModal";
import CommentModel from "../../components/pupUps/CommentModel";
import SendModel from "../../components/pupUps/SendModel";
import ShareModel from "../../components/pupUps/ShareModel";
import PostOptionsModel from "../../components/pupUps/PostOptionsModel";


const GroupDetails = ({ route }) => {
  const { groupData, groupPics } = route.params;
  const { width } = Dimensions.get("window");
  const [data, setData] = useState([]);
  const [postsData, setPostsData] = useState([]);
  const [membersLength, setMembersLength] = useState("");
  const [members, setMembers] = useState([]);
  const [photos, setSelectedPhoto] = useState([]);
  const [caption, setCaption] = useState("");
  const [video, setSelectedVideo] = useState("");
  const [usersIds, setUsersIds] = useState([]);
  const [profilePics, setProfilePics] = useState([]);
  const [imageUris, setImageUris] = useState([]);
  const [isFetchingImages, setIsFetchingImages] = useState(false);
  const [userIdHome, setUserIdHome] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [groupPic, setGroupPic] = useState(null);
  const [shouldUpdatePicture, setShouldUpdatePicture] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [buttonText, setButtonText] = useState("Join");
  const [joinedNow, setJoinedNow] = useState(false);
  const [leavedNow, setleavedNow] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [groupMembersModalVisible, setGroupMembersModalVisible] = useState(false);
  const [isInviteToGroupModalVisible, setInviteToGroupModalVisible] = useState(false);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostCommentId, setSelectedPostCommentId] = useState(null);
  const [isOptionsPostModalVisible, setOptionsPostModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isSendModalVisible, setSendModalVisible] = useState(false);
  const [isShareModalVisible, setShareModalVisible] = useState(false);
  const [isRequestingtojoin, SetisRequestingtojoin] = useState(false);
  const [isUserInvited, SetUserInvited] = useState(false);
  const [isUserAdmin, SetUserAdmin] = useState(false);


  /////////////////////////////////////////////////////////////////////////////
  const toggleSendModal = () => {
    setSendModalVisible(!isSendModalVisible);
  };
  const toggleShareModal = () => {
    setShareModalVisible(!isShareModalVisible);
  };
  const toggleOptionsPostModal = (postId) => {
    setSelectedPostId(postId);
    setOptionsPostModalVisible(!isOptionsPostModalVisible);
  };
  const toggleCommentModal = (postCommentId) => {
    setSelectedPostCommentId(postCommentId);
    setCommentModalVisible(!isCommentModalVisible);
  };
  const toggleInviteToGroupModal = () => {
    setInviteToGroupModalVisible(!isInviteToGroupModalVisible);
  };
  const toggleGroupMembersModal = () => {
    setGroupMembersModalVisible(!groupMembersModalVisible);
  };




  /////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const checkMembership = async () => {
      const userIdHome = await AsyncStorage.getItem("userId");
      const memberCheck = members.some((member) => {
        console.log("Member ID:", member.id);
        console.log("User ID Home:", userIdHome);
        return member.id === userIdHome;
      });
      setIsMember(memberCheck);
    };

    checkMembership();
  }, [members]);

  ////////////////////////////////////////////////////////////////////////////
  const handleJoinPress = () => {
    JoingGroup();
    setButtonText("Request sent");

  };
  const showJoinGroupToast = () => {
    Toast.show({
      type: "success",
      text1: `You are now a member in  ${groupData.name}`,
      visibilityTime: 3000,
      autoHide: true,
    });
  };
  const showJoinGroupRequestToast = () => {
    Toast.show({
      type: "success",
      text1: `Join request sent to ${groupData.name}`,
      visibilityTime: 3000,
      autoHide: true,
    });
  };
  const showJoinLeavingGroupToast = () => {
    Toast.show({
      type: "error",
      text1: `Cannot leave the group as the only admin.`,
      visibilityTime: 3000,
      autoHide: true,
    });
  };
  ////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      setUserIdHome(storedUserId);



    };





    fetchUserId();
  }, []);
  /////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const fetchGroupId = async () => {
      console.log(groupData.id);
    };
    fetchGroupId();
  }, []);
  ///////////////////////////////////////////////////////////////////////////
  const fetchGroupPhoto = async () => {
    setIsLoading(true);
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/getprofilephoto/${groupData.id}`,
        {
          responseType: "arraybuffer",
        }
      );
      const base64Image = encode(response.data);
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;
      //console.log("Group Image",imageUrl)
      //console.log("id group from search screen : ",groupData.id)
      setGroupPic(imageUrl);
    } catch (error) {
      console.error("Error getting profile photo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupPhoto();
  }, []);
  ///////////////////////////////////////////////////////////////////////////
  const fetchGroupPosts = async () => {
    try {

      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/posts/${groupData.id}`
      );

      if (response.data) {
        // console.log("Posts Data : ", response.data);
        const groupPosts = response.data;
        groupPosts.sort((a, b) => {
          const dateA = new Date(a.postDateTime);
          const dateB = new Date(b.postDateTime);
          return dateB - dateA;
        })
        setPostsData(groupPosts);
        const userIds = groupPosts.map((post) => post.user.id);
        setUsersIds(userIds);

      }
    } catch (error) {
      console.error("Error getting  Group Posts:", error);
    }
  };

  useEffect(() => {
    fetchGroupPosts();
  }, []);
  //////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const fetchProfilePhotos = async () => {
      try {
        const promises = usersIds.map(async (userId) => {
          const response = await Axios.get(
            `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getprofilephoto/${userId}`,
            { responseType: "arraybuffer" }
          );
          const base64Image = encode(response.data);
          return `data:image/jpeg;base64,${base64Image}`;
        });
        const profilePics = await Promise.all(promises);

        setProfilePics(profilePics);
      } catch (error) {
        console.error(
          "Error getting resident profile photos  for Home:",
          error.message
        );
      }
    };

    fetchProfilePhotos();
  }, [usersIds]);

  //////////////////////////////////////////////////////////////////////////////////

  const fetchImagesForPosts = async (posts) => {
    setIsFetchingImages(true);

    try {
      const newImageUris = {};

      for (const post of posts) {
        const photoPromises = post.photos.map(async (photoId) => {
          try {
            const response = await Axios.get(
              `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/images?fileUrl=${encodeURIComponent(
                photoId
              )}`,
              {
                responseType: "arraybuffer",
              }
            );
            const base64Image = encode(response.data);
            return `data:image/jpeg;base64,${base64Image}`;
          } catch (error) {
            console.error(
              `Error fetching image ${photoId} for post ${post.id}:`,
              error
            );
            return null;
          }
        });

        const photoResults = await Promise.all(photoPromises);
        newImageUris[post.id] = photoResults.filter((image) => image !== null);
      }

      setImageUris((prevImageUris) => ({ ...prevImageUris, ...newImageUris }));

    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsFetchingImages(false);
    }
  };
  useEffect(() => {
    if (postsData.length > 0) {
      fetchImagesForPosts(postsData);
    }
  }, [postsData]);

  ////////////////////////////////////////////////////////////////////////////////
  const fetchUserGroups = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/getGroupById/${groupData.id}`
      );

      if (response.data) {

        const userGroups = response.data;
        setData(userGroups);
        setMembersLength(userGroups.members.length);
        setMembers(userGroups.members);
        const checkIfUserSentJoinRequest = userGroups.joiningRequest.some(
          (user) => user.id === storedUserId
        );

        if (checkIfUserSentJoinRequest) {
          SetisRequestingtojoin(true)
        }
        const checkIfUserIsInvited = userGroups.invitedUsers.some(
          (user) => user.id === storedUserId
        );

        if (checkIfUserIsInvited) {

          SetUserInvited(true)
        }
        const checkIfUserAdmin = userGroups.admins.some(
          (user) => user.id === storedUserId
        );

        if (checkIfUserAdmin) {

          SetUserAdmin(true)
        }

      }
    } catch (error) {
      console.error("Error getting User Groups:", error);
    }
  };

  useEffect(() => {
    fetchUserGroups();
  }, []);

  //////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (shouldUpdatePicture) {
      UpdateGroupPicture();
      setShouldUpdatePicture(false);
    }
  }, [shouldUpdatePicture]);

  const handleImageGroupSelection = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      console.log("Selected Image URI:", result.assets[0].uri);
      if (selectedImage !== result.assets[0].uri) {
        setShouldUpdatePicture(true);
      }
    } else {
      console.log("Image selection canceled");
    }
    console.log("Current selected image:", selectedImage);
  };
  //////////////////////////////////////////////////////////////////////////////////
  const UpdateGroupPicture = async () => {
    try {
      if (!selectedImage) {
        console.log("No profile photo selected");
        return;
      }
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("groupPhoto", {
        uri: selectedImage,
        name: "profile_photo.jpg",
        type: "image/jpeg",
      });

      await Axios.put(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/updateGroupPicture/${groupData.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Update Image successful");
      fetchGroupPhoto();
    } catch (error) {
      console.error("Error updating profile photo:", error);
      throw new Error(error);
    }
  };
  //////////////////////////////////////////////////////////////////////////////////
  const handleImageSelection = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      aspect: [4, 4],
      quality: 1,
      allowsMultipleSelection: true,
    });

    console.log(result);

    if (!result.canceled) {
      const selectedAssets = result.assets;
      const selectedPhotos = selectedAssets.map((asset) => asset.uri);
      const hasVideo = selectedAssets.some((asset) =>
        asset.type.toLowerCase().includes("video")
      );

      if (hasVideo) {
        const videoAsset = selectedAssets.find((asset) =>
          asset.type.toLowerCase().includes("video")
        );
        setSelectedVideo(videoAsset.uri);
        setSelectedPhoto([]);
      } else {
        setSelectedPhoto(selectedPhotos);
        setSelectedVideo("");
      }
    } else {
      console.log("Media selection canceled");
    }
  };

  const showEmptyFieldsToast = () => {
    Toast.show({
      type: "info",
      text1: "Please select a media or write a caption.",
      visibilityTime: 3000,
      autoHide: true,
    });
  };
  ////////////////////////////////////////////////////////////////////////
  const AddPost = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!photos.length && !video && !caption) {
        showEmptyFieldsToast();
        return;
      }
      const formData = new FormData();
      if (caption) {
        formData.append("caption", caption);
      }
      if (photos) {
        photos.forEach((photo, index) => {
          formData.append(`photos[${index}]`, {
            uri: photo,
            name: `photo${index}.jpg`,
            type: "image/jpeg",
          });
        });
      }

      if (video) {
        const videoResponse = await fetch(video);
        const videoBlob = await videoResponse.blob();
        formData.append("video", {
          uri: video,
          name: "video.mp4",
          type: videoBlob.type,
        });
      }

      await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/addpost/${groupData.id}/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Add post successful");
      setCaption("");
      setSelectedPhoto([]);
      setSelectedVideo("");
      fetchGroupPosts();
    } catch (error) {
      console.error("Error Adding Post:", error);
      throw new Error(error);
    }
  };
  ///////////////////////////////////////////////////////////////////////////////////
  const JoingGroup = async () => {
    try {
      const userIdStorage = await AsyncStorage.getItem("userId");
      const response = await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/join/${groupData.id}/${userIdStorage}`
      );
      if (response.data === "You joined the group") {
        showJoinGroupToast();
        setIsMember(true);
        setJoinedNow(true);
        fetchUserGroups();
        console.log(response.data);
      } else if (response.data === "Follow request to join group  sent") {
        showJoinGroupRequestToast();
        console.log(response.data);
      }
    } catch (error) {
      console.error("Error Joining Group", error);
      throw new Error(error);
    }
  };
  ///////////////////////////////////////////////////////////////////////////////////
  const LeaveGroup = async () => {
    try {
      const userIdStorage = await AsyncStorage.getItem("userId");
      const response = await Axios.delete(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/leave/${groupData.id}/${userIdStorage}`
      );
      if (response.data === "You have left the group") {
        setIsMember(false);
        setleavedNow(true);
        fetchUserGroups();
        console.log(response.data);
      }

    } catch (error) {
      if (error.response && error.response.status === 403) {
        showJoinLeavingGroupToast();
      } else {
        console.error("Error leaving Group", error);
        throw new Error(error);
      }
    }
  };
  ///////////////////////////////////////////////////////////////////////////////////
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
  ///////////////////////////////////////////////////////////////////////////////
  const chunkArray = (arr, size) => {
    const chunkedArr = [];
    for (let i = 0; i < arr.length; i += size) {
      chunkedArr.push(arr.slice(i, i + size));
    }
    return chunkedArr;
  };
  /////////////////////////////////////////////////////////////////////////////////
  const LikePost = async (postId) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/likepost/${postId}/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error Liking resident posts:", error);
      throw error;
    }
  };
  ///////////////////////////////////////////////////////////////////////////
  const DisLikePost = async (postId) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.delete(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/dislikepost/${postId}/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error DisLiking resident posts:", error);
      throw error;
    }
  };
  /////////////////////////////////////////////////////////////////////////////////
  const toggleLike = async (postId) => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      // Update the local state immediately
      setPostsData((prevData) =>
        prevData.map((post) => {
          if (post.id === postId) {
            if (post.likedBy.includes(userId)) {
              post.likedBy = post.likedBy.filter((id) => id !== userId);
            } else {
              post.likedBy.push(userId);
            }
          }
          return post;
        })
      );

      // Make the API call to like or dislike the post
      const post = postsData.find((post) => post.id === postId);
      if (post.likedBy.includes(userId)) {
        await LikePost(postId);
      } else {
        await DisLikePost(postId);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert the local state if API call fails
      setPostsData((prevData) =>
        prevData.map((post) => {
          if (post.id === postId) {
            if (post.likedBy.includes(userId)) {
              post.likedBy.push(userId);
            } else {
              post.likedBy = post.likedBy.filter((id) => id !== userId);
            }
          }
          return post;
        })
      );
    }
  };
  //////////////////////////////////////////////////////////////////////////////////////

  const handleAcceptInvitation = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/acceptgroupinvitation/${groupData.id}/${userId}`
      );

      if (response.data) {

        fetchUserGroups();

        SetUserInvited(false)

      }
      return response.data;

    } catch (error) {
      console.error("Error Liking resident posts:", error);
      throw error;
    }
  };
  ////////////////////////////////////////////////////////////////////////////////
  const handleRejectInvitation = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/regetGroupInvitation/${groupData.id}/${userId}`
      );
      if (response.data) {
        SetUserInvited(false)
        fetchUserGroups();

      }
      return response.data;
    } catch (error) {
      console.error("Error Liking resident posts:", error);
      throw error;
    }
  };

  /////////////////////////////////////if the group is private and iv sent the join request ///////////////////////////
  if (isUserInvited && data.type === "PRIVATE") {
    return (
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <View>
            {groupPic !== "data:image/jpeg;base64," ? (
              <Image
                style={{ width: width, height: 200, borderRadius: 10 }}
                source={{ uri: groupPic }}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require("../../../assets/GroupPhotoPlaceHolder.jpeg")}
                style={{
                  width: "100%",
                  borderWidth: 0.3,
                  borderColor: "black",
                }}
                resizeMode="cover"
              />
            )}
          </View>

          <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "grey" }}>Group (private)</Text>
            <Text> {membersLength} </Text>
            <Text style={{ color: "grey" }}>members </Text>
          </View>
  <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "black", fontWeight: "bold", fontSize: 20 }}>{groupData.name}</Text>
          </View>
          <View style={{ flexDirection: "row", marginTop: 25 }}>
            <TouchableOpacity
              onPress={handleAcceptInvitation}
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
              <Text style={{ fontSize: 17, marginLeft: 5 }}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRejectInvitation}
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
              <Text style={{ fontSize: 17, marginLeft: 5 }}>Reject</Text>
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
            You've been invited to join this private group. To access its content and participate, please accept the invitation. Until then, the group's details remain hidden.
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

  //////////////////////////////////user reqesting to join the group /////////////////
  else if (isRequestingtojoin && data.type === "PRIVATE") {
    return (
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <View>
            {groupPic !== "data:image/jpeg;base64," ? (
              <Image
                style={{ width: width, height: 200, borderRadius: 10 }}
                source={{ uri: groupPic }}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require("../../../assets/GroupPhotoPlaceHolder.jpeg")}
                style={{
                  width: "100%",
                  borderWidth: 0.3,
                  borderColor: "black",
                }}
                resizeMode="cover"
              />
            )}
          </View>
  <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "black", fontWeight: "bold", fontSize: 20 }}>{groupData.name}</Text>
          </View>
          <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "grey" }}>Group (private)</Text>
            <Text> {membersLength} </Text>
            <Text style={{ color: "grey" }}>members </Text>
          </View>
  <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "black", fontWeight: "bold", fontSize: 20 }}>{groupData.name}</Text>
          </View>
          <View style={{ flexDirection: "row", marginTop: 25 }}>
            <TouchableOpacity
              onPress={handleJoinPress}
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

              <Text style={{ fontSize: 17, marginLeft: 5 }}>cancel request</Text>
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
            Your join request has been sent. This group is private, so you'll need to wait for the admin's approval before you can participate.
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


  ///////////////////////////////////////////////////////////////if the group is private and im not a member  ///////////////////////////

  else if (!isMember && data.type === "PRIVATE") {
    return (
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <View>
            {groupPic !== "data:image/jpeg;base64," ? (
              <Image
                style={{ width: width, height: 200, borderRadius: 10 }}
                source={{ uri: groupPic }}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require("../../../assets/GroupPhotoPlaceHolder.jpeg")}
                style={{
                  width: "100%",
                  borderWidth: 0.3,
                  borderColor: "black",
                }}
                resizeMode="cover"
              />
            )}
          </View>
  <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "black", fontWeight: "bold", fontSize: 20 }}>{groupData.name}</Text>
          </View>
          <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "grey" }}>Group (private)</Text>
            <Text> {membersLength} </Text>
            <Text style={{ color: "grey" }}>members </Text>
          </View>

          <View style={{ flexDirection: "row", marginTop: 25 }}>
            <TouchableOpacity
              onPress={handleJoinPress}
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

              <Text style={{ fontSize: 17, marginLeft: 5 }}>{buttonText}</Text>
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
            This group is private you must send a join request to be a member or
            you can invite someone else to join it.
          </Text>
          <Image
            source={require("../../../assets/Icons/PrivateGroup.png")}
            style={{ width: 90, height: 100, marginLeft: 125, marginTop: 20 }}
          />
        </ScrollView>
      </View>
    );
  }
  /////////////////////////if the user has an invitation  to the group and he must accept it ///////////

  else if (isUserInvited && data.type === "PUBLIC") {
    return (
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>

          <View>
            {groupPic !== "data:image/jpeg;base64," ? (
              <Image
                style={{ width: width, height: 200, borderRadius: 10 }}
                source={{ uri: groupPic }}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require("../../../assets/GroupPhotoPlaceHolder.jpeg")}
                style={{
                  width: "100%",
                  borderWidth: 0.3,
                  borderColor: "black",
                }}
                resizeMode="cover"
              />
            )}

          </View>


          {data.type === "PUBLIC" ? (
            <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
              <MaterialIcons name="public" size={20} />
              <Text style={{ color: "grey" }}> Group (Public) </Text>
              <Text>{membersLength} </Text>
              <TouchableOpacity onPress={toggleGroupMembersModal}>
                <Text style={{ color: "grey" }}>members </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
              <Text style={{ color: "grey" }}>Group (private)</Text>
              <Text>{membersLength} </Text>
              <Text style={{ color: "grey" }}>members </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", marginTop: 25 , justifyContent: "center", }}>
            <TouchableOpacity
              onPress={handleAcceptInvitation}
              style={{
                height: 30,
                width: "40%",
                backgroundColor:Colors.LIGHT_PURPLE,
                borderColor: "gray",
                borderWidth: 0.3,
                borderRadius: 10,
            
                alignItems: "center",
                
                flexDirection: "row",
                      justifyContent: "center", // Centers content vertically
   
              }}
            >
              <Text style={{ fontSize: 17, marginLeft: 5 ,color:Colors.WHITE,fontWeight:"bold"}}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRejectInvitation}
              style={{
                height: 30,
                width: "40%",
                borderColor: Colors.LIGHT_PURPLE,
                borderWidth: 1,
                borderRadius: 10,
             
                marginLeft: 10,
                alignItems: "center",
                flexDirection: "row",
                      justifyContent: "center", // Centers content vertically

              }}
            >
              <Text style={{ fontSize: 17, marginLeft: 5 ,fontWeight:"bold"}}>Reject</Text>
            </TouchableOpacity>

          </View>



          {isLoading && (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                marginTop: "30%",
                marginBottom: "30%",
              }}
            >
              <LottieView
                source={require('../../../assets/animations/LoadingPublications.json')}
                autoPlay
                loop
                style={{
                  width: 500,
                height:500
                }}
              />
            </View>
          )}

          {!isLoading && postsData.length === 0 && (
            <View style={{ alignItems: "center", marginTop: "50%" }}>
              <Text>No post in this group yet</Text>
            </View>
          )}

          {!isLoading &&
            postsData.length > 0 &&
            postsData.map((post, index) => (
              <Card
                key={post.id}
                style={{
                  width: "100%",
                  marginTop: "5%",
                  borderRadius: 0,
                  backgroundColor: "white",
                }}
              >
                <Card.Content>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {profilePics[index] !== "data:image/jpeg;base64," ? (
                      <Image
                        source={{ uri: profilePics[index] }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          borderWidth: 1,
                          borderColor: "black",
                        }}
                      />
                    ) : (
                      <Image
                        source={require("../../../assets/photoprofil.png")}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          borderWidth: 1,
                          borderColor: "black",
                        }}
                      />
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Title style={{ fontSize: 15, fontWeight: 500 }}>
                        {post.user?.residentProfile?.fullName || "No Username Provided"}
                      </Title>
                      <Text
                        style={{ marginTop: -7, color: "grey", fontSize: 13 }}
                      >
                        {formatDateTime(post.postDateTime)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleOptionsPostModal(post.id)}
                      style={{ marginTop: -10 }}
                    >
                      <Feather name="more-horizontal" size={25} />
                    </TouchableOpacity>
                  </View>
                  {post.caption && (
                    <Paragraph
                      style={{
                        marginTop: 10,
                        color: "black",
                        fontSize: 14,
                        marginBottom: 5,
                      }}
                    >
                      {post.caption}
                    </Paragraph>
                  )}
                </Card.Content>

                {post.photos &&
                  post.photos.length > 0 &&
                  (isFetchingImages ? (
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: "10%",
                      }}
                    >
                      <ActivityIndicator size="large" color={Colors.PURPLE} />
                    </View>
                  ) : (
                    <Card.Content>
                      {post.photos.length === 1 ? (
                        <View style={{ alignItems: "center" }}>
                          <Image
                            source={{
                              uri: imageUris[post.id] && imageUris[post.id][0],
                            }}
                            style={{
                              width: "95%",
                              height: 200,
                              borderRadius: 10,
                              marginTop: 10,
                            }}
                            resizeMode="cover"
                          />
                        </View>
                      ) : post.photos.length <= 4 ? (
                        chunkArray(post.photos, 2).map((photoRow, rowIndex) => (
                          <View
                            key={rowIndex}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%", // Ensure the row takes the full width
                            }}
                          >
                            {photoRow.map((photo, photoIndex) => (
                              <Image
                                key={photoIndex}
                                source={{
                                  uri:
                                    imageUris[post.id] &&
                                    imageUris[post.id][rowIndex * 2 + photoIndex],
                                }}
                                style={{
                                  width: "48%",
                                  height: 200,
                                  borderRadius: 10,
                                  margin: "1%",
                                }}
                                resizeMode="cover"
                              />
                            ))}
                          </View>
                        ))
                      ) : (
                        <>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%", // Ensure the row takes the full width
                            }}
                          >
                            {post.photos.slice(0, 2).map((photo, index) => (
                              <Image
                                key={index}
                                source={{
                                  uri:
                                    imageUris[post.id] &&
                                    imageUris[post.id][index],
                                }}
                                style={{
                                  width: "48%",
                                  height: 200,
                                  borderRadius: 10,
                                  margin: "1%",
                                }}
                                resizeMode="cover"
                              />
                            ))}
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%", // Ensure the row takes the full width
                            }}
                          >
                            <Image
                              source={{
                                uri: imageUris[post.id] && imageUris[post.id][2],
                              }}
                              style={{
                                width: "48%",
                                height: 200,
                                borderRadius: 10,
                                margin: "1%",
                              }}
                              resizeMode="cover"
                            />
                            <View
                              style={{
                                width: "48%",
                                height: 200,
                                borderRadius: 10,
                                margin: "1%",
                                backgroundColor: "black",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ color: "white", fontSize: 18 }}>
                                +{post.photos.length - 3}
                              </Text>
                            </View>
                          </View>
                        </>
                      )}
                    </Card.Content>
                  ))}
                <View style={{ flexDirection: "row" }}>
                  <Text
                    style={{ color: Colors.BLACK, marginLeft: 20, marginTop: 8 }}
                  >
                    {post.likedBy.length} {""}
                    {post.likedBy.length === 1 ? "like" : "likes"}
                  </Text>
                  <Text
                    style={{ color: Colors.BLACK, marginLeft: 20, marginTop: 8 }}
                  >
                    {post.comments.length} {""}
                    {post.comments.length === 1 ? "comment" : "comments"}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: Colors.GunmetalGray,
                    alignItems: "center",
                    width: "95%",
                    height: 1,
                    marginTop: 10,
                    marginLeft: "3%",
                  }}
                />
                <Card.Actions style={{ justifyContent: "space-between" }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 160,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={() => toggleLike(post.id)}
                    >
                      <EvilIcons
                        name={"like"}
                        size={30}
                        color={
                          post.likedBy.includes(userIdHome)
                            ? Colors.LIGHT_PURPLE
                            : Colors.BLACK
                        }
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={() => toggleCommentModal(post.id)}
                    >
                      <EvilIcons name="comment" size={30} color={Colors.BLACK} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={toggleSendModal}
                    >
                      <Feather
                        name="send"
                        size={22}
                        color={Colors.LIGHT_PURPLE}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={toggleShareModal}
                    >
                      <Entypo name="share" size={22} color={Colors.BLACK} />
                    </TouchableOpacity>
                  </View>
                </Card.Actions>
              </Card>
            ))}
        </ScrollView>
        <CommentModel
          isVisible={isCommentModalVisible}
          onClose={toggleCommentModal}
          postId={selectedPostCommentId}
          refreshPosts={fetchGroupPosts}
        />
        <SendModel isVisible={isSendModalVisible} onClose={toggleSendModal} />
        <ShareModel isVisible={isShareModalVisible} onClose={toggleShareModal} />
        <PostOptionsModel
          isVisible={isOptionsPostModalVisible}
          onClose={toggleOptionsPostModal}
          postId={selectedPostId}
        />
        <GroupMembersModal
          isVisible={groupMembersModalVisible}
          onClose={toggleGroupMembersModal}
          members={members}
        />
        <InviteToGroupModal
          isVisible={isInviteToGroupModalVisible}
          onClose={toggleInviteToGroupModal}
          groupId={groupData.id}
        />
      </View>
    );
  }
  ///////////////////////////////////////////////////////////////if the group is public but im not a member ///////////////////////////

  else if (!isMember && data.type === "PUBLIC") {
    return (
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <TouchableOpacity onPress={() => handleImageGroupSelection()}>
            <View>
              {groupPic !== "data:image/jpeg;base64," ? (
                <Image
                  style={{ width: width, height: 200, borderRadius: 10 }}
                  source={{ uri: groupPic }}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require("../../../assets/GroupPhotoPlaceHolder.jpeg")}
                  style={{
                    width: "100%",
                    borderWidth: 0.3,
                    borderColor: "black",
                  }}
                  resizeMode="cover"
                />
              )}

            </View>
          </TouchableOpacity>

          {data.type === "PUBLIC" ? (
            <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
              <MaterialIcons name="public" size={20} />
              <Text style={{ color: "grey" }}> Group (Public) </Text>
              <Text>{membersLength} </Text>
              <TouchableOpacity onPress={toggleGroupMembersModal}>
                <Text style={{ color: "grey" }}>members </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
              <Text style={{ color: "grey" }}>Group (private)</Text>
              <Text>{membersLength} </Text>
              <Text style={{ color: "grey" }}>members </Text>
            </View>
          )}
  <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "black", fontWeight: "bold", fontSize: 20 }}>{groupData.name}</Text>
          </View>
          <View style={{ flexDirection: "row", marginTop: 25 }}>
            <TouchableOpacity
              onPress={isMember || joinedNow ? LeaveGroup : JoingGroup}
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
                style={{ marginLeft: 29 }}
              />
              <Text style={{ fontSize: 17, marginLeft: 5 }}>
                {isMember || joinedNow ? "Member" : "Join"}
              </Text>
            </TouchableOpacity>

          </View>



          {isLoading && (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                marginTop: "30%",
                marginBottom: "30%",
              }}
            >
              <LottieView
                source={require('../../../assets/animations/LoadingPublications.json')}
                autoPlay
                loop
                style={{
                  width: 150,
                  height: 150,
                }}
              />
            </View>
          )}

          {!isLoading && postsData.length === 0 && (
            <View style={{ alignItems: "center", marginTop: "50%" }}>
              <Text>No post in this group yet</Text>
            </View>
          )}

          {!isLoading &&
            postsData.length > 0 &&
            postsData.map((post, index) => (
              <Card
                key={post.id}
                style={{
                  width: "100%",
                  marginTop: "5%",
                  borderRadius: 0,
                  backgroundColor: "white",
                }}
              >
                <Card.Content>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {profilePics[index] !== "data:image/jpeg;base64," ? (
                      <Image
                        source={{ uri: profilePics[index] }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          borderWidth: 1,
                          borderColor: "black",
                        }}
                      />
                    ) : (
                      <Image
                        source={require("../../../assets/photoprofil.png")}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          borderWidth: 1,
                          borderColor: "black",
                        }}
                      />
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Title style={{ fontSize: 15, fontWeight: 500 }}>
                        {post.user?.residentProfile?.fullName || "No Username Provided"}
                      </Title>
                      <Text
                        style={{ marginTop: -7, color: "grey", fontSize: 13 }}
                      >
                        {formatDateTime(post.postDateTime)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleOptionsPostModal(post.id)}
                      style={{ marginTop: -10 }}
                    >
                      <Feather name="more-horizontal" size={25} />
                    </TouchableOpacity>
                  </View>
                  {post.caption && (
                    <Paragraph
                      style={{
                        marginTop: 10,
                        color: "black",
                        fontSize: 14,
                        marginBottom: 5,
                      }}
                    >
                      {post.caption}
                    </Paragraph>
                  )}
                </Card.Content>

                {post.photos &&
                  post.photos.length > 0 &&
                  (isFetchingImages ? (
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: "10%",
                      }}
                    >
                      <ActivityIndicator size="large" color={Colors.PURPLE} />
                    </View>
                  ) : (
                    <Card.Content>
                      {post.photos.length === 1 ? (
                        <View style={{ alignItems: "center" }}>
                          <Image
                            source={{
                              uri: imageUris[post.id] && imageUris[post.id][0],
                            }}
                            style={{
                              width: "95%",
                              height: 200,
                              borderRadius: 10,
                              marginTop: 10,
                            }}
                            resizeMode="cover"
                          />
                        </View>
                      ) : post.photos.length <= 4 ? (
                        chunkArray(post.photos, 2).map((photoRow, rowIndex) => (
                          <View
                            key={rowIndex}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%", // Ensure the row takes the full width
                            }}
                          >
                            {photoRow.map((photo, photoIndex) => (
                              <Image
                                key={photoIndex}
                                source={{
                                  uri:
                                    imageUris[post.id] &&
                                    imageUris[post.id][rowIndex * 2 + photoIndex],
                                }}
                                style={{
                                  width: "48%",
                                  height: 200,
                                  borderRadius: 10,
                                  margin: "1%",
                                }}
                                resizeMode="cover"
                              />
                            ))}
                          </View>
                        ))
                      ) : (
                        <>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%", // Ensure the row takes the full width
                            }}
                          >
                            {post.photos.slice(0, 2).map((photo, index) => (
                              <Image
                                key={index}
                                source={{
                                  uri:
                                    imageUris[post.id] &&
                                    imageUris[post.id][index],
                                }}
                                style={{
                                  width: "48%",
                                  height: 200,
                                  borderRadius: 10,
                                  margin: "1%",
                                }}
                                resizeMode="cover"
                              />
                            ))}
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%", // Ensure the row takes the full width
                            }}
                          >
                            <Image
                              source={{
                                uri: imageUris[post.id] && imageUris[post.id][2],
                              }}
                              style={{
                                width: "48%",
                                height: 200,
                                borderRadius: 10,
                                margin: "1%",
                              }}
                              resizeMode="cover"
                            />
                            <View
                              style={{
                                width: "48%",
                                height: 200,
                                borderRadius: 10,
                                margin: "1%",
                                backgroundColor: "black",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ color: "white", fontSize: 18 }}>
                                +{post.photos.length - 3}
                              </Text>
                            </View>
                          </View>
                        </>
                      )}
                    </Card.Content>
                  ))}
                <View style={{ flexDirection: "row" }}>
                  <Text
                    style={{ color: Colors.BLACK, marginLeft: 20, marginTop: 8 }}
                  >
                    {post.likedBy.length} {""}
                    {post.likedBy.length === 1 ? "like" : "likes"}
                  </Text>
                  <Text
                    style={{ color: Colors.BLACK, marginLeft: 20, marginTop: 8 }}
                  >
                    {post.comments.length} {""}
                    {post.comments.length === 1 ? "comment" : "comments"}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: Colors.GunmetalGray,
                    alignItems: "center",
                    width: "95%",
                    height: 1,
                    marginTop: 10,
                    marginLeft: "3%",
                  }}
                />
                <Card.Actions style={{ justifyContent: "space-between" }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 160,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={() => toggleLike(post.id)}
                    >
                      <EvilIcons
                        name={"like"}
                        size={30}
                        color={
                          post.likedBy.includes(userIdHome)
                            ? Colors.LIGHT_PURPLE
                            : Colors.BLACK
                        }
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={() => toggleCommentModal(post.id)}
                    >
                      <EvilIcons name="comment" size={30} color={Colors.BLACK} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={toggleSendModal}
                    >
                      <Feather
                        name="send"
                        size={22}
                        color={Colors.LIGHT_PURPLE}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={toggleShareModal}
                    >
                      <Entypo name="share" size={22} color={Colors.BLACK} />
                    </TouchableOpacity>
                  </View>
                </Card.Actions>
              </Card>
            ))}
        </ScrollView>
        <CommentModel
          isVisible={isCommentModalVisible}
          onClose={toggleCommentModal}
          postId={selectedPostCommentId}
          refreshPosts={fetchGroupPosts}
        />
        <SendModel isVisible={isSendModalVisible} onClose={toggleSendModal} />
        <ShareModel isVisible={isShareModalVisible} onClose={toggleShareModal} />
        <PostOptionsModel
          isVisible={isOptionsPostModalVisible}
          onClose={toggleOptionsPostModal}
          postId={selectedPostId}
        />
        <GroupMembersModal
          isVisible={groupMembersModalVisible}
          onClose={toggleGroupMembersModal}
          members={members}
        />
        <InviteToGroupModal
          isVisible={isInviteToGroupModalVisible}
          onClose={toggleInviteToGroupModal}
          groupId={groupData.id}
        />
      </View>
    );
  }
  else if (isUserAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <TouchableOpacity onPress={() => handleImageGroupSelection()}>
            <View>
              {groupPic !== "data:image/jpeg;base64," ? (
                <Image
                  style={{ width: width, height: 200, borderRadius: 10 }}
                  source={{ uri: groupPic }}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require("../../../assets/GroupPhotoPlaceHolder.jpeg")}
                  style={{
                    width: "100%",
                    borderWidth: 0.3,
                    borderColor: "black",
                  }}
                  resizeMode="cover"
                />
              )}
              <MaterialIcons name="edit" size={30} color={Colors.LIGHT_PURPLE} style={{ position: "absolute", bottom: 10, right: 10 }} />

            </View>
          </TouchableOpacity>


          <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "black", fontWeight: "bold", fontSize: 20 }}>{groupData.name}</Text>
          </View>
          <View style={{ flexDirection: "row", marginTop: 10, marginLeft: 15 }}>
            <Text style={{ color: "grey" }}>Group (private)</Text>
            <Text>{membersLength} </Text>
            <Text style={{ color: "grey" }}>members </Text>
          </View>
          <View style={{ flexDirection: "row", marginTop: 25 }}>

            <TouchableOpacity
              onPress={toggleInviteToGroupModal}
              style={{
                height: 30,
                width: "40%",
                borderColor: "gray",
                borderWidth: 0.3,
                borderRadius: 10,
                marginLeft: 40,
                alignItems: "center",
                backgroundColor: Colors.LIGHT_PURPLE,
                flexDirection: "row",
              }}
            >
              <Ionicons
                name="person-add-outline"
                color="white"
                size={15}
                style={{ marginLeft: 41 }}
              />
              <Text style={{ fontSize: 17, color: "white", marginLeft: 5 }}>
                Invite
              </Text>
            </TouchableOpacity>
          </View>


          <View style={{ marginTop: 25, alignItems: "center" }}>
            <TextInput
              placeholder="What's new ?"
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
              onPress={handleImageSelection}
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
            <View
              style={{
                height: photos.length > 0 ? 150 : 0,
                width: 350,
                marginTop: photos.length > 0 ? 15 : 0,
                marginBottom: photos.length > 0 ? 15 : 0,
              }}
            >
              {photos.length > 0 && (
                <ScrollView horizontal>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {photos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={{
                          width: 100,
                          height: 90,
                          margin: 5,
                        }}
                      />
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
            <TouchableOpacity
              onPress={AddPost}
              style={{ marginTop: photos.length > 0 ? -40 : 25, width: "50%" }}
            >
              <View
                style={{
                  height: 35,
                  backgroundColor: Colors.LIGHT_PURPLE,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "white", fontSize: 16 }}>Publish</Text>
              </View>
            </TouchableOpacity>
          </View>


          {isLoading && (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                marginTop: "30%",
                marginBottom: "30%",
              }}
            >
              <LottieView
                source={require('../../../assets/animations/LoadingPublications.json')}
                autoPlay
                loop
                style={{
                  width: 400,
                  height: 370,
                }}
              />
            </View>
          )}

          {!isLoading && postsData.length === 0 && (
            <View style={{ alignItems: "center", marginTop: "50%" }}>
              <Text>No post in this group yet</Text>
            </View>
          )}

          {!isLoading &&
            postsData.length > 0 &&
            postsData.map((post, index) => (
              <Card
                key={post.id}
                style={{
                  width: "100%",
                  marginTop: "5%",
                  borderRadius: 0,
                  backgroundColor: "white",
                }}
              >
                <Card.Content>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {profilePics[index] !== "data:image/jpeg;base64," ? (
                      <Image
                        source={{ uri: profilePics[index] }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          borderWidth: 1,
                          borderColor: "black",
                        }}
                      />
                    ) : (
                      <Image
                        source={require("../../../assets/photoprofil.png")}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          borderWidth: 1,
                          borderColor: "black",
                        }}
                      />
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Title style={{ fontSize: 15, fontWeight: 500 }}>
                        {post.user?.residentProfile?.fullName || "No Username Provided"}
                      </Title>
                      <Text
                        style={{ marginTop: -7, color: "grey", fontSize: 13 }}
                      >
                        {formatDateTime(post.postDateTime)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleOptionsPostModal(post.id)}
                      style={{ marginTop: -10 }}
                    >
                      <Feather name="more-horizontal" size={25} />
                    </TouchableOpacity>
                  </View>
                  {post.caption && (
                    <Paragraph
                      style={{
                        marginTop: 10,
                        color: "black",
                        fontSize: 14,
                        marginBottom: 5,
                      }}
                    >
                      {post.caption}
                    </Paragraph>
                  )}
                </Card.Content>

                {post.photos &&
                  post.photos.length > 0 &&
                  (isFetchingImages ? (
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: "10%",
                      }}
                    >
                      <ActivityIndicator size="large" color={Colors.PURPLE} />
                    </View>
                  ) : (
                    <Card.Content>
                      {post.photos.length === 1 ? (
                        <View style={{ alignItems: "center" }}>
                          <Image
                            source={{
                              uri: imageUris[post.id] && imageUris[post.id][0],
                            }}
                            style={{
                              width: "95%",
                              height: 200,
                              borderRadius: 10,
                              marginTop: 10,
                            }}
                            resizeMode="cover"
                          />
                        </View>
                      ) : post.photos.length <= 4 ? (
                        chunkArray(post.photos, 2).map((photoRow, rowIndex) => (
                          <View
                            key={rowIndex}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%", // Ensure the row takes the full width
                            }}
                          >
                            {photoRow.map((photo, photoIndex) => (
                              <Image
                                key={photoIndex}
                                source={{
                                  uri:
                                    imageUris[post.id] &&
                                    imageUris[post.id][rowIndex * 2 + photoIndex],
                                }}
                                style={{
                                  width: "48%",
                                  height: 200,
                                  borderRadius: 10,
                                  margin: "1%",
                                }}
                                resizeMode="cover"
                              />
                            ))}
                          </View>
                        ))
                      ) : (
                        <>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%", // Ensure the row takes the full width
                            }}
                          >
                            {post.photos.slice(0, 2).map((photo, index) => (
                              <Image
                                key={index}
                                source={{
                                  uri:
                                    imageUris[post.id] &&
                                    imageUris[post.id][index],
                                }}
                                style={{
                                  width: "48%",
                                  height: 200,
                                  borderRadius: 10,
                                  margin: "1%",
                                }}
                                resizeMode="cover"
                              />
                            ))}
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%", // Ensure the row takes the full width
                            }}
                          >
                            <Image
                              source={{
                                uri: imageUris[post.id] && imageUris[post.id][2],
                              }}
                              style={{
                                width: "48%",
                                height: 200,
                                borderRadius: 10,
                                margin: "1%",
                              }}
                              resizeMode="cover"
                            />
                            <View
                              style={{
                                width: "48%",
                                height: 200,
                                borderRadius: 10,
                                margin: "1%",
                                backgroundColor: "black",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ color: "white", fontSize: 18 }}>
                                +{post.photos.length - 3}
                              </Text>
                            </View>
                          </View>
                        </>
                      )}
                    </Card.Content>
                  ))}
                <View style={{ flexDirection: "row" }}>
                  <Text
                    style={{ color: Colors.BLACK, marginLeft: 20, marginTop: 8 }}
                  >
                    {post.likedBy.length} {""}
                    {post.likedBy.length === 1 ? "like" : "likes"}
                  </Text>
                  <Text
                    style={{ color: Colors.BLACK, marginLeft: 20, marginTop: 8 }}
                  >
                    {post.comments.length} {""}
                    {post.comments.length === 1 ? "comment" : "comments"}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: Colors.GunmetalGray,
                    alignItems: "center",
                    width: "95%",
                    height: 1,
                    marginTop: 10,
                    marginLeft: "3%",
                  }}
                />
                <Card.Actions style={{ justifyContent: "space-between" }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 160,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={() => toggleLike(post.id)}
                    >
                      <EvilIcons
                        name={"like"}
                        size={30}
                        color={
                          post.likedBy.includes(userIdHome)
                            ? Colors.LIGHT_PURPLE
                            : Colors.BLACK
                        }
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={() => toggleCommentModal(post.id)}
                    >
                      <EvilIcons name="comment" size={30} color={Colors.BLACK} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={toggleSendModal}
                    >
                      <Feather
                        name="send"
                        size={22}
                        color={Colors.LIGHT_PURPLE}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 10,
                      }}
                      onPress={toggleShareModal}
                    >
                      <Entypo name="share" size={22} color={Colors.BLACK} />
                    </TouchableOpacity>
                  </View>
                </Card.Actions>
              </Card>
            ))}
        </ScrollView>
        <CommentModel
          isVisible={isCommentModalVisible}
          onClose={toggleCommentModal}
          postId={selectedPostCommentId}
          refreshPosts={fetchGroupPosts}
        />
        <SendModel isVisible={isSendModalVisible} onClose={toggleSendModal} />
        <ShareModel isVisible={isShareModalVisible} onClose={toggleShareModal} />
        <PostOptionsModel
          isVisible={isOptionsPostModalVisible}
          onClose={toggleOptionsPostModal}
          postId={selectedPostId}
        />
        <GroupMembersModal
          isVisible={groupMembersModalVisible}
          onClose={toggleGroupMembersModal}
          members={members}
        />
        <InviteToGroupModal
          isVisible={isInviteToGroupModalVisible}
          onClose={toggleInviteToGroupModal}
          groupId={groupData.id}
        />
      </View>
    );
  }
  /////////////////////////////////////////////////////////////////////////////////
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View>
          {groupPic !== "data:image/jpeg;base64," ? (
            <Image
              style={{ width: width, height: 200, borderRadius: 10 }}
              source={{ uri: groupPic }}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={require("../../../assets/GroupPhotoPlaceHolder.jpeg")}
              style={{
                width: "100%",
                borderWidth: 0.3,
                borderColor: "black",
              }}
              resizeMode="cover"
            />
          )}


        </View>


        {data.type === "PUBLIC" ? (
          <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <MaterialIcons name="public" size={20} />
            <Text style={{ color: "grey" }}> Group (Public) </Text>
            <Text>{membersLength} </Text>
            <TouchableOpacity onPress={toggleGroupMembersModal}>
              <Text style={{ color: "grey" }}>members </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: "row", marginTop: 15, marginLeft: 15 }}>
            <Text style={{ color: "grey" }}>Group (private)</Text>
            <Text>{membersLength} </Text>
            <Text style={{ color: "grey" }}>members </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", marginTop: 25 }}>
          <TouchableOpacity
            onPress={isMember || joinedNow ? LeaveGroup : JoingGroup}
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
              style={{ marginLeft: 29 }}
            />
            <Text style={{ fontSize: 17, marginLeft: 5 }}>
              {isMember || joinedNow ? "Member" : "Join"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleInviteToGroupModal}
            style={{
              height: 30,
              width: "40%",
              borderColor: "gray",
              borderWidth: 0.3,
              borderRadius: 10,
              marginLeft: 40,
              alignItems: "center",
              backgroundColor: Colors.LIGHT_PURPLE,
              flexDirection: "row",
            }}
          >
            <Ionicons
              name="person-add-outline"
              color="white"
              size={15}
              style={{ marginLeft: 41 }}
            />
            <Text style={{ fontSize: 17, color: "white", marginLeft: 5 }}>
              Invite
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 25, alignItems: "center" }}>
          <TextInput
            placeholder="What's new ?"
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
            onPress={handleImageSelection}
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
          <View
            style={{
              height: photos.length > 0 ? 150 : 0,
              width: 350,
              marginTop: photos.length > 0 ? 15 : 0,
              marginBottom: photos.length > 0 ? 15 : 0,
            }}
          >
            {photos.length > 0 && (
              <ScrollView horizontal>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {photos.map((photo, index) => (
                    <Image
                      key={index}
                      source={{ uri: photo }}
                      style={{
                        width: 100,
                        height: 90,
                        margin: 5,
                      }}
                    />
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
          <TouchableOpacity
            onPress={AddPost}
            style={{ marginTop: photos.length > 0 ? -40 : 25, width: "50%" }}
          >
            <View
              style={{
                height: 35,
                backgroundColor: Colors.LIGHT_PURPLE,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "white", fontSize: 16 }}>Publish</Text>
            </View>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              marginTop: "30%",
              marginBottom: "30%",
            }}
          >
            <ActivityIndicator size="large" color={Colors.PURPLE} />
          </View>
        )}

        {!isLoading && postsData.length === 0 && (
          <View style={{ alignItems: "center", marginTop: "50%" }}>
            <Text>No post in this group yet</Text>
          </View>
        )}

        {!isLoading &&
          postsData.length > 0 &&
          postsData.map((post, index) => (
            <Card
              key={post.id}
              style={{
                width: "100%",
                marginTop: "5%",
                borderRadius: 0,
                backgroundColor: "white",
              }}
            >
              <Card.Content>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {profilePics[index] !== "data:image/jpeg;base64," ? (
                    <Image
                      source={{ uri: profilePics[index] }}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        borderWidth: 1,
                        borderColor: "black",
                      }}
                    />
                  ) : (
                    <Image
                      source={require("../../../assets/photoprofil.png")}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        borderWidth: 1,
                        borderColor: "black",
                      }}
                    />
                  )}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Title style={{ fontSize: 15, fontWeight: 500 }}>
                      {post.user?.residentProfile?.fullName || "No Username Provided"}
                    </Title>
                    <Text
                      style={{ marginTop: -7, color: "grey", fontSize: 13 }}
                    >
                      {formatDateTime(post.postDateTime)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleOptionsPostModal(post.id)}
                    style={{ marginTop: -10 }}
                  >
                    <Feather name="more-horizontal" size={25} />
                  </TouchableOpacity>
                </View>
                {post.caption && (
                  <Paragraph
                    style={{
                      marginTop: 10,
                      color: "black",
                      fontSize: 14,
                      marginBottom: 5,
                    }}
                  >
                    {post.caption}
                  </Paragraph>
                )}
              </Card.Content>

              {post.photos &&
                post.photos.length > 0 &&
                (isFetchingImages ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: "10%",
                    }}
                  >
                    <ActivityIndicator size="large" color={Colors.PURPLE} />
                  </View>
                ) : (
                  <Card.Content>
                    {post.photos.length === 1 ? (
                      <View style={{ alignItems: "center" }}>
                        <Image
                          source={{
                            uri: imageUris[post.id] && imageUris[post.id][0],
                          }}
                          style={{
                            width: "95%",
                            height: 200,
                            borderRadius: 10,
                            marginTop: 10,
                          }}
                          resizeMode="cover"
                        />
                      </View>
                    ) : post.photos.length <= 4 ? (
                      chunkArray(post.photos, 2).map((photoRow, rowIndex) => (
                        <View
                          key={rowIndex}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%", // Ensure the row takes the full width
                          }}
                        >
                          {photoRow.map((photo, photoIndex) => (
                            <Image
                              key={photoIndex}
                              source={{
                                uri:
                                  imageUris[post.id] &&
                                  imageUris[post.id][rowIndex * 2 + photoIndex],
                              }}
                              style={{
                                width: "48%",
                                height: 200,
                                borderRadius: 10,
                                margin: "1%",
                              }}
                              resizeMode="cover"
                            />
                          ))}
                        </View>
                      ))
                    ) : (
                      <>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%", // Ensure the row takes the full width
                          }}
                        >
                          {post.photos.slice(0, 2).map((photo, index) => (
                            <Image
                              key={index}
                              source={{
                                uri:
                                  imageUris[post.id] &&
                                  imageUris[post.id][index],
                              }}
                              style={{
                                width: "48%",
                                height: 200,
                                borderRadius: 10,
                                margin: "1%",
                              }}
                              resizeMode="cover"
                            />
                          ))}
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%", // Ensure the row takes the full width
                          }}
                        >
                          <Image
                            source={{
                              uri: imageUris[post.id] && imageUris[post.id][2],
                            }}
                            style={{
                              width: "48%",
                              height: 200,
                              borderRadius: 10,
                              margin: "1%",
                            }}
                            resizeMode="cover"
                          />
                          <View
                            style={{
                              width: "48%",
                              height: 200,
                              borderRadius: 10,
                              margin: "1%",
                              backgroundColor: "black",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: "white", fontSize: 18 }}>
                              +{post.photos.length - 3}
                            </Text>
                          </View>
                        </View>
                      </>
                    )}
                  </Card.Content>
                ))}
              <View style={{ flexDirection: "row" }}>
                <Text
                  style={{ color: Colors.BLACK, marginLeft: 20, marginTop: 8 }}
                >
                  {post.likedBy.length} {""}
                  {post.likedBy.length === 1 ? "like" : "likes"}
                </Text>
                <Text
                  style={{ color: Colors.BLACK, marginLeft: 20, marginTop: 8 }}
                >
                  {post.comments.length} {""}
                  {post.comments.length === 1 ? "comment" : "comments"}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: Colors.GunmetalGray,
                  alignItems: "center",
                  width: "95%",
                  height: 1,
                  marginTop: 10,
                  marginLeft: "3%",
                }}
              />
              <Card.Actions style={{ justifyContent: "space-between" }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginRight: 160,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginHorizontal: 10,
                    }}
                    onPress={() => toggleLike(post.id)}
                  >
                    <EvilIcons
                      name={"like"}
                      size={30}
                      color={
                        post.likedBy.includes(userIdHome)
                          ? Colors.LIGHT_PURPLE
                          : Colors.BLACK
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginHorizontal: 10,
                    }}
                    onPress={() => toggleCommentModal(post.id)}
                  >
                    <EvilIcons name="comment" size={30} color={Colors.BLACK} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginHorizontal: 10,
                    }}
                    onPress={toggleSendModal}
                  >
                    <Feather
                      name="send"
                      size={22}
                      color={Colors.LIGHT_PURPLE}
                    />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginHorizontal: 10,
                    }}
                    onPress={toggleShareModal}
                  >
                    <Entypo name="share" size={22} color={Colors.BLACK} />
                  </TouchableOpacity>
                </View>
              </Card.Actions>
            </Card>
          ))}
      </ScrollView>
      <CommentModel
        isVisible={isCommentModalVisible}
        onClose={toggleCommentModal}
        postId={selectedPostCommentId}
        refreshPosts={fetchGroupPosts}
      />
      <SendModel isVisible={isSendModalVisible} onClose={toggleSendModal} />
      <ShareModel isVisible={isShareModalVisible} onClose={toggleShareModal} />
      <PostOptionsModel
        isVisible={isOptionsPostModalVisible}
        onClose={toggleOptionsPostModal}
        postId={selectedPostId}
      />
      <GroupMembersModal
        isVisible={groupMembersModalVisible}
        onClose={toggleGroupMembersModal}
        members={members}
      />
      <InviteToGroupModal
        isVisible={isInviteToGroupModalVisible}
        onClose={toggleInviteToGroupModal}
        groupId={groupData.id}
      />
    </View>
  );
};

export default GroupDetails;
