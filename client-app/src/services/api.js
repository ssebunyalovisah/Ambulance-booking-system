// client-app/src/services/api.js
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

export const getNearbyAmbulances = async () => {
  const response = await api.get('/location/ambulances/nearby');
  return response.data;
};

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const checkBookingStatus = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
};

export const cancelBooking = async (bookingId, reason = 'Patient cancelled the request') => {
  const response = await api.patch(`/bookings/${bookingId}/cancel`, {
    cancelled_by: 'client',
    cancel_reason: reason,
  });
  return response.data;
};

export const updatePatientLocation = async (bookingId, lat, lng) => {
  const response = await api.post('/location/patient', { booking_id: bookingId, lat, lng });
  return response.data;
};

export const getPaymentStatus = async (bookingId) => {
  const response = await api.get(`/payments/status/${bookingId}`);
  return response.data;
};

export default api;
