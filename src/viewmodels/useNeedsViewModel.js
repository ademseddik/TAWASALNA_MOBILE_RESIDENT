import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNeedsByCommunity, checkForMatchingServices, archiveNeed, extendNeedEndDate } from '../services/marketplaceNeed.service';

// Refactored to MVVM: ViewModel for NeedsScreen
export default function useNeedsViewModel() {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchTitle, setSearchTitle] = useState('');

  const [selectedNeed, setSelectedNeed] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [matchingServices, setMatchingServices] = useState([]);
  const [showMatchingServices, setShowMatchingServices] = useState(false);
  const [pickerVisibleFor, setPickerVisibleFor] = useState(null);
  const [pickerNeed, setPickerNeed] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [archivingId, setArchivingId] = useState(null);
  const [extendingId, setExtendingId] = useState(null);

  const animation = useRef(null);
  const blurAnim = useRef(null);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        setUserId(id);
      } catch (err) {}
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
    if (loading && resetPage) return;
    if (!userId) return;
    if (resetPage) {
      setLoading(true);
      setPage(0);
      setHasMore(true);
    }
    try {
      const pageToFetch = resetPage ? 0 : page;
      const resp = await getNeedsByCommunity(userId, pageToFetch, 10);
      if (resp && resp.data) {
        const needsData = resp.data.content || [];
        setNeeds(resetPage ? needsData : (prev) => [...prev, ...needsData]);
        const isLastPage = resp.data.last === true || needsData.length === 0;
        setHasMore(!isLastPage);
      } else {
        if (resetPage) setNeeds([]);
        setHasMore(false);
      }
    } catch (err) {
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
        const isLastPage = resp.data.last === true || needsData.length === 0;
        setHasMore(!isLastPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = () => fetchNeeds(true);

  const fetchMatchingServicesVM = async (needId) => {
    try {
      const resp = await checkForMatchingServices(userId, needId);
      setMatchingServices(resp.data || []);
    } catch (err) {
      setMatchingServices([]);
    }
  };

  const extendNeed = async (need, date) => {
    try {
      setExtendingId(need.id);
      const body = { extendedEndDate: date.toISOString() };
      await extendNeedEndDate(need.id, body);
      setNeeds(prev => prev.map(n => n.id === need.id ? { ...n, needDayEnd: date.toISOString() } : n));
      if (selectedNeed && selectedNeed.id === need.id) {
        setSelectedNeed(prev => ({ ...prev, needDayEnd: date.toISOString() }));
      }
    } catch (e) {}
    finally {
      setExtendingId(null);
    }
  };

  const archiveNeedVM = async (need) => {
    try {
      setArchivingId(need.id);
      await archiveNeed(need.id);
      setNeeds(prev => prev.map(n => n.id === need.id ? { ...n, isActive: false } : n));
    } catch (e) {}
    finally { setArchivingId(null); }
  };

  return {
    needs,
    loading,
    loadingMore,
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
    animation,
    blurAnim,
    fetchNeeds,
    loadMoreNeeds,
    onRefresh,
    fetchMatchingServicesVM,
    extendNeed,
    archiveNeedVM,
  };
}


