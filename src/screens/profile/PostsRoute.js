import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity, Image } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { APP_ENV } from '../../utils/BaseUrl';
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from 'lottie-react-native';
import loadingAnimation from '../../../assets/animations/LoadingAnimatoion3.json';
import PostCard from '../../components/PostCard';
import CommentModel from '../../components/pupUps/CommentModel';
import ConfirmActionModel from '../../components/pupUps/ConfirmActionModel';
import EditPostModal from '../../components/pupUps/EditPostModal';
import Axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../../../assets/Colors';

function PostsRoute({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const fetchPosts = async (reset = false) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getAllUserPosts/${userId}/${reset ? 0 : page}/${PAGE_SIZE}`
      );
      const data = await response.json();
      if (reset) {
        setPosts(data.content || []);
      } else {
        setPosts(prev => [...prev, ...(data.content || [])]);
      }
      setHasMore((data.content?.length || 0) === PAGE_SIZE);
    } catch (error) {
      //   console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Initialize animations
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 0) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <View style={styles.emptyIconContainer}>
      <Image source={require('../../../assets/Icons/postiCOn.png')} style={styles.emptyLogo} resizeMode="contain" />
      </View>
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptySubtitle}>
        Share your first post with your community
      </Text>
    </Animated.View>
  );

  const renderLoadingMore = () => (
    <View style={styles.loadingMore}>
      <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
      <Text style={styles.loadingMoreText}>Loading more posts...</Text>
    </View>
  );

  const renderPostItem = ({ item, index }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View style={{ position: 'relative' }}>
        <PostCard
          key={item.id}
          user={item.user}
          postDateTime={item.postDateTime}
          postId={item.id}
          caption={item.caption}
          photos={item.photos}
          reactions={item.reactions || []}
          comments={item.comments || []}
          commentsNumber={item.commentsNumber || 0}
          userReaction={item.userReaction}
          onLike={() => {}}
          onLongPressLike={() => {}}
          onComment={() => {
            setSelectedPostId(item.id);
            setCommentModalVisible(true);
          }}
          hideUserGroupBadge
        />

        {/* Action buttons - Edit and Delete */}
        <View style={{ position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 8 }}>
          {/* Edit button */}
          <TouchableOpacity
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, padding: 6 }}
            onPress={() => {
              setSelectedPost(item);
              setSelectedPostId(item.id);
              setIsEditModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
          
          {/* Delete button */}
          <TouchableOpacity
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, padding: 6 }}
            onPress={() => {
              setSelectedPostId(item.id);
              setIsDeleteModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const deleteResidentPost = async () => {
    if (!selectedPostId) return;
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      await Axios.delete(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/deleteresidentpost/${userId}/${selectedPostId}`);
      setIsDeleteModalVisible(false);
      setSelectedPostId(null);
      // refresh list: re-fetch from first page for consistency
      setPage(0);
      await fetchPosts(true);
    } catch (e) {
      // console.error('Failed to delete resident post:', e);
      setIsDeleteModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading && page === 0 ? (
        <View style={styles.loadingContainer}>
          <LottieView
            source={loadingAnimation}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : posts.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={loading && page > 0 ? renderLoadingMore() : null}
        />
      )}
      
      {/* Comment Modal */}
      {isCommentModalVisible && selectedPostId !== null && (
        <CommentModel
          isVisible={isCommentModalVisible}
          onClose={() => setCommentModalVisible(false)}
          postId={selectedPostId}
        />
      )}

      {/* Edit Post Modal */}
      {isEditModalVisible && selectedPost && (
        <EditPostModal
          visible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setSelectedPost(null);
            setSelectedPostId(null);
          }}
          onPostUpdated={() => {
            // Refresh posts after successful update
            setPage(0);
            fetchPosts(true);
          }}
          postId={selectedPost.id}
          initialCaption={selectedPost.caption || ''}
          initialPhotos={selectedPost.photos || []}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmActionModel
        isVisible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        message1={"Delete confirmation"}
        message2={"Do you want to delete this post?"}
        onConfirm={deleteResidentPost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
});

export default PostsRoute;