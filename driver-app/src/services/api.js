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
export const denyBooking   = (bookingId) => updateBookingStatus(bookingId, 'DENY');
export const completeTrip  = (bookingId) => updateBookingStatus(bookingId, 'COMPLETE');

// Distinct timeout — keeps timed_out status separate from deny in DB
export const timeoutBooking = async (bookingId) => {
    try {
        const response = await api.patch(`/bookings/${bookingId}/timeout`);
        return response.data;
    } catch (error) {
        console.error('Error setting timed_out status', error);
        throw error;
    }
};

// Driver cancels a trip — must send cancelled_by and cancel_reason (v3 spec)
export const cancelTrip = async (bookingId, cancelReason) => {
    try {
        const response = await api.patch(`/bookings/${bookingId}/cancel`, {
            cancelled_by: 'driver',
            reason: cancelReason,
        });
        return response.data;
    } catch (error) {
        console.error('Error cancelling trip', error);
        throw error;
    }
};

// Fetch active booking on reconnect — Driver App state reconciliation (v3 spec)
export const getActiveBooking = async (driverDbId) => {
    try {
        const response = await api.get(`/bookings/active?driverId=${driverDbId}`);
        return response.data; // null if no active trip
    } catch (error) {
        console.error('Error fetching active booking', error);
        return null;
    }
};


// Fetch logged-in driver's own profile
export const getMe = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch profile', error);
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

export const updateDriverStatus = async (status) => {
    try {
        const response = await api.patch('/drivers/self/status', { status });
        return response.data;
    } catch (error) {
        console.error("Error updating driver status", error);
        throw error;
    }
};

export const verifyDriverId = async (driver_id) => {
    try {
        const response = await api.get(`/drivers/verify/${driver_id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};