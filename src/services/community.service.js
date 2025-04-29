import Axios from 'axios';
import { APP_ENV } from '../utils/BaseUrl';

export const CommunityService = {
  getCommunities: async () => {
    return Axios.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/community/findAll`);
  },

  addUserToCommunity: async (communityId, userId, authToken) => {
    return Axios.put(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/community/${communityId}/userAdd/${userId}`,
      null,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
  }
};