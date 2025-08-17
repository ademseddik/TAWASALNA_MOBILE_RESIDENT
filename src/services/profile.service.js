import Axios from 'axios';
import { APP_ENV } from '../utils/BaseUrl';

export const ProfileService = {

  GetProfileData: async (credentials) => {
  
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${credentials.userId}`,
        credentials,
        {
          headers: {
            Authorization: `Bearer ${credentials.token}`, // Include token in headers
          },
        });
    
  
      return response.data;
    } catch (error) {
      throw error;
    }
  },
 
  Updateprivacy: async (credentials) => {
  
    try {
      const response = await Axios.put(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/updatePrivacy/${credentials.userId}/${credentials.privacy}`,
        credentials,
        {
          headers: {
            Authorization: `Bearer ${credentials.token}`, // Include token in headers
          },
        });
    
  
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  GetProfilePhoto: async (userId) => {
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getprofilephoto/${userId}`,
        { responseType: 'arraybuffer' }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  GetCoverPhoto: async (userId) => {
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getcoverphoto/${userId}`,
        { responseType: 'arraybuffer' }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  GetUserProfileById: async (userId) => {
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  GetConnectedUserProfile: async (userId) => {
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  GetUserPostsCount: async (userId) => {
    try {
      const response = await Axios.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentposts/${userId}/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  //////////////////////////////////CHANGE PASSWORD////////////////////////////////////////////////////////





};