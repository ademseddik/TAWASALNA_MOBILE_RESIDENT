import http from './http';
import { APP_ENV } from '../utils/BaseUrl';

export const ProfileService = {

  GetProfileData: async (credentials) => {
  
    try {
      const response = await http.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${credentials.userId}`,
        {
          headers: {
            Authorization: `Bearer ${credentials.token}`,
          },
        });
    
  
      return response.data;
    } catch (error) {
      throw error;
    }
  },
 
  Updateprivacy: async (credentials) => {
  
    try {
      const response = await http.put(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/updatePrivacy/${credentials.userId}/${credentials.privacy}`,
        credentials,
        {
          headers: {
            Authorization: `Bearer ${credentials.token}`,
          },
        });
    
  
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  GetProfilePhoto: async (userId) => {
    try {
      const response = await http.get(
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
      const response = await http.get(
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
      const response = await http.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  GetConnectedUserProfile: async (userId) => {
    try {
      const response = await http.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentprofile/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  GetUserPostsCount: async (userId) => {
    try {
      const response = await http.get(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentposts/${userId}/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  //////////////////////////////////CHANGE PASSWORD////////////////////////////////////////////////////////





};