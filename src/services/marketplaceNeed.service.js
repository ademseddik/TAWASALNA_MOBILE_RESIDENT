import axios from 'axios';
import { APP_ENV } from '../utils/BaseUrl';

const BASE_URL = APP_ENV.BUSINESS_PORT || '';

export const getNeedsPaged = (pageNo, businessId) => {
  return axios.get(`${BASE_URL}/need/paged/${businessId}?page=${pageNo}`);
};

export const checkForMatchingServices = (businessId, needId) => {
  return axios.get(`${BASE_URL}/need/get-matching-services/${needId}/${businessId}`);
};

export const createNeed = (body) => {
  return axios.post(`${BASE_URL}/need/create`, body);
};



export const deleteNeed = (id) => {
  return axios.delete(`${BASE_URL}/need/delete/${id}`);
};

export const getAllNeeds = () => {
  return axios.get(`${BASE_URL}/need/all`);
}; 

// New community-based endpoints
export const getNeedsByCommunity = (userId, page, size) => {
  return axios.get(`${BASE_URL}/need/community/${userId}/${page}/${size}`);
};

export const getNeedsByUser = (userId, page, size) => {
  return axios.get(`${BASE_URL}/need/user/${userId}/${page}/${size}`);
};

export const addNeed = (needData) => {
  return axios.post(`${BASE_URL}/need/add`, needData);
};

// Get needs by IDs
export const getNeedsByIds = (needsId) => {
  return axios.post(`${BASE_URL}/need/byids`, needsId);
};

// Archive/Unarchive/Extend actions
export const archiveNeed = (needId) => {
  return axios.patch(`${BASE_URL}/need/archiveNeed/${needId}`, {});
};

export const unArchiveNeed = (needId, body) => {
  return axios.patch(`${BASE_URL}/need/unArchiveNeed/${needId}`, body);
};

export const extendNeedEndDate = (needId, body) => {
  // Note: Endpoint name is as provided by backend: 'extaindEndDate'
  return axios.patch(`${BASE_URL}/need/extaindEndDate/${needId}`, body);
};
export const updateNeed = (needId, body) => {
 
  return axios.patch(`${BASE_URL}/need/updateNeed/${needId}`, body);
};

