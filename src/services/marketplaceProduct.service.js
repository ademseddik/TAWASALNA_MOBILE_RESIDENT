import http from './http';
import { APP_ENV } from '../utils/BaseUrl';

const BASE_URL = APP_ENV.BUSINESS_PORT || '';

export const getArchivedProducts = (shopId, page) => {
  return http.get(`${BASE_URL}/products/get-by-shop-archived/${shopId}?page=${page}`);
};

export const getProductById = (id) => {
  return http.get(`${BASE_URL}/products/findOne/${id}`);
};

export const getProductsByShop = (shopId, page) => {
  return http.get(`${BASE_URL}/products/get-by-shop/${shopId}?page=${page}`);
};

export const getProductsByCategory = (categoryId, page = 1) => {
  return http.get(`${APP_ENV.BUSINESS_PORT}/products/category/${categoryId}?page=${page}`);
};

export const publishProduct = (body) => {
  return http.post(`${BASE_URL}/products/publishResident`, body);
};

export const updateProduct = (id, body) => {
  return http.put(`${BASE_URL}/products/update/${id}`, body);
};

export const archiveProduct = (id) => {
  return http.patch(`${BASE_URL}/products/archive/${id}`);
};

export const unarchiveProduct = (id) => {
  return http.patch(`${BASE_URL}/products/unarchive/${id}`);
};

export const getAllProducts = () => {
   
  return http.get(`${APP_ENV.BUSINESS_PORT}/products/all`);
}; 

export const getAllProductCategories = () => {
  return http.get(`${APP_ENV.BUSINESS_PORT}/product-categories/`);
};

// AI search endpoint: posts user natural language query and returns matching products
export const aiSearchProducts = (message) => {
  return http.post(`${APP_ENV.BUSINESS_PORT}/products/ai/test`, { message });
};

// Product status management endpoints
export const markProductAsSold = (productId) => {
  return http.patch(`${APP_ENV.BUSINESS_PORT}/products/markSold/${productId}`);
};

export const markProductAsAvailable = (productId) => {
  return http.patch(`${APP_ENV.BUSINESS_PORT}/products/markAvalable/${productId}`);
};

export const getAllCommunityProducts = (userId, page = 0, size = 10) => {
  // The new endpoint is also likely 0-indexed for pages
  return http.get(`${APP_ENV.BUSINESS_PORT}/products/community/${userId}/${page}/${size}`);
};

export const getProductsByCommunityWithFilters = (userId, filters, page, size) => {
  return http.post(`${APP_ENV.BUSINESS_PORT}/products/community/${userId}/${page}/${size}`, filters);
};

export const getUserProducts = (userId, page = 0, size = 10) => {
  return http.get(`${APP_ENV.BUSINESS_PORT}/products/user/${userId}/${page}/${size}`);
};

export const deleteProduct = (productId) => {
  return http.delete(`${APP_ENV.BUSINESS_PORT}/products/delete/${productId}`);
};

// Get products by IDs
export const getProductsByIds = (productIds) => {
  return http.post(`${APP_ENV.BUSINESS_PORT}/products/byids`, productIds);
};

export const updateProductForResident = (productId, formData, token) => {
  return http.put(`${APP_ENV.BUSINESS_PORT}/products/updateResidentProduct/${productId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`,
    },
  });
};

// Alternative method that sends data as JSON (for debugging)
export const updateProductForResidentJSON = (productId, data, token) => {
  return http.put(`${APP_ENV.BUSINESS_PORT}/products/updateResidentProduct/${productId}`, data, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
};