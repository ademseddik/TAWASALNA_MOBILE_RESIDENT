import Axios from 'axios';
import { APP_ENV } from '../utils/BaseUrl';

export const PostService = {
  async getProfilePostsWithPhotos(userId) {
    const response = await Axios.get(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getresidentpostsWithPhotos/${userId}`
    );
    return response.data;
  },

  async getImage(photoId) {
    const response = await Axios.get(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/images?fileUrl=${encodeURIComponent(photoId)}`,
      { responseType: 'arraybuffer' }
    );
    return response.data;
  },

  async getAllUserRelatedPosts(userId, page, pageSize) {
    const response = await Axios.get(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getAllUserRelatedPost/${userId}/${page}/${pageSize}`
    );
    return response.data;
  },

  async getAllComments(postId) {
    const response = await Axios.get(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getallcomments/${postId}`
    );
    return response.data;
  },

  async getAllCommentsPaged(postId, page = 0, size = 12) {
    const response = await Axios.get(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getallcommentspaged/${postId}/${page}/${size}`
    );
    return response.data;
  },

  async addComment(postId, userId, commentText, mentionedUserIds, token) {
    const response = await Axios.post(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/addcomment/${postId}/${userId}`,
      { commentText, mentionedUserIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async addReplyToComment(userId, commentId, postId, image, Name, replyText, token) {
    const response = await Axios.post(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/replytocomment/${userId}/${commentId}/${postId}`,
      { image, Name, replyText },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async getReplies(commentId) {
    const response = await Axios.get(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/getreplies/${commentId}`
    );
    return response.data;
  },

  async addReactionToPost(postId, userId, reactionType) {
    const response = await Axios.post(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/addReactionToPost/${postId}/${userId}/${reactionType}`,
      {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  },

  async addReactionToComment(commentId, userId, reactionType) {
    const response = await Axios.post(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/addReactionToComment/${commentId}/${userId}/${reactionType}`,
      {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  },

  async removeReactionFromComment(commentId, userId) {
    const response = await Axios.delete(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/removeReaction/${commentId}/${userId}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  },

  async editComment(commentId, userId, newText, token) {
    const response = await Axios.put(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/edit/${commentId}/${userId}`,
      { newText },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  async deleteComment(commentId, userId, postId, token) {
    const response = await Axios.delete(
      `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/delete/${commentId}/${userId}/${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};

// Add reaction to post
export async function addReactionToPost(postId, userId, reactionType) {
  const url = `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/addReactionToPost/${postId}/${userId}/${reactionType}`;
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to add reaction');
  
  // Check if response has content
  const responseText = await response.text();
  if (!responseText || responseText.trim() === '') {
    return { success: true }; // Return success for empty responses
  }
  
  try {
    const data = JSON.parse(responseText);
    return Array.isArray(data) ? data[0] : data; // Handle both array and object responses
  } catch (error) {
    console.log('Response is not JSON:', responseText);
    return { success: true }; // Return success for non-JSON responses
  }
}

// Remove reaction from post
export async function dislikePost(postId, userId) {
  const url = `${APP_ENV.SOCIAL_PORT}/tawasalna-community/residentprofile/dislikepost/${postId}/${userId}`;
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to remove reaction');
  
  // Check if response has content
  const responseText = await response.text();
  if (!responseText || responseText.trim() === '') {
    return { success: true }; // Return success for empty responses
  }
  
  try {
    const data = JSON.parse(responseText);
    return Array.isArray(data) ? data[0] : data; // Handle both array and object responses
  } catch (error) {
    console.log('Response is not JSON:', responseText);
    return { success: true }; // Return success for non-JSON responses
  }
} 