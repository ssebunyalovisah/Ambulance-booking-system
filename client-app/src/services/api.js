import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ambulance-booking-system-4ytj.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const getNearbyAmbulances = async (lat, lng, radius = 5) => {
    try {
        const response = await api.get('/public/ambulances/nearby', {
            params: { lat, lng, radius }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching nearby ambulances", error);
        throw error;
    }
};

export const createBooking = async (bookingData) => {
    try {
        const response = await api.post('/public/bookings', bookingData);
        return response.data;
    } catch (error) {
        console.error("Error creating booking", error);
        throw error;
    }
};

export const checkBookingStatus = async (bookingId) => {
    try {
        const response = await api.get(`/public/bookings/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error("Status check failed", error);
        throw error;
    }
};

export const initiatePayment = async (booking_id) => {
    try {
        const response = await api.post('/payments/initiate', { booking_id });
        return response.data;
    } catch (error) {
        console.error("Error initiating payment", error);
        throw error;
    }
};

export const getPaymentStatus = async (booking_id) => {
    try {
        const response = await api.get(`/payments/status/${booking_id}`);
        return response.data;
    } catch (error) {
        console.error("Error getting payment status", error);
        throw error;
    }
};

export default api;
