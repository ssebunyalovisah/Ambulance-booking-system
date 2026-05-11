// client-admin/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: Add Token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Handle Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { token: refreshToken });
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          api.defaults.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginAdmin = (data) => api.post('/auth/login/admin', data);
export const signupAdmin = (data) => api.post('/auth/signup', data);
export const getMe = () => api.get('/auth/me');

// Bookings
export const getBookings = () => api.get('/bookings');
export const getBooking = (id) => api.get(`/bookings/${id}`);
export const reassignBooking = (id, data) => api.patch(`/bookings/${id}/reassign`, data);
export const cancelBooking = (id, data) => api.patch(`/bookings/${id}/cancel`, data);

// Fleet
export const getAmbulances = () => api.get('/ambulances');
export const registerAmbulance = (data) => api.post('/ambulances', data);
export const updateAmbulance = (id, data) => api.patch(`/ambulances/${id}`, data);
export const deleteAmbulance = (id) => api.delete(`/ambulances/${id}`);

export const getDrivers = () => api.get('/drivers');
export const createDriver = (data) => api.post('/drivers', data);
export const updateDriver = (id, data) => api.patch(`/drivers/${id}`, data);

// Payments
export const getPayments = () => api.get('/payments');
export const confirmPayment = (id, status) => api.patch(`/payments/${id}/confirm`, { status });

// Reports
export const getReports = (params) => api.get('/reports', { params });

// Verify Driver ID (for smart lookup in driver management)
export const verifyDriverId = (id) => api.get(`/drivers/verify/${id}`);

export default api;
