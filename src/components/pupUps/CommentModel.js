import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  Replytext,
  ActionDialog,
  ActionContainer,
  ActionButton,
  CancelButton,
  ReactionSummary,
  ActionButtonText,
  ReactionPickerContainer,
} from "../../utils/Styles/MessageStyles";
import { encode } from "base64-arraybuffer"; // Added missing import
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Axios from "axios";
import { APP_ENV } from "../../../src/utils/BaseUrl";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const CommentModel = ({
  isVisible,
  onClose,
  postId,
  refreshPosts,
}) => {
  // State variables
  const [commentText, setCommentText] = useState("");
  const [isTyping, setIsTyping] = useState(false); // Added back missing state
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyingToUserName, setReplyingToUserName] = useState("");
  const [showReplyOverlay, setShowReplyOverlay] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [userFullname, setFullName] = useState("");
  const [userimage, setimage] = useState("");
  const [userprofilePic, setUserProfilePic] = useState(null);
  const [showReplyInput, setShowReplyInput] = useState(null); // Added back missing state
  const [replies, setReplies] = useState({}); // Added back for replies
  const [replyprofilePic, setReplyProfilePic] = useState({}); // Added back for reply profile pics
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [addingReply, setAddingReply] = useState(null);
  // Animation values
  const editInputHeight = useSharedValue(0);
  const editInputOpacity = useSharedValue(0);
  const actionDialogHeight = useSharedValue(0);
  const actionDialogOpacity = useSharedValue(1);

  const animatedEditInputStyle = useAnimatedStyle(() => ({
    height: withSpring(editInputHeight.value, { damping: 15 }),
    opacity: withTiming(editInputOpacity.value, { duration: 300 }),
  }));

  const animatedActionDialogStyle = useAnimatedStyle(() => ({
    height: withSpring(actionDialogHeight.value, { damping: 15 }),
    opacity: withTiming(actionDialogOpacity.value, { duration: 300 }),
  }));
  const getCurrentUserReaction = useCallback((comment) => {
    if (!comment.reactions || !currentUserId) return null;
    return comment.reactions.find(r => r.userId === currentUserId)?.reactionType;
  }, [currentUserId]);

  // Handle reaction icon press
  const handleReactionIconPress = (commentId, currentReaction) => {
    if (currentReaction) {
      removeReaction(commentId);
    } else {
      addReactionToComment(commentId, "heart");
    }
  };

  // Handle reaction icon long press
  const handleReactionIconLongPress = (commentId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowReactionPicker(commentId);
  };

  // Remove reaction
  const removeReaction = async (commentId) => {
    try {
      // Optimistic UI update
      setData(prevData =>
        prevData.map(comment => {
          if (comment.commentId === commentId) {
            const newReactions = comment.reactions.filter(r => r.userId !== currentUserId);
            return { ...comment, reactions: newReactions };
          }
          return comment;
        })
      );

      const userId = await AsyncStorage.getItem("userId");
      await Axios.delete(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/removeReaction/${commentId}/${userId}`,
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error removing reaction:", error);
      fetchCommentsPost(); // Revert on error
    }
  };

  // Reaction emojis mapping
  const reactionEmojis = {
    heart: '❤️',
    like: '👍',
    laugh: '😂',
    angry: '😡',
    sad: '😢'
  };

  // Get current user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setCurrentUserId(id);
    };
    getUserId();
  }, []);

  // Fetch current user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const response = await Axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`
        );
        setFullName(response.data.fullName);
        setimage(response.data.profilephoto);
      } catch (error) {
        console.error("Error getting resident profile:", error);
      }
    };
    fetchProfile();
  }, []);

  // Fetch user profile photo
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const response = await Axios.get(
          `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getprofilephoto/${userId}`,
          { responseType: "arraybuffer" }
        );
        const base64Image = encode(response.data);
        setUserProfilePic(`data:image/jpeg;base64,${base64Image}`);
      } catch (error) {
        console.error("Error getting profile photo:", error);
      }
    };
    fetchProfilePhoto();
  }, []);

  // Modal close handler
  const handleModalClose = useCallback(() => {
    onClose();
    setData([]);
    setReplyingToCommentId(null);
    setExpandedComments({});
    resetEditState();
    setShowReplyInput(null); // Reset reply inputs
  }, [onClose]);

  const handleTextInputFocus = () => {
    setIsTyping(true);
  };

  const handleTextInputBlur = () => {
    setIsTyping(false);
  };

  // Toggle comment expansion
  const toggleCommentExpansion = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Reset edit state
  const resetEditState = () => {
    setEditingComment(null);
    setEditCommentText("");
    editInputHeight.value = 0;
    editInputOpacity.value = 0;
    actionDialogHeight.value = 160;
    actionDialogOpacity.value = 1;
  };

  const cancelEdit = () => {
    resetEditState();
    setShowActionDialog(false);
  };
  const refetchCommentsPost = useCallback(async () => {
    if (!postId) return;

    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getallcomments/${postId}`
      );

      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Error getting comments:", error);
    }
  }, [postId]);

  // Fetch comments for post
  const fetchCommentsPost = useCallback(async () => {
    if (!postId) return;

    setIsLoading(true);
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getallcomments/${postId}`
      );

      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Error getting comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // Fetch comments when postId changes
  useEffect(() => {
    if (postId) fetchCommentsPost();
  }, [postId, fetchCommentsPost]);

  // Add comment to post
  const addCommentToPost = async () => {
    if (!commentText.trim()) {
      Toast.show({ type: "info", text1: "Please write a comment", visibilityTime: 3000 });
      return;
    }

    setIsAddingComment(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      const Token = await AsyncStorage.getItem("USER_ACCESS");
      await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/addcomment/${postId}/${userId}`,
        { commentText },
        { headers: { Authorization: `Bearer ${Token}` } }
      );
      Toast.show({ type: "success", text1: "Comment added successfully", visibilityTime: 3000 });
      setCommentText("");
      refetchCommentsPost();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsAddingComment(false);
    }
  };

  // Add reply to comment
 const addReplyToComment = async (commentId, text) => {
  if (!text.trim()) {
    Toast.show({ type: "info", text1: "Please write a reply", visibilityTime: 3000 });
    return;
  }

  setAddingReply(commentId); // Set the comment we're replying to
  
  try {
    const Token = await AsyncStorage.getItem("USER_ACCESS");
    const userId = await AsyncStorage.getItem("userId");
    await Axios.post(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/replytocomment/${userId}/${commentId}`,
      {
        image: userprofilePic,
        Name: userFullname,
        replyText: text
      },
      { headers: { Authorization: `Bearer ${Token}` } }
    );
    refetchCommentsPost();
    setShowReplyInput(null);
    setReplyText("");
  } catch (error) {
    console.error("Error adding reply:", error);
  } finally {
    setAddingReply(null); // Reset regardless of success or failure
  }
};

  const handleReplyButtonPress = (commentId, userName) => {
    if (showReplyInput === commentId) {
      setShowReplyInput(null);
      setShowReplyOverlay(false);
    } else {
      setShowReplyInput(commentId);
      setReplyingToCommentId(commentId);
      setReplyingToUserName(userName);
      setReplyText("");
      setShowReplyOverlay(true);
    }
  };

  const handleCloseReply = () => {
    setShowReplyInput(null);
    setShowReplyOverlay(false);
  };

  // Fetch replies for a comment
  const fetchRepliesForComment = async (commentId) => {
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getreplies/${commentId}`
      );
      if (response.data && response.data !== "No replies found for the specified comment") {
        setReplies(prevReplies => ({
          ...prevReplies,
          [commentId]: response.data,
        }));

        const profilePicPromises = response.data.map(async (reply) => {


          return {
            residentId: reply.residentId,
            profilePic: reply.userProfileImage,
          };
        });

        const profilePics = await Promise.all(profilePicPromises);
        const profilePicMap = profilePics.reduce((acc, pic) => {
          if (pic) acc[pic.residentId] = pic.profilePic;
          return acc;
        }, {});

        setReplyProfilePic(prev => ({
          ...prev,
          ...profilePicMap,
        }));
      } else {
        setReplies(prevReplies => ({
          ...prevReplies,
          [commentId]: [],
        }));
      }
    } catch (error) {
      console.error("Error while fetching replies:", error);
    }
  };

  // Format date/time
  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;

    return `${Math.floor(months / 12)}y`;
  };

  // Add reaction to comment
  const addReactionToComment = async (commentId, reactionType = "heart") => {
    try {
      // Optimistic UI update
      setData(prevData =>
        prevData.map(comment => {
          if (comment.commentId === commentId) {
            const existingIndex = comment.reactions.findIndex(r => r.userId === currentUserId);
            const newReactions = [...comment.reactions];

            if (existingIndex !== -1) {
              newReactions[existingIndex] = { ...newReactions[existingIndex], reactionType };
            } else {
              newReactions.push({ userId: currentUserId, reactionType });
            }

            return { ...comment, reactions: newReactions };
          }
          return comment;
        })
      );

      const userId = await AsyncStorage.getItem("userId");
      await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/addReactionToComment/${commentId}/${userId}/${reactionType}`,
        {},
        { headers: { "Content-Type": "application/json" } }
      );
      setShowActionDialog(false);
    } catch (error) {
      console.error("Error handling reaction:", error);
      fetchCommentsPost(); // Revert on error
    }
  };

  // Handle comment actions
  const handleCommentAction = (actionType, comment) => {
    Haptics.selectionAsync();
    setShowActionDialog(false);

    switch (actionType) {
      case 'delete':
        deleteComment(comment.commentId);
        break;
      case 'edit':
        startEditingComment(comment);
        break;
      case 'report':
        // Implement report functionality
        break;
      case 'block':
        // Implement block functionality
        break;
      default:
        break;
    }
  };

  const startEditingComment = (comment) => {
    setEditingComment(comment);
    setEditCommentText(comment.text);
    actionDialogHeight.value = 0;
    actionDialogOpacity.value = 0;

    setTimeout(() => {
      editInputHeight.value = 150;
      editInputOpacity.value = 1;
    }, 300);
  };

  const updateComment = async () => {
    if (!editCommentText.trim()) {
      Toast.show({ type: "info", text1: "Comment cannot be empty", visibilityTime: 3000 });
      return;
    }

    setIsUpdating(true);
    try {
      const Token = await AsyncStorage.getItem("USER_ACCESS");
      const userId = await AsyncStorage.getItem("userId");
      await Axios.put(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/edit/${editingComment.commentId}/${userId}`,
        { newText: editCommentText },
        { headers: { Authorization: `Bearer ${Token}` } }
      );
      Toast.show({ type: "success", text1: "Comment updated successfully", visibilityTime: 3000 });
      refetchCommentsPost();
      resetEditState();
    } catch (error) {
      console.error('Error updating comment:', error);
      Toast.show({ type: "error", text1: "Failed to update comment", visibilityTime: 3000 });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      const Token = await AsyncStorage.getItem("USER_ACCESS");
      const userId = await AsyncStorage.getItem("userId");
      await Axios.delete(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/delete/${commentId}/${userId}`,
        { headers: { Authorization: `Bearer ${Token}` } }
      );
      refetchCommentsPost();
      Toast.show({ type: 'success', text1: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Render reaction summary
  const renderReactionSummary = (reactions) => {
    if (!reactions || reactions.length === 0) return null;

    // Count reaction types
    const reactionCounts = {};
    reactions.forEach(r => {
      reactionCounts[r.reactionType] = (reactionCounts[r.reactionType] || 0) + 1;
    });

    // Find most popular reaction
    const mostPopular = Object.keys(reactionCounts).reduce((a, b) =>
      reactionCounts[a] > reactionCounts[b] ? a : b
    );

    return (
      <ReactionSummary>
        <Text style={styles.reactionEmoji}>{reactionEmojis[mostPopular]}</Text>
        <Text style={styles.reactionCount}>{reactions.length}</Text>
      </ReactionSummary>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleModalClose}
      onSwipeComplete={handleModalClose}
      swipeDirection="down"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Comments</Text>
            <View style={styles.separator} />

            {/* Comments List */}
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

              {!isLoading && data.map((comment) => {
                const currentUserReaction = getCurrentUserReaction(comment);
                const isExpanded = expandedComments[comment.commentId];
                const isSelected = selectedComment?.commentId === comment.commentId;
                const isEditing = editingComment?.commentId === comment.commentId;
                const hasReplies = parseInt(comment.numberOfReplies) > 0;
                const showReplies = isExpanded && hasReplies;

                return (
                  <React.Fragment key={comment.commentId}>
                    {showActionDialog && isSelected && (
                      <BlurView
                        intensity={100}
                        tint="light"
                        style={[styles.blurOverlay, StyleSheet.absoluteFill]}
                      />
                    )}

                    <TouchableOpacity
                      onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setSelectedComment(comment);
                        setShowActionDialog(true);
                      }}
                      activeOpacity={1}
                      style={{ zIndex: isSelected ? 2 : 0 }}
                    >
                      <UserInfo style={{ borderBottomWidth: 0 }}>
                        <UserImgWrapper>
                          <UserImg
                            source={{ uri: comment.userProfileImage }}
                            defaultSource={require("../../../assets/default-avatar.jpg")}
                          />
                        </UserImgWrapper>

                        <TextSection>
                          <View style={styles.commentHeader}>
                            {isEditing ? (
                              <Animated.View style={[styles.editCommentContainer, animatedEditInputStyle]}>
                                <TextInput
                                  value={editCommentText}
                                  onChangeText={setEditCommentText}
                                  multiline
                                  style={styles.editInput}
                                  autoFocus
                                  placeholder="Edit your comment..."
                                />
                                <View style={styles.editButtons}>
                                  <TouchableOpacity onPress={cancelEdit} disabled={isUpdating}>
                                    <Text style={styles.cancelEditButton}>Cancel</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={updateComment} disabled={isUpdating}>
                                    {isUpdating ? (
                                      <ActivityIndicator size="small" color={Colors.PURPLE} />
                                    ) : (
                                      <Text style={styles.saveEditButton}>Save</Text>
                                    )}
                                  </TouchableOpacity>
                                </View>
                              </Animated.View>
                            ) : (
                              <CommentContainer>
                                <UserInfoText>
                                  <UserName>{comment.userName}</UserName>
                                  <PostTime>{formatDateTime(comment.createdAt)}</PostTime>

                                </UserInfoText>
                                <MessageText>{comment.text}</MessageText>

                                {showReactionPicker === comment.commentId && (
                                  <ReactionPickerContainer>
                                    {Object.entries(reactionEmojis).map(([type, emoji]) => (
                                      <TouchableOpacity
                                        key={type}
                                        onPress={() => {
                                          addReactionToComment(comment.commentId, type);
                                          setShowReactionPicker(null);
                                        }}
                                        style={styles.reactionOption}
                                      >
                                        <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ReactionPickerContainer>
                                )}
                               
                              </CommentContainer>
                            )}
                          </View>

                          {/* Comment footer */}
                          {!isEditing && (
                            <View style={styles.commentFooter}>
                              <TouchableOpacity
                                onPress={() => handleReactionIconPress(comment.commentId, currentUserReaction)}
                                onLongPress={() => handleReactionIconLongPress(comment.commentId)}
                                style={styles.reactionIcon}
                              >
                                <Text style={styles.reactionIconText}>
                                  {currentUserReaction
                                    ? reactionEmojis[currentUserReaction]
                                    : <Ionicons name="heart-outline" size={20} color={Colors.LIGHT_PURPLE} />
                                  }
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() =>
                                handleReplyButtonPress(comment.commentId, comment.userName)
                              }>
                                <Replytext>Reply</Replytext>
                              </TouchableOpacity>

                              
                              {hasReplies && (
                                <TouchableOpacity
                                  style={styles.repliesCounter}
                                  onPress={() => {
                                    toggleCommentExpansion(comment.commentId);
                                    if (!replies[comment.commentId]) {
                                      fetchRepliesForComment(comment.commentId);
                                    }
                                  }}
                                >
                                  <Text style={styles.repliesText}>
                                    {parseInt(comment.numberOfReplies)} replies
                                  </Text>
                                  <FontAwesome
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={12}
                                    color={Colors.PURPLE}
                                  />
                                </TouchableOpacity>
                              )}
                               {renderReactionSummary(comment.reactions)}
                            </View>
                          )}
                          {showReplies && replies[comment.commentId] && (
                            <View style={styles.repliesContainer}>
                              {replies[comment.commentId].map((reply, index) => (
                                <View key={`${comment.commentId}-${index}`} style={styles.replyItem}>
                                  <View style={styles.replyLine} />
                                  <Image
                                    source={{ uri: replyprofilePic[reply.residentId] || require("../../../assets/default-avatar.jpg") }}
                                    style={styles.replyAvatar}
                                  />
                                  <View style={styles.replyContent}>
                                    <UserName>{reply.userName}</UserName>
                                    <MessageText>{reply.text}</MessageText>
                                    <Text style={styles.replyTime}>
                                      {formatDateTime(reply.createdAt)}
                                    </Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                          {/* Reply overlay */}
                          {showReplyOverlay && showReplyInput === comment.commentId && (
                            <TouchableWithoutFeedback onPress={handleCloseReply}>
                              <View style={styles.replyOverlay} />
                            </TouchableWithoutFeedback>
                          )}

                          {/* Reply input */}
                        {showReplyInput === comment.commentId && (
  <View style={styles.replyInputContainer}>
    <Image
      source={{ uri: userprofilePic }}
      defaultSource={require("../../../assets/default-avatar.jpg")}
      style={styles.smallProfileImage}
    />
    <TextInput
      style={styles.replyInput}
      placeholder={`Reply to ${comment.userName}...`}
      value={replyText}
      onChangeText={setReplyText}
      autoFocus
      multiline
      editable={addingReply !== comment.commentId}
    />
    <TouchableOpacity
      onPress={() => addReplyToComment(comment.commentId, replyText)}
      style={styles.sendReplyButton}
      disabled={!replyText.trim() || addingReply === comment.commentId}
    >
      {addingReply === comment.commentId ? (
        <ActivityIndicator size="small" color={Colors.PURPLE} />
      ) : (
        <FontAwesome
          name="send"
          size={18}
          color={replyText.trim() ? Colors.PURPLE : Colors.GRAY}
        />
      )}
    </TouchableOpacity>
  </View>
)}

                          {/* Replies section */}

                        </TextSection>
                      </UserInfo>
                    </TouchableOpacity>

                    {/* Action dialog */}
                    {showActionDialog && isSelected && !isEditing && (
                      <ActionDialog
                        style={[
                          animatedActionDialogStyle,
                          { zIndex: 3 }
                        ]}
                      >
                        {/* ACTION BUTTONS ONLY */}
                        <ActionContainer>
                          {selectedComment.residentId === currentUserId ? (
                            <>
                              <ActionButton

                                onPress={() => handleCommentAction("edit", selectedComment)}
                              >

                                <ActionButtonText>Edit</ActionButtonText>

                              </ActionButton>
                              <ActionButton

                                onPress={() => handleCommentAction("delete", selectedComment)}
                              >

                                 <ActionButtonText>Delete </ActionButtonText>
                              </ActionButton>
                            </>
                          ) : (
                            <>
                              <ActionButton
                                onPress={() => handleCommentAction("report", selectedComment)}
                              >

                                <ActionButtonText>Report</ActionButtonText>
                              </ActionButton>
                              <ActionButton
                                onPress={() => handleCommentAction("block", selectedComment)}
                              >

                                <ActionButtonText>Block</ActionButtonText>
                              </ActionButton>
                            </>
                          )}
                          <CancelButton
                            onPress={() => setShowActionDialog(false)}
                          >

                            <ActionButtonText>Cancel</ActionButtonText>
                          </CancelButton>
                        </ActionContainer>
                      </ActionDialog>
                    )}
                  </React.Fragment>
                );
              })}
            </ScrollView>

            {/* Add comment section */}
          
          </ScrollView>
            <View style={styles.addCommentContainer}>
              <Image
                source={{ uri: userprofilePic }}
                defaultSource={require("../../../assets/default-avatar.jpg")}
                style={styles.userProfileImage}
              />
              <TextInput
                placeholder={`Add a comment as ${userFullname}`}
                multiline
                value={commentText}
                onChangeText={setCommentText}
                onFocus={handleTextInputFocus}
                onBlur={handleTextInputBlur}
                style={styles.commentInput}
              />
              <TouchableOpacity onPress={addCommentToPost} disabled={isAddingComment}>
                {isAddingComment ? (
                  <ActivityIndicator size="small" color={Colors.PURPLE} />
                ) : (
                  <FontAwesome
                    name="send"
                    size={24}
                    color={isTyping ? Colors.PURPLE : Colors.PLATINUM}
                  />
                )}
              </TouchableOpacity>
            </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  reactionIcon: {
    marginLeft: 10,
    marginRight: 4,
  },
  reactionIconText: {
    fontSize: 16,
  },
  reactionPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.WHITE,
    borderRadius: 25,
    padding: 10,
    marginTop: 5,
    marginLeft: 50, // Align with comment text
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative', // Changed from absolute to relative
    zIndex: 10,
  },
  reactionOption: {
    padding: 5,
  },
  reactionOptionEmoji: {
    fontSize: 20,
  },

  actionButtonText: {
    fontSize: 12,
    fontWeight: 400,

    color: Colors.WHITE,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: Colors.GRAY,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  separator: {
    borderTopColor: Colors.GRAY,
    borderTopWidth: 0.5,
    marginVertical: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  commentFooter: {
    flexDirection: "row",
    marginLeft: 1,
    marginTop: -5,
    verticalAlign:'middle'
  },
  repliesCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  repliesText: {
    color: Colors.PURPLE,
    marginRight: 4,
    fontSize: 12,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 8,
    paddingRight: 15,
    zIndex: 10,
  },
  smallProfileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  replyInput: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  sendReplyButton: {
    marginLeft: 10,
    padding: 5,
  },
  repliesContainer: {
    marginLeft: -50,
    marginTop: 10,
  },
  replyItem: {
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
    position: 'absolute',
    left: 25,
    top: 0,
    bottom: 0,
  },
  replyAvatar: {
    width: 35,
    height: 35,
    borderRadius: 25,
    marginRight: 10,
  },
  replyContent: {
    flex: 1,
  },
  replyTime: {
    color: "grey",
    fontSize: 12,
    marginTop: 2,
  },
  reactionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LIGHT_PURPLE_OPACITY,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 2,
  },
  reactionCount: {
    fontSize: 12,
    color: Colors.DARK_GRAY,
  },
  actionDialog: {
    marginLeft: 10,
    backgroundColor: Colors.WHITE,
    width: 220,
    borderRadius: 20,
    height: 100,
    borderWidth: 1,
    borderColor: Colors.LIGHT_PURPLE,
    zIndex: 10,
  },
  reactionContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 5,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  reactionButton: {
    padding: 5,
    borderRadius: 50,
    backgroundColor: Colors.WHITE,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  actionContainer: {
    flexDirection: "column",
    justifyContent: "space-evenly",
    alignItems: "center",

  },
  actionButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    justifyContent: "center",
    borderBottomWidth: 5,
    borderColor: Colors.WHITE,
    alignItems: "center",
    width: '100%'
  },
  cancelButton: {

    borderTopWidth: 5,
    borderColor: Colors.WHITE,
    backgroundColor: Colors.RED,
    justifyContent: "center",
    alignItems: "center",
    width: '100%'
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.LIGHT_GRAY,
  },
  userProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#cccdcf",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    minHeight: 40,
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
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  replyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  editCommentContainer: {
    backgroundColor: "#ccc",
    borderRadius: 30,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Colors.LIGHT_PURPLE,
    width: 280,
    overflow: 'hidden',
  },
  editInput: {
    minHeight: 80,
    fontSize: 16,
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelEditButton: {
    color: Colors.RED,
    fontWeight: 'bold',
    marginRight: 15,
    padding: 5,
  },
  saveEditButton: {
    color: Colors.PURPLE,
    fontWeight: 'bold',
    padding: 5,
  },
});

export default CommentModel;