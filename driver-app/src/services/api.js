// driver-app/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const storedToken = localStorage.getItem('accessToken');
if (storedToken) {
  api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
}

// Interceptor: Add Token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
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
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => api.post('/auth/login/driver', data);
export const getMe = () => api.get('/auth/me');

// Trip Management
export const acceptBooking = (id) => api.patch(`/bookings/${id}/accept`);
export const dispatchBooking = (id) => api.patch(`/bookings/${id}/dispatch`);
export const arriveBooking = (id) => api.patch(`/bookings/${id}/arrive`);
export const completeTrip = (id) => api.patch(`/bookings/${id}/complete`);
export const denyBooking = (id) => api.patch(`/bookings/${id}/deny`);
export const timeoutBooking = (id) => api.patch(`/bookings/${id}/timeout`);
export const cancelTrip = (id, reason) => api.patch(`/bookings/${id}/cancel`, { cancel_reason: reason, cancelled_by: 'driver' });

// Reconciliation
export const getActiveBooking = (driverId) => api.get(`/bookings/active?driverId=${driverId}`);
export const getDriverBookings = (driverId) => api.get('/bookings', { params: driverId ? { driverId } : {} }).then(res => res.data);

// Location & Status
export const updateLocation = (data) => api.post('/location/driver', data);
export const updateDriverStatus = (status) => api.patch('/drivers/self/status', { status });

// Smart Login Helper
export const verifyDriverId = (driver_id) => api.get(`/drivers/verify/${driver_id}`);

export default api;