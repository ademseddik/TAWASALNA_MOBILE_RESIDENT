import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Modal } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "../../../assets/Colors";
import { TextInput } from "react-native";
import {
  UserInfo,
  UserImgWrapper,
  UserImg,
  UserInfoText,
  UserName,
  PostTime,
  MessageText,
  TextSection,
  CommentContainer,
} from "../../utils/Styles/MessageStyles";
import { encode } from "base64-arraybuffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

import Axios from "axios";
import { APP_ENV } from "../../../src/utils/BaseUrl";

const CommentModel = ({
  isVisible,
  onClose,
  postId,
  fullName,
  refreshPosts,
}) => {
  const [commentText, setCommentText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [data, setData] = useState([]);
  const [userId, setUserId] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [replyprofilePic, setReplyProfilePic] = useState({});
  const [userprofilePic, setUserProfilePic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyingToUserName, setReplyingToUserName] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [userFullname, setFullName] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  ///////////////////////////////////////////////////////////
  const handleTextInputFocus = () => {
    setIsTyping(true);
  };

  const handleTextInputBlur = () => {
    setIsTyping(false);
  };
  const handleModalClose = () => {
    onClose();
    setData([]);
    postId = null;
  };

  const showEmptyFieldsToast = () => {
    Toast.show({
      type: "info",
      text1: "Please write a comment.",
      visibilityTime: 3000,
      autoHide: true,
    });
  };
  const showaddedcommentToast = () => {
    Toast.show({
      type: "info",
      text1: "comment added successfully .",
      visibilityTime: 3000,
      autoHide: true,
    });
  };
  ///////////////////////////////////////////////////////////////////////////////////////////
  const handleTextInputChange = async (text) => {
    setCommentText(text);
    setIsTyping(text.trim().length > 0);

    const lastAtIndex = text.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const query = text.substring(lastAtIndex + 1);
      if (query.length > 0) {
        const fetchedFollowers = await fetchFollowers(query);
        setFollowers(fetchedFollowers);
        setShowFollowers(true);
      } else {
        setShowFollowers(false);
      }
    } else {
      setShowFollowers(false);
    }
  };

  const handleFollowerClick = (followerFullName) => {
    const lastAtIndex = commentText.lastIndexOf("@");
    const newText =
      commentText.substring(0, lastAtIndex + 1) + followerFullName + " ";
    setCommentText(newText);
    setShowFollowers(false);
  };
  ///////////////////////////////////////////////////////////////////////////////////////////
  const fetchFollowers = async (query) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/followers/search/${userId}?partialName=${query}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching followers:", error);
      return [];
    }
  };
  ///////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const fetchProfile = async () => {

      try {
        const userId = await AsyncStorage.getItem("userId");
        const response = await Axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`
        );
        setFullName(response.data.fullName);
      } catch (error) {
        console.error("Error getting resident profile:", error);
        throw new Error(error);
      }
    };

    fetchProfile();
  }, []);
  ///////////////////////////////////////////////////////////////////////////////////////////
  const addCommentToPost = async () => {
    if (!commentText.trim()) {
      showEmptyFieldsToast();
      return;
    }

    setIsAddingComment(true);

    try {
      const userId = await AsyncStorage.getItem("userId");
      const Token = await AsyncStorage.getItem("USER_ACCESS");
      if (isReplying && replyingToCommentId) {
        // Add reply to comment
        await Axios.post(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/replytocomment/${userId}/${replyingToCommentId}`,
          { replyText: commentText }
        );
      } else {
        // Add new comment
        await Axios.post(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/addcomment/${postId}/${userId}`,
          { commentText },
          {
            headers: {
              Authorization: `Bearer ${Token}`
            }
          }
        );
        showaddedcommentToast();
      }

      setCommentText("");
      setIsReplying(false);
      setReplyingToCommentId(null);
      setReplyingToUserName("");
      fetchCommentsPost();
    } catch (error) {
      console.error("Error while adding comment or reply:", error);
    } finally {
      setIsAddingComment(false);
    }
  };
  ///////////////////////////////////////////////////////////////////////////////////////////
  const handleReplyButtonPress = (commentId, userName) => {
    setReplyingToCommentId(commentId);
    setReplyingToUserName(userName);
    setIsReplying(true);
    setCommentText(`@${userName} `);
  };
  ///////////////////////////////////////////////////////////////////////////////////////////
  const fetchRepliesForComment = async (commentId) => {
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getreplies/${commentId}`
      );
      if (
        response.data &&
        response.data !== "No replies found for the specified comment"
      ) {
        setReplies((prevReplies) => ({
          ...prevReplies,
          [commentId]: response.data,
        }));

        console.log('replies for :', commentId, ':', response.data)

        const profilePicPromises = response.data.map(async (reply) => {
          const response = await Axios.get(
            `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getprofilephoto/${reply.residentId}`,
            { responseType: "arraybuffer" }
          );
          const base64Image = encode(response.data);
          return {
            residentId: reply.residentId,
            profilePic: `data:image/jpeg;base64,${base64Image}`,
          };
        });

        const profilePics = await Promise.all(profilePicPromises);
        const profilePicMap = profilePics.reduce((acc, pic) => {
          acc[pic.residentId] = pic.profilePic;
          return acc;
        }, {});

        setReplyProfilePic((prev) => ({
          ...prev,
          ...profilePicMap,
        }));
      } else {
        setReplies((prevReplies) => ({
          ...prevReplies,
          [commentId]: [],
        }));
      }
    } catch (error) {
      console.error(
        "Error while fetching replies to the comment: ",
        error.response ? error.response.data : error.message
      );
    }
  };
  useEffect(() => {
    data.forEach((comment) => {
      if (comment.replies && comment.replies.length > 0) {
        fetchRepliesForComment(comment.id);
      }
    });
  }, [data]);
  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////
  const fetchCommentsPost = async () => {
    if (!postId) {
      console.log(postId)
      console.error("postId is null or undefined.");
      return;
    }
    setIsLoading(true);
    setData([]);
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getcomments/${postId}`
      );

      if (
        response.data &&
        response.data !== "No comments found for the specified post"
      ) {
        const residentComments = response.data;
        //console.log("resident comments Response : ", residentComments);
        setData(residentComments);
        //console.log("PostId from Comment Model : ", postId);
        const userIds = residentComments.map((comment) => comment.user.id);
        setUserId(userIds);
      } else if (response.data === "No comments found for the specified post") {

        console.log("No resident comments found on this post !.", data.length);
      }
    } catch (error) {
      console.error("Error getting resident comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchCommentsPost();
    }
  }, [postId]);

  ///////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const fetchProfilePhotos = async () => {
      try {
        const promises = userId.map(async (userId) => {
          const response = await Axios.get(
            `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getprofilephoto/${userId}`,
            { responseType: "arraybuffer" }
          );
          const base64Image = encode(response.data);
          return `data:image/jpeg;base64,${base64Image}`;
        });
        const profilePics = await Promise.all(promises);
        setProfilePic(profilePics);
      } catch (error) {
        console.error("Error getting profile photos:", error);
        throw new Error(error);
      }
    };

    fetchProfilePhotos();
  }, [userId]);
  ////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const response = await Axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getprofilephoto/${userId}`,
          {
            responseType: "arraybuffer",
          }
        );
        const base64Image = encode(response.data);

        const imageUrl = `data:image/jpeg;base64,${base64Image}`;

        setUserProfilePic(imageUrl);
      } catch (error) {
        console.error("Error getting profile photo:", error);
        throw new Error(error);
      }
    };

    fetchProfilePhoto();
  }, []);
  ////////////////////////////////////////////////////////////////////////////////////////////
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds === 1 ? "" : "s"} ago`;
    } else if (diffInSeconds < 3600) {
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      return `${diffInMinutes} mn${diffInMinutes === 1 ? "" : "s"} `;
    } else if (diffInSeconds < 86400) {
      const diffInHours = Math.floor(diffInSeconds / 3600);
      return `${diffInHours} hr${diffInHours === 1 ? "" : "s"} `;
    } else {
      const diffInDays = Math.floor(diffInSeconds / 86400);
      return `${diffInDays} day${diffInDays === 1 ? "" : "s"} `;
    }
  };
  ///////////////////////////////////////////////////////////////////////////////////////////
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleModalClose}
       onSwipeComplete={handleModalClose}
  swipeDirection="down"
  onBackdropPress={handleModalClose}
    >

      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Comments</Text>
            <View style={styles.separator} />
            <ScrollView>
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.PURPLE} />
                </View>
              )}
              {!isLoading && data.length === 0 && (
                <View style={styles.noCommentsContainer}>
                  <Text>No comments yet</Text>
                </View>
              )}
              {!isLoading &&
                data.length > 0 &&
                data.map((item, index) => (
                  <View key={item.id}>
                    <UserInfo key={item.id}>
                      <UserImgWrapper>
                        <UserImg source={item.userImg} />
                      </UserImgWrapper>
                      <TextSection>
                        <View style={styles.commentHeader}>
                          <View style={{ flex: 1 }}>
                            {profilePic[index] !== "data:image/jpeg;base64," ? (
                              <Image
                                key={profilePic[index]}
                                source={{ uri: profilePic[index] }}
                                style={styles.profileImage}
                              />
                            ) : (
                              <Image
                                source={require("../../../assets/default-avatar.jpg")}
                                style={styles.profileImage}
                              />
                            )}
                          </View>
                          <CommentContainer>
                            <UserName>
                              {item.user.residentProfile.fullName}
                            </UserName>
                            <MessageText>{item.text}</MessageText>
                          </CommentContainer>
                        </View>
                        <View style={styles.commentFooter}>
                          <PostTime>{formatDateTime(item.createdAt)}</PostTime>
                          <TouchableOpacity
                            style={{ marginLeft: 7 }}
                            onPress={() =>
                              handleReplyButtonPress(
                                item.id,
                                item.user.residentProfile.fullName
                              )
                            }
                          >
                            <Text style={{ color: "grey" }}>Reply</Text>
                          </TouchableOpacity>
                        </View>
                        {replies[item.id] && (
                          <>
                            {replies[item.id]
                              .slice(0, 1)
                              .map((reply, replyIndex) => (
                                // Render the first reply
                                <View
                                  key={replyIndex}
                                  style={styles.replyContainer}
                                >
                                  <View style={styles.replyLine} />
                                  {replyprofilePic[reply.residentId] !==
                                    "data:image/jpeg;base64," ? (
                                    <Image
                                      source={{
                                        uri: replyprofilePic[reply.residentId],
                                      }}
                                      style={{
                                        width: 35,
                                        height: 35,
                                        borderRadius: 25,
                                      }}
                                    />
                                  ) : (
                                    <Image
                                      source={require("../../../assets/default-avatar.jpg")}
                                      style={{
                                        width: 35,
                                        height: 35,
                                        borderRadius: 25,
                                      }}
                                    />
                                  )}
                                  <View style={{ marginLeft: 8 }}>
                                    <CommentContainer>
                                      <UserName>{reply.userName}</UserName>
                                      <MessageText>{reply.text}</MessageText>
                                    </CommentContainer>
                                  </View>
                                  <Text
                                    style={{
                                      color: "grey",
                                      fontSize: 12,
                                      left: 8,
                                      top: -4,
                                    }}
                                  >
                                    {formatDateTime(reply.createdAt)}
                                  </Text>
                                </View>
                              ))}
                            {replies[item.id].length > 1 && (
                              <TouchableOpacity
                                onPress={() =>
                                  setShowAllReplies(!showAllReplies)
                                }
                                style={{ marginLeft: 60 }}
                              >
                                <Text style={{ color: Colors.LIGHT_PURPLE }}>
                                  {showAllReplies
                                    ? "Hide Replies"
                                    : "Show Other  Replies"}
                                </Text>
                              </TouchableOpacity>
                            )}
                            {showAllReplies &&
                              replies[item.id]
                                .slice(1)
                                .map((reply, replyIndex) => (
                                  <View
                                    key={replyIndex}
                                    style={styles.replyContainer}
                                  >
                                    <View style={styles.replyLine} />
                                    {replyprofilePic[reply.residentId] !==
                                      "data:image/jpeg;base64," ? (
                                      <Image
                                        source={{
                                          uri: replyprofilePic[
                                            reply.residentId
                                          ],
                                        }}
                                        style={{
                                          width: 35,
                                          height: 35,
                                          borderRadius: 25,
                                        }}
                                      />
                                    ) : (
                                      <Image
                                        source={require("../../../assets/default-avatar.jpg")}
                                        style={{
                                          width: 35,
                                          height: 35,
                                          borderRadius: 25,
                                        }}
                                      />
                                    )}
                                    <View style={{ marginLeft: 8 }}>
                                      <CommentContainer>
                                        <UserName>{reply.userName}</UserName>
                                        <MessageText>{reply.text}</MessageText>
                                      </CommentContainer>
                                    </View>
                                    <Text
                                      style={{
                                        color: "grey",
                                        fontSize: 12,
                                        left: 8,
                                        top: -4,
                                      }}
                                    >
                                      {formatDateTime(reply.createdAt)}
                                    </Text>
                                  </View>
                                ))}
                          </>
                        )}
                      </TextSection>
                    </UserInfo>
                  </View>
                ))}
            </ScrollView>
            <View style={styles.separator} />
            <View style={styles.addCommentContainer}>
              {userprofilePic !== "data:image/jpeg;base64," ? (
                <Image
                  source={{ uri: userprofilePic }}
                  style={styles.userProfileImage}
                />
              ) : (
                <Image
                  source={require("../../../assets/default-avatar.jpg")}
                  style={styles.userProfileImage}
                />
              )}
              {showFollowers && (
                <View style={styles.suggestionsContainer}>
                  {followers.map((follower) => (
                    <TouchableOpacity
                      key={follower.id}
                      onPress={() =>
                        handleFollowerClick(follower.residentProfile.fullName)
                      }
                    >
                      <Text style={styles.suggestionText}>
                        {follower.residentProfile.fullName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={{ flex: 1 }}>
                <TextInput
                  placeholder={`add a comment as ${userFullname}`}
                  multiline={true}
                  value={commentText}
                  onChangeText={handleTextInputChange}
                  onFocus={handleTextInputFocus}
                  onBlur={handleTextInputBlur}
                  style={styles.commentInput}
                />
              </View>
              <TouchableOpacity
                onPress={addCommentToPost}
                disabled={isAddingComment}
              >
                {isAddingComment ? (
                  <ActivityIndicator size="small" color={Colors.PURPLE} />
                ) : (
                  <FontAwesome
                    name="send"
                    size={24}
                    style={[
                      styles.sendIcon,
                      { color: isTyping ? Colors.PURPLE : Colors.PLATINUM },
                    ]}
                  />
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
  flex: 1,
  backgroundColor: "transparent",
  borderCurve:30

  },
  modalContent: {
    flex: 1,
  padding: 15,

  borderTopEndRadius:20,
  borderTopStartRadius:20,

  overflow: "hidden",
  backgroundColor: 'white',
  // iOS shadow
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  // Android shadow
  elevation: 5,
  },
  modalHandle: {
    borderTopColor: Colors.GunmetalGray,
    borderRadius: 13,
    borderTopWidth: 4,
    marginTop: -10,
    width: 40,
    marginLeft: "auto",
    marginRight: "auto",
  },
  modalTitle: {
    fontSize: 19,
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
    top: "1%",
  },
  separator: {
    borderTopColor: Colors.GRAY,
    borderTopWidth: 0.5,
    marginTop: -7,
    width: 400,
    marginLeft: -20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "10%",
    marginBottom: "10%",
  },
  noCommentsContainer: {
    alignItems: "center",
    marginTop: "10%",
    marginBottom: "10%",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: "-17%",
  },
  profileImage: {
    height: 40,
    width: 40,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 20,
  },
  commentFooter: {
    flexDirection: "row",
    marginLeft: 15,
    marginTop: -5,
  },
  replyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 50,
    marginTop: 10,
  },
  replyLine: {
    width: 1,
    backgroundColor: Colors.GRAY,
    height: "100%",
    marginRight: 10,
  },
  replyContent: {
    flex: 1,
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal:20
  },
  userProfileImage: {
    height: 40,
    width: 40,
    borderRadius: 20,
    marginTop: 7,
    left: -16,
  },
  commentInput: {
    borderRadius: 20,
    padding: 7,
    marginTop: 10,
    paddingLeft: 10,
    width: 250,
  },
  sendIcon: {
    marginLeft: "5%",
  },
  replyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  suggestionsContainer: {
    position: "absolute",
    backgroundColor: "white",
    borderColor: "#ccc",
    borderWidth: 1,
    width: "50%",
    maxHeight: 150,
    zIndex: 1,
    marginLeft: 90,
    alignItems: 'center',
    borderRadius: 20
  },
  suggestionText: {
    padding: 10,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,

  },
});

export default CommentModel;
