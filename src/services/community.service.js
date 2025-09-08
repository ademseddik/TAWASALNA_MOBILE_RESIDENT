import http from './http';
import { APP_ENV } from '../utils/BaseUrl';

export const CommunityService = {
  getCommunities: async () => {
    return http.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/community/findAll`);
  },

  addUserToCommunity: async (communityId, userId, authToken) => {
    return http.put(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/community/${communityId}/userAdd/${userId}`,
      null,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
  }
};