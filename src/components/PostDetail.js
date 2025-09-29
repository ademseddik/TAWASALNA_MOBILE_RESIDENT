import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, Image, ActivityIndicator, TouchableOpacity, Modal, StyleSheet,
    ScrollView, TextInput, TouchableWithoutFeedback, Animated, FlatList, Dimensions,
    SafeAreaView
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { encode } from "base64-arraybuffer";
import { EvilIcons, Feather, Entypo, FontAwesome } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as Haptics from 'expo-haptics';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import ImageViewing from 'react-native-image-viewing';

// --- PLEASE VERIFY THESE IMPORT PATHS ---
// The error is most likely here. Adjust the '../' or './' to match your folder structure.
import { APP_ENV } from '../utils/BaseUrl';
import Colors from '../../assets/Colors';
import {
    UserInfo, UserImgWrapper, UserImg, UserInfoText, UserName, PostTime,
    MessageText, TextSection, CommentContainer, Replytext, ActionDialog,
    ActionContainer, ActionButton, CancelButton, ReactionSummary, ActionButtonText,
    ReactionPickerContainer
} from '../utils/Styles/MessageStyles';
import PostOptionsModel from './pupUps/PostOptionsModel';
import SendModel from './pupUps/SendModel';
import ShareModel from './pupUps/ShareModel';
import { PostService, addReactionToPost, dislikePost } from '../services/post.service';
// --- END OF PATHS TO VERIFY ---


