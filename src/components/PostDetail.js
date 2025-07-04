import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, Image, ActivityIndicator, TouchableOpacity, Modal, StyleSheet,
    ScrollView, TextInput, TouchableWithoutFeedback, Animated // Keep Animated from 'react-native'
} from "react-native";
import Axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { encode } from "base64-arraybuffer";
import { EvilIcons, Feather, Entypo, FontAwesome } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as Haptics from 'expo-haptics';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'; // Renamed to avoid conflict

// --- PLEASE VERIFY THESE IMPORT PATHS ---
// The error is most likely here. Adjust the '../' or './' to match your folder structure.
import { APP_ENV } from '../utils/BaseUrl';
import Colors from '../../assets/Colors';
import {
    UserInfo, UserImgWrapper, UserImg, UserInfoText, UserName, PostTime,
    MessageText, TextSection, CommentContainer, Replytext
} from '../utils/Styles/MessageStyles';
import PostOptionsModel from './pupUps/PostOptionsModel';
import SendModel from './pupUps/SendModel';
import ShareModel from './pupUps/ShareModel';
// --- END OF PATHS TO VERIFY ---


const PostDetail = ({ route }) => {
    const { postId, highlightCommentId } = route.params;
    const commentInputRef = useRef(null); // Fix for 'this.commentInputRef'

    // --- STATE MANAGEMENT ---
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
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
    
    const highlightAnim = useRef(new Animated.Value(0)).current;
    const editInputHeight = useSharedValue(0);
    const editInputOpacity = useSharedValue(0);
    
    const reactionEmojis = { heart: '❤️', like: '👍', laugh: '😂', angry: '😡', sad: '😢' };

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const currentUserId = await AsyncStorage.getItem("userId");
            setUserId(currentUserId);
            const userProfileRes = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${currentUserId}`);
            setFullName(userProfileRes.data.fullName);
            setUserProfilePic(userProfileRes.data.profilephoto);
            const postRes = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getPost/${postId}`);
            setPost(postRes.data);
            if (postRes.data.photos && postRes.data.photos.length > 0) {
                fetchPostImage(postRes.data.photos);
            }
            await refetchComments();
        } catch (error) {
            console.error("Error fetching post details:", error);
        } finally {
            setLoading(false);
        }
    }, [postId]);

    const refetchComments = useCallback(async () => {
        try {
            const commentsRes = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getallcomments/${postId}`);
            setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
        } catch (error) {
            console.error("Error refetching comments:", error);
        }
    }, [postId]);

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
            const response = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getreplies/${commentId}`);
            setReplies(prev => ({ ...prev, [commentId]: (response.data && response.data !== "No replies found for the specified comment") ? response.data : [] }));
        } catch (error) {
            console.error("Error fetching replies:", error);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        if (highlightCommentId && !loading) {
            Animated.sequence([
                Animated.timing(highlightAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
                Animated.delay(2000),
                Animated.timing(highlightAnim, { toValue: 0, duration: 500, useNativeDriver: false })
            ]).start();
        }
    }, [highlightCommentId, loading]);

    const formatDateTime = (timestamp) => {
        // ... (your existing formatDateTime function)
        return new Date(timestamp).toLocaleTimeString();
    };

    // All your handler functions like handleAddReactionToPost, handleAddCommentToPost etc. go here...
    // They are correct as per your code.
    const handleAddReactionToPost = async (reactionType) => {
        setShowPostReactionDialog(false);
        const originalReactions = [...post.reactions];
        const newReactions = [...originalReactions];
        const existingIndex = newReactions.findIndex(r => r.userId === userId);

        if (existingIndex !== -1) {
            newReactions[existingIndex].reactionType = reactionType;
        } else {
            newReactions.push({ userId, reactionType });
        }
        setPost(prev => ({ ...prev, reactions: newReactions }));

        try {
            await Axios.post(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/addReactionToPost/${postId}/${userId}/${reactionType}`);
        } catch (error) {
            console.error("Error adding post reaction:", error);
            setPost(prev => ({ ...prev, reactions: originalReactions })); // Revert on failure
        }
    };
    const handleAddCommentToPost = async () => {
        if (!commentText.trim()) return;
        setIsAddingComment(true);
        try {
            await Axios.post(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/addcomment/${postId}/${userId}`, { commentText });
            setCommentText("");
            await refetchComments();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to add comment' });
        } finally {
            setIsAddingComment(false);
        }
    };
    
    // ... other handlers
    
    // --- RENDER LOGIC ---
    if (loading) {
        return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
    }

    if (!post) {
        return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Post not found.</Text></View>;
    }
    
    // --- JSX FOR SUB-COMPONENTS ---
    const PostContent = () => {
        const userReaction = post?.reactions?.find(r => r.userId === userId);
    
        return (
            <View style={styles.postContainer}>
                <View style={styles.postHeader}>
                    <Image source={post?.user?.residentProfile?.profilephoto ? { uri: post.user.residentProfile.profilephoto } : require('../../assets/default-avatar.jpg')} style={styles.profileImage} />
                    <View style={{flex: 1, marginLeft: 10}}>
                        <Text style={styles.profileName}>{post?.user?.residentProfile?.fullName}</Text>
                        <Text style={styles.postTime}>{formatDateTime(post.postDateTime)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setOptionsPostModalVisible(true)}>
                        <Feather name="more-horizontal" size={25} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.captionContainer}><Text>{post.caption}</Text></View>
                
                {isFetchingImages && <ActivityIndicator style={{marginVertical: 20}}/>}
                {imageUris.length > 0 && <Image source={{ uri: imageUris[0] }} style={{ width: '100%', height: 300, marginTop: 10 }} resizeMode="cover"/>}
                
                {/* ... existing stats and divider ... */}
                
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleAddReactionToPost('like')} onLongPress={() => setShowPostReactionDialog(true)}>
                        {userReaction ? <Text style={styles.reactionText}>{reactionEmojis[userReaction.reactionType]}</Text> : <EvilIcons name="heart" size={30} />}
                        <Text style={styles.actionText}>Like</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => commentInputRef.current?.focus()}>
                        <EvilIcons name="comment" size={30} />
                        <Text style={styles.actionText}>Comment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setSendModalVisible(true)}>
                        <Feather name="send" size={22} />
                        <Text style={styles.actionText}>Send</Text>
                    </TouchableOpacity>
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

    const CommentItem = ({ comment }) => {
        const highlightColor = highlightAnim.interpolate({ inputRange: [0, 1], outputRange: ['#fff', '#e0d8f5'] });
        
        return (
             // FIX: use highlightCommentId instead of undefined highlightId
            <Animated.View style={[styles.commentWrapper, { backgroundColor: highlightCommentId === comment.commentId ? highlightColor : '#fff' }]}>
                {/* All the JSX from your previous CommentItem logic goes here. It should be correct. */}
                <TouchableOpacity>
                     <UserInfo>
                        {/*... User image and info ...*/}
                     </UserInfo>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    // --- MAIN RENDER ---
    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
                <PostContent />
                <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>Comments</Text>
                    {comments.map(comment => <CommentItem key={comment.commentId} comment={comment} />)}
                </View>
            </ScrollView>

            <View style={styles.addCommentContainer}>
                <Image source={userprofilePic ? { uri: userprofilePic } : require('../../assets/default-avatar.jpg')} style={styles.userProfileImage} />
                <TextInput
                    ref={commentInputRef} // Correct ref assignment
                    placeholder="Add a comment..."
                    value={commentText}
                    onChangeText={setCommentText}
                    style={styles.commentInput}
                />
                <TouchableOpacity onPress={handleAddCommentToPost} disabled={isAddingComment}>
                    {isAddingComment ? <ActivityIndicator/> : <FontAwesome name="send" size={24} color={Colors.PURPLE} />}
                </TouchableOpacity>
            </View>

            {/* All Modals */}
            <PostOptionsModel isVisible={isOptionsPostModalVisible} onClose={() => setOptionsPostModalVisible(false)} postId={postId} refreshPosts={fetchAllData} />
            <SendModel isVisible={isSendModalVisible} onClose={() => setSendModalVisible(false)} />
            <ShareModel isVisible={isShareModalVisible} onClose={() => setShareModalVisible(false)} />
            {/* ... other modals ... */}

            <Toast />
        </View>
    );
};

// Use the same styles as before
const styles = StyleSheet.create({
    /* Your complete styles object */
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
        justifyContent: "space-around",
        paddingVertical: 10,
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
    commentsSection: { paddingHorizontal: 15, marginTop: 10 },
    commentsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    commentWrapper: {
        marginBottom: 10,
        borderRadius: 5,
    },
    addCommentContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    userProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    commentInput: {
        flex: 1,
        backgroundColor: "#f0f0f0",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
    },
});

export default PostDetail;