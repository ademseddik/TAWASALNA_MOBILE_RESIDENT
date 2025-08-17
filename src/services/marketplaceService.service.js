import axios from 'axios';
import { APP_ENV } from '../utils/BaseUrl';

const BASE_URL = APP_ENV.BUSINESS_PORT || '';

export const getArchivedServices = (shopId, page) => {
  return axios.get(`${APP_ENV.BUSINESS_PORT}/service/get-by-owner/archived/${shopId}?page=${page}`);
};

export const getServiceById = (id) => {
  return axios.get(`${APP_ENV.BUSINESS_PORT}/service/${id}`);
};

export const getServicesByShop = (shopId, page) => {
  return axios.get(`${APP_ENV.BUSINESS_PORT}/service/get-by-owner/${shopId}?page=${page}`);
};

export const getServicesByCategory = (categoryId, page = 1) => {
  return axios.get(`${APP_ENV.BUSINESS_PORT}/service/get-by-category/${categoryId}?page=${page}`);
};

export const createService = (body) => {
  return axios.post(`${APP_ENV.BUSINESS_PORT}/service/create`, body);
};

export const updateService = (id, body) => {
  return axios.put(`${APP_ENV.BUSINESS_PORT}/service/update-data-mobile/${id}`, body);
};

export const archiveService = (id) => {
  return axios.patch(`${APP_ENV.BUSINESS_PORT}/service/archive/${id}`);
};

export const unarchiveService = (id) => {
  return axios.patch(`${APP_ENV.BUSINESS_PORT}/service/unArchive/${id}`);
};

export const getAllServices = () => {
  return axios.get(`${APP_ENV.BUSINESS_PORT}/service/all`);
};

export const getAllServiceCategories = () => {
  return axios.get(`${APP_ENV.BUSINESS_PORT}/service-category/findAll`);
};

export const updateServiceAvailability = (serviceId, body) => {
  return axios.put(`${APP_ENV.BUSINESS_PORT}/service/availabilityUpdate/${serviceId}`, body);
};

export const addServiceFeature = (serviceId, feature) => {
  return axios.post(`${APP_ENV.BUSINESS_PORT}/service/${serviceId}/add`, feature);
};

export const archiveServiceFeature = (featureId, serviceId) => {
  return axios.put(`${APP_ENV.BUSINESS_PORT}/service/disable?featureId=${featureId}&serviceId=${serviceId}`);
};

export const unarchiveServiceFeature = (featureId, serviceId) => {
  return axios.put(`${APP_ENV.BUSINESS_PORT}/service/${featureId}/enable?serviceId=${serviceId}`);
};

// New function for getting services by community with filters
export const getServicesByCommunityWithFilters = (userId, filters, page, size) => {
  return axios.post(`${APP_ENV.BUSINESS_PORT}/service/communityAndFilter/${userId}/${page}/${size}`, filters);
};

export const deleteService = (id) => {
  return axios.delete(`${APP_ENV.BUSINESS_PORT}/service/delete/${id}`);
};

// Get services by IDs
export const getServicesByIds = (servicesIds) => {
  return axios.post(`${APP_ENV.BUSINESS_PORT}/service/byids`, servicesIds);
}; 