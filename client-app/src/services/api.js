import axios from 'axios';

const defaultApiUrl = import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://ambulance-booking-system-4ytj.onrender.com/api';
const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiUrl;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const getNearbyAmbulances = async (lat, lng, radius = 50) => {
    try {
        const response = await api.get('/location/ambulances/nearby', {
            params: { lat, lng, radius }
        });
        return { success: true, ambulances: response.data };
    } catch (error) {
        console.error("Error fetching nearby ambulances", error);
        throw error;
    }
};

export const createBooking = async (bookingData) => {
    try {
        const response = await api.post('/bookings', bookingData);
        return { ...response.data, booking_id: response.data.id }; // Adapter for old code expecting booking_id
    } catch (error) {
        console.error("Error creating booking", error);
        throw error;
    }
};

export const checkBookingStatus = async (bookingId) => {
    try {
        const response = await api.get(`/bookings/${bookingId}`);
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

export const cancelBooking = async (bookingId, reason = 'Patient cancelled the request') => {
    try {
        const response = await api.patch(`/bookings/${bookingId}/cancel`, {
            cancelled_by: 'client',
            reason,
        });
        return response.data;
    } catch (error) {
        console.error("Error cancelling booking", error);
        throw error;
    }
};

export default api;
