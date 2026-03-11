import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getNearbyAmbulances = async (lat, lng, radius = 5) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/public/ambulances/nearby`, {
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
        const response = await axios.post(`${API_BASE_URL}/public/bookings`, bookingData);
        return response.data;
    } catch (error) {
        console.error("Error creating booking", error);
        throw error;
    }
};

export const checkBookingStatus = async (bookingId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/public/bookings/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error("Status check failed", error);
        throw error;
    }
};
