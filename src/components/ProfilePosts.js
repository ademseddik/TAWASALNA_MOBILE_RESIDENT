

import { View, Text, Image, ActivityIndicator, TouchableOpacity,Modal,StyleSheet, FlatList } from "react-native";
import React, { useState, useEffect } from "react";
import Colors from "../../assets/Colors";
import { EvilIcons, Feather, Entypo } from "@expo/vector-icons";
import CommentModel from "../components/pupUps/CommentModel";
import SendModel from "../components/pupUps/SendModel";
import ShareModel from "../components/pupUps/ShareModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { encode } from "base64-arraybuffer";
import PostOptionsModel from "../components/pupUps/PostOptionsModel";
import Axios from 'axios';
import { APP_ENV } from '../utils/BaseUrl';
import { ScrollView } from "react-native-gesture-handler";
import { PostService } from '../services/post.service';
import PostCard from './PostCard';


const ProfilePosts = ({ fullName, profilePic, idfromUsersprofile }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [isSendModalVisible, setSendModalVisible] = useState(false);
  const [isShareModalVisible, setShareModalVisible] = useState(false);
  const [isOptionsPostModalVisible, setOptionsPostModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostCommentId, setSelectedPostCommentId] = useState(null);
  const [data, setData] = useState([]);
  const [imageUris, setImageUris] = useState([]);
  const [fetched, setFetched] = useState(false);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [isFetchingImages, setIsFetchingImages] = useState(false);
  const [scrollViewImages, setScrollViewImages] = useState([]);
  const [userId, setUserId] = useState(null); 
  const [showReactionDialog, setShowReactionDialog] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;
  
  // Reaction emoji mapping
  const reactionEmojis = {
    heart: '❤️',
    like: '👍',
    laugh: '😂',
    angry: '😡',
    sad: '😢'
  };

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
    setScrollViewImages(images);
    setModalVisible(true);
  };

  const fetchUserPosts = async (nextPage = 0) => {
    setIsFetchingPosts(true);
    try {
      let userIdToFetch = idfromUsersprofile;
      if (!userIdToFetch) {
        userIdToFetch = await AsyncStorage.getItem("userId");
      }
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getAllUserPosts/${userIdToFetch}/${nextPage}/${PAGE_SIZE}`
      );
      const dataRes = await response.json();
      if (nextPage === 0) {
        setData(dataRes.content || []);
      } else {
        setData(prev => [...prev, ...(dataRes.content || [])]);
      }
      setHasMore(!dataRes.last);
      setPage(nextPage);
      setFetched(true);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setIsFetchingPosts(false);
    }
  };

  useEffect(() => {
    if (!fetched) {
      fetchUserPosts(0);
    }
  }, [fetched, idfromUsersprofile]);

  const loadMore = () => {
    if (!isFetchingPosts && hasMore) {
      fetchUserPosts(page + 1);
    }
  };

  const fetchImage = async (data) => {
    setIsFetchingImages(true);
    try {
      const filteredData = data.filter((post) => !post.video);
      const newImageUris = {};
      for (const post of filteredData) {
        const photoPromises = post.photos.map(async (photoId) => {
          try {
            const responseData = await PostService.getImage(photoId);
            const base64Image = encode(responseData);
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
      setImageUris(newImageUris);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsFetchingImages(false);
    }
  };
  
  useEffect(() => {
    if (data.length > 0) {
      fetchImage(data);
    }
  }, [data]);

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    // Your implementation here
  }

  // Get reaction summary for a post
  const getReactionSummary = (reactions) => {
    if (!reactions || reactions.length === 0) {
      return { total: 0, topReactions: [] };
    }

    const counts = {};
    reactions.forEach(reaction => {
      counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
    });

    const total = reactions.length;
    
    // Get top 3 reactions (by count)
    const topReactions = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    return { total, topReactions };
  };

  // Add reaction to post with optimistic UI update
  const addReactionToPost = async (postId, reactionType = "heart") => {
    try {
      setData(prevData => 
        prevData.map(post => {
          if (post.id === postId) {
            const existingIndex = post.reactions.findIndex(r => r.userId === userId);
            const newReactions = [...post.reactions];
            if (existingIndex !== -1) {
              newReactions[existingIndex] = {
                ...newReactions[existingIndex],
                reactionType
              };
            } else {
              newReactions.push({ userId, reactionType });
            }
            return { ...post, reactions: newReactions };
          }
          return post;
        })
      );
      let userd = await AsyncStorage.getItem("userId");
      await PostService.addReactionToPost(postId, userd, reactionType);
    } catch (error) {
      console.error("Error handling reaction:", error);
      fetchProfilePosts();
    }
  };

  return (
    <FlatList
      data={data}
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
          userReaction={post.reactions.find(r => r.userId === userId)?.reactionType}
          onLike={() => addReactionToPost(post.id)}
          onLongPressLike={(type) => addReactionToPost(post.id, type)}
          onComment={() => toggleCommentModal(post.id)}
          imageUris={imageUris[post.id]}
        />
      )}
      keyExtractor={item => item.id}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={isFetchingPosts && data.length > 0 ? (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={Colors.PURPLE} />
        </View>
      ) : null}
      ListEmptyComponent={isFetchingPosts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PURPLE} />
        </View>
      ) : (
        <View style={styles.noPostsContainer}>
          <Text>No posts yet</Text>
        </View>
      )}
    />
  );


};
const styles = StyleSheet.create({
   loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "30%",
  },
  noPostsContainer: {
    alignItems: "center", 
    marginTop: "50%"
  },
  postContainer: {
    borderRadius: 10,
    marginHorizontal: "2%",
    marginVertical: 6,
    paddingVertical: 10,
  },
  postHeader: {
    flexDirection: "row", 
    marginLeft: 10
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
  },
  profileName: {
    color: "black",
    fontSize: 16,
    marginTop: 3,
    marginLeft: 7,
    fontWeight: "500",
  },
  optionsButton: {
    marginLeft: "30%"
  },
  postTime: {
    color: "grey",
    fontSize: 13,
    marginTop: -7,
    marginLeft: "19%",
  },
  captionContainer: {
    marginLeft: "6%", 
    marginTop: "5%"
  },
  reactionsSummaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 20,
    marginTop: 8,
  },
  reactionsEmojiContainer: {
    flexDirection: "row",
    marginRight: 5,
  },
  reactionEmoji: {
    fontSize: 16,
    marginHorizontal: 1,
  },
  reactionsCount: {
    color: Colors.BLACK,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    marginLeft: 20,
    marginTop: 8,
  },
  statText: {
    color: Colors.BLACK,
    marginRight: 20,
  },
  divider: {
    backgroundColor: Colors.GunmetalGray,
    alignItems: "center",
    width: "95%",
    height: 1,
    marginTop: 10,
    marginLeft: "3%",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 5,
    paddingTop: 5,
  },
  actionButton: {
    alignItems: "center",
    flexDirection: "row",
  },
  actionText: {
    marginLeft: 5,
    fontSize: 14,
    color: Colors.BLACK,
  },
  reactionIcon: {
    fontSize: 15,
  },
  reactionDialog: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reactionButton: {
    padding: 2,
    borderRadius: 20,
    backgroundColor: Colors.WHITE,
    marginHorizontal: 3,
    height:35,
    width:30,
    marginBottom:3
  },
  reactionText: {
    fontSize: 24,
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
});

export default ProfilePosts
