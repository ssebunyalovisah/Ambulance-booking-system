import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://ambulance-booking-system-4ytj.onrender.com/api');

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
export const login = async (driver_id, driver_name) => {
    try {
        const response = await api.post('/auth/login/driver', { driver_id, driver_name });
        return response.data;
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

export const refreshToken = async (token) => {
    try {
        const response = await api.post('/auth/refresh-token', { token });
        return response.data;
    } catch (error) {
        console.error("Token refresh failed", error);
        throw error;
    }
};

// Booking functions for driver
export const getDriverBookings = async () => {
    try {
        const response = await api.get('/bookings'); 
        return response.data;
    } catch (error) {
        console.error("Error fetching driver bookings", error);
        throw error;
    }
};

export const updateBookingStatus = async (bookingId, status) => {
    try {
        const response = await api.patch(`/bookings/${bookingId}/${status.toLowerCase()}`);
        return response.data;
    } catch (error) {
        console.error(`Error updating booking status to ${status}`, error);
        throw error;
    }
};

export const acceptBooking = (bookingId) => updateBookingStatus(bookingId, 'ACCEPT');
export const denyBooking = (bookingId) => updateBookingStatus(bookingId, 'DENY');
export const completeTrip = (bookingId) => updateBookingStatus(bookingId, 'COMPLETE');

export const updateDriverLocation = async (location) => {
    try {
        const response = await api.post('/location/driver', location);
        return response.data;
    } catch (error) {
        console.error("Error updating driver location", error);
        throw error;
    }
};