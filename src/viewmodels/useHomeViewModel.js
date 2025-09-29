import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PostService } from '../services/post.service';

// Refactored to MVVM: ViewModel for HomeScreen
export default function useHomeViewModel() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 10;


  const fetchPosts = async (nextPage = 0, refreshingFlag = false) => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;
    if (refreshingFlag) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await PostService.getAllUserRelatedPosts(userId, nextPage, PAGE_SIZE);
      if (refreshingFlag || nextPage === 0) {
        setPosts(data.content);
        console.log('Posts fetched:', data.content);
      } else {
        setPosts(prev => [...prev, ...data.content]);
      }
      setHasMore(!data.last);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts(0);
  }, []);

  const onRefresh = () => fetchPosts(0, true);

  const loadMore = () => {
    if (!loading && hasMore) fetchPosts(page + 1);
  };

  const handleCommentPress = (postId) => {
    setSelectedPostId(postId);
    setIsCommentModalVisible(true);
  };

  const handleCloseCommentModal = () => {
    setIsCommentModalVisible(false);
    setSelectedPostId(null);
  };

  const refreshPosts = () => fetchPosts(0, true);

  const handleCommentsCountChange = (updatedPostId, delta) => {
    setPosts(prevPosts => prevPosts.map(p => (
      p.id === updatedPostId
        ? { ...p, commentsNumber: (p.commentsNumber || 0) + delta }
        : p
    )));
  };

  return {
    // state
    isModalVisible,
    isCommentModalVisible,
    selectedPostId,
    posts,
    loading,
    refreshing,
    page,
    hasMore,
    PAGE_SIZE,

    // actions
    setIsModalVisible,
    onRefresh,
    loadMore,
    handleCommentPress,
    handleCloseCommentModal,
    refreshPosts,
    handleCommentsCountChange,
  };
}


