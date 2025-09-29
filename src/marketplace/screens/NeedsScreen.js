import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, ScrollView, Image, Animated, Modal, TouchableWithoutFeedback, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import useNeedsViewModel from '../../viewmodels/useNeedsViewModel';
import Colors from '../../../assets/Colors';
import { BlurView } from 'expo-blur';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { AntDesign } from 'react-native-vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function NeedsScreen() {
  const navigation = useNavigation();
  const {
    needs,
    loading,
    loadingMore,
    onRefresh,
    loadMoreNeeds,
    hasMore,
    userId,
    searchTitle,
    setSearchTitle,
    selectedNeed,
    setSelectedNeed,
    modalVisible,
    setModalVisible,
    matchingServices,
    showMatchingServices,
    setShowMatchingServices,
    pickerVisibleFor,
    setPickerVisibleFor,
    pickerNeed,
    setPickerNeed,
    tempDate,
    setTempDate,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    archivingId,
    extendingId,
    fetchNeeds,
    fetchMatchingServicesVM,
    extendNeed,
    archiveNeedVM,
  } = useNeedsViewModel();
  const [showSearch, setShowSearch] = React.useState(false);

  // Debounce search to avoid too many API calls
  const searchTimeoutRef = useRef(null);
  
  const handleSearchChange = useCallback((text) => {
    setSearchTitle(text);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      fetchNeeds(true);
    }, 500); // 500ms debounce
  }, [setSearchTitle, fetchNeeds]);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // Auto-refresh when returning from AddNeed screen
  useFocusEffect(
    useCallback(() => {
      const checkAndRefresh = async () => {
        try {
          const shouldRefresh = await AsyncStorage.getItem('shouldRefreshNeeds');
          if (shouldRefresh === 'true') {
            await AsyncStorage.removeItem('shouldRefreshNeeds');
            if (userId) {
              fetchNeeds(true);
            }
          }
        } catch (error) {
          console.error('Error checking refresh flag:', error);
        }
      };
      
      checkAndRefresh();
    }, [userId, fetchNeeds])
  );

  // Animation states
  const animation = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(0)).current;

  const handleSendMessagePress = (otherUserId, needID, fullName, profilePic) => {
    try {
      if (!userId) return;
      const ids = [String(userId), String(otherUserId)].sort();
      const chatId = ids.join('_');
      const user1ID = ids[0];
      const user2ID = ids[1];
      navigation.navigate('Conversation', {
        chatId,
        userName: fullName,
        userImage: profilePic,
        user1ID,
        user2ID,
        needId: needID,
      });
    } catch (error) {}
  };

  // ViewModel handles userId and initial fetch

  // ViewModel fetches needs

  // ViewModel handles pagination

  // ViewModel onRefresh

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
    const isOwner = String(item?.publisher?.publisherId) === String(userId);
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
              {isOwner && (
                <View style={styles.ownerBadgeSmall}>
                  <Text style={styles.ownerBadgeSmallText}>Yours</Text>
                </View>
              )}
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
          {isOwner ? (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('EditNeed', { Need: item })}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil" size={16} color={Colors.WHITE} />
                <Text style={styles.primaryButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.7}
                disabled={extendingId === item.id || archivingId === item.id}
                onPress={() => {
                  setPickerVisibleFor('extend');
                  setPickerNeed(item);
                  const initial = (() => {
                    const candidate = item?.needDayEnd || item?.NeedDayEnd;
                    const d = candidate ? new Date(candidate) : new Date();
                    return d.getTime() > Date.now() ? d : new Date(Date.now() + 5 * 60 * 1000);
                  })();
                  setTempDate(initial);
                  setShowDatePicker(true);
                }}
              >
                {extendingId === item.id ? (
                  <ActivityIndicator size="small" color="#6B7280" />
                ) : (
                  <MaterialCommunityIcons name="calendar-plus" size={16} color="#6B7280" />
                )}
                <Text style={styles.secondaryButtonText}>Extend</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerButton}
                activeOpacity={0.7}
                disabled={archivingId === item.id || extendingId === item.id}
                onPress={async () => {
                  try {
                    setArchivingId(item.id);
                    await archiveNeed(item.id);
                    // Remove from list or mark inactive
                    setNeeds(prev => prev.map(n => n.id === item.id ? { ...n, isActive: false } : n));
                  } catch (e) {}
                  finally { setArchivingId(null); }
                }}
              >
                {archivingId === item.id ? (
                  <ActivityIndicator size="small" color={Colors.WHITE} />
                ) : (
                  <MaterialCommunityIcons name="archive" size={16} color={Colors.WHITE} />
                )}
                <Text style={styles.dangerButtonText}>Archive</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => handleSendMessagePress(item.publisher.publisherId, item.id, item.publisher.name, item.publisher.image)} 
            >
              <AntDesign name="message1" size={16} color={Colors.WHITE} />
              <Text style={styles.primaryButtonText}>Send Offer To {item.publisher?.name}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ViewModel handles matching services

  

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
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={styles.detailTitle} numberOfLines={1}>{selectedNeed.needTitle || 'Need'}</Text>
                        {String(selectedNeed?.publisher?.publisherId) === String(userId) && (
                          <View style={styles.ownerBadgeSmall}>
                            <Text style={styles.ownerBadgeSmallText}>Yours</Text>
                          </View>
                        )}
                      </View>
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
                      {String(selectedNeed?.publisher?.publisherId) === String(userId) ? (
                        <>
                          <TouchableOpacity 
                            style={styles.detailContactButton}
                            onPress={() => navigation.navigate('EditNeed', { Need: selectedNeed })}
                          >
                            <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
                            <Text style={styles.detailContactButtonText}>Edit</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.detailContactButton}
                            disabled={extendingId === selectedNeed.id || archivingId === selectedNeed.id}
                            onPress={() => {
                              setPickerVisibleFor('extend');
                              setPickerNeed(selectedNeed);
                              const initial = (() => {
                                const candidate = selectedNeed?.needDayEnd || selectedNeed?.NeedDayEnd;
                                const d = candidate ? new Date(candidate) : new Date();
                                return d.getTime() > Date.now() ? d : new Date(Date.now() + 5 * 60 * 1000);
                              })();
                              setTempDate(initial);
                              setShowDatePicker(true);
                            }}
                          >
                            {extendingId === selectedNeed.id ? (
                              <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                              <MaterialCommunityIcons name="calendar-plus" size={20} color={Colors.primary} />
                            )}
                            <Text style={styles.detailContactButtonText}>Extend</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.detailContactButton}
                            onPress={async () => {
                              try {
                                setArchivingId(selectedNeed.id);
                                await archiveNeed(selectedNeed.id);
                                setNeeds(prev => prev.map(n => n.id === selectedNeed.id ? { ...n, isActive: false } : n));
                                setModalVisible(false);
                              } catch (e) {}
                              finally { setArchivingId(null); }
                            }}
                          >
                            {archivingId === selectedNeed.id ? (
                              <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                              <MaterialCommunityIcons name="archive" size={20} color={Colors.primary} />
                            )}
                            <Text style={styles.detailContactButtonText}>Archive</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity 
                            style={styles.detailQuoteButton}
                            onPress={() => {
                              setModalVisible(false);
                              fetchMatchingServicesVM(selectedNeed.id);
                              setShowMatchingServices(true);
                            }}
                          >
                            <Text style={styles.detailQuoteButtonText}>Send Quote</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.detailContactButton}>
                            <MaterialCommunityIcons name="message" size={20} color={Colors.primary} />
                            <Text style={styles.detailContactButtonText}>Contact Client</Text>
                          </TouchableOpacity>
                        </>
                      )}
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
              onChangeText={handleSearchChange}
              style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#eee' }}
            />
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchTitle('');
                fetchNeeds(true);
              }}
              style={{ marginLeft: 8, padding: 8 }}
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
      {/* Date-Time Pickers for Extend */}
      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (event?.type === 'dismissed') {
              setShowDatePicker(false);
              setPickerVisibleFor(null);
              setPickerNeed(null);
              return;
            }
            if (!selectedDate) return;
            const merged = new Date(tempDate);
            merged.setFullYear(selectedDate.getFullYear());
            merged.setMonth(selectedDate.getMonth());
            merged.setDate(selectedDate.getDate());
            setTempDate(merged);
            setShowDatePicker(false);
            setShowTimePicker(true);
          }}
          minimumDate={new Date()}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          is24Hour
          display="default"
          onChange={async (event, selectedTime) => {
            if (event?.type === 'dismissed') {
              setShowTimePicker(false);
              setPickerVisibleFor(null);
              setPickerNeed(null);
              return;
            }
            if (!selectedTime || !pickerNeed || !pickerVisibleFor) return;
            const merged = new Date(tempDate);
            merged.setHours(selectedTime.getHours());
            merged.setMinutes(selectedTime.getMinutes());
            merged.setSeconds(0);
            merged.setMilliseconds(0);
            await extendNeed(pickerNeed, merged);
            setShowTimePicker(false);
            setPickerVisibleFor(null);
            setPickerNeed(null);
          }}
        />
      )}
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
  ownerBadgeSmall: {
    backgroundColor: Colors.LIGHT_PURPLE,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    alignSelf: 'center',
  },
  ownerBadgeSmallText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.LIGHT_PURPLE,
    minHeight: 36,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius:20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 36,
  },
  secondaryButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.RED,
    minHeight: 36,
  },
  dangerButtonText: {
    fontSize: 13,
    color: Colors.WHITE,
    fontWeight: '600',
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