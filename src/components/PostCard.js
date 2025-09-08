import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions, TouchableWithoutFeedback, Animated } from 'react-native';
import Colors from '../../assets/Colors';
import { EvilIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View as RNView } from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { BlurView } from 'expo-blur';
import { addReactionToPost, dislikePost } from '../services/post.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const reactionEmojis = {
  heart: '❤️',
  like: '👍',
  laugh: '😂',
  angry: '😡',
  sad: '😢',
};

const PostCard = ({
  user,
  group,
  postDateTime,
  caption,
  photos = [],
  reactions = [],
  comments = [],
  commentsNumber = 0,
  userReaction,
  onLike,
  onLongPressLike,
  onComment,
  onShowReactions,
  onImagePress,
  imageUris,
  postId,
  hideUserGroupBadge = false,
}) => {
  const [showReactionDialog, setShowReactionDialog] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Optimistic UI state for reactions
  const [localReactions, setLocalReactions] = useState(reactions);
  const [localUserReaction, setLocalUserReaction] = useState(userReaction);
  const [isReacting, setIsReacting] = useState(false);
  const [userId, setUserId] = useState(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    fetchUserId();

    // Initialize animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Update local reactions when props change
  useEffect(() => {
    setLocalReactions(reactions);
  }, [reactions]);

  // Find current user's reaction from local state
  const currentUserReaction = localReactions.find(reaction => reaction.userId === userId)?.reactionType;

  // Reaction summary
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

  // Format time (simple version)
  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // Image rendering logic (gallery)
  const [activeImage, setActiveImage] = useState(0);
  const flatListRef = useRef(null);
  
  // Render reaction overlay for images
  const renderReactionOverlay = () => {
    if (reactionSummary.total === 0) return null;
    
    return (
      <View style={styles.reactionOverlay}>
        <View style={styles.reactionOverlayContent}>
          <View style={styles.reactionEmojisRow}>
            {reactionSummary.topReactions.slice(0, 3).map((type, index) => (
              <Text key={index} style={styles.reactionOverlayEmoji}>
                {reactionEmojis[type]}
              </Text>
            ))}
          </View>
          <Text style={styles.reactionOverlayCount}>{reactionSummary.total}</Text>
        </View>
      </View>
    );
  };
  
  const renderImages = () => {
    if (!photos || photos.length === 0) return null;
    const screenWidth = Dimensions.get('window').width;
    const imagesArr = imageUris ? imageUris : photos;
    if (photos.length === 1) {
      return (
        <View style={{ position: 'relative' }}>
          <TouchableWithoutFeedback onPress={() => { setModalImageIndex(0); setModalVisible(true); }}>
            <Image
              source={{ uri: imagesArr[0] }}
              style={[styles.postImage, { width: screenWidth }]}
              resizeMode="cover"
            />
          </TouchableWithoutFeedback>
          {renderReactionOverlay()}
        </View>
      );
    }
    return (
      <View style={{ height: 220, marginTop: 10, alignItems: 'center', position: 'relative' }}>
        <FlatList
          ref={flatListRef}
          data={imagesArr}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, idx) => uri + idx}
          renderItem={({ item: photoUri, index }) => (
            <TouchableWithoutFeedback onPress={() => { setModalImageIndex(index); setModalVisible(true); }}>
              <Image
                source={{ uri: photoUri }}
                style={[styles.postImage, styles.postImageShadow, { width: screenWidth, marginLeft: 0, marginRight: 0 }]}
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
          <Text style={styles.imageCountText}>{photos.length} photos</Text>
        </View>
        {renderReactionOverlay()}
        {/* Dots indicator */}
        <RNView style={styles.dotsContainer}>
          {photos.map((_, idx) => (
            <RNView
              key={idx}
              style={[styles.dot, activeImage === idx && styles.dotActive]}
            />
          ))}
        </RNView>
      </View>
    );
  };

  // Handle reaction logic
  const handleReaction = async (reactionType) => {
    if (isReacting || !userId) return;
    setIsReacting(true);
    
    // Store previous state for rollback
    const previousReactions = [...localReactions];
    const previousUserReaction = currentUserReaction;
    
    try {
      console.log('Handling reaction:', { postId, userId, reactionType, currentReaction: currentUserReaction });
      
      // Always send add reaction request - backend handles removal logic
      console.log('Sending reaction to backend...');
      
      // Optimistic update
      if (currentUserReaction === reactionType) {
        // Remove reaction - Optimistic update (same reaction clicked)
        setLocalReactions(prev => prev.filter(r => r.userId !== userId));
        setLocalUserReaction(null);
      } else {
        // Add/change reaction - Optimistic update
        setLocalReactions(prev => [
          ...prev.filter(r => r.userId !== userId),
          { userId: userId, reactionType }
        ]);
        setLocalUserReaction(reactionType);
      }
      
      // API call - backend handles the logic
      const result = await addReactionToPost(postId, userId, reactionType);
      console.log('Add reaction result:', result);
      
    } catch (err) {
      // Revert to previous state on error
      console.error('Reaction error:', err);
      console.error('Error details:', err.message);
      setLocalReactions(previousReactions);
      setLocalUserReaction(previousUserReaction);
    } finally {
      setIsReacting(false);
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {/* Header */}
          <View style={styles.header}>
            {group && group.name && group.image ? (
              <>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: group.image }}
                    style={styles.avatar}
                  />
                </View>
                <View style={styles.contentContainer}>
                  <View style={styles.headerRow}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {!hideUserGroupBadge && (
                      <View style={styles.groupBadge}>
                        <MaterialCommunityIcons name="account-group" size={12} color={Colors.LIGHT_PURPLE} />
                        <Text style={styles.groupBadgeText}>Group</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Image
                      source={{ uri: user?.image || user?.profilephoto || 'https://placeholder.com/avatar' }}
                      style={styles.userMiniAvatar}
                    />
                    <Text style={styles.userMiniName}>{user?.name || user?.fullName}</Text>
                  </View>
                  <Text style={styles.time}>{formatDateTime(postDateTime)}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: user?.image || user?.profilephoto || 'https://placeholder.com/avatar' }}
                    style={styles.avatar}
                  />
                </View>
                <View style={styles.contentContainer}>
                  <View style={styles.headerRow}>
                    <Text style={styles.username}>{user?.name || user?.fullName}</Text>
                    {!hideUserGroupBadge && (
                      <View style={styles.userBadge}>
                        <MaterialCommunityIcons name="account" size={12} color="#EC4899" />
                        <Text style={styles.userBadgeText}>User</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.time}>{formatDateTime(postDateTime)}</Text>
                </View>
              </>
            )}
          </View>

          {/* Images */}
          {renderImages()}

          {/* Caption */}
          {caption && (
            <View style={styles.captionContainer}>
              <Text style={styles.caption}>{caption}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (currentUserReaction) {
                  handleReaction(currentUserReaction);
                } else {
                  handleReaction('heart');
                }
              }}
              onLongPress={() => setShowReactionDialog(true)}
              activeOpacity={0.7}
              disabled={isReacting}
            >
              <View style={[styles.iconButtonBg, currentUserReaction && styles.iconButtonBgActive]}>
                {currentUserReaction ? (
                  <Text style={styles.reactionIcon}>{reactionEmojis[currentUserReaction]}</Text>
                ) : (
                  <EvilIcons name="heart" size={24} color="#6B7280" />
                )}
              </View>
              {reactionSummary.total > 0 && (
                <Text style={styles.actionCount}>{reactionSummary.total}</Text>
              )}
              <Text style={styles.actionText}>Like</Text>
            </TouchableOpacity>
          
            {showReactionDialog && (
              <View style={styles.reactionDialog}> 
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
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onComment}
              activeOpacity={0.7}
            >
              <View style={styles.iconButtonBg}>
                <EvilIcons name="comment" size={24} color={Colors.LIGHT_PURPLE} />
              </View>
              {commentsNumber > 0 && (
                <Text style={styles.actionCount}>{commentsNumber}</Text>
              )}
              <Text style={styles.actionText}>Comment</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>

      <View style={styles.divider} />

      {/* Modal Image Viewer */}
      <ImageViewing
        images={(imageUris ? imageUris : photos).map(uri => ({ uri }))}
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  userBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EC4899',
    marginLeft: 3,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.LIGHT_PURPLE,
    marginLeft: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userMiniAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userMiniName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F9FAFB',
  },
  postImageShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  imageCountOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  caption: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontWeight: '400',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  iconButtonBg: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 6,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonBgActive: {
    backgroundColor: '#FCE7F3',
  },
  actionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 3,
  },
  reactionIcon: {
    fontSize: 14,
  },
  reactionDialog: {
    position: 'absolute',
    bottom: 50,
    left: 12,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reactionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  reactionText: {
    fontSize: 18,
  },
  cancelButton: {
    marginLeft: 6,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  cancelText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 2,
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  reactionOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reactionOverlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionEmojisRow: {
    flexDirection: 'row',
    marginRight: 4,
  },
  reactionOverlayEmoji: {
    fontSize: 12,
    marginHorizontal: 1,
  },
  reactionOverlayCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
});

export default PostCard; 