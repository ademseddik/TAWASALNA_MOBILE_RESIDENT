

import { View, Text, Image, ActivityIndicator, TouchableOpacity,Modal,StyleSheet  } from "react-native";
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

  const fetchProfilePosts = async () => {
    setIsFetchingPosts(true);
    try {
      let userId = await AsyncStorage.getItem("userId");
      if (idfromUsersprofile) {
        userId = idfromUsersprofile;
      }
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentpostsWithPhotos/${userId}`
      );

      if (
        response.data &&
        response.data !== "No posts with photos found for user"
      ) {
        const residentPosts = response.data;
        if (residentPosts.length > 0) {
          residentPosts.sort((a, b) => {
            const dateA = new Date(a.postDateTime);
            const dateB = new Date(b.postDateTime);
            return dateB - dateA;
          });
          setData(residentPosts);
        }
        setFetched(true);
      } else {
        console.log("No resident posts found.");
      }
    } catch (error) {
      console.error("Error getting resident posts:", error);
    } finally {
      setIsFetchingPosts(false);
    }
  };

  useEffect(() => {
    if (!fetched) {
      fetchProfilePosts();
    }
  }, [fetched]);

  const fetchImage = async (data) => {
    setIsFetchingImages(true);
    try {
      const filteredData = data.filter((post) => !post.video);
      const newImageUris = {};

      for (const post of filteredData) {
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
      // Optimistic UI update
      setData(prevData => 
        prevData.map(post => {
          if (post.id === postId) {
            // Check if user already has a reaction
            const existingIndex = post.reactions.findIndex(r => r.userId === userId);
            
            const newReactions = [...post.reactions];
            
            if (existingIndex !== -1) {
              // Update existing reaction
              newReactions[existingIndex] = {
                ...newReactions[existingIndex],
                reactionType
              };
            } else {
              // Add new reaction
              newReactions.push({ userId, reactionType });
            }
            
            return { ...post, reactions: newReactions };
          }
          return post;
        })
      );

      let userd = await AsyncStorage.getItem("userId");
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/addReactionToPost/${postId}/${userd}/${reactionType}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await response.text();
      console.log(result);
    } catch (error) {
      console.error("Error handling reaction:", error);
      // Revert on error
      fetchProfilePosts();
    }
  };

  return (
    <ScrollView>
      {isFetchingPosts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PURPLE} />
        </View>
      ) : (
        <>
          {data.length === 0 ? (
            <View style={styles.noPostsContainer}>
              <Text>No posts yet</Text>
            </View>
          ) : (
            data.map((post) => {
              const reactionSummary = getReactionSummary(post.reactions);
              const userReaction = post.reactions.find(r => r.userId === userId);
              
              return (
                <View
                  key={post.id}
                  style={styles.postContainer}
                >
                  <View style={styles.postHeader}>
                    {profilePic !== "data:image/jpeg;base64," ? (
                      <Image
                        source={{ uri: profilePic }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <Image
                        source={require("../../assets/default-avatar.jpg")}
                        style={styles.profileImage}
                      />
                    )}
                    <Text style={styles.profileName}>
                      {fullName}
                    </Text>
                    <TouchableOpacity
                      style={styles.optionsButton}
                      onPressIn={() => toggleOptionsPostModal(post.id)}
                    >
                      <Feather name="more-horizontal" size={25} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.postTime}>
                    {formatDateTime(post.postDateTime)}
                  </Text>
                  <View style={styles.captionContainer}>
                    <Text>{post.caption}</Text>
                  </View>
                  {isFetchingImages ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={Colors.PURPLE} />
                    </View>
                  ) : (
                    <TouchableOpacity style={{ alignItems: "center" }}>
                     {post.photos && post.photos.length > 0 ? (
    <>
      {post.photos.length === 1 ? (
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
      ) : post.photos.length <= 4 ? (
        chunkArray(post.photos, 2).map(
          (photoRow, rowIndex) => (
            <View
              key={rowIndex}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "90%",
                marginTop: 10,
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
                  }}
                  resizeMode="cover"
                />
              ))}
            </View>
          )
        )
      ) : (
        <>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "90%",
              marginTop: 10,
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
                }}
                resizeMode="cover"
              />
            ))}
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "90%",
              marginTop: 10,
            }}
          >
            <Image
              source={{
                uri:
                  imageUris[post.id] && imageUris[post.id][2],
              }}
              style={{
                width: "48%",
                height: 200,
                borderRadius: 10,
              }}
              resizeMode="cover"
            />
            <TouchableOpacity 
              onPress={() => handleImagePress(post.id)}
              style={{ width: "48%" }}
            >
              <View
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 10,
                  backgroundColor: "black",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 18 }}
                >
                  +{post.photos.length - 3}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}
    </>
  ) : null}
                    </TouchableOpacity>
                  )}
                  
                  {/* Reactions Summary */}
                  {reactionSummary.total > 0 && (
                    <View style={styles.reactionsSummaryContainer}>
                      <View style={styles.reactionsEmojiContainer}>
                        {reactionSummary.topReactions.map((type, index) => (
                          <Text key={index} style={styles.reactionEmoji}>
                            {reactionEmojis[type]}
                          </Text>
                        ))}
                      </View>
                      <Text style={styles.reactionsCount}>
                        {reactionSummary.total}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.statsContainer}>
                    <Text style={styles.statText}>
                      {reactionSummary.total} {reactionSummary.total === 1 ? 'reaction' : 'reactions'}
                    </Text>
                    <Text style={styles.statText}>
                      {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                    </Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => addReactionToPost(post.id)}
                      onLongPress={() => setShowReactionDialog(post.id)}
                    >
                      {userReaction ? (
                        <Text style={[styles.reactionIcon, { color: Colors.LIGHT_PURPLE }]}>
                          {reactionEmojis[userReaction.reactionType]}
                        </Text>
                      ) : (
                        <EvilIcons
                          name="heart"
                          size={30}
                          color={Colors.BLACK}
                        />
                      )}
                      <Text style={styles.actionText}>Like</Text>
                    </TouchableOpacity>
                    
                    {showReactionDialog === post.id && (
                      
                      <View style={[styles.reactionDialog, { zIndex: 3 }]}>
                        {Object.entries(reactionEmojis).map(([type, emoji]) => (
                          <TouchableOpacity
                            key={type}
                            style={styles.reactionButton}
                            onPress={() => {
                              addReactionToPost(post.id, type);
                              setShowReactionDialog(null);
                            }}
                          >
                            <Text style={styles.reactionText}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => setShowReactionDialog(null)}
                        >
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPressIn={() => toggleCommentModal(post.id)}
                    >
                      <EvilIcons name="comment" size={30} color={Colors.LIGHT_PURPLE} />
                      <Text style={styles.actionText}>Comment</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={toggleSendModal}
                    >
                      <Feather
                        name="send"
                        size={22}
                        color={Colors.LIGHT_PURPLE}
                      />
                      <Text style={styles.actionText}>Send</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={toggleShareModal}
                    >
                      <Entypo
                        name="share"
                        size={22}
                        color={Colors.LIGHT_PURPLE}
                      />
                      <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.divider} />
                </View>
              );
            })
          )}
        </>
      )}
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
        fullName={fullName}
        refreshPosts={fetchProfilePosts}
      />
      <SendModel isVisible={isSendModalVisible} onClose={toggleSendModal} />
      <ShareModel isVisible={isShareModalVisible} onClose={toggleShareModal} />
      <PostOptionsModel
        isVisible={isOptionsPostModalVisible}
        onClose={toggleOptionsPostModal}
        postId={selectedPostId}
        refreshPosts={fetchProfilePosts}
        //refreshImages={fetchImage}
      />
    </ScrollView>
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
