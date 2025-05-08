import Axios from 'axios';
import { APP_ENV } from '../utils/BaseUrl';
import AsyncStorage from "@react-native-async-storage/async-storage";



export const FollowService = {





  followUser: async (userIdToFollow) => {
    try {

        const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/followUser/${userId}/${userIdToFollow}`
      );
      return response.data;
    } catch (error) {
      console.error('Error following user:', error.response?.data || error.message);
      throw error;
    }
  },
  AcceptFollowRequest: async (userIdToAccept) => {
    try {

        const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/AcceptfollowUser/${userIdToAccept}/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error following user:', error.response?.data || error.message);
      throw error;
    }
  },
  unfollowUser: async (userIdToFollow) => {
    try {

        const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.delete(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/unfollowuser/${userId}/${userIdToFollow}`
      );
      return response.data;
    } catch (error) {
      console.error('Error following user:', error.response?.data || error.message);
      throw error;
    }
  },

  cancelFollowRequest: async (userIdToFollow) => {
    try {

        const userId = await AsyncStorage.getItem("userId");
      const response = await Axios.delete(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/CancelFollowRequest/${userId}/${userIdToFollow}`
      );
      return response.data;
    } catch (error) {
      console.error('Error following user:', error.response?.data || error.message);
      throw error;
    }
  },
};