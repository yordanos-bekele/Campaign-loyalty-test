import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

export const generateQrToken = (hotelId) => axios.get(`${API_BASE}/qr-tokens/generate/${hotelId}`);

export const scanQr = (data) => axios.post(`${API_BASE}/scan`, data);

export const getDashboardStats = (hotelId) => axios.get(`${API_BASE}/dashboard/hotel/${hotelId}`);

export const getOverallStats = () => axios.get(`${API_BASE}/dashboard/overall`);