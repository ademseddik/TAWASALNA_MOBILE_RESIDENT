import http from './http';
import { APP_ENV } from '../utils/BaseUrl';

const BASE_URL = APP_ENV.BUSINESS_PORT || '';

export const getArchivedServices = (shopId, page) => {
  return http.get(`${APP_ENV.BUSINESS_PORT}/service/get-by-owner/archived/${shopId}?page=${page}`);
};

export const getServiceById = (id) => {
  return http.get(`${APP_ENV.BUSINESS_PORT}/service/${id}`);
};

export const getServicesByShop = (shopId, page) => {
  return http.get(`${APP_ENV.BUSINESS_PORT}/service/get-by-owner/${shopId}?page=${page}`);
};

export const getServicesByCategory = (categoryId, page = 1) => {
  return http.get(`${APP_ENV.BUSINESS_PORT}/service/get-by-category/${categoryId}?page=${page}`);
};

export const createService = (body) => {
  return http.post(`${APP_ENV.BUSINESS_PORT}/service/create`, body);
};

export const updateService = (id, body) => {
  return http.put(`${APP_ENV.BUSINESS_PORT}/service/update-data-mobile/${id}`, body);
};

export const archiveService = (id) => {
  return http.patch(`${APP_ENV.BUSINESS_PORT}/service/archive/${id}`);
};

export const unarchiveService = (id) => {
  return http.patch(`${APP_ENV.BUSINESS_PORT}/service/unArchive/${id}`);
};

export const getAllServices = () => {
  return http.get(`${APP_ENV.BUSINESS_PORT}/service/all`);
};

export const getAllServiceCategories = () => {
  return http.get(`${APP_ENV.BUSINESS_PORT}/service-category/findAll`);
};

export const updateServiceAvailability = (serviceId, body) => {
  return http.put(`${APP_ENV.BUSINESS_PORT}/service/availabilityUpdate/${serviceId}`, body);
};

export const addServiceFeature = (serviceId, feature) => {
  return http.post(`${APP_ENV.BUSINESS_PORT}/service/${serviceId}/add`, feature);
};

export const archiveServiceFeature = (featureId, serviceId) => {
  return http.put(`${APP_ENV.BUSINESS_PORT}/service/disable?featureId=${featureId}&serviceId=${serviceId}`);
};

export const unarchiveServiceFeature = (featureId, serviceId) => {
  return http.put(`${APP_ENV.BUSINESS_PORT}/service/${featureId}/enable?serviceId=${serviceId}`);
};

// New function for getting services by community with filters
export const getServicesByCommunityWithFilters = (userId, filters, page, size) => {
  return http.post(`${APP_ENV.BUSINESS_PORT}/service/communityAndFilter/${userId}/${page}/${size}`, filters);
};

export const deleteService = (id) => {
  return http.delete(`${APP_ENV.BUSINESS_PORT}/service/delete/${id}`);
};

// Get services by IDs
export const getServicesByIds = (servicesIds) => {
  return http.post(`${APP_ENV.BUSINESS_PORT}/service/byids`, servicesIds);
};