import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
});

export function getReadableError(error, fallbackMessage) {
  if (typeof error?.response?.data === 'string') {
    return error.response.data;
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackMessage;
}

export async function createHotel(data) {
  const response = await apiClient.post('/hotels', data);
  return response.data;
}

export async function importHotels(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/hotels/import', formData);
  return response.data;
}

export async function getHotel(hotelId) {
  const response = await apiClient.get(`/hotels/${hotelId}`);
  return response.data;
}

export async function generateQrToken(hotelId) {
  const response = await apiClient.post(`/qr-tokens/generate/${hotelId}`);
  return response.data;
}

export async function scanQr(data) {
  const response = await apiClient.post('/scan', data);
  return response.data;
}

export async function getHotelStats(hotelId) {
  const response = await apiClient.get(`/dashboard/hotel/${hotelId}`);
  return response.data;
}

export async function getOverallStats() {
  const response = await apiClient.get('/dashboard/overall');
  return response.data;
}

export async function hotelLogin(data) {
  const response = await apiClient.post('/auth/hotel/login', data);
  return response.data;
}

export async function adminLogin(data) {
  const response = await apiClient.post('/admin/login', data);
  return response.data;
}

export async function getSessionUser() {
  const response = await apiClient.get('/auth/me');
  return response.status === 204 ? null : response.data;
}

export async function logout() {
  await apiClient.post('/auth/logout');
}

export async function registerLoyalCustomer(data) {
  const response = await apiClient.post('/customers/register', data);
  return response.data;
}

export async function getCurrentCustomer() {
  const response = await apiClient.get('/customers/me');
  return response.status === 204 ? null : response.data;
}

export async function getRegisteredCustomers() {
  const response = await apiClient.get('/customers');
  return response.data;
}

export async function importCustomers(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/customers/import', formData);
  return response.data;
}

export async function getCurrentHotelStats() {
  const response = await apiClient.get('/dashboard/hotel/me');
  return response.data;
}

export async function getAdminDashboard() {
  const response = await apiClient.get('/dashboard/admin');
  return response.data;
}
