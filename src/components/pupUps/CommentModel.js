import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
  FlatList,
  Modal,
  TextInput,
} from "react-native";
import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from 'prop-types';
import { FontAwesome } from "@expo/vector-icons";
import Ionicons from 'react-native-vector-icons/Ionicons';

import Colors from "../../../assets/Colors";
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
import { PostService } from '../../services/post.service';

const CommentModel = ({
  isVisible,
  onClose,
  postId,
  refreshPosts,
  onCommentsCountChange,
}) => {
  // State variables
  const [commentText, setCommentText] = useState("");
  const [isTyping, setIsTyping] = useState(false); // Added back missing state
  const [pagedData, setPagedData] = useState({ content: [], last: true, number: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [replyText, setReplyText] = useState("");
  // Removed unused reply tracking states
  const [showReplyOverlay, setShowReplyOverlay] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [userFullname, setFullName] = useState("");
  const [userprofilePic, setUserProfilePic] = useState(null);
  const [showReplyInput, setShowReplyInput] = useState(null); // Added back missing state
  const [replies, setReplies] = useState({}); // Added back for replies
  const [replyprofilePic, setReplyProfilePic] = useState({}); // Added back for reply profile pics
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [addingReply, setAddingReply] = useState(null);

    const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [isFetchingMentions, setIsFetchingMentions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState([]); // <-- Tracks selected users {id, name}
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const commentInputRef = useRef(null);
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
  const handleReactionIconPress = (commentId, currentUserReaction) => {
    if (currentUserReaction) {
      // User already reacted, remove their reaction
      addReactionToComment(commentId, currentUserReaction);
    } else {
      // User has not reacted, add a heart
      addReactionToComment(commentId, "heart");
    }
  };

  useEffect(() => {
    if (mentionQuery) {
      const handler = setTimeout(() => {
        fetchMentionUsers(mentionQuery);
      }, 500); // Wait 500ms after user stops typing

      return () => {
        clearTimeout(handler);
      };
    } else {
      setShowSuggestions(false);
      setMentionSuggestions([]);
    }
  }, [mentionQuery]);

  const fetchMentionUsers = async (query) => {
    setIsFetchingMentions(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/users/${userId}/mention-list?query=${query}`
      );
      const suggestions = response.data.map(user => ({
        id: user.id,
        name: user.fullName,
        avatar: user.profilePhotoUrl
      }));
      setMentionSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching mention users:", error);
      setMentionSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsFetchingMentions(false);
    }
  };

   const handleCommentChange = (text) => {
    setCommentText(text);

    // --- Logic to remove mention ID if name is deleted/edited ---
    const currentlyMentioned = mentionedUsers.filter(user =>
      text.includes(`@${user.name}`)
    );
    if (currentlyMentioned.length !== mentionedUsers.length) {
      setMentionedUsers(currentlyMentioned);
    }
    // --- End of deletion logic ---

    const words = text.split(' ');
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.substring(1));
    } else {
      setMentionQuery('');
    }
  };

  const onSuggestionPress = (user) => {
    // Add the selected user to our tracking state
    setMentionedUsers(prev => [...prev, { id: user.id, name: user.name }]);

    const words = commentText.split(' ');
    words.pop();
    const newText = [...words, `@${user.name}`].join(' ') + ' ';

    setCommentText(newText);
    setMentionQuery('');
    setShowSuggestions(false);
    commentInputRef.current?.focus();
  };
  // Handle reaction icon long press
  const handleReactionIconLongPress = (commentId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowReactionPicker(commentId);
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
    if (isVisible) {
      const fetchProfile = async () => {
        try {
          const userId = await AsyncStorage.getItem("userId");
          const response = await Axios.get(
            `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`
          );
          setFullName(response.data.fullName);
        } catch (error) {
          console.error("Error getting resident profile:", error);
        }
      };
      fetchProfile();
    }
  }, [isVisible]);

  // Fetch user profile photo
  useEffect(() => {
    if (isVisible) {
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
    }
  }, [isVisible]);

  // Modal close handler
  const handleModalClose = useCallback(() => {
    onClose();
    setPagedData({ content: [], last: true, number: 0, totalPages: 1 });
    setExpandedComments({});
    resetEditState();
    setShowReplyInput(null); // Reset reply inputs
  }, [onClose]);

  // Removed unused focus/blur handlers

  // Toggle comment expansion
  const toggleCommentExpansion = (commentId) => {
    console.log('[Comments] toggleCommentExpansion', { commentId, wasExpanded: !!expandedComments[commentId] });
    fetchRepliesForComment(commentId);
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
    await fetchCommentsPost(0);
  }, [fetchCommentsPost]);

  // Fetch comments for post
  const fetchCommentsPost = useCallback(async (page = 0) => {
    if (!postId) return;
    if (page === 0) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }
    try {
      const result = await PostService.getAllCommentsPaged(postId, page, 10);
      if (result && Array.isArray(result.content)) {
        setPagedData(prev => page === 0
          ? result
          : {
              ...result,
              content: [...prev.content, ...result.content.filter(c => !prev.content.some(pc => pc.commentId === c.commentId))]
            }
        );
      }
    } catch (error) {
      console.error("Error getting paged comments:", error);
    } finally {
      if (page === 0) {
        setIsLoading(false);
      } else {
        setIsFetchingMore(false);
      }
    }
  }, [postId]);

  // Fetch comments when postId or modal visibility changes
  useEffect(() => {
    if (isVisible && postId) fetchCommentsPost(0);
  }, [isVisible, postId, fetchCommentsPost]);

  // Add comment to post
 const addCommentToPost = async () => {
    if (!commentText.trim()) {
      Toast.show({ type: "info", text1: "Please write a comment" });
      return;
    }
    setIsAddingComment(true);
    // --- Optimistic UI: Add temp comment ---
    const tempId = `temp-${Date.now()}`;
    const tempComment = {
      commentId: tempId,
      userName: userFullname,
      userProfileImage: userprofilePic,
      text: commentText,
      createdAt: new Date().toISOString(),
      reactions: [],
      numberOfReplies: 0,
      residentId: currentUserId,
      pending: true,
    };
    setPagedData(prev => ({
      ...prev,
      content: [tempComment, ...prev.content],
    }));
    setCommentText("");
    setMentionedUsers([]);
    let success = false;
    try {
      const userId = await AsyncStorage.getItem("userId");
      const Token = await AsyncStorage.getItem("USER_ACCESS");
      const mentionedUserIds = mentionedUsers.map(u => u.id);
      await PostService.addComment(postId, userId, tempComment.text, mentionedUserIds, Token);
      Toast.show({ type: "success", text1: "Comment added" });
      success = true;
      // Option 1: Refetch all comments (ensures correct order and data)
      refetchCommentsPost();
      // Notify parent to refresh post list so comment count updates
      if (typeof refreshPosts === 'function') {
        refreshPosts();
      }
      if (typeof onCommentsCountChange === 'function' && postId) {
        onCommentsCountChange(postId, 1);
      }
      // Option 2: If API returns the new comment, replace temp with real one here
    } catch (error) {
      console.error("Error adding comment:", error);
      Toast.show({ type: "error", text1: "Failed to add comment" });
      // Remove temp comment on failure
      setPagedData(prev => ({
        ...prev,
        content: prev.content.filter(c => c.commentId !== tempId),
      }));
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
    setAddingReply(commentId);
    try {
      const Token = await AsyncStorage.getItem("USER_ACCESS");
      const userId = await AsyncStorage.getItem("userId");
      await PostService.addReplyToComment(userId, commentId, postId, userprofilePic, userFullname, text, Token);

      // Optimistically update replies state
      const newReply = {
        residentId: userId,
        userName: userFullname,
        userProfileImage: userprofilePic,
        text,
        createdAt: new Date().toISOString(),
      };
      setReplies(prev => ({
        ...prev,
        [commentId]: prev[commentId] ? [...prev[commentId], newReply] : [newReply],
      }));

      // Optimistically increment numberOfReplies in pagedData
      setPagedData(prev => ({
        ...prev,
        content: prev.content.map(comment =>
          comment.commentId === commentId
            ? { ...comment, numberOfReplies: (parseInt(comment.numberOfReplies) || 0) + 1 }
            : comment
        ),
      }));

      setShowReplyInput(null);
      setReplyText("");
    } catch (error) {
      console.error("Error adding reply:", error);
    } finally {
      setAddingReply(null);
    }
  };

  const handleReplyButtonPress = (commentId) => {
    if (showReplyInput === commentId) {
      setShowReplyInput(null);
      setShowReplyOverlay(false);
    } else {
      setShowReplyInput(commentId);
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
      const repliesData = await PostService.getReplies(commentId);
      console.log('[Comments] fetchRepliesForComment: fetched', { commentId, count: Array.isArray(repliesData) ? repliesData.length : 0 });
      if (repliesData && repliesData !== "No replies found for the specified comment") {
        setReplies(prevReplies => ({
          ...prevReplies,
          [commentId]: repliesData,
        }));
        const profilePicPromises = repliesData.map(async (reply) => {
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
        console.log('[Comments] fetchRepliesForComment: profile pics mapped', { keys: Object.keys(profilePicMap).length });
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
    let diffMs = now - date;

    // Clamp negative values to zero
    if (diffMs < 0) diffMs = 0;

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 1) return "just now";
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
    setPagedData(prevData => ({
      ...prevData,
      content: prevData.content.map(comment => {
        if (comment.commentId === commentId) {
          // Find if the user already reacted
          const existingIndex = comment.reactions.findIndex(r => r.userId === currentUserId);
          let newReactions = [...comment.reactions];
          if (existingIndex !== -1) {
            if (newReactions[existingIndex].reactionType === reactionType) {
              // Remove reaction if same type
              newReactions.splice(existingIndex, 1);
            } else {
              // Update reaction type
              newReactions[existingIndex] = { ...newReactions[existingIndex], reactionType };
            }
          } else {
            // Add new reaction
            newReactions.push({ userId: currentUserId, reactionType });
          }
          return { ...comment, reactions: newReactions };
        }
        return comment;
      })
    }));

    // Call backend (no need to refetch)
    try {
      const userId = await AsyncStorage.getItem("userId");
      await PostService.addReactionToComment(commentId, userId, reactionType);
      setShowActionDialog(false);
    } catch (error) {
      // Optionally: revert optimistic update or show error
      console.error("Error handling reaction:", error);
      // Optionally, you could refetch here if you want to revert on error
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
      await PostService.editComment(editingComment.commentId, userId, editCommentText, Token);
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
      await PostService.deleteComment(commentId, userId, postId, Token);
      refetchCommentsPost();
      // Notify parent to refresh post list so comment count updates
      if (typeof refreshPosts === 'function') {
        refreshPosts();
      }
      if (typeof onCommentsCountChange === 'function' && postId) {
        onCommentsCountChange(postId, -1);
      }
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

    // Sort reaction types by count (descending)
    const sortedReactions = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3

    return (
      <View style={styles.reactionSummaryFloating}>
        {sortedReactions.map(([type, count]) => (
          <View key={type} style={styles.reactionPill}>
            <Text style={styles.reactionEmoji}>{reactionEmojis[type]}</Text>
            <Text style={styles.reactionCount}>{count}</Text>
          </View>
        ))}
      </View>
    );
  };
const renderSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      {isFetchingMentions ? (
        <ActivityIndicator style={{ padding: 10 }} color={Colors.PURPLE} />
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled">
          {mentionSuggestions.map(user => (
            <TouchableOpacity
              key={user.id}
              style={styles.suggestionItem}
              onPress={() => onSuggestionPress(user)}
            >
              <Image source={{ uri: user.avatar }} style={styles.suggestionAvatar} />
              <Text>{user.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );



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
          {/* Header and separator */}
          <View>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Comments</Text>
            <View style={styles.separator} />
          </View>

          {/* Comments List - FlatList only, no parent ScrollView */}
          <FlatList
            data={Array.from(new Map(pagedData.content.map(c => [c.commentId, c])).values())}
            renderItem={({ item: comment }) => {
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

                    {/* Floating reaction summary (top 3) */}
                    <View style={{ position: 'relative' }}>
                      {renderReactionSummary(comment.reactions)}
                    </View>

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
                                {/* Reaction summary is now floating, not inside the container */}
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
                                onPress={() => handleReactionIconPress(comment.commentId, getCurrentUserReaction(comment))}
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
                                handleReplyButtonPress(comment.commentId)
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
                              
                            </View>
                          )}
                          {showReplies && replies[comment.commentId] && (
                            <View style={styles.repliesContainer}>
                              {replies[comment.commentId].map((reply, index) => {
                                const avatarUri = replyprofilePic[reply.residentId];
                                const replyAvatarSource = avatarUri ? { uri: avatarUri } : require("../../../assets/default-avatar.jpg");
                                return (
                                <View key={`${comment.commentId}-${index}`} style={styles.replyItem}>
                                  <View style={styles.replyLine} />
                                  <Image
                                    source={replyAvatarSource}
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
                              );})}
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
              }}
              keyExtractor={item => item.commentId}
              onEndReached={() => {
                if (!pagedData.last && !isFetchingMore) {
                  fetchCommentsPost(pagedData.number + 1);
                }
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingMore ? (
                  <View style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color={Colors.PURPLE} />
                  </View>
                ) : null
              }
              ListEmptyComponent={!isLoading && (
                <View style={styles.noCommentsContainer}>
                  <Text>No comments yet</Text>
                </View>
              )}
            />

            {/* --- Mention Suggestions List --- */}
        {showSuggestions && mentionSuggestions.length > 0 && renderSuggestions()}

          {/* Add comment section */}
          <View style={styles.addCommentContainer}>
            <Image
              source={{ uri: userprofilePic }}
              defaultSource={require("../../../assets/default-avatar.jpg")}
              style={styles.userProfileImage}
            />
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder={`Add a comment as ${userFullname}`}
              multiline
              value={commentText}
              onChangeText={handleCommentChange}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
            />
            <TouchableOpacity onPress={addCommentToPost} disabled={isAddingComment}>
              {isAddingComment ? (
                <ActivityIndicator size="small" color={Colors.PURPLE} />
              ) : (
                <FontAwesome
                  name="send"
                  size={24}
                  color={isTyping || commentText ? Colors.PURPLE : Colors.PLATINUM}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

CommentModel.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  refreshPosts: PropTypes.func,
  onCommentsCountChange: PropTypes.func,
};

const styles = StyleSheet.create({
   suggestionsContainer: {
    maxHeight: 150,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    width:200,
    left:50,
    marginBottom: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 12,
  },
  suggestionName: {
      fontSize: 15,
      fontWeight: '500',
  },
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
  reactionSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LIGHT_PURPLE_OPACITY,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,

    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
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
  reactionSummaryFloating: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#B39DDB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default CommentModel;