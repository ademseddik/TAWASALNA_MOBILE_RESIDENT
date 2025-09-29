import http from './http';
import { APP_ENV } from '../utils/BaseUrl';

const BASE_URL = APP_ENV.BUSINESS_PORT || '';

export const getNeedsPaged = (pageNo, businessId) => {
  return http.get(`${BASE_URL}/need/paged/${businessId}?page=${pageNo}`);
};

export const checkForMatchingServices = (businessId, needId) => {
  return http.get(`${BASE_URL}/need/get-matching-services/${needId}/${businessId}`);
};

export const createNeed = (body) => {
  return http.post(`${BASE_URL}/need/create`, body);
};



export const deleteNeed = (id) => {
  return http.delete(`${BASE_URL}/need/delete/${id}`);
};

export const getAllNeeds = () => {
  return http.get(`${BASE_URL}/need/all`);
}; 

// New community-based endpoints
export const getNeedsByCommunity = (userId, page, size, searchWord = '') => {
  const params = searchWord ? `?searchWord=${encodeURIComponent(searchWord)}` : '';
  return http.get(`${BASE_URL}/need/community/${userId}/${page}/${size}${params}`);
};

export const getNeedsByUser = (userId, page, size) => {
  return http.get(`${BASE_URL}/need/user/${userId}/${page}/${size}`);
};

export const addNeed = (needData) => {
  return http.post(`${BASE_URL}/need/addneeds`, needData);
};

// Get needs by IDs
export const getNeedsByIds = (needsId) => {
  return http.post(`${BASE_URL}/need/byids`, needsId);
};

// Archive/Unarchive/Extend actions
export const archiveNeed = (needId) => {
  return http.patch(`${BASE_URL}/need/archiveNeed/${needId}`, {});
};

export const unArchiveNeed = (needId, body) => {
  return http.patch(`${BASE_URL}/need/unArchiveNeed/${needId}`, body);
};

export const extendNeedEndDate = (needId, body) => {
  // Note: Endpoint name is as provided by backend: 'extaindEndDate'
  return http.patch(`${BASE_URL}/need/extaindEndDate/${needId}`, body);
};
export const updateNeed = (needId, body) => {
 
  return http.patch(`${BASE_URL}/need/updateNeed/${needId}`, body);
};

