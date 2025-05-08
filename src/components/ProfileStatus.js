import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import Colors from "../../assets/Colors";
import { EvilIcons, Feather, Entypo } from "@expo/vector-icons";
import CommentModel from "../components/pupUps/CommentModel";
import SendModel from "../components/pupUps/SendModel";
import ShareModel from "../components/pupUps/ShareModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PostOptionsModel from "../components/pupUps/PostOptionsModel";
import Axios from "axios";
import { APP_ENV } from "../utils/BaseUrl";

const ProfileStatus = ({ fullName, profilePic, idfromUsersprofile }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [isSendModalVisible, setSendModalVisible] = useState(false);
  const [isShareModalVisible, setShareModalVisible] = useState(false);
  const [isOptionsPostModalVisible, setOptionsPostModalVisible] =
    useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [caption, setCaption] = useState("");
  const [id, setId] = useState("");
  const [postDateTime, setPostDateTime] = useState("");
  const [data, setData] = useState([]);
  const [likedBy, setLikedBy] = useState([]);
  const [selectedPostCommentId, setSelectedPostCommentId] = useState(null);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [userId, setUserId] = useState(null);

  ///////////////////////////////////////////////////////////

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      setUserId(storedUserId);
    };
    fetchUserId();
  }, []);
  const toggleOptionsPostModal = (postId) => {
    setSelectedPostId(postId);
    setOptionsPostModalVisible(!isOptionsPostModalVisible);
  };

  const toggleCommentModal = (postCommentId) => {
    setSelectedPostCommentId(postCommentId);
    setCommentModalVisible(!isCommentModalVisible);
  };
  

  const toggleSendModal = () => {
    setSendModalVisible(!isSendModalVisible);
  };
  const toggleShareModal = () => {
    setShareModalVisible(!isShareModalVisible);
  };
  const handleImagePress = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
  };
  /////////////////////////////////////////////////////////////////////////
  const fetchProfilePosts = async () => {
        setIsFetchingPosts(true);

    try {
   let userId = await AsyncStorage.getItem("userId");
   
  //  if (idfromUsersprofile) {
  //   userId = idfromUsersprofile;
  // } 
        const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentpostsWithCaptions/${userId}`
      );

      if (
        response.data &&
        response.data !== "No posts with captions found for user"
      ) {
        const residentPosts = response.data;
        //console.log("resident Post Response : ", response.data);
        if (residentPosts.length > 0) {
          residentPosts.sort((a, b) => {
            const dateA = new Date(a.postDateTime);
            const dateB = new Date(b.postDateTime);
            return dateB - dateA;
          });

          setData(residentPosts);
          setLikedBy(residentPosts.likedBy);
          setCaption(residentPosts.caption);
          setId(residentPosts.id);
          setPostDateTime(residentPosts.postDateTime);
        }
      } else {
        console.log("No resident status found.");
      }
    } catch (error) {
      console.error("Error getting resident status:", error);
    } finally {
    setIsFetchingPosts(false);

    }
  };
  useEffect(() => {
    fetchProfilePosts();
  }, []);

  //////////////////////////////////////////////////////////////////////////
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
  ///////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////
  const LikePost = async (postId) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/likepost/${postId}/${userId}`
      );
    } catch (error) {
      console.error("Error Liking resident posts:", error);
    }
  };
  ///////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////

  return (
    <ScrollView>
      {isFetchingPosts ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            marginTop: "30%",
          }}
        >
          <ActivityIndicator size="large" color={Colors.PURPLE} />
        </View>
      ) : (
        <>
          {data.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: "50%" }}>
              <Text>No status yet</Text>
            </View>
          ) : (
            data.map((post, index) => (
              <View key={post.id} style={{ marginBottom: 20, marginTop: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginLeft: 10,
                  }}
                >
                  {/* Render profile picture */}
                  {profilePic !== "data:image/jpeg;base64," ? (
                    <Image
                      source={{ uri: profilePic }}
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
                      source={require("../../assets/default-avatar.jpg")}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        borderWidth: 1,
                        borderColor: "black",
                      }}
                    />
                  )}
                  <Text
                    style={{
                      color: "black",
                      fontSize: 16,
                      marginTop: 3,
                      marginLeft: 7,
                      fontWeight: 500,
                    }}
                  >
                    {fullName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => toggleOptionsPostModal(post.id)}
                    style={{ marginLeft: "auto", marginRight: 10 }}
                  >
                    <Feather name="more-horizontal" size={20} />
                  </TouchableOpacity>
                </View>
                <Text
                  style={{
                    color: "grey",
                    fontSize: 13,
                    marginTop: "-4%",
                    marginLeft: "17%",
                  }}
                >
                  {formatDateTime(post.postDateTime)}
                </Text>
                {post.caption && (
                  <Text style={{ marginLeft: 10, marginTop: 5 }}>
                    {post.caption}
                  </Text>
                )}
                {post.photos && post.photos.length > 0 && (
                  <View style={{ marginLeft: 10, marginTop: 10 }}>
                    {post.photos.map((photo, photoIndex) => (
                      <Image
                        key={photoIndex}
                        source={{
                          uri:
                            imageUris[post.id] &&
                            imageUris[post.id][photoIndex],
                        }}
                        style={{
                          width: "100%",
                          height: 200,
                          borderRadius: 10,
                          marginBottom: 10,
                        }}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
                <View
                  style={{ flexDirection: "row", marginLeft: 10, marginTop: 5 }}
                >
                  <Text style={{ color: Colors.BLACK, marginRight: 20 }}>
                    {post.likedBy.length}{" "}
                    {post.likedBy.length === 1 ? "like" : "likes"}
                  </Text>
                  <Text style={{ color: Colors.BLACK }}>
                    {post.comments.length}{" "}
                    {post.comments.length === 1 ? "comment" : "comments"}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: Colors.GunmetalGray,
                    width: "95%",
                    height: 1,
                    marginTop: 10,
                    marginLeft: "3%",
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 40,
                    marginTop: 5,
                    paddingTop: 5,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      marginRight: "5%",
                      marginLeft: "-11%",
                    }}
                    onPress={() => toggleLike(post.id)}
                  >
                    <EvilIcons
                      name={"like"}
                      size={30}
                      color={
                        post.likedBy.includes(userId)
                          ? Colors.LIGHT_PURPLE
                          : Colors.BLACK
                      }
                      style={{ marginRight: -2 }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      marginLeft: "-30%",
                    }}
                    onPressIn={() => toggleCommentModal(post.id)}
                  >
                    <EvilIcons name="comment" size={30} color={Colors.BLACK} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      left: "-25%",
                    }}
                    Entypo
                    onPress={toggleSendModal}
                  >
                    <Feather
                      name="send"
                      size={22}
                      color={Colors.LIGHT_PURPLE}
                      style={{ marginRight: 5 }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      alignItems: "center",
                      flexDirection: "row",
                      left: "9%",
                    }}
                    onPress={toggleShareModal}
                  >
                    <Entypo
                      name="share"
                      size={22}
                      color={Colors.BLACK}
                      style={{ marginRight: 5 }}
                    />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    backgroundColor: Colors.GunmetalGray,
                    width: "95%",
                    height: 1,
                    marginTop: 10,
                    marginLeft: "3%",
                  }}
                />
              </View>
            ))
          )}
        </>
      )}

      {/* Modals */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          }}
        >
          <TouchableOpacity
            style={{ position: "absolute", top: 20, right: 20 }}
            onPress={() => setModalVisible(false)}
          >
            <Text style={{ color: "white", fontSize: 18 }}>Close</Text>
          </TouchableOpacity>
          <Image
            source={selectedImage}
            style={{ width: "90%", height: "90%", resizeMode: "contain" }}
          />
        </View>
      </Modal>

      <CommentModel
        isVisible={isCommentModalVisible}
        onClose={toggleCommentModal}
        postId={selectedPostCommentId}
      />
      <SendModel isVisible={isSendModalVisible} onClose={toggleSendModal} />
      <ShareModel isVisible={isShareModalVisible} onClose={toggleShareModal} />
      <PostOptionsModel
        isVisible={isOptionsPostModalVisible}
        onClose={toggleOptionsPostModal}
        postId={selectedPostId}
        refreshProfileStatus={fetchProfilePosts}
      />
    </ScrollView>
  );

};

export default ProfileStatus;