const PostDetail = ({ route }) => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { postId, highlightCommentId } = route.params;
    const commentInputRef = useRef(null); // Fix for 'this.commentInputRef'
    const replyInputRef = useRef(null);
    const commentsFlatListRef = useRef(null);

    // --- STATE MANAGEMENT ---
    const [post, setPost] = useState(null);
    const [pagedData, setPagedData] = useState({ content: [], last: true, number: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [imageUris, setImageUris] = useState([]);
    const [isFetchingImages, setIsFetchingImages] = useState(false);
    const [userId, setUserId] = useState(null);
    const [userFullname, setFullName] = useState("");
    const [userprofilePic, setUserProfilePic] = useState(null);
    const [showPostReactionDialog, setShowPostReactionDialog] = useState(false);
    const [isOptionsPostModalVisible, setOptionsPostModalVisible] = useState(false);
    const [isSendModalVisible, setSendModalVisible] = useState(false);
    const [isShareModalVisible, setShareModalVisible] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [expandedComments, setExpandedComments] = useState({});
    const [replies, setReplies] = useState({});
    const [showReplyInput, setShowReplyInput] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [addingReply, setAddingReply] = useState(null);
    const [selectedComment, setSelectedComment] = useState(null);
    const [showCommentActionDialog, setShowCommentActionDialog] = useState(false);
    const [editingComment, setEditingComment] = useState(null);
    const [editCommentText, setEditCommentText] = useState("");
    const [isUpdatingComment, setIsUpdatingComment] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [replyprofilePic, setReplyProfilePic] = useState({});
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [isFetchingMentions, setIsFetchingMentions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionedUsers, setMentionedUsers] = useState([]);
    const [showReplyOverlay, setShowReplyOverlay] = useState(false);
    const [replyingToCommentId, setReplyingToCommentId] = useState(null);
    const [replyingToUserName, setReplyingToUserName] = useState("");
    // --- REACTION STATE (must be at top level) ---
    const [localReactions, setLocalReactions] = useState([]);
    const [localUserReaction, setLocalUserReaction] = useState(null);
    const [isReacting, setIsReacting] = useState(false);
    const [showReactionDialog, setShowReactionDialog] = useState(false);
    // --- Image viewer state ---
    const [modalVisible, setModalVisible] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [activeImage, setActiveImage] = useState(0);
    const screenWidth = Dimensions.get('window').width;
    const flatListRef = useRef(null);

    // --- PostCard-style reaction handler ---
    const handleReaction = async (reactionType) => {
        if (isReacting || !userId) return;
        setIsReacting(true);
        const previousReactions = [...localReactions];
        const previousUserReaction = localUserReaction;
        try {
            // Optimistic update
            if (localUserReaction === reactionType) {
                setLocalReactions(prev => prev.filter(r => r.userId !== userId));
                setLocalUserReaction(null);
                await dislikePost(post.postId, userId);
            } else {
                setLocalReactions(prev => [
                    ...prev.filter(r => r.userId !== userId),
                    { userId, reactionType }
                ]);
                setLocalUserReaction(reactionType);
                await addReactionToPost(post.postId, userId, reactionType);
            }
        } catch (err) {
            setLocalReactions(previousReactions);
            setLocalUserReaction(previousUserReaction);
        } finally {
            setIsReacting(false);
        }
    };
    
    const highlightAnim = useRef(new Animated.Value(0)).current;
    const editInputHeight = useSharedValue(0);
    const editInputOpacity = useSharedValue(0);
    const actionDialogHeight = useSharedValue(0);
    const actionDialogOpacity = useSharedValue(1);
    
    const reactionEmojis = {
        heart: '❤️',
        like: '👍',
        laugh: '😂',
        angry: '😡',
        sad: '😢',
    };

    const animatedEditInputStyle = useAnimatedStyle(() => ({
        height: withSpring(editInputHeight.value, { damping: 15 }),
        opacity: withTiming(editInputOpacity.value, { duration: 300 }),
    }));

    const animatedActionDialogStyle = useAnimatedStyle(() => ({
        height: withSpring(actionDialogHeight.value, { damping: 15 }),
        opacity: withTiming(actionDialogOpacity.value, { duration: 300 }),
    }));

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const currentUserId = await AsyncStorage.getItem("userId");
            setUserId(currentUserId);
            // --- NEW API CALL ONLY ---
            const postRes = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getonePost/${postId}`);
            setPost(postRes.data);
            // Use photos array directly for images
            if (postRes.data.photos && postRes.data.photos.length > 0) {
                setImageUris(postRes.data.photos);
            } else if (postRes.data.postImage) {
                setImageUris([postRes.data.postImage]);
            } else {
                setImageUris([]);
            }
            await fetchCommentsPost(0);
        } catch (error) {
            console.error("Error fetching post details:", error);
        } finally {
            setLoading(false);
        }
    }, [postId]);

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

    const refetchCommentsPost = useCallback(async () => {
        await fetchCommentsPost(0);
    }, [fetchCommentsPost]);

    const fetchPostImage = async (photos) => {
        setIsFetchingImages(true);
        try {
            const photoPromises = photos.map(async (photoUrl) => {
                try {
                    const response = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/images?fileUrl=${encodeURIComponent(photoUrl)}`, { responseType: "arraybuffer" });
                    return `data:image/jpeg;base64,${encode(response.data)}`;
                } catch { return null; }
            });
            const results = await Promise.all(photoPromises);
            setImageUris(results.filter(Boolean));
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setIsFetchingImages(false);
        }
    };

    const fetchRepliesForComment = async (commentId) => {
        try {
            const repliesData = await PostService.getReplies(commentId);
            console.log("Replies data received:", repliesData); // Debug log
            
            if (repliesData && repliesData !== "No replies found for the specified comment") {
                setReplies(prevReplies => ({
                    ...prevReplies,
                    [commentId]: repliesData,
                }));
                
                // Create a map of profile pictures, ensuring they are strings
                const profilePicMap = {};
                repliesData.forEach((reply) => {
                    console.log("Processing reply:", reply); // Debug log
                    
                    // Check for different possible field names for profile image
                    const profileImageField = reply.userProfileImage || reply.profilePhoto || reply.profilephoto || reply.image;
                    console.log("Profile image type:", typeof profileImageField, "Value:", profileImageField); // Debug log
                    
                    if (reply.residentId && profileImageField) {
                        // Handle different data types
                        let profilePic;
                        if (typeof profileImageField === 'string') {
                            profilePic = profileImageField;
                        } else if (typeof profileImageField === 'number') {
                            // If it's a number, it might be an ID that needs to be converted to a URL
                            console.log("Profile image is a number, skipping for now:", profileImageField);
                            return; // Skip this one for now
                        } else {
                            profilePic = String(profileImageField);
                        }
                        
                        // Only add if it's a valid URL or we'll use default avatar
                        if (profilePic && profilePic !== 'null' && profilePic !== 'undefined' && profilePic.trim() !== '') {
                            profilePicMap[reply.residentId] = profilePic;
                            console.log("Added profile pic for", reply.residentId, ":", profilePic); // Debug log
                        }
                    }
                });
                
                console.log("Final profile pic map:", profilePicMap); // Debug log
                
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

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Function to scroll to highlighted comment
    const scrollToHighlightedComment = useCallback(() => {
        if (highlightCommentId && commentsFlatListRef.current && pagedData.content.length > 0) {
            const commentIndex = pagedData.content.findIndex(comment => comment.commentId === highlightCommentId);
            if (commentIndex !== -1) {
                // Add a small delay to ensure the FlatList is fully rendered
                setTimeout(() => {
                    try {
                        commentsFlatListRef.current?.scrollToIndex({
                            index: commentIndex,
                            animated: true,
                            viewPosition: 0.3 // Position the comment 30% from the top
                        });
                    } catch (error) {
                        console.log('Error scrolling to comment:', error);
                        // Fallback: scroll to end if index is out of bounds
                        commentsFlatListRef.current?.scrollToEnd({ animated: true });
                    }
                }, 500);
            }
        }
    }, [highlightCommentId, pagedData.content]);

    useEffect(() => {
        if (highlightCommentId && !loading) {
            // Start the highlight animation
            Animated.sequence([
                Animated.timing(highlightAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
                Animated.delay(2000),
                Animated.timing(highlightAnim, { toValue: 0, duration: 500, useNativeDriver: false })
            ]).start();
            
            // Scroll to the highlighted comment
            scrollToHighlightedComment();
        }
    }, [highlightCommentId, loading, scrollToHighlightedComment]);

    useEffect(() => {
        if (mentionQuery) {
            const handler = setTimeout(() => {
                fetchMentionUsers(mentionQuery);
            }, 500);

            return () => {
                clearTimeout(handler);
            };
        } else {
            setShowSuggestions(false);
            setMentionSuggestions([]);
        }
    }, [mentionQuery]);

    useEffect(() => {
        if (post && userId) {
            setLocalReactions(post.reactions || []);
            const found = (post.reactions || []).find(r => r.userId === userId);
            setLocalUserReaction(found ? found.reactionType : null);
        }
    }, [post, userId]);

    const formatDateTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        let diffMs = now - date;

        if (diffMs < 0) diffMs = 0;

        const seconds = Math.floor(diffMs / 1000);
        if (seconds < 1) return t('just now');
        if (seconds < 60) return `${seconds}${t('s')}`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}${t('m')}`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}${t('h')}`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}${t('d')}`;

        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}${t('w')}`;

        const months = Math.floor(days / 30);
        if (months < 12) return `${months}${t('mo')}`;

        return `${Math.floor(months / 12)}${t('y')}`;
    };

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

        const currentlyMentioned = mentionedUsers.filter(user =>
            text.includes(`@${user.name}`)
        );
        if (currentlyMentioned.length !== mentionedUsers.length) {
            setMentionedUsers(currentlyMentioned);
        }

        const words = text.split(' ');
        const lastWord = words[words.length - 1];
        if (lastWord.startsWith('@')) {
            setMentionQuery(lastWord.substring(1));
        } else {
            setMentionQuery('');
        }
    };

    const onSuggestionPress = (user) => {
        setMentionedUsers(prev => [...prev, { id: user.id, name: user.name }]);

        const words = commentText.split(' ');
        words.pop();
        const newText = [...words, `@${user.name}`].join(' ') + ' ';

        setCommentText(newText);
        setMentionQuery('');
        setShowSuggestions(false);
        commentInputRef.current?.focus();
    };

    // All your handler functions like handleAddReactionToPost, handleAddCommentToPost etc. go here...
    // They are correct as per your code.
    
    const handleAddCommentToPost = async () => {
        if (!commentText.trim()) {
            Toast.show({ type: "info", text1: t("Please write a comment") });
            return;
        }
        setIsAddingComment(true);
        const tempId = `temp-${Date.now()}`;
        const tempComment = {
            commentId: tempId,
            userName: userFullname,
            userProfileImage: userprofilePic,
            text: commentText,
            createdAt: new Date().toISOString(),
            reactions: [],
            numberOfReplies: 0,
            residentId: userId,
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
            const Token = await AsyncStorage.getItem("USER_ACCESS");
            const mentionedUserIds = mentionedUsers.map(u => u.id);
            await PostService.addComment(postId, userId, tempComment.text, mentionedUserIds, Token);
            Toast.show({ type: "success", text1: t("Comment added") });
            success = true;
            refetchCommentsPost();
        } catch (error) {
            console.error("Error adding comment:", error);
            Toast.show({ type: "error", text1: t("Failed to add comment") });
            setPagedData(prev => ({
                ...prev,
                content: prev.content.filter(c => c.commentId !== tempId),
            }));
        } finally {
            setIsAddingComment(false);
        }
    };
    
    const getCurrentUserReaction = useCallback((comment) => {
        if (!comment.reactions || !userId) return null;
        return comment.reactions.find(r => r.userId === userId)?.reactionType;
    }, [userId]);

    const handleReactionIconPress = (commentId, currentUserReaction) => {
        if (currentUserReaction) {
            addReactionToComment(commentId, currentUserReaction);
        } else {
            addReactionToComment(commentId, "heart");
        }
    };

    const handleReactionIconLongPress = (commentId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowReactionPicker(commentId);
    };

    const addReactionToComment = async (commentId, reactionType = "heart") => {
        setPagedData(prevData => ({
            ...prevData,
            content: prevData.content.map(comment => {
                if (comment.commentId === commentId) {
                    const existingIndex = comment.reactions.findIndex(r => r.userId === userId);
                    let newReactions = [...comment.reactions];
                    if (existingIndex !== -1) {
                        if (newReactions[existingIndex].reactionType === reactionType) {
                            newReactions.splice(existingIndex, 1);
                        } else {
                            newReactions[existingIndex] = { ...newReactions[existingIndex], reactionType };
                        }
                    } else {
                        newReactions.push({ userId: userId, reactionType });
                    }
                    return { ...comment, reactions: newReactions };
                }
                return comment;
            })
        }));

        try {
            await PostService.addReactionToComment(commentId, userId, reactionType);
            setShowCommentActionDialog(false);
        } catch (error) {
            console.error("Error handling reaction:", error);
        }
    };

    const toggleCommentExpansion = (commentId) => {
        fetchRepliesForComment(commentId);
        setExpandedComments(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const resetEditState = () => {
        setEditingComment(null);
        setEditCommentText("");
        editInputHeight.value = 0;
        editInputOpacity.value = 0;
        actionDialogHeight.value = 100;
        actionDialogOpacity.value = 1;
    };

    // Initialize action dialog height on mount
    useEffect(() => {
        actionDialogHeight.value = 100;
        actionDialogOpacity.value = 1;
    }, []);



    const cancelEdit = () => {
        resetEditState();
        setShowCommentActionDialog(false);
    };

    const handleCommentAction = (actionType, comment) => {
        Haptics.selectionAsync();
        setShowCommentActionDialog(false);

        switch (actionType) {
            case 'delete':
                deleteComment(comment.commentId);
                break;
            case 'edit':
                startEditingComment(comment);
                break;
            case 'report':
                break;
            case 'block':
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
            Toast.show({ type: "info", text1: t("Comment cannot be empty"), visibilityTime: 3000 });
            return;
        }
        setIsUpdatingComment(true);
        try {
            const Token = await AsyncStorage.getItem("USER_ACCESS");
            await PostService.editComment(editingComment.commentId, userId, editCommentText, Token);
            Toast.show({ type: "success", text1: t("Comment updated successfully"), visibilityTime: 3000 });
            refetchCommentsPost();
            resetEditState();
        } catch (error) {
            console.error('Error updating comment:', error);
            Toast.show({ type: "error", text1: t("Failed to update comment"), visibilityTime: 3000 });
        } finally {
            setIsUpdatingComment(false);
        }
    };

    const deleteComment = async (commentId) => {
        try {
            const Token = await AsyncStorage.getItem("USER_ACCESS");
            await PostService.deleteComment(commentId, userId, postId, Token);
            refetchCommentsPost();
            Toast.show({ type: 'success', text1: t('Comment deleted successfully') });
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const addReplyToComment = async (commentId, text) => {
        if (!text.trim()) {
            Toast.show({ type: "info", text1: t("Please write a reply"), visibilityTime: 3000 });
            return;
        }
        setAddingReply(commentId);
        try {
            const Token = await AsyncStorage.getItem("USER_ACCESS");
            await PostService.addReplyToComment(userId, commentId, postId, userprofilePic, userFullname, text, Token);

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
            setReplyingToCommentId(null);
            setReplyingToUserName("");
            setShowReplyOverlay(false);
        } catch (error) {
            console.error("Error adding reply:", error);
        } finally {
            setAddingReply(null);
        }
    };

    const handleReplyButtonPress = (commentId, userName) => {
        if (showReplyInput === commentId) {
            // Close the current reply input
            handleCloseReply();
        } else {
            // Close any existing reply input first
            if (showReplyInput) {
                handleCloseReply();
            }
            
            setShowReplyInput(commentId);
            setReplyingToCommentId(commentId);
            setReplyingToUserName(userName);
            setReplyText("");
            setShowReplyOverlay(true);
            
            // Let the useEffect handle the focus
        }
    };

    const handleCloseReply = () => {
        setShowReplyInput(null);
        setShowReplyOverlay(false);
        setReplyingToCommentId(null);
        setReplyingToUserName("");
        setReplyText(""); // Reset reply text when closing
        // Dismiss keyboard
        replyInputRef.current?.blur();
    };

    const handleReplyTextChange = useCallback((text) => {
        setReplyText(text);
    }, []);

    const renderReactionSummary = (reactions) => {
        if (!reactions || reactions.length === 0) return null;

        const reactionCounts = {};
        reactions.forEach(r => {
            reactionCounts[r.reactionType] = (reactionCounts[r.reactionType] || 0) + 1;
        });

        const sortedReactions = Object.entries(reactionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

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
    
    // Add this helper function (like in PostCard)
    const getReactionSummary = (reactions) => {
        if (!reactions || reactions.length === 0) {
            return { total: 0, topReactions: [] };
        }
        const counts = {};
        reactions.forEach(reaction => {
            counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
        });
        const total = reactions.length;
        const topReactions = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);
        return { total, topReactions };
    };

    const reactionSummary = getReactionSummary(localReactions);

    // Floating reaction summary overlay (like PostCard)
    const renderReactionOverlay = () => {
        const reactionSummary = getReactionSummary(localReactions);
        if (reactionSummary.total === 0) return null;
        return (
            <View style={{
                position: 'absolute',
                left: 20,
                bottom: 20,
                backgroundColor: 'rgba(0,0,0,0.25)',
                borderRadius: 25,
                paddingHorizontal: 15,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
            }}>
                <View style={{ flexDirection: 'row', marginRight: 6 }}>
                    {reactionSummary.topReactions.map((type, idx) => (
                        <Text key={idx} style={{ fontSize: 16, marginHorizontal: 2 }}>{reactionEmojis[type]}</Text>
                    ))}
                </View>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 4 }}>{reactionSummary.total}</Text>
            </View>
        );
    };

    // --- RENDER LOGIC ---
    if (loading) {
        return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
    }

    if (!post) {
        return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>{t('Post not found.')}</Text></View>;
    }
    
    // --- JSX FOR SUB-COMPONENTS ---
    const PostContent = () => {
        return (
            <View style={styles.postContainer}>
                <View style={styles.postHeader}>
                    <Image source={post?.userInfo?.image ? { uri: post.userInfo.image } : require('../../assets/default-avatar.jpg')} style={styles.profileImage} />
                    <View style={{flex: 1, marginLeft: 10}}>
                        <Text style={styles.profileName}>{post?.userInfo?.name}</Text>
                        <Text style={styles.postTime}>{formatDateTime(post.postDateTime)}</Text>
                    </View>
                </View>
                <View style={styles.captionContainer}>
                    <Text>{post.caption}</Text>
                    {/* If no image, show floating reactions on caption */}
                    {imageUris.length === 0 && renderReactionOverlay()}
                </View>
                {isFetchingImages && <ActivityIndicator style={{marginVertical: 20}}/>}
                {imageUris.length > 0 && (
                    <View style={{ height: 300, marginTop: 10, alignItems: 'center', position: 'relative' }}>
                        <FlatList
                            ref={flatListRef}
                            data={imageUris}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(uri, idx) => uri + idx}
                            renderItem={({ item: photoUri, index }) => (
                                <TouchableWithoutFeedback onPress={() => { setModalImageIndex(index); setModalVisible(true); }}>
                                    <Image
                                        source={{ uri: photoUri }}
                                        style={{ width: screenWidth, height: 300, marginLeft: 0, marginRight: 0 }}
                                        resizeMode="cover"
                                    />
                                </TouchableWithoutFeedback>
                            )}
                            contentContainerStyle={{ alignItems: 'center', minWidth: screenWidth }}
                            style={{ width: screenWidth }}
                            onMomentumScrollEnd={e => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                                setActiveImage(index);
                            }}
                        />
                        <View style={styles.imageCountOverlay}>
                            <Text style={styles.imageCountText}>{imageUris.length} {t('photos')}</Text>
                        </View>
                        {renderReactionOverlay()}
                        {/* Dots indicator */}
                        <View style={styles.dotsContainer}>
                            {imageUris.map((_, idx) => (
                                <View
                                    key={idx}
                                    style={[styles.dot, activeImage === idx && styles.dotActive]}
                                />
                            ))}
                        </View>
                    </View>
                )}
                {/* ... existing stats and divider ... */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            if (localUserReaction) {
                                handleReaction(localUserReaction);
                            } else {
                                handleReaction('heart');
                            }
                        }}
                        onLongPress={() => setShowReactionDialog(true)}
                        activeOpacity={0.7}
                        disabled={isReacting}
                    >
                        <View style={styles.iconButtonBg}>
                            {localUserReaction ? (
                                <Text style={[styles.reactionIcon, { color: Colors.LIGHT_PURPLE }]}>{reactionEmojis[localUserReaction]}</Text>
                            ) : (
                                <EvilIcons name="heart" size={26} color={Colors.BLACK} />
                            )}
                        </View>
                        {reactionSummary.total > 0 && (
                            <Text style={styles.actionCount}>{reactionSummary.total}</Text>
                        )}
                        <Text style={styles.actionText}>{t('Like')}</Text>
                    </TouchableOpacity>
                    {showReactionDialog && (
                        <View style={[styles.reactionDialog, { zIndex: 3 }]}> 
                            {Object.entries(reactionEmojis).map(([type, emoji]) => (
                                <TouchableOpacity
                                    key={type}
                                    style={styles.reactionButton}
                                    onPress={() => {
                                        handleReaction(type);
                                        setShowReactionDialog(false);
                                    }}
                                    disabled={isReacting}
                                >
                                    <Text style={styles.reactionText}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowReactionDialog(false)}
                            >
                                <Text style={styles.cancelText}>{t('Cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                {showPostReactionDialog && (
                    <View style={styles.reactionDialog}>
                        {Object.entries(reactionEmojis).map(([type, emoji]) => (
                            <TouchableOpacity key={type} onPress={() => handleAddReactionToPost(type)}>
                                <Text style={styles.reactionText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    }

    // Add CommentsHeader component
    const CommentsHeader = () => (
        <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
                Comments {post?.commentsNumber != null ? `(${post.commentsNumber})` : ''}
            </Text>
        </View>
    );

    const CommentItem = ({ comment }) => {
        const highlightColor = highlightAnim.interpolate({ inputRange: [0, 1], outputRange: ['#fff', '#e0d8f5'] });
        const currentUserReaction = getCurrentUserReaction(comment);
        const isExpanded = expandedComments[comment.commentId];
        const isSelected = selectedComment?.commentId === comment.commentId;
        const isEditing = editingComment?.commentId === comment.commentId;
        const hasReplies = parseInt(comment.numberOfReplies) > 0;
        const showReplies = isExpanded && hasReplies;
        
        return (
            <React.Fragment key={comment.commentId}>
                <View style={{ position: 'relative' }}>
                    {renderReactionSummary(comment.reactions)}
                </View>

                <Animated.View style={[styles.commentWrapper, { 
                    backgroundColor: highlightCommentId === comment.commentId ? highlightColor : '#fff',
                    position: 'relative'
                }]}>
                    <TouchableOpacity
                        onLongPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setSelectedComment(comment);
                            setShowCommentActionDialog(true);
                        }}
                        activeOpacity={1}
                        style={{ zIndex: isSelected ? 2 : 0 }}
                    >
                        <View style={styles.commentContainer}>
                            <View style={styles.commentAvatarContainer}>
                                <Image
                                    source={{ uri: comment.userProfileImage }}
                                    defaultSource={require("../../assets/default-avatar.jpg")}
                                    style={styles.commentAvatar}
                                />
                            </View>

                            <View style={styles.commentContent}>
                                {isEditing ? (
                                    <Animated.View style={[styles.editCommentContainer, animatedEditInputStyle]}>
                                        <TextInput
                                            value={editCommentText}
                                            onChangeText={setEditCommentText}
                                            multiline
                                            style={styles.editInput}
                                            autoFocus
                                            placeholder={t('Edit your comment...')}
                                        />
                                        <View style={styles.editButtons}>
                                            <TouchableOpacity onPress={cancelEdit} disabled={isUpdatingComment}>
                                                <Text style={styles.cancelEditButton}>{t('Cancel')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={updateComment} disabled={isUpdatingComment}>
                                                {isUpdatingComment ? (
                                                    <ActivityIndicator size="small" color={Colors.PURPLE} />
                                                ) : (
                                                    <Text style={styles.saveEditButton}>{t('Save')}</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                ) : (
                                    <>
                                        <View style={styles.commentHeader}>
                                            <Text style={styles.commentUserName}>{comment.userName}</Text>
                                            <Text style={styles.commentTime}>{formatDateTime(comment.createdAt)}</Text>
                                        </View>
                                        <Text style={styles.commentText}>{comment.text}</Text>
                                        
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
                                    </>
                                )}
                            </View>
                        </View>

                        {!isEditing && (
                            <View style={styles.commentActions}>
                                <TouchableOpacity
                                    onPress={() => handleReactionIconPress(comment.commentId, currentUserReaction)}
                                    onLongPress={() => handleReactionIconLongPress(comment.commentId)}
                                    style={styles.actionButton}
                                >
                                    <Text style={styles.actionButtonText}>
                                        {currentUserReaction
                                            ? reactionEmojis[currentUserReaction]
                                            : <Ionicons name="heart-outline" size={16} color={Colors.LIGHT_PURPLE} />
                                        }
                                    </Text>
                                    <Text style={styles.actionButtonLabel}>{t('Like')}</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    onPress={() => handleReplyButtonPress(comment.commentId, comment.userName)}
                                    style={styles.actionButton}
                                >
                                    <Text style={styles.actionButtonLabel}>{t('Reply')}</Text>
                                </TouchableOpacity>

                                {hasReplies && (
                                    <TouchableOpacity
                                        style={styles.repliesButton}
                                        onPress={() => {
                                            toggleCommentExpansion(comment.commentId);
                                            if (!replies[comment.commentId]) {
                                                fetchRepliesForComment(comment.commentId);
                                            }
                                        }}
                                    >
                                        <Text style={styles.repliesText}>
                                            {parseInt(comment.numberOfReplies)} {t('replies')}
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
                                    const profilePicUrl = replyprofilePic[reply.residentId];
                                    const isValidUrl = profilePicUrl && 
                                        typeof profilePicUrl === 'string' && 
                                        profilePicUrl !== 'null' && 
                                        profilePicUrl !== 'undefined' &&
                                        profilePicUrl.trim() !== '' &&
                                        !profilePicUrl.startsWith('data:') &&
                                        profilePicUrl.length > 10;
                                    
                                    return (
                                        <View key={`${comment.commentId}-${index}`} style={styles.replyItem}>
                                            <View style={styles.replyLine} />
                                            <View style={styles.replyAvatarContainer}>
                                                <Image
                                                    source={isValidUrl 
                                                        ? { uri: profilePicUrl } 
                                                        : require("../../assets/default-avatar.jpg")
                                                    }
                                                    style={styles.replyAvatar}
                                                    defaultSource={require("../../assets/default-avatar.jpg")}
                                                />
                                            </View>
                                            <View style={styles.replyContent}>
                                                <View style={styles.replyHeader}>
                                                    <Text style={styles.replyUserName}>{reply.userName}</Text>
                                                    <Text style={styles.replyTime}>{formatDateTime(reply.createdAt)}</Text>
                                                </View>
                                                <Text style={styles.replyText}>{reply.text}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* Reply input */}
                        {showReplyInput === comment.commentId && (
                            <View style={styles.replyInputContainer}>
                                <View style={styles.replyInputAvatarContainer}>
                                    <Image
                                        source={{ uri: userprofilePic }}
                                        defaultSource={require("../../assets/default-avatar.jpg")}
                                        style={styles.replyInputAvatar}
                                    />
                                </View>
                                <View style={styles.replyInputWrapper}>
                                    <TextInput
                                        key={`reply-${comment.commentId}`}
                                        ref={replyInputRef}
                                        style={styles.replyInput}
                                        placeholder={`${t('Reply to')} ${comment.userName}...`}
                                        value={replyText}
                                        onChangeText={handleReplyTextChange}
                                        multiline
                                        editable={addingReply !== comment.commentId}
                                        keyboardShouldPersistTaps="handled"
                                        returnKeyType="send"
                                        onSubmitEditing={() => {
                                            if (replyText.trim()) {
                                                addReplyToComment(comment.commentId, replyText);
                                            }
                                        }}
                                        blurOnSubmit={false}
                                    />
                                    <View style={styles.replyInputActions}>
                                        <TouchableOpacity
                                            onPress={handleCloseReply}
                                            style={styles.cancelReplyButton}
                                        >
                                            <Text style={styles.cancelReplyText}>{t('Cancel')}</Text>
                                        </TouchableOpacity>
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
                                                    size={16}
                                                    color={replyText.trim() ? Colors.PURPLE : Colors.GRAY}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Action dialog */}
                    {showCommentActionDialog && isSelected && !isEditing && (
                        <>
                            <BlurView
                                intensity={100}
                                tint="light"
                                style={[styles.blurOverlay, StyleSheet.absoluteFill, { zIndex: 2 }]}
                            />
                            <ActionDialog
                                style={[
                                    animatedActionDialogStyle,
                                    { zIndex: 3 }
                                ]}
                            >
                                <ActionContainer>
                                    {selectedComment.residentId === userId ? (
                                        <>
                                            <ActionButton onPress={() => handleCommentAction("edit", selectedComment)}>
                                                <ActionButtonText>{t('Edit')}</ActionButtonText>
                                            </ActionButton>
                                            <ActionButton onPress={() => handleCommentAction("delete", selectedComment)}>
                                                <ActionButtonText>{t('Delete')}</ActionButtonText>
                                            </ActionButton>
                                        </>
                                    ) : (
                                        <>
                                            <ActionButton onPress={() => handleCommentAction("report", selectedComment)}>
                                                <ActionButtonText>{t('Report')}</ActionButtonText>
                                            </ActionButton>
                                            <ActionButton onPress={() => handleCommentAction("block", selectedComment)}>
                                                <ActionButtonText>{t('Block')}</ActionButtonText>
                                            </ActionButton>
                                        </>
                                    )}
                                    <CancelButton onPress={() => setShowCommentActionDialog(false)}>
                                        <ActionButtonText>{t('Cancel')}</ActionButtonText>
                                    </CancelButton>
                                </ActionContainer>
                            </ActionDialog>
                        </>
                    )}
                </Animated.View>
            </React.Fragment>
        );
    };

    // --- MAIN RENDER ---
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Header with back arrow */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.LIGHT_PURPLE} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('Post')}</Text>
                <View style={styles.placeholder} />
            </View>
            
            <View style={{ flex: 1 }}>
            <FlatList
                ref={commentsFlatListRef}
                data={Array.from(new Map(pagedData.content.map(c => [c.commentId, c])).values())}
                renderItem={({ item: comment }) => <CommentItem comment={comment} />}
                keyExtractor={item => item.commentId}
                getItemLayout={(data, index) => ({
                    length: 120, // Approximate height of each comment item
                    offset: 120 * index,
                    index,
                })}
                ListHeaderComponent={
                    <>
                        <PostContent />
                        <CommentsHeader />
                    </>
                }
                onEndReached={() => {
                    if (!pagedData.last && !isFetchingMore) {
                        fetchCommentsPost(pagedData.number + 1);
                    }
                }}
                onEndReachedThreshold={0.5}
                onScrollToIndexFailed={() => {
                    // Fallback: scroll to end if scrollToIndex fails
                    commentsFlatListRef.current?.scrollToEnd({ animated: true });
                }}
                ListFooterComponent={
                    isFetchingMore ? (
                        <View style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator size="small" color={Colors.PURPLE} />
                        </View>
                    ) : null
                }
                ListEmptyComponent={!isLoading && (
                    <View style={styles.noCommentsContainer}>
                        <Text>{t('No comments yet')}</Text>
                    </View>
                )}
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
                removeClippedSubviews={false}
            />

            {showSuggestions && mentionSuggestions.length > 0 && renderSuggestions()}

            <View style={styles.addCommentContainer}>
                <Image source={userprofilePic ? { uri: userprofilePic } : require('../../assets/default-avatar.jpg')} style={styles.userProfileImage} />
                <TextInput
                    ref={commentInputRef}
                    placeholder={`${t('Add a comment as')} ${userFullname}`}
                    value={commentText}
                    onChangeText={handleCommentChange}
                    style={styles.commentInput}
                    multiline
                />
                <TouchableOpacity onPress={handleAddCommentToPost} disabled={isAddingComment}>
                    {isAddingComment ? <ActivityIndicator size="small" color={Colors.PURPLE} /> : <FontAwesome name="send" size={24} color={commentText ? Colors.PURPLE : Colors.PLATINUM} />}
                </TouchableOpacity>
            </View>

            {/* All Modals */}
            <PostOptionsModel isVisible={isOptionsPostModalVisible} onClose={() => setOptionsPostModalVisible(false)} postId={postId} refreshPosts={fetchAllData} />
            <SendModel isVisible={isSendModalVisible} onClose={() => setSendModalVisible(false)} />
            <ShareModel isVisible={isShareModalVisible} onClose={() => setShareModalVisible(false)} />
            {/* ... other modals ... */}

            <Toast />
            <ImageViewing
                images={imageUris.map(uri => ({ uri }))}
                imageIndex={modalImageIndex}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                swipeToCloseEnabled
                doubleTapToZoomEnabled
                presentationStyle="overFullScreen"
                backgroundComponent={() => (
                    <BlurView intensity={100} tint='light' style={{ flex: 1 }}>
                        <View style={{
                            ...StyleSheet.absoluteFillObject,
                            backgroundColor: 'rgba(187, 177, 202, 0.18)'
                        }} />
                    </BlurView>
                )}
            />
        </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
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
    container: {
        flex: 1,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
    },
    postContainer: {
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 8,
        borderBottomColor: '#f0f0f0'
    },
    postHeader: {
        flexDirection: "row",
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    profileImage: { width: 50, height: 50, borderRadius: 25 },
    profileName: { fontSize: 16, fontWeight: "bold" },
    postTime: { color: "grey", fontSize: 12 },
    captionContainer: { paddingHorizontal: 15, marginVertical: 10 },
    statsContainer: {
        flexDirection: "row",
        paddingHorizontal: 15,
        marginTop: 10,
        paddingBottom: 5,
    },
    statText: { color: "grey", marginRight: 15 },
    divider: {
        backgroundColor: '#e0e0e0',
        height: 1,
        marginHorizontal: 15,
        marginTop: 10,
    },
    actionsContainer: {
        flexDirection: "row",
        justifyContent: "flex-start",
        paddingVertical: 10,
        marginLeft: 10,
    },
    actionButton: {
        alignItems: "center",
        flexDirection: "row",
    },
    actionText: { marginLeft: 8, fontSize: 14, color: 'grey' },
    reactionDialog: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 5,
        flexDirection: 'row',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
    },
    reactionText: { fontSize: 24, marginHorizontal: 5 },
    commentsSection: { 
        paddingHorizontal: 15, 
        marginTop: 15, 
        marginBottom: 10,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    commentsTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 10,
        color: '#333',
        letterSpacing: 0.5,
    },
    commentWrapper: {
        marginBottom: 8,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    commentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    commentAvatarContainer: {
        marginRight: 12,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 12,
        marginLeft: 4,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    commentUserName: {
        fontWeight: '600',
        fontSize: 14,
        color: '#2c3e50',
    },
    commentTime: {
        fontSize: 11,
        color: '#95a5a6',
        fontWeight: '400',
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#34495e',
        fontWeight: '400',
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    actionButtonText: {
        fontSize: 14,
        color: Colors.LIGHT_PURPLE,
        marginRight: 4,
    },
    actionButtonLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    repliesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
    },
    repliesText: {
        color: Colors.PURPLE,
        marginRight: 6,
        fontSize: 12,
        fontWeight: '500',
    },
    addCommentContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderTopWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
    userProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    commentInput: {
        flex: 1,
        backgroundColor: "#f8f9fa",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        minHeight: 40,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    suggestionsContainer: {
        maxHeight: 150,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        width: 200,
        left: 50,
        marginBottom: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
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
        marginTop: 8,
        marginLeft: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
        zIndex: 10,
    },
    reactionOption: {
        padding: 5,
    },
    reactionOptionEmoji: {
        fontSize: 20,
    },
    commentHeader: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    commentFooter: {
        flexDirection: "row",
        marginLeft: 1,
        marginTop: -5,
        verticalAlign: 'middle'
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
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
        marginHorizontal: 15,
        marginBottom: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    replyInputAvatarContainer: {
        marginRight: 10,
    },
    replyInputAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    replyInputWrapper: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    replyInput: {
        flex: 1,
        paddingVertical: 4,
        paddingHorizontal: 8,
        fontSize: 13,
        maxHeight: 80,
        color: '#34495e',
    },
    replyInputActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 8,
        gap: 12,
    },
    cancelReplyButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
    },
    cancelReplyText: {
        color: Colors.GRAY,
        fontSize: 12,
        fontWeight: '500',
    },
    sendReplyButton: {
        padding: 6,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
    },
    repliesContainer: {
        marginTop: 8,
        marginBottom: 8,
        paddingHorizontal: 15,
    },
    replyItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
        paddingLeft: 20,
    },
    replyLine: {
        width: 2,
        backgroundColor: '#e9ecef',
        height: "100%",
        marginRight: 12,
        position: 'absolute',
        left: 8,
        top: 0,
        bottom: 0,
        borderRadius: 1,
    },
    replyAvatarContainer: {
        marginRight: 10,
    },
    replyAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    replyContent: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    replyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    replyUserName: {
        fontWeight: '600',
        fontSize: 12,
        color: '#2c3e50',
    },
    replyTime: {
        fontSize: 10,
        color: '#95a5a6',
    },
    replyText: {
        fontSize: 13,
        lineHeight: 18,
        color: '#34495e',
    },
    reactionSummaryFloating: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#B39DDB',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
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
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    reactionEmoji: {
        fontSize: 14,
        marginRight: 2,
    },
    reactionCount: {
        fontSize: 12,
        color: Colors.DARK_GRAY,
        fontWeight: '500',
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
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 2,
        borderColor: Colors.LIGHT_PURPLE,
        width: '100%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    editInput: {
        minHeight: 80,
        fontSize: 14,
        padding: 8,
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    editButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    cancelEditButton: {
        color: Colors.RED,
        fontWeight: '600',
        marginRight: 15,
        padding: 8,
        fontSize: 14,
    },
    saveEditButton: {
        color: Colors.PURPLE,
        fontWeight: '600',
        padding: 8,
        fontSize: 14,
    },
    noCommentsContainer: {
        alignItems: "center",
        marginTop: "15%",
        marginBottom: "15%",
        paddingHorizontal: 20,
    },
    iconButtonBg: {
        backgroundColor: '#f3f0ff',
        borderRadius: 16,
        padding: 6,
        marginRight: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionCount: {
        marginLeft: 4,
        fontSize: 16,
        color: Colors.DARK_GRAY,
        fontWeight: '300',
    },
    reactionButton: {
        padding: 2,
        borderRadius: 20,
        backgroundColor: Colors.WHITE,
        marginHorizontal: 3,
        height: 35,
        width: 30,
        marginBottom: 3,
    },
    cancelButton: {
        marginLeft: 10,
        padding: 8,
        borderRadius: 5,
    },
    cancelText: {
        fontSize: 14,
        color: Colors.RED,
    },
    imageCountOverlay: {
        position: 'absolute',
        bottom: 16,
        right: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    imageCountText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    dotsContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#bbb',
        marginHorizontal: 3,
    },
    dotActive: {
        backgroundColor: '#6c47b6',
    },
});

export default PostDetail;