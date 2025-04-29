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
 

  //////////////////////////////////CHANGE PASSWORD////////////////////////////////////////////////////////





};