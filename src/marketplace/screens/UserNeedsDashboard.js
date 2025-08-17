import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../assets/Colors';
import { getNeedsByUser, archiveNeed, unArchiveNeed, extendNeedEndDate } from '../../services/marketplaceNeed.service';


export default function UserNeedsDashboard() {
  const navigation = useNavigation();
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actingId, setActingId] = useState(null);

  // Date-time picker state for extend/unarchive flows
  const [pickerVisibleFor, setPickerVisibleFor] = useState(null); // 'extend' | 'unarchive' | null
  const [pickerNeed, setPickerNeed] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserNeeds(true);
    }
  }, [userId]);

  const loadUserId = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    } catch (err) {
      console.error('Failed to load user ID:', err);
      Alert.alert('Error', 'Failed to load user information');
    }
  };

  const fetchUserNeeds = async (resetPage = true) => {
    if (!userId) return;
    
    if (resetPage) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    }
    
    try {
      const pageToFetch = resetPage ? 0 : page;
      const resp = await getNeedsByUser(userId, pageToFetch, 10);
      
      if (resp?.data) {
        const needsData = resp.data.content || [];
        
        if (resetPage) {
          setNeeds(needsData);
        } else {
          setNeeds(prev => [...prev, ...needsData]);
        }
        
        const isLastPage = resp.data.last === true || needsData.length === 0;
        setHasMore(!isLastPage);
      } else {
        if (resetPage) {
          setNeeds([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching user needs:', err);
      if (resetPage) {
        setNeeds([]);
      }
      setHasMore(false);
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
      const resp = await getNeedsByUser(userId, nextPage, 10);
      
      if (resp?.data) {
        const needsData = resp.data.content || [];
        setNeeds(prev => [...prev, ...needsData]);
        setPage(nextPage);
        
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
    fetchUserNeeds(true);
  };

  const handleEditNeed = (Need) => {
    navigation.navigate('EditNeed', { Need });
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
    const isActive = Boolean(item.isActive);
    return (
      <View style={styles.needCard}>
        {/* Header: Need info */}
        <View style={styles.header}>
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.needTitle} numberOfLines={2}>
                {item.needTitle || 'Need'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusBadgeText}>{String(item.status || '').toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.time}>
              {item.createdAt ? `Posted ${item.createdAt}` : 'Recently posted'}
            </Text>
          </View>
        </View>

        {/* Description */}
        {item.description ? (
          <View style={styles.contentContainer}>
            <Text style={styles.needDescription} numberOfLines={3}>
              {item.description}
            </Text>
          </View>
        ) : null}

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

           
          {/* Edit is always present */}
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => handleEditNeed(item)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="pencil" size={16} color={Colors.WHITE} />
            <Text style={styles.primaryButtonText}>Edit</Text>
          </TouchableOpacity>

          {/* Conditional actions */}
          {!isActive ? (
            // Inactive: only Unarchive
            <TouchableOpacity
              style={styles.secondaryButton}
              disabled={actingId === item.id}
              onPress={() => handleUnarchiveFlow(item)}
            >
              {actingId === item.id ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <MaterialCommunityIcons name="archive-arrow-up" size={16} color="#6B7280" />
              )}
              <Text style={styles.secondaryButtonText}>Unarchive</Text>
            </TouchableOpacity>
          ) : (
            // Active: Extend and Archive
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                disabled={actingId === item.id}
                onPress={() => openPicker('extend', item)}
              >
                <MaterialCommunityIcons name="calendar-plus" size={16} color="#6B7280" />
                <Text style={styles.secondaryButtonText}>Extend End Date</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerButton}
                disabled={actingId === item.id}
                onPress={() => handleArchive(item)}
              >
                {actingId === item.id ? (
                  <ActivityIndicator size="small" color={Colors.WHITE} />
                ) : (
                  <MaterialCommunityIcons name="archive" size={16} color={Colors.WHITE} />
                )}
                <Text style={styles.dangerButtonText}>Archive</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const openPicker = (action, item) => {
    setPickerVisibleFor(action);
    setPickerNeed(item);
    const initial = (() => {
      const candidate = item?.needDayEnd || item?.NeedDayEnd;
      const d = candidate ? new Date(candidate) : new Date();
      return d.getTime() > Date.now() ? d : new Date(Date.now() + 5 * 60 * 1000);
    })();
    setTempDate(initial);
    setShowDatePicker(true);
  };

  const handleUnarchiveFlow = (item) => {
    const candidate = item?.needDayEnd || item?.NeedDayEnd;
    const d = candidate ? new Date(candidate) : null;
    const isPassed = d ? d.getTime() <= Date.now() : true;

    if (isPassed) {
      // Ask user to extend using picker
      openPicker('unarchive', item);
      return;
    }
    // Not passed: proceed with current end date
    Alert.alert(
      'Unarchive Need',
      'Do you want to unarchive this need?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unarchive',
          onPress: async () => {
            try {
              setActingId(item.id);
              const body = { extendedEndDate: new Date(candidate).toISOString() };
              await unArchiveNeed(item.id, body);
              Alert.alert('Success', 'Need unarchived successfully');
              fetchUserNeeds(true);
            } catch (e) {
              console.error('Unarchive error', e);
              Alert.alert('Error', 'Failed to unarchive need');
            } finally {
              setActingId(null);
            }
          },
        },
      ]
    );
  };

  const handleArchive = (item) => {
    Alert.alert(
      'Archive Need',
      'Are you sure you want to archive this need?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              setActingId(item.id);
              await archiveNeed(item.id);
              Alert.alert('Archived', 'Need archived successfully');
              fetchUserNeeds(true);
            } catch (e) {
              console.error('Archive error', e);
              Alert.alert('Error', 'Failed to archive need');
            } finally {
              setActingId(null);
            }
          },
        },
      ]
    );
  };

  const onDateChange = (event, selectedDate) => {
    if (event?.type === 'dismissed') {
      setShowDatePicker(false);
      setPickerVisibleFor(null);
      setPickerNeed(null);
      return;
    }
    if (selectedDate) {
      const merged = new Date(tempDate);
      merged.setFullYear(selectedDate.getFullYear());
      merged.setMonth(selectedDate.getMonth());
      merged.setDate(selectedDate.getDate());
      setTempDate(merged);
      setShowDatePicker(false);
      setShowTimePicker(true);
    }
  };

  const onTimeChange = async (event, selectedTime) => {
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
    setTempDate(merged);
    setShowTimePicker(false);

    try {
      setActingId(pickerNeed.id);
      const body = { extendedEndDate: merged.toISOString() };
      if (pickerVisibleFor === 'extend') {
        await extendNeedEndDate(pickerNeed.id, body);
        Alert.alert('Success', 'End date extended');
      } else if (pickerVisibleFor === 'unarchive') {
        await unArchiveNeed(pickerNeed.id, body);
        Alert.alert('Success', 'Need unarchived');
      }
      fetchUserNeeds(true);
    } catch (e) {
      console.error('Action error', e);
      Alert.alert('Error', 'Operation failed');
    } finally {
      setActingId(null);
      setPickerVisibleFor(null);
      setPickerNeed(null);
    }
  };

  if (loading && needs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your needs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="arrow-left" size={20} color={Colors.LIGHT_PURPLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Needs</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddNeed')}
        >
          <FontAwesome name="plus" size={20} color={Colors.LIGHT_PURPLE} />
        </TouchableOpacity>
      </View>

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
                You haven't posted any needs yet. Tap the + button to create your first need!
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => navigation.navigate('AddNeed')}
              >
                <FontAwesome name="plus" size={16} color={Colors.WHITE} />
                <Text style={styles.createFirstButtonText}>Create Your First Need</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Date-Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          is24Hour
          display="default"
          onChange={onTimeChange}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    padding: 8,
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
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  needTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  needDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
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
    flexWrap: 'wrap',
    gap: 8,
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
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  dangerButtonText: {
    fontSize: 13,
    color: Colors.WHITE,
    fontWeight: '500',
    marginLeft: 4,
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
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.LIGHT_PURPLE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createFirstButtonText: {
    color: Colors.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
