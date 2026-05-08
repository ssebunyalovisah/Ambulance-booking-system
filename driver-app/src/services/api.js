import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth functions
export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

export const refreshToken = async () => {
    try {
        const response = await api.post('/auth/refresh');
        return response.data;
    } catch (error) {
        console.error("Token refresh failed", error);
        throw error;
    }
};

// Booking functions for driver
export const getDriverBookings = async () => {
    try {
        const response = await api.get('/admin/bookings'); // Assuming driver can access their bookings
        return response.data;
    } catch (error) {
        console.error("Error fetching driver bookings", error);
        throw error;
    }
};

export const acceptBooking = async (bookingId) => {
    try {
        const response = await api.patch(`/admin/bookings/${bookingId}/accept`);
        return response.data;
    } catch (error) {
        console.error("Error accepting booking", error);
        throw error;
    }
};

export const denyBooking = async (bookingId) => {
    try {
        const response = await api.patch(`/admin/bookings/${bookingId}/deny`);
        return response.data;
    } catch (error) {
        console.error("Error denying booking", error);
        throw error;
    }
};

export const completeTrip = async (bookingId) => {
    try {
        const response = await api.patch(`/admin/bookings/${bookingId}/complete`);
        return response.data;
    } catch (error) {
        console.error("Error completing trip", error);
        throw error;
    }
};

export const updateDriverLocation = async (location) => {
    try {
        const response = await api.post('/location/driver', location);
        return response.data;
    } catch (error) {
        console.error("Error updating driver location", error);
        throw error;
    }
};