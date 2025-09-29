import AddPostModal from '../../components/pupUps/AddPostModal';
import CommentModel from '../../components/pupUps/CommentModel';
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, RefreshControl, Animated, FlatList, ActivityIndicator, Easing, SafeAreaView, StatusBar, Dimensions
} from 'react-native';
import Colors from '../../../assets/Colors';
import useHomeViewModel from '../../viewmodels/useHomeViewModel';
import LottieView from 'lottie-react-native';
import loadingAnimation from '../../../assets/animations/LoadingAnimatoion3.json';
// Refactored to MVVM: View-only. Logic moved to src/viewmodels/useHomeViewModel
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import PostCard from '../../components/PostCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
// Removed delete confirmation and axios here; delete is handled in PostsRoute only

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();

  const [buttonAnim] = useState(new Animated.Value(100));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [translateAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  const [isModalLoading, setIsModalLoading] = useState(false);
  const {
    isModalVisible,
    setIsModalVisible,
    isCommentModalVisible,
    selectedPostId,
    posts,
    loading,
    refreshing,
    onRefresh,
    loadMore,
    handleCommentPress,
    handleCloseCommentModal,
    refreshPosts,
    handleCommentsCountChange,
  } = useHomeViewModel();
  // Removed unused user info state

  // Animation values for header and content
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Start continuous pulse animation
    const startPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Start glow animation
    const startGlowAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulseAnimation();
    startGlowAnimation();
  }, []);

  // Data fetching handled by ViewModel

  // Removed unused user info effect

  // loadMore handled by ViewModel

  // Removed unused time formatting helper

  

  // Delete flow removed from HomeScreen

  

  const handleAddButtonPress = () => {
    // Beautiful press animation sequence
    Animated.parallel([
      // Scale down on press
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
      // Quick rotation
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Slide out
      Animated.timing(translateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Show modal immediately
      setIsModalVisible(true);
      
      // Reset scale for next press
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }).start();
    });
  };

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Image source={require('../../../assets/Icons/logo.png')} style={styles.headerLogo} resizeMode="contain" />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('Home Feed')}</Text>
          <Text style={styles.headerSubtitle}>{t('Stay connected with your community')}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.marketplaceButton}
            onPress={() => navigation.navigate('Marketplace')}
          >
            <MaterialCommunityIcons name="shopping-outline" size={24} color={Colors.LIGHT_PURPLE} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <Image source={require('../../../assets/Icons/postiCOn.png')} style={styles.emptyLogo} resizeMode="contain" />
      <Text style={styles.emptyTitle}>{t('No posts yet')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('Be the first to share something with your community')}
      </Text>
      <TouchableOpacity 
        style={styles.createPostButton}
        onPress={handleAddButtonPress}
      >
        <Text style={styles.createPostButtonText}>{t('Create Post')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderLoadingMore = () => (
    <View style={styles.loadingMore}>
      <ActivityIndicator size="small" color={Colors.LIGHT_PURPLE} />
      <Text style={styles.loadingMoreText}>{t('Loading more posts...')}</Text>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View style={{ position: 'relative' }}>
        <PostCard
          postId={item.id}
          user={item.user}
          group={item.group}
          postDateTime={item.postDateTime}
          caption={item.caption}
          photos={item.photos}
          reactions={item.reactions || []}
          comments={item.comments || []}
          commentsNumber={item.commentsNumber || 0}
          userReaction={item.userReaction}
          onLike={() => {}}
          onLongPressLike={() => {}}
          onComment={() => handleCommentPress(item.id)}
        />

        {/* Delete icon removed from HomeScreen */}
      </View>
    </Animated.View>
  );

  useFocusEffect(
    React.useCallback(() => {
      // Reset animation value
      buttonAnim.setValue(200);
      console.log('Add button animation triggered');
      // Run the animation - faster and more responsive
      Animated.spring(buttonAnim, {
        toValue: 0,
        delay: 0,
        friction: 15,
        tension: 50,
        useNativeDriver: true,
      }).start();
      return () => {
        // Cleanup if needed
      };
    }, [buttonAnim])
  );

  // Fallback: Ensure button is visible after mount if animation fails
  useEffect(() => {
    const timeout = setTimeout(() => {
      buttonAnim.stopAnimation((value) => {
        if (value !== 0) {
          buttonAnim.setValue(0);
          console.log('Fallback: Add button forced visible');
        }
      });
    }, 500); // Reduced from 1000ms to 500ms
    return () => clearTimeout(timeout);
  }, [buttonAnim]);

  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {renderHeader()}

      <View style={styles.content}>
        {loading && posts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <LottieView
              source={loadingAnimation}
              autoPlay
              loop
              style={styles.loadingAnimation}
            />
            <Text style={styles.loadingText}>{t('Loading your feed...')}</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id?.toString?.() ?? String(item?.id ?? Math.random())}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            bounces
            alwaysBounceVertical
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.LIGHT_PURPLE]}
                tintColor={Colors.LIGHT_PURPLE}
              />
            }
            ListEmptyComponent={renderEmptyState()}
            ListFooterComponent={loading && posts.length > 0 ? renderLoadingMore() : null}
            contentContainerStyle={[styles.listContent, posts.length === 0 && styles.listContentEmpty]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Floating Add Button with Beautiful Animation */}
      <Animated.View
        style={[
          styles.addButton, 
          { 
            transform: [
              { translateX: buttonAnim },
              { translateX: translateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200]
              })},
              { rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              })},
              { scale: scaleAnim },
            ],
            opacity: pulseAnim,
          }
        ]}
      >
        {/* Glow Effect */}
        <Animated.View 
          style={[
            styles.addButtonGlow,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
              transform: [{
                scale: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              }],
            }
          ]}
        />
        
        <TouchableOpacity 
          style={styles.addButtonInner}
          onPress={handleAddButtonPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.LIGHT_PURPLE, Colors.LIGHT_PURPLE]}
            style={styles.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isModalLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addText}>＋</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Modals */}
      <AddPostModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setIsModalLoading(false);
          // Beautiful reverse animation
          Animated.parallel([
            Animated.timing(translateAnim, {
              toValue: 0,
              duration: 300,
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 300,
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Bounce back effect
            Animated.sequence([
              Animated.timing(translateAnim, {
                toValue: -0.03,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.spring(translateAnim, {
                toValue: 0,
                tension: 200,
                friction: 8,
                useNativeDriver: true,
              }),
            ]).start();
          });
        }}
        onPostAdded={refreshPosts}
        onLoadingChange={setIsModalLoading}
      />
      {isCommentModalVisible && selectedPostId !== null && (
        <CommentModel
          isVisible={isCommentModalVisible}
          onClose={handleCloseCommentModal}
          postId={selectedPostId}
          refreshPosts={refreshPosts}
          onCommentsCountChange={handleCommentsCountChange}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    marginRight: 12,
  },
  headerLogo: {
    width: 36,
    height: 36,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerRight: {
    marginLeft: 12,
  },
  marketplaceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: 0,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
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
  emptyLogo: {
    width: 90,
    height: 90,
    marginBottom: 16,
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
    marginBottom: 24,
  },
  createPostButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.LIGHT_PURPLE,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  addButtonInner: {
    shadowColor: Colors.LIGHT_PURPLE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  addButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.LIGHT_PURPLE,
    opacity: 0.3,
    transform: [{ scale: 1 }],
  },
  addText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
 
  },
  addIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
});