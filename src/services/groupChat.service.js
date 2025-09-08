import http from './http';
import { APP_ENV } from '../utils/BaseUrl';

export const GroupChatService = {
  async getGroupMessages(groupId, page = 0, size = 9) {
    const resp = await http.get(`${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/messages/${groupId}?page=${page}&size=${size}`);
    return resp.data;
  },

  async markAsSeen(groupId, userId) {
    try {
      const resp = await http.post(
        `${APP_ENV.SOCIAL_PORT}/tawasalna-community/group/mark-as-seen`,
        { groupId, userId }
      );
      return resp.data;
    } catch (e) {
      // Non-blocking: log and ignore errors to avoid impacting UX
      try { console.warn('markAsSeen failed', { groupId, userId, error: e?.message || e }); } catch {}
      return null;
    }
  }
};


