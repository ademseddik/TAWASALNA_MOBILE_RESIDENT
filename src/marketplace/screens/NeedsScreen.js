import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView, Image, Animated, Modal, TouchableWithoutFeedback, TextInput } from 'react-native';
import { getNeedsByCommunity, checkForMatchingServices } from '../../services/marketplaceNeed.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../assets/Colors';
import { BlurView } from 'expo-blur';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { AntDesign } from 'react-native-vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useNavigation } from '@react-navigation/native';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function NeedsScreen() {
  const navigation = useNavigation();
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // User and pagination states
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(0); // backend pages are 0-indexed
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filter states

  const [searchTitle, setSearchTitle] = useState('');
  const [showSearch, setShowSearch] = useState(false);


  // Animation states
  const [selectedNeed, setSelectedNeed] = useState(null);
  
  const animation = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  
  // Matching services states
  const [matchingServices, setMatchingServices] = useState([]);
  const [showMatchingServices, setShowMatchingServices] = useState(false);

  const handleSendMessagePress = async (userId,needID,fullName,profilePic) => {
    try {
      const currentUserId = await AsyncStorage.getItem("userId");
      if (!currentUserId) {
        return;
      }
      
      const otherUserId = userId;

      // Create chatId by sorting user IDs and joining with underscore
      const ids = [currentUserId, otherUserId].sort();
      const chatId = ids.join('_');
      
      // Extract user IDs for the conversation screen
      const user1ID = ids[0];
      const user2ID = ids[1];

      console.log('🚀 service screen navigation to conversation:', {
        chatId,
        user1ID,
        user2ID,
        needId: needID,
        userName: fullName
      });

      navigation.navigate('Conversation', {
        chatId: chatId,
        userName: fullName,
        userImage: profilePic,
        user1ID: user1ID,
        user2ID: user2ID,
        needId: needID,
      });
    } catch (error) {
      console.error("Failed to navigate to conversation:", error);
    }
  };

  // Load user ID on component mount
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        setUserId(id);
      } catch (err) {
        console.error('Failed to load user ID:', err);
      }
    };
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      const timer = setTimeout(() => {
        fetchNeeds(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const fetchNeeds = async (resetPage = true) => {
    // Prevent multiple simultaneous calls
    if (loading && resetPage) return;
    if (!userId) return;
    if (resetPage) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    }
    
    
    try {
      const pageToFetch = resetPage ? 0 : page;
      
      // Add timeout to prevent hanging API calls
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const resp = await Promise.race([
        getNeedsByCommunity(userId, pageToFetch, 10),
        timeoutPromise
      ]);
      
      // Check if response has the expected structure
      if (resp && resp.data) {
        const needsData = resp.data.content || [];
        
        if (resetPage) {
          setNeeds(needsData);
        } else {
          setNeeds(prev => [...prev, ...needsData]);
        }
        
        // Check if there are more pages
        const isLastPage = resp.data.last === true || needsData.length === 0;
        setHasMore(!isLastPage);
      } else {
        // If no data structure, treat as empty
        if (resetPage) {
          setNeeds([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching needs:', err);
      
      // For testing purposes, add some mock data if API fails
      if (resetPage) {
        const mockNeeds = [
          {
            id: 1,
            title: 'House Cleaning Service Needed',
            description: 'Looking for a reliable house cleaning service for a 3-bedroom apartment. Need deep cleaning including kitchen, bathrooms, and living areas.',
            budget: 150,
            priority: 'medium',
            status: 'open',
            timeline: 'within_week',
            location: 'Downtown Area',
            createdAt: new Date().toISOString(),
            images: ['https://via.placeholder.com/300x200?text=Cleaning']
          },
          {
            id: 2,
            title: 'IT Support for Small Business',
            description: 'Need IT support for setting up network infrastructure and computer systems for a new office.',
            budget: 500,
            priority: 'high',
            status: 'open',
            timeline: 'asap',
            location: 'Business District',
            createdAt: new Date().toISOString(),
            images: ['https://via.placeholder.com/300x200?text=IT+Support']
          },
          {
            id: 3,
            title: 'Event Planning for Wedding',
            description: 'Looking for an experienced event planner to help organize our wedding ceremony and reception.',
            budget: 2000,
            priority: 'medium',
            status: 'open',
            timeline: 'within_month',
            location: 'City Center',
            createdAt: new Date().toISOString(),
            images: ['https://via.placeholder.com/300x200?text=Wedding']
          }
        ];
        setNeeds(mockNeeds);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreNeeds = async () => {
    if (!hasMore || loadingMore || loading) return;
    if (!userId) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const resp = await getNeedsByCommunity(userId, nextPage, 10);
      
      if (resp && resp.data) {
        const needsData = resp.data.content || [];
        setNeeds(prev => [...prev, ...needsData]);
        setPage(nextPage);
        
        // Check if there are more pages
        const isLastPage = resp.data.last === true || needsData.length === 0;
        setHasMore(!isLastPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more needs:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    fetchNeeds(true);
  };

  const getNeedImages = (need) => {
    // Backend example does not include images; return placeholder
    return [{ uri: 'https://via.placeholder.com/600x400?text=Need' }];
  };

  

  const getStatusColor = (status) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'OPEN':
      case 'SEARCHING':
        return '#2196F3';
      case 'IN_PROGRESS':
        return '#FFC107';
      case 'COMPLETED':
      case 'FULFILLED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#9E9E9E';
      case 'EXPIRED':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderNeedItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <View style={styles.needCard}>
        {/* Header: Publisher info */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: item.publisher?.image || 'https://via.placeholder.com/40' }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.publisherName}>{item.publisher?.name || 'Unknown'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusBadgeText}>{String(item.status || '').toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.time}>
              {item.createdAt ? `Posted ${item.createdAt}` : 'Recently posted'}
            </Text>
          </View>
        </View>

        {/* Title and Description */}
        <View style={styles.contentContainer}>
          <Text style={styles.needTitle} numberOfLines={2}>
            {item.needTitle || 'Need'}
          </Text>
          {item.description ? (
            <Text style={styles.needDescription} numberOfLines={3}>
              {item.description}
            </Text>
          ) : null}
        </View>

        {/* Meta Information: Budget and Timeline */}
        <View style={styles.metaContainer}>
                     <View style={styles.metaItem}>
             <View style={styles.metaIconContainer}>
               <MaterialCommunityIcons name="currency-usd" size={16} color="#6B7280" />
             </View>
            <View style={styles.metaContent}>
              <Text style={styles.metaLabel}>Budget</Text>
              <Text style={styles.metaValue}>
                {item.minPrice == null && item.maxPrice == null
                  ? 'Negotiable'
                  : `${item.minPrice != null ? `$${item.minPrice}` : ''}${item.minPrice != null && item.maxPrice != null ? ' - ' : ''}${item.maxPrice != null ? `$${item.maxPrice}` : ''}`}
              </Text>
            </View>
          </View>
          
          <View style={styles.metaDivider} />
          
                     <View style={styles.metaItem}>
             <View style={styles.metaIconContainer}>
               <MaterialCommunityIcons name="calendar-clock" size={16} color="#6B7280" />
             </View>
            <View style={styles.metaContent}>
              <Text style={styles.metaLabel}>Timeline</Text>
              <Text style={styles.metaValue}>
                {item.needDayStart && item.needDayEnd
                  ? `${item.needDayStart} → ${item.needDayEnd}`
                  : item.needDayStart || item.needDayEnd || 'Flexible'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => handleSendMessagePress(item.publisher.publisherId, item.id, item.publisher.name, item.publisher.image)} 
          >
            
            <AntDesign name="message1" size={16} color={Colors.WHITE} />
            <Text style={styles.primaryButtonText}>Send Offer To {item.publisher?.name}</Text>
          </TouchableOpacity>
          
       
        </View>
      </View>
    );
  };

  const fetchMatchingServices = async (needId) => {
    try {
      const resp = await checkForMatchingServices(userId, needId);
      setMatchingServices(resp.data || []);
    } catch (err) {
      console.error('Error fetching matching services:', err);
      setMatchingServices([]);
    }
  };

  

  const renderNeedDetailModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setModalVisible(false);
        Animated.parallel([
          Animated.timing(animation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(blurAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }}
    >
      <AnimatedBlurView
        intensity={blurAnim}
        style={styles.blurOverlay}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.needDetailModal}>
                {selectedNeed && (
                  <>
                    <View style={styles.detailHeader}>
                      <Text style={styles.detailTitle}>{selectedNeed.needTitle || 'Need'}</Text>
                      <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <FontAwesome name="times" size={20} color={Colors.text} />
                      </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.detailContent}>
                      <View style={styles.detailImages}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {getNeedImages(selectedNeed).map((image, index) => (
                            <Image key={index} source={image} style={styles.detailImage} />
                          ))}
                        </ScrollView>
                      </View>
                      
                      <View style={styles.detailInfo}>
                        <Text style={styles.detailDescription}>{selectedNeed.description}</Text>
                        
                        <View style={styles.detailMeta}>
                          <View style={styles.detailStatus}>
                            <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedNeed.status) }]}>
                              <Text style={styles.detailStatusText}>{String(selectedNeed.status || '').toUpperCase()}</Text>
                            </View>
                          </View>
                        </View>
                        
                        <View style={styles.detailSpecs}>
                          <View style={styles.detailSpec}>
                            <Text style={styles.detailSpecLabel}>Budget</Text>
                            <Text style={styles.detailSpecValue}>
                              {selectedNeed.minPrice == null && selectedNeed.maxPrice == null
                                ? 'Negotiable'
                                : `${selectedNeed.minPrice != null ? `$${selectedNeed.minPrice}` : ''}${selectedNeed.minPrice != null && selectedNeed.maxPrice != null ? ' - ' : ''}${selectedNeed.maxPrice != null ? `$${selectedNeed.maxPrice}` : ''}`}
                            </Text>
                          </View>
                          <View style={styles.detailSpec}>
                            <Text style={styles.detailSpecLabel}>Timeline</Text>
                            <Text style={styles.detailSpecValue}>
                              {selectedNeed.needDayStart && selectedNeed.needDayEnd
                                ? `${selectedNeed.needDayStart} → ${selectedNeed.needDayEnd}`
                                : selectedNeed.needDayStart || selectedNeed.needDayEnd || 'Flexible'}
                            </Text>
                          </View>
                          <View style={styles.detailSpec}>
                            <Text style={styles.detailSpecLabel}>Publisher</Text>
                            <Text style={styles.detailSpecValue}>{selectedNeed.publisher?.name || 'Unknown'}</Text>
                          </View>
                        </View>
                        
                        {selectedNeed.features && selectedNeed.features.length > 0 && (
                          <View style={styles.detailFeatures}>
                            <Text style={styles.detailFeaturesTitle}>Requirements</Text>
                            <View style={styles.detailFeaturesList}>
                              {selectedNeed.features.map((feature, index) => (
                                <View key={index} style={styles.detailFeatureItem}>
                                  <FontAwesome name="check" size={12} color={Colors.primary} />
                                  <Text style={styles.detailFeatureText}>{feature}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    </ScrollView>
                    
                    <View style={styles.detailActions}>
                      <TouchableOpacity 
                        style={styles.detailQuoteButton}
                        onPress={() => {
                          setModalVisible(false);
                          fetchMatchingServices(selectedNeed.id);
                          setShowMatchingServices(true);
                        }}
                      >
                        <Text style={styles.detailQuoteButtonText}>Send Quote</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.detailContactButton}>
                        <MaterialCommunityIcons name="message" size={20} color={Colors.primary} />
                        <Text style={styles.detailContactButtonText}>Contact Client</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </AnimatedBlurView>
    </Modal>
  );

  const renderMatchingServicesModal = () => (
    <Modal
      visible={showMatchingServices}
      transparent
      animationType="slide"
      onRequestClose={() => setShowMatchingServices(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.matchingServicesModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Matching Services</Text>
            <TouchableOpacity onPress={() => setShowMatchingServices(false)}>
              <FontAwesome name="times" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {matchingServices.length > 0 ? (
              matchingServices.map((service, index) => (
                <View key={index} style={styles.matchingServiceItem}>
                  <Image
                    source={{ uri: service.image || 'https://via.placeholder.com/60' }}
                    style={styles.matchingServiceImage}
                  />
                  <View style={styles.matchingServiceInfo}>
                    <Text style={styles.matchingServiceTitle}>{service.title}</Text>
                    <Text style={styles.matchingServicePrice}>${service.price}</Text>
                    <Text style={styles.matchingServiceDescription} numberOfLines={2}>
                      {service.description}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.selectServiceButton}>
                    <Text style={styles.selectServiceButtonText}>Select</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.noMatchingServices}>
                <MaterialCommunityIcons name="briefcase-off" size={64} color={Colors.lightGray} />
                <Text style={styles.noMatchingServicesText}>No matching services found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading && needs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading needs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
             {/* Header */}
       <View style={styles.header}>
         {/* Header Title */}
         <View style={styles.headerContainer}>
           <Text style={styles.headerTitle}>
             All Community Needs
           </Text>
           <Text style={styles.headerSubtitle}>
             {needs.length > 0 ? `${needs.length} need${needs.length !== 1 ? 's' : ''} found` : 'No needs found'}
           </Text>
         </View>
        

 
      </View>
          {/* Action Buttons Row - All buttons in same line with responsive gaps */}
          <View style={styles.actionButtonsContainer}>
            {/* Add Need Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.addNeedButton]}
              onPress={() => navigation.navigate('AddNeed')}
              activeOpacity={0.7}
            >
              <FontAwesome name="plus" size={16} color={Colors.LIGHT_PURPLE} style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>Add Need</Text>
            </TouchableOpacity>
            
            {/* My Needs Dashboard Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.myNeedsButton]}
              onPress={() => navigation.navigate('UserNeedsDashboard')}
              activeOpacity={0.7}
            >
              <FontAwesome name="list" size={16} color={Colors.LIGHT_PURPLE} style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>My Needs</Text>
            </TouchableOpacity>
            
            {/* Search Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.searchButton, showSearch && styles.activeButton]}
              onPress={() => setShowSearch(v => !v)}
              activeOpacity={0.7}
            >
              <FontAwesome name="search" size={18} color={showSearch ? '#fff' : Colors.LIGHT_PURPLE} />
            </TouchableOpacity>
          </View>
        
        {/* Search UI */}
        {showSearch && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginTop: 4, alignItems: 'center', marginBottom: 4 }}>
            <TextInput
              placeholder="Search needs..."
              value={searchTitle}
              onChangeText={setSearchTitle}
              style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#eee' }}
            />
            <TouchableOpacity
              onPress={() => fetchNeeds(true)}
              style={{ marginLeft: 8, backgroundColor: Colors.LIGHT_PURPLE, borderRadius: 8, padding: 8 }}
            >
              <FontAwesome name="search" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchTitle('');
                fetchNeeds(true);
              }}
              style={{ marginLeft: 4, padding: 8 }}
            >
              <FontAwesome name="close" size={18} color={Colors.LIGHT_PURPLE} />
            </TouchableOpacity>
          </View>
        )}
      {/* Needs List */}
      <FlatList
        data={needs}
        renderItem={renderNeedItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.needsList}
        onEndReached={loadMoreNeeds}
        onEndReachedThreshold={0.1}
        refreshing={loading}
        onRefresh={onRefresh}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingMoreText}>Loading more needs...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text" size={64} color={Colors.lightGray} />
              <Text style={styles.emptyTitle}>No Needs Found</Text>
              <Text style={styles.emptyText}>
                There are no needs available at the moment
              </Text>
            </View>
          )
        }
      />

      {/* Modals */}
 
      {renderNeedDetailModal()}
      {renderMatchingServicesModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    width:'90%',
    borderBottomColor: '#F3F4F6',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginTop:12,
    marginHorizontal: 12,
    width:'94%',
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.LIGHT_PURPLE,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  needsList: {
    padding: 8,
  },
  needCard: {
    backgroundColor: Colors.WHITE,
    marginHorizontal: 6,
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
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  needImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 12,
  },
  priorityContainer: {
    alignSelf: 'flex-start',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusContainer: {
    alignSelf: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  needInfo: {
    padding: 16,
  },
  needTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  needDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  needMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  budgetRangeText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priorityOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.lightGray,
  },
  selectedPriority: {
    backgroundColor: Colors.primary,
  },
  priorityOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedPriorityText: {
    color: Colors.white,
  },
  statusOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.lightGray,
  },
  selectedStatus: {
    backgroundColor: Colors.primary,
  },
  statusOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedStatusText: {
    color: Colors.white,
  },
  timelineOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.lightGray,
  },
  selectedTimeline: {
    backgroundColor: Colors.primary,
  },
  timelineOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedTimelineText: {
    color: Colors.white,
  },
  filterActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: Colors.text,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  needDetailModal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: 16,
  },
  detailContent: {
    maxHeight: 400,
  },
  detailImages: {
    height: 200,
  },
  detailImage: {
    width: 200,
    height: 200,
    marginRight: 8,
  },
  detailInfo: {
    padding: 16,
  },
  detailDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  detailMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailPriority: {
    alignItems: 'flex-start',
  },
  detailPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailPriorityText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailStatus: {
    alignItems: 'flex-end',
  },
  detailStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailStatusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailSpecs: {
    marginBottom: 16,
  },
  detailSpec: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailSpecLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailSpecValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  detailFeatures: {
    marginTop: 16,
  },
  detailFeaturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  detailFeaturesList: {
    gap: 8,
  },
  detailFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailFeatureText: {
    fontSize: 14,
    color: Colors.text,
  },
  detailActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  detailQuoteButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailQuoteButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    gap: 4,
  },
  detailContactButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  matchingServicesModal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalContent: {
    padding: 16,
  },
  matchingServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  matchingServiceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  matchingServiceInfo: {
    flex: 1,
  },
  matchingServiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  matchingServicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  matchingServiceDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  selectServiceButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectServiceButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  noMatchingServices: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noMatchingServicesText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    
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
  publisherName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaIconContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 6,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContent: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: Colors.LIGHT_PURPLE,
  },
  primaryButtonText: {
    fontSize: 13,
    color: Colors.WHITE,
    fontWeight: '500',
    marginLeft: 4,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  secondaryButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  // Action Buttons Styles
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 4,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.LIGHT_PURPLE,
    elevation: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
   
  },
  addNeedButton: {
    flex: 2,
    paddingHorizontal: 13,
  },
  myNeedsButton: {
    flex: 2,
    paddingHorizontal: 20,
  },
  searchButton: {
    flex: 1,
    paddingHorizontal: 8,
  },
  activeButton: {
    backgroundColor: Colors.LIGHT_PURPLE,
    elevation: 2,
  },
  actionButtonText: {
    color: Colors.LIGHT_PURPLE,
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 