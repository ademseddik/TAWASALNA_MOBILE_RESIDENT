import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from '../../utils/BaseUrl';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, thunkAPI) => {
    try {
      const userId = await AsyncStorage.getItem('userId');

      // Follow Requests
      const followRes = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`);
      const followRequests = followRes.data.followrequests || [];

      const followUserData = await Promise.all(followRequests.map(async (followerId) => {
        try {
          const userRes = await Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${followerId}`);
          return {
            id: `follow_${followerId}`,
            type: 'follow',
            userId: followerId,
            fullName: userRes.data.fullName,
            bio: userRes.data.bio,
            image: userRes.data.profilephoto || 'https://placeholder.com/avatar'
          };
        } catch (error) {
          console.error(`Error fetching user ${followerId}:`, error);
          return null;
        }
      }));

      // Group Invitations
      const groupRes = await fetch(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/group`);
      const groupData = await groupRes.json();
      const groupInvitations = groupData.filter(group =>
        group.invitedUsers?.some(user => user.id === userId)
      ).map(group => ({
        id: `${group.id}`,
        type: 'group',
        groupId: group.id,
        name: group.name,
        description: group.description || 'No description available',
        image: group.groupphoto || 'https://placeholder.com/avatar'
      }));

      return [...followUserData.filter(Boolean), ...groupInvitations];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    removeNotification: (state, action) => {
      state.items = state.items.filter(n =>
        n.userId !== action.payload && n.groupId !== action.payload
      );
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchNotifications.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { removeNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
